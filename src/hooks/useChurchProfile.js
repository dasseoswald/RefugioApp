import { useState, useEffect } from 'react'
import { subscribeChurchProfile, getCurrentChurchId } from '../data/mockData.js'

// Branding en vivo de la iglesia de la sesión actual (o de la que se le pase
// explícitamente, útil en pantallas públicas como /registro/:slug donde
// todavía no hay sesión). Cualquier componente que use esto debe manejar el
// caso church === null (todavía cargando, o Refugio sin fila propia
// sembrada) usando sus valores por defecto actuales — así nada se rompe.
export function useChurchProfile(churchId) {
    const [church, setChurch] = useState(null)
    const id = churchId || getCurrentChurchId()

    useEffect(() => {
        return subscribeChurchProfile(id, setChurch)
    }, [id])

    return church
}
