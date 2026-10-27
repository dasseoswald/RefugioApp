// Arma el link directo de chat de WhatsApp (wa.me) a partir de un teléfono
// escrito a mano en la ficha del miembro. Los teléfonos vienen en cualquier
// formato ("+56932377298", "9 65315158", "929870309", "99080550"), así que se
// normaliza a solo dígitos con código de país. Si no trae código de país
// explícito se asume Chile (+56), que es el caso de la mayoría de las fichas.
// Devuelve null si no hay un número usable.
export function getWhatsAppUrl(phone) {
    if (!phone) return null
    const raw = String(phone).trim()
    let digits = raw.replace(/\D/g, '')
    if (!digits) return null

    if (digits.startsWith('00')) digits = digits.slice(2)
    else if (!raw.startsWith('+')) {
        if (digits.length === 9) digits = `56${digits}`
        else if (digits.length === 8) digits = `569${digits}`
    }

    if (digits.length < 10 || digits.length > 15) return null
    return `https://wa.me/${digits}`
}
