import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
    getCetStatus, activateCetEvent, deactivateCetEvent,
    subscribeCetConnections, getCetConnections, addCetConnection, updateCetConnection, deleteCetConnection,
    linkCetConnectionToMember, findMemberMatchForCet, getMemberById, getMembers,
} from '../../data/mockData.js'
import { getWhatsAppUrl } from '../../lib/whatsapp.js'
import Modal from '../ui/Modal.jsx'
import {
    Sparkles, Power, PowerOff, Users, UserPlus, Phone, Mail, FileSpreadsheet, Trash2, Link2,
    CheckCircle2, Search, X, CalendarDays, Megaphone,
} from 'lucide-react'

const EMPTY_FORM = { name: '', phone: '', email: '', notes: '' }

function todayString() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr) {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

function WhatsAppIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    )
}

// Tarjeta fija de CET (Cielo en la Tierra) para la pantalla de Eventos: se
// activa para una fecha como un servicio y, quien administra, registra ahí a
// las personas nuevas que conectaron para sumarlas luego a la lista de
// difusión.
export default function CetEventCard({ event, canManage, user }) {
    const [showActivate, setShowActivate] = useState(false)
    const [activateDate, setActivateDate] = useState(todayString())
    const [showList, setShowList] = useState(false)
    const [connections, setConnections] = useState([])
    const [form, setForm] = useState(EMPTY_FORM)
    const [formError, setFormError] = useState('')
    const [editionFilter, setEditionFilter] = useState('all')
    const [linkingId, setLinkingId] = useState(null)
    const [linkSearch, setLinkSearch] = useState('')
    const [notification, setNotification] = useState(null)

    useEffect(() => {
        if (!canManage) return
        const refresh = () => setConnections(getCetConnections())
        const unsub = subscribeCetConnections(refresh)
        refresh()
        return unsub
    }, [canManage])

    const status = getCetStatus(event)
    const registrationOpen = status.state === 'today' || status.state === 'past'
    const currentEditionCount = status.date ? connections.filter(c => c.edition_date === status.date).length : 0

    const editions = useMemo(
        () => [...new Set(connections.map(c => c.edition_date))].sort().reverse(),
        [connections]
    )
    const visibleConnections = editionFilter === 'all' ? connections : connections.filter(c => c.edition_date === editionFilter)

    const statusInfo = {
        inactive: { label: 'Inactivo', bg: '#F3F4F6', color: '#6E6E6E' },
        scheduled: { label: `Programado: ${formatDate(status.date)}`, bg: '#E8F4FC', color: '#2696D2' },
        today: { label: 'En curso hoy — todo el día', bg: '#E1F9EC', color: '#13CD68' },
        past: { label: `Edición del ${formatDate(status.date)}`, bg: '#FFF3CD', color: '#8A6116' },
    }[status.state]

    const showNotification = (message) => {
        setNotification(message)
        setTimeout(() => setNotification(null), 3000)
    }

    const openActivate = () => {
        setActivateDate(status.date || todayString())
        setShowActivate(true)
    }

    const handleActivate = () => {
        if (!activateDate) return
        activateCetEvent(activateDate, user?.name)
        setShowActivate(false)
        setEditionFilter(activateDate)
        showNotification(`CET activado para el ${formatDate(activateDate)}`)
    }

    const handleDeactivate = () => {
        deactivateCetEvent(user?.name)
        showNotification('CET desactivado')
    }

    const openList = () => {
        setEditionFilter(status.date || 'all')
        setForm(EMPTY_FORM)
        setFormError('')
        setShowList(true)
    }

    const handleAdd = (e) => {
        e.preventDefault()
        const result = addCetConnection(form, { name: user?.name, uid: user?.auth_uid })
        if (result.error) {
            setFormError(result.error)
            return
        }
        setFormError('')
        setForm(EMPTY_FORM)
        const match = findMemberMatchForCet({ email: form.email, phone: form.phone })
        showNotification(match ? `${result.data.name} ya es miembro (${match.full_name}) — quedó vinculado` : `${result.data.name} registrado`)
    }

    const handleLink = (connectionId, memberId) => {
        linkCetConnectionToMember(connectionId, memberId)
        setLinkingId(null)
        setLinkSearch('')
        showNotification('Vinculado: su ficha queda marcada como "Conectó en CET"')
    }

    const linkCandidates = useMemo(() => {
        const term = linkSearch.trim().toLowerCase()
        if (!term) return []
        return getMembers().filter(m => m.full_name.toLowerCase().includes(term)).slice(0, 6)
    }, [linkSearch])

    const exportToExcel = () => {
        const wsData = [
            ['Personas que conectaron — CET (Cielo en la Tierra)'],
            [editionFilter === 'all' ? 'Todas las ediciones' : `Edición: ${formatDate(editionFilter)}`, `${visibleConnections.length} personas`],
            [],
            ['#', 'Nombre', 'Teléfono', 'Correo', 'Edición', 'Nota', 'En lista de difusión', 'Ya es miembro', 'Registrado por'],
            ...visibleConnections.map((c, i) => [
                i + 1, c.name, c.phone || '-', c.email || '-', formatDate(c.edition_date), c.notes || '-',
                c.added_to_broadcast ? 'Sí' : 'No', c.member_id ? (getMemberById(c.member_id)?.full_name || 'Sí') : 'No', c.registered_by || '-',
            ]),
        ]
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 18 }, { wch: 28 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 28 }, { wch: 20 }]
        XLSX.utils.book_append_sheet(wb, ws, 'Personas que conectaron')
        XLSX.writeFile(wb, `CET_Personas_que_conectaron_${editionFilter === 'all' ? 'todas' : editionFilter}.xlsx`)
    }

    return (
        <>
            <div className="rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(38,150,210,0.08)] bg-white">
                <div className="p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #010101 0%, #1D74A8 60%, #E8A838 100%)' }}>
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                    <div className="relative flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Evento permanente</span>
                                <h2 className="text-xl font-bold mt-1.5">{event.name}</h2>
                                <p className="text-white/75 text-sm mt-1 max-w-xl">{event.description}</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                            {statusInfo.label}
                        </span>
                    </div>
                </div>

                <div className="p-5 space-y-3">
                    {notification && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E1F9EC] text-[#111111] animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 text-[#13CD68]" />
                            <span className="text-sm font-medium">{notification}</span>
                        </div>
                    )}

                    {canManage ? (
                        <>
                            <div className="flex items-center gap-2 text-sm text-[#6E6E6E]">
                                <Users className="w-4 h-4" />
                                {status.date
                                    ? `${currentEditionCount} persona${currentEditionCount === 1 ? '' : 's'} conectaron en esta edición · ${connections.length} en total`
                                    : `${connections.length} persona${connections.length === 1 ? '' : 's'} conectaron en total`}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {status.state === 'inactive' ? (
                                    <button onClick={openActivate}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:shadow-md cursor-pointer"
                                        style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                                        <Power className="w-4 h-4" /> Activar CET
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={openActivate}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-[#2696D2] text-[#2696D2] hover:bg-[#E8F4FC] cursor-pointer">
                                            <CalendarDays className="w-4 h-4" /> Cambiar fecha
                                        </button>
                                        <button onClick={handleDeactivate}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-[#6E6E6E] hover:bg-gray-50 cursor-pointer">
                                            <PowerOff className="w-4 h-4" /> Desactivar
                                        </button>
                                    </>
                                )}
                                {registrationOpen && (
                                    <button onClick={openList}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:shadow-md cursor-pointer"
                                        style={{ background: 'linear-gradient(135deg, #E8A838, #D09530)' }}>
                                        <UserPlus className="w-4 h-4" /> Registrar persona
                                    </button>
                                )}
                                <button onClick={openList}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:shadow-md cursor-pointer"
                                    style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                                    <Megaphone className="w-4 h-4" /> Personas que conectaron
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-[#6E6E6E]">
                            {status.state === 'inactive' ? 'Aún no hay una fecha confirmada para el próximo CET.' : `Fecha: ${formatDate(status.date)}, todo el día.`}
                        </p>
                    )}
                </div>
            </div>

            {/* Activar: ¿cuándo se hará? */}
            <Modal isOpen={showActivate} onClose={() => setShowActivate(false)} title="Activar CET" size="sm">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">¿Cuándo se hará el evento?</label>
                        <input type="date" value={activateDate} onChange={(e) => setActivateDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                        <p className="text-xs text-[#6E6E6E] mt-1.5">Se activa ese día completo. Las personas que conecten quedan guardadas en esa edición.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowActivate(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={handleActivate} disabled={!activateDate}
                        className="px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                        Activar
                    </button>
                </div>
            </Modal>

            {/* Personas que conectaron */}
            <Modal isOpen={showList} onClose={() => setShowList(false)} title="Personas que conectaron — CET" size="xl">
                <div className="space-y-4">
                    {notification && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E1F9EC] text-[#111111] animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 text-[#13CD68]" />
                            <span className="text-sm font-medium">{notification}</span>
                        </div>
                    )}

                    {/* Registrar */}
                    {registrationOpen ? (
                        <form onSubmit={handleAdd} className="bg-gray-50/70 rounded-xl p-4 space-y-3">
                            <p className="text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">
                                Registrar a alguien — edición del {formatDate(status.date)}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Nombre *" className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm" />
                                <input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                                    placeholder="Teléfono / WhatsApp" className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm" />
                                <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="Correo (opcional)" className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm" />
                            </div>
                            <input type="text" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Nota (ej: de dónde es, por qué quiere que lo contactemos)"
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm" />
                            {formError && <p className="text-xs text-[#E74C3C]">{formError}</p>}
                            <div className="flex justify-end">
                                <button type="submit" disabled={!form.name.trim()}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                                    <UserPlus className="w-4 h-4" /> Registrar
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-[#FFF3CD] text-[#8A6116] text-sm px-4 py-3 rounded-xl">
                            {status.state === 'scheduled'
                                ? `Podrás registrar personas desde el ${formatDate(status.date)}.`
                                : 'Activa CET para una fecha y podrás registrar a las personas que conecten ese día.'}
                        </div>
                    )}

                    {/* Filtro + exportar */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <select value={editionFilter} onChange={(e) => setEditionFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:border-[#2696D2] cursor-pointer">
                            <option value="all">Todas las ediciones ({connections.length})</option>
                            {editions.map(d => (
                                <option key={d} value={d}>{formatDate(d)} ({connections.filter(c => c.edition_date === d).length})</option>
                            ))}
                        </select>
                        {visibleConnections.length > 0 && (
                            <button onClick={exportToExcel}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:shadow-md cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                                <FileSpreadsheet className="w-4 h-4" /> Exportar XLS
                            </button>
                        )}
                    </div>

                    {/* Lista */}
                    {visibleConnections.length === 0 ? (
                        <p className="text-sm text-[#6E6E6E] text-center py-8">Todavía no hay personas registradas{editionFilter !== 'all' ? ' en esta edición' : ''}.</p>
                    ) : (
                        <div className="max-h-[45vh] overflow-y-auto divide-y divide-gray-50">
                            {visibleConnections.map(c => {
                                const linkedMember = c.member_id ? getMemberById(c.member_id) : null
                                const whatsappUrl = getWhatsAppUrl(c.phone)
                                return (
                                    <div key={c.id} className="py-3 space-y-2">
                                        <div className="flex items-start gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-[#111111]">{c.name}</p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                                    {c.phone && <span className="text-xs text-[#6E6E6E] flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                                                    {c.email && <span className="text-xs text-[#6E6E6E] flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                                                    <span className="text-xs text-[#6E6E6E]">{formatDate(c.edition_date)}</span>
                                                </div>
                                                {c.notes && <p className="text-xs text-[#6E6E6E] mt-1 italic">{c.notes}</p>}
                                                {linkedMember && (
                                                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E1F9EC] text-[#13CD68]">
                                                        <Link2 className="w-3 h-3" /> Ya es miembro: {linkedMember.full_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {whatsappUrl && (
                                                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="Escribir por WhatsApp"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#E1F9EC] transition-colors">
                                                        <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                                                    </a>
                                                )}
                                                {!linkedMember && (
                                                    <button onClick={() => { setLinkingId(linkingId === c.id ? null : c.id); setLinkSearch('') }} title="Vincular a un miembro existente"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#E8F4FC] transition-colors cursor-pointer">
                                                        <Link2 className="w-4 h-4 text-[#2696D2]" />
                                                    </button>
                                                )}
                                                <button onClick={() => deleteCetConnection(c.id)} title="Quitar de la lista"
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer">
                                                    <Trash2 className="w-4 h-4 text-[#E74C3C]" />
                                                </button>
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-2 text-xs text-[#6E6E6E] cursor-pointer w-fit">
                                            <input type="checkbox" checked={!!c.added_to_broadcast}
                                                onChange={(e) => updateCetConnection(c.id, { added_to_broadcast: e.target.checked })}
                                                className="w-4 h-4 accent-[#2696D2] cursor-pointer" />
                                            Ya está en la lista de difusión
                                        </label>
                                        {linkingId === c.id && (
                                            <div className="bg-gray-50/70 rounded-xl p-3 space-y-2 animate-fade-in">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
                                                    <input type="text" value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} autoFocus
                                                        placeholder="Buscar el miembro por nombre..."
                                                        className="w-full pl-9 pr-8 py-2 rounded-lg border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm" />
                                                    <button onClick={() => setLinkingId(null)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6E6E6E] cursor-pointer"><X className="w-4 h-4" /></button>
                                                </div>
                                                {linkCandidates.map(m => (
                                                    <button key={m.id} onClick={() => handleLink(c.id, m.id)}
                                                        className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-100 hover:border-[#2696D2] text-left cursor-pointer">
                                                        <span className="text-sm text-[#111111]">{m.full_name}</span>
                                                        <span className="text-xs text-[#6E6E6E]">{m.member_type}</span>
                                                    </button>
                                                ))}
                                                {linkSearch.trim() && linkCandidates.length === 0 && (
                                                    <p className="text-xs text-[#6E6E6E] text-center py-1">Sin resultados</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    )
}
