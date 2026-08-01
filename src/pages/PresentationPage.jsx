import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActiveService, getPrayerRequestsByService, getNewVisitorsForActiveService } from '../data/mockData.js'
import { X, ArrowLeft, ArrowRight, HandHeart, Heart, PartyPopper, Maximize2, Minimize2 } from 'lucide-react'
import logo from '../assets/logo.png'

const CATEGORY_META = {
    bienvenida: { label: 'Bienvenida', icon: PartyPopper, color: '#E8A838' },
    oracion: { label: 'Oración', icon: HandHeart, color: '#2696D2' },
    gratitud: { label: 'Agradecimientos', icon: Heart, color: '#13CD68' },
}

export default function PresentationPage() {
    const navigate = useNavigate()
    const containerRef = useRef(null)
    const [activeService, setActiveService] = useState(undefined) // undefined = cargando, null = sin servicio
    const [visitors, setVisitors] = useState([])
    const [prayerRequests, setPrayerRequests] = useState([])
    const [category, setCategory] = useState(null) // null = mostrando las 3 miniaturas
    const [index, setIndex] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        const service = getActiveService()
        setActiveService(service || null)
        if (!service) return
        setVisitors(getNewVisitorsForActiveService())
        setPrayerRequests(getPrayerRequestsByService(service.id))
    }, [])

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const oracionItems = prayerRequests.filter(r => r.type === 'oracion')
    const gratitudItems = prayerRequests.filter(r => r.type === 'gratitud')

    const categories = [
        { id: 'bienvenida', count: visitors.length },
        { id: 'oracion', count: oracionItems.length },
        { id: 'gratitud', count: gratitudItems.length },
    ]

    const slides = category === 'bienvenida'
        ? visitors.map(member => ({ kind: 'welcome', member }))
        : category === 'oracion'
            ? oracionItems.map(request => ({ kind: 'prayer', request }))
            : category === 'gratitud'
                ? gratitudItems.map(request => ({ kind: 'prayer', request }))
                : []

    const goNext = useCallback(() => setIndex(i => Math.min(i + 1, slides.length - 1)), [slides.length])
    const goPrev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), [])

    const selectCategory = (id) => { setCategory(id); setIndex(0) }

    const exitFullscreenIfNeeded = () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }

    const backToCategories = useCallback(() => {
        exitFullscreenIfNeeded()
        setCategory(null)
    }, [])

    const exitPresentation = useCallback(() => {
        exitFullscreenIfNeeded()
        navigate(-1)
    }, [navigate])

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {})
        } else {
            containerRef.current?.requestFullscreen?.().catch(() => {})
        }
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!category) return
            if (e.key === 'ArrowRight' || e.key === ' ') goNext()
            if (e.key === 'ArrowLeft') goPrev()
            if (e.key === 'Escape' && !document.fullscreenElement) backToCategories()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [category, goNext, goPrev, backToCategories])

    if (activeService === undefined) return null

    if (!activeService) {
        return (
            <EmptyState onExit={() => navigate(-1)}>
                No hay un servicio activo en este momento. Activa un servicio desde Servicios para poder presentar.
            </EmptyState>
        )
    }

    return (
        <div ref={containerRef} className="min-h-screen select-none"
            style={{ background: 'linear-gradient(135deg, #010101 0%, #111111 55%, #2696D2 100%)' }}>
            {!category ? (
                <CategoryPicker categories={categories} onSelect={selectCategory} onExit={() => navigate(-1)} />
            ) : (
                <Slideshow
                    category={category}
                    slides={slides}
                    index={index}
                    onNext={goNext}
                    onPrev={goPrev}
                    onBack={backToCategories}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                />
            )}
        </div>
    )
}

function CategoryPicker({ categories, onSelect, onExit }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12 relative">
            <button onClick={onExit}
                className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                <X className="w-5 h-5" /> Salir
            </button>
            <div className="flex items-center gap-2 mb-2">
                <img src={logo} alt="Refugio App" className="w-6 h-6 object-contain opacity-70" />
                <h1 className="text-white text-2xl font-bold">Presentación en vivo</h1>
            </div>
            <p className="text-white/50 mb-10 text-sm">Elige qué mostrar en pantalla</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
                {categories.map(({ id, count }) => {
                    const meta = CATEGORY_META[id]
                    return (
                        <button key={id} onClick={() => onSelect(id)}
                            className="group rounded-2xl overflow-hidden aspect-[4/3] flex flex-col items-center justify-center gap-3 border-2 border-white/10 hover:border-white/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer p-6"
                            style={{ background: 'linear-gradient(135deg, #161616, #010101)' }}>
                            <meta.icon className="w-10 h-10 transition-transform group-hover:scale-110" style={{ color: meta.color }} />
                            <span className="text-white font-semibold text-lg">{meta.label}</span>
                            <span className="text-white/40 text-sm">{count} {count === 1 ? 'elemento' : 'elementos'}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function Slideshow({ category, slides, index, onNext, onPrev, onBack, isFullscreen, onToggleFullscreen }) {
    const meta = CATEGORY_META[category]

    return (
        <div className="min-h-screen flex flex-col">
            {/* Barra superior */}
            <div className="flex items-center justify-between p-6">
                <button onClick={onBack}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                    <ArrowLeft className="w-5 h-5" /> Volver
                </button>
                <div className="flex items-center gap-4">
                    {slides.length > 0 && <span className="text-white/40 text-sm">{index + 1} / {slides.length}</span>}
                    <button onClick={onToggleFullscreen}
                        className="text-white/60 hover:text-white transition-colors cursor-pointer" aria-label="Pantalla completa">
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {slides.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-8 text-center">
                    <p className="text-white/60 text-lg max-w-md">
                        Todavía no hay {meta.label.toLowerCase()} registradas para el servicio de hoy.
                    </p>
                </div>
            ) : (
                <>
                    {/* Diapositiva */}
                    <div className="flex-1 flex items-center justify-center px-8">
                        {slides[index].kind === 'welcome' ? (
                            <div key={index} className="text-center animate-fade-in">
                                <PartyPopper className="w-20 h-20 text-[#E8A838] mx-auto mb-8" />
                                <p className="text-white/70 text-2xl md:text-3xl mb-4">Te damos la bienvenida</p>
                                <h1 className="text-white font-bold text-5xl md:text-7xl leading-tight break-words max-w-4xl">
                                    {slides[index].member.full_name}
                                </h1>
                            </div>
                        ) : (
                            <div key={index} className="text-center max-w-4xl animate-fade-in">
                                {slides[index].request.type === 'oracion' ? (
                                    <HandHeart className="w-16 h-16 text-[#5CB0E0] mx-auto mb-6" />
                                ) : (
                                    <Heart className="w-16 h-16 text-[#4FE08E] mx-auto mb-6" />
                                )}
                                <p className="text-white/60 text-lg md:text-xl mb-6 uppercase tracking-wider font-semibold">
                                    {slides[index].request.type === 'oracion' ? 'Petición de Oración' : 'Gratitud'}
                                </p>
                                <p className="text-white text-2xl md:text-4xl font-medium leading-relaxed">
                                    "{slides[index].request.content}"
                                </p>
                                <p className="text-white/50 text-lg md:text-xl mt-8">
                                    — {slides[index].request.author_name || 'Anónimo'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Controles de avance */}
                    <div className="flex items-center justify-center gap-6 p-8">
                        <button onClick={onPrev} disabled={index === 0}
                            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <button onClick={onNext} disabled={index === slides.length - 1}
                            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </>
            )}
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
