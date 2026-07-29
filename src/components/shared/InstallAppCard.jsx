import { useState, useEffect } from 'react'
import { Download, Share, CheckCircle2 } from 'lucide-react'
import { getDeferredInstallPrompt, onInstallPromptAvailable, isStandaloneDisplay, isIOSDevice, isInAppBrowser } from '../../lib/installPrompt.js'

export default function InstallAppCard() {
    const [installPrompt, setInstallPrompt] = useState(getDeferredInstallPrompt())
    const [installed, setInstalled] = useState(isStandaloneDisplay())

    useEffect(() => {
        const unsubscribe = onInstallPromptAvailable(setInstallPrompt)
        const onInstalled = () => setInstalled(true)
        window.addEventListener('appinstalled', onInstalled)
        return () => {
            unsubscribe()
            window.removeEventListener('appinstalled', onInstalled)
        }
    }, [])

    if (installed) {
        return (
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#13CD68] flex-shrink-0" />
                <div>
                    <h3 className="text-base font-semibold text-[#111111]">Refugio App instalada</h3>
                    <p className="text-xs text-[#6E6E6E] mt-0.5">Ya la tienes en tu pantalla de inicio</p>
                </div>
            </div>
        )
    }

    const iosInApp = isIOSDevice() && isInAppBrowser()

    const handleInstall = async () => {
        if (!installPrompt) return
        installPrompt.prompt()
        await installPrompt.userChoice
        setInstallPrompt(null)
    }

    const description = iosInApp
        ? 'Abre este link en Safari (toca ••• arriba y elige "Abrir en Safari") para poder instalarla'
        : isIOSDevice()
            ? 'Toca el botón Compartir de Safari y luego "Agregar a pantalla de inicio"'
            : installPrompt
                ? 'Accede más rápido, como una app normal'
                : 'Usa el menú de tu navegador (⋮ o •••) para instalarla en este dispositivo'

    return (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center flex-shrink-0">
                        {isIOSDevice() ? <Share className="w-5 h-5 text-white" /> : <Download className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[#111111]">Instalar la app</h3>
                        <p className="text-xs text-[#6E6E6E] mt-0.5">{description}</p>
                    </div>
                </div>
                {installPrompt && !iosInApp && (
                    <button
                        onClick={handleInstall}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer flex-shrink-0"
                        style={{ background: '#2696D2' }}
                    >
                        <Download className="w-4 h-4" /> Instalar
                    </button>
                )}
            </div>
        </div>
    )
}
