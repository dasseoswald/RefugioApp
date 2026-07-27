import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    getMembers, getMemberById,
    getRefugios, createRefugio, updateRefugio, deleteRefugio,
    getRefugioEnrollments, enrollInRefugio, removeFromRefugio,
    getGroupNotices, createGroupNotice
} from '../../data/mockData.js'
import Modal from '../../components/ui/Modal.jsx'
import {
    Home, Users, UserPlus, UserMinus, Search, CheckCircle2,
    Crown, Plus, Edit2, Trash2, ChevronDown, ChevronUp, MapPin, Clock,
    Megaphone, Send, Calendar
} from 'lucide-react'

const COLOR = '#010101'
const COLOR_BG = '#EDEDED'
const GRADIENT = 'linear-gradient(135deg, #010101, #1A1A1A)'

const EMPTY_REFUGIO_FORM = { name: '', leader_member_id: '', meeting_day: '', meeting_time: '', location: '' }

export default function RefugiosPage() {
    const { user } = useAuth()
    const [refugios, setRefugios] = useState([])
    const [enrollments, setEnrollments] = useState([])
    const [members, setMembers] = useState([])
    const [notification, setNotification] = useState(null)
    const [expandedId, setExpandedId] = useState(null)
    const [searchTerms, setSearchTerms] = useState({})

    const [showFormModal, setShowFormModal] = useState(false)
    const [editingRefugio, setEditingRefugio] = useState(null)
    const [form, setForm] = useState(EMPTY_REFUGIO_FORM)

    const [deletingRefugio, setDeletingRefugio] = useState(null)

    const [notices, setNotices] = useState([])
    const [noticeTitle, setNoticeTitle] = useState('')
    const [noticeContent, setNoticeContent] = useState('')

    useEffect(() => { refreshData() }, [])

    const refreshData = () => {
        setRefugios(getRefugios())
        setEnrollments(getRefugioEnrollments())
        setMembers(getMembers().filter(m => m.is_active))
        setNotices(getGroupNotices('refugios'))
    }

    const handlePublishNotice = () => {
        if (!noticeTitle.trim() || !noticeContent.trim()) return
        createGroupNotice({
            group_id: 'refugios',
            title: noticeTitle.trim(),
            content: noticeContent.trim(),
            author_name: user?.name,
            author_id: user?.id,
            media_url: null,
            media_type: null,
        })
        setNoticeTitle('')
        setNoticeContent('')
        setNotices(getGroupNotices('refugios'))
        showNotification('Aviso publicado en Refugios')
    }

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    const membersOf = (refugioId) => enrollments
        .filter(e => e.refugio_id === refugioId)
        .map(e => getMemberById(e.member_id))
        .filter(Boolean)

    const totalEnrolled = enrollments.length
    const sinLider = refugios.filter(r => !r.leader_member_id).length

    const openCreateModal = () => {
        setEditingRefugio(null)
        setForm(EMPTY_REFUGIO_FORM)
        setShowFormModal(true)
    }

    const openEditModal = (refugio) => {
        setEditingRefugio(refugio)
        setForm({
            name: refugio.name,
            leader_member_id: refugio.leader_member_id || '',
            meeting_day: refugio.meeting_day || '',
            meeting_time: refugio.meeting_time || '',
            location: refugio.location || '',
        })
        setShowFormModal(true)
    }

    const handleSaveRefugio = () => {
        if (!form.name.trim()) return
        if (editingRefugio) {
            updateRefugio(editingRefugio.id, form)
            showNotification('Refugio actualizado exitosamente')
        } else {
            createRefugio(form)
            showNotification('Refugio creado exitosamente')
        }
        setShowFormModal(false)
        refreshData()
    }

    const confirmDeleteRefugio = () => {
        if (!deletingRefugio) return
        deleteRefugio(deletingRefugio.id)
        setDeletingRefugio(null)
        refreshData()
        showNotification('Refugio eliminado', 'info')
    }

    const handleEnroll = (refugioId, memberId, memberName) => {
        enrollInRefugio(memberId, refugioId)
        refreshData()
        showNotification(`${memberName} agregado al refugio`)
    }

    const handleRemove = (memberId, memberName) => {
        removeFromRefugio(memberId)
        refreshData()
        showNotification(`${memberName} removido del refugio`, 'info')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: GRADIENT }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <Home className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Refugios</h1>
                        <p className="text-white/70 text-sm mt-1">Grupos pequeños: subgrupos, líderes y miembros</p>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl animate-fade-in ${notification.type === 'success' ? 'bg-[#E1F9EC] text-[#111111]' : 'bg-[#E8F4FC] text-[#111111]'}`}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: notification.type === 'success' ? '#13CD68' : '#2696D2' }} />
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            )}

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(38,150,210,0.08)] text-center">
                    <p className="text-2xl font-bold" style={{ color: COLOR }}>{refugios.length}</p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Refugios Activos</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(38,150,210,0.08)] text-center">
                    <p className="text-2xl font-bold text-[#111111]">{totalEnrolled}</p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Miembros en Refugios</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(38,150,210,0.08)] text-center">
                    <p className="text-2xl font-bold text-[#E8A838]">{sinLider}</p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Sin Líder Asignado</p>
                </div>
            </div>

            {/* Action button */}
            <div className="flex gap-3">
                <button onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer"
                    style={{ background: GRADIENT }}>
                    <Plus className="w-4 h-4" /> Nuevo Refugio
                </button>
            </div>

            {/* Refugios list */}
            <div className="space-y-4">
                {refugios.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                        <Home className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                        <p className="text-lg font-medium text-[#6E6E6E]">No hay refugios creados</p>
                        <p className="text-sm text-[#6E6E6E]">Crea el primer refugio con el botón de arriba</p>
                    </div>
                ) : (
                    refugios.map(refugio => {
                        const isExpanded = expandedId === refugio.id
                        const leader = refugio.leader_member_id ? getMemberById(refugio.leader_member_id) : null
                        const enrolledMembers = membersOf(refugio.id)
                        const searchTerm = searchTerms[refugio.id] || ''
                        const availableMembers = members.filter(m =>
                            !enrolledMembers.some(em => em.id === m.id) &&
                            (m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (m.email || '').toLowerCase().includes(searchTerm.toLowerCase()))
                        )

                        return (
                            <div key={refugio.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden border border-gray-100">
                                {/* Refugio header */}
                                <div className="w-full px-6 py-4 flex items-center justify-between"
                                    style={isExpanded ? { background: COLOR_BG } : {}}>
                                    <button onClick={() => setExpandedId(isExpanded ? null : refugio.id)}
                                        className="flex items-center gap-4 flex-1 min-w-0 text-left cursor-pointer">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: COLOR }}>
                                            <Home className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#111111] truncate">{refugio.name}</p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                                <span className="text-xs text-[#6E6E6E] flex items-center gap-1">
                                                    <Crown className="w-3 h-3" /> {leader ? leader.full_name : 'Sin líder asignado'}
                                                </span>
                                                {refugio.meeting_day && (
                                                    <span className="text-xs text-[#6E6E6E] flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {refugio.meeting_day}{refugio.meeting_time ? ` ${refugio.meeting_time}` : ''}
                                                    </span>
                                                )}
                                                {refugio.location && (
                                                    <span className="text-xs text-[#6E6E6E] flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {refugio.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: COLOR_BG, color: COLOR }}>
                                            {enrolledMembers.length} miembros
                                        </span>
                                        <button onClick={() => openEditModal(refugio)}
                                            className="p-2 rounded-lg text-[#6E6E6E] hover:text-[#2696D2] hover:bg-[#E8F4FC] transition-colors cursor-pointer">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeletingRefugio(refugio)}
                                            className="p-2 rounded-lg text-[#6E6E6E] hover:text-[#E74C3C] hover:bg-[#FADBD8] transition-colors cursor-pointer">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setExpandedId(isExpanded ? null : refugio.id)} className="p-2 cursor-pointer">
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-[#111111]" /> : <ChevronDown className="w-4 h-4 text-[#6E6E6E]" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 p-5 bg-gray-50/30 space-y-4 animate-fade-in">
                                        {/* Enrolled members */}
                                        <div>
                                            <p className="text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider mb-2">Miembros del Refugio</p>
                                            {enrolledMembers.length === 0 ? (
                                                <p className="text-sm text-[#6E6E6E] py-3">Aún no hay miembros en este refugio</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {enrolledMembers.map(member => (
                                                        <div key={member.id} className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-gray-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: COLOR }}>
                                                                    {member.full_name.charAt(0)}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-[#111111]">{member.full_name}</span>
                                                                    {member.id === refugio.leader_member_id && (
                                                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: COLOR_BG, color: COLOR }}>Líder</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button onClick={() => handleRemove(member.id, member.full_name)}
                                                                className="p-1.5 rounded-lg text-gray-300 hover:text-[#E74C3C] hover:bg-[#FADBD8] transition-colors cursor-pointer">
                                                                <UserMinus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Add members */}
                                        <div>
                                            <p className="text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider mb-2">Agregar Miembro</p>
                                            <div className="relative mb-2">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
                                                <input type="text" value={searchTerm}
                                                    onChange={(e) => setSearchTerms(prev => ({ ...prev, [refugio.id]: e.target.value }))}
                                                    placeholder="Buscar miembro por nombre o correo..."
                                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#010101] text-sm" />
                                            </div>
                                            <div className="max-h-56 overflow-y-auto space-y-1.5">
                                                {availableMembers.length === 0 ? (
                                                    <p className="text-sm text-[#6E6E6E] text-center py-3">{searchTerm ? 'Sin resultados' : 'No hay más miembros disponibles'}</p>
                                                ) : availableMembers.map(m => (
                                                    <div key={m.id} className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[#6E6E6E]/15 flex items-center justify-center text-[#6E6E6E] text-xs font-semibold">{m.full_name.charAt(0)}</div>
                                                            <div>
                                                                <p className="text-sm font-medium text-[#111111]">{m.full_name}</p>
                                                                <p className="text-xs text-[#6E6E6E]">{m.member_type}</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleEnroll(refugio.id, m.id, m.full_name)}
                                                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white font-medium cursor-pointer transition-all hover:shadow-md"
                                                            style={{ background: COLOR }}>
                                                            <UserPlus className="w-3.5 h-3.5" /> Agregar
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Avisos del grupo Refugios */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Megaphone className="w-5 h-5" style={{ color: COLOR }} />
                    <h3 className="text-lg font-semibold text-[#111111]">Avisos del Grupo</h3>
                </div>
                <div className="p-5 space-y-4 border-b border-gray-100 bg-gray-50/30">
                    <input type="text" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)}
                        placeholder="Título del aviso..."
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#010101] text-sm font-medium" />
                    <textarea value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)}
                        placeholder="Escribe un aviso para todos los refugios..." rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#010101] text-sm resize-none" />
                    <div className="flex justify-end">
                        <button onClick={handlePublishNotice} disabled={!noticeTitle.trim() || !noticeContent.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all hover:shadow-md"
                            style={{ background: GRADIENT }}>
                            <Send className="w-4 h-4" /> Publicar
                        </button>
                    </div>
                </div>
                {notices.length === 0 ? (
                    <div className="p-10 text-center text-[#6E6E6E]">
                        <Megaphone className="w-10 h-10 mx-auto mb-2 text-[#6E6E6E]/20" />
                        <p className="text-sm">No hay avisos publicados en Refugios</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notices.map(notice => (
                            <div key={notice.id} className="px-6 py-4">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold text-[#111111]">{notice.title}</h4>
                                    <span className="text-xs text-[#6E6E6E] flex items-center gap-1 flex-shrink-0">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(notice.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-[#6E6E6E] mb-1.5">Por {notice.author_name}</p>
                                <p className="text-sm text-[#1F1F1F] whitespace-pre-wrap">{notice.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Refugio Modal */}
            <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={editingRefugio ? 'Editar Refugio' : 'Nuevo Refugio'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Nombre del Refugio *</label>
                        <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ej: Refugio Vida Nueva" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#010101] text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Líder Designado</label>
                        <select value={form.leader_member_id} onChange={(e) => setForm(f => ({ ...f, leader_member_id: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#010101] text-sm cursor-pointer">
                            <option value="">Sin asignar</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Día de Reunión</label>
                            <input type="text" value={form.meeting_day} onChange={(e) => setForm(f => ({ ...f, meeting_day: e.target.value }))}
                                placeholder="Ej: Miércoles" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#010101] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Hora</label>
                            <input type="time" value={form.meeting_time} onChange={(e) => setForm(f => ({ ...f, meeting_time: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#010101] text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Lugar / Dirección</label>
                        <input type="text" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                            placeholder="Ej: Casa de la familia Torrez" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#010101] text-sm" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowFormModal(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={handleSaveRefugio} disabled={!form.name.trim()}
                        className="px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: GRADIENT }}>
                        {editingRefugio ? 'Guardar Cambios' : 'Crear Refugio'}
                    </button>
                </div>
            </Modal>

            {/* Delete confirmation modal */}
            <Modal isOpen={!!deletingRefugio} onClose={() => setDeletingRefugio(null)} title="Eliminar Refugio" size="sm">
                <p className="text-sm text-[#1F1F1F]">
                    ¿Seguro que deseas eliminar <span className="font-semibold">{deletingRefugio?.name}</span>? Los miembros asignados quedarán sin refugio.
                </p>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setDeletingRefugio(null)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={confirmDeleteRefugio} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm bg-[#E74C3C] hover:bg-[#C0392B] cursor-pointer">Eliminar</button>
                </div>
            </Modal>
        </div>
    )
}
