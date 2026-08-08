import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    getActiveService, getServices, getPrayerRequestsByService, getNewVisitorsForService,
    subscribeAnnouncements, getAnnouncements, isAnnouncementsLoaded, createAnnouncement, deleteAnnouncement,
} from '../data/mockData.js'
import { storage } from '../firebase.js'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import {
    X, ArrowLeft, ArrowRight, HandHeart, Heart, PartyPopper, Maximize2, Minimize2, RefreshCw,
    Megaphone, Settings, Trash2, Upload, Image as ImageIcon, Video as VideoIcon, Plus,
} from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import logo from '../assets/logo.png'

const CATEGORY_META = {
    bienvenida: { label: 'Bienvenida', icon: PartyPopper, color: '#E8A838' },
    oracion: { label: 'Oración', icon: HandHeart, color: '#2696D2' },
    gratitud: { label: 'Agradecimientos', icon: Heart, color: '#13CD68' },
    anuncios: { label: 'Anuncios', icon: Megaphone, color: '#9B59B6' },
}

// Orden en el que se recorren las secciones dentro de la presentación (con
// las flechas arriba/abajo o los botones de la barra superior), sin salir
// de pantalla completa. Cambiar este orden es lo único que hay que tocar
// si más adelante se quiere otro orden.
const CATEGORY_ORDER = ['bienvenida', 'gratitud', 'oracion', 'anuncios']

