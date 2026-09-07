import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useRolePermissions, hasDynamicPermission } from '../hooks/useRolePermissions.js'

// permissionKey (opcional): además de los allowedRoles fijos, deja pasar a
// quien tenga ese permiso activado en la matriz de Usuarios (ver
// src/hooks/useRolePermissions.js y firestore.rules: hasDynamicPermission).
export default function ProtectedRoute({ children, allowedRoles, permissionKey }) {
    const { user, isAuthenticated, loading } = useAuth()
    const permissions = useRolePermissions()

    if (loading) {
        return null
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    const allowedByRole = !!allowedRoles && allowedRoles.includes(user.role)
    const allowedByPermission = !!permissionKey && hasDynamicPermission(permissions, user.role, permissionKey)

    if ((allowedRoles || permissionKey) && !allowedByRole && !allowedByPermission) {
        const defaultRoutes = { admin: '/admin', controller: '/controller', attendee: '/attendee', tesorero: '/tesorero', bienvenida: '/bienvenida' }
        return <Navigate to={defaultRoutes[user.role] || '/login'} replace />
    }

    return children
}
