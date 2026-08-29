import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getVisitorsByCheckCount, getServices, registerAttendance } from '../../data/mockData.js'
import MemberAutocomplete from '../../components/shared/MemberAutocomplete.jsx'
import { UserCheck, Clock, CalendarPlus, CheckCircle2 } from 'lucide-react'

const COLUMN_META = {
    1: { label: '1ª asistencia', color: '#2696D2', bg: '#E8F4FC' },
    2: { label: '2ª asistencia', color: '#E8A838', bg: '#FFF3CD' },
    3: { label: '3ª asistencia', color: '#9B59B6', bg: '#F3E8FB' },
    4: { label: '4ª asistencia', color: '#13CD68', bg: '#E1F9EC' },
}

const SERVICE_TYPE_LABELS = { sunday: 'Domingo', thursday: 'Jueves', 'buena-tierra': 'Buena Tierra' }

function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function formatServiceOption(service) {
    const [year, month, day] = service.service_date.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const dateLabel = date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
    const typeLabel = SERVICE_TYPE_LABELS[service.service_type || 'sunday'] || service.service_type
    return `${typeLabel} · ${dateLabel} — ${service.name}`
}

export default function NuevosPage() {
    const { user } = useAuth()
    const [buckets, setBuckets] = useState({ 1: [], 2: [], 3: [], 4: [] })
    const [services, setServices] = useState([])
    const [nameInput, setNameInput] = useState('')
    const [selectedMember, setSelectedMember] = useState(null)
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [feedback, setFeedback] = useState(null)

    const refresh = () => {
        setBuckets(getVisitorsByCheckCount())
        setServices([...getServices()].sort((a, b) => new Date(b.service_date) - new Date(a.service_date)))
    }

    useEffect(() => {
        refresh()
        const interval = setInterval(refresh, 15000)
        return () => clearInterval(interval)
    }, [])

    const handleRegister = () => {
        if (!selectedMember || !selectedServiceId) return
        const result = registerAttendance(selectedMember.id, selectedServiceId, 'manual', user?.id)
        if (result.error) {
            setFeedback({ type: 'error', message: result.error })
        } else {
            setFeedback({ type: 'success', message: `Asistencia de ${selectedMember.full_name} registrada` })
            setNameInput('')
            setSelectedMember(null)
            refresh()
        }
        setTimeout(() => setFeedback(null), 4000)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Nuevos</h1>
                <p className="text-[#6E6E6E] mt-1">Visitantes agrupados por cuántas veces han asistido, para saber a quién dar seguimiento</p>
            </div>

            {/* Registro manual de asistencia — para cuando no se alcanzó a
                marcar en vivo durante el culto, pero se puede agregar después. */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 space-y-3">
                <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                    <CalendarPlus className="w-4 h-4 text-[#2696D2]" /> Agregar asistencia manual
                </h3>
                <p className="text-xs text-[#6E6E6E]">Registra la asistencia de un hermano a cualquier servicio pasado, en cualquier momento.</p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                    <MemberAutocomplete
                        value={nameInput}
                        onChange={setNameInput}
                        onSelectMember={setSelectedMember}
                        placeholder="Busca un miembro..."
                    />
                    <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:border-[#2696D2] cursor-pointer">
                        <option value="">Elige un servicio...</option>
                        {services.map(s => (
                            <option key={s.id} value={s.id}>{formatServiceOption(s)}</option>
                        ))}
                    </select>
                    <button onClick={handleRegister} disabled={!selectedMember || !selectedServiceId}
                        className="px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        Registrar
                    </button>
                </div>
                {feedback && (
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${feedback.type === 'error' ? 'bg-[#FADBD8] text-[#E74C3C]' : 'bg-[#E1F9EC] text-[#13CD68]'}`}>
                        <CheckCircle2 className="w-4 h-4" /> {feedback.message}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => {
                    const meta = COLUMN_META[n]
                    const visitors = buckets[n] || []
                    return (
                        <div key={n} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                            <div className="px-4 py-3 flex items-center justify-between" style={{ background: meta.bg }}>
                                <span className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: meta.color }}>{visitors.length}</span>
                            </div>
                            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
                                {visitors.length === 0 ? (
                                    <p className="text-xs text-[#6E6E6E] px-2 py-4 text-center">Nadie en esta etapa</p>
                                ) : (
                                    visitors.map(({ member, lastAttendance }) => (
                                        <div key={member.id} className="px-3 py-2.5 rounded-xl bg-gray-50">
                                            <p className="text-sm font-medium text-[#111111] flex items-center gap-1.5">
                                                <UserCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: meta.color }} />
                                                {member.full_name}
                                            </p>
                                            <p className="text-xs text-[#6E6E6E] mt-1 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" /> Última vez: {formatDate(lastAttendance)}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <p className="text-xs text-[#6E6E6E]">
                Al llegar a la 4ª asistencia, se envía automáticamente una notificación push a todas las cuentas con rol Bienvenida.
            </p>
        </div>
    )
}