export default function PresentationPage() {
    const navigate = useNavigate()
    const containerRef = useRef(null)
    const [services, setServices] = useState(undefined) // undefined = cargando
    const [selectedServiceId, setSelectedServiceId] = useState(null)
    const [visitors, setVisitors] = useState([])
    const [prayerRequests, setPrayerRequests] = useState([])
    const [category, setCategory] = useState(null) // null = mostrando las miniaturas
    const [index, setIndex] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [announcements, setAnnouncements] = useState([])
    const [showManageAnnouncements, setShowManageAnnouncements] = useState(false)

    useEffect(() => {
        const refreshAnnouncements = () => setAnnouncements(getAnnouncements())
        const unsubscribe = subscribeAnnouncements(refreshAnnouncements)
        refreshAnnouncements()
        return unsubscribe
    }, [])

    // La detección automática (jueves/domingo según el día) puede fallar si un
    // servicio no tiene guardado su tipo, o si hay más de uno activo a la vez
    // — así que el servicio siempre queda elegible a mano, con el detectado
    // automáticamente (o si no, el más reciente) solo como sugerencia inicial.
    useEffect(() => {
        const allServices = [...getServices()].sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
        setServices(allServices)
        const suggested = getActiveService() || allServices[0]
        setSelectedServiceId(suggested?.id || null)
    }, [])

    const refreshAll = useCallback(() => {
        setServices([...getServices()].sort((a, b) => new Date(b.service_date) - new Date(a.service_date)))
        if (!selectedServiceId) return
        setVisitors(getNewVisitorsForService(selectedServiceId))
        setPrayerRequests(getPrayerRequestsByService(selectedServiceId))
    }, [selectedServiceId])

    useEffect(() => {
        // Vincula la presentación en vivo con lo que se va registrando en el
        // servicio elegido: si alguien envía una petición o se registra un
        // visitante nuevo mientras la presentación está proyectada, aparece
        // sin necesidad de recargar (mismo polling básico que el Chat).
        if (!selectedServiceId) return
        refreshAll()
        const intervalId = setInterval(refreshAll, 3000)
        return () => clearInterval(intervalId)
    }, [selectedServiceId, refreshAll])

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Orden cronológico (más antiguo primero): así, si llega una petición
    // nueva mientras se está presentando, se agrega al final de la lista en
    // vez de correr la diapositiva que la persona está mostrando en ese momento.
    const byCreatedAtAsc = (a, b) => new Date(a.created_at) - new Date(b.created_at)
    const sortedVisitors = [...visitors].sort(byCreatedAtAsc)
    const oracionItems = prayerRequests.filter(r => r.type === 'oracion').sort(byCreatedAtAsc)
    const gratitudItems = prayerRequests.filter(r => r.type === 'gratitud').sort(byCreatedAtAsc)

    const categories = [
        { id: 'bienvenida', count: sortedVisitors.length },
        { id: 'oracion', count: oracionItems.length },
        { id: 'gratitud', count: gratitudItems.length },
        { id: 'anuncios', count: announcements.length },
    ]

    const slides = category === 'bienvenida'
        ? sortedVisitors.map(member => ({ kind: 'welcome', member }))
        : category === 'oracion'
            ? oracionItems.map(request => ({ kind: 'prayer', request }))
            : category === 'gratitud'
                ? gratitudItems.map(request => ({ kind: 'prayer', request }))
                : category === 'anuncios'
                    ? announcements.map(announcement => ({ kind: 'announcement', announcement }))
                    : []

    const goNext = useCallback(() => setIndex(i => Math.min(i + 1, slides.length - 1)), [slides.length])
    const goPrev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), [])

    const selectCategory = (id) => { setCategory(id); setIndex(0) }

    // Cambia de sección (Bienvenida/Agradecimientos/Oración/Anuncios) sin
    // tocar el estado de pantalla completa, así el operador puede recorrer
    // todo el culto sin salir del proyector.
    const switchCategory = useCallback((direction) => {
        setCategory(current => {
            const pos = CATEGORY_ORDER.indexOf(current)
            const nextPos = (pos + direction + CATEGORY_ORDER.length) % CATEGORY_ORDER.length
            return CATEGORY_ORDER[nextPos]
        })
        setIndex(0)
    }, [])

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
            if (e.key === 'ArrowDown') switchCategory(1)
            if (e.key === 'ArrowUp') switchCategory(-1)
            if (e.key === 'Escape' && !document.fullscreenElement) backToCategories()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [category, goNext, goPrev, backToCategories, switchCategory])

    if (services === undefined) return null

    if (services.length === 0) {
        return (
            <EmptyState onExit={() => navigate(-1)}>
                Todavía no hay servicios creados. Crea uno desde Servicios para poder presentar.
            </EmptyState>
        )
    }

    return (
        <div ref={containerRef} className="min-h-screen select-none"
            style={{ background: 'linear-gradient(135deg, #010101 0%, #111111 55%, #2696D2 100%)' }}>
            {!category ? (
                <CategoryPicker categories={categories} onSelect={selectCategory} onExit={() => navigate(-1)}
                    services={services} selectedServiceId={selectedServiceId} onSelectService={setSelectedServiceId}
                    onRefresh={refreshAll} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen}
                    onManageAnnouncements={() => setShowManageAnnouncements(true)} />
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
                    onSwitchCategory={switchCategory}
                />
            )}
            <ManageAnnouncementsModal
                isOpen={showManageAnnouncements}
                onClose={() => setShowManageAnnouncements(false)}
                announcements={announcements}
            />
        </div>
    )
}

