/**
 * Data layer for Refugio App.
 * Miembros y Usuarios se sincronizan con Cloud Firestore (compartidos entre
 * todos los dispositivos/usuarios). El resto de las "tablas" sigue en
 * memoria + localStorage por ahora, pendiente de migración.
 */
import { db } from '../firebase.js'
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, writeBatch, arrayUnion, query, orderBy, limit } from 'firebase/firestore'

// Ubicación de la iglesia (Un Refugio para la Familia, Coelemu) para el
// registro automático de asistencia por GPS. El radio incluye margen para
// la imprecisión típica del GPS de un celular (10-50m).
export const CHURCH_LOCATION = { lat: -36.4905608, lng: -72.7041862 }
export const CHECKIN_RADIUS_METERS = 100

// Distancia entre dos coordenadas GPS en metros (fórmula de Haversine).
export function distanceInMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000
    const toRad = (deg) => (deg * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
}

// Cada check acumulado (según cantidad de servicios a los que ha asistido un
// visitante) corresponde a una acción presencial que el equipo de bienvenida
// debe realizar: 1=Bienvenida, 2=Folleto, 3=Charla de 5 min, 4=Kit de bienvenida.
export const WELCOME_CHECK_ACTIONS = ['Bienvenida', 'Folleto', 'Charla de 5 minutos', 'Kit de bienvenida']

export const OPERATIONAL_GROUPS = [
    { id: 'escuela-discipulo', name: 'Escuela del Discípulo', field: 'escuela_discipulo', icon: 'BookOpen' },
    { id: 'buena-tierra', name: 'Buena Tierra', field: 'buena_tierra', icon: 'Sprout' },
    { id: 'jovenes', name: 'Jóvenes', field: 'grupo_jovenes', icon: 'Users' },
    { id: 'damas', name: 'Damas', field: 'grupo_damas', icon: 'UserCircle' },
    { id: 'caballeros', name: 'Caballeros', field: 'grupo_caballeros', icon: 'UserSquare' },
    { id: 'ninos', name: 'Niños', field: 'grupo_ninos', icon: 'Baby' },
    { id: 'alabanza', name: 'Alabanza / Música', field: 'grupo_alabanza', icon: 'Music' },
    { id: 'refugios', name: 'Refugios', field: 'grupo_refugios', icon: 'Home' },
]

