import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    getUsers, subscribeConversations, getOrCreateConversation,
    listenToConversationMessages, sendConversationMessage, deleteConversationMessage, markConversationRead,
} from '../../data/mockData.js'
import ChatBox from '../../components/shared/ChatBox.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { MessageSquarePlus, Search, MessageSquare } from 'lucide-react'

function timeAgo(iso) {
    if (!iso) return ''
    const diffMs = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'ahora'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} d`
    return new Date(iso).toLocaleDateString('es-CL')
}

export default function DirectMessagesPage() {
    const { user } = useAuth()
    const myUid = user?.auth_uid
    const [conversations, setConversations] = useState([])
    const [activeId, setActiveId] = useState(null)
    const [showPicker, setShowPicker] = useState(false)
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (!myUid) return
        return subscribeConversations(myUid, setConversations)
    }, [myUid])

    useEffect(() => {
        if (activeId) markConversationRead(activeId, myUid)
    }, [activeId, myUid])

    const activeConversation = conversations.find(c => c.id === activeId) || null
    const otherUid = activeConversation?.participants?.find(uid => uid !== myUid)
    const otherInfo = otherUid ? activeConversation.participant_info?.[otherUid] : null

    const candidates = useMemo(() => {
        const term = search.trim().toLowerCase()
        return getUsers()
            .filter(u => u.auth_uid && u.auth_uid !== myUid)
            .filter(u => !term || u.name?.toLowerCase().includes(term))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [search, myUid])

    const handlePick = async (candidate) => {
        const conversationId = await getOrCreateConversation(
            { uid: myUid, name: user.name, photo_url: user.photo_url },
            { uid: candidate.auth_uid, name: candidate.name, photo_url: candidate.photo_url }
        )
        setShowPicker(false)
        setSearch('')
        setActiveId(conversationId)
    }

    const isConversationUnread = (conv) => {
        if (!conv.last_sender_uid || conv.last_sender_uid === myUid) return false
        const lastRead = conv.last_read_at?.[myUid]
        return !lastRead || new Date(conv.last_message_at) > new Date(lastRead)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111111]">Mensajes Directos</h1>
                    <p className="text-[#6E6E6E] mt-1">Conversaciones privadas 1 a 1 con otros miembros</p>
                </div>
                <button onClick={() => setShowPicker(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                    <MessageSquarePlus className="w-4 h-4" /> Nuevo mensaje
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 items-start">
                {/* Lista de conversaciones */}
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] border border-gray-100 overflow-hidden h-[calc(100vh-220px)] min-h-[400px] flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-[#111111]">Conversaciones ({conversations.length})</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-[#6E6E6E] px-4 text-center">
                                <MessageSquare className="w-10 h-10 mb-2 text-[#6E6E6E]/20" />
                                <p className="text-sm">Todavía no tienes conversaciones</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const otherId = conv.participants?.find(uid => uid !== myUid)
                                const info = conv.participant_info?.[otherId] || { name: 'Miembro' }
                                const unread = isConversationUnread(conv)
                                const isActive = conv.id === activeId
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setActiveId(conv.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-b border-gray-50 ${isActive ? 'bg-[#E8F4FC]' : 'hover:bg-gray-50'}`}
                                    >
                                        <UserAvatar photoUrl={info.photo_url} name={info.name} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-sm truncate ${unread ? 'font-bold text-[#111111]' : 'font-medium text-[#111111]'}`}>{info.name}</p>
                                                <span className="text-[10px] text-[#9E9E9E] flex-shrink-0">{timeAgo(conv.last_message_at)}</span>
                                            </div>
                                            <p className={`text-xs truncate ${unread ? 'font-semibold text-[#111111]' : 'text-[#6E6E6E]'}`}>
                                                {conv.last_message || 'Sin mensajes todavía'}
                                            </p>
                                        </div>
                                        {unread && <span className="w-2 h-2 rounded-full bg-[#2696D2] flex-shrink-0" />}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Hilo activo */}
                {activeConversation ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 px-1">
                            <UserAvatar photoUrl={otherInfo?.photo_url} name={otherInfo?.name} size="sm" />
                            <p className="text-sm font-semibold text-[#111111]">{otherInfo?.name || 'Miembro'}</p>
                        </div>
                        <ChatBox
                            key={activeConversation.id}
                            listenFn={(cb) => listenToConversationMessages(activeConversation.id, cb)}
                            sendFn={(data) => sendConversationMessage(activeConversation.id, data)}
                            deleteFn={(messageId) => deleteConversationMessage(activeConversation.id, messageId)}
                            heightClass="h-[calc(100vh-280px)] min-h-[350px]"
                            emptyMessage="Envía el primer mensaje de esta conversación"
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] border border-gray-100 h-[calc(100vh-220px)] min-h-[400px] flex flex-col items-center justify-center text-[#6E6E6E]">
                        <MessageSquare className="w-12 h-12 mb-3 text-[#6E6E6E]/20" />
                        <p className="text-sm">Elige una conversación o inicia una nueva</p>
                    </div>
                )}
            </div>

            {/* Selector de miembro para iniciar conversación */}
            <Modal isOpen={showPicker} onClose={() => setShowPicker(false)} title="Nuevo mensaje">
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="w-4 h-4 text-[#6E6E6E] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm"
                        />
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-1">
                        {candidates.length === 0 ? (
                            <p className="text-sm text-[#6E6E6E] text-center py-6">Sin resultados</p>
                        ) : (
                            candidates.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handlePick(c)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                >
                                    <UserAvatar photoUrl={c.photo_url} name={c.name} size="sm" />
                                    <span className="text-sm font-medium text-[#111111] truncate">{c.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    )
}
