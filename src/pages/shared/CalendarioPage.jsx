import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { subscribeActivities, getActivities, createActivity, updateActivity, deleteActivity, getMemberById, OPERATIONAL_GROUPS } from '../../data/mockData.js'
import Modal from '../../components/ui/Modal.jsx'
import { CalendarRange, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Trash2, Edit2, X } from 'lucide-react'

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const EMPTY_FORM = { title: '', description: '', date: '', starts_at: '', ends_at: '', location: '', group_id: '' }

function toDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarioPage() {
    const { user } = useAuth()
    const myMember = user?.member_id ? getMemberById(user.member_id) : null
    const isStaff = user?.role === 'admin' || user?.role === 'controller'
    const canManage = isStaff || myMember?.member_type === 'Líder'

    const today = new Date()
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [activities, setActivities] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingActivity, setEditingActivity] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [viewingDay, setViewingDay] = useState(null)
    const [deletingActivity, setDeletingActivity] = useState(null)

    useEffect(() => {
        const unsubscribe = subscribeActivities(() => setActivities(getActivities()))
        setActivities(getActivities())
        return unsubscribe
    }, [])

    const activitiesByDate = {}
    activities.forEach(a => {
        if (!activitiesByDate[a.date]) activitiesByDate[a.date] = []
        activitiesByDate[a.date].push(a)
    })

    const firstOfMonth = new Date(viewYear, viewMonth, 1)
    const startWeekday = firstOfMonth.getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const monthLabel = firstOfMonth.toLocaleDateString('es', { month: 'long', year: 'numeric' })

    const cells = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    const changeMonth = (delta) => {
        const next = new Date(viewYear, viewMonth + delta, 1)
        setViewYear(next.getFullYear())
        setViewMonth(next.getMonth())
    }

    const openCreate = (dateKey) => {
        setEditingActivity(null)
        setForm({ ...EMPTY_FORM, date: dateKey || '' })
        setShowModal(true)
    }

    const openEdit = (activity) => {
        setEditingActivity(activity)
        setForm({
            title: activity.title, description: activity.description || '', date: activity.date,
            starts_at: activity.starts_at || '', ends_at: activity.ends_at || '',
            location: activity.location || '', group_id: activity.group_id || '',
        })
        setShowModal(true)
    }

    const canEditActivity = (activity) => isStaff || activity.created_by_uid === user?.auth_uid

    const handleSave = () => {
        if (!form.title.trim() || !form.date) return
        if (editingActivity) {
            updateActivity(editingActivity.id, form)
        } else {
            createActivity({ ...form, created_by: user?.name, created_by_uid: user?.auth_uid })
        }
        setShowModal(false)
    }

    const confirmDelete = () => {
        if (!deletingActivity) return
        deleteActivity(deletingActivity.id)
        setDeletingActivity(null)
        setViewingDay(null)
    }

    const groupName = (groupId) => OPERATIONAL_GROUPS.find(g => g.id === groupId)?.name || null

    return (
        <div className="space-y-6">
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2696D2 0%, #111111 100%)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                            <CalendarRange className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Calendario de Actividades</h1>
                            <p className="text-white/70 text-sm mt-1">Lo que cada ministerio tiene agendado</p>
                        </div>
                    </div>
                    {canManage && (
                        <button onClick={() => openCreate('')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white transition-all hover:shadow-lg cursor-pointer" style={{ color: '#2696D2' }}>
                            <Plus className="w-4 h-4" /> Nueva Actividad
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <button onClick={() => changeMonth(-1)} className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <p className="text-base font-semibold text-[#111111] capitalize">{monthLabel}</p>
                    <button onClick={() => changeMonth(1)} className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-7 border-b border-gray-100">
                    {WEEKDAY_LABELS.map(w => (
                        <div key={w} className="px-2 py-2 text-center text-xs font-semibold text-[#6E6E6E] uppercase">{w}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {cells.map((day, i) => {
                        if (day === null) return <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-gray-50" />
                        const dateKey = toDateKey(viewYear, viewMonth, day)
                        const dayActivities = activitiesByDate[dateKey] || []
                        const isToday = dateKey === toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
                        return (
                            <button key={dateKey} onClick={() => setViewingDay(dateKey)}
                                className="min-h-[90px] border-b border-r border-gray-50 p-1.5 text-left hover:bg-gray-50/50 transition-colors cursor-pointer flex flex-col gap-1">
                                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'text-white' : 'text-[#111111]'}`}
                                    style={isToday ? { background: '#2696D2' } : {}}>
                                    {day}
                                </span>
                                <div className="space-y-0.5 overflow-hidden">
                                    {dayActivities.slice(0, 2).map(a => (
                                        <div key={a.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8F4FC] text-[#2696D2] font-medium truncate">
                                            {a.title}
                                        </div>
                                    ))}
                                    {dayActivities.length > 2 && (
                                        <div className="text-[10px] text-[#6E6E6E] px-1.5">+{dayActivities.length - 2} más</div>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Detalle del día */}
            <Modal isOpen={!!viewingDay} onClose={() => setViewingDay(null)}
                title={viewingDay ? new Date(viewingDay + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}>
                <div className="space-y-3">
                    {(activitiesByDate[viewingDay] || []).length === 0 ? (
                        <p className="text-sm text-[#6E6E6E] text-center py-6">Sin actividades este día.</p>
                    ) : (
                        (activitiesByDate[viewingDay] || []).map(a => (
                            <div key={a.id} className="p-4 rounded-xl bg-gray-50 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-[#111111]">{a.title}</p>
                                    {canEditActivity(a) && (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-white cursor-pointer" title="Editar">
                                                <Edit2 className="w-3.5 h-3.5 text-[#2696D2]" />
                                            </button>
                                            <button onClick={() => setDeletingActivity(a)} className="p-1.5 rounded-lg hover:bg-white cursor-pointer" title="Eliminar">
                                                <Trash2 className="w-3.5 h-3.5 text-[#E74C3C]" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {groupName(a.group_id) && (
                                    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E8F4FC] text-[#2696D2]">{groupName(a.group_id)}</span>
                                )}
                                {(a.starts_at || a.ends_at) && (
                                    <p className="text-xs text-[#6E6E6E] flex items-center gap-1.5"><Clock className="w-3 h-3" /> {a.starts_at}{a.ends_at ? ` - ${a.ends_at}` : ''}</p>
                                )}
                                {a.location && <p className="text-xs text-[#6E6E6E] flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {a.location}</p>}
                                {a.description && <p className="text-sm text-[#111111] pt-1">{a.description}</p>}
                            </div>
                        ))
                    )}
                    {canManage && viewingDay && (
                        <button onClick={() => openCreate(viewingDay)}
                            className="flex items-center gap-2 text-sm font-medium text-[#2696D2] hover:underline cursor-pointer">
                            <Plus className="w-4 h-4" /> Agregar actividad este día
                        </button>
                    )}
                </div>
            </Modal>

            {/* Crear/editar actividad */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingActivity ? 'Editar Actividad' : 'Nueva Actividad'} size="lg">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Título *</label>
                        <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Ej: Reunión de líderes" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Fecha *</label>
                            <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Hora Inicio</label>
                            <input type="time" value={form.starts_at} onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Hora Término</label>
                            <input type="time" value={form.ends_at} onChange={(e) => setForm(f => ({ ...f, ends_at: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Ministerio (opcional)</label>
                        <select value={form.group_id} onChange={(e) => setForm(f => ({ ...f, group_id: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            <option value="">General (toda la iglesia)</option>
                            {OPERATIONAL_GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Lugar</label>
                        <input type="text" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                            placeholder="Ej: Templo Central" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Descripción</label>
                        <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm resize-none" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={handleSave} disabled={!form.title.trim() || !form.date}
                        className="px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        {editingActivity ? 'Guardar Cambios' : 'Publicar Actividad'}
                    </button>
                </div>
            </Modal>

            {/* Confirmar borrado */}
            <Modal isOpen={!!deletingActivity} onClose={() => setDeletingActivity(null)} title="Eliminar Actividad" size="sm">
                <p className="text-sm text-[#1F1F1F]">
                    ¿Seguro que deseas eliminar <span className="font-semibold">{deletingActivity?.title}</span>?
                </p>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setDeletingActivity(null)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm bg-[#E74C3C] hover:bg-[#C0392B] cursor-pointer">Eliminar</button>
                </div>
            </Modal>
        </div>
    )
}
