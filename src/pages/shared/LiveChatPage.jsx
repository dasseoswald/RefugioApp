import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    listenToGeneralMessages, sendGeneralMessage, deleteGeneralMessage, clearGeneralMessages,
    getUsers, isUserOnline,
} from '../../data/mockData.js'
import ChatBox from '../../components/shared/ChatBox.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { Trash2 } from 'lucide-react'

export default function LiveChatPage() {
    const { user } = useAuth()
    const [onlineUsers, setOnlineUsers] = useState([])
    const [confirmClear, setConfirmClear] = useState(false)

    useEffect(() => {
        const updateOnline = () => setOnlineUsers(getUsers().filter(isUserOnline))
        updateOnline()
        const interval = setInterval(updateOnline, 15000)
        return () => clearInterval(interval)
    }, [])

    const handleClearAll = () => {
        clearGeneralMessages()
        setConfirmClear(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-[#111111]">Chat en Vivo</h1>
                    <p className="text-[#6E6E6E] mt-1 flex items-center gap-2 flex-wrap">
                        Conversa con toda la comunidad de Refugio App
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E1F9EC] text-[#13CD68]">
                            <span className="w-2 h-2 rounded-full bg-[#13CD68] animate-pulse"></span>
                            {onlineUsers.length} en línea
                        </span>
                    </p>
                </div>

                {user?.role === 'admin' && (
                    confirmClear ? (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-[#6E6E6E]">¿Borrar TODOS los mensajes?</span>
                            <button onClick={handleClearAll} className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold bg-[#E74C3C] hover:bg-[#C0392B] cursor-pointer">Sí, borrar todo</button>
                            <button onClick={() => setConfirmClear(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6E6E6E] hover:bg-gray-100 cursor-pointer">Cancelar</button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmClear(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#E74C3C] hover:bg-[#FADBD8] transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4" /> Vaciar chat
                        </button>
                    )
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
                <ChatBox
                    listenFn={listenToGeneralMessages}
                    sendFn={sendGeneralMessage}
                    deleteFn={deleteGeneralMessage}
                    heightClass="h-[calc(100vh-220px)] min-h-[400px]"
                    emptyMessage="Envía el primer mensaje de la comunidad"
                />

                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] border border-gray-100 overflow-hidden h-[calc(100vh-220px)] min-h-[400px] flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-[#111111]">En línea ({onlineUsers.length})</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {onlineUsers.length === 0 ? (
                            <p className="text-sm text-[#6E6E6E] px-2 py-4 text-center">Nadie conectado ahora mismo</p>
                        ) : (
                            onlineUsers.map(u => (
                                <div key={u.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50">
                                    <div className="relative">
                                        <UserAvatar photoUrl={u.photo_url} name={u.name} size="sm" />
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#13CD68] border-2 border-white"></span>
                                    </div>
                                    <span className="text-sm font-medium text-[#111111] truncate">{u.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
