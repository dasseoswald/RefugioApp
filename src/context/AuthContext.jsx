import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile as updateFirebaseProfile,
    linkWithCredential,
    reauthenticateWithCredential,
    sendEmailVerification,
    EmailAuthProvider,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase.js'
import { updateUserProfile, createOrGetUserForFirebaseAccount, coreDataReadyPromise, startCoreDataSync, updateLastSeen } from '../data/mockData.js'

const HEARTBEAT_INTERVAL_MS = 60 * 1000

const AuthContext = createContext(null)

// Nombre elegido en el formulario de registro, a la espera de que
// onAuthStateChanged (única fuente de verdad para crear/vincular la cuenta)
// lo recoja. Evita crear el usuario dos veces en paralelo (registro +
// listener) cuando ambos intentan vincular la cuenta al mismo tiempo.
let pendingRegistrationName = null

const AUTH_ERROR_MESSAGES = {
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/weak-password': 'La contraseña es muy débil. Usa al menos 6 caracteres.',
    'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de continuar.',
    'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión e inténtalo de nuevo.',
    'auth/credential-already-in-use': 'Ese correo ya tiene una contraseña creada en otra cuenta.',
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [needsPassword, setNeedsPassword] = useState(false)
    const [emailVerified, setEmailVerified] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                startCoreDataSync()
                await coreDataReadyPromise
                const appUser = createOrGetUserForFirebaseAccount({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: pendingRegistrationName || firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                })
                pendingRegistrationName = null
                // Si entró con Google y todavía no tiene contraseña propia,
                // le ofrecemos crear una (útil cuando Google no funciona,
                // p. ej. dentro del navegador de WhatsApp/Instagram).
                setNeedsPassword(!firebaseUser.providerData.some(p => p.providerId === 'password'))
                // Con Google el correo ya viene verificado por Google mismo,
                // así que esto solo aplica de verdad a cuentas de correo y
                // contraseña sin confirmar todavía.
                setEmailVerified(firebaseUser.emailVerified)
                setUser(appUser)
            } else {
                setUser(null)
                setNeedsPassword(false)
                setEmailVerified(true)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [])

    useEffect(() => {
        if (!user) return
        updateLastSeen(user.id)
        const interval = setInterval(() => updateLastSeen(user.id), HEARTBEAT_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [user?.id])

    const login = useCallback(async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password)
            return { data: true }
        } catch (err) {
            return { error: AUTH_ERROR_MESSAGES[err.code] || 'No se pudo iniciar sesión. Inténtalo de nuevo.' }
        }
    }, [])

    const loginWithGoogle = useCallback(async () => {
        try {
            await signInWithPopup(auth, googleProvider)
            return { data: true }
        } catch (err) {
            return { error: AUTH_ERROR_MESSAGES[err.code] || 'No se pudo iniciar sesión con Google.' }
        }
    }, [])

    const register = useCallback(async (name, email, password) => {
        try {
            pendingRegistrationName = name
            const cred = await createUserWithEmailAndPassword(auth, email, password)
            await updateFirebaseProfile(cred.user, { displayName: name })
            // No bloquea el registro si el envío falla (p. ej. cuota de
            // Firebase agotada) — es solo un recordatorio, no un requisito.
            sendEmailVerification(cred.user).catch(err => console.error('No se pudo enviar el correo de verificación', err))
            // La creación/vinculación real del usuario la hace el listener
            // onAuthStateChanged (arriba), que ya recogerá `pendingRegistrationName`.
            return { data: true }
        } catch (err) {
            pendingRegistrationName = null
            return { error: AUTH_ERROR_MESSAGES[err.code] || 'No se pudo crear la cuenta. Inténtalo de nuevo.' }
        }
    }, [])

    // Reenvía el correo de verificación a la cuenta actualmente autenticada.
    const resendVerificationEmail = useCallback(async () => {
        try {
            if (!auth.currentUser) return { error: 'No hay usuario autenticado' }
            await sendEmailVerification(auth.currentUser)
            return { data: true }
        } catch (err) {
            return { error: AUTH_ERROR_MESSAGES[err.code] || 'No se pudo enviar el correo. Intenta de nuevo en unos minutos.' }
        }
    }, [])

    // Firebase no avisa solo cuando alguien confirma el correo en otra
    // pestaña — hay que recargar el usuario y volver a leer emailVerified.
    // Antes, si reload() fallaba (p. ej. sesión vencida) el error se tragaba
    // en silencio y el botón "Ya lo confirmé" no daba ninguna señal de que
    // algo había salido mal ni de que seguía sin estar verificado.
    const refreshEmailVerified = useCallback(async () => {
        if (!auth.currentUser) return { error: 'No hay sesión activa' }
        try {
            await auth.currentUser.reload()
            const verified = auth.currentUser.emailVerified
            setEmailVerified(verified)
            return { data: verified }
        } catch (err) {
            return { error: AUTH_ERROR_MESSAGES[err.code] || 'No se pudo comprobar el estado de tu correo. Intenta de nuevo.' }
        }
    }, [])

    const setAccountPassword = useCallback(async (password) => {
        try {
            const firebaseUser = auth.currentUser
            if (!firebaseUser?.email) return { error: 'No hay usuario autenticado' }
            const credential = EmailAuthProvider.credential(firebaseUser.email, password)
            await linkWithCredential(firebaseUser, credential)
            setNeedsPassword(false)
            return { data: true }
        } catch (err) {
            return { error: AUTH_ERROR_MESSAGES[err.code] || 'No se pudo crear la contraseña. Inténtalo de nuevo.' }
        }
    }, [])

    // Confirma la contraseña del usuario actualmente autenticado (no la del
    // usuario objetivo). Se usa para acciones sensibles, como que un admin
    // asigne el rol de Tesorero, antes de aplicar el cambio.
    const confirmPassword = useCallback(async (password) => {
        try {
            const firebaseUser = auth.currentUser
            if (!firebaseUser?.email) return { error: 'No hay usuario autenticado' }
            const credential = EmailAuthProvider.credential(firebaseUser.email, password)
            await reauthenticateWithCredential(firebaseUser, credential)
            return { data: true }
        } catch (err) {
            return { error: AUTH_ERROR_MESSAGES[err.code] || 'Contraseña incorrecta.' }
        }
    }, [])

    const logout = useCallback(async () => {
        await signOut(auth)
    }, [])

    const updateProfile = useCallback((data) => {
        if (!user) return { error: 'No hay usuario autenticado' }
        const updatedUser = updateUserProfile(user.id, data)
        if (!updatedUser) return { error: 'Error al actualizar perfil' }
        setUser(updatedUser)
        return { data: updatedUser }
    }, [user])

    const value = {
        user, loading, login, loginWithGoogle, register, logout, updateProfile,
        needsPassword, setAccountPassword, confirmPassword, isAuthenticated: !!user,
        isEmailUnverified: !!user && !emailVerified,
        resendVerificationEmail, refreshEmailVerified,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider')
    }
    return context
}
