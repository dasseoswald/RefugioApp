import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    OPERATIONAL_GROUPS, getMembers, patchMember,
    getGroupNotices, createGroupNotice,
    getGroupMessages, sendGroupMessage,
    getUpcomingAlabanzaOccasions, ALABANZA_ROLES, getAlabanzaAssignmentsForService, setAlabanzaAssignment,
    getAlabanzaSongs, createAlabanzaSong, updateAlabanzaSong, deleteAlabanzaSong,
    getSetlistForService, addSongToSetlist, removeSongFromSetlist, setSetlistPerformer,
    subscribeGroupSettings, setGroupLeader,
} from '../../data/mockData.js'
import { transposeChordChart, transposeKeyLabel, keyDifference, detectFirstChordRoot, KEY_OPTIONS } from '../../lib/chordTranspose.js'
import OfferingLog from '../../components/shared/OfferingLog.jsx'
import MemberAutocomplete from '../../components/shared/MemberAutocomplete.jsx'
import {
    Users, Megaphone, MessageCircle, Image, Send,
    CheckCircle2, UserPlus, UserMinus, Search,
    Paperclip, X, BookOpen, Sprout, UserCircle, UserSquare, Baby, Music, Home, Calendar,
    ListMusic, Plus, Trash2, MinusCircle, PlusCircle, ChevronLeft, Edit2, Check, HandCoins,
    Crown, Settings, ChevronDown, ChevronUp,
} from 'lucide-react'

const ICONS_MAP = { BookOpen, Sprout, Users, UserCircle, UserSquare, Baby, Music, Home }

