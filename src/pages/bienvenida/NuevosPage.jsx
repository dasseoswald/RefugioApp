import { useState, useEffect } from 'react'
import { getVisitorsByCheckCount } from '../../data/mockData.js'
import { UserCheck, Clock } from 'lucide-react'

const COLUMN_META = {
    1: { label: '1ª asistencia', color: '#2696D2', bg: '#E8F4FC' },
    2: { label: '2ª asistencia', color: '#E8A838', bg: '#FFF3CD' },
    3: { label: '3ª asistencia', color: '#9B59B6', bg: '#F3E8FB' },
    4: { label: '4ª asistencia', color: '#13CD68', bg: '#E1F9EC' },
}

function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function NuevosPage() {
    const [buckets, setBuckets] = useState({ 1: [], 2: [], 3: [], 4: [] })

    useEffect(() => {
        const refresh = () => setBuckets(getVisitorsByCheckCount())
        refresh()
        const interval = setInterval(refresh, 15000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Nuevos</h1>
                <p className="text-[#6E6E6E] mt-1">Visitantes agrupados por cuántas veces han asistido, para saber a quién dar seguimiento</p>
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
