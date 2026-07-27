const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()
const db = getFirestore()

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
