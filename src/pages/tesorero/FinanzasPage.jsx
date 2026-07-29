import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    getActiveFinanceWindows, getRecentFinanceWindows, getOffering, upsertOffering,
    getTithesForServiceDate, setTitheForMember, getMembers, subscribeFinanceData, isFinanceDataLoaded,
} from '../../data/mockData.js'
import { Landmark, HandCoins, Users, Lock, CheckCircle2, Search, Clock } from 'lucide-react'

const SERVICE_TYPE_LABELS = { sunday: 'Servicio Dominical', thursday: 'Servicio del Jueves' }

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount || 0)
}

function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

function windowKey(w) { return `${w.service_type}-${w.service_date}` }

export default function FinanzasPage() {
    const { user } = useAuth()
    const [tick, setTick] = useState(0)
    const [loaded, setLoaded] = useState(false)
    const [activeWindows, setActiveWindows] = useState([])
    const [historyWindows, setHistoryWindows] = useState([])
    const [members, setMembers] = useState([])
    const [selectedKey, setSelectedKey] = useState(null)
    const [offeringDrafts, setOfferingDrafts] = useState({})
    const [titheDrafts, setTitheDrafts] = useState({})
    const [titheSearch, setTitheSearch] = useState('')
    const [savedFlash, setSavedFlash] = useState('')

    const refresh = () => {
        setActiveWindows(getActiveFinanceWindows())
        setHistoryWindows(getRecentFinanceWindows())
        setLoaded(isFinanceDataLoaded())
        setTick(t => t + 1)
    }

    useEffect(() => {
        setMembers(getMembers())
        const unsubscribe = subscribeFinanceData(refresh)
        refresh()
        return unsubscribe
    }, [])

    useEffect(() => {
        if (activeWindows.length === 0) { setSelectedKey(null); return }
        if (!selectedKey || !activeWindows.some(w => windowKey(w) === selectedKey)) {
            setSelectedKey(windowKey(activeWindows[0]))
        }
    }, [activeWindows, selectedKey])

    // Precarga el borrador de ofrenda de cada ventana activa con lo ya
    // guardado en Firestore (si existe), sin pisar lo que el tesorero esté
    // escribiendo en este momento.
    useEffect(() => {
        setOfferingDrafts(prev => {
            const next = { ...prev }
            activeWindows.forEach(w => {
                const key = windowKey(w)
                if (!(key in next)) {
                    const existing = getOffering(w.service_type, w.service_date)
                    next[key] = { amount: existing?.amount ?? '', notes: existing?.notes ?? '' }
                }
            })
            return next
        })
    }, [activeWindows])

    const selectedWindow = activeWindows.find(w => windowKey(w) === selectedKey) || null

    // Recarga los diezmos ya registrados cada vez que se cambia de ventana o
    // llegan datos nuevos de Firestore — es la fuente de verdad, no hay
    // edición local que preservar entre servicios distintos.
    useEffect(() => {
        if (!selectedWindow) { setTitheDrafts({}); return }
        const existing = getTithesForServiceDate(selectedWindow.service_type, selectedWindow.service_date)
        const next = {}
        existing.forEach(t => { next[t.member_id] = String(t.amount) })
        setTitheDrafts(next)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedKey, tick])

    const handleSaveOffering = (w) => {
        const key = windowKey(w)
        const draft = offeringDrafts[key] || { amount: '', notes: '' }
        upsertOffering(w.service_type, w.service_date, draft.amount, draft.notes, user.id)
        setSavedFlash(key)
        setTimeout(() => setSavedFlash(''), 2000)
    }

    const titheTotal = selectedWindow
        ? Object.values(titheDrafts).reduce((sum, v) => sum + (Number(v) || 0), 0)
        : 0
    const titheCount = Object.values(titheDrafts).filter(v => Number(v) > 0).length

    const filteredMembers = members.filter(m => m.full_name.toLowerCase().includes(titheSearch.toLowerCase()))

    if (!loaded) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-[#9B59B6] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#111111] flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-[#9B59B6]" /> Finanzas
                </h1>
                <p className="text-[#6E6E6E] mt-1 flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4" />
                    Información confidencial — visible solo para el rol Tesorero, sin excepciones.
                </p>
            </div>

            {activeWindows.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-12 text-center text-[#6E6E6E]">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-[#6E6E6E]/30" />
                    <p className="text-lg font-medium">No hay ventanas de registro abiertas</p>
                    <p className="text-sm mt-1">El registro de un servicio se activa automáticamente el día del servicio y permanece abierto por 48 horas.</p>
                </div>
            ) : (
                <>
                    {/* Selector de ventana activa (si hay más de una) */}
                    {activeWindows.length > 1 && (
                        <div className="flex gap-2">
                            {activeWindows.map(w => (
                                <button key={windowKey(w)} onClick={() => setSelectedKey(windowKey(w))}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${selectedKey === windowKey(w) ? 'text-white shadow-lg' : 'bg-white text-[#6E6E6E] hover:text-[#111111]'}`}
                                    style={selectedKey === windowKey(w) ? { background: 'linear-gradient(135deg, #9B59B6, #6E3A8C)' } : {}}>
                                    {SERVICE_TYPE_LABELS[w.service_type]} — {formatDate(w.service_date)}
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedWindow && (
                        <>
                            <div className="bg-[#F3E8FB] rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#111111]">
                                <Clock className="w-4 h-4 text-[#9B59B6] flex-shrink-0" />
                                <span>
                                    Ventana de <strong>{SERVICE_TYPE_LABELS[selectedWindow.service_type]}</strong> del {formatDate(selectedWindow.service_date)} — abierta hasta {new Date(selectedWindow.closes_at).toLocaleString('es', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}.
                                </span>
                            </div>

                            {/* Registro de Ofrendas */}
                            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                                <h3 className="text-lg font-semibold text-[#111111] mb-4 flex items-center gap-2">
                                    <HandCoins className="w-5 h-5 text-[#9B59B6]" /> Registro de Ofrendas
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Monto Total de la Ofrenda</label>
                                        <input
                                            type="number" min="0"
                                            value={offeringDrafts[selectedKey]?.amount ?? ''}
                                            onChange={(e) => setOfferingDrafts(prev => ({ ...prev, [selectedKey]: { ...prev[selectedKey], amount: e.target.value } }))}
                                            placeholder="0"
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#9B59B6] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Notas (opcional)</label>
                                        <input
                                            type="text"
                                            value={offeringDrafts[selectedKey]?.notes ?? ''}
                                            onChange={(e) => setOfferingDrafts(prev => ({ ...prev, [selectedKey]: { ...prev[selectedKey], notes: e.target.value } }))}
                                            placeholder="Ej: incluye ofrenda especial"
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#9B59B6] text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                    <button onClick={() => handleSaveOffering(selectedWindow)}
                                        className="px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg cursor-pointer"
                                        style={{ background: 'linear-gradient(135deg, #9B59B6, #6E3A8C)' }}>
                                        Guardar Ofrenda
                                    </button>
                                    {savedFlash === selectedKey && (
                                        <span className="text-sm text-[#13CD68] flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Guardado</span>
                                    )}
                                </div>
                            </div>

                            {/* Registro de Diezmos */}
                            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                                    <h3 className="text-lg font-semibold text-[#111111] flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[#9B59B6]" /> Registro de Diezmos
                                    </h3>
                                    <span className="text-sm text-[#6E6E6E] bg-[#F3E8FB] px-3 py-1 rounded-full font-medium">
                                        {titheCount} diezmaron — {formatCurrency(titheTotal)}
                                    </span>
                                </div>
                                <div className="px-6 py-3 border-b border-gray-100">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
                                        <input type="text" value={titheSearch} onChange={(e) => setTitheSearch(e.target.value)}
                                            placeholder="Buscar miembro..."
                                            className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:border-[#9B59B6]" />
                                    </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                                    {filteredMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between gap-3 px-6 py-3">
                                            <span className="text-sm text-[#111111] truncate flex items-center gap-2 min-w-0">
                                                {Number(titheDrafts[member.id]) > 0 && <CheckCircle2 className="w-4 h-4 text-[#13CD68] flex-shrink-0" />}
                                                <span className="truncate">{member.full_name}</span>
                                            </span>
                                            <input
                                                type="number" min="0" placeholder="Monto"
                                                value={titheDrafts[member.id] ?? ''}
                                                onChange={(e) => setTitheDrafts(prev => ({ ...prev, [member.id]: e.target.value }))}
                                                onBlur={(e) => setTitheForMember(selectedWindow.service_type, selectedWindow.service_date, member.id, e.target.value, user.id)}
                                                className="w-28 px-3 py-1.5 rounded-lg border-2 border-gray-100 text-sm text-right focus:outline-none focus:border-[#9B59B6] flex-shrink-0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Historial reciente */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-semibold text-[#111111]">Historial Reciente</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {historyWindows.map(w => {
                        const offering = getOffering(w.service_type, w.service_date)
                        const tithes = getTithesForServiceDate(w.service_type, w.service_date)
                        const tithesSum = tithes.reduce((sum, t) => sum + (t.amount || 0), 0)
                        return (
                            <div key={windowKey(w)} className="px-6 py-3 flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <p className="text-sm font-medium text-[#111111]">{SERVICE_TYPE_LABELS[w.service_type]} — {formatDate(w.service_date)}</p>
                                    <p className="text-xs text-[#6E6E6E]">
                                        {offering ? `Ofrenda: ${formatCurrency(offering.amount)}` : 'Ofrenda no registrada'} • {tithes.length} diezmos ({formatCurrency(tithesSum)})
                                    </p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${w.is_active ? 'bg-[#E1F9EC] text-[#13CD68]' : 'bg-gray-100 text-[#6E6E6E]'}`}>
                                    {w.is_active ? 'Abierto' : 'Cerrado'}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
