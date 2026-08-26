import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { MailCheck } from 'lucide-react'

export default function EmailVerificationBanner() {
    const { isEmailUnverified, resendVerificationEmail, refreshEmailVerified } = useAuth()
    const [sent, setSent] = useState(false)
    const [checking, setChecking] = useState(false)

    if (!isEmailUnverified) return null

    const handleResend = async () => {
        setSent(true)
        await resendVerificationEmail()
        setTimeout(() => setSent(false), 6000)
    }

    const handleCheck = async () => {
        setChecking(true)
        await refreshEmailVerified()
        setChecking(false)
    }

    return (
        <div className="flex items-center gap-2.5 bg-[#FFF3CD] text-[#8A6116] text-sm px-4 py-3 rounded-xl mb-6 flex-wrap">
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
    )
}
