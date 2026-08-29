import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { subscribeMinistryOfferings, addMinistryOffering, deleteMinistryOffering } from '../../data/mockData.js'
import { HandCoins, Plus, Trash2 } from 'lucide-react'

// Registro simple de ofrenda por ministerio/clase (scopeKey = 'grupo:<campo>'
// o 'buena-tierra:<classId>') — independiente de los registros
// confidenciales de ofrendas/diezmos del Tesorero. Lo usan GroupDashboardPage,
// BuenaTierraPage y EscuelaDiscipuloPage.
export default function OfferingLog({ scopeKey, canManage, color = '#E8A838' }) {
    const { user } = useAuth()
    const [entries, setEntries] = useState([])
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [notes, setNotes] = useState('')

    useEffect(() => {
        const unsubscribe = subscribeMinistryOfferings(scopeKey, setEntries)
        return unsubscribe
    }, [scopeKey])

    const total = entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    const handleAdd = () => {
        const value = Number(amount)
        if (!value || value <= 0 || !date) return
        addMinistryOffering(scopeKey, {
            amount: value, date, notes: notes.trim(),
            registered_by: user?.name, registered_by_uid: user?.auth_uid,
        })
        setAmount('')
        setNotes('')
    }

    return (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                    <HandCoins className="w-4 h-4" style={{ color }} /> Ofrenda
                </h3>
                <span className="text-sm font-bold" style={{ color }}>
                    Total: ${total.toLocaleString('es-CL')}
                </span>
            </div>
            <p className="text-xs text-[#6E6E6E] -mt-2">
                Registro interno de este ministerio — independiente de los registros de ofrendas y diezmos de la iglesia.
            </p>

            {canManage && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:border-gray-300" />
                    <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto"
                        className="px-3 py-2 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:border-gray-300" />
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nota (opcional)"
                        className="px-3 py-2 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:border-gray-300" />
                    <button onClick={handleAdd} disabled={!amount || Number(amount) <= 0}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: color }}>
                        <Plus className="w-4 h-4" /> Agregar
                    </button>
                </div>
            )}

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {entries.length === 0 ? (
                    <p className="text-sm text-[#6E6E6E] text-center py-4">Todavía no hay ofrendas registradas.</p>
                ) : (
                    entries.map(e => (
                        <div key={e.id} className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-gray-50">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[#111111]">
                                    ${Number(e.amount).toLocaleString('es-CL')} — {new Date(e.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-[#6E6E6E] truncate">
                                    {e.notes ? `${e.notes} · ` : ''}Registrado por {e.registered_by || 'Sistema'}
                                </p>
                            </div>
                            {canManage && (
                                <button onClick={() => deleteMinistryOffering(e.id)} title="Borrar"
                                    className="text-[#6E6E6E] hover:text-[#E74C3C] cursor-pointer flex-shrink-0">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
