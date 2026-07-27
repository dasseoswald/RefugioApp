import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { app } from '../firebase.js'
import { saveFcmToken } from '../data/mockData.js'

// Generar en: Firebase Console > Configuración del proyecto > Cloud Messaging
// > "Certificados push web" > Generar par de claves.
const VAPID_KEY = 'PEGA_AQUI_TU_VAPID_KEY'

export async function enablePushNotifications(userId) {
    if (!('Notification' in window) || !(await isSupported().catch(() => false))) {
        return { error: 'Este navegador no soporta notificaciones push' }
    }
    if (VAPID_KEY === 'PEGA_AQUI_TU_VAPID_KEY') {
        return { error: 'Falta configurar la clave VAPID en src/lib/push.js' }
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
        return { error: 'Debes permitir las notificaciones en tu navegador' }
    }

    try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
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
