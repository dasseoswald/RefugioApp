import { AlertTriangle } from 'lucide-react'
import { isInAppBrowser } from '../../lib/installPrompt.js'

export default function InAppBrowserBanner() {
    if (!isInAppBrowser()) return null

    return (
        <div className="flex items-start gap-2.5 bg-[#FFF3CD] text-[#8A6116] text-sm px-4 py-3 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>
                Estás dentro de otra app (WhatsApp, Instagram, etc). Google no permite iniciar sesión aquí.
                Toca <strong>•••</strong> o el ícono de compartir arriba y elige <strong>"Abrir en Safari"</strong> (o en tu navegador normal).
            </span>
        </div>
    )
}
