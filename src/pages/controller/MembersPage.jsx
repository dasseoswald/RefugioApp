import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getMembers, createMember, updateMember, toggleMemberActive, getAttendancesByMember, getMemberRefugio, OPERATIONAL_GROUPS } from '../../data/mockData.js'
import Modal from '../../components/ui/Modal.jsx'
import { Search, UserPlus, Edit2, ToggleLeft, ToggleRight, Users, Filter, ChevronLeft, ChevronRight, FileUser, Home, X } from 'lucide-react'

const MEMBER_TYPES = ['Miembro Activo', 'Miembro Inactivo', 'Visitante', 'Servidor', 'Líder', 'Pastor']
const CIVIL_STATUSES = ['Soltero', 'Casado', 'Viudo', 'Divorciado']
const GENDERS = ['M', 'F', 'Otro']
const EMPTY_FORM = { full_name: '', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', groups: [] }

export default function MembersPage({ canToggleActive = false }) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [members, setMembers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [page, setPage] = useState(1)
    const perPage = 8

    useEffect(() => { refreshMembers() }, [])

    const refreshMembers = () => setMembers(getMembers())

    const filtered = members.filter(m => {
        const matchSearch = m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchType = !filterType || m.member_type === filterType
        const matchStatus = filterStatus === '' || (filterStatus === 'active' ? m.is_active : !m.is_active)
        return matchSearch && matchType && matchStatus
    })

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)

    const openCreate = () => { setEditingMember(null); setForm(EMPTY_FORM); setIsModalOpen(true) }

    const openEdit = (member) => {
        setEditingMember(member)
        setForm({ full_name: member.full_name, birth_date: member.birth_date, gender: member.gender, civil_status: member.civil_status, member_type: member.member_type, phone: member.phone || '', email: member.email || '', groups: member.groups || [] })
        setIsModalOpen(true)
    }

    const handleSave = () => {
        if (!form.full_name || !form.birth_date) return
        if (editingMember) {
            updateMember(editingMember.id, form)
        } else {
            createMember(form)
        }
        refreshMembers()
        setIsModalOpen(false)
    }

    const handleToggleActive = (id) => {
        toggleMemberActive(id)
        refreshMembers()
    }

    const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

    const toggleGroup = (groupName) => {
        setForm(prev => {
            const currentGroups = prev.groups || []
            if (currentGroups.includes(groupName)) {
                return { ...prev, groups: currentGroups.filter(g => g !== groupName) }
            } else {
                return { ...prev, groups: [...currentGroups, groupName] }
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111111]">Gestión de Miembros</h1>
                    <p className="text-[#6E6E6E] mt-1">{filtered.length} miembros encontrados</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                    <UserPlus className="w-4 h-4" /> Nuevo Miembro
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E6E]" />
                    <input
                        type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                        placeholder="Buscar por nombre o correo..." className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-[#111111] placeholder:text-[#6E6E6E]/50 focus:outline-none focus:border-[#2696D2] transition-all" />
                </div>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
                    className="px-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-[#111111] focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                    <option value="">Todos los tipos</option>
                    {MEMBER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
                    className="px-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-[#111111] focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                    <option value="">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Miembro</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider hidden md:table-cell">Tipo</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider hidden lg:table-cell">Teléfono</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider hidden lg:table-cell">Refugio Designado</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Estado</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginated.map((member) => {
                                const attendanceCount = getAttendancesByMember(member.id).length
                                const memberRefugio = getMemberRefugio(member.id)
                                return (
                                    <tr key={member.id} className="hover:bg-[#E8F4FC]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                                    style={{ background: member.is_active ? '#2696D2' : '#6E6E6E' }}>
                                                    {member.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#111111]">{member.full_name}</p>
                                                    <p className="text-xs text-[#6E6E6E]">{member.email} • {attendanceCount} asistencias</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-[#E8F4FC] text-[#2696D2] font-medium">{member.member_type}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-sm text-[#111111]">{member.phone || '—'}</td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-sm">
                                            {memberRefugio ? (
                                                <div className="flex items-center gap-1.5 text-[#111111]">
                                                    <Home className="w-3.5 h-3.5 text-[#6E6E6E] flex-shrink-0" />
                                                    <span className="font-medium">{memberRefugio.refugio.name}</span>
                                                    <span className="text-[#6E6E6E]">/</span>
                                                    <span className="text-[#6E6E6E]">{memberRefugio.leaderName || 'Sin líder'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[#6E6E6E]">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${member.is_active ? 'bg-[#E1F9EC] text-[#13CD68]' : 'bg-gray-100 text-[#6E6E6E]'}`}>
                                                {member.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => navigate(`/${user?.role}/member/${member.id}`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#E8F4FC] transition-colors cursor-pointer" title="Hoja de Vida">
                                                    <FileUser className="w-4 h-4 text-[#13CD68]" />
                                                </button>
                                                <button onClick={() => openEdit(member)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#E8F4FC] transition-colors cursor-pointer" title="Editar">
                                                    <Edit2 className="w-4 h-4 text-[#2696D2]" />
                                                </button>
                                                {canToggleActive && (
                                                    <button onClick={() => handleToggleActive(member.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer" title={member.is_active ? 'Desactivar' : 'Activar'}>
                                                        {member.is_active ? <ToggleRight className="w-5 h-5 text-[#13CD68]" /> : <ToggleLeft className="w-5 h-5 text-[#6E6E6E]" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-[#6E6E6E]">Página {page} de {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMember ? 'Editar Miembro' : 'Nuevo Miembro'} size="lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Nombre Completo *</label>
                        <input type="text" value={form.full_name} onChange={(e) => updateField('full_name', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" placeholder="Nombre completo" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Fecha de Nacimiento *</label>
                        <input type="date" value={form.birth_date} onChange={(e) => updateField('birth_date', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Género</label>
                        <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            {GENDERS.map(g => <option key={g} value={g}>{g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : 'Otro'}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Estado Civil</label>
                        <select value={form.civil_status} onChange={(e) => updateField('civil_status', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            {CIVIL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Tipo de Miembro</label>
                        <select value={form.member_type} onChange={(e) => updateField('member_type', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            {MEMBER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Teléfono</label>
                        <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" placeholder="+591 7XX-XXXX" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Correo Electrónico</label>
                        <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" placeholder="correo@ejemplo.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Grupos / Ministerios</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {(form.groups || []).map(groupName => (
                                <span key={groupName} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2696D2] text-white text-xs font-medium shadow-sm transition-all hover:bg-[#1D74A8]">
                                    {groupName}
                                    <button onClick={(e) => { e.preventDefault(); toggleGroup(groupName); }} className="hover:bg-black/20 rounded-full p-0.5 cursor-pointer ml-1">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <select value="" onChange={(e) => { if (e.target.value) toggleGroup(e.target.value); }}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            <option value="">Añadir ministerio...</option>
                            {OPERATIONAL_GROUPS.filter(g => !(form.groups || []).includes(g.name)).map(g => (
                                <option key={g.id} value={g.name}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 transition-colors cursor-pointer">Cancelar</button>
                    <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer" style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        {editingMember ? 'Guardar Cambios' : 'Crear Miembro'}
                    </button>
                </div>
            </Modal>
        </div>
    )
}
