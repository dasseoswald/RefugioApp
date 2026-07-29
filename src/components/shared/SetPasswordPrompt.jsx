import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import Modal from '../ui/Modal.jsx'
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react'

export const PASSWORD_PROMPT_SEEN_KEY = 'refugio_password_prompt_seen'

export default function SetPasswordPrompt() {
    const { needsPassword, setAccountPassword } = useAuth()
    const [visible, setVisible] = useState(false)
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (needsPassword && !localStorage.getItem(PASSWORD_PROMPT_SEEN_KEY)) setVisible(true)
    }, [needsPassword])

    if (!visible) return null

    const dismiss = () => {
        localStorage.setItem(PASSWORD_PROMPT_SEEN_KEY, '1')
        setVisible(false)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
        if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }

        setSaving(true)
        const result = await setAccountPassword(password)
        setSaving(false)
        if (result.error) {
            setError(result.error)
            return
        }
        localStorage.setItem(PASSWORD_PROMPT_SEEN_KEY, '1')
        setDone(true)
        setTimeout(() => setVisible(false), 2500)
    }

    return (
        <Modal isOpen onClose={dismiss} title="Crear una contraseña" size="sm">
            {done ? (
                <div className="text-center space-y-3 py-2">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-[#13CD68]" />
                    <p className="text-sm text-[#111111] font-medium">¡Listo! Ya puedes iniciar sesión con tu correo y esta contraseña, sin depender de Google.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-start gap-2.5 bg-[#E8F4FC] text-[#111111] text-sm px-4 py-3 rounded-xl">
                        <KeyRound className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#2696D2]" />
                        <span>Entraste con Google. Crea una contraseña para poder iniciar sesión también con tu correo — útil si alguna vez Google no funciona (por ejemplo, dentro de WhatsApp o Instagram).</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Nueva contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Confirmar contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
                            <input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Repite tu contraseña"
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-[#FADBD8] text-[#E74C3C] text-sm px-4 py-3 rounded-xl">{error}</div>
                    )}

                    <div className="flex gap-3 justify-end pt-1">
                        <button type="button" onClick={dismiss} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Ahora no</button>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm cursor-pointer disabled:opacity-60" style={{ background: '#2696D2' }}>
                            {saving ? 'Guardando...' : 'Crear contraseña'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    )
}