function CategoryPicker({ categories, onSelect, onExit, services, selectedServiceId, onSelectService, onRefresh, isFullscreen, onToggleFullscreen, onManageAnnouncements }) {
    const formatServiceOption = (service) => {
        const [year, month, day] = service.service_date.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        const dateLabel = date.toLocaleDateString('es', { day: 'numeric', month: 'long' })
        const activeTag = service.is_active ? ' 🟢' : ''
        return `${service.name} · ${dateLabel}${activeTag}`
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12 relative overflow-y-auto">
            <button onClick={onExit}
                style={{ top: 'max(1.5rem, calc(env(safe-area-inset-top) + 0.75rem))' }}
                className="absolute left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                <X className="w-5 h-5" /> Salir
            </button>
            <div className="absolute right-6 flex items-center gap-4"
                style={{ top: 'max(1.5rem, calc(env(safe-area-inset-top) + 0.75rem))' }}>
                <button onClick={onRefresh}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                    <RefreshCw className="w-4 h-4" /> Actualizar
                </button>
                <button onClick={onToggleFullscreen} title="Pantalla completa (para el proyector)"
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer text-sm font-medium">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    Pantalla completa
                </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
                <img src={logo} alt="Refugio App" className="w-6 h-6 object-contain opacity-70" />
                <h1 className="text-white text-2xl font-bold">Presentación en vivo</h1>
            </div>
            <p className="text-white/50 mb-4 text-sm">Elige qué mostrar en pantalla</p>

            <select
                value={selectedServiceId || ''}
                onChange={(e) => onSelectService(e.target.value)}
                className="mb-10 px-4 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 text-white text-sm cursor-pointer focus:outline-none focus:border-white/30 max-w-full"
            >
                {services.map(s => (
                    <option key={s.id} value={s.id} className="text-[#111111]">{formatServiceOption(s)}</option>
                ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
                {categories.map(({ id, count }) => {
                    const meta = CATEGORY_META[id]
                    return (
                        <div key={id} className="relative">
                            <button onClick={() => onSelect(id)}
                                className="group w-full rounded-2xl overflow-hidden aspect-[4/3] flex flex-col items-center justify-center gap-3 border-2 border-white/10 hover:border-white/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer p-6"
                                style={{ background: 'linear-gradient(135deg, #161616, #010101)' }}>
                                <meta.icon className="w-10 h-10 transition-transform group-hover:scale-110" style={{ color: meta.color }} />
                                <span className="text-white font-semibold text-lg">{meta.label}</span>
                                <span className="text-white/40 text-sm">{count} {count === 1 ? 'elemento' : 'elementos'}</span>
                            </button>
                            {id === 'anuncios' && (
                                <button onClick={onManageAnnouncements} title="Gestionar anuncios"
                                    className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer">
                                    <Settings className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function Slideshow({ category, slides, index, onNext, onPrev, onBack, isFullscreen, onToggleFullscreen, onSwitchCategory }) {
    const meta = CATEGORY_META[category]

    return (
        <div className="min-h-screen flex flex-col">
            {/* Barra superior */}
            <div className="flex items-center justify-between px-6 pb-4 gap-4 flex-wrap"
                style={{ paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top) + 0.75rem))' }}>
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

            {/* Cambiar de sección sin salir de pantalla completa */}
            <div className="flex items-center justify-center gap-2 px-6 pb-6">
                {CATEGORY_ORDER.map(id => {
                    const itemMeta = CATEGORY_META[id]
                    const isCurrent = id === category
                    return (
                        <button key={id} onClick={() => onSwitchCategory(CATEGORY_ORDER.indexOf(id) - CATEGORY_ORDER.indexOf(category))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${isCurrent ? 'text-white' : 'text-white/40 hover:text-white/70 bg-white/5'
                                }`}
                            style={isCurrent ? { background: itemMeta.color } : {}}>
                            <itemMeta.icon className="w-3.5 h-3.5" />
                            {itemMeta.label}
                        </button>
                    )
                })}
            </div>

            {slides.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-8 text-center">
                    <p className="text-white/60 text-lg max-w-md">
                        {category === 'anuncios'
                            ? 'Todavía no hay anuncios creados. Usa el ícono de engranaje para agregar uno.'
                            : `Todavía no hay ${meta.label.toLowerCase()} registradas para este servicio.`}
                    </p>
                </div>
            ) : (
                <>
                    {/* Diapositiva */}
                    {slides[index].kind === 'announcement' ? (
                        /* Anuncio: foto/video de fondo a pantalla completa con el título encima */
                        <div key={index} className="flex-1 relative overflow-hidden animate-fade-in">
                            {slides[index].announcement.background_type === 'video' && slides[index].announcement.background_url ? (
                                <video key={slides[index].announcement.id} src={slides[index].announcement.background_url}
                                    autoPlay loop muted playsInline
                                    className="absolute inset-0 w-full h-full object-cover" />
                            ) : slides[index].announcement.background_type === 'image' && slides[index].announcement.background_url ? (
                                <div className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${slides[index].announcement.background_url})` }} />
                            ) : (
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #161616, #010101)' }} />
                            )}
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.4) 100%)' }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-end text-center px-8 pb-20">
                                <Megaphone className="w-14 h-14 mb-6" style={{ color: '#9B59B6' }} />
                                <h1 className="text-white font-bold text-5xl md:text-7xl leading-tight break-words max-w-4xl drop-shadow-lg">
                                    {slides[index].announcement.title}
                                </h1>
                                {slides[index].announcement.subtitle && (
                                    <p className="text-white/90 text-2xl md:text-3xl mt-4 drop-shadow-lg">
                                        {slides[index].announcement.subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
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
                    )}

                    {/* Controles de avance */}
                    <div className="flex items-center justify-center gap-6 px-8 pt-8"
                        style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}>
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

function ManageAnnouncementsModal({ isOpen, onClose, announcements }) {
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState('')

    const resetForm = () => {
        setTitle('')
        setSubtitle('')
        setFile(null)
        setProgress(0)
        setError('')
    }

    const handleAdd = () => {
        setError('')
        if (!title.trim()) {
            setError('El título es obligatorio')
            return
        }
        if (!file) {
            createAnnouncement({ title: title.trim(), subtitle: subtitle.trim() })
            resetForm()
            return
        }
        const isVideo = file.type.startsWith('video/')
        const isImage = file.type.startsWith('image/')
        if (!isVideo && !isImage) {
            setError('El archivo debe ser una foto o un video')
            return
        }
        const path = `announcements/${Date.now()}-${file.name}`
        const task = uploadBytesResumable(storageRef(storage, path), file)
        setUploading(true)
        task.on('state_changed',
            (snapshot) => setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
            (err) => {
                console.error('No se pudo subir el archivo', err)
                setError('No se pudo subir el archivo. Intenta de nuevo.')
                setUploading(false)
            },
            async () => {
                const url = await getDownloadURL(task.snapshot.ref)
                createAnnouncement({
                    title: title.trim(), subtitle: subtitle.trim(),
                    background_type: isVideo ? 'video' : 'image',
                    background_url: url, background_path: path,
                })
                setUploading(false)
                resetForm()
            }
        )
    }

    const handleDelete = (announcement) => {
        if (announcement.background_path) {
            deleteObject(storageRef(storage, announcement.background_path)).catch(() => {})
        }
        deleteAnnouncement(announcement.id)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Anuncios" size="lg">
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-[#111111] mb-3">Anuncios Actuales</h3>
                    {announcements.length === 0 ? (
                        <p className="text-sm text-[#6E6E6E]">No hay anuncios todavía.</p>
                    ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                            {announcements.map(a => (
                                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-gray-50">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {a.background_type === 'video' ? (
                                            <VideoIcon className="w-4 h-4 text-[#9B59B6] flex-shrink-0" />
                                        ) : a.background_type === 'image' ? (
                                            <ImageIcon className="w-4 h-4 text-[#9B59B6] flex-shrink-0" />
                                        ) : (
                                            <Megaphone className="w-4 h-4 text-[#9B59B6] flex-shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-[#111111] truncate">{a.title}</p>
                                            {a.subtitle && <p className="text-xs text-[#6E6E6E] truncate">{a.subtitle}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(a)} title="Eliminar anuncio"
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0">
                                        <Trash2 className="w-4 h-4 text-[#E74C3C]" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-[#111111] mb-3">Agregar Nuevo Anuncio</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Título *</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Servicio del Jueves"
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#9B59B6] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Subtítulo (opcional)</label>
                            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                                placeholder="Ej: 20:00 hrs"
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#9B59B6] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5">Foto o Video de Fondo (opcional)</label>
                            <input type="file" accept="image/*,video/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full text-sm text-[#6E6E6E] file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-[#F3E8FB] file:text-[#9B59B6] cursor-pointer" />
                        </div>
                        {uploading && (
                            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full bg-[#9B59B6] transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        )}
                        {error && <div className="bg-[#FADBD8] text-[#E74C3C] text-sm px-4 py-3 rounded-xl">{error}</div>}
                        <button onClick={handleAdd} disabled={uploading || !title.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            style={{ background: 'linear-gradient(135deg, #9B59B6, #6E3A8C)' }}>
                            {uploading ? <Upload className="w-4 h-4 animate-pulse" /> : <Plus className="w-4 h-4" />}
                            {uploading ? `Subiendo... ${progress}%` : 'Agregar Anuncio'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
