import { useState, useEffect, useMemo, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    getMemberById, getAttendancesByMember,
    getMemberProfile, updateMemberProfile,
    getProfileNotes, addProfileNote,
    getMemberAttendanceLastYear, getServices
} from '../../data/mockData.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import {
    ArrowLeft, Save, MapPin, Briefcase, Heart, Church,
    Droplets, AlertTriangle, Phone, Users as UsersIcon,
    StickyNote, Plus, Calendar, BarChart3, Edit2, Check, X,
    TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Clock
} from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS, CategoryScale, LinearScale,
    BarElement, Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

function InfoField({ icon: Icon, label, value, isEditing, field, editValue, onEditChange, type = 'text', options }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#E8F4FC' }}>
                <Icon className="w-4 h-4 text-[#2696D2]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#6E6E6E] uppercase tracking-wider">{label}</p>
                {isEditing ? (
                    type === 'select' ? (
                        <select
                            value={editValue || ''}
                            onChange={(e) => onEditChange(field, e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer"
                        >
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ) : type === 'checkbox' ? (
                        <label className="flex items-center gap-2 mt-1 cursor-pointer">
                            <input type="checkbox" checked={!!editValue}
                                onChange={(e) => onEditChange(field, e.target.checked)}
                                className="w-4 h-4 rounded accent-[#2696D2]" />
                            <span className="text-sm text-[#111111]">{editValue ? 'Sí' : 'No'}</span>
                        </label>
                    ) : type === 'textarea' ? (
                        <textarea
                            value={editValue || ''}
                            onChange={(e) => onEditChange(field, e.target.value)}
                            rows={2}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm resize-none"
                        />
                    ) : (
                        <input
                            type={type}
                            value={editValue || ''}
                            onChange={(e) => onEditChange(field, e.target.value)}
                            className="w-full mt-1 px-3 py-1.5 rounded-lg border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm"
                        />
                    )
                ) : (
                    <p className="text-sm text-[#111111] mt-0.5">{value || '—'}</p>
                )}
            </div>
        </div>
    )
}

export default function MemberProfilePage() {
    const { memberId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [member, setMember] = useState(null)
    const [profile, setProfile] = useState(null)
    const [notes, setNotes] = useState([])
    const [yearlyAttendance, setYearlyAttendance] = useState([])
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [newNote, setNewNote] = useState('')
    const [activeTab, setActiveTab] = useState('info')
    const [expandedMonth, setExpandedMonth] = useState(null)

    useEffect(() => {
        refreshData()
    }, [memberId])

    const refreshData = () => {
        const memberData = getMemberById(memberId)
        setMember(memberData)
        setProfile(getMemberProfile(memberId))
        setNotes(getProfileNotes(memberId))
        setYearlyAttendance(getMemberAttendanceLastYear(memberId))
    }

    const totalAttendances = useMemo(() =>
        getAttendancesByMember(memberId).length
        , [memberId])

    const totalYearAttendances = useMemo(() =>
        yearlyAttendance.reduce((sum, m) => sum + m.count, 0)
        , [yearlyAttendance])

    const services = useMemo(() => getServices(), [])
    const totalServicesLastYear = useMemo(() => {
        const now = new Date()
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        return services.filter(s => new Date(s.service_date) >= oneYearAgo).length
    }, [services])

    const attendancePercentage = useMemo(() => {
        if (totalServicesLastYear === 0) return 0
        return Math.round((totalYearAttendances / totalServicesLastYear) * 100)
    }, [totalYearAttendances, totalServicesLastYear])

    if (!member) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-[#6E6E6E] text-lg">Miembro no encontrado</p>
                    <button onClick={() => navigate(-1)}
                        className="mt-4 px-5 py-2 rounded-xl text-white font-medium text-sm cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        Volver
                    </button>
                </div>
            </div>
        )
    }

    const handleStartEdit = () => {
        setEditForm({ ...profile })
        setIsEditing(true)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditForm({})
    }

    const handleSaveProfile = () => {
        updateMemberProfile(memberId, editForm)
        setProfile(getMemberProfile(memberId))
        setIsEditing(false)
        setEditForm({})
    }

    const handleEditFieldChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }))
    }

    const handleAddNote = () => {
        if (!newNote.trim()) return
        addProfileNote(memberId, user?.name || 'Sistema', newNote.trim())
        setNotes(getProfileNotes(memberId))
        setNewNote('')
    }

    const goBack = () => {
        const basePath = user?.role === 'admin' ? '/admin/members' : '/controller/members'
        navigate(basePath)
    }

    const chartData = {
        labels: yearlyAttendance.map(m => m.month),
        datasets: [{
            label: 'Asistencias',
            data: yearlyAttendance.map(m => m.count),
            backgroundColor: yearlyAttendance.map(m =>
                m.count > 0 ? 'rgba(38,150,210, 0.8)' : 'rgba(127, 140, 141, 0.3)'
            ),
            borderColor: yearlyAttendance.map(m =>
                m.count > 0 ? '#2696D2' : 'rgba(127, 140, 141, 0.5)'
            ),
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
        }],
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#111111',
                titleFont: { family: 'Inter' },
                bodyFont: { family: 'Inter' },
                cornerRadius: 8,
                padding: 12,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    font: { family: 'Inter', size: 11 },
                    color: '#6E6E6E',
                },
                grid: { color: 'rgba(0,0,0,0.04)' },
            },
            x: {
                ticks: {
                    font: { family: 'Inter', size: 10 },
                    color: '#6E6E6E',
                    maxRotation: 45,
                },
                grid: { display: false },
            },
        },
    }

    const tabs = [
        { id: 'info', label: 'Información Personal', icon: UsersIcon },
        { id: 'notes', label: 'Notas', icon: StickyNote, count: notes.length },
        { id: 'attendance', label: 'Asistencia Anual', icon: BarChart3 },
    ]

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back button */}
            <button onClick={goBack}
                className="flex items-center gap-2 text-[#6E6E6E] hover:text-[#2696D2] transition-colors text-sm font-medium cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Volver a Miembros
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #010101 0%, #2696D2 50%, #5CB0E0 100%)' }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                </div>
                <div className="px-8 pb-6 -mt-14 relative">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        <div className="ring-4 ring-white rounded-full shadow-lg">
                            <UserAvatar
                                photoUrl={member.photo_url}
                                name={member.full_name}
                                size="lg"
                                bgColor="#2696D2"
                            />
                        </div>
                        <div className="flex-1 pt-2 sm:pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-[#111111]">{member.full_name}</h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#E8F4FC] text-[#2696D2] font-medium">{member.member_type}</span>
                                        {member.groups?.map(g => (
                                            <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-[#E1F9EC] text-[#13CD68] font-medium">{g}</span>
                                        ))}
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${member.is_active ? 'bg-[#E1F9EC] text-[#13CD68]' : 'bg-gray-100 text-[#6E6E6E]'}`}>
                                            {member.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Attendance badge */}
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8F4FC] border border-[#2696D2]/10">
                                        <Calendar className="w-4 h-4 text-[#2696D2]" />
                                        <div>
                                            <p className="text-xs text-[#6E6E6E]">Asistencia anual</p>
                                            <p className="text-lg font-bold text-[#2696D2]">
                                                {totalYearAttendances}
                                                <span className="text-xs font-normal text-[#6E6E6E] ml-1">({attendancePercentage}%)</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl p-1 shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id
                                ? 'text-white shadow-md'
                                : 'text-[#6E6E6E] hover:text-[#111111] hover:bg-gray-50'
                            }`}
                        style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #2696D2, #1D74A8)' } : {}}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#6E6E6E]'
                                }`}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && (
                <div className="animate-fade-in space-y-4">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[#111111]">Datos Básicos</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <InfoField icon={Calendar} label="Fecha de Nacimiento"
                                value={member.birth_date ? new Date(member.birth_date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} />
                            <InfoField icon={UsersIcon} label="Género"
                                value={member.gender === 'M' ? 'Masculino' : member.gender === 'F' ? 'Femenino' : 'Otro'} />
                            <InfoField icon={Heart} label="Estado Civil" value={member.civil_status} />
                            <InfoField icon={Phone} label="Teléfono" value={member.phone} />
                            <InfoField icon={StickyNote} label="Correo" value={member.email} />
                            <InfoField icon={Calendar} label="Miembro desde"
                                value={member.created_at ? new Date(member.created_at + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} />
                        </div>
                    </div>

                    {/* Extended Info - Hoja de Vida */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[#111111]">Hoja de Vida</h2>
                            {!isEditing ? (
                                <button onClick={handleStartEdit}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#2696D2] text-sm font-medium hover:bg-[#E8F4FC] transition-colors cursor-pointer">
                                    <Edit2 className="w-4 h-4" /> Editar
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={handleCancelEdit}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-gray-200 text-[#6E6E6E] text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                                        <X className="w-4 h-4" /> Cancelar
                                    </button>
                                    <button onClick={handleSaveProfile}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:shadow-lg cursor-pointer"
                                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                                        <Save className="w-4 h-4" /> Guardar
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <InfoField icon={MapPin} label="Dirección"
                                value={profile?.address} isEditing={isEditing} field="address"
                                editValue={editForm.address} onEditChange={handleEditFieldChange} />
                            <InfoField icon={Briefcase} label="Ocupación"
                                value={profile?.occupation} isEditing={isEditing} field="occupation"
                                editValue={editForm.occupation} onEditChange={handleEditFieldChange} />
                            <InfoField icon={Church} label="Ministerio"
                                value={profile?.ministry} isEditing={isEditing} field="ministry"
                                editValue={editForm.ministry} onEditChange={handleEditFieldChange} />
                            <InfoField icon={Church} label="Bautizado"
                                value={profile?.baptized ? `Sí — ${profile.baptism_date ? new Date(profile.baptism_date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha'}` : 'No'}
                                isEditing={isEditing} field="baptized"
                                editValue={editForm.baptized} onEditChange={handleEditFieldChange} type="checkbox" />
                            {(isEditing && editForm.baptized) && (
                                <InfoField icon={Calendar} label="Fecha de Bautismo"
                                    value={profile?.baptism_date} isEditing={isEditing} field="baptism_date"
                                    editValue={editForm.baptism_date} onEditChange={handleEditFieldChange} type="date" />
                            )}
                            <InfoField icon={UsersIcon} label="Información Familiar"
                                value={profile?.family_info} isEditing={isEditing} field="family_info"
                                editValue={editForm.family_info} onEditChange={handleEditFieldChange} type="textarea" />
                            <InfoField icon={Phone} label="Contacto de Emergencia"
                                value={profile?.emergency_contact ? `${profile.emergency_contact} (${profile.emergency_phone || 'Sin teléfono'})` : ''}
                                isEditing={isEditing} field="emergency_contact"
                                editValue={editForm.emergency_contact} onEditChange={handleEditFieldChange} />
                            {isEditing && (
                                <InfoField icon={Phone} label="Teléfono de Emergencia"
                                    value={profile?.emergency_phone} isEditing={isEditing} field="emergency_phone"
                                    editValue={editForm.emergency_phone} onEditChange={handleEditFieldChange} type="tel" />
                            )}
                            <InfoField icon={Droplets} label="Tipo de Sangre"
                                value={profile?.blood_type} isEditing={isEditing} field="blood_type"
                                editValue={editForm.blood_type} onEditChange={handleEditFieldChange} type="select"
                                options={['', ...BLOOD_TYPES]} />
                            <InfoField icon={AlertTriangle} label="Alergias"
                                value={profile?.allergies} isEditing={isEditing} field="allergies"
                                editValue={editForm.allergies} onEditChange={handleEditFieldChange} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'notes' && (
                <div className="animate-fade-in space-y-4">
                    {/* Add Note */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                        <h2 className="text-lg font-semibold text-[#111111] mb-4">Agregar Nota</h2>
                        <div className="flex gap-3">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Escribir una observación o nota sobre este miembro..."
                                rows={3}
                                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm resize-none"
                            />
                        </div>
                        <div className="flex justify-end mt-3">
                            <button onClick={handleAddNote} disabled={!newNote.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                                <Plus className="w-4 h-4" /> Agregar Nota
                            </button>
                        </div>
                    </div>

                    {/* Notes list */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                        <h2 className="text-lg font-semibold text-[#111111] mb-4">
                            Historial de Notas
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#6E6E6E] font-normal">{notes.length}</span>
                        </h2>
                        {notes.length === 0 ? (
                            <div className="text-center py-10">
                                <StickyNote className="w-12 h-12 text-[#6E6E6E]/30 mx-auto mb-3" />
                                <p className="text-[#6E6E6E]">No hay notas registradas para este miembro</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notes.map((note, index) => (
                                    <div key={note.id}
                                        className="relative pl-6 pb-4 border-l-2 border-[#E8F4FC] last:border-0 last:pb-0"
                                        style={{ animationDelay: `${index * 0.05}s` }}>
                                        <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[#2696D2]" />
                                        <div className="bg-[#EDEDED] rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-[#2696D2]">{note.author}</span>
                                                <span className="text-xs text-[#6E6E6E]">
                                                    {new Date(note.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {' — '}
                                                    {new Date(note.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#111111] leading-relaxed">{note.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="animate-fade-in space-y-4">
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-5">
                            <p className="text-xs font-medium text-[#6E6E6E] uppercase tracking-wider">Total Último Año</p>
                            <p className="text-3xl font-bold text-[#2696D2] mt-1">{totalYearAttendances}</p>
                            <p className="text-xs text-[#6E6E6E] mt-1">asistencias registradas</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-5">
                            <p className="text-xs font-medium text-[#6E6E6E] uppercase tracking-wider">Porcentaje</p>
                            <p className="text-3xl font-bold mt-1" style={{ color: attendancePercentage >= 70 ? '#13CD68' : attendancePercentage >= 40 ? '#E8A838' : '#E74C3C' }}>
                                {attendancePercentage}%
                            </p>
                            <p className="text-xs text-[#6E6E6E] mt-1">de servicios asistidos</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-5">
                            <p className="text-xs font-medium text-[#6E6E6E] uppercase tracking-wider">Total Histórico</p>
                            <p className="text-3xl font-bold text-[#111111] mt-1">{totalAttendances}</p>
                            <p className="text-xs text-[#6E6E6E] mt-1">desde el registro</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                        <h2 className="text-lg font-semibold text-[#111111] mb-4">Asistencia Mensual — Último Año</h2>
                        <div style={{ height: '320px' }}>
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Monthly detail table */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-[#111111]">Detalle Mensual</h2>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Mes</th>
                                    <th className="text-center px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Asistencias</th>
                                    <th className="text-center px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Nivel</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {yearlyAttendance.map((m) => {
                                    const level = m.count >= 4 ? 'Excelente' : m.count >= 2 ? 'Regular' : m.count > 0 ? 'Bajo' : 'Sin asistencia'
                                    const levelColor = m.count >= 4 ? '#13CD68' : m.count >= 2 ? '#E8A838' : m.count > 0 ? '#E74C3C' : '#6E6E6E'
                                    const isExpanded = expandedMonth === m.month
                                    const canExpand = m.count > 0
                                    return (
                                        <Fragment key={m.month}>
                                            <tr
                                                onClick={() => canExpand && setExpandedMonth(isExpanded ? null : m.month)}
                                                className={`transition-colors ${canExpand ? 'cursor-pointer hover:bg-[#E8F4FC]/50' : ''}`}>
                                                <td className="px-6 py-3 text-sm text-[#111111] capitalize">{m.month}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="text-sm font-semibold text-[#111111]">{m.count}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                                                        style={{ backgroundColor: `${levelColor}15`, color: levelColor }}>
                                                        {level}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    {canExpand && (
                                                        isExpanded ? <ChevronUp className="w-4 h-4 text-[#6E6E6E] inline" /> : <ChevronDown className="w-4 h-4 text-[#6E6E6E] inline" />
                                                    )}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50/40">
                                                    <td colSpan={4} className="px-6 py-4">
                                                        <p className="text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider mb-2">Fechas de Asistencia</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                            {m.dates.map((d, idx) => (
                                                                <div key={`${d.service_id}-${idx}`}
                                                                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100">
                                                                    <Calendar className="w-3.5 h-3.5 text-[#2696D2] flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-[#111111] capitalize">
                                                                            {new Date(d.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                                        </p>
                                                                        <p className="text-xs text-[#6E6E6E] flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {new Date(d.check_in_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
