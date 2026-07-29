import { useState, useEffect } from 'react'
import { getActiveService, getAttendancesByService, getMembers, getMemberById } from '../../data/mockData.js'
import StatsCard from '../../components/ui/StatsCard.jsx'
import { Users, UserCheck, Clock, Fingerprint, Eye, CalendarDays } from 'lucide-react'
import NovedadesCarousel from '../../components/shared/NovedadesCarousel.jsx'
import NextEventBanner from '../../components/shared/NextEventBanner.jsx'

export default function ControllerDashboard() {
    const [activeService, setActiveService] = useState(null)
    const [attendances, setAttendances] = useState([])
    const [members, setMembers] = useState([])

    useEffect(() => {
        const service = getActiveService()
        setActiveService(service)
        if (service) {
            setAttendances(getAttendancesByService(service.id))
        }
        setMembers(getMembers())
    }, [])

    const totalAttendees = attendances.length
    const manualCount = attendances.filter(a => a.method === 'manual').length
    const facialCount = attendances.filter(a => a.method === 'facial').length
    const activeMembers = members.filter(m => m.is_active).length
    const attendancePercentage = activeMembers > 0 ? Math.round((totalAttendees / activeMembers) * 100) : 0

    const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Panel de Control</h1>
                {activeService && (
                    <p className="text-[#6E6E6E] mt-1 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {activeService.name} — {formatDate(activeService.service_date)}
                    </p>
                )}
            </div>

            <NextEventBanner />
            <NovedadesCarousel />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <StatsCard
                    title="Asistentes Hoy"
                    value={totalAttendees}
                    icon={Users}
                    variant="primary"
                    subtitle={`${attendancePercentage}% de miembros activos`}
                />
                <StatsCard
                    title="Registro Manual"
                    value={manualCount}
                    icon={UserCheck}
                    subtitle="Registros manuales"
                />
                <StatsCard
                    title="Reconocimiento Facial"
                    value={facialCount}
                    icon={Fingerprint}
                    subtitle="Registros automáticos"
                />
                <StatsCard
                    title="Miembros Activos"
                    value={activeMembers}
                    icon={Eye}
                    subtitle="Total en el sistema"
                />
            </div>

            {/* Attendee list */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#2696D2]" />
                        <h3 className="text-lg font-semibold text-[#111111]">Asistentes del Servicio</h3>
                    </div>
                    <span className="text-sm text-[#6E6E6E] bg-[#E8F4FC] px-3 py-1 rounded-full font-medium">
                        {totalAttendees} registros
                    </span>
                </div>

                {attendances.length === 0 ? (
                    <div className="p-12 text-center text-[#6E6E6E]">
                        <Users className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                        <p className="text-lg font-medium">No hay asistentes registrados</p>
                        <p className="text-sm">Los registros aparecerán aquí en tiempo real</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Nombre</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Tipo</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Hora de Ingreso</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Método</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attendances.map((att) => {
                                    const member = getMemberById(att.member_id)
                                    return (
                                        <tr key={att.id} className="hover:bg-[#E8F4FC]/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#2696D2] flex items-center justify-center text-white text-sm font-semibold">
                                                        {member?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="text-sm font-medium text-[#111111]">{member?.full_name || 'Desconocido'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs px-2.5 py-1 rounded-full bg-[#E8F4FC] text-[#2696D2] font-medium">
                                                    {member?.member_type || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#111111] font-medium">{formatTime(att.check_in_time)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${att.method === 'facial'
                                                        ? 'bg-[#E8A838]/10 text-[#E8A838]'
                                                        : 'bg-[#E1F9EC] text-[#13CD68]'
                                                    }`}>
                                                    {att.method === 'facial' ? '🤖 Facial' : '✋ Manual'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
