import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { app } from '../firebase.js'
import { saveFcmToken } from '../data/mockData.js'

// Generar en: Firebase Console > Configuración del proyecto > Cloud Messaging
// > "Certificados push web" > Generar par de claves.
const VAPID_KEY = 'BC0XiGn-0ebklP7H5TrnzGHWoaNrvK5TeOf4DLz6P9SHQKOsnX13RBbzIjlY75mdW8aIoyj6ACHC7aerdNS6Vl4'

// Se registra una sola vez al arrancar la app (ver main.jsx), tanto para
// habilitar la instalación como PWA como para tener el service worker listo
// antes de que el usuario decida activar las notificaciones.
export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return Promise.resolve(null)
    return navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(err => {
        console.error('No se pudo registrar el service worker', err)
        return null
    })
}

export async function enablePushNotifications(userId) {
    if (!('Notification' in window) || !(await isSupported().catch(() => false))) {
        return { error: 'Este navegador no soporta notificaciones push' }
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
        return { error: 'Debes permitir las notificaciones en tu navegador' }
    }

    try {
        const registration = await registerServiceWorker() || await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        const messaging = getMessaging(app)
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
        if (!token) return { error: 'No se pudo generar el token de notificaciones' }
        saveFcmToken(userId, token)
        return { data: token }
    } catch (err) {
        console.error('Error activando notificaciones push', err)
        return { error: 'No se pudieron activar las notificaciones' }
    }
}

export function getNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission
}
