// Runtime Node.js 22 (ver firebase.json) — RA-06 del informe de seguridad.
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()

// Roles válidos de la app (deben coincidir con los usados en src/).
const VALID_ROLES = ['admin', 'controller', 'tesorero', 'attendee', 'bienvenida']

// ---- Roles (RA-01/RA-02 del informe de seguridad) ----
// La colección "users" está indexada por un id interno de la app, no por el
// uid de Firebase Auth; "userRoles" es el espejo indexado por uid que usan
// las reglas de seguridad para saber el rol real de quien hace la petición.
// Las reglas cierran la escritura de "userRoles" a cualquier cliente
// (allow write: if false) — de aquí en adelante solo se escribe desde el
// Admin SDK, ya sea por este trigger (alta orgánica / cuentas antiguas que
// aún no tenían auth_uid) o por la función setUserRole (cambios de rol
// hechos por un administrador).
exports.syncUserRoleOnUserWrite = onDocumentWritten('users/{userId}', async (event) => {
    const after = event.data?.after?.data()
    if (!after?.auth_uid) return
    const before = event.data?.before?.data()
    if (before && before.auth_uid === after.auth_uid && before.role === after.role && before.member_id === after.member_id) {
        return // nada relevante cambió (p. ej. solo el latido de "última conexión")
    }
    await db.collection('userRoles').doc(after.auth_uid).set({
        role: VALID_ROLES.includes(after.role) ? after.role : 'attendee',
        member_id: after.member_id || null,
        updated_at: new Date().toISOString(),
    }, { merge: true })
})

// Único camino permitido para que un administrador cambie el rol de otra
// cuenta. Verifica el rol del solicitante contra userRoles (que el Admin SDK
// puede leer sin restricciones) antes de escribir nada.
exports.setUserRole = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
    }
    const callerRoleSnap = await db.collection('userRoles').doc(request.auth.uid).get()
    if (!callerRoleSnap.exists || callerRoleSnap.data().role !== 'admin') {
        throw new HttpsError('permission-denied', 'Solo un administrador puede asignar roles.')
    }

    const { userId, uid, role } = request.data || {}
    if (typeof userId !== 'string' || !userId || typeof uid !== 'string' || !uid || !VALID_ROLES.includes(role)) {
        throw new HttpsError('invalid-argument', 'userId, uid o role inválido.')
    }
    if (uid === request.auth.uid && role !== 'admin') {
        throw new HttpsError('failed-precondition', 'No puedes quitarte tu propio rol de administrador.')
    }

    const userSnap = await db.collection('users').doc(userId).get()
    if (!userSnap.exists || userSnap.data().auth_uid !== uid) {
        throw new HttpsError('invalid-argument', 'El usuario indicado no coincide con esa cuenta.')
    }

    const batch = db.batch()
    batch.update(db.collection('users').doc(userId), { role })
    batch.set(db.collection('userRoles').doc(uid), {
        role,
        member_id: userSnap.data().member_id || null,
        updated_at: new Date().toISOString(),
        updated_by: request.auth.uid,
    }, { merge: true })
    await batch.commit()

    return { ok: true }
})

const SERVICE_TIMEZONE = 'America/Santiago'

// Debe coincidir con SERVICE_TYPES en src/pages/admin/ServicesPage.jsx.
const SERVICE_TYPES = {
    sunday: { weekday: 0, defaultName: 'Servicio Dominical', starts_at: '07:00', ends_at: '13:00' },
    thursday: { weekday: 4, defaultName: 'Servicio de Jueves', starts_at: '20:00', ends_at: '22:00' },
    // Asistencia propia de las clases de niños (Paz/Alegría/Faith), en
    // paralelo al culto dominical — activar uno no afecta al otro porque
    // activateUpcomingServices/toggleServiceActive solo desactivan servicios
    // del MISMO service_type.
    'buena-tierra': { weekday: 0, defaultName: 'Buena Tierra', starts_at: '07:00', ends_at: '13:00' },
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
    'alabanza': 'grupo_alabanza',
    'refugios': 'grupo_refugios',
}

function chunk(arr, size) {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
    return chunks
}

// Envía la notificación push a una lista de tokens y limpia los que ya no
// sirven (dispositivo desinstaló la app, etc.) — usado tanto por los avisos
// manuales (onGroupNoticeCreated) como por el aviso automático a Bienvenida
// (onAttendanceCreated) para no duplicar esta lógica dos veces.
async function sendPushToTokens(tokens, title, body, logPrefix) {
    if (tokens.length === 0) return
    const response = await getMessaging().sendEachForMulticast({
        tokens,
        notification: { title: title.slice(0, 80), body: body.slice(0, 240) },
    })
    console.log(`${logPrefix}: enviados=${response.successCount} fallidos=${response.failureCount}`)
    response.responses.forEach((r, i) => {
        if (!r.success) console.log(`${logPrefix}: fallo token[${i}] code=${r.error?.code} msg=${r.error?.message}`)
    })

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
}

