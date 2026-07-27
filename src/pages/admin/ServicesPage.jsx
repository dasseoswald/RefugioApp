import { useState, useEffect } from 'react'
import { getServices, createService, updateService, toggleServiceActive, createPrayerRequest } from '../../data/mockData.js'
import Modal from '../../components/ui/Modal.jsx'
import ServiceAttendanceModal from '../../components/admin/ServiceAttendanceModal.jsx'
import { CalendarDays, Plus, Edit2, Power, PowerOff, Users, ClipboardCheck, History, CalendarCheck, HandHeart, Heart, Send } from 'lucide-react'
import { getAttendancesByService } from '../../data/mockData.js'

function getCurrentWeekSunday() {
    const today = new Date()
    const day = today.getDay() // 0 = domingo ... 6 = sábado
    const diff = day === 0 ? 0 : 7 - day
    const sunday = new Date(today)
    sunday.setDate(today.getDate() + diff)
    const y = sunday.getFullYear()
    const m = String(sunday.getMonth() + 1).padStart(2, '0')
    const d = String(sunday.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export default function ServicesPage() {
    const [services, setServices] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
    const [selectedService, setSelectedService] = useState(null)
    const [editing, setEditing] = useState(null)
    const [showAll, setShowAll] = useState(false)
    const [form, setForm] = useState({ name: '', service_date: '', pastor_name: '', starts_at: '07:00', ends_at: '13:00' })
    const [prayerService, setPrayerService] = useState(null)
    const [prayerForm, setPrayerForm] = useState({ author_name: '', type: 'oracion', content: '' })

    const currentWeekSunday = getCurrentWeekSunday()

    useEffect(() => { refreshServices() }, [])

    const refreshServices = () => setServices(getServices())

    const visibleServices = showAll ? services : services.filter(s => s.service_date === currentWeekSunday)
    const thisWeekService = services.find(s => s.service_date === currentWeekSunday)

    const openCreate = () => {
        setEditing(null)
        setForm({ name: 'Servicio Dominical', service_date: currentWeekSunday, pastor_name: '', starts_at: '07:00', ends_at: '13:00' })
        setIsModalOpen(true)
    }

    const openEdit = (service) => {
        setEditing(service)
        setForm({ name: service.name, service_date: service.service_date, pastor_name: service.pastor_name || '', starts_at: service.starts_at, ends_at: service.ends_at })
        setIsModalOpen(true)
    }

    const handleSave = () => {
        if (!form.name || !form.service_date) return
        if (editing) {
            updateService(editing.id, form)
        } else {
            createService(form)
        }
        refreshServices()
        setIsModalOpen(false)
    }

    const handleToggle = (id) => {
        toggleServiceActive(id)
        refreshServices()
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        // Create date using local components to avoid timezone offset issues
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }

    const openAttendance = (service) => {
        setSelectedService(service)
        setIsAttendanceModalOpen(true)
    }

    const openPrayerModal = (service, type) => {
        setPrayerService(service)
        setPrayerForm({ author_name: '', type, content: '' })
    }

    const handleSubmitPrayer = () => {
        if (!prayerForm.author_name.trim() || !prayerForm.content.trim()) return
        createPrayerRequest({
            service_id: prayerService.id,
            member_id: null,
            author_name: prayerForm.author_name.trim(),
            type: prayerForm.type,
            content: prayerForm.content.trim(),
        })
        setPrayerService(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111111]">Servicios Dominicales</h1>
                    <p className="text-[#6E6E6E] mt-1">{showAll ? 'Historial completo de servicios' : 'Servicio de esta semana'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowAll(v => !v)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-gray-200 text-[#6E6E6E] hover:bg-gray-50 transition-colors cursor-pointer">
                        {showAll ? <CalendarCheck className="w-4 h-4" /> : <History className="w-4 h-4" />}
                        {showAll ? 'Ver solo esta semana' : 'Ver historial completo'}
                    </button>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        <Plus className="w-4 h-4" /> Nuevo Servicio
                    </button>
                </div>
            </div>

            {!showAll && !thisWeekService && (
                <div className="bg-white rounded-2xl p-10 text-center shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                    <p className="text-lg font-medium text-[#111111]">Aún no hay un servicio creado para esta semana</p>
                    <p className="text-sm text-[#6E6E6E] mb-4">{formatDate(currentWeekSunday)}</p>
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        <Plus className="w-4 h-4" /> Crear Servicio de Esta Semana
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {visibleServices.map((service) => {
                    const attendeeCount = getAttendancesByService(service.id).length
                    return (
                        <div key={service.id}
                            className={`bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden transition-all hover:shadow-[0_8px_24px_rgba(38,150,210,0.15)] hover:-translate-y-0.5 ${service.is_active ? 'ring-2 ring-[#13CD68]' : ''
                                }`}>
                            <div className={`px-6 py-4 ${service.is_active ? 'bg-gradient-to-r from-[#13CD68] to-[#0FA855] text-white' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className={`w-5 h-5 ${service.is_active ? 'text-white' : 'text-[#2696D2]'}`} />
                                        <span className={`text-sm font-bold ${service.is_active ? 'text-white' : 'text-[#111111]'}`}>
                                            {service.is_active ? '🟢 ACTIVO' : 'Cerrado'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className={`w-4 h-4 ${service.is_active ? 'text-white/70' : 'text-[#6E6E6E]'}`} />
                                        <span className={`text-sm font-bold ${service.is_active ? 'text-white' : 'text-[#2696D2]'}`}>{attendeeCount}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-base font-semibold text-[#111111] mb-1">{service.name}</h3>
                                <p className="text-sm text-[#6E6E6E] mb-1 capitalize">{formatDate(service.service_date)}</p>
                                <p className="text-sm text-[#6E6E6E] mb-1">{service.pastor_name || 'Pastor no asignado'}</p>
                                <p className="text-xs text-[#6E6E6E]">🕐 {service.starts_at} - {service.ends_at}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <button onClick={() => openAttendance(service)}
                                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-white bg-[#2696D2] hover:shadow-md transition-all cursor-pointer">
                                        <ClipboardCheck className="w-4 h-4" /> Asistencia
                                    </button>
                                    <button onClick={() => openEdit(service)}
                                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#2696D2] hover:bg-[#E8F4FC] transition-colors cursor-pointer" title="Editar Servicio">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleToggle(service.id)}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${service.is_active ? 'text-[#E74C3C] hover:bg-[#FADBD8]' : 'text-[#13CD68] hover:bg-[#E1F9EC]'
                                            }`} title={service.is_active ? 'Cerrar Servicio' : 'Activar Servicio'}>
                                        {service.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                    </button>
                                </div>
                                {service.is_active && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <button onClick={() => openPrayerModal(service, 'oracion')}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border-2 transition-all hover:shadow-md cursor-pointer"
                                            style={{ borderColor: '#2696D2', color: '#2696D2' }}>
                                            <HandHeart className="w-3.5 h-3.5" /> Oración
                                        </button>
                                        <button onClick={() => openPrayerModal(service, 'gratitud')}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border-2 transition-all hover:shadow-md cursor-pointer"
                                            style={{ borderColor: '#13CD68', color: '#13CD68' }}>
                                            <Heart className="w-3.5 h-3.5" /> Gratitud
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Editar Servicio' : 'Nuevo Servicio'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Nombre del Servicio *</label>
                        <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Fecha *</label>
                        <input type="date" value={form.service_date} onChange={(e) => setForm(f => ({ ...f, service_date: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Pastor Principal</label>
                        <input type="text" value={form.pastor_name} onChange={(e) => setForm(f => ({ ...f, pastor_name: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" placeholder="Nombre del pastor" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Hora Inicio</label>
                            <input type="time" value={form.starts_at} onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Hora Cierre</label>
                            <input type="time" value={form.ends_at} onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 transition-colors cursor-pointer">Cancelar</button>
                    <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer" style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        {editing ? 'Guardar' : 'Crear Servicio'}
                    </button>
                </div>
            </Modal>

            {/* Prayer / Gratitude Modal */}
            <Modal isOpen={!!prayerService} onClose={() => setPrayerService(null)}
                title={prayerForm.type === 'oracion' ? 'Nueva Petición de Oración' : 'Nueva Gratitud'}>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPrayerForm(f => ({ ...f, type: 'oracion' }))}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${prayerForm.type === 'oracion' ? 'text-white border-transparent' : 'border-gray-200 text-[#6E6E6E]'
                                }`} style={prayerForm.type === 'oracion' ? { background: '#2696D2' } : {}}>
                            <HandHeart className="w-4 h-4" /> Oración
                        </button>
                        <button onClick={() => setPrayerForm(f => ({ ...f, type: 'gratitud' }))}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${prayerForm.type === 'gratitud' ? 'text-white border-transparent' : 'border-gray-200 text-[#6E6E6E]'
                                }`} style={prayerForm.type === 'gratitud' ? { background: '#13CD68' } : {}}>
                            <Heart className="w-4 h-4" /> Gratitud
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Nombre del Hermano/a *</label>
                        <input type="text" value={prayerForm.author_name} onChange={(e) => setPrayerForm(f => ({ ...f, author_name: e.target.value }))}
                            placeholder="Nombre completo" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">
                            {prayerForm.type === 'oracion' ? 'Petición de Oración *' : 'Motivo de Gratitud *'}
                        </label>
                        <textarea value={prayerForm.content} onChange={(e) => setPrayerForm(f => ({ ...f, content: e.target.value }))} rows={4}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm resize-none" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setPrayerService(null)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={handleSubmitPrayer} disabled={!prayerForm.author_name.trim() || !prayerForm.content.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: prayerForm.type === 'oracion' ? 'linear-gradient(135deg, #2696D2, #1D74A8)' : 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                        <Send className="w-4 h-4" /> Guardar
                    </button>
                </div>
            </Modal>

            {/* Attendance Modal */}
            {selectedService && (
                <ServiceAttendanceModal 
                    isOpen={isAttendanceModalOpen} 
                    onClose={() => {
                        setIsAttendanceModalOpen(false)
                        refreshServices() // Refresh counts when closing
                    }}
                    service={selectedService}
                />
            )}
        </div>
    )
}
