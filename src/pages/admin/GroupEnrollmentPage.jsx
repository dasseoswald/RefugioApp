import { useState, useEffect } from 'react'
import { getMembers, patchMember } from '../../data/mockData.js'
import { Search, UserPlus, UserMinus, Users, CheckCircle2, BookOpen, Sprout } from 'lucide-react'

const GROUP_CONFIG = {
    'escuela-discipulo': {
        title: 'Escuela del Discípulo',
        description: 'Gestión de miembros inscritos en la Escuela del Discípulo',
        field: 'escuela_discipulo',
        icon: BookOpen,
        color: '#2696D2',
        gradient: 'linear-gradient(135deg, #2696D2, #1D74A8)',
    },
    'buena-tierra': {
        title: 'Buena Tierra',
        description: 'Gestión de miembros inscritos en el programa Buena Tierra',
        field: 'buena_tierra',
        icon: Sprout,
        color: '#13CD68',
        gradient: 'linear-gradient(135deg, #13CD68, #0FA855)',
    },
}

export default function GroupEnrollmentPage({ groupKey }) {
    const config = GROUP_CONFIG[groupKey]
    const [members, setMembers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [notification, setNotification] = useState(null)

    useEffect(() => {
        refreshMembers()
    }, [])

    const refreshMembers = () => {
        setMembers(getMembers().filter(m => m.is_active))
    }

    const enrolledMembers = members.filter(m => m[config.field] === true)
    const availableMembers = members.filter(m => !m[config.field])

    const filteredAvailable = availableMembers.filter(m =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleEnroll = (memberId, memberName) => {
        patchMember(memberId, { [config.field]: true })
        refreshMembers()
        setNotification({ type: 'success', message: `${memberName} inscrito exitosamente` })
        setTimeout(() => setNotification(null), 3000)
    }

    const handleRemove = (memberId, memberName) => {
        patchMember(memberId, { [config.field]: false })
        refreshMembers()
        setNotification({ type: 'info', message: `${memberName} removido del grupo` })
        setTimeout(() => setNotification(null), 3000)
    }

    const GroupIcon = config.icon

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: config.gradient }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(20%, -20%)' }}></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <GroupIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{config.title}</h1>
                        <p className="text-white/70 text-sm mt-1">{config.description}</p>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl animate-fade-in ${notification.type === 'success' ? 'bg-[#E1F9EC] text-[#111111]' : 'bg-[#E8F4FC] text-[#111111]'
                    }`}>
                    <CheckCircle2 className={`w-5 h-5 ${notification.type === 'success' ? 'text-[#13CD68]' : 'text-[#2696D2]'}`} />
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${config.color}15` }}>
                            <Users className="w-5 h-5" style={{ color: config.color }} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#111111]">{enrolledMembers.length}</p>
                            <p className="text-xs text-[#6E6E6E]">Miembros Inscritos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E8F4FC] flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-[#6E6E6E]" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#111111]">{availableMembers.length}</p>
                            <p className="text-xs text-[#6E6E6E]">Disponibles para Inscribir</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enrolled members */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <GroupIcon className="w-5 h-5" style={{ color: config.color }} />
                        <h3 className="text-lg font-semibold text-[#111111]">Miembros Inscritos</h3>
                    </div>
                    <span className="text-sm text-[#6E6E6E] bg-[#E8F4FC] px-3 py-1 rounded-full font-medium">
                        {enrolledMembers.length} inscritos
                    </span>
                </div>

                {enrolledMembers.length === 0 ? (
                    <div className="p-12 text-center text-[#6E6E6E]">
                        <GroupIcon className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                        <p className="text-lg font-medium">No hay miembros inscritos</p>
                        <p className="text-sm">Usa el buscador de abajo para agregar miembros a este grupo</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {enrolledMembers.map((member) => (
                            <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                        style={{ background: config.color }}>
                                        {member.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#111111]">{member.full_name}</p>
                                        <p className="text-xs text-[#6E6E6E]">{member.member_type} • {member.phone || member.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(member.id, member.full_name)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#E74C3C] hover:bg-[#FADBD8] transition-colors cursor-pointer"
                                >
                                    <UserMinus className="w-4 h-4" />
                                    Remover
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add members */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-[#2696D2]" />
                    <h3 className="text-lg font-semibold text-[#111111]">Agregar Miembros</h3>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E6E]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar miembro por nombre o correo..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-[#111111] placeholder:text-[#6E6E6E]/50 focus:outline-none focus:border-[#2696D2] transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                    {filteredAvailable.length === 0 ? (
                        <div className="p-8 text-center text-[#6E6E6E]">
                            <p className="text-sm">{searchTerm ? 'No se encontraron miembros' : 'Todos los miembros están inscritos'}</p>
                        </div>
                    ) : (
                        filteredAvailable.map((member) => (
                            <div key={member.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#6E6E6E]/20 flex items-center justify-center text-[#6E6E6E] text-sm font-semibold">
                                        {member.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#111111]">{member.full_name}</p>
                                        <p className="text-xs text-[#6E6E6E]">{member.member_type}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEnroll(member.id, member.full_name)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium transition-all hover:shadow-md cursor-pointer"
                                    style={{ background: config.gradient }}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Inscribir
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