let MEMBERS = [
    { id: '1', full_name: 'María García López', birth_date: '1985-03-15', gender: 'F', civil_status: 'Casado', member_type: 'Miembro Activo', phone: '+591 789-1234', email: 'maria@iglesia.com', photo_url: null, is_active: true, created_at: '2024-01-10', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 1 },
    { id: '2', full_name: 'Carlos Mendoza Ruiz', birth_date: '1990-07-22', gender: 'M', civil_status: 'Soltero', member_type: 'Servidor', phone: '+591 789-5678', email: 'carlos@iglesia.com', photo_url: null, is_active: true, created_at: '2024-02-15', groups: ['Buena Tierra'], buena_tierra: true },
    { id: '3', full_name: 'Ana Sofía Torrez', birth_date: '1978-11-30', gender: 'F', civil_status: 'Casado', member_type: 'Líder', phone: '+591 789-9012', email: 'ana@iglesia.com', photo_url: null, is_active: true, created_at: '2023-06-20', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 1 },
    { id: '4', full_name: 'Roberto Flores Vega', birth_date: '1995-01-08', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '+591 789-3456', email: 'roberto@iglesia.com', photo_url: null, is_active: true, created_at: '2024-05-01', groups: ['Buena Tierra'], buena_tierra: true },
    { id: '5', full_name: 'Oswald Dassé', birth_date: '', gender: 'M', civil_status: '', member_type: 'Líder', phone: '', email: 'dasse.oswald@gmail.com', photo_url: null, is_active: true, created_at: '2022-01-01', groups: [] },
    { id: '6', full_name: 'Pedro Sánchez Cruz', birth_date: '2000-04-25', gender: 'M', civil_status: 'Soltero', member_type: 'Visitante', phone: '+591 789-2345', email: 'pedro@iglesia.com', photo_url: null, is_active: true, created_at: '2025-01-15', groups: [] },
    { id: '7', full_name: 'Isabel Moreno Luna', birth_date: '1970-12-03', gender: 'F', civil_status: 'Viudo', member_type: 'Miembro Activo', phone: '+591 789-6789', email: 'isabel@iglesia.com', photo_url: null, is_active: false, created_at: '2023-03-10', groups: ['Buena Tierra'], buena_tierra: true },
    { id: '8', full_name: 'Diego Vargas Paz', birth_date: '1992-06-18', gender: 'M', civil_status: 'Casado', member_type: 'Servidor', phone: '+591 789-0123', email: 'diego@iglesia.com', photo_url: null, is_active: true, created_at: '2024-03-20', groups: ['Buena Tierra'], buena_tierra: true },
    { id: '9', full_name: 'Valentina Quispe', birth_date: '1998-02-14', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '+591 789-4567', email: 'valentina@iglesia.com', photo_url: null, is_active: true, created_at: '2024-08-05', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 1 },
    { id: '10', full_name: 'Fernando Chávez Mejía', birth_date: '1982-08-30', gender: 'M', civil_status: 'Casado', member_type: 'Líder', phone: '+591 789-8901', email: 'fernando@iglesia.com', photo_url: null, is_active: true, created_at: '2023-01-15', groups: ['Buena Tierra'], buena_tierra: true },
    { id: '11', full_name: 'Camila Ortega Solís', birth_date: '2003-05-20', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '+591 789-1122', email: 'camila@iglesia.com', photo_url: null, is_active: true, created_at: '2025-01-20', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 1 },
    { id: '12', full_name: 'Javier Linares Bernal', birth_date: '1975-10-09', gender: 'M', civil_status: 'Casado', member_type: 'Miembro Activo', phone: '+591 789-3344', email: 'javier@iglesia.com', photo_url: null, is_active: true, created_at: '2023-09-12', groups: ['Buena Tierra'], buena_tierra: true },

    // ============ Importados desde "Inscripción de escuela de discipulos.xlsx" ============
    { id: '13', full_name: 'Aliso Danai Carrasco Santana', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '+56932377298', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 1 },
    { id: '14', full_name: 'Javiera Constanza Ortiz Flores', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '929870309', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 1 },
    { id: '15', full_name: 'Amalia Soledad Flores Silva', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '99080550', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '16', full_name: 'Bruno Andrés Romero Villegas', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '933138691', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '17', full_name: 'Camila Andrea Rivas Rosales', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '937688323', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '18', full_name: 'Carlos Alberto Chávez Vega', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '984354884', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '19', full_name: 'Carmen Cecilia Cisternas Roa', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '945619195', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '20', full_name: 'Cristian Alejandro Hernández Contreras', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '937688323', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '21', full_name: 'Elizabeth Aguayo Gatica', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '923896289', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '22', full_name: 'Isidora Ailyn Montes Cisternas', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '9 65315158', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '23', full_name: 'Krishna Daniela Muñoz Mieres', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '932091358', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '24', full_name: 'Valentina Fuentealba Tapia', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '+56946676093', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '25', full_name: 'Natalia Luengo', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '26', full_name: 'Monserrat Garcia', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '27', full_name: 'Christopher Alvear', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '28', full_name: 'Paula Hurtado', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '29', full_name: 'Karin Ortiz', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '30', full_name: 'Victor Ortiz', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '31', full_name: 'Aline Ortiz', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '32', full_name: 'Fernanda Reyes', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '33', full_name: 'Carla Ñamcupan', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '34', full_name: 'Antonia Parra Cisterna', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 2 },
    { id: '35', full_name: 'Catalina Juliet Neira Aguayo', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 3 },
    { id: '36', full_name: 'Jazmin Zeballos', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 3 },
    { id: '37', full_name: 'Juan Campos Saavedra', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 3 },
    { id: '38', full_name: 'Darlyn Pizarro Lopez', birth_date: '', gender: '', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 3 },
    { id: '39', full_name: 'Dayris Aguilera Espinoza', birth_date: '', gender: 'F', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 3 },
    { id: '40', full_name: 'Cristóbal Sebastián Salas Salas', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 3 },
    { id: '41', full_name: 'José Luis Zapata', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 3 },
    { id: '42', full_name: 'Mathews Dassé', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', photo_url: null, is_active: true, created_at: '2026-01-15', groups: ['Escuela del Discípulo'], escuela_discipulo: true, escuela_discipulo_level: 3 },
]

function generatePastSundays(count) {
    const sundays = []
    const today = new Date()
    let current = new Date(today)
    current.setDate(current.getDate() - current.getUTCDay()) // Force to Sunday of current week if not already
    for (let i = 0; i < count; i++) {
        sundays.push(new Date(current))
        current.setDate(current.getDate() - 7)
    }
    return sundays
}

const pastSundays = generatePastSundays(14)

let SERVICES = pastSundays.map((date, index) => ({
    id: `svc-${index + 1}`,
    name: index === 0 ? 'Servicio Dominical' : `Servicio Dominical`,
    service_date: date.toISOString().split('T')[0],
    service_type: 'sunday',
    pastor_name: index % 3 === 0 ? 'Pastora Lucía Ramírez' : index % 3 === 1 ? 'Pastor Miguel Ángel' : 'Pastor David Hernández',
    starts_at: '07:00',
    ends_at: '13:00',
    is_active: index === 0,
    created_at: date.toISOString(),
}))

function generateAttendances() {
    const attendances = []
    let idCounter = 1
    const methods = ['manual', 'manual', 'manual', 'facial']
    const activeMembers = MEMBERS.filter(m => m.is_active)

    SERVICES.forEach((service, svcIndex) => {
        const attendeeCount = Math.floor(Math.random() * 4) + (activeMembers.length - 3)
        const shuffled = [...activeMembers].sort(() => Math.random() - 0.5)
        const attendees = shuffled.slice(0, Math.min(attendeeCount, activeMembers.length))

        attendees.forEach((member) => {
            const hour = 7 + Math.floor(Math.random() * 4)
            const minute = Math.floor(Math.random() * 60)
            const checkIn = new Date(service.service_date)
            checkIn.setHours(hour, minute, 0)

            attendances.push({
                id: `att-${idCounter++}`,
                member_id: member.id,
                service_id: service.id,
                check_in_time: checkIn.toISOString(),
                method: methods[Math.floor(Math.random() * methods.length)],
                attendance_type: Math.random() > 0.1 ? 'presencial' : 'online',
                registered_by: null,
                notes: null,
                is_cancelled: false,
            })
        })
    })

    return attendances
}

let ATTENDANCES = generateAttendances()

let USERS = [
    { id: 'user-1', email: 'dasse.oswald@gmail.com', role: 'admin', member_id: '5', name: 'Oswald Dassé', photo_url: null },
    { id: 'user-2', email: 'controller@churchattend.com', role: 'controller', member_id: '3', name: 'Ana Sofía Torrez', photo_url: null },
    { id: 'user-3', email: 'attendee@churchattend.com', role: 'attendee', member_id: '1', name: 'María García', photo_url: null },
]

const SYSTEM_SETTINGS = {
    church_name: 'Iglesia Vida Nueva',
    church_logo: null,
    timezone: 'America/La_Paz',
    service_start_time: '07:00',
    service_end_time: '13:00',
    facial_recognition_enabled: false,
}

export function getMembers() { return [...MEMBERS] }

export function getMemberById(id) { return MEMBERS.find(m => m.id === id) || null }

export function getMemberByEmail(email) {
    if (!email) return null
    return MEMBERS.find(m => m.email && m.email.toLowerCase() === email.toLowerCase()) || null
}

function memberDocRef(id) { return doc(db, 'members', id) }

// Aplica un cambio parcial a un miembro: actualiza la caché local al instante
// (misma UX de siempre) y además lo graba en Firestore para que sea visible
// para todos los demás usuarios/dispositivos.
export function patchMember(id, patch) {
    const index = MEMBERS.findIndex(m => m.id === id)
    if (index === -1) return null
    const updated = { ...MEMBERS[index], ...patch }
    MEMBERS = MEMBERS.map((m, i) => (i === index ? updated : m))
    updateDoc(memberDocRef(id), patch).catch(err => console.error('No se pudo sincronizar el miembro', err))
    return updated
}

export function createMember(data) {
    const id = `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newMember = { ...data, id, email: (data.email || '').trim().toLowerCase(), created_at: new Date().toISOString(), is_active: true }

    // Auto-asignación a múltiples ministerios
    if (data.groups && Array.isArray(data.groups)) {
        data.groups.forEach(groupName => {
            const opGroup = OPERATIONAL_GROUPS.find(g => g.name === groupName)
            if (opGroup) {
                newMember[opGroup.field] = true
                if (opGroup.field === 'escuela_discipulo') newMember.escuela_discipulo_level = 1
            }
        })
    }

    MEMBERS = [...MEMBERS, newMember]
    const { id: _id, ...rest } = newMember
    setDoc(memberDocRef(id), rest).catch(err => console.error('No se pudo guardar el miembro', err))
    return newMember
}

export function updateMember(id, data) {
    const index = MEMBERS.findIndex(m => m.id === id)
    if (index === -1) return null

    const normalizedData = data.email != null ? { ...data, email: data.email.trim().toLowerCase() } : data
    const updatedMember = { ...MEMBERS[index], ...normalizedData }

    // Resetear todas las banderas de grupos operativos
    OPERATIONAL_GROUPS.forEach(g => {
        updatedMember[g.field] = false
    })

    // Auto-asignación a múltiples ministerios
    if (data.groups && Array.isArray(data.groups)) {
        data.groups.forEach(groupName => {
            const opGroup = OPERATIONAL_GROUPS.find(g => g.name === groupName)
            if (opGroup) {
                updatedMember[opGroup.field] = true
                if (opGroup.field === 'escuela_discipulo' && !updatedMember.escuela_discipulo_level) {
                    updatedMember.escuela_discipulo_level = 1
                }
            }
        })
    }

    MEMBERS = MEMBERS.map((m, i) => (i === index ? updatedMember : m))
    const { id: _id, ...rest } = updatedMember
    updateDoc(memberDocRef(id), rest).catch(err => console.error('No se pudo sincronizar el miembro', err))
    return updatedMember
}

export function toggleMemberActive(id) {
    const member = MEMBERS.find(m => m.id === id)
    if (!member) return null
    return patchMember(id, { is_active: !member.is_active })
}

// Borrado permanente de un miembro (solo administradores). Limpia también
// lo que quedaría huérfano: sus asistencias y hoja de vida en Firestore, sus
// inscripciones/asistencias de Escuela del Discípulo y Refugios (aún locales),
// sus notas de perfil, y desvincula (sin borrar) cualquier cuenta de usuario
// que apuntara a este miembro para que no quede rota.
export function deleteMember(id) {
    const index = MEMBERS.findIndex(m => m.id === id)
    if (index === -1) return false
    MEMBERS = MEMBERS.filter(m => m.id !== id)
    deleteDoc(memberDocRef(id)).catch(err => console.error('No se pudo eliminar el miembro', err))

    const attendancesToRemove = ATTENDANCES.filter(a => a.member_id === id)
    ATTENDANCES = ATTENDANCES.filter(a => a.member_id !== id)
    attendancesToRemove.forEach(a => deleteDoc(attendanceDocRef(a.id)).catch(err => console.error('No se pudo eliminar una asistencia', err)))

    if (MEMBER_PROFILES[id]) {
        delete MEMBER_PROFILES[id]
        deleteDoc(doc(db, 'memberProfiles', id)).catch(err => console.error('No se pudo eliminar la hoja de vida', err))
    }

    for (let i = ESCUELA_ENROLLMENTS.length - 1; i >= 0; i--) {
        if (ESCUELA_ENROLLMENTS[i].member_id === id) ESCUELA_ENROLLMENTS.splice(i, 1)
    }
    for (let i = ESCUELA_ATTENDANCES.length - 1; i >= 0; i--) {
        if (ESCUELA_ATTENDANCES[i].member_id === id) ESCUELA_ATTENDANCES.splice(i, 1)
    }
    for (let i = REFUGIO_ENROLLMENTS.length - 1; i >= 0; i--) {
        if (REFUGIO_ENROLLMENTS[i].member_id === id) REFUGIO_ENROLLMENTS.splice(i, 1)
    }
    for (let i = PROFILE_NOTES.length - 1; i >= 0; i--) {
        if (PROFILE_NOTES[i].member_id === id) {
            const [removed] = PROFILE_NOTES.splice(i, 1)
            deleteDoc(doc(db, 'profileNotes', removed.id)).catch(err => console.error('No se pudo borrar la nota', err))
        }
    }

    const linkedUsers = USERS.filter(u => u.member_id === id)
    USERS = USERS.map(u => (u.member_id === id ? { ...u, member_id: null } : u))
    linkedUsers.forEach(u => updateDoc(userDocRef(u.id), { member_id: null }).catch(err => console.error('No se pudo desvincular el usuario', err)))

    return true
}

export function getServices() { return [...SERVICES] }

function localDateStr(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Próximas "ocasiones" de jueves y domingo, calculadas directamente por
// fecha — NO dependen de que exista un registro creado en el módulo
// Servicios. Cada ocasión usa un id determinístico ("2026-08-06_thursday")
// para que el calendario/repertorio de un ministerio (ej. Alabanza) sea un
// sistema aparte, independiente de si alguien creó el servicio formal o no.
export function getUpcomingAlabanzaOccasions(count = 8) {
    const occasions = []
    const current = new Date()
    current.setHours(0, 0, 0, 0)
    while (occasions.length < count) {
        const day = current.getDay() // 0=domingo, 4=jueves
        if (day === 0 || day === 4) {
            const dateStr = localDateStr(current)
            const type = day === 0 ? 'sunday' : 'thursday'
            occasions.push({ id: `${dateStr}_${type}`, service_date: dateStr, service_type: type })
        }
        current.setDate(current.getDate() + 1)
    }
    return occasions
}

// Cada tipo de servicio (domingo, jueves) tiene su propio servicio "activo",
// independiente del otro. Si no se pide un tipo puntual, se adivina según el
// día de hoy (domingo=0, jueves=4); fuera de esos días, cae al comportamiento
// anterior (cualquier servicio activo).
//
// Un service_type ausente se trata como 'sunday' (igual que en
// ServicesPage.jsx) — servicios creados antes de que existiera ese campo no
// lo tienen guardado. Sin este default, un domingo "sin tipo" nunca matchea
// expectedType==='sunday', cae al fallback de "cualquier servicio activo" y
// puede devolver por error un jueves activo en su lugar (jueves y domingo
// pueden estar activos al mismo tiempo, así que ese fallback es ambiguo).
export function getActiveService(type) {
    if (type) return SERVICES.find(s => s.is_active && (s.service_type || 'sunday') === type) || null
    const day = new Date().getDay()
    const expectedType = day === 0 ? 'sunday' : day === 4 ? 'thursday' : null
    if (expectedType) {
        const match = SERVICES.find(s => s.is_active && (s.service_type || 'sunday') === expectedType)
        if (match) return match
    }
    return SERVICES.find(s => s.is_active) || SERVICES[0]
}

function serviceDocRef(id) { return doc(db, 'services', id) }
function attendanceDocRef(id) { return doc(db, 'attendances', id) }

export function createService(data) {
    const id = `svc-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newService = { service_type: 'sunday', ...data, id, is_active: false, created_at: new Date().toISOString() }
    SERVICES = [...SERVICES, newService]
    const { id: _id, ...rest } = newService
    setDoc(serviceDocRef(id), rest).catch(err => console.error('No se pudo guardar el servicio', err))
    return newService
}

export function updateService(id, data) {
    const index = SERVICES.findIndex(s => s.id === id)
    if (index === -1) return null
    const updated = { ...SERVICES[index], ...data }
    SERVICES = SERVICES.map((s, i) => (i === index ? updated : s))
    updateDoc(serviceDocRef(id), data).catch(err => console.error('No se pudo sincronizar el servicio', err))
    return updated
}

// Activar un servicio solo desactiva otros de su MISMO tipo — un domingo
// activo y un jueves activo pueden coexistir sin pisarse.
export function toggleServiceActive(id) {
    const target = SERVICES.find(s => s.id === id)
    if (!target) return null
    const nextActive = !target.is_active
    const targetType = target.service_type || 'sunday'
    const batch = writeBatch(db)
    SERVICES = SERVICES.map(s => {
        // Un service_type ausente se trata como 'sunday' (igual que en
        // getActiveService) — si no, dos servicios del mismo tipo donde uno
        // no tiene el campo guardado no se reconocen como del mismo tipo, y
        // ambos pueden quedar activos a la vez sin que este toggle los
        // desactive correctamente entre sí.
        if ((s.service_type || 'sunday') !== targetType) return s
        const isActive = (s.id === id) ? nextActive : false
        if (isActive === s.is_active) return s
        batch.update(serviceDocRef(s.id), { is_active: isActive })
        return { ...s, is_active: isActive }
    })
    batch.commit().catch(err => console.error('No se pudo sincronizar la activación del servicio', err))
    return SERVICES.find(s => s.id === id)
}

// Borra un servicio y sus asistencias asociadas (sin ellas, quedarían
// asistencias "huérfanas" apuntando a un service_id que ya no existe).
// No borra peticiones de oración/gratitud ni datos de Alabanza ligados a
// ese servicio — quedan con su service_id, mostrados como corresponda en
// el resto de la app (ej. filtro "Todas las canciones" en Repertorio).
export function deleteService(id) {
    const target = SERVICES.find(s => s.id === id)
    if (!target) return false

    SERVICES = SERVICES.filter(s => s.id !== id)
    deleteDoc(serviceDocRef(id)).catch(err => console.error('No se pudo borrar el servicio', err))

    const attendancesToRemove = ATTENDANCES.filter(a => a.service_id === id)
    ATTENDANCES = ATTENDANCES.filter(a => a.service_id !== id)
    attendancesToRemove.forEach(a => {
        deleteDoc(attendanceDocRef(a.id)).catch(err => console.error('No se pudo borrar una asistencia', err))
    })

    return true
}

export function getAttendances() { return [...ATTENDANCES] }

export function getAttendancesByService(serviceId) {
    return ATTENDANCES.filter(a => a.service_id === serviceId && !a.is_cancelled)
}

export function getAttendancesByMember(memberId) {
    return ATTENDANCES.filter(a => a.member_id === memberId && !a.is_cancelled)
}

export function registerAttendance(memberId, serviceId, method = 'manual', registeredBy = null) {
    const existing = ATTENDANCES.find(a => a.member_id === memberId && a.service_id === serviceId && !a.is_cancelled)
    if (existing) return { error: 'Ya registrado en este servicio' }

    const cancelledIndex = ATTENDANCES.findIndex(a => a.member_id === memberId && a.service_id === serviceId && a.is_cancelled)
    if (cancelledIndex !== -1) {
        const reactivated = { ...ATTENDANCES[cancelledIndex], is_cancelled: false, notes: null, check_in_time: new Date().toISOString() }
        ATTENDANCES = ATTENDANCES.map((a, i) => (i === cancelledIndex ? reactivated : a))
        updateDoc(attendanceDocRef(reactivated.id), { is_cancelled: false, notes: null, check_in_time: reactivated.check_in_time })
            .catch(err => console.error('No se pudo sincronizar la asistencia', err))
        return { data: reactivated }
    }

    const id = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const attendance = {
        id,
        member_id: memberId,
        service_id: serviceId,
        check_in_time: new Date().toISOString(),
        method,
        attendance_type: 'presencial',
        registered_by: registeredBy,
        notes: null,
        is_cancelled: false,
    }
    ATTENDANCES = [...ATTENDANCES, attendance]
    const { id: _id, ...rest } = attendance
    setDoc(attendanceDocRef(id), rest).catch(err => console.error('No se pudo guardar la asistencia', err))
    return { data: attendance }
}

export function cancelAttendance(id, reason) {
    const idx = ATTENDANCES.findIndex(a => a.id === id)
    if (idx === -1) return false
    ATTENDANCES = ATTENDANCES.filter(a => a.id !== id)
    deleteDoc(attendanceDocRef(id)).catch(err => console.error('No se pudo eliminar la asistencia', err))
    return true
}

// Visitantes que esta semana (últimos 7 días) alcanzaron un nuevo check de
// bienvenida (su asistencia N-ésima, donde N es su conteo actual de checks),
// para que el Controlador sepa a quién le corresponde qué acción presencial.
export function getVisitorsDueWelcomeThisWeek() {
    const now = Date.now()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    return MEMBERS
        .filter(m => m.member_type === 'Visitante')
        .map(member => {
            const attendances = getAttendancesByMember(member.id)
                .slice()
                .sort((a, b) => new Date(a.check_in_time) - new Date(b.check_in_time))
            const checks = Math.min(attendances.length, WELCOME_CHECK_ACTIONS.length)
            if (checks === 0) return null
            const achievedAt = attendances[checks - 1].check_in_time
            if (now - new Date(achievedAt).getTime() > sevenDaysMs) return null
            return { member, checks, action: WELCOME_CHECK_ACTIONS[checks - 1], achievedAt }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt))
}

// Visitantes cuya PRIMERA asistencia registrada ocurrió en el servicio
// dado — para la presentación de bienvenida y el panel de consulta rápida
// del Equipo de Bienvenida durante el culto. Si ya tenían asistencias
// previas (no es su primera vez), no aparecen aquí aunque hayan asistido.
export function getNewVisitorsForService(serviceId) {
    if (!serviceId) return []
    return getAttendancesByService(serviceId)
        .map(att => {
            const member = getMemberById(att.member_id)
            if (!member || member.member_type !== 'Visitante') return null
            const allAttendances = getAttendancesByMember(member.id)
            const isFirstEver = allAttendances.length === 1 && allAttendances[0].service_id === serviceId
            return isFirstEver ? member : null
        })
        .filter(Boolean)
}

export function getNewVisitorsForActiveService() {
    const activeService = getActiveService()
    return activeService ? getNewVisitorsForService(activeService.id) : []
}

export function findAttendanceByMemberAndService(memberId, serviceId) {
    return ATTENDANCES.find(a => a.member_id === memberId && a.service_id === serviceId && !a.is_cancelled) || null
}

export function getUsers() { return [...USERS] }

export function getUserById(id) { return USERS.find(u => u.id === id) || null }

export function getUserByEmail(email) {
    if (!email) return null
    return USERS.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) || null
}

