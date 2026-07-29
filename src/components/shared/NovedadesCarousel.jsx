import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getMemberById, getNoticesForMember, getEvents } from '../../data/mockData.js'
import { Megaphone, PartyPopper, ChevronLeft, ChevronRight } from 'lucide-react'

function formatDate(dateStr) {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es', { day: 'numeric', month: 'long' })
}

export default function NovedadesCarousel() {
    const { user } = useAuth()
    const [index, setIndex] = useState(0)

    const slides = useMemo(() => {
        const member = user?.member_id ? getMemberById(user.member_id) : null
        const notices = getNoticesForMember(member, 6).map(n => ({
            id: `notice-${n.id}`,
            type: 'notice',
            title: n.title,
            content: n.content,
            meta: n.author_name,
        }))

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const events = getEvents()
            .filter(e => new Date(e.start_date) >= today)
            .slice(0, 4)
            .map(e => ({
                id: `event-${e.id}`,
                type: 'event',
                title: e.name,
                content: e.location ? `📍 ${e.location}` : '',
                meta: formatDate(e.start_date),
            }))

        return [...notices, ...events]
    }, [user?.member_id])

    useEffect(() => { setIndex(0) }, [slides.length])

    useEffect(() => {
        if (slides.length < 2) return
        const interval = setInterval(() => setIndex(i => (i + 1) % slides.length), 6000)
        return () => clearInterval(interval)
    }, [slides.length])

    if (slides.length === 0) return null

    const current = slides[Math.min(index, slides.length - 1)]
    const isEvent = current.type === 'event'

    return (
        <div className="rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(38,150,210,0.08)] relative"
            style={{ background: isEvent ? 'linear-gradient(135deg, #111111, #D4881F)' : 'linear-gradient(135deg, #111111, #2696D2)' }}>
            <div className="p-6 text-white min-h-[140px] flex flex-col justify-between">
                <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 mb-2">
                        {isEvent ? <PartyPopper className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
                        {isEvent ? 'Evento' : 'Aviso'}
                    </span>
                    <h3 className="text-lg font-bold leading-snug">{current.title}</h3>
                    {current.content && <p className="text-sm text-white/80 mt-1 line-clamp-2">{current.content}</p>}
                </div>
                {current.meta && <p className="text-xs text-white/60 mt-3 capitalize">{current.meta}</p>}
            </div>

            {slides.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pb-4">
                    {slides.map((s, i) => (
                        <button key={s.id} onClick={() => setIndex(i)}
                            aria-label={`Ir a la novedad ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
                    ))}
                </div>
            )}

            {slides.length > 1 && (
                <>
                    <button onClick={() => setIndex(i => (i - 1 + slides.length) % slides.length)}
                        aria-label="Anterior"
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIndex(i => (i + 1) % slides.length)}
                        aria-label="Siguiente"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}
        </div>
    )
}
