importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
    apiKey: 'AIzaSyAp11YHROEzyH_KmIti6KxDbytqgdENp1I',
    authDomain: 'mi-iglesia-6ce84.firebaseapp.com',
    projectId: 'mi-iglesia-6ce84',
    storageBucket: 'mi-iglesia-6ce84.firebasestorage.app',
    messagingSenderId: '833691546185',
    appId: '1:833691546185:web:170f390466a4fd71ea0598',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {}
    self.registration.showNotification(title || 'ChurchAttend', {
        body: body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
    })
})
