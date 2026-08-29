import { useState, useEffect } from 'react'
import {
    getMembers, getMemberById,
    getEscuelaClasses, createEscuelaClass,
    getEscuelaEnrollments, enrollInEscuela, removeFromEscuela,
    getEscuelaAttendances, registerEscuelaAttendance,
    ESCUELA_CURRICULUM, ESCUELA_GUIDE_URLS
} from '../../data/mockData.js'
import Modal from '../../components/ui/Modal.jsx'
import MemberEscuelaSummaryModal from '../../components/admin/MemberEscuelaSummaryModal.jsx'
import OfferingLog from '../../components/shared/OfferingLog.jsx'
import {
    BookOpen, Users, UserPlus, UserMinus, Search, CheckCircle2,
    Calendar, Clock, GraduationCap, Plus, Check, X, ChevronDown, ChevronUp, Layers,
    FileText, Wifi, MapPin
} from 'lucide-react'

const LEVEL_CONFIG = {
    1: { name: 'Nivel 1', subtitle: 'Fundamentos', color: '#2696D2', bg: '#E8F4FC' },
    2: { name: 'Nivel 2', subtitle: 'Crecimiento', color: '#13CD68', bg: '#E1F9EC' },
    3: { name: 'Nivel 3', subtitle: 'Liderazgo', color: '#E8A838', bg: '#FFF3CD' },
}

