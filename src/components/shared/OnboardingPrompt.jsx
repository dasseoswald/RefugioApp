import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import Modal from '../ui/Modal.jsx'
import { enablePushNotifications, getNotificationPermission } from '../../lib/push.js'
import { getDeferredInstallPrompt, onInstallPromptAvailable, isStandaloneDisplay, isIOSDevice, isInAppBrowser } from '../../lib/installPrompt.js'
import { Download, Bell, Share } from 'lucide-react'

const STORAGE_KEY = 'refugio_onboarding_done'

export default function OnboardingPrompt() {
    const { user } = useAuth()
    const [step, setStep] = useState(null)
    const [installPrompt, setInstallPrompt] = useState(null)
    const [enabling, setEnabling] = useState(false)

    useEffect(() => {
        if (!user || localStorage.getItem(STORAGE_KEY)) return

        if (isIOSDevice() && isInAppBrowser()) {
            setStep('open-in-safari')
            return
        }

        const existingPrompt = getDeferredInstallPrompt()
        setInstallPrompt(existingPrompt)
        const unsubscribe = onInstallPromptAvailable(setInstallPrompt)

        const canInstall = !isStandaloneDisplay() && (existingPrompt || isIOSDevice())
        const canNotify = getNotificationPermission() === 'default'

        if (canInstall) setStep('install')
        else if (canNotify) setStep('notifications')

        return unsubscribe
    }, [user])

    const finish = () => {
        localStorage.setItem(STORAGE_KEY, '1')
        setStep(null)
    }

    const goToNotificationsOrFinish = () => {
        if (getNotificationPermission() === 'default') setStep('notifications')
        else finish()
    }

    const handleInstall = async () => {
        if (installPrompt) {
            installPrompt.prompt()
            await installPrompt.userChoice
            setInstallPrompt(null)
        }
        goToNotificationsOrFinish()
    }

    const handleEnableNotifications = async () => {
        setEnabling(true)
        await enablePushNotifications(user.id)
        setEnabling(false)
        finish()
    }

    if (!step || !user) return null

    const titles = { install: 'Instalar Refugio App', notifications: 'Notificaciones', 'open-in-safari': 'Abre esto en Safari' }

    return (
        <Modal isOpen onClose={finish} title={titles[step]} size="sm">
            {step === 'open-in-safari' && (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#111111] flex items-center justify-center">
                        <Share className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-[#6E6E6E]">
                        Estás viendo esto dentro de otra app (WhatsApp, Instagram, etc). Para instalar Refugio App y activar notificaciones, toca <strong>•••</strong> o el ícono de compartir arriba y elige <strong>"Abrir en Safari"</strong>.
                    </p>
                    <button onClick={finish} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm cursor-pointer" style={{ background: '#2696D2' }}>Entendido</button>
                </div>
            )}
            {step === 'install' && (
                installPrompt ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#111111] flex items-center justify-center">
                            <Download className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-sm text-[#6E6E6E]">Instala Refugio App en tu pantalla de inicio para acceder más rápido, como una app normal.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={goToNotificationsOrFinish} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Ahora no</button>
                            <button onClick={handleInstall} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm cursor-pointer" style={{ background: '#2696D2' }}>Instalar</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#111111] flex items-center justify-center">
                            <Share className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-sm text-[#6E6E6E]">
                            Para instalarla: toca <strong>Compartir</strong> (el ícono del cuadrado con flecha hacia arriba) y luego <strong>"Agregar a pantalla de inicio"</strong>.
                        </p>
                        <button onClick={goToNotificationsOrFinish} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm cursor-pointer" style={{ background: '#2696D2' }}>Entendido</button>
                    </div>
                )
            )}
            {step === 'notifications' && (
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#111111] flex items-center justify-center">
                        <Bell className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-[#6E6E6E]">¿Quieres recibir notificaciones de avisos de tu grupo, aunque no tengas la app abierta?</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={finish} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Ahora no</button>
                        <button onClick={handleEnableNotifications} disabled={enabling} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm cursor-pointer disabled:opacity-60" style={{ background: '#2696D2' }}>
                            {enabling ? 'Activando...' : 'Activar'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    )
}
