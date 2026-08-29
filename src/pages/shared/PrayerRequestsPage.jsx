import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getPrayerRequests, createPrayerRequest, markPrayerAnswered, getActiveService, getGratitudeForPrayer, addProfileNote, createMember } from '../../data/mockData.js'
import Modal from '../../components/ui/Modal.jsx'
import MemberAutocomplete from '../../components/shared/MemberAutocomplete.jsx'
import {
    HandHeart, Heart, Send, CheckCircle2, Sparkles, Calendar, Filter
} from 'lucide-react'

export default function PrayerRequestsPage() {
    const { user } = useAuth()
    const [requests, setRequests] = useState([])
    const [activeService, setActiveService] = useState(null)
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [composeType, setComposeType] = useState('oracion')
    const [content, setContent] = useState('')
    const [nameInput, setNameInput] = useState(user?.name || '')
    const [selectedMemberId, setSelectedMemberId] = useState(user?.member_id || null)
    const [skipMemberLink, setSkipMemberLink] = useState(false)
    const [notification, setNotification] = useState(null)
    const [answeringPrayer, setAnsweringPrayer] = useState(null)
    const [gratitudeText, setGratitudeText] = useState('')

    useEffect(() => {
        refreshData()
    }, [])

    const refreshData = () => {
        setRequests(getPrayerRequests())
        setActiveService(getActiveService())
    }

    const showNotification = (message) => {
        setNotification(message)
        setTimeout(() => setNotification(null), 3000)
    }

    const handleSubmit = () => {
        if (!content.trim() || !nameInput.trim()) return

        // Si no se marcó "no vincular", la petición SIEMPRE queda asignada a
        // un miembro — si el nombre no coincide con nadie existente (persona
        // nueva), se crea un miembro Visitante en el momento para poder
        // vincularla igual, en vez de quedar como texto suelto sin dueño.
        let memberId = selectedMemberId
        if (!skipMemberLink && !memberId) {
            const created = createMember({
                full_name: nameInput.trim(), member_type: 'Visitante',
                gender: '', phone: '', email: '', groups: [],
            })
            memberId = created.id
        }

        createPrayerRequest({
            service_id: activeService?.id || null,
            member_id: skipMemberLink ? null : memberId,
            author_name: nameInput.trim(),
            type: composeType,
            content: content.trim(),
        })
        // Deja registro histórico en la ficha del miembro, si la petición
        // quedó asociada a uno.
        if (!skipMemberLink && memberId) {
            const label = composeType === 'oracion' ? 'Petición de oración' : 'Agradecimiento'
            addProfileNote(memberId, user?.name || 'Sistema', `${label}: ${content.trim()}`)
        }
        setContent('')
        setSelectedMemberId(null)
        refreshData()
        showNotification(composeType === 'oracion' ? 'Petición de oración enviada' : 'Gratitud compartida')
    }

    const openAnswerModal = (request) => {
        setAnsweringPrayer(request)
        setGratitudeText('')
    }

    const handleConfirmAnswered = (withGratitude) => {
        const result = markPrayerAnswered(answeringPrayer.id, withGratitude ? gratitudeText : '')
        setAnsweringPrayer(null)
        setGratitudeText('')
        refreshData()
        showNotification(result?.gratitude ? 'Oración contestada y gratitud compartida 🙏' : 'Marcada como oración contestada 🙏')
    }

    const filtered = requests.filter(r =>
        (!filterType || r.type === filterType) &&
        (!filterStatus || r.status === filterStatus)
    )

    const canMarkAnswered = (r) => r.type === 'oracion' && r.status === 'pendiente' && (user?.role === 'admin' || r.member_id === user?.member_id)

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2696D2 0%, #13CD68 100%)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <HandHeart className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Oraciones y Gratitud</h1>
                        <p className="text-white/70 text-sm mt-1">Peticiones de oración y motivos de gratitud de la congregación</p>
                    </div>
                </div>
            </div>

            {notification && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E1F9EC] text-[#111111] animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-[#13CD68]" />
                    <span className="text-sm font-medium">{notification}</span>
                </div>
            )}

            {/* Compose */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setComposeType('oracion')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${composeType === 'oracion' ? 'text-white border-transparent' : 'border-gray-200 text-[#6E6E6E]'
                            }`}
                        style={composeType === 'oracion' ? { background: '#2696D2' } : {}}>
                        <HandHeart className="w-4 h-4" /> Petición de Oración
                    </button>
                    <button onClick={() => setComposeType('gratitud')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${composeType === 'gratitud' ? 'text-white border-transparent' : 'border-gray-200 text-[#6E6E6E]'
                            }`}
                        style={composeType === 'gratitud' ? { background: '#13CD68' } : {}}>
                        <Heart className="w-4 h-4" /> Gratitud
                    </button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Nombre</label>
                    <MemberAutocomplete
                        value={nameInput}
                        onChange={setNameInput}
                        onSelectMember={(member) => setSelectedMemberId(member?.id || null)}
                        placeholder="Busca un miembro o escribe un nombre..."
                    />
                    {!skipMemberLink && (
                        <p className="text-xs text-[#13CD68] mt-1">
                            {selectedMemberId
                                ? '✓ Se guardará también como nota en su ficha de miembro'
                                : '✓ Si no existe todavía, se creará un miembro nuevo (Visitante) para vincular la petición'}
                        </p>
                    )}
                    <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
                        <input type="checkbox" checked={skipMemberLink} onChange={(e) => setSkipMemberLink(e.target.checked)}
                            className="w-4 h-4 accent-[#6E6E6E] cursor-pointer" />
                        <span className="text-xs text-[#6E6E6E]">No vincular a ningún miembro (queda solo como texto)</span>
                    </label>
                </div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3}
                    placeholder={composeType === 'oracion' ? 'Comparte tu petición de oración...' : 'Comparte algo por lo que estás agradecido...'}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm resize-none" />
                <div className="flex items-center justify-between">
                    <p className="text-xs text-[#6E6E6E]">
                        {activeService ? `Se vinculará al servicio de hoy — ${activeService.name}` : 'No hay un servicio activo en este momento'}
                    </p>
                    <button onClick={handleSubmit} disabled={!content.trim() || !nameInput.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: composeType === 'oracion' ? 'linear-gradient(135deg, #2696D2, #1D74A8)' : 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                        <Send className="w-4 h-4" /> Enviar
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm font-medium text-[#6E6E6E] flex items-center gap-1"><Filter className="w-4 h-4" /> Filtrar:</span>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:border-[#2696D2] cursor-pointer">
                    <option value="">Todos los tipos</option>
                    <option value="oracion">Oración</option>
                    <option value="gratitud">Gratitud</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:border-[#2696D2] cursor-pointer">
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="contestada">Contestada</option>
                </select>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                        <Sparkles className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                        <p className="text-lg font-medium text-[#6E6E6E]">No hay registros que coincidan</p>
                    </div>
                ) : (
                    filtered.map(r => {
                        const isOracion = r.type === 'oracion'
                        const color = isOracion ? '#2696D2' : '#13CD68'
                        const bg = isOracion ? '#E8F4FC' : '#E1F9EC'
                        const linkedGratitude = isOracion && r.status === 'contestada' ? getGratitudeForPrayer(r.id) : null
                        return (
                            <div key={r.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-5">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ background: color }}>
                                            {r.author_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#111111]">{r.author_name}</p>
                                            <span className="text-xs text-[#6E6E6E] flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {formatDate(r.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0" style={{ background: bg, color }}>
                                        {isOracion ? <HandHeart className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                                        {isOracion ? 'Oración' : 'Gratitud'}
                                    </span>
                                </div>
                                <p className="text-sm text-[#1F1F1F] leading-relaxed mb-3">{r.content}</p>
                                <div className="flex items-center justify-between">
                                    {isOracion && (
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.status === 'contestada' ? 'bg-[#E1F9EC] text-[#13CD68]' : 'bg-[#FFF3CD] text-[#E8A838]'}`}>
                                            {r.status === 'contestada' ? '✓ Oración Contestada' : 'Pendiente'}
                                        </span>
                                    )}
                                    {canMarkAnswered(r) && (
                                        <button onClick={() => openAnswerModal(r)}
                                            className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:shadow-md cursor-pointer"
                                            style={{ background: '#13CD68' }}>
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Contestada
                                        </button>
                                    )}
                                </div>
                                {linkedGratitude && (
                                    <div className="mt-3 pt-3 border-t border-dashed border-gray-100 flex items-start gap-2">
                                        <Heart className="w-4 h-4 text-[#13CD68] flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-[#13CD68] italic">"{linkedGratitude.content}"</p>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Answer + Gratitude Modal */}
            <Modal isOpen={!!answeringPrayer} onClose={() => setAnsweringPrayer(null)} title="¡Oración Contestada! 🙏">
                <div className="space-y-4">
                    <p className="text-sm text-[#6E6E6E]">
                        Qué alegría saber que Dios respondió esta petición. ¿Quieres compartir una palabra de gratitud junto con esto?
                    </p>
                    <div className="bg-[#E8F4FC] rounded-xl p-3 text-sm text-[#111111] italic">
                        "{answeringPrayer?.content}"
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Tu gratitud (opcional)</label>
                        <textarea value={gratitudeText} onChange={(e) => setGratitudeText(e.target.value)} rows={3}
                            placeholder="Ej: Gracias Dios por sanar a mi madre, hoy está mucho mejor..."
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#13CD68] text-sm resize-none" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => handleConfirmAnswered(false)}
                        className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">
                        Marcar sin Gratitud
                    </button>
                    <button onClick={() => handleConfirmAnswered(true)} disabled={!gratitudeText.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                        <Heart className="w-4 h-4" /> Marcar y Dar Gracias
                    </button>
                </div>
            </Modal>
        </div>
    )
}
