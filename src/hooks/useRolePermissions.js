import { useState, useEffect } from 'react'
import { subscribeRolePermissions } from '../data/mockData.js'

// Espejo en el cliente de la matriz de permisos editable (ver
// firestore.rules: hasDynamicPermission). Solo cubre los permisos que NO
// son un límite de seguridad fijo — Admin y Asistente no dependen de esto.
export function useRolePermissions() {
    const [permissions, setPermissions] = useState({})
    useEffect(() => {
        const unsubscribe = subscribeRolePermissions(setPermissions)
        return unsubscribe
    }, [])
    return permissions
}

export function hasDynamicPermission(permissions, role, key) {
    return !!permissions?.[key]?.[role]
}
