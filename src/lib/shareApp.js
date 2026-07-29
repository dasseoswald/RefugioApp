// Comparte el link de la app usando el panel nativo del dispositivo si está
// disponible; si no, lo copia al portapapeles, y como último recurso lo
// muestra en un prompt para copiarlo a mano.
export async function shareApp() {
    const appUrl = window.location.origin
    const shareData = {
        title: 'Refugio App',
        text: 'Únete a Refugio App, la app de nuestra iglesia',
        url: appUrl,
    }

    if (navigator.share) {
        try {
            await navigator.share(shareData)
            return { shared: true }
        } catch {
            return { shared: false }
        }
    }

    try {
        await navigator.clipboard.writeText(appUrl)
        return { copied: true }
    } catch {
        window.prompt('Copia este link para compartirlo:', appUrl)
        return { copied: false }
    }
}
