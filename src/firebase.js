import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: 'AIzaSyAp11YHROEzyH_KmIti6KxDbytqgdENp1I',
    authDomain: 'mi-iglesia-6ce84.firebaseapp.com',
    projectId: 'mi-iglesia-6ce84',
    storageBucket: 'mi-iglesia-6ce84.firebasestorage.app',
    messagingSenderId: '833691546185',
    appId: '1:833691546185:web:170f390466a4fd71ea0598',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// La sesión queda guardada en el dispositivo (no expira al cerrar la
// pestaña/app) hasta que la persona cierre sesión manualmente.
setPersistence(auth, browserLocalPersistence).catch(err => console.error('No se pudo configurar la persistencia de sesión', err))
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)
export { app, firebaseConfig }
