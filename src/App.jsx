import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
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
import { OPERATIONAL_GROUPS } from './data/mockData.js'

function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#EDEDED]">
            <Sidebar />
            <main className="min-h-screen p-4 pt-20 lg:ml-64 lg:p-8">
                {children}
            </main>
        </div>
    )
}

export default function App() {
    const { isAuthenticated, user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#111111]">
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <Routes>
            {/* Login */}
            <Route path="/login" element={
                isAuthenticated ? <Navigate to={`/${user.role === 'admin' ? 'admin' : user.role === 'controller' ? 'controller' : 'attendee'}`} replace /> : <LoginPage />
            } />
            <Route path="/register" element={
                isAuthenticated ? <Navigate to={`/${user.role === 'admin' ? 'admin' : user.role === 'controller' ? 'controller' : 'attendee'}`} replace /> : <RegisterPage />
            } />

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
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee']}>
                    <AppLayout><PrayerRequestsPage /></AppLayout>
                </ProtectedRoute>
            } />
            <Route path="/:role/eventos" element={
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee']}>
                    <AppLayout><EventsPage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* Group dashboard routes */}
            <Route path="/:role/grupos/:groupId" element={
                <ProtectedRoute allowedRoles={['admin', 'controller', 'attendee']}>
                    <AppLayout><GroupDashboardPage /></AppLayout>
                </ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

