import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, isAuthenticated, loading } = useAuth()

    if (loading) {
        return null
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const defaultRoutes = { admin: '/admin', controller: '/controller', attendee: '/attendee' }
        return <Navigate to={defaultRoutes[user.role] || '/login'} replace />
    }

    return children
}