// Roles con permiso para emitir avisos (que disparan notificaciones push a
// nombre de la institución). Debe coincidir con la restricción de creación
// en firestore.rules — esta revalidación es la segunda capa (RA-03): las
// reglas ya exigen created_by y rol admin al crear el documento, pero como
// el Admin SDK (y cualquier ruta de escritura futura) no pasa por las
// reglas, se vuelve a comprobar aquí antes de enviar y, si no corresponde,
// se borra el documento sin notificar a nadie.
const ROLES_QUE_PUEDEN_AVISAR = ['admin']

exports.onGroupNoticeCreated = onDocumentCreated('groupNotices/{noticeId}', async (event) => {
    const notice = event.data?.data()
    if (!notice) return

    const autorId = notice.created_by
    if (!autorId) {
        console.log(`onGroupNoticeCreated: borrado, sin created_by (noticeId=${event.params.noticeId})`)
        await event.data.ref.delete().catch(() => {})
        return
    }
    const autorRoleSnap = await db.collection('userRoles').doc(autorId).get()
    if (!autorRoleSnap.exists || !ROLES_QUE_PUEDEN_AVISAR.includes(autorRoleSnap.data().role)) {
        console.log(`onGroupNoticeCreated: borrado, autor no autorizado (autorId=${autorId}, existe=${autorRoleSnap.exists}, rol=${autorRoleSnap.exists ? autorRoleSnap.data().role : 'n/a'})`)
        await event.data.ref.delete().catch(() => {})
        return
    }

    const tokens = []
    if (notice.to_all_users) {
        // Envío a todos los usuarios con cuenta, sin mirar sus grupos.
        const usersSnap = await db.collection('users').get()
        usersSnap.forEach(doc => tokens.push(...(doc.data().fcm_tokens || [])))
        console.log(`onGroupNoticeCreated: modo TODOS los usuarios, usuarios=${usersSnap.size} tokens=${tokens.length}`)
    } else {
        const field = GROUP_FIELDS[notice.group_id]
        if (!field) {
            console.log(`onGroupNoticeCreated: sin campo de grupo para group_id=${notice.group_id}`)
            return
        }

        const membersSnap = await db.collection('members').where(field, '==', true).get()
        const memberIds = membersSnap.docs.map(d => d.id)
        console.log(`onGroupNoticeCreated: group_id=${notice.group_id} field=${field} miembros=${memberIds.length}`)
        if (memberIds.length === 0) return

        for (const idsChunk of chunk(memberIds, 10)) {
            const usersSnap = await db.collection('users').where('member_id', 'in', idsChunk).get()
            usersSnap.forEach(doc => tokens.push(...(doc.data().fcm_tokens || [])))
        }
    }
    console.log(`onGroupNoticeCreated: tokens encontrados=${tokens.length}`)
    // Truncados para limitar el abuso del espacio de mensaje (RA-03), ya
    // aplicado también dentro de sendPushToTokens.
    await sendPushToTokens(tokens, String(notice.title || 'Nuevo aviso'), String(notice.content || ''), 'onGroupNoticeCreated')
})

// ---- Notificación automática a Bienvenida (4ª asistencia de un visitante) ----
// Se dispara con CUALQUIER asistencia (Buena Tierra, domingo o jueves — todas
// viven en la misma colección "attendances"), así que cubre niños y adultos
// por igual sin lógica separada por tipo de servicio.
exports.onAttendanceCreated = onDocumentCreated('attendances/{attendanceId}', async (event) => {
    const attendance = event.data?.data()
    if (!attendance?.member_id) return

    const memberSnap = await db.collection('members').doc(attendance.member_id).get()
    if (!memberSnap.exists || memberSnap.data().member_type !== 'Visitante') return

    const attendancesSnap = await db.collection('attendances').where('member_id', '==', attendance.member_id).get()
    const totalAttendances = attendancesSnap.size
    console.log(`onAttendanceCreated: member_id=${attendance.member_id} totalAttendances=${totalAttendances}`)
    if (totalAttendances !== 4) return

    const bienvenidaRolesSnap = await db.collection('userRoles').where('role', '==', 'bienvenida').get()
    if (bienvenidaRolesSnap.empty) {
        console.log('onAttendanceCreated: nadie con rol bienvenida todavía')
        return
    }

    const tokens = []
    for (const uidsChunk of chunk(bienvenidaRolesSnap.docs.map(d => d.id), 10)) {
        const usersSnap = await db.collection('users').where('auth_uid', 'in', uidsChunk).get()
        usersSnap.forEach(doc => tokens.push(...(doc.data().fcm_tokens || [])))
    }

    const memberName = memberSnap.data().full_name || 'Un visitante'
    await sendPushToTokens(tokens, '¡Cuarta visita! 🎉', `${memberName} ya lleva 4 asistencias. Es momento de darle una bienvenida especial.`, 'onAttendanceCreated')
})
