import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    getMembers, createMember, updateMember, toggleMemberActive, deleteMember, getAttendancesByMember, getMemberRefugio,
    OPERATIONAL_GROUPS, WELCOME_CHECK_ACTIONS, getPossibleDuplicateMembers, mergeMembers,
} from '../../data/mockData.js'
import Modal from '../../components/ui/Modal.jsx'
import { useRolePermissions, hasDynamicPermission } from '../../hooks/useRolePermissions.js'
import { getWhatsAppUrl } from '../../lib/whatsapp.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Search, UserPlus, Edit2, ToggleLeft, ToggleRight, Users, Filter, FileUser, Home, X, CheckCircle2, Circle, Trash2, AlertTriangle, Merge, FileText, Table } from 'lucide-react'

function WhatsAppIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    )
}

const PAGE_SIZE = 20
const MEMBER_TYPES = ['Miembro Activo', 'Miembro Inactivo', 'Visitante', 'Servidor', 'Líder', 'Pastor']
const CIVIL_STATUSES = ['Soltero', 'Casado', 'Viudo', 'Divorciado']
const GENDERS = ['M', 'F', 'Otro']
const EMPTY_FORM = { full_name: '', birth_date: '', gender: 'M', civil_status: 'Soltero', member_type: 'Miembro Activo', phone: '', email: '', groups: [] }

