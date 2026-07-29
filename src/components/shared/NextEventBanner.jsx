import { getEvents } from '../../data/mockData.js'
import { PartyPopper, MapPin, Calendar } from 'lucide-react'

function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function NextEventBanner() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const next = getEvents().find(e => new Date(e.start_date) >= today)

    if (!next) return null

    return (
        <div className="rounded-2xl p-5 text-white relative overflow-hidden flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #E8A838, #D4881F)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(20%, -20%)' }}></div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 relative">
                <PartyPopper className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 relative">
                <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Próximo evento</p>
                <p className="text-lg font-bold truncate">{next.name}</p>
                <p className="text-sm text-white/80 flex items-center gap-1.5 flex-wrap capitalize">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" /> {formatDate(next.start_date)}
                    {next.location && (
                        <span className="flex items-center gap-1.5 normal-case">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 ml-1" /> {next.location}
                        </span>
                    )}
                </p>
            </div>
        </div>
    )
}
