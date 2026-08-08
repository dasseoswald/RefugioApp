const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()

const SERVICE_TIMEZONE = 'America/Santiago'

// Debe coincidir con SERVICE_TYPES en src/pages/admin/ServicesPage.jsx.
const SERVICE_TYPES = {
    sunday: { weekday: 0, defaultName: 'Servicio Dominical', starts_at: '07:00', ends_at: '13:00' },
    thursday: { weekday: 4, defaultName: 'Servicio de Jueves', starts_at: '20:00', ends_at: '22:00' },
}

function formatDateParts(y, m, d) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// Se ejecuta todos los días a las 06:00 hora de Chile. Para cada tipo de
// servicio (domingo, jueves), si hoy es el día anterior (sábado o miércoles),
// busca (o crea, si no existe) el servicio de mañana y lo activa —
// desactivando cualquier otro servicio activo del mismo tipo, igual que el
// botón manual de activar/desactivar.
exports.activateUpcomingServices = onSchedule({ schedule: 'every day 06:00', timeZone: SERVICE_TIMEZONE }, async () => {
    const todayStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: SERVICE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
    const [ty, tm, td] = todayStr.split('-').map(Number)
    const today = new Date(ty, tm - 1, td)
    const todayWeekday = today.getDay()

    for (const [serviceType, cfg] of Object.entries(SERVICE_TYPES)) {
        const dayBefore = (cfg.weekday - 1 + 7) % 7
        if (todayWeekday !== dayBefore) continue

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const targetDate = formatDateParts(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate())

        const existingSnap = await db.collection('services')
            .where('service_type', '==', serviceType)
            .where('service_date', '==', targetDate)
            .limit(1)
            .get()

        let serviceId
        if (!existingSnap.empty) {
            serviceId = existingSnap.docs[0].id
        } else {
            const newRef = db.collection('services').doc()
            await newRef.set({
                name: cfg.defaultName,
                service_date: targetDate,
                service_type: serviceType,
                pastor_name: '',
                starts_at: cfg.starts_at,
                ends_at: cfg.ends_at,
                is_active: false,
                created_at: new Date().toISOString(),
            })
            serviceId = newRef.id
        }

        const activeSnap = await db.collection('services')
            .where('service_type', '==', serviceType)
            .where('is_active', '==', true)
            .get()

        const batch = db.batch()
        activeSnap.forEach(doc => {
            if (doc.id !== serviceId) batch.update(doc.ref, { is_active: false })
        })
        batch.update(db.collection('services').doc(serviceId), { is_active: true })
        await batch.commit()
    }
})

// Debe coincidir con OPERATIONAL_GROUPS en src/data/mockData.js (id -> field).
const GROUP_FIELDS = {
    'escuela-discipulo': 'escuela_discipulo',
    'buena-tierra': 'buena_tierra',
    'jovenes': 'grupo_jovenes',
    'damas': 'grupo_damas',
    'caballeros': 'grupo_caballeros',
    'ninos': 'grupo_ninos',
    'alabanza': 'grupo_alabanza',
    'refugios': 'grupo_refugios',
}

function chunk(arr, size) {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
    return chunks
}

exports.onGroupNoticeCreated = onDocumentCreated('groupNotices/{noticeId}', async (event) => {
    const notice = event.data?.data()
    if (!notice) return

    const field = GROUP_FIELDS[notice.group_id]
    if (!field) return

    const membersSnap = await db.collection('members').where(field, '==', true).get()
    const memberIds = membersSnap.docs.map(d => d.id)
    if (memberIds.length === 0) return

    const tokens = []
    for (const idsChunk of chunk(memberIds, 10)) {
        const usersSnap = await db.collection('users').where('member_id', 'in', idsChunk).get()
        usersSnap.forEach(doc => {
            const userTokens = doc.data().fcm_tokens || []
            tokens.push(...userTokens)
        })
    }
    if (tokens.length === 0) return

    const response = await getMessaging().sendEachForMulticast({
        tokens,
        notification: {
            title: notice.title || 'Nuevo aviso',
            body: notice.content || '',
        },
    })

    // Limpieza de tokens inválidos/expirados (dispositivo desinstaló la app, etc.)
    const invalidTokens = []
    response.responses.forEach((r, i) => {
        if (!r.success && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(r.error?.code)) {
            invalidTokens.push(tokens[i])
        }
    })
    if (invalidTokens.length > 0) {
        const { FieldValue } = require('firebase-admin/firestore')
        const usersWithTokensSnap = await db.collection('users').where('fcm_tokens', 'array-contains-any', invalidTokens.slice(0, 10)).get()
        const batch = db.batch()
        usersWithTokensSnap.forEach(doc => {
            batch.update(doc.ref, { fcm_tokens: FieldValue.arrayRemove(...invalidTokens) })
        })
        await batch.commit().catch(() => {})
    }
})