function userDocRef(id) { return doc(db, 'users', id) }

export function createUser(data) {
    const email = (data.email || '').trim().toLowerCase()
    if (getUserByEmail(email)) {
        return { error: 'Ya existe un usuario con ese correo electrónico' }
    }
    const newUser = {
        id: `user-${Date.now()}`,
        email,
        role: data.role,
        name: data.name,
        member_id: data.member_id || null,
        photo_url: null,
    }
    USERS = [...USERS, newUser]
    const { id, ...rest } = newUser
    setDoc(userDocRef(id), rest).catch(err => console.error('No se pudo guardar el usuario', err))
    return { data: newUser }
}

// ---- Presencia ("quién está conectado ahora") ----
// Mientras la app está abierta, AuthContext llama a esto periódicamente para
// marcar la última vez que el usuario estuvo activo. Se considera "en línea"
// a quien tenga un latido dentro de los últimos ONLINE_THRESHOLD_MS.
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000

export function updateLastSeen(userId) {
    const index = USERS.findIndex(u => u.id === userId)
    if (index === -1) return
    const now = new Date().toISOString()
    const updated = { ...USERS[index], last_seen: now }
    USERS = USERS.map((u, i) => (i === index ? updated : u))
    updateDoc(userDocRef(userId), { last_seen: now }).catch(err => console.error('No se pudo actualizar la presencia', err))
}

export function isUserOnline(user) {
    if (!user?.last_seen) return false
    return Date.now() - new Date(user.last_seen).getTime() < ONLINE_THRESHOLD_MS
}

// ---- Chats en vivo (en tiempo real vía Firestore) ----
// A diferencia del chat por grupo (que aún vive en localStorage con polling),
// estos se sincronizan directo con Firestore para que los mensajes lleguen
// de inmediato a todos los conectados, sin refrescar. Cada canal es una
// colección de Firestore independiente (mismo esquema de mensaje).
function createChatChannel(collectionName) {
    return {
        listen(callback) {
            const q = query(collection(db, collectionName), orderBy('created_at', 'asc'), limit(200))
            return onSnapshot(q, (snap) => {
                callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            }, (err) => console.error(`Error sincronizando el chat (${collectionName})`, err))
        },
        send({ content, sender_id, sender_name, sender_photo, media_url, media_type }) {
            const messagesRef = collection(db, collectionName)
            setDoc(doc(messagesRef), {
                content: content || '',
                sender_id,
                sender_name,
                sender_photo: sender_photo || null,
                media_url: media_url || null,
                media_type: media_type || null,
                created_at: new Date().toISOString(),
            }).catch(err => console.error(`No se pudo enviar el mensaje (${collectionName})`, err))
        },
    }
}

const generalChat = createChatChannel('generalMessages')
export const listenToGeneralMessages = generalChat.listen
export const sendGeneralMessage = generalChat.send

const radioChat = createChatChannel('radioMessages')
export const listenToRadioMessages = radioChat.listen
export const sendRadioMessage = radioChat.send

// ---- Foro abierto (preguntas de la congregación, anónimas o no) ----
// Igual que los chats en vivo, se sincroniza directo con Firestore para que
// las preguntas y respuestas aparezcan de inmediato a todos. Las respuestas
// viven en una colección plana aparte (sin subcolecciones, siguiendo el
// mismo patrón que el resto de la app) y se filtran por post_id en memoria.
export function listenToForumPosts(callback) {
    const q = query(collection(db, 'forumPosts'), orderBy('created_at', 'desc'), limit(200))
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, (err) => console.error('Error sincronizando el foro', err))
}

export function createForumPost({ content, authorId, authorName, isAnonymous }) {
    const postsRef = collection(db, 'forumPosts')
    return setDoc(doc(postsRef), {
        content,
        author_id: authorId,
        author_name: isAnonymous ? null : authorName,
        is_anonymous: !!isAnonymous,
        created_at: new Date().toISOString(),
    }).catch(err => console.error('No se pudo publicar la pregunta', err))
}

export function deleteForumPost(id) {
    return deleteDoc(doc(db, 'forumPosts', id)).catch(err => console.error('No se pudo eliminar la pregunta', err))
}

export function listenToForumReplies(callback) {
    const q = query(collection(db, 'forumReplies'), orderBy('created_at', 'asc'), limit(500))
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, (err) => console.error('Error sincronizando respuestas del foro', err))
}

export function createForumReply({ postId, content, authorId, authorName, isAnonymous }) {
    const repliesRef = collection(db, 'forumReplies')
    return setDoc(doc(repliesRef), {
        post_id: postId,
        content,
        author_id: authorId,
        author_name: isAnonymous ? null : authorName,
        is_anonymous: !!isAnonymous,
        created_at: new Date().toISOString(),
    }).catch(err => console.error('No se pudo publicar la respuesta', err))
}

export function deleteForumReply(id) {
    return deleteDoc(doc(db, 'forumReplies', id)).catch(err => console.error('No se pudo eliminar la respuesta', err))
}

// Guarda el token de notificaciones push (FCM) del dispositivo actual en el
// usuario, para que la función en la nube pueda enviarle notificaciones.
// Un mismo usuario puede tener varios tokens (uno por dispositivo/navegador).
export function saveFcmToken(userId, token) {
    const index = USERS.findIndex(u => u.id === userId)
    if (index === -1) return
    const existingTokens = USERS[index].fcm_tokens || []
    if (existingTokens.includes(token)) return
    const updated = { ...USERS[index], fcm_tokens: [...existingTokens, token] }
    USERS = USERS.map((u, i) => (i === index ? updated : u))
    updateDoc(userDocRef(userId), { fcm_tokens: arrayUnion(token) }).catch(err => console.error('No se pudo guardar el token de notificaciones', err))
}

// ---- Vinculación de cuentas Firebase (Google / correo-contraseña) ----
// Cuando alguien inicia sesión por primera vez con una cuenta real (Google o
// registro con correo), se busca un usuario existente por correo (p. ej. las
// cuentas de administrador/controlador ya definidas). Si no existe, se busca
// o crea el miembro correspondiente y se genera un usuario nuevo con rol
// "attendee" por defecto; el administrador puede luego cambiarle el rol
// desde la sección Usuarios.
// ---- Espejo uid -> rol para las reglas de seguridad de Firestore ----
// Los documentos de "users" están indexados por un id interno de la app
// (p. ej. "user-1730..."), no por el uid de Firebase Auth, así que las
// reglas de seguridad no pueden usar get(/databases/.../users/$(uid)) para
// saber el rol de quien hace la petición. Por eso existe "userRoles", una
// colección aparte indexada por uid, que solo guarda el rol — la usan las
// reglas para restringir Finanzas (ofrendas/diezmos) al rol tesorero, sin
// excepción ni siquiera para administradores.
//
// El cliente YA NO escribe esta colección directamente (antes lo hacía
// aquí, y esa escritura sin restricción era justamente la falla de
// seguridad que le permitía a cualquier usuario autoasignarse el rol
// Tesorero). Ahora se mantiene sincronizada desde el backend: la función
// syncUserRoleOnUserWrite la actualiza automáticamente cada vez que cambia
// el documento de "users" (alta de cuenta nueva o cuenta antigua que recién
// consigue su auth_uid), y la función setUserRole la actualiza cuando un
// administrador cambia el rol de alguien (ver src/pages/admin/UsersPage.jsx).

