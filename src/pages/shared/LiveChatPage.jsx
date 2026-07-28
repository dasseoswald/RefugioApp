import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { listenToGeneralMessages, sendGeneralMessage, getUsers, isUserOnline } from '../../data/mockData.js'
import { MessageCircle, Send, Paperclip, X } from 'lucide-react'

export default function LiveChatPage() {
    const { user } = useAuth()
    const [messages, setMessages] = useState([])
    const [onlineCount, setOnlineCount] = useState(0)
    const [msgContent, setMsgContent] = useState('')
    const [mediaBase64, setMediaBase64] = useState(null)
    const [mediaType, setMediaType] = useState(null)
    const fileInputRef = useRef(null)
    const chatEndRef = useRef(null)

    useEffect(() => {
        const unsubscribe = listenToGeneralMessages(setMessages)
        return unsubscribe
    }, [])

    useEffect(() => {
        const updateOnlineCount = () => setOnlineCount(getUsers().filter(isUserOnline).length)
        updateOnlineCount()
        const interval = setInterval(updateOnlineCount, 15000)
        return () => clearInterval(interval)
    }, [])

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
        sendGeneralMessage({
            content: msgContent,
            sender_id: user.id,
            sender_name: user.name,
            sender_photo: user.photo_url,
            media_url: mediaBase64,
            media_type: mediaType,
        })
        setMsgContent('')
        clearMedia()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Chat en Vivo</h1>
                <p className="text-[#6E6E6E] mt-1 flex items-center gap-2">
                    Conversa con toda la comunidad de Refugio App
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E1F9EC] text-[#13CD68]">
                        <span className="w-2 h-2 rounded-full bg-[#13CD68] animate-pulse"></span>
                        {onlineCount} en línea
                    </span>
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] flex flex-col h-[calc(100vh-220px)] min-h-[400px] border border-gray-100 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#6E6E6E]">
                            <MessageCircle className="w-12 h-12 mb-3 text-[#6E6E6E]/20" />
                            <p className="text-sm">Envía el primer mensaje de la comunidad</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isMine = msg.sender_id === user.id
                            const showName = index === 0 || messages[index - 1].sender_id !== msg.sender_id

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                    {showName && !isMine && <span className="text-xs font-semibold text-[#6E6E6E] mb-1 ml-1">{msg.sender_name}</span>}

                                    <div className={`relative max-w-[75%] rounded-2xl px-4 py-2 ${
                                        isMine ? 'text-white' : 'bg-white text-[#111111] border border-gray-100 shadow-sm'
                                    }`} style={isMine ? { background: '#2696D2' } : {}}>

                                        {msg.media_url && msg.media_type?.startsWith('image/') && (
                                            <img src={msg.media_url} alt="Adjunto" className="w-full max-w-sm rounded-xl mb-2" />
                                        )}
                                        {msg.media_url && !msg.media_type?.startsWith('image/') && (
                                            <a href={msg.media_url} download className="flex items-center gap-2 text-sm underline mb-2 opacity-90">
                                                <Paperclip className="w-4 h-4" /> Archivo adjunto
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
        </div>
    )
}
