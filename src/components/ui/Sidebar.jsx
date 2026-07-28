import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { OPERATIONAL_GROUPS, getMemberById } from '../../data/mockData.js'
import UserAvatar from './UserAvatar.jsx'
import logo from '../../assets/logo.png'
import {
    Home, Users, ClipboardList, BarChart3, Settings,
    CalendarDays, LogOut, Shield,
    UserCheck, BookOpen, Sprout, ChevronDown, ChevronRight,
    UserCircle, UserSquare, Baby, Music, Layers, Megaphone, HandHeart, PartyPopper,
    Menu, X, MessageCircle
} from 'lucide-react'

const NAV_CONFIG = {
    admin: [
        { to: '/admin/services', icon: CalendarDays, label: 'Servicios' },
        { to: '/admin/members', icon: Users, label: 'Miembros' },
        { to: '/admin/reports', icon: BarChart3, label: 'Reportes' },
        { to: '/admin/users', icon: Shield, label: 'Usuarios' },
        { to: '/admin/mensajes', icon: Megaphone, label: 'Mensajes' },
        { to: '/admin/oraciones', icon: HandHeart, label: 'Oraciones y Gratitud' },
        { to: '/admin/eventos', icon: PartyPopper, label: 'Eventos' },
        { to: '/admin/chat', icon: MessageCircle, label: 'Chat en Vivo' },
    ],
    controller: [
        { to: '/controller', icon: Home, label: 'Dashboard', end: true },
        { to: '/controller/services', icon: CalendarDays, label: 'Servicios' },
        { to: '/controller/members', icon: Users, label: 'Miembros' },
        { to: '/controller/reports', icon: BarChart3, label: 'Reportes' },
        { to: '/controller/oraciones', icon: HandHeart, label: 'Oraciones y Gratitud' },
        { to: '/controller/eventos', icon: PartyPopper, label: 'Eventos' },
        { to: '/controller/chat', icon: MessageCircle, label: 'Chat en Vivo' },
    ],
    attendee: [
        { to: '/attendee', icon: Home, label: 'Mi Asistencia', end: true },
        { to: '/attendee/oraciones', icon: HandHeart, label: 'Oraciones y Gratitud' },
        { to: '/attendee/eventos', icon: PartyPopper, label: 'Eventos' },
        { to: '/attendee/chat', icon: MessageCircle, label: 'Chat en Vivo' },
    ],
}

const PROFILE_ROUTES = {
    admin: '/admin/profile',
    controller: '/controller/profile',
    attendee: '/attendee/profile',
}

export default function Sidebar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const navItems = NAV_CONFIG[user?.role] || []
    const profileRoute = PROFILE_ROUTES[user?.role] || '/login'
    const isProfileActive = location.pathname === profileRoute
    const [groupsOpen, setGroupsOpen] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)

    // Determinar los grupos permitidos
    const myMember = user?.member_id ? getMemberById(user.member_id) : null
    const allowedGroups = user?.role === 'admin' 
        ? OPERATIONAL_GROUPS 
        : OPERATIONAL_GROUPS.filter(g => myMember && myMember[g.field])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const roleLabels = { admin: 'Administrador', controller: 'Controlador', attendee: 'Asistente' }

    return (
        <>
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4"
                style={{ background: 'linear-gradient(180deg, #010101 0%, #111111 100%)' }}>
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Refugio App" className="w-7 h-7 object-contain" />
                    <span className="text-white font-bold text-base">Refugio App</span>
                </div>
                <button onClick={() => setMobileOpen(true)} className="text-white p-2 -mr-2 cursor-pointer" aria-label="Abrir menú">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={() => setMobileOpen(false)} />
            )}

            <aside className={`fixed top-0 h-screen w-64 flex flex-col z-50 transition-[left] duration-300 ease-in-out lg:left-0 ${mobileOpen ? 'max-lg:left-0' : 'max-lg:-left-64'
                }`}
                style={{ background: 'linear-gradient(180deg, #010101 0%, #111111 100%)' }}>
            {/* Logo */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #5CB0E0)' }}>
                        <img src={logo} alt="Refugio App" className="w-7 h-7 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg leading-tight">Refugio App</h1>
                        <p className="text-white/50 text-xs">Control de Asistencia</p>
                    </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="lg:hidden text-white/60 hover:text-white p-1 cursor-pointer" aria-label="Cerrar menú">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* User info — clickable to profile */}
            <button
                onClick={() => { navigate(profileRoute); setMobileOpen(false) }}
                className={`px-6 py-4 border-b border-white/10 text-left transition-all duration-200 cursor-pointer ${isProfileActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <UserAvatar
                        photoUrl={user?.photo_url}
                        name={user?.name}
                        size="sm"
                        bgColor="#2696D2"
                    />
                    <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-white/40 text-xs">{roleLabels[user?.role]}</p>
                    </div>
                </div>
            </button>

            {/* Navigation */}
            <nav onClick={(e) => { if (e.target.closest('a')) setMobileOpen(false) }} className="flex-1 py-4 px-3 overflow-y-auto">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'text-white shadow-lg'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`
                                }
                                style={({ isActive }) =>
                                    isActive ? { background: 'linear-gradient(135deg, #2696D2, #1D74A8)' } : {}
                                }
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
                
                {/* Grupos Dinámicos */}
                {allowedGroups.length > 0 && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <button 
                            onClick={() => setGroupsOpen(!groupsOpen)}
                            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
                        >
                            <span className="flex items-center gap-2"><Layers className="w-4 h-4"/> Grupos / Ministerios</span>
                            {groupsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        
                        {groupsOpen && (
                            <ul className="space-y-1 mt-2">
                                {allowedGroups.map(group => {
                                    // Use dynamic icon component mapping if needed, or fallback
                                    const ICONS_MAP = { BookOpen, Sprout, Users, UserCircle, UserSquare, Baby, Music, Home }
                                    const IconComponent = ICONS_MAP[group.icon] || Users
                                    
                                    return (
                                        <li key={group.id}>
                                            <NavLink
                                                to={`/${user?.role}/grupos/${group.id}`}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                                        ? 'text-white shadow-lg bg-white/10'
                                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                                    }`
                                                }
                                                style={({ isActive }) =>
                                                    isActive ? { borderLeft: '3px solid #13CD68' } : { borderLeft: '3px solid transparent' }
                                                }
                                            >
                                                <IconComponent className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{group.name}</span>
                                            </NavLink>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </nav>

            {/* Settings + Logout */}
            <div className="p-3 border-t border-white/10 space-y-1">
                {user?.role === 'admin' && (
                    <NavLink
                        to="/admin/settings"
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? 'text-white shadow-lg'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`
                        }
                        style={({ isActive }) =>
                            isActive ? { background: 'linear-gradient(135deg, #2696D2, #1D74A8)' } : {}
                        }
                    >
                        <Settings className="w-5 h-5" />
                        <span>Configuración</span>
                    </NavLink>
                )}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
            </aside>
        </>
    )
}
