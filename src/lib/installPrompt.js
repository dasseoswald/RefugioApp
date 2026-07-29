// Captura el evento beforeinstallprompt apenas el navegador lo dispare
// (Chrome/Edge/Android), sin importar si ya hay algún componente montado
// escuchando. Safari/iOS nunca dispara este evento — ahí la instalación es
// siempre manual ("Compartir" > "Agregar a pantalla de inicio").
let deferredPrompt = null
const listeners = new Set()

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    listeners.forEach(cb => cb(event))
})

window.addEventListener('appinstalled', () => {
    deferredPrompt = null
})

export function getDeferredInstallPrompt() {
    return deferredPrompt
}

export function onInstallPromptAvailable(callback) {
    listeners.add(callback)
    return () => listeners.delete(callback)
}

export function isStandaloneDisplay() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function isIOSDevice() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}
