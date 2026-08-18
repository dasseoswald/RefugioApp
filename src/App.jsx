import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import logo from './assets/logo.png'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Sidebar from './components/ui/Sidebar.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProfilePage from './pages/shared/ProfilePage.jsx'
import MemberProfilePage from './pages/shared/MemberProfilePage.jsx'
import AttendeeDashboard from './pages/attendee/AttendeeDashboard.jsx'
import ControllerDashboard from './pages/controller/ControllerDashboard.jsx'
import MembersPage from './pages/controller/MembersPage.jsx'
import ServicesPage from './pages/admin/ServicesPage.jsx'
import ReportsPage from './pages/admin/ReportsPage.jsx'
import UsersPage from './pages/admin/UsersPage.jsx'
import SettingsPage from './pages/admin/SettingsPage.jsx'
import GroupDashboardPage from './pages/shared/GroupDashboardPage.jsx'
import EscuelaDiscipuloPage from './pages/admin/EscuelaDiscipuloPage.jsx'
import RefugiosPage from './pages/admin/RefugiosPage.jsx'
import BroadcastPage from './pages/admin/BroadcastPage.jsx'
import PrayerRequestsPage from './pages/shared/PrayerRequestsPage.jsx'
import EventsPage from './pages/shared/EventsPage.jsx'
import LiveChatPage from './pages/shared/LiveChatPage.jsx'
import RadioPage from './pages/shared/RadioPage.jsx'
import BibliaPage from './pages/shared/BibliaPage.jsx'
import ForumPage from './pages/shared/ForumPage.jsx'
import FinanzasPage from './pages/tesorero/FinanzasPage.jsx'
import PresentationPage from './pages/PresentationPage.jsx'
import CheckinPage from './pages/CheckinPage.jsx'
import OnboardingPrompt from './components/shared/OnboardingPrompt.jsx'
import SetPasswordPrompt from './components/shared/SetPasswordPrompt.jsx'
import { OPERATIONAL_GROUPS } from './data/mockData.js'

function AppLayout({ children }) {
    return (
        <div className="min-h-screen relative">
            {/* Fondo de video detrás de todas las pantallas de la app (no solo
                login/carga). fixed para no recargarse al hacer scroll, con un
                velo gris casi opaco encima para que tablas y formularios
                sigan siendo legibles — solo se nota en los espacios entre
                tarjetas. */}
            <video autoPlay muted loop playsInline
                className="fixed inset-0 w-full h-full object-cover -z-10"
                src="/videofondo.mp4" />
            <div className="fixed inset-0 -z-10" style={{ background: 'rgba(237,237,237,0.9)' }} />
            <Sidebar />
            <main className="min-h-screen p-4 pt-[calc(5rem_+_env(safe-area-inset-top))] lg:ml-64 lg:p-8">
                {children}
            </main>
            <SetPasswordPrompt />
            <OnboardingPrompt />
        </div>
    )
}

const DEFAULT_ROUTES = { admin: '/admin', controller: '/controller', tesorero: '/tesorero', attendee: '/attendee' }
const SPLASH_DURATION_MS = 2000

function SplashScreen() {
    return (
        <div className="min-h-screen relative flex items-center justify-center animate-fade-in overflow-hidden">
            <video autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
                src="/videofondo.mp4" />
            <div className="absolute inset-0 z-0"
                style={{ background: 'linear-gradient(180deg, rgba(1,1,1,0.8) 0%, rgba(17,17,17,0.8) 100%)' }} />
            <img src={logo} alt="Refugio App" className="w-28 h-28 object-contain relative z-10" />
        </div>
    )
}