export default function GroupDashboardPage() {
    const { groupId } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    
    const [group, setGroup] = useState(null)
    const [activeTab, setActiveTab] = useState('members')
    
    // Auth & Roles
    const [isAdmin, setIsAdmin] = useState(false)
    const [isLeader, setIsLeader] = useState(false)
    const [isMember, setIsMember] = useState(false)
    const [myMemberProfile, setMyMemberProfile] = useState(null)
    // Líder asignado a mano por un admin (aditivo al criterio anterior de
    // member_type === 'Líder' + estar en el grupo) — ver setGroupLeader.
    const [groupSettings, setGroupSettingsState] = useState({ leader_member_id: null })
    const [showLeaderSettings, setShowLeaderSettings] = useState(false)
    const [leaderInput, setLeaderInput] = useState('')

    useEffect(() => {
        const foundGroup = OPERATIONAL_GROUPS.find(g => g.id === groupId)
        if (!foundGroup) {
            navigate('/login')
            return
        }
        setGroup(foundGroup)

        const allMembers = getMembers()
        const myProfile = user?.member_id ? allMembers.find(m => m.id === user.member_id) : null
        setMyMemberProfile(myProfile)

        const adminStatus = user?.role === 'admin'
        const memberStatus = myProfile ? myProfile[foundGroup.field] === true : false

        setIsAdmin(adminStatus)
        setIsMember(memberStatus || adminStatus) // admin counts as member for viewing purposes

        if (!adminStatus && !memberStatus) {
            // Acceso denegado si no es del grupo
            navigate('/login')
        }
    }, [groupId, user, navigate])

    useEffect(() => {
        if (!group) return
        const unsubscribe = subscribeGroupSettings(group.field, setGroupSettingsState)
        return unsubscribe
    }, [group])

    useEffect(() => {
        if (!group) return
        const adminStatus = user?.role === 'admin'
        const memberStatus = myMemberProfile ? myMemberProfile[group.field] === true : false
        const isAssignedLeader = !!myMemberProfile && myMemberProfile.id === groupSettings.leader_member_id
        const leaderStatus = memberStatus && (myMemberProfile?.member_type === 'Líder' || isAssignedLeader)
        setIsLeader(leaderStatus || adminStatus) // admin counts as leader for publishing
    }, [group, user, myMemberProfile, groupSettings])

    if (!group) return <div className="p-8 text-center text-gray-500">Cargando ministerio...</div>
    if (!isMember) return <div className="p-8 text-center text-red-500">Acceso Denegado</div>

    const canManageMembers = isAdmin
    const canPublishNotices = isLeader
    const canChat = isMember

    const allMembersForLeaderPicker = getMembers()
    const currentLeaderName = groupSettings.leader_member_id
        ? allMembersForLeaderPicker.find(m => m.id === groupSettings.leader_member_id)?.full_name
        : null

    const handleSetLeader = (member) => {
        if (!member || !group) return
        setGroupLeader(group.field, member.id)
        setLeaderInput('')
    }

    const GroupIcon = ICONS_MAP[group.icon] || Users

    // Colores dinámicos basados en el ícono o un hash simple
    const gradient = group.id === 'escuela-discipulo' ? 'linear-gradient(135deg, #2696D2, #1D74A8)' :
                     group.id === 'buena-tierra' ? 'linear-gradient(135deg, #13CD68, #0FA855)' :
                     'linear-gradient(135deg, #111111, #000000)'
    const color = group.id === 'escuela-discipulo' ? '#2696D2' :
                  group.id === 'buena-tierra' ? '#13CD68' : '#111111'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: gradient }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(20%, -20%)' }}></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <GroupIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{group.name}</h1>
                        <p className="text-white/70 text-sm mt-1">
                            Dashboard y comunicación interna
                            {currentLeaderName && ` · Líder: ${currentLeaderName}`}
                        </p>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                    <button onClick={() => setShowLeaderSettings(s => !s)}
                        className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors">
                        <span className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                            <Settings className="w-4 h-4 text-[#6E6E6E]" /> Asignar líder del ministerio
                        </span>
                        {showLeaderSettings ? <ChevronUp className="w-4 h-4 text-[#6E6E6E]" /> : <ChevronDown className="w-4 h-4 text-[#6E6E6E]" />}
                    </button>
                    {showLeaderSettings && (
                        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                            <label className="block text-xs font-medium text-[#6E6E6E] mb-1.5 flex items-center gap-1.5">
                                <Crown className="w-3.5 h-3.5" /> Líder de {group.name}
                            </label>
                            {currentLeaderName && <p className="text-sm text-[#111111] mb-2">Actual: <strong>{currentLeaderName}</strong></p>}
                            <MemberAutocomplete value={leaderInput} onChange={setLeaderInput} onSelectMember={handleSetLeader}
                                placeholder="Buscar miembro para asignar como líder..." className="max-w-sm" />
                            <p className="text-xs text-[#6E6E6E] mt-2">
                                No reemplaza a quienes ya son líderes por tener el tipo de miembro "Líder" — solo agrega a esta persona como líder de este ministerio en particular.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
                <button onClick={() => setActiveTab('members')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                        activeTab === 'members' ? 'border-[#2696D2] text-[#111111]' : 'border-transparent text-[#6E6E6E] hover:text-[#111111]'
                    }`}>
                    <Users className="w-4 h-4" /> Miembros
                </button>
                <button onClick={() => setActiveTab('notices')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                        activeTab === 'notices' ? 'border-[#2696D2] text-[#111111]' : 'border-transparent text-[#6E6E6E] hover:text-[#111111]'
                    }`}>
                    <Megaphone className="w-4 h-4" /> Avisos
                </button>
                <button onClick={() => setActiveTab('chat')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                        activeTab === 'chat' ? 'border-[#2696D2] text-[#111111]' : 'border-transparent text-[#6E6E6E] hover:text-[#111111]'
                    }`}>
                    <MessageCircle className="w-4 h-4" /> Chat
                </button>
                <button onClick={() => setActiveTab('offering')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                        activeTab === 'offering' ? 'border-[#2696D2] text-[#111111]' : 'border-transparent text-[#6E6E6E] hover:text-[#111111]'
                    }`}>
                    <HandCoins className="w-4 h-4" /> Ofrenda
                </button>
                {group.id === 'alabanza' && (
                    <button onClick={() => setActiveTab('calendar')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                            activeTab === 'calendar' ? 'border-[#2696D2] text-[#111111]' : 'border-transparent text-[#6E6E6E] hover:text-[#111111]'
                        }`}>
                        <Calendar className="w-4 h-4" /> Calendario
                    </button>
                )}
                {group.id === 'alabanza' && (
                    <button onClick={() => setActiveTab('repertoire')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                            activeTab === 'repertoire' ? 'border-[#2696D2] text-[#111111]' : 'border-transparent text-[#6E6E6E] hover:text-[#111111]'
                        }`}>
                        <ListMusic className="w-4 h-4" /> Repertorio
                    </button>
                )}
            </div>

            {/* Content */}
            {activeTab === 'members' && <MembersTab group={group} color={color} gradient={gradient} canManage={canManageMembers} />}
            {activeTab === 'notices' && <NoticesTab group={group} myProfile={myMemberProfile || user} canPublish={canPublishNotices} color={color} />}
            {activeTab === 'chat' && <ChatTab group={group} myProfile={myMemberProfile || user} canChat={canChat} color={color} />}
            {activeTab === 'offering' && <OfferingLog scopeKey={`grupo:${group.field}`} canManage={isLeader} color={color === '#111111' ? '#E8A838' : color} />}
            {activeTab === 'calendar' && group.id === 'alabanza' && <CalendarTab group={group} canManage={canPublishNotices} color={color} gradient={gradient} />}
            {activeTab === 'repertoire' && group.id === 'alabanza' && <RepertoireTab group={group} canManage={canPublishNotices} color={color} />}
        </div>
    )
}

