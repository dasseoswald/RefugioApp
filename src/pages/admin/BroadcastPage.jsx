import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { OPERATIONAL_GROUPS, broadcastNoticeToGroups } from '../../data/mockData.js'
import {
    Megaphone, Send, Image, Paperclip, X, CheckCircle2, CheckSquare, Square,
    BookOpen, Sprout, Users, UserCircle, UserSquare, Baby, Music, Home
} from 'lucide-react'

const ICONS_MAP = { BookOpen, Sprout, Users, UserCircle, UserSquare, Baby, Music, Home }

export default function BroadcastPage() {
    const { user } = useAuth()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [mediaBase64, setMediaBase64] = useState(null)
    const [mediaType, setMediaType] = useState(null)
    const [mediaName, setMediaName] = useState('')
    const [selectedGroups, setSelectedGroups] = useState(OPERATIONAL_GROUPS.map(g => g.id))
    const [notification, setNotification] = useState(null)
    const fileInputRef = useRef(null)

    const allSelected = selectedGroups.length === OPERATIONAL_GROUPS.length

    const toggleGroup = (groupId) => {
        setSelectedGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId])
    }

    const toggleAll = () => {
        setSelectedGroups(allSelected ? [] : OPERATIONAL_GROUPS.map(g => g.id))
    }

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

    const handleSend = () => {
        if (!title.trim() || !content.trim() || selectedGroups.length === 0) return

        broadcastNoticeToGroups(selectedGroups, {
            title: title.trim(),
            content: content.trim(),
            author_name: user?.name,
            author_id: user?.id,
            media_url: mediaBase64,
            media_type: mediaType,
            // Si se envió a todos los grupos, se marca como mensaje general
            // para que también llegue a quienes no tienen ningún ministerio
            // asignado (ver getNoticesForMember).
            audience: allSelected ? 'all' : null,
        })

        setNotification({ type: 'success', message: `Aviso enviado a ${selectedGroups.length} grupo${selectedGroups.length === 1 ? '' : 's'} exitosamente` })
        setTitle('')
        setContent('')
        removeAttachedFile()
        setTimeout(() => setNotification(null), 4000)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #010101 0%, #1A1A1A 100%)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <Megaphone className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Mensajes</h1>
                        <p className="text-white/70 text-sm mt-1">Envía un aviso a todos los grupos y ministerios a la vez</p>
                    </div>
                </div>
            </div>

            {notification && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E1F9EC] text-[#111111] animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-[#13CD68]" />
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compose */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-[#111111] flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-[#2696D2]" /> Redactar Aviso
                    </h3>
                    <input
                        type="text"
                        placeholder="Título del aviso..."
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-gray-200 focus:border-[#2696D2] focus:outline-none transition-colors text-sm font-medium"
                    />
                    <textarea
                        placeholder="Escribe el mensaje que recibirán todos los grupos seleccionados..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 hover:border-gray-200 focus:border-[#2696D2] focus:outline-none transition-colors text-sm resize-none"
                    />

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
                            onClick={handleSend}
                            disabled={!title.trim() || !content.trim() || selectedGroups.length === 0}
                            className="px-5 py-2.5 rounded-xl font-medium text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}
                        >
                            <Send className="w-4 h-4" /> Enviar a {selectedGroups.length} grupo{selectedGroups.length === 1 ? '' : 's'}
                        </button>
                    </div>
                </div>

                {/* Group selection */}
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden h-fit">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[#111111]">Destinatarios</h3>
                        <button onClick={toggleAll} className="text-xs font-medium text-[#2696D2] hover:underline cursor-pointer">
                            {allSelected ? 'Ninguno' : 'Todos'}
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                        {OPERATIONAL_GROUPS.map(group => {
                            const IconComponent = ICONS_MAP[group.icon] || Users
                            const checked = selectedGroups.includes(group.id)
                            return (
                                <button key={group.id} onClick={() => toggleGroup(group.id)}
                                    className="w-full px-6 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer text-left">
                                    {checked ? <CheckSquare className="w-5 h-5 text-[#2696D2] flex-shrink-0" /> : <Square className="w-5 h-5 text-[#6E6E6E]/40 flex-shrink-0" />}
                                    <IconComponent className="w-4 h-4 text-[#6E6E6E] flex-shrink-0" />
                                    <span className="text-sm font-medium text-[#111111] truncate">{group.name}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