export default function App() {
    const { isAuthenticated, user, loading } = useAuth()
    const [minSplashDone, setMinSplashDone] = useState(false)
    const [postLoginSplash, setPostLoginSplash] = useState(false)
    const wasAuthenticated = useRef(isAuthenticated)

    // Splash mínimo al cargar la app (antes de mostrar login o dashboard)
    useEffect(() => {
        const timer = setTimeout(() => setMinSplashDone(true), SPLASH_DURATION_MS)
        return () => clearTimeout(timer)
    }, [])

    // Splash al pasar de no-autenticado a autenticado (login recién hecho)
    useEffect(() => {
        if (isAuthenticated && !wasAuthenticated.current) {
            setPostLoginSplash(true)
            const timer = setTimeout(() => setPostLoginSplash(false), SPLASH_DURATION_MS)
            wasAuthenticated.current = isAuthenticated
            return () => clearTimeout(timer)
        }
        wasAuthenticated.current = isAuthenticated
    }, [isAuthenticated])

    if (loading || !minSplashDone || postLoginSplash) {
        return <SplashScreen />
    }

    return (
        <Routes>
            {/* Login */}
            <Route path="/login" element={
                isAuthenticated
                    ? <Navigate to={sessionStorage.getItem('pending_checkin') ? '/checkin' : (DEFAULT_ROUTES[user.role] || '/attendee')} replace />
                    : <LoginPage />
            } />
            <Route path="/register" element={
                isAuthenticated
                    ? <Navigate to={sessionStorage.getItem('pending_checkin') ? '/checkin' : (DEFAULT_ROUTES[user.role] || '/attendee')} replace />
                    : <RegisterPage />
            } />

            {/* Código QR de la entrada: registra la asistencia al servicio activo */}
            <Route path="/checkin" element={<CheckinPage />} />

            {/* Attendee routes */}
            <Route path="/attendee" element={
                <ProtectedRoute allowedRoles={['attendee']}>
                    <AppLayout><AttendeeDashboard /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/attendee/profile" element={
                <ProtectedRoute allowedRoles={['attendee']}>
                    <AppLayout><ProfilePage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* Controller routes */}
            <Route path="/controller" element={
                <ProtectedRoute allowedRoles={['controller']}>
                    <AppLayout><ControllerDashboard /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/controller/services" element={
                <ProtectedRoute allowedRoles={['controller']}>
                    <AppLayout><ServicesPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/controller/members" element={
                <ProtectedRoute allowedRoles={['controller']}>
                    <AppLayout><MembersPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/controller/reports" element={
                <ProtectedRoute allowedRoles={['controller']}>
                    <AppLayout><ReportsPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/controller/profile" element={
                <ProtectedRoute allowedRoles={['controller']}>
                    <AppLayout><ProfilePage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/controller/member/:memberId" element={
                <ProtectedRoute allowedRoles={['controller']}>
                    <AppLayout><MemberProfilePage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <Navigate to="/admin/reports" replace />
                </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><ServicesPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/members" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><MembersPage canToggleActive={true} /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><ReportsPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><UsersPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/mensajes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><BroadcastPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><SettingsPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><ProfilePage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/admin/member/:memberId" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout><MemberProfilePage /></AppLayout>
                </ProtectedRoute>
            } />
            {/* Tesorero routes */}
            <Route path="/tesorero" element={
                <ProtectedRoute allowedRoles={['tesorero']}>
                    <AppLayout><FinanzasPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/tesorero/profile" element={
                <ProtectedRoute allowedRoles={['tesorero']}>
                    <AppLayout><ProfilePage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* Custom group routes */}
            <Route path="/:role/grupos/escuela-discipulo" element={
                <ProtectedRoute allowedRoles={['admin', 'controller']}>
                    <AppLayout><EscuelaDiscipuloPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/:role/grupos/refugios" element={
                <ProtectedRoute allowedRoles={['admin', 'controller']}>
                    <AppLayout><RefugiosPage /></AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/:role/oraciones" element={
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee', 'tesorero']}>
                    <AppLayout><PrayerRequestsPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/:role/eventos" element={
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee', 'tesorero']}>
                    <AppLayout><EventsPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/:role/chat" element={
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee', 'tesorero']}>
                    <AppLayout><LiveChatPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/:role/foro" element={
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee', 'tesorero']}>
                    <AppLayout><ForumPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/:role/radio" element={
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee', 'tesorero']}>
                    <AppLayout><RadioPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/:role/biblia" element={
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee', 'tesorero']}>
                    <AppLayout><BibliaPage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* Group dashboard routes */}
            <Route path="/:role/grupos/:groupId" element={
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee', 'tesorero']}>
                    <AppLayout><GroupDashboardPage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* Presentación en vivo (Equipo de Bienvenida): pantalla completa,
                sin sidebar, pensada para proyectar durante el culto */}
            <Route path="/presentacion" element={
                <ProtectedRoute allowedRoles={['admin', 'controller']}>
                    <PresentationPage />
                </ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