export function createOrGetUserForFirebaseAccount({ uid, email: rawEmail, displayName, photoURL }) {
    const email = (rawEmail || '').trim().toLowerCase()
    const existingUser = getUserByEmail(email)
    if (existingUser) {
        const patch = {}
        if (photoURL && existingUser.photo_url !== photoURL) patch.photo_url = photoURL
        if (uid && existingUser.auth_uid !== uid) patch.auth_uid = uid
        if (Object.keys(patch).length > 0) {
            const updated = { ...existingUser, ...patch }
            USERS = USERS.map(u => (u.id === existingUser.id ? updated : u))
            updateDoc(userDocRef(existingUser.id), patch).catch(err => console.error('No se pudo sincronizar el usuario', err))
            return updated
        }
        return { ...existingUser }
    }

    let member = getMemberByEmail(email)
    if (!member) {
        member = createMember({
            full_name: displayName || email,
            email,
            phone: '',
            birth_date: '',
            gender: '',
            civil_status: '',
            member_type: 'Visitante',
            photo_url: photoURL || null,
            groups: [],
        })
    }

    const newUser = {
        id: `user-${Date.now()}`,
        email,
        role: 'attendee',
        name: displayName || member.full_name,
        member_id: member.id,
        photo_url: photoURL || null,
        auth_uid: uid || null,
    }
    USERS = [...USERS, newUser]
    const { id, ...rest } = newUser
    setDoc(userDocRef(id), rest).catch(err => console.error('No se pudo guardar el usuario', err))
    return { ...newUser }
}

// Nota: para cambiar el ROL de una cuenta que ya inició sesión, usar la
// función en la nube setUserRole en vez de esto (ver UsersPage.jsx) — este
// helper sigue sirviendo para el resto de los campos del perfil (nombre,
// vínculo a miembro, tokens, etc.).
export function updateUserProfile(userId, data) {
    const index = USERS.findIndex(u => u.id === userId)
    if (index === -1) return null
    const updated = { ...USERS[index], ...data }
    USERS = USERS.map((u, i) => (i === index ? updated : u))
    updateDoc(userDocRef(userId), data).catch(err => console.error('No se pudo sincronizar el usuario', err))
    return { ...updated }
}

export function getSystemSettings() { return { ...SYSTEM_SETTINGS } }

export function updateSystemSettings(data) {
    Object.assign(SYSTEM_SETTINGS, data)
    return { ...SYSTEM_SETTINGS }
}

