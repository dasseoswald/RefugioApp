import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    getActiveService, getAttendancesByMember, getAttendancesByService, registerAttendance, getServices, getMemberById,
    getMemberEscuelaProgress, ESCUELA_GUIDE_URLS
} from '../../data/mockData.js'
import { CheckCircle2, Clock, CalendarDays, UserCheck, Church, History, Sparkles, GraduationCap, FileText } from 'lucide-react'

const LEVEL_NAMES = { 1: 'Nivel 1', 2: 'Nivel 2', 3: 'Nivel 3' }

export default function AttendeeDashboard() {
    const { user } = useAuth()
    const [activeService, setActiveService] = useState(null)
    const [myAttendances, setMyAttendances] = useState([])
    const [isRegistered, setIsRegistered] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [registrationTime, setRegistrationTime] = useState(null)

    useEffect(() => {
        const service = getActiveService()
        setActiveService(service)

        const attendances = getAttendancesByMember(user.member_id)
        setMyAttendances(attendances)

        if (service) {
            const serviceAttendances = getAttendancesByService(service.id)
            const alreadyRegistered = serviceAttendances.some(a => a.member_id === user.member_id)
            setIsRegistered(alreadyRegistered)
        }
    }, [user.member_id])

    const handleRegister = () => {
        if (!activeService || isRegistered) return

        const result = registerAttendance(user.member_id, activeService.id, 'manual')
        if (result.data) {
            setIsRegistered(true)
            setRegistrationTime(new Date())
            setShowConfirmation(true)
            setMyAttendances(getAttendancesByMember(user.member_id))

            setTimeout(() => setShowConfirmation(false), 4000)
        }
    }

    const services = getServices()

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    }

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    }

    const member = getMemberById(user.member_id)
    const escuelaProgress = member?.escuela_discipulo ? getMemberEscuelaProgress(user.member_id) : null

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Welcome header */}
            <div className="rounded-2xl p-8 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #2696D2 0%, #1D74A8 50%, #111111 100%)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(20%, -20%)' }}></div>
                <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-[#E8A838]" />
                        <span className="text-white/60 text-sm font-medium">¡Bienvenido(a)!</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{member?.full_name || user.name}</h1>
                    {activeService && (
                        <div className="flex items-center gap-2 text-white/70">
                            <Church className="w-4 h-4" />
                            <span>{activeService.name} — {formatDate(activeService.service_date)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Registration button / Confirmation */}
            {showConfirmation ? (
                <div className="bg-[#E1F9EC] rounded-2xl p-8 text-center animate-scale-in">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#13CD68] flex items-center justify-center animate-checkmark">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#111111] mb-2">¡Asistencia Registrada!</h2>
                    <p className="text-[#13CD68] font-medium">{member?.full_name}</p>
                    <p className="text-[#6E6E6E] text-sm mt-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {registrationTime && formatTime(registrationTime.toISOString())}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-8 shadow-[0_2px_12px_rgba(38,150,210,0.08)] text-center">
                    {isRegistered ? (
                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-[#E1F9EC] flex items-center justify-center">
                                <UserCheck className="w-8 h-8 text-[#13CD68]" />
                            </div>
                            <h2 className="text-xl font-bold text-[#111111]">Ya registraste tu asistencia</h2>
                            <p className="text-[#6E6E6E]">Tu presencia ha sido registrada para el servicio de hoy. ¡Dios te bendiga!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-full bg-[#E8F4FC] flex items-center justify-center">
                                <CalendarDays className="w-8 h-8 text-[#2696D2]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#111111] mb-2">Registra tu asistencia</h2>
                                <p className="text-[#6E6E6E]">Presiona el botón para confirmar tu presencia en el servicio de hoy</p>
                            </div>
                            <button
                                id="register-attendance-btn"
                                onClick={handleRegister}
                                className="w-full max-w-xs mx-auto py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 cursor-pointer flex items-center justify-center gap-3"
                                style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}
                            >
                                <UserCheck className="w-6 h-6" />
                                Registrar mi Asistencia
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Mi Escuela del Discípulo */}
            {member?.escuela_discipulo && (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#E8F4FC] flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-[#2696D2]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[#111111]">Mi Escuela del Discípulo</h3>
                            <p className="text-xs text-[#6E6E6E]">{LEVEL_NAMES[member.escuela_discipulo_level] || 'Sin nivel asignado'}</p>
                        </div>
                    </div>
                    {escuelaProgress && (
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full bg-[#2696D2]" style={{ width: `${escuelaProgress.percentage}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-[#2696D2]">{escuelaProgress.percentage}%</span>
                        </div>
                    )}
                    <a href={ESCUELA_GUIDE_URLS[member.escuela_discipulo_level]} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        <FileText className="w-4 h-4" /> Ver Guía del Discípulo (PDF)
                    </a>
                </div>
            )}

            {/* Attendance history */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <History className="w-5 h-5 text-[#2696D2]" />
                    <h3 className="text-lg font-semibold text-[#111111]">Historial de Asistencias</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {myAttendances.length === 0 ? (
                        <div className="p-8 text-center text-[#6E6E6E]">
                            <CalendarDays className="w-10 h-10 mx-auto mb-3 text-[#6E6E6E]/30" />
                            <p>No hay registros de asistencia aún</p>
                        </div>
                    ) : (
                        myAttendances.slice(0, 10).map((att) => {
                            const service = services.find(s => s.id === att.service_id)
                            return (
                                <div key={att.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#E8F4FC] flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5 text-[#13CD68]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[#111111]">{service?.name || 'Servicio'}</p>
                                            <p className="text-xs text-[#6E6E6E]">{formatDate(att.check_in_time)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-[#2696D2]">{formatTime(att.check_in_time)}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${att.method === 'facial' ? 'bg-[#E8F4FC] text-[#2696D2]' : 'bg-[#E1F9EC] text-[#13CD68]'}`}>
                                            {att.method === 'facial' ? 'Facial' : 'Manual'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
