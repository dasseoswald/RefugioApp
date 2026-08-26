import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { MessageCircle, Send, Paperclip, X, Trash2 } from 'lucide-react'

export default function ChatBox({ listenFn, sendFn, deleteFn, heightClass = 'h-[500px]', emptyMessage = 'Envía el primer mensaje' }) {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'
    const [messages, setMessages] = useState([])
    const [msgContent, setMsgContent] = useState('')
    const [mediaBase64, setMediaBase64] = useState(null)
    const [mediaType, setMediaType] = useState(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)
    const fileInputRef = useRef(null)
    const chatEndRef = useRef(null)

    useEffect(() => {
        const unsubscribe = listenFn(setMessages)
        return unsubscribe
    }, [listenFn])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

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
        sendFn({
            content: msgContent,
            sender_id: user.id,
            sender_name: user.name,
            sender_photo: user.photo_url,
            sender_uid: user.auth_uid,
            media_url: mediaBase64,
            media_type: mediaType,
        })
        setMsgContent('')
        clearMedia()
    }

    const handleDelete = (messageId) => {
        deleteFn?.(messageId)
        setConfirmDeleteId(null)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className={`bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] flex flex-col ${heightClass} border border-gray-100 overflow-hidden`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#6E6E6E]">
                        <MessageCircle className="w-12 h-12 mb-3 text-[#6E6E6E]/20" />
                        <p className="text-sm">{emptyMessage}</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = msg.sender_id === user.id
                        const showName = index === 0 || messages[index - 1].sender_id !== msg.sender_id
                        const canDelete = !!deleteFn && (isMine || isAdmin)
                        const confirming = confirmDeleteId === msg.id

                        return (
                            <div key={msg.id} className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                {showName && !isMine && <span className="text-xs font-semibold text-[#6E6E6E] mb-1 ml-1">{msg.sender_name}</span>}

                                <div className={`relative max-w-[75%] rounded-2xl px-4 py-2 ${
                                    isMine ? 'text-white' : 'bg-white text-[#111111] border border-gray-100 shadow-sm'
                                }`} style={isMine ? { background: '#2696D2' } : {}}>

                                    {canDelete && (
                                        <button onClick={() => setConfirmDeleteId(msg.id)} title="Borrar mensaje"
                                            className={`absolute -top-2.5 ${isMine ? '-left-2.5' : '-right-2.5'} w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center text-[#6E6E6E] hover:text-[#E74C3C] hover:border-[#E74C3C] cursor-pointer transition-colors hidden group-hover:flex`}>
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}

                                    {msg.media_url && msg.media_type?.startsWith('image/') && (
                                        <img src={msg.media_url} alt="Adjunto" className="w-full max-w-sm rounded-xl mb-2" />
                                    )}
                                    {msg.media_url && !msg.media_type?.startsWith('image/') && (
                                        <a href={msg.media_url} download className="flex items-center gap-2 text-sm underline mb-2 opacity-90">
                                            <Paperclip className="w-4 h-4" /> Archivo adjunto
                                        </a>
                                    )}

                                    {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}

                                    {confirming ? (
                                        <div className={`flex items-center gap-2 mt-1 justify-end`}>
                                            <button onClick={() => handleDelete(msg.id)} className={`text-[10px] font-semibold underline cursor-pointer ${isMine ? 'text-white' : 'text-[#E74C3C]'}`}>Borrar</button>
                                            <button onClick={() => setConfirmDeleteId(null)} className={`text-[10px] font-semibold underline cursor-pointer ${isMine ? 'text-white/80' : 'text-[#6E6E6E]'}`}>Cancelar</button>
                                        </div>
                                    ) : (
                                        <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/70' : 'text-[#6E6E6E]'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                {mediaBase64 && (
                    <div className="mb-3 relative inline-block p-1 bg-gray-100 rounded-lg">
                        <button onClick={clearMedia} className="absolute -top-2 -right-2 bg-black text-white rounded-full p-0.5 z-10 cursor-pointer shadow-md"><X className="w-3 h-3" /></button>
                        {mediaType?.startsWith('image/') ? (
                            <img src={mediaBase64} className="h-16 w-auto rounded object-cover" alt="preview" />
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#111111]">
                                <Paperclip className="w-4 h-4" /> Archivo listo
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
                        style={{ background: '#2696D2' }}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
