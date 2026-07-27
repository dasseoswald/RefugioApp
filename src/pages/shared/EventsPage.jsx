import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    getEvents, createEvent, updateEvent, deleteEvent,
    getEventRegistrations, getEventRegistrationCount, isRegisteredForEvent, registerForEvent, unregisterFromEvent,
    setEventRegistrationPaymentMethod
} from '../../data/mockData.js'
import Modal from '../../components/ui/Modal.jsx'
import {
    PartyPopper, Plus, Calendar, Clock, MapPin, DollarSign, Image as ImageIcon,
    Edit2, Trash2, X, Map, ExternalLink, CheckCircle2, UserPlus, Users, Phone, Mail, FileSpreadsheet
} from 'lucide-react'

const PAYMENT_METHODS = [
    { value: '', label: 'Sin pagar' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'tarjeta', label: 'Tarjeta' },
]
const PAYMENT_LABELS = Object.fromEntries(PAYMENT_METHODS.map(m => [m.value, m.label]))

const EMPTY_FORM = { name: '', start_date: '', days: 1, starts_at: '', ends_at: '', location: '', price: 'Gratis', poster_url: null }

export default function EventsPage() {
    const { user } = useAuth()
    const canManage = user?.role === 'admin' || user?.role === 'controller'

    const [events, setEvents] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [expandedMapId, setExpandedMapId] = useState(null)
    const [deletingEvent, setDeletingEvent] = useState(null)
    const [notification, setNotification] = useState(null)
    const [viewingEvent, setViewingEvent] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => { refreshData() }, [])

    const refreshData = () => setEvents(getEvents())

    const showNotification = (message) => {
        setNotification(message)
        setTimeout(() => setNotification(null), 3000)
    }

    const openCreate = () => {
        setEditingEvent(null)
        setForm(EMPTY_FORM)
        setShowModal(true)
    }

    const openEdit = (event) => {
        setEditingEvent(event)
        setForm({
            name: event.name, start_date: event.start_date, days: event.days,
            starts_at: event.starts_at, ends_at: event.ends_at, location: event.location,
            price: event.price, poster_url: event.poster_url,
        })
        setShowModal(true)
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => setForm(f => ({ ...f, poster_url: reader.result }))
        reader.readAsDataURL(file)
    }

    const removePoster = () => {
        setForm(f => ({ ...f, poster_url: null }))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSave = () => {
        if (!form.name.trim() || !form.start_date || !form.location.trim()) return
        if (editingEvent) {
            updateEvent(editingEvent.id, form)
            showNotification('Evento actualizado exitosamente')
        } else {
            createEvent({ ...form, created_by: user?.name })
            showNotification('Evento publicado exitosamente')
        }
        setShowModal(false)
        refreshData()
    }

    const confirmDelete = () => {
        if (!deletingEvent) return
        deleteEvent(deletingEvent.id)
        setDeletingEvent(null)
        refreshData()
        showNotification('Evento eliminado')
    }

    const formatDateRange = (event) => {
        const [y, m, d] = event.start_date.split('-').map(Number)
        const start = new Date(y, m - 1, d)
        const startLabel = start.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
        if (event.days <= 1) return startLabel
        const end = new Date(y, m - 1, d + (event.days - 1))
        const endLabel = end.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
        return `${start.toLocaleDateString('es', { day: 'numeric', month: 'short' })} al ${endLabel}`
    }

    const mapsEmbedUrl = (location) => `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`
    const mapsLinkUrl = (location) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

    const handleRegister = (event) => {
        const result = registerForEvent(event.id, user?.member_id, user?.name)
        if (result.error) {
            showNotification(result.error)
        } else {
            showNotification(`Te inscribiste en "${event.name}" 🎉`)
        }
        refreshData()
    }

    const handleUnregister = (event) => {
        unregisterFromEvent(event.id, user?.member_id)
        showNotification(`Cancelaste tu inscripción en "${event.name}"`)
        refreshData()
    }

    const handleSetPaymentMethod = (registrationId, method) => {
        setEventRegistrationPaymentMethod(registrationId, method)
        refreshData()
    }

    const exportRegistrationsToExcel = (event) => {
        const regs = getEventRegistrations(event.id)
        const wsData = [
            [`Inscritos — ${event.name}`],
            [`Fecha: ${formatDateRange(event)}`, `Lugar: ${event.location}`, `Valor: ${event.price}`],
            [],
            ['#', 'Nombre', 'Correo', 'Número de Contacto', 'Modo de Pago'],
            ...regs.map((r, i) => [i + 1, r.name, r.email || '-', r.phone || '-', PAYMENT_LABELS[r.payment_method || ''] || r.payment_method]),
        ]
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 28 }, { wch: 18 }, { wch: 16 }]
        XLSX.utils.book_append_sheet(wb, ws, 'Inscritos')
        XLSX.writeFile(wb, `Inscritos_${event.name.replace(/\s+/g, '_')}.xlsx`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #E8A838 0%, #2696D2 100%)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                            <PartyPopper className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Eventos</h1>
                            <p className="text-white/70 text-sm mt-1">Eventos especiales de la iglesia</p>
                        </div>
                    </div>
                    {canManage && (
                        <button onClick={openCreate}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white transition-all hover:shadow-lg cursor-pointer" style={{ color: '#E8A838' }}>
                            <Plus className="w-4 h-4" /> Nuevo Evento
                        </button>
                    )}
                </div>
            </div>

            {notification && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E1F9EC] text-[#111111] animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-[#13CD68]" />
                    <span className="text-sm font-medium">{notification}</span>
                </div>
            )}

            {/* Events grid */}
            {events.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                    <PartyPopper className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                    <p className="text-lg font-medium text-[#6E6E6E]">Aún no hay eventos publicados</p>
                    {canManage && <p className="text-sm text-[#6E6E6E]">Crea el primero con el botón de arriba</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
                    {events.map(event => (
                        <div key={event.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden hover:shadow-[0_8px_24px_rgba(38,150,210,0.15)] transition-all">
                            {/* Poster / cover */}
                            <div className="relative h-44 bg-gray-100">
                                {event.poster_url ? (
                                    <img src={event.poster_url} alt={event.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8A838, #2696D2)' }}>
                                        <PartyPopper className="w-12 h-12 text-white/60" />
                                    </div>
                                )}
                                {event.days > 1 && (
                                    <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                                        {event.days} días
                                    </span>
                                )}
                                {canManage && (
                                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                        <button onClick={() => openEdit(event)}
                                            className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors cursor-pointer" title="Editar">
                                            <Edit2 className="w-4 h-4 text-[#2696D2]" />
                                        </button>
                                        <button onClick={() => setDeletingEvent(event)}
                                            className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors cursor-pointer" title="Eliminar">
                                            <Trash2 className="w-4 h-4 text-[#E74C3C]" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-5 space-y-2.5">
                                <h3 className="text-base font-bold text-[#111111]">{event.name}</h3>
                                <div className="text-sm text-[#6E6E6E] flex items-center gap-2 capitalize">
                                    <Calendar className="w-4 h-4 text-[#E8A838] flex-shrink-0" /> {formatDateRange(event)}
                                </div>
                                {(event.starts_at || event.ends_at) && (
                                    <div className="text-sm text-[#6E6E6E] flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[#E8A838] flex-shrink-0" />
                                        {event.starts_at}{event.ends_at ? ` - ${event.ends_at}` : ''}
                                    </div>
                                )}
                                <div className="text-sm text-[#6E6E6E] flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#E8A838] flex-shrink-0" />
                                    <span className="flex-1">{event.location}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                        style={{ background: event.price.toLowerCase() === 'gratis' ? '#E1F9EC' : '#E8F4FC', color: event.price.toLowerCase() === 'gratis' ? '#13CD68' : '#2696D2' }}>
                                        <DollarSign className="w-3 h-3" /> {event.price}
                                    </span>
                                    <button onClick={() => setExpandedMapId(expandedMapId === event.id ? null : event.id)}
                                        className="text-xs font-medium text-[#2696D2] hover:underline cursor-pointer flex items-center gap-1">
                                        <Map className="w-3.5 h-3.5" /> {expandedMapId === event.id ? 'Ocultar mapa' : 'Ver mapa'}
                                    </button>
                                </div>
                                {expandedMapId === event.id && (
                                    <div className="pt-2 space-y-2 animate-fade-in">
                                        <iframe
                                            title={`Mapa ${event.name}`}
                                            src={mapsEmbedUrl(event.location)}
                                            className="w-full h-40 rounded-xl border-0"
                                            loading="lazy"
                                        />
                                        <a href={mapsLinkUrl(event.location)} target="_blank" rel="noreferrer"
                                            className="text-xs font-medium text-[#2696D2] hover:underline flex items-center gap-1 justify-end">
                                            Abrir en Google Maps <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}

                                {/* Inscripción */}
                                <div className="pt-2 mt-1 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs font-medium text-[#6E6E6E] flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" /> {getEventRegistrationCount(event.id)} inscrito{getEventRegistrationCount(event.id) === 1 ? '' : 's'}
                                    </span>
                                    {canManage && (
                                        <button onClick={() => setViewingEvent(event)}
                                            className="text-xs font-medium text-[#2696D2] hover:underline cursor-pointer">
                                            Ver inscritos
                                        </button>
                                    )}
                                </div>
                                {!user?.member_id ? (
                                    <button disabled title="No tienes un perfil de miembro vinculado a tu usuario"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-300 cursor-not-allowed">
                                        <UserPlus className="w-4 h-4" /> Inscribirme
                                    </button>
                                ) : isRegisteredForEvent(event.id, user.member_id) ? (
                                    <button onClick={() => handleUnregister(event)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 border-[#13CD68] text-[#13CD68] hover:bg-[#E1F9EC] transition-all cursor-pointer">
                                        <CheckCircle2 className="w-4 h-4" /> Inscrito — Cancelar
                                    </button>
                                ) : (
                                    <button onClick={() => handleRegister(event)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-md cursor-pointer"
                                        style={{ background: 'linear-gradient(135deg, #E8A838, #D09530)' }}>
                                        <UserPlus className="w-4 h-4" /> Inscribirme
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEvent ? 'Editar Evento' : 'Nuevo Evento'} size="lg">
                <div className="space-y-4">
                    {/* Poster upload */}
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Afiche del Evento</label>
                        {form.poster_url ? (
                            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                                <img src={form.poster_url} alt="Afiche" className="w-full h-full object-cover" />
                                <button onClick={removePoster} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-[#6E6E6E] hover:border-[#E8A838] hover:text-[#E8A838] transition-colors cursor-pointer">
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-sm">Subir imagen del afiche</span>
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Nombre del Evento *</label>
                        <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ej: Congreso de Jóvenes 2026" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#E8A838] text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Fecha de Inicio *</label>
                            <input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#E8A838] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Duración (días) *</label>
                            <input type="number" min="1" value={form.days} onChange={(e) => setForm(f => ({ ...f, days: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#E8A838] text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Hora Inicio</label>
                            <input type="time" value={form.starts_at} onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#E8A838] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Hora Término</label>
                            <input type="time" value={form.ends_at} onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#E8A838] text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Lugar *</label>
                        <input type="text" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                            placeholder="Ej: Templo Central, Av. Siempre Viva 123" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#E8A838] text-sm" />
                        <p className="text-xs text-[#6E6E6E] mt-1">Se usará para mostrar el mapa de ubicación automáticamente.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Valor del Evento</label>
                        <input type="text" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                            placeholder="Ej: Gratis, $10.000" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#E8A838] text-sm" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={handleSave} disabled={!form.name.trim() || !form.start_date || !form.location.trim()}
                        className="px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #E8A838, #D09530)' }}>
                        {editingEvent ? 'Guardar Cambios' : 'Publicar Evento'}
                    </button>
                </div>
            </Modal>

            {/* Delete confirmation */}
            <Modal isOpen={!!deletingEvent} onClose={() => setDeletingEvent(null)} title="Eliminar Evento" size="sm">
                <p className="text-sm text-[#1F1F1F]">
                    ¿Seguro que deseas eliminar <span className="font-semibold">{deletingEvent?.name}</span>? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setDeletingEvent(null)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm bg-[#E74C3C] hover:bg-[#C0392B] cursor-pointer">Eliminar</button>
                </div>
            </Modal>

            {/* Ver Inscritos */}
            <Modal isOpen={!!viewingEvent} onClose={() => setViewingEvent(null)} title={`Inscritos — ${viewingEvent?.name || ''}`} size="lg">
                {viewingEvent && (() => {
                    const regs = getEventRegistrations(viewingEvent.id)
                    const isPaidEvent = viewingEvent.price && viewingEvent.price.toLowerCase() !== 'gratis'
                    return (
                        <div className="space-y-3">
                            {regs.length > 0 && (
                                <div className="flex justify-end">
                                    <button onClick={() => exportRegistrationsToExcel(viewingEvent)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:shadow-md cursor-pointer"
                                        style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                                        <FileSpreadsheet className="w-4 h-4" /> Exportar XLS
                                    </button>
                                </div>
                            )}
                            {regs.length === 0 ? (
                                <p className="text-sm text-[#6E6E6E] text-center py-8">Aún no hay hermanos inscritos en este evento</p>
                            ) : (
                                <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                                    {regs.map((r, i) => (
                                        <div key={r.id} className="flex items-center gap-3 py-3">
                                            <div className="w-8 h-8 rounded-full bg-[#E8F4FC] flex items-center justify-center text-xs font-semibold text-[#2696D2] flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-[#111111] truncate">{r.name}</p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                                    {r.phone && (
                                                        <span className="text-xs text-[#6E6E6E] flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {r.phone}
                                                        </span>
                                                    )}
                                                    {r.email && (
                                                        <span className="text-xs text-[#6E6E6E] flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> {r.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isPaidEvent && (
                                                <select
                                                    value={r.payment_method || ''}
                                                    onChange={(e) => handleSetPaymentMethod(r.id, e.target.value)}
                                                    className={`text-xs font-medium rounded-lg border-2 px-2 py-1.5 flex-shrink-0 cursor-pointer focus:outline-none ${r.payment_method ? 'border-[#13CD68] text-[#13CD68]' : 'border-gray-200 text-[#6E6E6E]'
                                                        }`}
                                                >
                                                    {PAYMENT_METHODS.map(m => (
                                                        <option key={m.value} value={m.value}>{m.label}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })()}
            </Modal>
        </div>
    )
}
