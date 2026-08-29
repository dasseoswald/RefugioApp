import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    getActiveService, createService, toggleServiceActive,
    getMembers, createMember, registerAttendance, cancelAttendance, findAttendanceByMemberAndService,
    subscribeBuenaTierraClasses, updateBuenaTierraClass,
    subscribeBuenaTierraSettings, setBuenaTierraLeader,
} from '../../data/mockData.js'
import MemberAutocomplete from '../../components/shared/MemberAutocomplete.jsx'
import {
    Sprout, UserPlus, Check, Settings, Crown, ChevronDown, ChevronUp,
    Power, PowerOff, X, Users, Lock, Unlock,
} from 'lucide-react'

const CLASS_ORDER = ['paz', 'alegria', 'faith']

export default function BuenaTierraPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const isAdmin = user?.role === 'admin'
    const [service, setService] = useState(undefined) // undefined = cargando
    const [members, setMembers] = useState([])
    const [classes, setClasses] = useState([])
    const [settings, setSettings] = useState({ leader_member_id: null })
    const [openClass, setOpenClass] = useState(null)
    const [newChild, setNewChild] = useState({ classId: null, name: '', lastName: '', age: '' })
    const [showSettings, setShowSettings] = useState(false)
    const [leaderInput, setLeaderInput] = useState('')
    const [staffInput, setStaffInput] = useState({})

    const refresh = () => {
        setService(getActiveService('buena-tierra'))
        setMembers(getMembers())
    }

    useEffect(() => {
        refresh()
        const unsubClasses = subscribeBuenaTierraClasses(setClasses)
        const unsubSettings = subscribeBuenaTierraSettings(setSettings)
        return () => { unsubClasses(); unsubSettings() }
    }, [])

    const myMemberId = user?.member_id || null
    const isLeader = !!myMemberId && settings.leader_member_id === myMemberId
    const classById = (id) => classes.find(c => c.id === id)
    const isTeacherOrHelperOf = (classId) => {
        const cls = classById(classId)
        return !!cls && !!myMemberId && (cls.teacher_ids?.includes(myMemberId) || cls.helper_ids?.includes(myMemberId))
    }
    const canManageClass = (classId) => isAdmin || isLeader || isTeacherOrHelperOf(classId)
    const canAssignStaff = isAdmin || isLeader
    const hasAnyAccess = isAdmin || isLeader || CLASS_ORDER.some(canManageClass)

    useEffect(() => {
        if (members.length > 0 && !hasAnyAccess) navigate('/login')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members.length, hasAnyAccess])

    const membersInClass = (classId) => members.filter(m => m.buena_tierra_class === classId && m.is_active !== false)

    const handleActivate = () => {
        if (service) { toggleServiceActive(service.id); setTimeout(refresh, 300); return }
        const today = new Date()
        const svc = createService({
            name: 'Buena Tierra',
            service_date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
            service_type: 'buena-tierra',
            pastor_name: '',
            starts_at: '07:00',
            ends_at: '13:00',
        })
        toggleServiceActive(svc.id)
        setTimeout(refresh, 300)
    }

    const toggleAttendance = (member) => {
        if (!service) return
        const existing = findAttendanceByMemberAndService(member.id, service.id)
        if (existing) cancelAttendance(existing.id)
        else registerAttendance(member.id, service.id, 'manual', user?.id)
        setTimeout(refresh, 200)
    }

    const handleAddChild = (classId) => {
        if (!newChild.name.trim()) return
        const fullName = `${newChild.name.trim()} ${newChild.lastName.trim()}`.trim()
        const created = createMember({
            full_name: fullName,
            member_type: 'Visitante',
            buena_tierra: true,
            buena_tierra_class: classId,
            child_age: newChild.age ? Number(newChild.age) : null,
            gender: '',
            phone: '',
            email: '',
            groups: [],
        })
        if (service) registerAttendance(created.id, service.id, 'manual', user?.id)
        setNewChild({ classId: null, name: '', lastName: '', age: '' })
        setTimeout(refresh, 200)
    }

    const handleSetLeader = (member) => {
        if (!member) return
        setBuenaTierraLeader(member.id)
        setLeaderInput('')
    }

    const addStaff = (classId, role, member) => {
        if (!member) return
        const cls = classById(classId)
        const key = role === 'teacher' ? 'teacher_ids' : 'helper_ids'
        const current = cls?.[key] || []
        if (current.includes(member.id)) return
        updateBuenaTierraClass(classId, { [key]: [...current, member.id] })
        setStaffInput(s => ({ ...s, [`${classId}-${role}`]: '' }))
    }

    const removeStaff = (classId, role, memberId) => {
        const cls = classById(classId)
        const key = role === 'teacher' ? 'teacher_ids' : 'helper_ids'
        const current = cls?.[key] || []
        updateBuenaTierraClass(classId, { [key]: current.filter(id => id !== memberId) })
    }

    // Cerrar una clase la marca como "terminada" solo para la sesión de HOY
    // (guarda el id del servicio activo) — apenas se active una sesión nueva
    // otro día, el id ya no coincide y la clase vuelve a quedar abierta sola,
    // sin tener que reabrirla a mano cada semana.
    const isClosed = (cls) => !!service && cls.closed_for_service_id === service.id
    const toggleClosed = (classId) => {
        if (!service) return
        const cls = classById(classId)
        updateBuenaTierraClass(classId, { closed_for_service_id: isClosed(cls) ? null : service.id })
    }

    const memberName = (id) => members.find(m => m.id === id)?.full_name || 'Miembro'
    const currentLeaderName = settings.leader_member_id ? memberName(settings.leader_member_id) : null

    if (members.length === 0) return null
    if (!hasAnyAccess) return null

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #13CD68 0%, #0E9950 100%)' }}>
                <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Sprout className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Buena Tierra</h1>
                            <p className="text-white/80 text-sm mt-1">
                                {service?.is_active ? 'Sesión activa hoy' : 'Sin sesión activa'}
                                {currentLeaderName && ` · Líder: ${currentLeaderName}`}
                            </p>
                        </div>
                    </div>
                    {(isAdmin || isLeader) && (
                        <button onClick={handleActivate}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/20 hover:bg-white/30 transition-colors cursor-pointer">
                            {service?.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            {service?.is_active ? 'Desactivar sesión' : 'Activar sesión de hoy'}
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {CLASS_ORDER.map(classId => {
                    const cls = classById(classId)
                    if (!cls) return null
                    const roster = membersInClass(classId)
                    const canManage = canManageClass(classId)
                    const isOpen = openClass === classId
                    const closed = isClosed(cls)
                    const attendedCount = service ? roster.filter(m => findAttendanceByMemberAndService(m.id, service.id)).length : 0

                    return (
                        <div key={classId} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                            <div className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                <button onClick={() => setOpenClass(isOpen ? null : classId)} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-left">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#E1F9EC] flex-shrink-0">
                                        <Users className="w-4 h-4 text-[#13CD68]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-semibold text-[#111111] flex items-center gap-2">
                                            {cls.name}
                                            {closed && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-[#6E6E6E]">
                                                    <Lock className="w-2.5 h-2.5" /> Cerrada
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-[#6E6E6E]">
                                            {cls.age_range || 'Sin rango de edad definido'} · {roster.length} niño{roster.length === 1 ? '' : 's'}
                                            {service?.is_active && ` · ${attendedCount} presente${attendedCount === 1 ? '' : 's'}`}
                                        </p>
                                    </div>
                                </button>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {canManage && service?.is_active && (
                                        <button onClick={() => toggleClosed(classId)} title={closed ? 'Reabrir registro' : 'Cerrar registro'}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${closed ? 'bg-[#E1F9EC] text-[#13CD68] hover:bg-[#c9f2dc]' : 'bg-gray-100 text-[#6E6E6E] hover:bg-gray-200'}`}>
                                            {closed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                            {closed ? 'Reabrir' : 'Cerrar registro'}
                                        </button>
                                    )}
                                    <button onClick={() => setOpenClass(isOpen ? null : classId)} className="cursor-pointer p-1">
                                        {isOpen ? <ChevronUp className="w-4 h-4 text-[#6E6E6E]" /> : <ChevronDown className="w-4 h-4 text-[#6E6E6E]" />}
                                    </button>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                                    {canAssignStaff && (
                                        <div>
                                            <label className="block text-xs font-medium text-[#6E6E6E] mb-1.5">Rango de edad</label>
                                            <input type="text" defaultValue={cls.age_range}
                                                onBlur={(e) => updateBuenaTierraClass(classId, { age_range: e.target.value })}
                                                placeholder="Ej: 4 a 6 años"
                                                className="w-full max-w-xs px-4 py-2 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:border-[#13CD68]" />
                                        </div>
                                    )}

                                    {canManage && (
                                        <div>
                                            <label className="block text-xs font-medium text-[#6E6E6E] mb-1.5">Tema y cita de hoy (de esta clase)</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <input type="text" key={`${classId}-theme`} defaultValue={cls.theme}
                                                    onBlur={(e) => updateBuenaTierraClass(classId, { theme: e.target.value })}
                                                    placeholder="Tema asociado"
                                                    className="px-4 py-2 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:border-[#13CD68]" />
                                                <input type="text" key={`${classId}-verse`} defaultValue={cls.main_verse}
                                                    onBlur={(e) => updateBuenaTierraClass(classId, { main_verse: e.target.value })}
                                                    placeholder="Cita principal (ej: Juan 3:16)"
                                                    className="px-4 py-2 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:border-[#13CD68]" />
                                            </div>
                                        </div>
                                    )}

                                    {!canManage ? (
                                        <p className="text-sm text-[#6E6E6E]">Solo el maestro, ayudante o líder de esta clase puede tomar asistencia.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {closed && (
                                                <p className="text-xs text-[#6E6E6E] flex items-center gap-1.5 mb-2">
                                                    <Lock className="w-3 h-3" /> El registro de esta clase está cerrado — usa "Reabrir" arriba para seguir editándolo.
                                                </p>
                                            )}
                                            {roster.length === 0 && <p className="text-sm text-[#6E6E6E]">Todavía no hay niños en esta clase.</p>}
                                            {roster.map(m => {
                                                const present = service && !!findAttendanceByMemberAndService(m.id, service.id)
                                                return (
                                                    <div key={m.id} className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-gray-50">
                                                        <span className="text-sm font-medium text-[#111111]">{m.full_name}</span>
                                                        <button onClick={() => toggleAttendance(m)} disabled={!service?.is_active || closed}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${present ? 'bg-[#13CD68] text-white' : 'bg-white border border-gray-200 text-[#6E6E6E]'}`}>
                                                            <Check className="w-3.5 h-3.5" /> {present ? 'Presente' : 'Marcar'}
                                                        </button>
                                                    </div>
                                                )
                                            })}

                                            {closed ? null : newChild.classId === classId ? (
                                                <div className="p-4 rounded-xl bg-[#E1F9EC] space-y-2">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                        <input type="text" placeholder="Nombre" value={newChild.name}
                                                            onChange={(e) => setNewChild(f => ({ ...f, name: e.target.value }))}
                                                            className="px-3 py-2 rounded-lg border-2 border-white bg-white text-sm focus:outline-none" />
                                                        <input type="text" placeholder="Apellido" value={newChild.lastName}
                                                            onChange={(e) => setNewChild(f => ({ ...f, lastName: e.target.value }))}
                                                            className="px-3 py-2 rounded-lg border-2 border-white bg-white text-sm focus:outline-none" />
                                                        <input type="number" placeholder="Edad" value={newChild.age}
                                                            onChange={(e) => setNewChild(f => ({ ...f, age: e.target.value }))}
                                                            className="px-3 py-2 rounded-lg border-2 border-white bg-white text-sm focus:outline-none" />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setNewChild({ classId: null, name: '', lastName: '', age: '' })}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6E6E6E] cursor-pointer">Cancelar</button>
                                                        <button onClick={() => handleAddChild(classId)} disabled={!newChild.name.trim()}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#13CD68] cursor-pointer disabled:opacity-40">Guardar</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => setNewChild({ classId, name: '', lastName: '', age: '' })}
                                                    className="flex items-center gap-2 text-sm font-medium text-[#13CD68] hover:underline cursor-pointer">
                                                    <UserPlus className="w-4 h-4" /> Agregar niño nuevo
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {canAssignStaff && (
                                        <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {['teacher', 'helper'].map(role => (
                                                <div key={role}>
                                                    <label className="block text-xs font-medium text-[#6E6E6E] mb-1.5">{role === 'teacher' ? 'Maestros' : 'Ayudantes'}</label>
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {(cls[role === 'teacher' ? 'teacher_ids' : 'helper_ids'] || []).map(id => (
                                                            <span key={id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-[#111111]">
                                                                {memberName(id)}
                                                                <button onClick={() => removeStaff(classId, role, id)} className="cursor-pointer"><X className="w-3 h-3" /></button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <MemberAutocomplete
                                                        value={staffInput[`${classId}-${role}`] || ''}
                                                        onChange={(v) => setStaffInput(s => ({ ...s, [`${classId}-${role}`]: v }))}
                                                        onSelectMember={(m) => addStaff(classId, role, m)}
                                                        placeholder={`Agregar ${role === 'teacher' ? 'maestro' : 'ayudante'}...`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {isAdmin && (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                    <button onClick={() => setShowSettings(s => !s)}
                        className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors">
                        <span className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                            <Settings className="w-4 h-4 text-[#6E6E6E]" /> Configuración de Buena Tierra
                        </span>
                        {showSettings ? <ChevronUp className="w-4 h-4 text-[#6E6E6E]" /> : <ChevronDown className="w-4 h-4 text-[#6E6E6E]" />}
                    </button>
                    {showSettings && (
                        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                            <label className="block text-xs font-medium text-[#6E6E6E] mb-1.5 flex items-center gap-1.5">
                                <Crown className="w-3.5 h-3.5" /> Líder principal de Buena Tierra
                            </label>
                            {currentLeaderName && <p className="text-sm text-[#111111] mb-2">Actual: <strong>{currentLeaderName}</strong></p>}
                            <MemberAutocomplete value={leaderInput} onChange={setLeaderInput} onSelectMember={handleSetLeader}
                                placeholder="Buscar miembro para asignar como líder..." className="max-w-sm" />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
