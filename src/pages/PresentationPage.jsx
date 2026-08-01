import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActiveService, getPrayerRequestsByService, getNewVisitorsForActiveService } from '../data/mockData.js'
import { X, ArrowLeft, ArrowRight, HandHeart, Heart, PartyPopper } from 'lucide-react'
import logo from '../assets/logo.png'

export default function PresentationPage() {
    const navigate = useNavigate()
    const [activeService, setActiveService] = useState(undefined) // undefined = cargando, null = sin servicio
    const [slides, setSlides] = useState([])
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const service = getActiveService()
        setActiveService(service || null)
        if (!service) return

        const visitorSlides = getNewVisitorsForActiveService().map(member => ({ kind: 'welcome', member }))
        const prayerSlides = getPrayerRequestsByService(service.id).map(request => ({ kind: 'prayer', request }))
        setSlides([...visitorSlides, ...prayerSlides])
    }, [])

    const goNext = useCallback(() => setIndex(i => Math.min(i + 1, slides.length - 1)), [slides.length])
    const goPrev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), [])
    const exitPresentation = useCallback(() => navigate(-1), [navigate])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') goNext()
            if (e.key === 'ArrowLeft') goPrev()
            if (e.key === 'Escape') exitPresentation()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goNext, goPrev, exitPresentation])

    if (activeService === undefined) return null

    if (!activeService) {
        return (
            <EmptyState onExit={exitPresentation}>
                No hay un servicio activo en este momento. Activa un servicio desde Servicios para poder presentar.
            </EmptyState>
        )
    }

    if (slides.length === 0) {
        return (
            <EmptyState onExit={exitPresentation}>
                Todavía no hay visitantes nuevos ni peticiones de oración/gratitud registradas para el servicio de hoy.
            </EmptyState>
        )
    }

    const slide = slides[index]

    return (
        <div className="min-h-screen flex flex-col select-none"
            style={{ background: 'linear-gradient(135deg, #010101 0%, #111111 55%, #2696D2 100%)' }}>
            {/* Barra superior */}
            <div className="flex items-center justify-between p-6">
                <button onClick={exitPresentation}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                    <X className="w-5 h-5" /> Salir
                </button>
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Refugio App" className="w-6 h-6 object-contain opacity-60" />
                    <span className="text-white/40 text-sm">{index + 1} / {slides.length}</span>
                </div>
            </div>

            {/* Diapositiva */}
            <div className="flex-1 flex items-center justify-center px-8">
                {slide.kind === 'welcome' ? (
                    <div key={index} className="text-center animate-fade-in">
                        <PartyPopper className="w-20 h-20 text-[#E8A838] mx-auto mb-8" />
                        <p className="text-white/70 text-2xl md:text-3xl mb-4">Te damos la bienvenida</p>
                        <h1 className="text-white font-bold text-5xl md:text-7xl leading-tight break-words max-w-4xl">
                            {slide.member.full_name}
                        </h1>
                    </div>
                ) : (
                    <div key={index} className="text-center max-w-4xl animate-fade-in">
                        {slide.request.type === 'oracion' ? (
                            <HandHeart className="w-16 h-16 text-[#5CB0E0] mx-auto mb-6" />
                        ) : (
                            <Heart className="w-16 h-16 text-[#4FE08E] mx-auto mb-6" />
                        )}
                        <p className="text-white/60 text-lg md:text-xl mb-6 uppercase tracking-wider font-semibold">
                            {slide.request.type === 'oracion' ? 'Petición de Oración' : 'Gratitud'}
                        </p>
                        <p className="text-white text-2xl md:text-4xl font-medium leading-relaxed">
                            "{slide.request.content}"
                        </p>
                        <p className="text-white/50 text-lg md:text-xl mt-8">
                            — {slide.request.author_name || 'Anónimo'}
                        </p>
                    </div>
                )}
            </div>

            {/* Controles de avance */}
            <div className="flex items-center justify-center gap-6 p-8">
                <button onClick={goPrev} disabled={index === 0}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <button onClick={goNext} disabled={index === slides.length - 1}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    )
}

function EmptyState({ onExit, children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-8"
            style={{ background: 'linear-gradient(135deg, #010101 0%, #111111 55%, #2696D2 100%)' }}>
            <p className="text-white/70 text-lg max-w-md mb-8">{children}</p>
            <button onClick={onExit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                <X className="w-4 h-4" /> Volver
            </button>
        </div>
    )
}
