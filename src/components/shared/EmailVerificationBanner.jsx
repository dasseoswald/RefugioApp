import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { MailCheck } from 'lucide-react'

export default function EmailVerificationBanner() {
    const { isEmailUnverified, resendVerificationEmail, refreshEmailVerified } = useAuth()
    const [sent, setSent] = useState(false)
    const [checking, setChecking] = useState(false)
    const [checkMessage, setCheckMessage] = useState('')

    if (!isEmailUnverified) return null

    const handleResend = async () => {
        setSent(true)
        setCheckMessage('')
        await resendVerificationEmail()
        setTimeout(() => setSent(false), 6000)
    }

    // Antes, si seguía sin estar verificado (o si reload() fallaba) no se
    // mostraba ningún mensaje — quedaba pareciendo que el botón no hacía
    // nada, cuando en realidad sí revisaba pero no había cambiado nada.
    const handleCheck = async () => {
        setChecking(true)
        setCheckMessage('')
        const result = await refreshEmailVerified()
        setChecking(false)
        if (result.error) {
            setCheckMessage(result.error)
        } else if (!result.data) {
            setCheckMessage('Todavía no detectamos la confirmación. Asegúrate de haber tocado el enlace del correo y prueba de nuevo en unos segundos.')
        }
    }

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2.5 bg-[#FFF3CD] text-[#8A6116] text-sm px-4 py-3 rounded-xl flex-wrap">
                <MailCheck className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 min-w-[220px]">
                    Te enviamos un correo para confirmar tu cuenta — revisa tu bandeja de entrada (y spam) y toca el enlace.
                </span>
                <button onClick={handleCheck} disabled={checking} className="text-xs font-semibold underline cursor-pointer whitespace-nowrap disabled:opacity-60">
                    {checking ? 'Revisando...' : 'Ya lo confirmé'}
                </button>
                <button onClick={handleResend} disabled={sent} className="text-xs font-semibold underline cursor-pointer whitespace-nowrap disabled:opacity-60">
                    {sent ? 'Correo reenviado' : 'Reenviar correo'}
                </button>
            </div>
            {checkMessage && (
                <p className="text-xs text-[#8A6116] px-4 pt-1.5">{checkMessage}</p>
            )}
        </div>
    )
}