export default function MembersPage({ canToggleActive: canToggleActiveProp = false }) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const rolePermissions = useRolePermissions()
    // Admin siempre lo tiene (vía el prop en App.jsx); Controlador/Tesorero/
    // Bienvenida lo obtienen si el admin les activó "Gestión de miembros"
    // en la matriz de permisos (ver hasDynamicPermission en firestore.rules).
    const canToggleActive = canToggleActiveProp || hasDynamicPermission(rolePermissions, user?.role, 'manage_members')
    const [members, setMembers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [formError, setFormError] = useState('')
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const sentinelRef = useRef(null)
    const [deletingMember, setDeletingMember] = useState(null)
    const [duplicateGroups, setDuplicateGroups] = useState([])
    const [mergingGroup, setMergingGroup] = useState(null)
    const [keepMemberId, setKeepMemberId] = useState(null)

    useEffect(() => { refreshMembers() }, [])

    const refreshMembers = () => {
        setMembers(getMembers())
        setDuplicateGroups(getPossibleDuplicateMembers())
    }

    const openMerge = (group) => {
        setMergingGroup(group)
        // Se sugiere conservar por defecto al que tenga más asistencias
        // (probablemente la ficha "real" que la gente ya usa).
        const suggested = [...group].sort((a, b) => getAttendancesByMember(b.id).length - getAttendancesByMember(a.id).length)[0]
        setKeepMemberId(suggested.id)
    }

    const handleConfirmMerge = () => {
        if (!mergingGroup || !keepMemberId) return
        mergingGroup.filter(m => m.id !== keepMemberId).forEach(m => mergeMembers(keepMemberId, m.id))
        setMergingGroup(null)
        setKeepMemberId(null)
        refreshMembers()
    }

    const filtered = members.filter(m => {
        const matchSearch = m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchType = !filterType || m.member_type === filterType
        const matchStatus = filterStatus === '' || (filterStatus === 'active' ? m.is_active : !m.is_active)
        return matchSearch && matchType && matchStatus
    })

    const visibleMembers = filtered.slice(0, visibleCount)
    const hasMore = visibleCount < filtered.length

    // Exportar datos personales: mismo criterio que exportar reportes
    // (admin, controlador, o quien tenga "Exportar PDF/Excel" en la matriz).
    const canExport = user?.role === 'admin' || user?.role === 'controller' || hasDynamicPermission(rolePermissions, user?.role, 'export_reports')

    // Exporta TODOS los miembros que coinciden con la búsqueda/filtros
    // actuales (no solo los que ya se cargaron en pantalla por el scroll).
    const buildExportRows = () => filtered.map((m) => ({
        nombre: m.full_name,
        tipo: m.member_type,
        estado: m.is_active ? 'Activo' : 'Inactivo',
        telefono: m.phone || '',
        correo: m.email || '',
        nacimiento: m.birth_date || '',
        genero: m.gender === 'M' ? 'Masculino' : m.gender === 'F' ? 'Femenino' : (m.gender || ''),
        estadoCivil: m.civil_status || '',
        ministerios: OPERATIONAL_GROUPS.filter(g => m[g.field]).map(g => g.name).join(', '),
        refugio: getMemberRefugio(m.id)?.refugio.name || '',
        asistencias: getAttendancesByMember(m.id).length,
    }))

    const exportFileSuffix = () => new Date().toISOString().split('T')[0]

    const exportMembersToPDF = () => {
        const rows = buildExportRows()
        const doc = new jsPDF({ orientation: 'landscape' })
        doc.setFontSize(18)
        doc.setTextColor(44, 62, 80)
        doc.text('Listado de Miembros', 14, 20)
        doc.setFontSize(11)
        doc.setTextColor(127, 140, 141)
        doc.text(`${rows.length} miembros — ${new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 28)

        autoTable(doc, {
            startY: 34,
            head: [['#', 'Nombre', 'Tipo', 'Estado', 'Teléfono', 'Correo', 'Ministerios', 'Refugio', 'Asist.']],
            body: rows.map((r, i) => [i + 1, r.nombre, r.tipo, r.estado, r.telefono, r.correo, r.ministerios, r.refugio, r.asistencias]),
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [74, 111, 165], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 246, 255] },
        })

        doc.save(`Miembros_${exportFileSuffix()}.pdf`)
    }

    const exportMembersToExcel = () => {
        const rows = buildExportRows()
        const wsData = [
            ['Listado de Miembros'],
            [`${rows.length} miembros`, `Fecha: ${exportFileSuffix()}`],
            [],
            ['#', 'Nombre', 'Tipo de Miembro', 'Estado', 'Teléfono', 'Correo', 'Fecha de Nacimiento', 'Género', 'Estado Civil', 'Ministerios', 'Refugio', 'Asistencias'],
            ...rows.map((r, i) => [i + 1, r.nombre, r.tipo, r.estado, r.telefono, r.correo, r.nacimiento, r.genero, r.estadoCivil, r.ministerios, r.refugio, r.asistencias]),
        ]
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        ws['!cols'] = [{ wch: 5 }, { wch: 32 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 22 }, { wch: 12 }]
        XLSX.utils.book_append_sheet(wb, ws, 'Miembros')
        XLSX.writeFile(wb, `Miembros_${exportFileSuffix()}.xlsx`)
    }

    // Scroll infinito: cuando el borde inferior de la lista se acerca a la
    // pantalla se muestran PAGE_SIZE miembros más. El observador se vuelve a
    // crear tras cada carga para que, si el borde sigue a la vista (lista
    // corta o pantalla alta), siga cargando hasta llenar la pantalla.
    useEffect(() => {
        const el = sentinelRef.current
        if (!el || !hasMore) return
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) setVisibleCount(c => c + PAGE_SIZE)
        }, { rootMargin: '300px' })
        observer.observe(el)
        return () => observer.disconnect()
    }, [hasMore, visibleCount])

    const openCreate = () => { setEditingMember(null); setForm(EMPTY_FORM); setFormError(''); setIsModalOpen(true) }

    const openEdit = (member) => {
        setEditingMember(member)
        setForm({ full_name: member.full_name, birth_date: member.birth_date, gender: member.gender, civil_status: member.civil_status, member_type: member.member_type, phone: member.phone || '', email: member.email || '', groups: member.groups || [] })
        setFormError('')
        setIsModalOpen(true)
    }

    const handleSave = () => {
        if (!form.full_name.trim()) {
            setFormError('El nombre completo es obligatorio')
            return
        }
        setFormError('')
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

    const handleConfirmDelete = () => {
        if (!deletingMember) return
        deleteMember(deletingMember.id)
        setDeletingMember(null)
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
                <div className="flex flex-wrap gap-2">
                    {canExport && (
                        <>
                            <button onClick={exportMembersToPDF} disabled={filtered.length === 0}
                                title="Exportar la lista (con los filtros actuales) a PDF"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #E74C3C, #C0392B)' }}>
                                <FileText className="w-4 h-4" /> PDF
                            </button>
                            <button onClick={exportMembersToExcel} disabled={filtered.length === 0}
                                title="Exportar la lista (con los filtros actuales) a Excel"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                                <Table className="w-4 h-4" /> Excel
                            </button>
                        </>
                    )}
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        <UserPlus className="w-4 h-4" /> Nuevo Miembro
                    </button>
                </div>
            </div>

            {/* Posibles duplicados (mismo nombre, con o sin tildes) */}
            {canToggleActive && duplicateGroups.length > 0 && (
                <div className="bg-[#FFF3CD] rounded-2xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-[#8A6116] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {duplicateGroups.length} posible{duplicateGroups.length === 1 ? '' : 's'} duplicado{duplicateGroups.length === 1 ? '' : 's'} de miembro
                    </p>
                    {duplicateGroups.map((group, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 bg-white/70 rounded-xl px-4 py-2.5 flex-wrap">
                            <span className="text-sm text-[#111111]">
                                {group.map(m => m.full_name).join('  ·  ')}
                            </span>
                            <button onClick={() => openMerge(group)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer flex-shrink-0"
                                style={{ background: '#E8A838' }}>
                                <Merge className="w-3.5 h-3.5" /> Unificar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E6E]" />
                    <input
                        type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(PAGE_SIZE) }}
                        placeholder="Buscar por nombre o correo..." className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-[#111111] placeholder:text-[#6E6E6E]/50 focus:outline-none focus:border-[#2696D2] transition-all" />
                </div>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setVisibleCount(PAGE_SIZE) }}
                    className="px-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-[#111111] focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                    <option value="">Todos los tipos</option>
                    {MEMBER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setVisibleCount(PAGE_SIZE) }}
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
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider hidden lg:table-cell">
                                    {filterType === 'Visitante' ? 'Próximo Paso' : 'Refugio Designado'}
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">
                                    {filterType === 'Visitante' ? 'Bienvenida' : 'Estado'}
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {visibleMembers.map((member) => {
                                const attendanceCount = getAttendancesByMember(member.id).length
                                const memberRefugio = getMemberRefugio(member.id)
                                const whatsappUrl = getWhatsAppUrl(member.phone)
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
                                            {filterType === 'Visitante' ? (
                                                (() => {
                                                    const checks = Math.min(attendanceCount, WELCOME_CHECK_ACTIONS.length)
                                                    return (
                                                        <span className="text-xs text-[#6E6E6E]">
                                                            {checks > 0 ? (checks >= WELCOME_CHECK_ACTIONS.length ? 'Bienvenida completa' : `Corresponde: ${WELCOME_CHECK_ACTIONS[checks - 1]}`) : 'Aún sin asistencias'}
                                                        </span>
                                                    )
                                                })()
                                            ) : memberRefugio ? (
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
                                            {filterType === 'Visitante' ? (
                                                (() => {
                                                    const checks = Math.min(attendanceCount, WELCOME_CHECK_ACTIONS.length)
                                                    return (
                                                        <div className="flex items-center gap-0.5">
                                                            {WELCOME_CHECK_ACTIONS.map((_, i) => (
                                                                i < checks
                                                                    ? <CheckCircle2 key={i} className="w-4 h-4 text-[#13CD68]" />
                                                                    : <Circle key={i} className="w-4 h-4 text-gray-200" />
                                                            ))}
                                                        </div>
                                                    )
                                                })()
                                            ) : (
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${member.is_active ? 'bg-[#E1F9EC] text-[#13CD68]' : 'bg-gray-100 text-[#6E6E6E]'}`}>
                                                    {member.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {whatsappUrl && (
                                                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#E1F9EC] transition-colors cursor-pointer"
                                                        title={`Escribir a ${member.full_name} por WhatsApp`} aria-label={`Escribir a ${member.full_name} por WhatsApp`}>
                                                        <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                                                    </a>
                                                )}
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
                                                {canToggleActive && (
                                                    <button onClick={() => setDeletingMember(member)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer" title="Eliminar Miembro">
                                                        <Trash2 className="w-4 h-4 text-[#E74C3C]" />
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

                {/* Scroll infinito: este borde dispara la carga de más miembros al acercarse a la pantalla */}
                {hasMore && (
                    <div ref={sentinelRef} className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-[#6E6E6E]">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-[#2696D2] rounded-full animate-spin"></div>
                        Cargando más miembros...
                    </div>
                )}
                {!hasMore && filtered.length > PAGE_SIZE && (
                    <p className="px-6 py-3 border-t border-gray-100 text-center text-xs text-[#6E6E6E]">Mostrando los {filtered.length} miembros</p>
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
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Fecha de Nacimiento</label>
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
                {formError && (
                    <div className="mt-4 bg-[#FADBD8] text-[#E74C3C] text-sm px-4 py-3 rounded-xl">{formError}</div>
                )}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 transition-colors cursor-pointer">Cancelar</button>
                    <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer" style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        {editingMember ? 'Guardar Cambios' : 'Crear Miembro'}
                    </button>
                </div>
            </Modal>

            {/* Confirmación de eliminación */}
            <Modal isOpen={!!deletingMember} onClose={() => setDeletingMember(null)} title="Eliminar Miembro">
                <div className="space-y-4">
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FADBD8] text-sm text-[#111111]">
                        <AlertTriangle className="w-5 h-5 text-[#E74C3C] flex-shrink-0 mt-0.5" />
                        <span>
                            Esta acción es permanente. Se eliminará a <strong>{deletingMember?.full_name}</strong> junto con su historial de asistencias, hoja de vida, notas de perfil e inscripciones a grupos. Si tiene una cuenta de usuario vinculada, quedará desvinculada.
                        </span>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setDeletingMember(null)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={handleConfirmDelete}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg cursor-pointer"
                        style={{ background: '#E74C3C' }}>
                        <Trash2 className="w-4 h-4" /> Eliminar Definitivamente
                    </button>
                </div>
            </Modal>

            {/* Unificar duplicados */}
            <Modal isOpen={!!mergingGroup} onClose={() => setMergingGroup(null)} title="Unificar Miembros Duplicados">
                {mergingGroup && (
                    <div className="space-y-4">
                        <p className="text-sm text-[#6E6E6E]">
                            Elige cuál ficha se conserva. Las asistencias, cuenta de usuario, notas e inscripciones de las demás se traspasan a esa ficha, y las otras se eliminan.
                        </p>
                        <div className="space-y-2">
                            {mergingGroup.map(m => (
                                <label key={m.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${keepMemberId === m.id ? 'border-[#2696D2] bg-[#E8F4FC]' : 'border-gray-100'}`}>
                                    <input type="radio" name="keepMember" checked={keepMemberId === m.id} onChange={() => setKeepMemberId(m.id)}
                                        className="w-4 h-4 accent-[#2696D2] cursor-pointer" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#111111]">{m.full_name}</p>
                                        <p className="text-xs text-[#6E6E6E]">
                                            {m.member_type} · {m.email || 'sin correo'} · {getAttendancesByMember(m.id).length} asistencias
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex items-start gap-2.5 bg-[#FADBD8] text-sm text-[#111111] px-4 py-3 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-[#E74C3C] flex-shrink-0 mt-0.5" />
                            <span>Esta acción no se puede deshacer.</span>
                        </div>
                    </div>
                )}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setMergingGroup(null)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={handleConfirmMerge}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg cursor-pointer"
                        style={{ background: '#E8A838' }}>
                        <Merge className="w-4 h-4" /> Unificar
                    </button>
                </div>
            </Modal>
        </div>
    )
}
