import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile as updateFirebaseProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase.js'
import { updateUserProfile, createOrGetUserForFirebaseAccount, coreDataReadyPromise, startCoreDataSync } from '../data/mockData.js'

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
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                startCoreDataSync()
                await coreDataReadyPromise
                const appUser = createOrGetUserForFirebaseAccount({
                    email: firebaseUser.email,
                    displayName: pendingRegistrationName || firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                })
                pendingRegistrationName = null
                setUser(appUser)
            } else {
                setUser(null)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [])

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
            // La creación/vinculación real del usuario la hace el listener
            // onAuthStateChanged (arriba), que ya recogerá `pendingRegistrationName`.
            return { data: true }
        } catch (err) {
            pendingRegistrationName = null
            return { error: AUTH_ERROR_MESSAGES[err.code] || 'No se pudo crear la cuenta. Inténtalo de nuevo.' }
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

    const value = { user, loading, login, loginWithGoogle, register, logout, updateProfile, isAuthenticated: !!user }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider')
    }
    return context
}