// ---------------------------------------------------------------------------------------------------
// TAB: MIEMBROS
// ---------------------------------------------------------------------------------------------------
function MembersTab({ group, color, gradient, canManage }) {
    const [allMembers, setAllMembers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [notification, setNotification] = useState(null)

    useEffect(() => {
        refreshMembers()
    }, [group])

    const refreshMembers = () => {
        setAllMembers(getMembers().filter(m => m.is_active))
    }

    const enrolledMembers = allMembers.filter(m => m[group.field] === true)
    const availableMembers = allMembers.filter(m => !m[group.field])
    const filteredAvailable = availableMembers.filter(m =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleEnroll = (memberId, memberName) => {
        patchMember(memberId, { [group.field]: true })
        refreshMembers()
        setNotification({ type: 'success', message: `${memberName} inscrito exitosamente` })
        setTimeout(() => setNotification(null), 3000)
    }

    const handleRemove = (memberId, memberName) => {
        patchMember(memberId, { [group.field]: false })
        refreshMembers()
        setNotification({ type: 'info', message: `${memberName} removido del grupo` })
        setTimeout(() => setNotification(null), 3000)
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {notification && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${notification.type === 'success' ? 'bg-[#E1F9EC] text-[#111111]' : 'bg-[#E8F4FC] text-[#111111]'}`}>
                    <CheckCircle2 className={`w-5 h-5 ${notification.type === 'success' ? 'text-[#13CD68]' : 'text-[#2696D2]'}`} />
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            )}

            {/* Enrolled members */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#111111]">Miembros Inscritos</h3>
                    <span className="text-sm text-[#6E6E6E] bg-[#E8F4FC] px-3 py-1 rounded-full font-medium">
                        {enrolledMembers.length} inscritos
                    </span>
                </div>
                {enrolledMembers.length === 0 ? (
                    <div className="p-12 text-center text-[#6E6E6E]">
                        <Users className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                        <p className="text-lg font-medium">No hay miembros inscritos</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {enrolledMembers.map((member) => (
                            <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: color }}>
                                        {member.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#111111]">{member.full_name}</p>
                                        <p className="text-xs text-[#6E6E6E]">{member.member_type} • {member.phone || 'Sin teléfono'}</p>
                                    </div>
                                </div>
                                {canManage && (
                                    <button onClick={() => handleRemove(member.id, member.full_name)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#E74C3C] hover:bg-[#FADBD8] transition-colors cursor-pointer">
                                        <UserMinus className="w-4 h-4" /> Remover
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add members */}
            {canManage && (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-[#2696D2]" />
                        <h3 className="text-lg font-semibold text-[#111111]">Agregar Miembros</h3>
                    </div>
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E6E]" />
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar miembro por nombre o correo..."
                                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                        {filteredAvailable.map((member) => (
                            <div key={member.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#6E6E6E]/20 flex items-center justify-center text-[#6E6E6E] text-sm font-semibold">
                                        {member.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#111111]">{member.full_name}</p>
                                        <p className="text-xs text-[#6E6E6E]">{member.member_type}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleEnroll(member.id, member.full_name)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium transition-all hover:shadow-md cursor-point"
                                    style={{ background: gradient }}>
                                    <UserPlus className="w-4 h-4" /> Inscribir
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------------------------------
// TAB: AVISOS
// ---------------------------------------------------------------------------------------------------
function NoticesTab({ group, myProfile, canPublish, color }) {
    const [notices, setNotices] = useState([])
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [mediaBase64, setMediaBase64] = useState(null)
    const [mediaType, setMediaType] = useState(null)
    const [mediaName, setMediaName] = useState('')
    const fileInputRef = useRef(null)

    useEffect(() => {
        setNotices(getGroupNotices(group.id))
    }, [group.id])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setMediaName(file.name)
        setMediaType(file.type)
        const reader = new FileReader()
        reader.onloadend = () => setMediaBase64(reader.result)
        reader.readAsDataURL(file)
    }

    const removeAttachedFile = () => {
        setMediaBase64(null)
        setMediaType(null)
        setMediaName('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handlePublish = () => {
        if (!title.trim() || !content.trim()) return
        createGroupNotice({
            group_id: group.id,
            title,
            content,
            author_name: myProfile.full_name || myProfile.name, // Support both real member and dummy admin profile
            author_id: myProfile.id,
            media_url: mediaBase64,
            media_type: mediaType
        })
        setTitle('')
        setContent('')
        removeAttachedFile()
        setNotices(getGroupNotices(group.id))
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Formulario de anuncio nuevo */}
            {canPublish && (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                    <h3 className="text-lg font-semibold text-[#111111] mb-4 flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-[#2696D2]" /> Publicar Nuevo Aviso
                    </h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Título del aviso..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-gray-200 focus:border-[#2696D2] focus:outline-none transition-colors text-sm font-medium"
                        />
                        <textarea
                            placeholder="Escribe los detalles aquí..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-gray-200 focus:border-[#2696D2] focus:outline-none transition-colors text-sm resize-none"
                        />
                        
                        {/* Contenedor multimedia */}
                        {mediaBase64 && (
                            <div className="relative inline-block w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                <button onClick={removeAttachedFile} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                                {mediaType?.startsWith('image/') ? (
                                    <img src={mediaBase64} alt="Adjunto" className="w-full h-auto max-h-48 object-cover object-center" />
                                ) : (
                                    <div className="flex items-center gap-3 p-4">
                                        <Paperclip className="w-6 h-6 text-[#6E6E6E]" />
                                        <span className="text-sm font-medium text-[#111111] truncate">{mediaName}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm text-[#6E6E6E] hover:text-[#2696D2] transition-colors rounded-lg font-medium cursor-pointer">
                                <Image className="w-5 h-5" />
                                Adjuntar archivo
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                            
                            <button
                                onClick={handlePublish}
                                disabled={!title.trim() || !content.trim()}
                                className="px-5 py-2.5 rounded-xl font-medium text-white text-sm transition-all focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md"
                                style={{ background: color }}
                            >
                                <Send className="w-4 h-4" /> Publicar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Listado de avisos */}
            <div className="space-y-4">
                {notices.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                        <Megaphone className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                        <p className="text-lg font-medium text-[#6E6E6E]">No hay avisos publicados</p>
                    </div>
                ) : (
                    notices.map((notice) => (
                        <div key={notice.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xl font-bold text-[#111111]">{notice.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-[#6E6E6E] mt-1">
                                            <span>Por {notice.author_name}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(notice.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[#1F1F1F] text-sm leading-relaxed whitespace-pre-wrap mb-4">{notice.content}</p>
                                
                                {notice.media_url && notice.media_type?.startsWith('image/') && (
                                    <div className="mt-4 rounded-xl overflow-hidden border border-gray-100">
                                        <img src={notice.media_url} alt="Aviso Multimedia" className="w-full h-auto max-h-96 object-cover" />
                                    </div>
                                )}
                                {notice.media_url && !notice.media_type?.startsWith('image/') && (
                                    <div className="mt-4 flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <Paperclip className="w-5 h-5 text-[#2696D2]" />
                                        <a href={notice.media_url} download="Adjunto_Aviso" className="text-sm font-medium text-[#2696D2] hover:underline">
                                            Descargar Archivo Adjunto
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------------
// TAB: CHAT GRUPAL
// ---------------------------------------------------------------------------------------------------
function ChatTab({ group, myProfile, canChat, color }) {
    const [messages, setMessages] = useState([])
    const [msgContent, setMsgContent] = useState('')
    const [mediaBase64, setMediaBase64] = useState(null)
    const [mediaType, setMediaType] = useState(null)
    const fileInputRef = useRef(null)
    const chatEndRef = useRef(null)

    useEffect(() => {
        setMessages(getGroupMessages(group.id))
        scrollToBottom()
        
        // Simular tiempo real (polling básico)
        const intervalId = setInterval(() => {
            setMessages(getGroupMessages(group.id))
        }, 3000)
        return () => clearInterval(intervalId)
    }, [group.id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setMediaType(file.type)
        const reader = new FileReader()
        reader.onloadend = () => setMediaBase64(reader.result)
        reader.readAsDataURL(file)
    }

    const clearMedia = () => {
        setMediaBase64(null)
        setMediaType(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSend = () => {
        if (!msgContent.trim() && !mediaBase64) return
        sendGroupMessage({
            group_id: group.id,
            content: msgContent,
            sender_name: myProfile.full_name || myProfile.name,
            sender_id: myProfile.id,
            media_url: mediaBase64,
            media_type: mediaType
        })
        setMsgContent('')
        clearMedia()
        setMessages(getGroupMessages(group.id))
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!canChat) return null

    return (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] flex flex-col h-[600px] animate-fade-in border border-gray-100 overflow-hidden">
            {/* Cabecera del chat */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h3 className="text-sm font-bold text-[#111111]">Chat: {group.name}</h3>
                    <p className="text-xs text-[#6E6E6E]">Comunícate de forma segura con los miembros del ministerio.</p>
                </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#6E6E6E]">
                        <MessageCircle className="w-12 h-12 mb-3 text-[#6E6E6E]/20" />
                        <p className="text-sm">Envía el primer mensaje del grupo</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = msg.sender_id === myProfile.id
                        const showName = index === 0 || messages[index - 1].sender_id !== msg.sender_id

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                {showName && !isMine && <span className="text-xs font-semibold text-[#6E6E6E] mb-1 ml-1">{msg.sender_name}</span>}
                                
                                <div className={`relative max-w-[75%] rounded-2xl px-4 py-2 ${
                                    isMine ? 'text-white' : 'bg-white text-[#111111] border border-gray-100 shadow-sm'
                                }`} style={isMine ? { background: color } : {}}>
                                    
                                    {msg.media_url && msg.media_type?.startsWith('image/') && (
                                        <img src={msg.media_url} alt="Adjunto" className="w-full max-w-sm rounded-xl mb-2" />
                                    )}
                                    {msg.media_url && !msg.media_type?.startsWith('image/') && (
                                        <a href={msg.media_url} download className="flex items-center gap-2 text-sm underline mb-2 opacity-90">
                                            <Paperclip className="w-4 h-4"/> Archivo adjunto
                                        </a>
                                    )}

                                    {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                                    
                                    <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/70' : 'text-[#6E6E6E]'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input área */}
            <div className="p-4 bg-white border-t border-gray-100">
                {mediaBase64 && (
                    <div className="mb-3 relative inline-block p-1 bg-gray-100 rounded-lg">
                        <button onClick={clearMedia} className="absolute -top-2 -right-2 bg-black text-white rounded-full p-0.5 z-10 cursor-pointer shadow-md"><X className="w-3 h-3"/></button>
                        {mediaType?.startsWith('image/') ? (
                            <img src={mediaBase64} className="h-16 w-auto rounded object-cover" alt="preview" />
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#111111]">
                                <Paperclip className="w-4 h-4"/> Archivo listo
                            </div>
                        )}
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-[#6E6E6E] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer shrink-0">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    
                    <textarea 
                        value={msgContent}
                        onChange={e => setMsgContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        rows={1}
                        className="flex-1 max-h-32 min-h-[44px] bg-gray-50 border border-gray-200 focus:border-[#2696D2] focus:bg-white rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
                    />
                    
                    <button
                        onClick={handleSend}
                        disabled={!msgContent.trim() && !mediaBase64}
                        className="p-3 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm"
                        style={{ background: color }}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------------
// TAB: CALENDARIO (solo Ministerio de Alabanza) — asigna cantantes/músicos
// por servicio (cada servicio ya distingue jueves de domingo por sí solo).
// ---------------------------------------------------------------------------------------------------
function CalendarTab({ group, canManage, color, gradient }) {
    const [services, setServices] = useState([])
    const [eligibleMembers, setEligibleMembers] = useState([])
    const [songs, setSongs] = useState([])
    const [assignmentsByService, setAssignmentsByService] = useState({})
    const [setlistByService, setSetlistByService] = useState({})

    useEffect(() => {
        refreshServices()
        setEligibleMembers(getMembers().filter(m => m.is_active && m[group.field]))
        setSongs(getAlabanzaSongs())
    }, [group.field])

    const refreshServices = () => {
        const upcoming = getUpcomingAlabanzaOccasions(8)
        setServices(upcoming)
        const byService = {}
        const setlists = {}
        upcoming.forEach(s => {
            byService[s.id] = getAlabanzaAssignmentsForService(s.id)
            setlists[s.id] = getSetlistForService(s.id)
        })
        setAssignmentsByService(byService)
        setSetlistByService(setlists)
    }

    const refreshSetlist = (serviceId) => {
        setSetlistByService(prev => ({ ...prev, [serviceId]: getSetlistForService(serviceId) }))
    }

    const handleAssign = (serviceId, roleId, memberId) => {
        setAlabanzaAssignment(serviceId, roleId, memberId || null)
        setAssignmentsByService(prev => ({
            ...prev,
            [serviceId]: [
                ...(prev[serviceId] || []).filter(a => a.role_id !== roleId),
                ...(memberId ? [{ id: `alab-${serviceId}-${roleId}`, service_id: serviceId, role_id: roleId, member_id: memberId }] : []),
            ],
        }))
    }

    const handleAddSong = (serviceId, songId) => {
        if (!songId) return
        addSongToSetlist(serviceId, songId)
        refreshSetlist(serviceId)
    }

    const handleRemoveSong = (itemId, serviceId) => {
        removeSongFromSetlist(itemId)
        refreshSetlist(serviceId)
    }

    const handlePerformerChange = (itemId, serviceId, performerId) => {
        setSetlistPerformer(itemId, performerId || null)
        refreshSetlist(serviceId)
    }

    const formatServiceDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {!canManage && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E8F4FC] text-[#111111] text-sm">
                    <Calendar className="w-4 h-4 text-[#2696D2] flex-shrink-0" />
                    Solo el líder del ministerio o un administrador puede editar las asignaciones.
                </div>
            )}

            {services.map(service => {
                    const assignments = assignmentsByService[service.id] || []
                    const assignedMemberId = (roleId) => assignments.find(a => a.role_id === roleId)?.member_id || ''
                    const setlist = setlistByService[service.id] || []
                    const setlistSongIds = new Set(setlist.map(item => item.song_id))
                    const availableSongs = songs.filter(s => !setlistSongIds.has(s.id))

                    return (
                        <div key={service.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                            <div className="px-6 py-4" style={{ background: gradient }}>
                                <p className="text-white font-semibold capitalize">{formatServiceDate(service.service_date)}</p>
                                <p className="text-white/70 text-xs">{service.service_type === 'thursday' ? 'Culto de Jueves' : 'Culto de Domingo'}</p>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {ALABANZA_ROLES.map(role => (
                                    <div key={role.id}>
                                        <label className="block text-xs font-medium text-[#6E6E6E] mb-1">{role.label}</label>
                                        {canManage ? (
                                            <select
                                                value={assignedMemberId(role.id)}
                                                onChange={(e) => handleAssign(service.id, role.id, e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer"
                                            >
                                                <option value="">Sin asignar</option>
                                                {eligibleMembers.map(m => (
                                                    <option key={m.id} value={m.id}>{m.full_name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-sm text-[#111111] font-medium px-3 py-2 rounded-xl bg-gray-50/50">
                                                {eligibleMembers.find(m => m.id === assignedMemberId(role.id))?.full_name || 'Sin asignar'}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Canciones de este servicio */}
                            <div className="border-t border-gray-100 p-4 space-y-3">
                                <h4 className="text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider flex items-center gap-1.5">
                                    <ListMusic className="w-3.5 h-3.5" /> Canciones de este servicio
                                </h4>
                                {setlist.length === 0 ? (
                                    <p className="text-sm text-[#6E6E6E]">Sin canciones agregadas todavía.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {setlist.map(item => {
                                            const song = songs.find(s => s.id === item.song_id)
                                            if (!song) return null
                                            return (
                                                <li key={item.id} className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-medium text-[#111111] flex-1 min-w-[140px]">{song.title}</span>
                                                    {canManage ? (
                                                        <select
                                                            value={item.performer_id || ''}
                                                            onChange={(e) => handlePerformerChange(item.id, service.id, e.target.value)}
                                                            className="px-3 py-1.5 rounded-lg border-2 border-gray-100 bg-gray-50/50 text-sm cursor-pointer focus:outline-none focus:border-[#2696D2]"
                                                        >
                                                            <option value="">Sin intérprete</option>
                                                            {eligibleMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className="text-xs text-[#6E6E6E]">
                                                            {eligibleMembers.find(m => m.id === item.performer_id)?.full_name || 'Sin intérprete'}
                                                        </span>
                                                    )}
                                                    {canManage && (
                                                        <button onClick={() => handleRemoveSong(item.id, service.id)}
                                                            className="p-1.5 rounded-lg text-[#E74C3C] hover:bg-[#FADBD8] transition-colors cursor-pointer" aria-label="Quitar canción">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                                {canManage && (
                                    songs.length === 0 ? (
                                        <p className="text-xs text-[#6E6E6E]/70">Agrega canciones desde la pestaña Repertorio para poder elegirlas aquí.</p>
                                    ) : availableSongs.length === 0 ? (
                                        <p className="text-xs text-[#6E6E6E]/70">Todas las canciones del repertorio ya están agregadas.</p>
                                    ) : (
                                        <AddSongRow serviceId={service.id} availableSongs={availableSongs} onAdd={handleAddSong} />
                                    )
                                )}
                            </div>
                        </div>
                    )
                })}
        </div>
    )
}

function AddSongRow({ serviceId, availableSongs, onAdd }) {
    const [songId, setSongId] = useState('')

    const handleAdd = () => {
        if (!songId) return
        onAdd(serviceId, songId)
        setSongId('')
    }

    return (
        <div className="flex items-center gap-2">
            <select
                value={songId}
                onChange={(e) => setSongId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-100 bg-white text-sm cursor-pointer focus:outline-none focus:border-[#2696D2]"
            >
                <option value="">Agregar canción del repertorio...</option>
                {availableSongs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <button
                onClick={handleAdd}
                disabled={!songId}
                className="px-3 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                style={{ background: '#2696D2' }}
            >
                <Plus className="w-4 h-4" /> Agregar
            </button>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------------
// TAB: REPERTORIO (solo Ministerio de Alabanza) — cifrados en texto plano
// con transposición de tonalidad en el navegador (sin audio ni OCR: los
// acordes ya vienen como texto, ver src/lib/chordTranspose.js).
// ---------------------------------------------------------------------------------------------------
function RepertoireTab({ group, canManage, color }) {
    const [songs, setSongs] = useState([])
    const [eligibleMembers, setEligibleMembers] = useState([])
    const [upcomingServices, setUpcomingServices] = useState([])
    const [filterServiceId, setFilterServiceId] = useState('')
    const [selectedId, setSelectedId] = useState(null)
    const [semitones, setSemitones] = useState(0)
    const [preferFlats, setPreferFlats] = useState(false)
    const [editingKey, setEditingKey] = useState(false)
    const [keyInput, setKeyInput] = useState('')
    const [form, setForm] = useState({ title: '', original_key: '', chord_chart: '' })

    useEffect(() => {
        refresh()
        setEligibleMembers(getMembers().filter(m => m.is_active && m[group.field]))
        const upcoming = getUpcomingAlabanzaOccasions(8)
        setUpcomingServices(upcoming)
        setFilterServiceId(upcoming[0]?.id || '')
    }, [group.field])

    const refresh = () => setSongs(getAlabanzaSongs())

    const formatServiceOption = (service) => {
        const [year, month, day] = service.service_date.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        const label = date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
        return `${service.service_type === 'thursday' ? 'Jueves' : 'Domingo'} ${label}`
    }

    const setlist = filterServiceId ? getSetlistForService(filterServiceId) : []
    const displayedSongs = filterServiceId
        ? setlist.map(item => ({ song: songs.find(s => s.id === item.song_id), performerId: item.performer_id })).filter(entry => entry.song)
        : songs.map(song => ({ song, performerId: null }))

    const selectedSong = songs.find(s => s.id === selectedId) || null

    const openSong = (id) => { setSelectedId(id); setSemitones(0); setPreferFlats(false); setEditingKey(false) }
    const closeSong = () => setSelectedId(null)

    const handleCreate = () => {
        if (!form.title.trim() || !form.chord_chart.trim()) return
        createAlabanzaSong(form)
        setForm({ title: '', original_key: '', chord_chart: '' })
        refresh()
    }

    const handleDelete = (id) => {
        deleteAlabanzaSong(id)
        if (selectedId === id) closeSong()
        refresh()
    }

    const handleSaveKey = () => {
        updateAlabanzaSong(selectedSong.id, { original_key: keyInput })
        setEditingKey(false)
        refresh()
    }

    if (selectedSong) {
        const transposedChart = transposeChordChart(selectedSong.chord_chart, semitones, preferFlats)
        const detectedKey = detectFirstChordRoot(selectedSong.chord_chart)
        const referenceKey = selectedSong.original_key || detectedKey
        const isDetectedGuess = !selectedSong.original_key && !!detectedKey
        const currentKeyLabel = referenceKey ? transposeKeyLabel(referenceKey, semitones, preferFlats) : null

        const handleJumpToKey = (targetKey) => {
            if (!referenceKey || !targetKey) return
            setSemitones(keyDifference(referenceKey, targetKey))
        }

        return (
            <div className="space-y-4 animate-fade-in">
                <button onClick={closeSong} className="flex items-center gap-1.5 text-sm font-medium text-[#2696D2] hover:underline cursor-pointer">
                    <ChevronLeft className="w-4 h-4" /> Volver al repertorio
                </button>

                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h3 className="text-lg font-bold text-[#111111]">{selectedSong.title}</h3>
                            {editingKey ? (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <select value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
                                        className="px-3 py-1.5 rounded-lg border-2 border-gray-100 bg-white text-sm cursor-pointer focus:outline-none focus:border-[#2696D2]">
                                        <option value="">Sin especificar</option>
                                        {KEY_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                    <button onClick={handleSaveKey} className="p-1.5 rounded-lg text-[#13CD68] hover:bg-[#E1F9EC] cursor-pointer" aria-label="Guardar tonalidad">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditingKey(false)} className="p-1.5 rounded-lg text-[#6E6E6E] hover:bg-gray-100 cursor-pointer" aria-label="Cancelar">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : currentKeyLabel ? (
                                <p className="text-sm text-[#6E6E6E] mt-1 flex items-center gap-1.5">
                                    Tonalidad: <span className="font-semibold" style={{ color }}>{currentKeyLabel}</span>
                                    {semitones !== 0 && <span className="text-xs text-[#6E6E6E]">(original {referenceKey})</span>}
                                    {isDetectedGuess && <span className="text-xs text-[#6E6E6E]/70 italic">(detectada automáticamente)</span>}
                                    {canManage && (
                                        <button onClick={() => { setKeyInput(selectedSong.original_key || ''); setEditingKey(true) }}
                                            className="p-1 rounded text-[#2696D2] hover:bg-[#E8F4FC] cursor-pointer" aria-label="Editar tonalidad">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </p>
                            ) : (
                                canManage && (
                                    <button onClick={() => { setKeyInput(''); setEditingKey(true) }}
                                        className="text-xs text-[#2696D2] hover:underline cursor-pointer mt-1">
                                        + Agregar tonalidad original
                                    </button>
                                )
                            )}
                        </div>
                        {canManage && (
                            <button onClick={() => handleDelete(selectedSong.id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#E74C3C] hover:bg-[#FADBD8] transition-colors cursor-pointer">
                                <Trash2 className="w-4 h-4" /> Eliminar
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-gray-50/80">
                        <span className="text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Transportar</span>
                        <button onClick={() => setSemitones(s => s - 1)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                            <MinusCircle className="w-4 h-4" style={{ color }} />
                        </button>
                        <span className="text-sm font-bold text-[#111111] w-10 text-center">{semitones > 0 ? `+${semitones}` : semitones}</span>
                        <button onClick={() => setSemitones(s => s + 1)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                            <PlusCircle className="w-4 h-4" style={{ color }} />
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#6E6E6E]">o ir directo a:</span>
                            <select
                                value={currentKeyLabel || ''}
                                onChange={(e) => handleJumpToKey(e.target.value)}
                                disabled={!referenceKey}
                                className="px-3 py-1.5 rounded-lg border-2 border-gray-100 bg-white text-sm cursor-pointer focus:outline-none focus:border-[#2696D2] disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!referenceKey ? 'Agrega la tonalidad original para poder elegir directamente' : ''}
                            >
                                {!currentKeyLabel && <option value="">Tonalidad</option>}
                                {KEY_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>

                        {semitones !== 0 && (
                            <button onClick={() => setSemitones(0)} className="text-xs text-[#6E6E6E] hover:text-[#111111] underline cursor-pointer">
                                Restablecer
                            </button>
                        )}
                        <label className="flex items-center gap-1.5 text-xs text-[#6E6E6E] cursor-pointer sm:ml-auto">
                            <input type="checkbox" checked={preferFlats} onChange={(e) => setPreferFlats(e.target.checked)} className="accent-[#2696D2] cursor-pointer" />
                            Usar bemoles (b) en vez de sostenidos (#)
                        </label>
                    </div>

                    <pre className="bg-gray-50/80 rounded-xl p-4 overflow-x-auto text-sm font-mono leading-relaxed text-[#111111]">{transposedChart}</pre>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {canManage && (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                    <h3 className="text-lg font-semibold text-[#111111] mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" style={{ color }} /> Agregar Canción al Repertorio
                    </h3>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Título de la canción..."
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-gray-200 focus:border-[#2696D2] focus:outline-none transition-colors text-sm font-medium"
                            />
                            <select
                                value={form.original_key}
                                onChange={e => setForm(f => ({ ...f, original_key: e.target.value }))}
                                className="px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-gray-200 focus:border-[#2696D2] focus:outline-none transition-colors text-sm cursor-pointer"
                            >
                                <option value="">Tonalidad original (opcional)</option>
                                {KEY_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <textarea
                            placeholder={'Pega aquí el cifrado (acordes sobre la letra), por ejemplo:\n\n  B              F#  E     B\nNo existen más motivos Señor'}
                            value={form.chord_chart}
                            onChange={e => setForm(f => ({ ...f, chord_chart: e.target.value }))}
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-gray-200 focus:border-[#2696D2] focus:outline-none transition-colors text-sm font-mono resize-y"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleCreate}
                                disabled={!form.title.trim() || !form.chord_chart.trim()}
                                className="px-5 py-2.5 rounded-xl font-medium text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md"
                                style={{ background: color }}
                            >
                                <Plus className="w-4 h-4" /> Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-lg font-semibold text-[#111111]">Repertorio</h3>
                    {upcomingServices.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Filtrar por servicio</label>
                            <select
                                value={filterServiceId}
                                onChange={(e) => setFilterServiceId(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border-2 border-gray-100 bg-white text-sm cursor-pointer focus:outline-none focus:border-[#2696D2]"
                            >
                                <option value="">Todas las canciones</option>
                                {upcomingServices.map(s => (
                                    <option key={s.id} value={s.id}>{formatServiceOption(s)}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                {displayedSongs.length === 0 ? (
                    <div className="p-12 text-center text-[#6E6E6E]">
                        <ListMusic className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                        <p className="text-lg font-medium">
                            {filterServiceId ? 'Todavía no hay canciones asignadas a este servicio' : 'Todavía no hay canciones en el repertorio'}
                        </p>
                        {filterServiceId && <p className="text-sm mt-1">Agrégalas desde la pestaña Calendario.</p>}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {displayedSongs.map(({ song, performerId }) => (
                            <button key={song.id} onClick={() => openSong(song.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer text-left">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: color }}>
                                        <ListMusic className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#111111]">{song.title}</p>
                                        {song.original_key && <p className="text-xs text-[#6E6E6E]">Tonalidad original: {song.original_key}</p>}
                                    </div>
                                </div>
                                {filterServiceId && (
                                    <span className="text-xs text-[#6E6E6E] flex-shrink-0">
                                        {eligibleMembers.find(m => m.id === performerId)?.full_name || 'Sin intérprete'}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
