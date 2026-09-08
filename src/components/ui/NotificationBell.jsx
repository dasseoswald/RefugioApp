import { useState, useEffect, useRef } from 'react'
import { Bell, UserX } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { subscribeNotifications, markNotificationRead, markAllNotificationsRead } from '../../data/mockData.js'

// Por ahora solo Admin y Bienvenida reciben avisos (inasistencias seguidas,
// ver functions/index.js: checkConsecutiveAbsences) — si en el futuro se
// agregan avisos para otros roles, esta lista deja de ser necesaria porque
// subscribeNotifications ya filtra por rol en la propia consulta.
const ROLES_CON_AVISOS = ['admin', 'bienvenida']

function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'ahora mismo'
    if (minutes < 60) return `hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `hace ${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `hace ${days} d`
    return new Date(iso).toLocaleDateString('es-CL')
}

export default function NotificationBell({ variant = 'dark' }) {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef(null)

    useEffect(() => {
        if (!ROLES_CON_AVISOS.includes(user?.role)) return
        return subscribeNotifications(user.role, setNotifications)
    }, [user?.role])

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!ROLES_CON_AVISOS.includes(user?.role)) return null

    const uid = user?.auth_uid
    const unread = notifications.filter(n => !(n.read_by || []).includes(uid))
    const iconColor = variant === 'dark' ? 'text-white/80 hover:text-white' : 'text-[#111111]/70 hover:text-[#111111]'

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`relative p-1.5 rounded-full transition-colors cursor-pointer ${iconColor}`}
                aria-label="Notificaciones"
            >
                <Bell className="w-5 h-5" />
                {unread.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#E74C3C] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {unread.length > 9 ? '9+' : unread.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-w-[85vw] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-[#111111]">Notificaciones</h3>
                        {unread.length > 0 && (
                            <button
                                onClick={() => markAllNotificationsRead(unread.map(n => n.id), uid)}
                                className="text-xs text-[#2696D2] font-medium hover:underline cursor-pointer"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-sm text-[#6E6E6E] px-4 py-8 text-center">Sin notificaciones por ahora</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {notifications.map(n => {
                                    const isUnread = !(n.read_by || []).includes(uid)
                                    return (
                                        <li
                                            key={n.id}
                                            onClick={() => isUnread && markNotificationRead(n.id, uid)}
                                            className={`px-4 py-3 transition-colors ${isUnread ? 'bg-[#E8F4FC]/60 cursor-pointer hover:bg-[#E8F4FC]' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-[#FADBD8] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <UserX className="w-3.5 h-3.5 text-[#E74C3C]" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#2696D2] flex-shrink-0" />}
                                                        <p className="text-sm font-medium text-[#111111] truncate">{n.title}</p>
                                                    </div>
                                                    <p className="text-xs text-[#6E6E6E] mt-0.5">{n.body}</p>
                                                    <p className="text-[10px] text-[#9E9E9E] mt-1">{timeAgo(n.created_at)}</p>
                                                </div>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
