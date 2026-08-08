import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getActiveService, findAttendanceByMemberAndService, registerAttendance } from '../data/mockData.js'
import { CheckCircle2, QrCode, XCircle, ArrowRight } from 'lucide-react'
import logo from '../assets/logo.png'

const DEFAULT_ROUTES = { admin: '/admin', controller: '/controller', attendee: '/attendee', tesorero: '/tesorero' }

// Página de destino del código QR pegado en la entrada de la iglesia. No usa
// ProtectedRoute porque, si la persona no ha iniciado sesión, necesitamos
// mandarla a /login y que, al volver, termine aquí mismo — no en su panel
// por defecto — para completar el registro. Ver el flag `pending_checkin`
// en App.jsx.
export default function CheckinPage() {
    const { user, isAuthenticated, loading } = useAuth()
    const navigate = useNavigate()
    const [status, setStatus] = useState('checking') // checking | success | already | no-service | error

    useEffect(() => {
        if (loading) return
        if (!isAuthenticated) {
            sessionStorage.setItem('pending_checkin', '1')
            navigate('/login', { replace: true })
            return
        }
        sessionStorage.removeItem('pending_checkin')

        const activeService = getActiveService()
        if (!activeService) {
            setStatus('no-service')
            return
        }
        const existing = findAttendanceByMemberAndService(user.member_id, activeService.id)
        if (existing) {
            setStatus('already')
            return
        }
        const result = registerAttendance(user.member_id, activeService.id, 'qr')
        setStatus(result.data ? 'success' : 'error')
    }, [loading, isAuthenticated, user, navigate])

    const goToPanel = () => navigate(DEFAULT_ROUTES[user?.role] || '/login')

    return (
        <div className="min-h-screen flex items-center justify-center p-6"
            style={{ background: 'linear-gradient(135deg, #010101 0%, #111111 55%, #2696D2 100%)' }}>
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center animate-scale-in">
                <img src={logo} alt="Refugio App" className="w-14 h-14 object-contain mx-auto mb-4" />

                {status === 'checking' && (
                    <div className="py-6">
                        <div className="w-12 h-12 mx-auto border-4 border-gray-200 border-t-[#2696D2] rounded-full animate-spin mb-4"></div>
                        <p className="text-[#6E6E6E]">Registrando tu asistencia...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-2">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#E1F9EC] flex items-center justify-center animate-checkmark">
                            <CheckCircle2 className="w-10 h-10 text-[#13CD68]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#111111] mb-2">¡Asistencia Registrada!</h1>
                        <p className="text-[#6E6E6E] flex items-center justify-center gap-1.5">
                            <QrCode className="w-4 h-4" /> Registrado con el código QR
                        </p>
                    </div>
                )}

                {status === 'already' && (
                    <div className="py-2">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#E8F4FC] flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-[#2696D2]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#111111] mb-2">Ya estabas registrado</h1>
                        <p className="text-[#6E6E6E]">Tu asistencia a este servicio ya había sido registrada. ¡Dios te bendiga!</p>
                    </div>
                )}

                {status === 'no-service' && (
                    <div className="py-2">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#FFF3CD] flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-[#E8A838]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#111111] mb-2">No hay un servicio activo</h1>
                        <p className="text-[#6E6E6E]">Todavía no se ha activado el registro para el servicio de hoy. Intenta de nuevo más tarde.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-2">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#FADBD8] flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-[#E74C3C]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#111111] mb-2">No se pudo registrar</h1>
                        <p className="text-[#6E6E6E]">Ocurrió un problema al registrar tu asistencia. Intenta escanear el código de nuevo.</p>
                    </div>
                )}

                {status !== 'checking' && (
                    <button onClick={goToPanel}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all hover:shadow-lg cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        Ir a mi panel <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}
