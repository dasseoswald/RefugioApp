import { useState } from 'react'
import { Share2, Facebook, Instagram, Check } from 'lucide-react'

const INSTAGRAM_URL = 'https://www.instagram.com/unrefugioparalafamilia/'
const FACEBOOK_URL = 'https://www.facebook.com/unrefugioparalafamilia'

export default function ShareAppCard() {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const appUrl = window.location.origin
        const shareData = {
            title: 'Refugio App',
            text: 'Únete a Refugio App, la app de nuestra iglesia',
            url: appUrl,
        }
        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch {
                // El usuario canceló el cuadro de compartir, no hay nada que hacer.
            }
            return
        }
        try {
            await navigator.clipboard.writeText(appUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Último recurso si el portapapeles también falla: mostrar el
            // link para copiarlo a mano, en vez de fallar en silencio.
            window.prompt('Copia este link para compartirlo:', appUrl)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 space-y-4">
            <div>
                <h3 className="text-base font-semibold text-[#111111]">Compartir e Invitar</h3>
                <p className="text-xs text-[#6E6E6E] mt-0.5">Invita a los hermanos a usar Refugio App y síguenos en redes</p>
            </div>

            <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium text-sm cursor-pointer transition-all hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}
            >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Link copiado' : 'Compartir Refugio App'}
            </button>

            <div className="grid grid-cols-2 gap-3">
                <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm font-medium text-[#111111] hover:bg-gray-50 transition-all"
                >
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    Facebook
                </a>
                <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-100 text-sm font-medium text-[#111111] hover:bg-gray-50 transition-all"
                >
                    <Instagram className="w-4 h-4 text-[#E1306C]" />
                    Síguenos en Instagram
                </a>
            </div>
        </div>
    )
}