export function getAttendanceStats() {
    const activeService = getActiveService()
    const todayAttendances = getAttendancesByService(activeService.id)
    const lastWeekService = SERVICES[1]
    const lastWeekAttendances = lastWeekService ? getAttendancesByService(lastWeekService.id) : []

    const totalToday = todayAttendances.length
    const totalLastWeek = lastWeekAttendances.length
    const percentChange = totalLastWeek > 0 ? Math.round(((totalToday - totalLastWeek) / totalLastWeek) * 100) : 0

    const activeMembers = MEMBERS.filter(m => m.is_active).length
    const newMembersThisMonth = MEMBERS.filter(m => {
        const created = new Date(m.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length

    return { totalToday, totalLastWeek, percentChange, activeMembers, newMembersThisMonth }
}

export function getMonthlyTrend() {
    const months = []
    const now = new Date()

    for (let i = 2; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = month.toLocaleDateString('es', { month: 'short', year: 'numeric' })
        const monthServices = SERVICES.filter(s => {
            const d = new Date(s.service_date)
            return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
        })
        const weeklyData = monthServices.map(s => {
            const atts = getAttendancesByService(s.id)
            return atts.length
        })
        months.push({ month: monthName, weeklyData, total: weeklyData.reduce((a, b) => a + b, 0), average: weeklyData.length > 0 ? Math.round(weeklyData.reduce((a, b) => a + b, 0) / weeklyData.length) : 0 })
    }

    return months
}

// ============== ESCUELA DEL DISCÍPULO ==============

// Temario real, extraído del índice de cada guía del discípulo (PDF en /Escuela del discipulo)
export const ESCUELA_CURRICULUM = {
    1: [
        { number: 1, title: 'El corazón y propósito de la Biblia' },
        { number: 2, title: '¿Cómo obtuvimos la Biblia?' },
        { number: 3, title: 'Conociendo mi Biblia: Antiguo Testamento' },
        { number: 4, title: 'Conociendo mi Biblia: Nuevo Testamento' },
        { number: 5, title: 'Usando mi Biblia' },
        { number: 6, title: 'Siendo hacedores de su Palabra' },
        { number: 7, title: 'Ser un discípulo' },
        { number: 8, title: '¿Qué caracteriza la vida de un cristiano?' },
    ],
    2: [
        { number: 1, title: 'Pecado' },
        { number: 2, title: 'Arrepentimiento' },
        { number: 3, title: 'Salvación' },
        { number: 4, title: 'Fe' },
        { number: 5, title: 'Ser hijo de Dios: derechos y deberes' },
        { number: 6, title: 'Persona y obra del Espíritu Santo' },
        { number: 7, title: 'La iglesia, el cuerpo de Cristo' },
        { number: 8, title: 'Mayordomía cristiana' },
        { number: 9, title: 'Bautismo y Santa Cena' },
        { number: 10, title: 'Oración e Imposición de Manos' },
        { number: 11, title: 'Ayuno y tiempo devocional' },
        { number: 12, title: 'Alabanza y Adoración' },
        { number: 13, title: 'La familia cristiana' },
        { number: 14, title: 'La influencia social de la Iglesia' },
        { number: 15, title: 'El propósito final de Dios' },
        { number: 16, title: 'La Gran Comisión' },
    ],
    3: [
        { number: 1, title: 'Raíces Profundas' },
        { number: 2, title: 'La Reforma Protestante y su Legado' },
        { number: 3, title: 'Surgimiento del Movimiento Metodista' },
        { number: 4, title: 'Inicios de la Iglesia Metodista Libre' },
        { number: 5, title: 'Doctrina Central del Metodismo Libre I: Artículos de Fe' },
        { number: 6, title: 'Doctrina Central del Metodismo Libre II: Salvación' },
        { number: 7, title: 'Doctrina Central del Metodismo Libre III: Gracia y Santificación' },
        { number: 8, title: '¿Cómo Interpretamos la Biblia? I' },
        { number: 9, title: '¿Cómo Interpretamos la Biblia? II' },
        { number: 10, title: 'Organización Metodista Libre' },
        { number: 11, title: 'Libro de Disciplina' },
        { number: 12, title: 'El Estilo Metodista Libre' },
        { number: 13, title: 'Principios Prácticos Metodistas Libre' },
        { number: 14, title: 'La Conciencia Metodista Libre' },
        { number: 15, title: 'Visión y Misión Metodista Libre' },
        { number: 16, title: 'La Esencia de Nuestra Iglesia – Un Refugio para la Familia' },
    ],
}

export const ESCUELA_GUIDE_URLS = {
    1: '/guias/nivel-1.pdf',
    2: '/guias/nivel-2.pdf',
    3: '/guias/nivel-3.pdf',
}

function generateEscuelaClasses() {
    const classes = [];
    let idCounter = 1;

    // We'll distribute dates going backward from today so they look realistic
    const today = new Date();
    today.setDate(today.getDate() - today.getDay() - 1); // Last Saturday

    Object.entries(ESCUELA_CURRICULUM).forEach(([levelStr, curriculumClasses]) => {
        const level = parseInt(levelStr)
        curriculumClasses.forEach(({ number, title }) => {
            const classDate = new Date(today);
            classDate.setDate(classDate.getDate() - (40 - idCounter) * 7); // Distribute backwards

            classes.push({
                id: `class-${idCounter++}`,
                level,
                unit: Math.ceil(number / 4),
                class_number: number,
                title: `Clase ${number}`,
                topic: title,
                class_date: classDate.toISOString().split('T')[0],
                starts_at: '09:00',
                ends_at: '11:00',
                teacher: number % 2 === 0 ? 'Pastora Lucía Ramírez' : 'Pastor David Hernández',
                created_at: classDate.toISOString()
            });
        })
    });
    return classes;
}

const ESCUELA_CLASSES = generateEscuelaClasses();

const ESCUELA_ATTENDANCES = []

// Pre-enroll members con levels (incluye importados desde "Inscripción de escuela de discipulos.xlsx")
const ESCUELA_ENROLLMENTS = [
    { member_id: '1', level: 1 },
    { member_id: '2', level: 2 },
    { member_id: '3', level: 3 },
    { member_id: '4', level: 1 },
    { member_id: '9', level: 2 },
    { member_id: '10', level: 3 },
    { member_id: '13', level: 1 },
    { member_id: '14', level: 1 },
    { member_id: '15', level: 2 },
    { member_id: '16', level: 2 },
    { member_id: '17', level: 2 },
    { member_id: '18', level: 2 },
    { member_id: '19', level: 2 },
    { member_id: '20', level: 2 },
    { member_id: '21', level: 2 },
    { member_id: '22', level: 2 },
    { member_id: '23', level: 2 },
    { member_id: '24', level: 2 },
    { member_id: '25', level: 2 },
    { member_id: '26', level: 2 },
    { member_id: '27', level: 2 },
    { member_id: '28', level: 2 },
    { member_id: '29', level: 2 },
    { member_id: '30', level: 2 },
    { member_id: '31', level: 2 },
    { member_id: '32', level: 2 },
    { member_id: '33', level: 2 },
    { member_id: '34', level: 2 },
    { member_id: '35', level: 3 },
    { member_id: '36', level: 3 },
    { member_id: '37', level: 3 },
    { member_id: '38', level: 3 },
    { member_id: '39', level: 3 },
    { member_id: '40', level: 3 },
    { member_id: '41', level: 3 },
    { member_id: '42', level: 3 },
]

// Generate some past attendance for enrolled members
let escAttIdCounter = 1
ESCUELA_ENROLLMENTS.forEach(enrollment => {
    const memberClasses = ESCUELA_CLASSES.filter(c => c.level === enrollment.level)
    memberClasses.forEach(cls => {
        if (Math.random() > 0.3) {
            ESCUELA_ATTENDANCES.push({
                id: `esc-att-${escAttIdCounter++}`,
                member_id: enrollment.member_id,
                class_id: cls.id,
                check_in_time: new Date(cls.class_date + 'T09:15:00').toISOString(),
                created_at: new Date(cls.class_date + 'T09:15:00').toISOString(),
            })
        }
    })
})

// Mark enrolled members in MEMBERS
ESCUELA_ENROLLMENTS.forEach(e => {
    const member = MEMBERS.find(m => m.id === e.member_id)
    if (member) {
        member.escuela_discipulo = true
        member.escuela_discipulo_level = e.level
    }
})

export function getEscuelaClasses(level) {
    if (level) return ESCUELA_CLASSES.filter(c => c.level === level)
    return [...ESCUELA_CLASSES]
}

export function createEscuelaClass(data) {
    const newClass = { ...data, id: `class-${ESCUELA_CLASSES.length + 1}`, created_at: new Date().toISOString() }
    ESCUELA_CLASSES.push(newClass)
    return newClass
}

export function getEscuelaEnrollments() { return [...ESCUELA_ENROLLMENTS] }

export function enrollInEscuela(memberId, level) {
    const existing = ESCUELA_ENROLLMENTS.find(e => e.member_id === memberId)
    if (existing) {
        existing.level = level
    } else {
        ESCUELA_ENROLLMENTS.push({ member_id: memberId, level })
    }
    patchMember(memberId, { escuela_discipulo: true, escuela_discipulo_level: level })
    return { member_id: memberId, level }
}

export function removeFromEscuela(memberId) {
    const idx = ESCUELA_ENROLLMENTS.findIndex(e => e.member_id === memberId)
    if (idx !== -1) ESCUELA_ENROLLMENTS.splice(idx, 1)
    patchMember(memberId, { escuela_discipulo: false, escuela_discipulo_level: null })
}

export function getEscuelaAttendances(classId) {
    return ESCUELA_ATTENDANCES.filter(a => a.class_id === classId)
}

export function getEscuelaAttendancesByMember(memberId) {
    return ESCUELA_ATTENDANCES.filter(a => a.member_id === memberId)
}

export function registerEscuelaAttendance(memberId, classId, modality = 'presencial') {
    const existing = ESCUELA_ATTENDANCES.find(a => a.member_id === memberId && a.class_id === classId)
    if (existing) return { error: 'Ya registrado en esta clase' }

    const attendance = {
        id: `esc-att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        member_id: memberId,
        class_id: classId,
        modality,
        check_in_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
    }
    ESCUELA_ATTENDANCES.push(attendance)
    return { data: attendance }
}

// ============== REFUGIOS (GRUPOS PEQUEÑOS / CÉLULAS) ==============

const REFUGIOS = [
    { id: 'refugio-1', name: 'Refugio Vida Nueva', leader_member_id: '3', meeting_day: 'Miércoles', meeting_time: '19:00', location: 'Casa de la familia Torrez', created_at: new Date().toISOString() },
]

const REFUGIO_ENROLLMENTS = [
    { member_id: '3', refugio_id: 'refugio-1' },
]

// Sincronizar bandera en MEMBERS para quienes ya están en un refugio
REFUGIO_ENROLLMENTS.forEach(e => {
    const member = MEMBERS.find(m => m.id === e.member_id)
    if (member) member.grupo_refugios = true
})

export function getRefugios() { return [...REFUGIOS] }

export function getRefugioById(id) { return REFUGIOS.find(r => r.id === id) || null }

export function createRefugio(data) {
    const newRefugio = { ...data, id: `refugio-${Date.now()}`, created_at: new Date().toISOString() }
    REFUGIOS.push(newRefugio)
    return newRefugio
}

export function updateRefugio(id, data) {
    const index = REFUGIOS.findIndex(r => r.id === id)
    if (index === -1) return null
    REFUGIOS[index] = { ...REFUGIOS[index], ...data }
    return REFUGIOS[index]
}

export function deleteRefugio(id) {
    const index = REFUGIOS.findIndex(r => r.id === id)
    if (index === -1) return false
    REFUGIOS.splice(index, 1)

    for (let i = REFUGIO_ENROLLMENTS.length - 1; i >= 0; i--) {
        if (REFUGIO_ENROLLMENTS[i].refugio_id === id) {
            patchMember(REFUGIO_ENROLLMENTS[i].member_id, { grupo_refugios: false })
            REFUGIO_ENROLLMENTS.splice(i, 1)
        }
    }
    return true
}

export function getRefugioEnrollments() { return [...REFUGIO_ENROLLMENTS] }

export function enrollInRefugio(memberId, refugioId) {
    const existing = REFUGIO_ENROLLMENTS.find(e => e.member_id === memberId)
    if (existing) {
        existing.refugio_id = refugioId
    } else {
        REFUGIO_ENROLLMENTS.push({ member_id: memberId, refugio_id: refugioId })
    }
    patchMember(memberId, { grupo_refugios: true })
    return { member_id: memberId, refugio_id: refugioId }
}

export function removeFromRefugio(memberId) {
    const idx = REFUGIO_ENROLLMENTS.findIndex(e => e.member_id === memberId)
    if (idx !== -1) REFUGIO_ENROLLMENTS.splice(idx, 1)
    patchMember(memberId, { grupo_refugios: false })
}

export function getMemberRefugio(memberId) {
    const enrollment = REFUGIO_ENROLLMENTS.find(e => e.member_id === memberId)
    if (!enrollment) return null
    const refugio = REFUGIOS.find(r => r.id === enrollment.refugio_id)
    if (!refugio) return null
    const leader = refugio.leader_member_id ? MEMBERS.find(m => m.id === refugio.leader_member_id) : null
    return { refugio, leaderName: leader ? leader.full_name : null }
}

// ============== HOJA DE VIDA (MEMBER PROFILES) ==============

let MEMBER_PROFILES = {
    '1': { member_id: '1', address: 'Av. Busch #234, Zona Central', occupation: 'Profesora', ministry: 'Alabanza', baptized: true, baptism_date: '2010-05-20', family_info: 'Esposo: Juan García, Hijos: Pablo (12), Sofía (8)', emergency_contact: 'Juan García', emergency_phone: '+591 789-4321', blood_type: 'O+', allergies: 'Ninguna' },
    '2': { member_id: '2', address: 'Calle Litoral #78, Zona Sur', occupation: 'Ingeniero de Sistemas', ministry: 'Multimedia', baptized: true, baptism_date: '2015-11-10', family_info: 'Soltero', emergency_contact: 'Rosa Ruiz', emergency_phone: '+591 789-8765', blood_type: 'A+', allergies: 'Penicilina' },
    '3': { member_id: '3', address: 'Av. 6 de Agosto #456', occupation: 'Contadora', ministry: 'Liderazgo', baptized: true, baptism_date: '2005-03-15', family_info: 'Esposo: Marcos Torrez, Hija: Camila (15)', emergency_contact: 'Marcos Torrez', emergency_phone: '+591 789-1111', blood_type: 'B+', allergies: 'Ninguna' },
}

let PROFILE_NOTES = [
    { id: 'note-1', member_id: '1', author: 'Lucía Ramírez', content: 'Interesada en participar en el ministerio de niños a partir del próximo trimestre.', created_at: '2025-12-15T10:30:00' },
    { id: 'note-2', member_id: '1', author: 'Ana Sofía Torrez', content: 'Completó el curso de liderazgo nivel 1. Excelente participación.', created_at: '2026-01-20T14:00:00' },
    { id: 'note-3', member_id: '2', author: 'Lucía Ramírez', content: 'Encargado del equipo de sonido para servicios dominicales.', created_at: '2026-02-10T09:15:00' },
    { id: 'note-4', member_id: '3', author: 'Lucía Ramírez', content: 'Líder de célula Esperanza. Reuniones semanales los miércoles.', created_at: '2025-11-05T16:45:00' },
]

const EMPTY_PROFILE = { address: '', occupation: '', ministry: '', baptized: false, baptism_date: '', family_info: '', emergency_contact: '', emergency_phone: '', blood_type: '', allergies: '' }

export function getMemberProfile(memberId) {
    return MEMBER_PROFILES[memberId] ? { ...MEMBER_PROFILES[memberId] } : { member_id: memberId, ...EMPTY_PROFILE }
}

export function updateMemberProfile(memberId, data) {
    const updated = { ...(MEMBER_PROFILES[memberId] || { member_id: memberId, ...EMPTY_PROFILE }), ...data }
    MEMBER_PROFILES = { ...MEMBER_PROFILES, [memberId]: updated }
    setDoc(doc(db, 'memberProfiles', memberId), updated).catch(err => console.error('No se pudo sincronizar la hoja de vida', err))
    return { ...updated }
}

export function getProfileNotes(memberId) {
    return PROFILE_NOTES.filter(n => n.member_id === memberId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export function addProfileNote(memberId, authorName, content) {
    const id = `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const note = {
        id,
        member_id: memberId,
        author: authorName,
        content,
        created_at: new Date().toISOString(),
    }
    PROFILE_NOTES.push(note)
    const { id: _id, ...rest } = note
    setDoc(doc(db, 'profileNotes', id), rest).catch(err => console.error('No se pudo sincronizar la nota', err))
    return { ...note }
}

export function getMemberAttendanceLastYear(memberId) {
    const now = new Date()
    const months = []

    for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthLabel = month.toLocaleDateString('es', { month: 'short', year: 'numeric' })

        const monthAttendances = ATTENDANCES.filter(a => {
            if (a.member_id !== memberId || a.is_cancelled) return false
            const checkIn = new Date(a.check_in_time)
            return checkIn >= month && checkIn <= monthEnd
        })

        const dates = monthAttendances
            .map(a => {
                const service = SERVICES.find(s => s.id === a.service_id)
                return {
                    service_id: a.service_id,
                    date: service ? service.service_date : a.check_in_time.split('T')[0],
                    check_in_time: a.check_in_time,
                    method: a.method,
                }
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))

        months.push({ month: monthLabel, count: monthAttendances.length, dates })
    }

    return months
}

// ============== GROUP DASHBOARD (AVISOS & CHAT) ==============

let GROUP_NOTICES = [
    { 
        id: 'note-1', 
        group_id: 'jovenes', 
        title: 'Campamento Anual', 
        content: 'Recordatorio del retiro. ¡No olviden traer ropa cómoda y Biblia!', 
        author_name: 'Lucía Ramírez',
        author_id: 'user-1',
        media_url: null,
        media_type: null,
        created_at: new Date(Date.now() - 86400000).toISOString()
    }
]

const GROUP_MESSAGES = [
    { 
        id: 'msg-1', 
        group_id: 'alabanza', 
        content: '¿A qué hora ensayamos hoy?', 
        sender_name: 'Carlos Mendoza', 
        sender_id: 'user-2',
        media_url: null,
        media_type: null,
        created_at: new Date(Date.now() - 3600000).toISOString() 
    }
]

export function getGroupNotices(groupId) {
    return GROUP_NOTICES.filter(n => n.group_id === groupId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export function broadcastNoticeToGroups(groupIds, data) {
    return groupIds.map(groupId => createGroupNotice({ ...data, group_id: groupId }))
}

// Avisos relevantes para un miembro: los de sus propios ministerios, más los
// mensajes generales (audience: 'all', enviados a todos los grupos a la vez)
// — así también le llegan a quien todavía no está en ningún grupo.
export function getNoticesForMember(member, limit = 10) {
    const memberGroupIds = member
        ? OPERATIONAL_GROUPS.filter(g => member[g.field]).map(g => g.id)
        : []
    return GROUP_NOTICES
        .filter(n => n.audience === 'all' || memberGroupIds.includes(n.group_id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
}

export function createGroupNotice(data) {
    const id = `notice-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newNotice = { ...data, id, created_at: new Date().toISOString() }
    GROUP_NOTICES = [...GROUP_NOTICES, newNotice]
    setDoc(doc(db, 'groupNotices', id), { ...data, created_at: newNotice.created_at })
        .catch(err => console.error('No se pudo sincronizar el aviso', err))
    return newNotice
}

export function getGroupMessages(groupId) {
    return GROUP_MESSAGES.filter(m => m.group_id === groupId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

export function sendGroupMessage(data) {
    const newMessage = {
        ...data,
        id: `msg-${GROUP_MESSAGES.length + 1}`,
        created_at: new Date().toISOString()
    }
    GROUP_MESSAGES.push(newMessage)
    return newMessage
}

// Calendario de asignaciones del Ministerio de Alabanza: un rol (Voz
// Masculina, Guitarra, etc.) asignado a un miembro para un servicio
// específico (service_id ya distingue jueves de domingo por sí solo, así
// que no hace falta modelar "semana" — cada servicio tiene su propia
// asignación por rol).
export const ALABANZA_ROLES = [
    { id: 'voz_masculina', label: 'Voz Masculina' },
    { id: 'voz_femenina_1', label: 'Voz Femenina' },
    { id: 'voz_femenina_2', label: 'Voz Femenina 2' },
    { id: 'guitarra', label: 'Guitarra Ac.' },
    { id: 'bateria', label: 'Batería' },
]

let ALABANZA_ASSIGNMENTS = []

export function getAlabanzaAssignments() { return [...ALABANZA_ASSIGNMENTS] }

export function getAlabanzaAssignmentsForService(serviceId) {
    return ALABANZA_ASSIGNMENTS.filter(a => a.service_id === serviceId)
}

// memberId === null borra la asignación (deja el rol "Sin asignar").
export function setAlabanzaAssignment(serviceId, roleId, memberId) {
    const index = ALABANZA_ASSIGNMENTS.findIndex(a => a.service_id === serviceId && a.role_id === roleId)

    if (!memberId) {
        if (index === -1) return
        const existing = ALABANZA_ASSIGNMENTS[index]
        ALABANZA_ASSIGNMENTS = ALABANZA_ASSIGNMENTS.filter((_, i) => i !== index)
        deleteDoc(doc(db, 'alabanzaAssignments', existing.id)).catch(err => console.error('No se pudo borrar la asignación de alabanza', err))
        return
    }

    if (index !== -1) {
        const updated = { ...ALABANZA_ASSIGNMENTS[index], member_id: memberId }
        ALABANZA_ASSIGNMENTS = ALABANZA_ASSIGNMENTS.map((a, i) => (i === index ? updated : a))
        updateDoc(doc(db, 'alabanzaAssignments', updated.id), { member_id: memberId }).catch(err => console.error('No se pudo sincronizar la asignación de alabanza', err))
        return
    }

    const id = `alab-${serviceId}-${roleId}`
    const newAssignment = { id, service_id: serviceId, role_id: roleId, member_id: memberId }
    ALABANZA_ASSIGNMENTS = [...ALABANZA_ASSIGNMENTS, newAssignment]
    setDoc(doc(db, 'alabanzaAssignments', id), { service_id: serviceId, role_id: roleId, member_id: memberId }).catch(err => console.error('No se pudo sincronizar la asignación de alabanza', err))
}

// Repertorio de canciones del Ministerio de Alabanza: cifrado en texto
// plano (acordes sobre la letra) + tonalidad original opcional. La
// transposición se hace en el cliente con src/lib/chordTranspose.js — no
// se guarda transpuesto, solo el original.
let ALABANZA_SONGS = []

export function getAlabanzaSongs() {
    return [...ALABANZA_SONGS].sort((a, b) => a.title.localeCompare(b.title, 'es'))
}

export function createAlabanzaSong({ title, original_key, chord_chart }) {
    const id = `song-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newSong = { id, title, original_key: original_key || '', chord_chart, created_at: new Date().toISOString() }
    ALABANZA_SONGS = [...ALABANZA_SONGS, newSong]
    const { id: _id, ...rest } = newSong
    setDoc(doc(db, 'alabanzaSongs', id), rest).catch(err => console.error('No se pudo sincronizar la canción', err))
    return newSong
}

export function updateAlabanzaSong(id, patch) {
    const index = ALABANZA_SONGS.findIndex(s => s.id === id)
    if (index === -1) return null
    const updated = { ...ALABANZA_SONGS[index], ...patch }
    ALABANZA_SONGS = ALABANZA_SONGS.map((s, i) => (i === index ? updated : s))
    updateDoc(doc(db, 'alabanzaSongs', id), patch).catch(err => console.error('No se pudo sincronizar la canción', err))
    return updated
}

export function deleteAlabanzaSong(id) {
    ALABANZA_SONGS = ALABANZA_SONGS.filter(s => s.id !== id)
    deleteDoc(doc(db, 'alabanzaSongs', id)).catch(err => console.error('No se pudo borrar la canción', err))
}

// Repertorio (setlist) de un servicio específico: qué canciones se tocan
// ese día y quién la interpreta. Id determinístico por (servicio, canción)
// para que no se pueda agregar la misma canción dos veces al mismo servicio.
let ALABANZA_SETLISTS = []

export function getSetlistForService(serviceId) {
    return ALABANZA_SETLISTS.filter(s => s.service_id === serviceId).sort((a, b) => a.order - b.order)
}

export function getSetlistSongIds(serviceId) {
    return new Set(getSetlistForService(serviceId).map(s => s.song_id))
}

export function addSongToSetlist(serviceId, songId) {
    const id = `setlist-${serviceId}-${songId}`
    if (ALABANZA_SETLISTS.some(s => s.id === id)) return null
    const order = getSetlistForService(serviceId).length
    const newItem = { id, service_id: serviceId, song_id: songId, performer_id: null, order }
    ALABANZA_SETLISTS = [...ALABANZA_SETLISTS, newItem]
    const { id: _id, ...rest } = newItem
    setDoc(doc(db, 'alabanzaSetlists', id), rest).catch(err => console.error('No se pudo sincronizar el repertorio del servicio', err))
    return newItem
}

export function removeSongFromSetlist(id) {
    ALABANZA_SETLISTS = ALABANZA_SETLISTS.filter(s => s.id !== id)
    deleteDoc(doc(db, 'alabanzaSetlists', id)).catch(err => console.error('No se pudo quitar la canción del repertorio', err))
}

export function setSetlistPerformer(id, performerId) {
    const index = ALABANZA_SETLISTS.findIndex(s => s.id === id)
    if (index === -1) return
    const updated = { ...ALABANZA_SETLISTS[index], performer_id: performerId || null }
    ALABANZA_SETLISTS = ALABANZA_SETLISTS.map((s, i) => (i === index ? updated : s))
    updateDoc(doc(db, 'alabanzaSetlists', id), { performer_id: performerId || null }).catch(err => console.error('No se pudo sincronizar el intérprete', err))
}

export function getMemberEscuelaProgress(memberId) {
    const enrollments = getEscuelaEnrollments();
    const enrolled = enrollments.find(e => e.member_id === memberId);
    if (!enrolled) return null;

    const level = enrolled.level;
    const levelClasses = ESCUELA_CLASSES.filter(c => c.level === level);
    const totalClasses = levelClasses.length;

    const attendances = getEscuelaAttendancesByMember(memberId);
    const attendedClassIds = new Set(attendances.map(a => a.class_id));

    const history = levelClasses.map(c => ({
        ...c,
        attended: attendedClassIds.has(c.id)
    }));

    const attendedCount = history.filter(c => c.attended).length;
    const pendingCount = totalClasses - attendedCount;
    const percentage = totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 0;

    const pendingClasses = history.filter(c => !c.attended).sort((a,b) => a.class_number - b.class_number);
    const currentClass = pendingClasses.length > 0 ? pendingClasses[0] : null;

    return {
        level,
        totalClasses,
        attendedCount,
        pendingCount,
        percentage,
        currentUnit: currentClass ? currentClass.unit : (totalClasses > 0 ? levelClasses[totalClasses - 1].unit : 1),
        currentClassNumber: currentClass ? currentClass.class_number : totalClasses,
        history
    };
}

// ============== ORACIONES Y GRATITUD ==============

let PRAYER_REQUESTS = [
    { id: 'prayer-1', service_id: getActiveService().id, member_id: '1', author_name: 'María García López', type: 'oracion', content: 'Por la salud de mi madre, que está pasando por un tratamiento médico.', status: 'pendiente', created_at: new Date(Date.now() - 86400000).toISOString(), answered_at: null },
    { id: 'prayer-2', service_id: getActiveService().id, member_id: '3', author_name: 'Ana Sofía Torrez', type: 'gratitud', content: 'Gracias a Dios por un nuevo trabajo después de meses buscando.', status: 'pendiente', created_at: new Date(Date.now() - 3600000).toISOString(), answered_at: null },
    { id: 'prayer-3', service_id: getActiveService().id, member_id: '9', author_name: 'Valentina Quispe', type: 'oracion', content: 'Por sabiduría en una decisión importante que debo tomar esta semana.', status: 'contestada', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), answered_at: new Date(Date.now() - 86400000).toISOString() },
]

export function getPrayerRequests() {
    return [...PRAYER_REQUESTS].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export function getPrayerRequestsByService(serviceId) {
    return PRAYER_REQUESTS
        .filter(p => p.service_id === serviceId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export function createPrayerRequest(data) {
    const id = `prayer-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newRequest = {
        id,
        service_id: data.service_id || null,
        member_id: data.member_id || null,
        author_name: data.author_name,
        type: data.type,
        content: data.content,
        status: 'pendiente',
        related_prayer_id: data.related_prayer_id || null,
        created_at: new Date().toISOString(),
        answered_at: null,
    }
    PRAYER_REQUESTS.push(newRequest)
    const { id: _id, ...rest } = newRequest
    setDoc(doc(db, 'prayerRequests', id), rest).catch(err => console.error('No se pudo sincronizar la petición', err))
    return newRequest
}

export function getGratitudeForPrayer(prayerId) {
    return PRAYER_REQUESTS.find(p => p.related_prayer_id === prayerId) || null
}

export function markPrayerAnswered(id, gratitudeContent) {
    const request = PRAYER_REQUESTS.find(p => p.id === id)
    if (!request) return null
    request.status = 'contestada'
    request.answered_at = new Date().toISOString()
    updateDoc(doc(db, 'prayerRequests', id), { status: request.status, answered_at: request.answered_at })
        .catch(err => console.error('No se pudo sincronizar la petición contestada', err))

    let gratitude = null
    if (gratitudeContent && gratitudeContent.trim()) {
        gratitude = createPrayerRequest({
            service_id: request.service_id,
            member_id: request.member_id,
            author_name: request.author_name,
            type: 'gratitud',
            content: gratitudeContent.trim(),
            related_prayer_id: request.id,
        })
    }
    return { prayer: { ...request }, gratitude }
}

// ============== EVENTOS ==============

const EVENTS = []

export function getEvents() {
    return [...EVENTS].sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
}

export function getEventById(id) {
    return EVENTS.find(e => e.id === id) || null
}

export function createEvent(data) {
    const newEvent = {
        id: `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: data.name,
        start_date: data.start_date,
        days: parseInt(data.days) || 1,
        starts_at: data.starts_at || '',
        ends_at: data.ends_at || '',
        location: data.location,
        maps_query: data.maps_query || data.location,
        price: data.price || 'Gratis',
        poster_url: data.poster_url || null,
        created_by: data.created_by || null,
        created_at: new Date().toISOString(),
    }
    EVENTS.push(newEvent)
    return newEvent
}

export function updateEvent(id, data) {
    const idx = EVENTS.findIndex(e => e.id === id)
    if (idx === -1) return null
    EVENTS[idx] = { ...EVENTS[idx], ...data, days: parseInt(data.days) || EVENTS[idx].days }
    return EVENTS[idx]
}

export function deleteEvent(id) {
    const idx = EVENTS.findIndex(e => e.id === id)
    if (idx === -1) return false
    EVENTS.splice(idx, 1)
    for (let i = EVENT_REGISTRATIONS.length - 1; i >= 0; i--) {
        if (EVENT_REGISTRATIONS[i].event_id === id) EVENT_REGISTRATIONS.splice(i, 1)
    }
    return true
}

// ---- Inscripciones a Eventos ----

const EVENT_REGISTRATIONS = []

export function getEventRegistrations(eventId) {
    return EVENT_REGISTRATIONS
        .filter(r => r.event_id === eventId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

export function getEventRegistrationCount(eventId) {
    return EVENT_REGISTRATIONS.filter(r => r.event_id === eventId).length
}

export function isRegisteredForEvent(eventId, memberId) {
    if (!memberId) return false
    return EVENT_REGISTRATIONS.some(r => r.event_id === eventId && r.member_id === memberId)
}

export function registerForEvent(eventId, memberId, fallbackName) {
    if (!memberId) return { error: 'No se pudo identificar tu perfil de miembro' }
    if (EVENT_REGISTRATIONS.some(r => r.event_id === eventId && r.member_id === memberId)) {
        return { error: 'Ya estás inscrito en este evento' }
    }
    const member = getMemberById(memberId)
    const registration = {
        id: `evreg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        event_id: eventId,
        member_id: memberId,
        name: member?.full_name || fallbackName || 'Sin nombre',
        phone: member?.phone || '',
        email: member?.email || '',
        payment_method: '',
        created_at: new Date().toISOString(),
    }
    EVENT_REGISTRATIONS.push(registration)
    return { data: registration }
}

export function unregisterFromEvent(eventId, memberId) {
    const idx = EVENT_REGISTRATIONS.findIndex(r => r.event_id === eventId && r.member_id === memberId)
    if (idx === -1) return false
    EVENT_REGISTRATIONS.splice(idx, 1)
    return true
}

export function setEventRegistrationPaymentMethod(registrationId, method) {
    const reg = EVENT_REGISTRATIONS.find(r => r.id === registrationId)
    if (!reg) return null
    reg.payment_method = method
    return reg
}

// ---- Anuncios (Presentación en vivo) ----
// Anuncios de eventos recurrentes de la iglesia (jueves, escuela del
// discípulo, jóvenes, etc.) que se proyectan a pantalla completa junto con
// Bienvenida/Oración/Gratitud. Cada uno puede tener una foto o video de
// fondo (subido a Firebase Storage desde PresentationPage.jsx, que guarda
// aquí la URL de descarga y la ruta en Storage para poder borrarlo después).
let ANNOUNCEMENTS = []

const DEFAULT_ANNOUNCEMENTS = [
    { title: 'Servicio del Jueves', subtitle: '20:00 hrs' },
    { title: 'Escuela del Discípulo', subtitle: 'Viernes · 20:00 hrs' },
    { title: 'Jóvenes', subtitle: 'Sábado · 20:00 hrs' },
    { title: 'Buena Tierra', subtitle: 'Domingo · 11:30 hrs' },
    { title: 'Culto Principal', subtitle: 'Domingo · 18:00 hrs' },
]

function announcementDocRef(id) { return doc(db, 'announcements', id) }

export function getAnnouncements() { return [...ANNOUNCEMENTS].sort((a, b) => a.order - b.order) }

export function createAnnouncement({ title, subtitle, background_type, background_url, background_path }) {
    const id = `ann-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const order = ANNOUNCEMENTS.length > 0 ? Math.max(...ANNOUNCEMENTS.map(a => a.order)) + 1 : 0
    const announcement = {
        id, title, subtitle: subtitle || '',
        background_type: background_type || null,
        background_url: background_url || null,
        background_path: background_path || null,
        order,
        created_at: new Date().toISOString(),
    }
    ANNOUNCEMENTS = [...ANNOUNCEMENTS, announcement]
    const { id: _id, ...rest } = announcement
    setDoc(announcementDocRef(id), rest).catch(err => console.error('No se pudo guardar el anuncio', err))
    notifyAnnouncementListeners()
    return announcement
}

export function deleteAnnouncement(id) {
    ANNOUNCEMENTS = ANNOUNCEMENTS.filter(a => a.id !== id)
    deleteDoc(announcementDocRef(id)).catch(err => console.error('No se pudo eliminar el anuncio', err))
    notifyAnnouncementListeners()
}

let announcementListeners = []
let announcementsSyncStarted = false
let announcementsLoaded = false

function notifyAnnouncementListeners() { announcementListeners.forEach(fn => fn()) }

export function isAnnouncementsLoaded() { return announcementsLoaded }

function startAnnouncementsSync() {
    if (announcementsSyncStarted) return
    announcementsSyncStarted = true
    onSnapshot(collection(db, 'announcements'), async (snap) => {
        if (snap.empty && !announcementsLoaded) {
            try {
                const batch = writeBatch(db)
                DEFAULT_ANNOUNCEMENTS.forEach((a, i) => {
                    const id = `ann-default-${i + 1}`
                    batch.set(doc(db, 'announcements', id), {
                        title: a.title, subtitle: a.subtitle, background_type: null,
                        background_url: null, background_path: null, order: i,
                        created_at: new Date().toISOString(),
                    })
                })
                await batch.commit()
            } catch (e) { console.error('No se pudieron sembrar los anuncios iniciales', e) }
            return
        }
        ANNOUNCEMENTS = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        announcementsLoaded = true
        notifyAnnouncementListeners()
    }, (err) => { console.error('Error sincronizando anuncios', err); announcementsLoaded = true; notifyAnnouncementListeners() })
}

export function subscribeAnnouncements(callback) {
    announcementListeners.push(callback)
    startAnnouncementsSync()
    return () => { announcementListeners = announcementListeners.filter(fn => fn !== callback) }
}

// ---- Finanzas (Tesorero): ofrendas y diezmos ----
// Colecciones confidenciales — las reglas de seguridad de Firestore las
// restringen exclusivamente al rol "tesorero" (ni el administrador puede
// leerlas). Por eso NO se sincronizan como parte de startCoreDataSync()
// (que corre para cualquier usuario autenticado): la sincronización solo
// arranca cuando la propia página de Finanzas la pide (ver
// subscribeFinanceData), evitando errores de permiso para el resto de roles.
let OFFERINGS = []
let TITHES = []

const FINANCE_WINDOW_HOURS = 48
const FINANCE_WEEKDAY_BY_TYPE = { sunday: 0, thursday: 4 }

function mostRecentServiceDate(weekday, referenceDate = new Date()) {
    const d = new Date(referenceDate)
    d.setHours(0, 0, 0, 0)
    const diff = (d.getDay() - weekday + 7) % 7
    d.setDate(d.getDate() - diff)
    return d
}

function financeWindowFor(serviceType, serviceDate) {
    const closesAt = new Date(serviceDate.getTime() + FINANCE_WINDOW_HOURS * 60 * 60 * 1000)
    return {
        service_type: serviceType,
        service_date: serviceDate.toISOString().split('T')[0],
        closes_at: closesAt.toISOString(),
        is_active: new Date() < closesAt,
    }
}

// Ventanas de registro actualmente abiertas (dentro de las 48 hrs desde la
// fecha del servicio). Puede haber 0, 1 o 2 (domingo y jueves a la vez).
export function getActiveFinanceWindows() {
    return Object.entries(FINANCE_WEEKDAY_BY_TYPE)
        .map(([serviceType, weekday]) => financeWindowFor(serviceType, mostRecentServiceDate(weekday)))
        .filter(w => w.is_active)
}

// Últimas `countPerType` ventanas (activas + historial reciente) de cada
// tipo de servicio, para que el tesorero pueda revisar/completar registros
// recientes aunque la ventana de 48 hrs ya haya cerrado.
export function getRecentFinanceWindows(countPerType = 6) {
    const windows = []
    Object.entries(FINANCE_WEEKDAY_BY_TYPE).forEach(([serviceType, weekday]) => {
        let serviceDate = mostRecentServiceDate(weekday)
        for (let i = 0; i < countPerType; i++) {
            windows.push(financeWindowFor(serviceType, serviceDate))
            serviceDate = new Date(serviceDate)
            serviceDate.setDate(serviceDate.getDate() - 7)
        }
    })
    return windows.sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
}

function offeringDocId(serviceType, serviceDate) { return `${serviceType}-${serviceDate}` }
function offeringDocRef(serviceType, serviceDate) { return doc(db, 'offerings', offeringDocId(serviceType, serviceDate)) }
function titheDocRef(id) { return doc(db, 'tithes', id) }

export function getOfferings() { return [...OFFERINGS] }

export function getOffering(serviceType, serviceDate) {
    return OFFERINGS.find(o => o.service_type === serviceType && o.service_date === serviceDate) || null
}

export function upsertOffering(serviceType, serviceDate, amount, notes, userId) {
    const id = offeringDocId(serviceType, serviceDate)
    const existingIndex = OFFERINGS.findIndex(o => o.id === id)
    const record = {
        id,
        service_type: serviceType,
        service_date: serviceDate,
        amount: Number(amount) || 0,
        notes: notes || null,
        registered_by: userId,
        updated_at: new Date().toISOString(),
    }
    OFFERINGS = existingIndex === -1 ? [...OFFERINGS, record] : OFFERINGS.map((o, i) => (i === existingIndex ? record : o))
    const { id: _id, ...rest } = record
    setDoc(offeringDocRef(serviceType, serviceDate), rest).catch(err => console.error('No se pudo guardar la ofrenda', err))
    notifyFinanceListeners()
    return record
}

export function getTithes() { return [...TITHES] }

export function getTithesForServiceDate(serviceType, serviceDate) {
    return TITHES.filter(t => t.service_type === serviceType && t.service_date === serviceDate)
}

export function getTitheForMember(serviceType, serviceDate, memberId) {
    return TITHES.find(t => t.service_type === serviceType && t.service_date === serviceDate && t.member_id === memberId) || null
}

// Marca (o desmarca, si amount es 0/vacío) el diezmo de un miembro para un
// servicio puntual. El tesorero elige quiénes diezmaron y con qué monto.
export function setTitheForMember(serviceType, serviceDate, memberId, amount, userId) {
    const existing = getTitheForMember(serviceType, serviceDate, memberId)
    if (!amount || Number(amount) <= 0) {
        if (existing) removeTithe(existing.id)
        return null
    }
    if (existing) {
        const updated = { ...existing, amount: Number(amount), registered_by: userId, updated_at: new Date().toISOString() }
        TITHES = TITHES.map(t => (t.id === existing.id ? updated : t))
        updateDoc(titheDocRef(existing.id), { amount: updated.amount, registered_by: userId, updated_at: updated.updated_at })
            .catch(err => console.error('No se pudo actualizar el diezmo', err))
        notifyFinanceListeners()
        return updated
    }
    const id = `tithe-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const record = {
        id,
        service_type: serviceType,
        service_date: serviceDate,
        member_id: memberId,
        amount: Number(amount),
        registered_by: userId,
        created_at: new Date().toISOString(),
    }
    TITHES = [...TITHES, record]
    const { id: _id, ...rest } = record
    setDoc(titheDocRef(id), rest).catch(err => console.error('No se pudo guardar el diezmo', err))
    notifyFinanceListeners()
    return record
}

export function removeTithe(id) {
    TITHES = TITHES.filter(t => t.id !== id)
    deleteDoc(titheDocRef(id)).catch(err => console.error('No se pudo eliminar el diezmo', err))
    notifyFinanceListeners()
}

let financeListeners = []
let financeSyncStarted = false
let financeLoaded = false

function notifyFinanceListeners() { financeListeners.forEach(fn => fn()) }

export function isFinanceDataLoaded() { return financeLoaded }

function startFinanceSync() {
    if (financeSyncStarted) return
    financeSyncStarted = true
    let offeringsLoaded = false
    let tithesLoaded = false
    const checkLoaded = () => {
        if (offeringsLoaded && tithesLoaded) financeLoaded = true
        notifyFinanceListeners()
    }
    onSnapshot(collection(db, 'offerings'), (snap) => {
        OFFERINGS = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        offeringsLoaded = true
        checkLoaded()
    }, (err) => { console.error('Error sincronizando ofrendas', err); offeringsLoaded = true; checkLoaded() })
    onSnapshot(collection(db, 'tithes'), (snap) => {
        TITHES = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        tithesLoaded = true
        checkLoaded()
    }, (err) => { console.error('Error sincronizando diezmos', err); tithesLoaded = true; checkLoaded() })
}

// Punto de entrada único para la página de Finanzas: arranca la
// sincronización (solo la primera vez) y registra un callback para
// re-renderizar cuando lleguen datos nuevos. Devuelve una función para
// des-suscribirse al desmontar el componente.
export function subscribeFinanceData(callback) {
    financeListeners.push(callback)
    startFinanceSync()
    return () => { financeListeners = financeListeners.filter(fn => fn !== callback) }
}

// ---- Persistencia en localStorage ----
// Guarda y restaura todas las "tablas" en memoria para que los datos
// sobrevivan a recargas de página y sean consistentes entre pestañas.

const STORAGE_KEY = 'churchattend_mock_db_v1'

// Nota: MEMBERS y USERS ya NO se guardan aquí — viven en Firestore (ver
// más abajo "Sincronización con Firestore"), compartidos entre todos los
// dispositivos. El resto de las "tablas" sigue en memoria + localStorage.
// MEMBER_PROFILES, GROUP_NOTICES, SERVICES y ATTENDANCES ya NO se guardan
// aquí — viven en Firestore (ver más abajo). GROUP_MESSAGES (chat) sigue
// pendiente de migración.
const COLLECTIONS = {
    SYSTEM_SETTINGS,
    ESCUELA_CLASSES, ESCUELA_ATTENDANCES, ESCUELA_ENROLLMENTS,
    REFUGIOS, REFUGIO_ENROLLMENTS,
    PROFILE_NOTES,
    GROUP_MESSAGES,
    PRAYER_REQUESTS,
    EVENTS, EVENT_REGISTRATIONS,
}

function restoreFromStorage() {
    let saved
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        saved = JSON.parse(raw)
    } catch (e) {
        console.error('No se pudo leer los datos guardados', e)
        return
    }
    for (const key of Object.keys(COLLECTIONS)) {
        if (!(key in saved)) continue
        const target = COLLECTIONS[key]
        const source = saved[key]
        if (Array.isArray(target)) {
            target.length = 0
            target.push(...source)
        } else if (target && typeof target === 'object') {
            Object.keys(target).forEach(k => delete target[k])
            Object.assign(target, source)
        }
    }
}

function saveToStorage() {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(COLLECTIONS))
    } catch (e) {
        console.error('No se pudo guardar los datos', e)
    }
}

restoreFromStorage()

if (window.__churchattendAutosave) clearInterval(window.__churchattendAutosave)
window.__churchattendAutosave = setInterval(saveToStorage, 1200)
window.addEventListener('beforeunload', saveToStorage)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveToStorage()
})

// ---- Sincronización con Firestore (Miembros y Usuarios) ----
// MEMBERS y USERS se mantienen en tiempo real con Firestore, compartidos
// entre todos los dispositivos. La primera vez que la colección está vacía,
// se siembra con los datos base definidos arriba.
// Las reglas de seguridad exigen un usuario autenticado, así que la
// suscripción se inicia recién cuando AuthContext confirma el login
// (startCoreDataSync), no al cargar el módulo.

let resolveCoreDataReady
export const coreDataReadyPromise = new Promise((resolve) => { resolveCoreDataReady = resolve })
let membersFirstLoad = true
let usersFirstLoad = true
let profilesFirstLoad = true
let profileNotesFirstLoad = true
let prayerRequestsFirstLoad = true
let noticesFirstLoad = true
let servicesFirstLoad = true
let attendancesFirstLoad = true
let coreSyncStarted = false

function checkCoreDataReady() {
    if (!membersFirstLoad && !usersFirstLoad && !profilesFirstLoad && !noticesFirstLoad && !servicesFirstLoad && !attendancesFirstLoad) resolveCoreDataReady()
}

export function startCoreDataSync() {
    if (coreSyncStarted) return
    coreSyncStarted = true

    onSnapshot(collection(db, 'members'), async (snap) => {
        if (snap.empty && membersFirstLoad) {
            try {
                const batch = writeBatch(db)
                MEMBERS.forEach(m => {
                    const { id, ...rest } = m
                    batch.set(doc(db, 'members', id), rest)
                })
                await batch.commit()
            } catch (e) { console.error('No se pudieron sembrar los miembros iniciales', e) }
            return
        }
        MEMBERS = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        membersFirstLoad = false
        checkCoreDataReady()
    }, (err) => {
        console.error('Error sincronizando miembros', err)
        membersFirstLoad = false
        checkCoreDataReady()
    })

    onSnapshot(collection(db, 'users'), async (snap) => {
        if (snap.empty && usersFirstLoad) {
            try {
                const batch = writeBatch(db)
                USERS.forEach(u => {
                    const { id, ...rest } = u
                    batch.set(doc(db, 'users', id), rest)
                })
                await batch.commit()
            } catch (e) { console.error('No se pudieron sembrar los usuarios iniciales', e) }
            return
        }
        USERS = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        usersFirstLoad = false
        checkCoreDataReady()
    }, (err) => {
        console.error('Error sincronizando usuarios', err)
        usersFirstLoad = false
        checkCoreDataReady()
    })

    onSnapshot(collection(db, 'memberProfiles'), async (snap) => {
        if (snap.empty && profilesFirstLoad && Object.keys(MEMBER_PROFILES).length > 0) {
            try {
                const batch = writeBatch(db)
                Object.entries(MEMBER_PROFILES).forEach(([memberId, profile]) => {
                    batch.set(doc(db, 'memberProfiles', memberId), profile)
                })
                await batch.commit()
            } catch (e) { console.error('No se pudieron sembrar las hojas de vida iniciales', e) }
            return
        }
        const next = {}
        snap.forEach(d => { next[d.id] = d.data() })
        MEMBER_PROFILES = next
        profilesFirstLoad = false
        checkCoreDataReady()
    }, (err) => {
        console.error('Error sincronizando hojas de vida', err)
        profilesFirstLoad = false
        checkCoreDataReady()
    })

    // No bloquea checkCoreDataReady: son notas de staff sobre un miembro,
    // secundarias frente a los datos que el resto de la app necesita para
    // arrancar (igual que alabanzaAssignments/alabanzaSongs).
    onSnapshot(collection(db, 'profileNotes'), async (snap) => {
        if (snap.empty && profileNotesFirstLoad && PROFILE_NOTES.length > 0) {
            try {
                const batch = writeBatch(db)
                PROFILE_NOTES.forEach(n => {
                    const { id, ...rest } = n
                    batch.set(doc(db, 'profileNotes', id), rest)
                })
                await batch.commit()
            } catch (e) { console.error('No se pudieron sembrar las notas iniciales', e) }
            return
        }
        PROFILE_NOTES = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        profileNotesFirstLoad = false
    }, (err) => {
        console.error('Error sincronizando notas de perfil', err)
        profileNotesFirstLoad = false
    })

    // No bloquea checkCoreDataReady: las peticiones de oración/gratitud no
    // son necesarias para que el resto de la app arranque.
    onSnapshot(collection(db, 'prayerRequests'), async (snap) => {
        if (snap.empty && prayerRequestsFirstLoad && PRAYER_REQUESTS.length > 0) {
            try {
                const batch = writeBatch(db)
                PRAYER_REQUESTS.forEach(p => {
                    const { id, ...rest } = p
                    batch.set(doc(db, 'prayerRequests', id), rest)
                })
                await batch.commit()
            } catch (e) { console.error('No se pudieron sembrar las peticiones iniciales', e) }
            return
        }
        PRAYER_REQUESTS = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        prayerRequestsFirstLoad = false
    }, (err) => {
        console.error('Error sincronizando peticiones de oración', err)
        prayerRequestsFirstLoad = false
    })

    onSnapshot(collection(db, 'groupNotices'), async (snap) => {
        if (snap.empty && noticesFirstLoad && GROUP_NOTICES.length > 0) {
            try {
                const batch = writeBatch(db)
                GROUP_NOTICES.forEach(n => {
                    const { id, ...rest } = n
                    batch.set(doc(db, 'groupNotices', id), rest)
                })
                await batch.commit()
            } catch (e) { console.error('No se pudieron sembrar los avisos iniciales', e) }
            return
        }
        GROUP_NOTICES = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        noticesFirstLoad = false
        checkCoreDataReady()
    }, (err) => {
        console.error('Error sincronizando avisos', err)
        noticesFirstLoad = false
        checkCoreDataReady()
    })

    // Servicios y asistencias: a propósito NO se siembran los datos de
    // ejemplo (eran ficticios, generados solo para la demo local) — la
    // colección arranca vacía en Firestore y se llena con el uso real de
    // la iglesia de aquí en adelante.
    onSnapshot(collection(db, 'services'), (snap) => {
        SERVICES = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        servicesFirstLoad = false
        checkCoreDataReady()
    }, (err) => {
        console.error('Error sincronizando servicios', err)
        servicesFirstLoad = false
        checkCoreDataReady()
    })

    onSnapshot(collection(db, 'attendances'), (snap) => {
        ATTENDANCES = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        attendancesFirstLoad = false
        checkCoreDataReady()
    }, (err) => {
        console.error('Error sincronizando asistencias', err)
        attendancesFirstLoad = false
        checkCoreDataReady()
    })

    // No bloquean checkCoreDataReady: son datos secundarios (calendario y
    // repertorio de Alabanza), no algo que el resto de la app necesite para
    // arrancar.
    onSnapshot(collection(db, 'alabanzaAssignments'), (snap) => {
        ALABANZA_ASSIGNMENTS = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, (err) => {
        console.error('Error sincronizando asignaciones de alabanza', err)
    })

    onSnapshot(collection(db, 'alabanzaSongs'), (snap) => {
        ALABANZA_SONGS = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, (err) => {
        console.error('Error sincronizando repertorio de alabanza', err)
    })

    onSnapshot(collection(db, 'alabanzaSetlists'), (snap) => {
        ALABANZA_SETLISTS = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, (err) => {
        console.error('Error sincronizando el repertorio de los servicios', err)
    })
}