export default function EscuelaDiscipuloPage() {
    const [activeLevel, setActiveLevel] = useState(1)
    const [enrollments, setEnrollments] = useState([])
    const [classes, setClasses] = useState([])
    const [members, setMembers] = useState([])
    const [notification, setNotification] = useState(null)
    const [showEnrollModal, setShowEnrollModal] = useState(false)
    const [showClassModal, setShowClassModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedUnit, setExpandedUnit] = useState(1)
    const [expandedClassId, setExpandedClassId] = useState(null)
    const [summaryMemberId, setSummaryMemberId] = useState(null)
    const [newClass, setNewClass] = useState({ class_number: '', class_date: '', teacher: '' })

    useEffect(() => { refreshData() }, [activeLevel])

    const refreshData = () => {
        setEnrollments(getEscuelaEnrollments())
        setClasses(getEscuelaClasses(activeLevel))
        setMembers(getMembers().filter(m => m.is_active))
    }

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    const levelEnrollments = enrollments.filter(e => e.level === activeLevel)
    const levelMemberIds = levelEnrollments.map(e => e.member_id)
    const levelMembers = levelMemberIds.map(id => getMemberById(id)).filter(Boolean)

    const availableMembers = members.filter(m =>
        !enrollments.some(e => e.member_id === m.id) &&
        (m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.email || '').toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleEnroll = (memberId, memberName) => {
        enrollInEscuela(memberId, activeLevel)
        refreshData()
        showNotification(`${memberName} inscrito en ${LEVEL_CONFIG[activeLevel].name}`)
    }

    const handleRemove = (memberId, memberName) => {
        removeFromEscuela(memberId)
        refreshData()
        showNotification(`${memberName} removido`, 'info')
    }

    const curriculumForLevel = ESCUELA_CURRICULUM[activeLevel] || []
    const pendingCurriculumClasses = curriculumForLevel.filter(c => !classes.some(cls => cls.class_number === c.number))

    const handleCreateClass = () => {
        if (!newClass.class_number || !newClass.class_date) return
        const curriculumClass = curriculumForLevel.find(c => c.number === parseInt(newClass.class_number))
        if (!curriculumClass) return
        createEscuelaClass({
            level: activeLevel,
            class_number: curriculumClass.number,
            unit: Math.ceil(curriculumClass.number / 4),
            title: `Clase ${curriculumClass.number}`,
            topic: curriculumClass.title,
            class_date: newClass.class_date,
            teacher: newClass.teacher,
            starts_at: '09:00',
            ends_at: '11:00',
        })
        refreshData()
        setShowClassModal(false)
        setNewClass({ class_number: '', class_date: '', teacher: '' })
        showNotification('Clase creada exitosamente')
    }

    const handleMarkAttendance = (memberId, classId, memberName, modality) => {
        const result = registerEscuelaAttendance(memberId, classId, modality)
        if (result.error) {
            showNotification(result.error, 'warning')
        } else {
            refreshData()
            showNotification(`Asistencia registrada para ${memberName} (${modality === 'online' ? 'Online' : 'Presencial'})`)
        }
    }

    const getClassAttendees = (classId) => getEscuelaAttendances(classId)
    const isMemberInClass = (memberId, classId) => getClassAttendees(classId).some(a => a.member_id === memberId)
    const getAttendanceRecord = (memberId, classId) => getClassAttendees(classId).find(a => a.member_id === memberId)

    const levelConf = LEVEL_CONFIG[activeLevel]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl p-6 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #2696D2, #111111)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Escuela del Discípulo</h1>
                        <p className="text-white/70 text-sm mt-1">Gestión de clases, niveles y asistencia</p>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl animate-fade-in ${notification.type === 'success' ? 'bg-[#E1F9EC] text-[#111111]' :
                        notification.type === 'warning' ? 'bg-[#FFF3CD] text-[#111111]' :
                            'bg-[#E8F4FC] text-[#111111]'
                    }`}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: notification.type === 'success' ? '#13CD68' : notification.type === 'warning' ? '#E8A838' : '#2696D2' }} />
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            )}

            {/* Level Tabs */}
            <div className="flex gap-2">
                {[1, 2, 3].map(level => {
                    const conf = LEVEL_CONFIG[level]
                    const count = enrollments.filter(e => e.level === level).length
                    const isActive = activeLevel === level
                    return (
                        <button key={level} onClick={() => setActiveLevel(level)}
                            className={`flex-1 py-4 px-4 rounded-2xl text-center transition-all duration-300 cursor-pointer border-2 ${isActive ? 'text-white shadow-lg -translate-y-0.5 border-transparent' : 'bg-white text-[#111111] hover:shadow-md border-gray-100'
                                }`}
                            style={isActive ? { background: `linear-gradient(135deg, ${conf.color}, ${conf.color}cc)` } : {}}>
                            <p className={`text-lg font-bold ${isActive ? 'text-white' : ''}`}>{conf.name}</p>
                            <p className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-[#6E6E6E]'}`}>{conf.subtitle}</p>
                            <div className={`mt-2 text-sm font-semibold ${isActive ? 'text-white/90' : 'text-[#6E6E6E]'}`}>
                                <Users className="w-4 h-4 inline mr-1" />{count} alumnos
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(38,150,210,0.08)] text-center">
                    <p className="text-2xl font-bold" style={{ color: levelConf.color }}>{levelMembers.length}</p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Alumnos {levelConf.name}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(38,150,210,0.08)] text-center">
                    <p className="text-2xl font-bold text-[#111111]">{classes.length}</p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Clases Registradas</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(38,150,210,0.08)] text-center">
                    <p className="text-2xl font-bold text-[#13CD68]">
                        {classes.length > 0
                            ? Math.round(classes.reduce((acc, cls) => acc + getClassAttendees(cls.id).length, 0) / classes.length * 100 / Math.max(levelMembers.length, 1)) + '%'
                            : '—'}
                    </p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Promedio Asistencia</p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
                <button onClick={() => { setSearchTerm(''); setShowEnrollModal(true) }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer"
                    style={{ background: `linear-gradient(135deg, ${levelConf.color}, ${levelConf.color}cc)` }}>
                    <UserPlus className="w-4 h-4" /> Inscribir Alumno
                </button>
                <button onClick={() => setShowClassModal(true)} disabled={pendingCurriculumClasses.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border-2 transition-all hover:shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: levelConf.color, color: levelConf.color }}>
                    <Plus className="w-4 h-4" /> Nueva Clase
                </button>
                <a href={ESCUELA_GUIDE_URLS[activeLevel]} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border-2 border-gray-200 text-[#6E6E6E] hover:text-[#111111] hover:border-gray-300 transition-all cursor-pointer">
                    <FileText className="w-4 h-4" /> Ver Guía del {levelConf.name} (PDF)
                </a>
            </div>

            {/* Classes with attendance grouped by Unit */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111111] flex items-center gap-2">
                    <Layers className="w-5 h-5" style={{ color: levelConf.color }} /> Unidades de {levelConf.name}
                </h3>

                {classes.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                        <p className="text-lg font-medium text-[#6E6E6E]">No hay clases para {levelConf.name}</p>
                        <p className="text-sm text-[#6E6E6E]">Crea una nueva clase con el botón de arriba</p>
                    </div>
                ) : (
                    [...new Set(classes.map(c => c.unit))].sort((a,b) => a - b).map(unitNum => {
                        const unitClasses = classes.filter(c => c.unit === unitNum);
                        const isUnitExpanded = expandedUnit === unitNum;
                        
                        return (
                            <div key={unitNum} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden transition-all border border-gray-100">
                                {/* Unit Header */}
                                <button onClick={() => setExpandedUnit(isUnitExpanded ? null : unitNum)}
                                    className="w-full px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                                    style={isUnitExpanded ? { background: levelConf.bg } : {}}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: levelConf.color }}>
                                            U{unitNum}
                                        </div>
                                        <span className="font-bold text-lg text-[#111111]">Unidad {unitNum}</span>
                                        <span className="text-xs font-medium text-[#6E6E6E] px-2.5 py-1 bg-gray-100 rounded-full ml-2">{unitClasses.length} clases</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isUnitExpanded ? <ChevronUp className="w-5 h-5 text-[#111111]" /> : <ChevronDown className="w-5 h-5 text-[#6E6E6E]" />}
                                    </div>
                                </button>
                                
                                {/* Unit Classes */}
                                {isUnitExpanded && (
                                    <div className="p-4 bg-gray-50/30 space-y-3 border-t border-gray-100">
                                        {unitClasses.sort((a, b) => a.class_number - b.class_number).map(cls => {
                                            const attendees = getClassAttendees(cls.id)
                                            const isExpanded = expandedClassId === cls.id
                                            const attendanceRate = levelMembers.length > 0 ? Math.round(attendees.length / levelMembers.length * 100) : 0

                                            return (
                                                <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                                                    {/* Class header */}
                                                    <button onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                                                        className="w-full px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: levelConf.bg }}>
                                                                <BookOpen className="w-4 h-4" style={{ color: levelConf.color }} />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-semibold text-[#111111]">{cls.topic || cls.title}</p>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-xs text-[#6E6E6E] flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />{new Date(cls.class_date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    </span>
                                                                    <span className="text-xs font-medium text-[#6E6E6E]">
                                                                        Clase {cls.class_number}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold" style={{ color: levelConf.color }}>{attendees.length}/{levelMembers.length}</p>
                                                                <p className="text-[10px] uppercase font-bold text-[#6E6E6E] mt-0.5">Asistentes</p>
                                                            </div>
                                                            {/* Progress bar */}
                                                            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                                                                <div className="h-full rounded-full transition-all" style={{ width: `${attendanceRate}%`, background: levelConf.color }}></div>
                                                            </div>
                                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6E6E6E]" /> : <ChevronDown className="w-4 h-4 text-[#6E6E6E]" />}
                                                        </div>
                                                    </button>

                                                    {/* Expanded attendance list */}
                                                    {isExpanded && (
                                                        <div className="border-t border-gray-100 px-5 py-4 bg-white animate-fade-in relative">
                                                            <p className="text-xs font-medium text-[#6E6E6E] uppercase tracking-wider mb-3">Marcar Asistencia</p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {levelMembers.map(member => {
                                                                    const attended = isMemberInClass(member.id, cls.id)
                                                                    const attendanceRecord = attended ? getAttendanceRecord(member.id, cls.id) : null
                                                                    return (
                                                                        <div key={member.id}
                                                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${attended ? 'border-transparent' : 'border-gray-100 hover:border-gray-200'
                                                                                }`}
                                                                            style={attended ? { background: levelConf.bg, borderColor: `${levelConf.color}30` } : {}}>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${attended ? 'text-white' : 'bg-gray-100 text-[#6E6E6E]'
                                                                                    }`} style={attended ? { background: levelConf.color } : {}}>
                                                                                    {attended ? <Check className="w-3.5 h-3.5" /> : member.full_name.charAt(0)}
                                                                                </div>
                                                                                <span className={`text-sm font-medium ${attended ? '' : 'text-[#111111]'}`}
                                                                                    style={attended ? { color: levelConf.color } : {}}>
                                                                                    {member.full_name}
                                                                                </span>
                                                                            </div>
                                                                            {attended ? (
                                                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: `${levelConf.color}20`, color: levelConf.color }}>
                                                                                    {attendanceRecord?.modality === 'online' ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                                                                    {attendanceRecord?.modality === 'online' ? 'Online' : 'Presencial'}
                                                                                </span>
                                                                            ) : (
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <button onClick={() => handleMarkAttendance(member.id, cls.id, member.full_name, 'presencial')}
                                                                                        title="Marcar presencial"
                                                                                        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg text-white transition-all hover:shadow-md cursor-pointer"
                                                                                        style={{ background: levelConf.color }}>
                                                                                        <MapPin className="w-3 h-3" /> Presencial
                                                                                    </button>
                                                                                    <button onClick={() => handleMarkAttendance(member.id, cls.id, member.full_name, 'online')}
                                                                                        title="Marcar online"
                                                                                        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer"
                                                                                        style={{ borderColor: levelConf.color, color: levelConf.color }}>
                                                                                        <Wifi className="w-3 h-3" /> Online
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                            {levelMembers.length === 0 && (
                                                                <p className="text-sm text-[#6E6E6E] text-center py-4">No hay alumnos inscritos en {levelConf.name}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            <OfferingLog scopeKey={`escuela:${activeLevel}`} canManage={true} color={levelConf.color} />

            {/* Enrolled members */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#111111] flex items-center gap-2">
                        <Users className="w-5 h-5" style={{ color: levelConf.color }} /> Alumnos de {levelConf.name}
                    </h3>
                    <span className="text-sm text-[#6E6E6E] px-3 py-1 rounded-full font-medium" style={{ background: levelConf.bg }}>
                        {levelMembers.length} inscritos
                    </span>
                </div>
                {levelMembers.length === 0 ? (
                    <div className="p-8 text-center text-[#6E6E6E]">
                        <p className="text-sm">No hay alumnos inscritos en {levelConf.name}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {levelMembers.map(member => {
                            const totalClasses = classes.length
                            const attended = classes.filter(c => isMemberInClass(member.id, c.id)).length
                            const pct = totalClasses > 0 ? Math.round(attended / totalClasses * 100) : 0
                            return (
                                <div key={member.id} onClick={() => setSummaryMemberId(member.id)} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm group-hover:scale-105 transition-transform"
                                            style={{ background: levelConf.color }}>
                                            {member.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#111111] group-hover:text-[#2696D2] transition-colors">{member.full_name}</p>
                                            <p className="text-xs text-[#6E6E6E] mt-0.5">{member.member_type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-bold" style={{ color: levelConf.color }}>{attended}/{totalClasses}</p>
                                            <p className="text-[10px] uppercase tracking-wide font-bold text-[#6E6E6E] mt-0.5">{pct}% Asist.</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleRemove(member.id, member.full_name); }}
                                            className="p-2 rounded-lg text-gray-300 hover:text-[#E74C3C] hover:bg-[#FADBD8] transition-colors cursor-pointer">
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Enroll Modal */}
            <Modal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} title={`Inscribir en ${levelConf.name}`}>
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E6E]" />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar miembro..." className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1">
                    {availableMembers.length === 0 ? (
                        <p className="text-center text-sm text-[#6E6E6E] py-6">{searchTerm ? 'Sin resultados' : 'Todos los miembros están inscritos'}</p>
                    ) : availableMembers.map(m => (
                        <div key={m.id} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#6E6E6E]/15 flex items-center justify-center text-[#6E6E6E] text-sm font-semibold">{m.full_name.charAt(0)}</div>
                                <div>
                                    <p className="text-sm font-medium text-[#111111]">{m.full_name}</p>
                                    <p className="text-xs text-[#6E6E6E]">{m.member_type}</p>
                                </div>
                            </div>
                            <button onClick={() => { handleEnroll(m.id, m.full_name); setShowEnrollModal(false) }}
                                className="text-xs px-3 py-1.5 rounded-lg text-white font-medium cursor-pointer transition-all hover:shadow-md"
                                style={{ background: levelConf.color }}>
                                Inscribir
                            </button>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Create Class Modal */}
            <Modal isOpen={showClassModal} onClose={() => setShowClassModal(false)} title={`Nueva Clase — ${levelConf.name}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Clase del Temario *</label>
                        <select value={newClass.class_number} onChange={(e) => setNewClass(c => ({ ...c, class_number: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            <option value="">Selecciona una clase...</option>
                            {pendingCurriculumClasses.map(c => (
                                <option key={c.number} value={c.number}>Clase {c.number} — {c.title}</option>
                            ))}
                        </select>
                        <p className="text-xs text-[#6E6E6E] mt-1">Según el índice de la guía del {levelConf.name}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Fecha *</label>
                        <input type="date" value={newClass.class_date} onChange={(e) => setNewClass(c => ({ ...c, class_date: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Maestro/a</label>
                        <input type="text" value={newClass.teacher} onChange={(e) => setNewClass(c => ({ ...c, teacher: e.target.value }))}
                            placeholder="Nombre del maestro" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowClassModal(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={handleCreateClass} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg cursor-pointer"
                        style={{ background: `linear-gradient(135deg, ${levelConf.color}, ${levelConf.color}cc)` }}>
                        Crear Clase
                    </button>
                </div>
            </Modal>
            
            {/* Context Modal */}
            <MemberEscuelaSummaryModal memberId={summaryMemberId} onClose={() => setSummaryMemberId(null)} />
        </div>
    )
}
