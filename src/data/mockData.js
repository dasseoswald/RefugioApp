/**
 * Mock data layer for ChurchAttend.
 * Simulates Supabase backend with in-memory data.
 * Replace this module with real Supabase calls when ready.
 */

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

const MEMBERS = [
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

const SERVICES = pastSundays.map((date, index) => ({
    id: `svc-${index + 1}`,
    name: index === 0 ? 'Servicio Dominical' : `Servicio Dominical`,
    service_date: date.toISOString().split('T')[0],
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

const ATTENDANCES = generateAttendances()

const USERS = [
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

export function createMember(data) {
    const newMember = { ...data, id: `${MEMBERS.length + 1}`, created_at: new Date().toISOString(), is_active: true }
    
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

    MEMBERS.push(newMember)
    return newMember
}

export function updateMember(id, data) {
    const index = MEMBERS.findIndex(m => m.id === id)
    if (index === -1) return null

    const updatedMember = { ...MEMBERS[index], ...data }
    
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

    MEMBERS[index] = updatedMember
    return updatedMember
}

export function toggleMemberActive(id) {
    const member = MEMBERS.find(m => m.id === id)
    if (!member) return null
    member.is_active = !member.is_active
    return member
}

export function getServices() { return [...SERVICES] }

export function getActiveService() { return SERVICES.find(s => s.is_active) || SERVICES[0] }

export function createService(data) {
    const newService = { ...data, id: `svc-${SERVICES.length + 1}`, is_active: false, created_at: new Date().toISOString() }
    SERVICES.push(newService)
    return newService
}

export function updateService(id, data) {
    const index = SERVICES.findIndex(s => s.id === id)
    if (index === -1) return null
    SERVICES[index] = { ...SERVICES[index], ...data }
    return SERVICES[index]
}

export function toggleServiceActive(id) {
    SERVICES.forEach(s => { s.is_active = (s.id === id) ? !s.is_active : false })
    return SERVICES.find(s => s.id === id)
}

export function activateTodaySundayService() {
    const today = new Date()
    if (today.getDay() !== 0) return { activated: false, reason: 'not_sunday', service: null }

    const todayStr = today.toISOString().split('T')[0]
    const todayService = SERVICES.find(s => s.service_date === todayStr)
    if (!todayService) return { activated: false, reason: 'no_service_found', service: null }
    if (todayService.is_active) return { activated: false, reason: 'already_active', service: todayService }

    SERVICES.forEach(s => { s.is_active = false })
    todayService.is_active = true
    return { activated: true, reason: 'activated', service: todayService }
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

    const cancelled = ATTENDANCES.find(a => a.member_id === memberId && a.service_id === serviceId && a.is_cancelled)
    if (cancelled) {
        cancelled.is_cancelled = false
        cancelled.notes = null
        cancelled.check_in_time = new Date().toISOString()
        return { data: cancelled }
    }

    const attendance = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Unique ID
        member_id: memberId,
        service_id: serviceId,
        check_in_time: new Date().toISOString(),
        method,
        attendance_type: 'presencial',
        registered_by: registeredBy,
        notes: null,
        is_cancelled: false,
    }
    ATTENDANCES.push(attendance)
    return { data: attendance }
}

export function cancelAttendance(id, reason) {
    const idx = ATTENDANCES.findIndex(a => a.id === id)
    if (idx !== -1) {
        ATTENDANCES.splice(idx, 1) // In mock mode, delete it to keep it simple for the toggle
        return true
    }
    return false
}

export function findAttendanceByMemberAndService(memberId, serviceId) {
    return ATTENDANCES.find(a => a.member_id === memberId && a.service_id === serviceId && !a.is_cancelled) || null
}

export function getUsers() { return [...USERS] }

export function getUserById(id) { return USERS.find(u => u.id === id) || null }

export function getUserByEmail(email) { return USERS.find(u => u.email === email) || null }

export function createUser(data) {
    if (getUserByEmail(data.email)) {
        return { error: 'Ya existe un usuario con ese correo electrónico' }
    }
    const newUser = {
        id: `user-${Date.now()}`,
        email: data.email,
        role: data.role,
        name: data.name,
        member_id: data.member_id || null,
        photo_url: null,
    }
    USERS.push(newUser)
    return { data: newUser }
}

// ---- Vinculación de cuentas Firebase (Google / correo-contraseña) ----
// Cuando alguien inicia sesión por primera vez con una cuenta real (Google o
// registro con correo), se busca un usuario existente por correo (p. ej. las
// cuentas de administrador/controlador ya definidas). Si no existe, se busca
// o crea el miembro correspondiente y se genera un usuario nuevo con rol
// "attendee" por defecto; el administrador puede luego cambiarle el rol
// desde la sección Usuarios.
export function createOrGetUserForFirebaseAccount({ email, displayName, photoURL }) {
    const existingUser = getUserByEmail(email)
    if (existingUser) {
        if (photoURL && existingUser.photo_url !== photoURL) {
            existingUser.photo_url = photoURL
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
    }
    USERS.push(newUser)
    return { ...newUser }
}

export function updateUserProfile(userId, data) {
    const index = USERS.findIndex(u => u.id === userId)
    if (index === -1) return null
    USERS[index] = { ...USERS[index], ...data }
    return { ...USERS[index] }
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
    const member = MEMBERS.find(m => m.id === memberId)
    if (member) {
        member.escuela_discipulo = true
        member.escuela_discipulo_level = level
    }
    return { member_id: memberId, level }
}

export function removeFromEscuela(memberId) {
    const idx = ESCUELA_ENROLLMENTS.findIndex(e => e.member_id === memberId)
    if (idx !== -1) ESCUELA_ENROLLMENTS.splice(idx, 1)
    const member = MEMBERS.find(m => m.id === memberId)
    if (member) {
        member.escuela_discipulo = false
        member.escuela_discipulo_level = null
    }
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
            const member = MEMBERS.find(m => m.id === REFUGIO_ENROLLMENTS[i].member_id)
            if (member) member.grupo_refugios = false
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
    const member = MEMBERS.find(m => m.id === memberId)
    if (member) member.grupo_refugios = true
    return { member_id: memberId, refugio_id: refugioId }
}

export function removeFromRefugio(memberId) {
    const idx = REFUGIO_ENROLLMENTS.findIndex(e => e.member_id === memberId)
    if (idx !== -1) REFUGIO_ENROLLMENTS.splice(idx, 1)
    const member = MEMBERS.find(m => m.id === memberId)
    if (member) member.grupo_refugios = false
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

const MEMBER_PROFILES = {
    '1': { member_id: '1', address: 'Av. Busch #234, Zona Central', occupation: 'Profesora', ministry: 'Alabanza', baptized: true, baptism_date: '2010-05-20', family_info: 'Esposo: Juan García, Hijos: Pablo (12), Sofía (8)', emergency_contact: 'Juan García', emergency_phone: '+591 789-4321', blood_type: 'O+', allergies: 'Ninguna' },
    '2': { member_id: '2', address: 'Calle Litoral #78, Zona Sur', occupation: 'Ingeniero de Sistemas', ministry: 'Multimedia', baptized: true, baptism_date: '2015-11-10', family_info: 'Soltero', emergency_contact: 'Rosa Ruiz', emergency_phone: '+591 789-8765', blood_type: 'A+', allergies: 'Penicilina' },
    '3': { member_id: '3', address: 'Av. 6 de Agosto #456', occupation: 'Contadora', ministry: 'Liderazgo', baptized: true, baptism_date: '2005-03-15', family_info: 'Esposo: Marcos Torrez, Hija: Camila (15)', emergency_contact: 'Marcos Torrez', emergency_phone: '+591 789-1111', blood_type: 'B+', allergies: 'Ninguna' },
}

const PROFILE_NOTES = [
    { id: 'note-1', member_id: '1', author: 'Lucía Ramírez', content: 'Interesada en participar en el ministerio de niños a partir del próximo trimestre.', created_at: '2025-12-15T10:30:00' },
    { id: 'note-2', member_id: '1', author: 'Ana Sofía Torrez', content: 'Completó el curso de liderazgo nivel 1. Excelente participación.', created_at: '2026-01-20T14:00:00' },
    { id: 'note-3', member_id: '2', author: 'Lucía Ramírez', content: 'Encargado del equipo de sonido para servicios dominicales.', created_at: '2026-02-10T09:15:00' },
    { id: 'note-4', member_id: '3', author: 'Lucía Ramírez', content: 'Líder de célula Esperanza. Reuniones semanales los miércoles.', created_at: '2025-11-05T16:45:00' },
]

export function getMemberProfile(memberId) {
    return MEMBER_PROFILES[memberId] || { member_id: memberId, address: '', occupation: '', ministry: '', baptized: false, baptism_date: '', family_info: '', emergency_contact: '', emergency_phone: '', blood_type: '', allergies: '' }
}

export function updateMemberProfile(memberId, data) {
    if (!MEMBER_PROFILES[memberId]) {
        MEMBER_PROFILES[memberId] = { member_id: memberId, address: '', occupation: '', ministry: '', baptized: false, baptism_date: '', family_info: '', emergency_contact: '', emergency_phone: '', blood_type: '', allergies: '' }
    }
    MEMBER_PROFILES[memberId] = { ...MEMBER_PROFILES[memberId], ...data }
    return { ...MEMBER_PROFILES[memberId] }
}

export function getProfileNotes(memberId) {
    return PROFILE_NOTES.filter(n => n.member_id === memberId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export function addProfileNote(memberId, authorName, content) {
    const note = {
        id: `note-${PROFILE_NOTES.length + 1}`,
        member_id: memberId,
        author: authorName,
        content,
        created_at: new Date().toISOString(),
    }
    PROFILE_NOTES.push(note)
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

const GROUP_NOTICES = [
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

export function createGroupNotice(data) {
    const newNotice = {
        ...data,
        id: `notice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString()
    }
    GROUP_NOTICES.push(newNotice)
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

const PRAYER_REQUESTS = [
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
    const newRequest = {
        id: `prayer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

// ---- Persistencia en localStorage ----
// Guarda y restaura todas las "tablas" en memoria para que los datos
// sobrevivan a recargas de página y sean consistentes entre pestañas.

const STORAGE_KEY = 'churchattend_mock_db_v1'

const COLLECTIONS = {
    MEMBERS, SERVICES, ATTENDANCES, USERS, SYSTEM_SETTINGS,
    ESCUELA_CLASSES, ESCUELA_ATTENDANCES, ESCUELA_ENROLLMENTS,
    REFUGIOS, REFUGIO_ENROLLMENTS,
    MEMBER_PROFILES, PROFILE_NOTES,
    GROUP_NOTICES, GROUP_MESSAGES,
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
