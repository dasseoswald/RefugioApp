import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { KeyRound, Lock, CheckCircle2 } from 'lucide-react'

export default function PasswordCard() {
    const { needsPassword, setAccountPassword } = useAuth()
    const [expanded, setExpanded] = useState(false)
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    if (!needsPassword) {
        return (
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#13CD68] flex-shrink-0" />
                <div>
                    <h3 className="text-base font-semibold text-[#111111]">Contraseña creada</h3>
                    <p className="text-xs text-[#6E6E6E] mt-0.5">Puedes iniciar sesión con tu correo, sin depender de Google</p>
                </div>
            </div>
        )
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
        setExpanded(false)
    }

    return (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center flex-shrink-0">
                        <KeyRound className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[#111111]">Crear contraseña</h3>
                        <p className="text-xs text-[#6E6E6E] mt-0.5">Entraste con Google. Crea una contraseña por si alguna vez no funciona (ej. dentro de WhatsApp)</p>
                    </div>
                </div>
                {!expanded && (
                    <button
                        onClick={() => setExpanded(true)}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer flex-shrink-0"
                        style={{ background: '#2696D2' }}
                    >
                        Crear
                    </button>
                )}
            </div>

            {expanded && (
                <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
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
                    {error && <div className="bg-[#FADBD8] text-[#E74C3C] text-sm px-4 py-3 rounded-xl">{error}</div>}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setExpanded(false)} className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                        <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl text-white font-medium text-sm cursor-pointer disabled:opacity-60" style={{ background: '#2696D2' }}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
