import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, setPendingChurchCreation } from '../context/AuthContext.jsx'
import { auth, functions, storage } from '../firebase.js'
import { httpsCallable } from 'firebase/functions'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import {
    Church, Plus, Trash2, ArrowRight, ArrowLeft, Image as ImageIcon,
    Loader2, CheckCircle2, MapPin,
} from 'lucide-react'

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
// El value es el nombre real del ícono de lucide-react (así lo resuelve
// Sidebar.jsx vía ICONS_MAP) — solo la etiqueta que ve la persona se traduce.
const ICON_OPTIONS = [
    { value: 'Users', label: 'Personas' },
    { value: 'BookOpen', label: 'Libro' },
    { value: 'Sprout', label: 'Planta' },
    { value: 'UserCircle', label: 'Perfil' },
    { value: 'Music', label: 'Música' },
    { value: 'Home', label: 'Casa' },
    { value: 'HandHeart', label: 'Servicio' },
    { value: 'Baby', label: 'Niños' },
]

function slugifyId(name) {
    return (name || '')
        .toLowerCase()
        .normalize('NFD').split('').filter(ch => { const c = ch.codePointAt(0); return !(c >= 0x0300 && c <= 0x036f) }).join('')
        .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') || `item-${Date.now()}`
}

export default function CreateChurchPage() {
    const { register, completeChurchCreation } = useAuth()
    const navigate = useNavigate()

    const [step, setStep] = useState(1)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)

    // Paso 1: iglesia
    const [name, setName] = useState('')
    const [tagline, setTagline] = useState('')
    const [primaryColor, setPrimaryColor] = useState('#2696D2')
    const [timezone, setTimezone] = useState('America/Santiago')
    const [lat, setLat] = useState('')
    const [lng, setLng] = useState('')
    const [radiusM, setRadiusM] = useState('100')
    const [logoFile, setLogoFile] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const [locating, setLocating] = useState(false)

    // Paso 2: horarios de culto
    const [schedule, setSchedule] = useState([
        { id: 'culto-1', name: 'Culto Principal', weekday: 0, starts_at: '10:00', ends_at: '12:00' },
    ])

    // Paso 3: ministerios
    const [ministries, setMinistries] = useState([
        { id: 'ministerio-1', name: '', icon: 'Users' },
    ])

    // Paso 4: cuenta del administrador
    const [adminName, setAdminName] = useState('')
    const [adminEmail, setAdminEmail] = useState('')
    const [adminPassword, setAdminPassword] = useState('')
    const [adminConfirm, setAdminConfirm] = useState('')

    const handleLogoChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setLogoFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setLogoPreview(reader.result)
        reader.readAsDataURL(file)
    }

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) { setError('Tu navegador no soporta ubicación GPS.'); return }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude.toFixed(7))
                setLng(pos.coords.longitude.toFixed(7))
                setLocating(false)
            },
            () => { setError('No se pudo obtener tu ubicación. Ingrésala a mano.'); setLocating(false) }
        )
    }

    const updateScheduleRow = (id, patch) => setSchedule(s => s.map(row => row.id === id ? { ...row, ...patch } : row))
    const addScheduleRow = () => setSchedule(s => [...s, { id: `culto-${Date.now()}`, name: '', weekday: 0, starts_at: '10:00', ends_at: '12:00' }])
    const removeScheduleRow = (id) => setSchedule(s => s.filter(row => row.id !== id))

    const updateMinistryRow = (id, patch) => setMinistries(m => m.map(row => row.id === id ? { ...row, ...patch } : row))
    const addMinistryRow = () => setMinistries(m => [...m, { id: `ministerio-${Date.now()}`, name: '', icon: 'Users' }])
    const removeMinistryRow = (id) => setMinistries(m => m.filter(row => row.id !== id))

    const validateStep = (s) => {
        if (s === 1) {
            if (!name.trim()) return 'Ingresa el nombre de la iglesia.'
        }
        if (s === 2) {
            if (schedule.length === 0 || schedule.some(row => !row.name.trim())) return 'Agrega al menos un horario de culto con nombre.'
        }
        if (s === 3) {
            if (ministries.length === 0 || ministries.some(row => !row.name.trim())) return 'Agrega al menos un ministerio con nombre.'
        }
        return ''
    }

    const goNext = () => {
        const msg = validateStep(step)
        if (msg) { setError(msg); return }
        setError('')
        setStep(s => s + 1)
    }
    const goBack = () => { setError(''); setStep(s => s - 1) }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        if (!adminName.trim() || !adminEmail.trim()) { setError('Completa tu nombre y correo.'); return }
        if (adminPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
        if (adminPassword !== adminConfirm) { setError('Las contraseñas no coinciden.'); return }

        setSubmitting(true)
        setPendingChurchCreation(true)

        const registerResult = await register(adminName.trim(), adminEmail.trim(), adminPassword)
        if (registerResult.error) {
            setPendingChurchCreation(false)
            setSubmitting(false)
            setError(registerResult.error)
            return
        }

        try {
            let logoUrl = null
            if (logoFile && auth.currentUser) {
                const path = `churches/${auth.currentUser.uid}/logo-${Date.now()}-${logoFile.name}`
                const task = uploadBytesResumable(storageRef(storage, path), logoFile)
                await new Promise((resolve, reject) => {
                    task.on('state_changed', null, reject, resolve)
                })
                logoUrl = await getDownloadURL(task.snapshot.ref)
            }

            const callCreateChurch = httpsCallable(functions, 'createChurch')
            await callCreateChurch({
                name: name.trim(),
                tagline: tagline.trim(),
                logoUrl,
                primaryColor,
                timezone,
                location: (lat && lng) ? { lat: Number(lat), lng: Number(lng), radius_m: Number(radiusM) || 100 } : null,
                serviceSchedule: schedule.map(({ id, name: n, weekday, starts_at, ends_at }) => ({ id, name: n.trim(), weekday: Number(weekday), starts_at, ends_at })),
                ministries: ministries.map(({ id, name: n, icon }) => ({ id, name: n.trim(), field: `ministry_${slugifyId(id)}`, icon })),
                adminName: adminName.trim(),
            })

            await completeChurchCreation()
            setDone(true)
        } catch (err) {
            setPendingChurchCreation(false)
            setError(err.message || 'No se pudo crear la iglesia. Inténtalo de nuevo.')
        } finally {
            setSubmitting(false)
        }
    }

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #010101 0%, #111111 40%, #2696D2 100%)' }}>
                <div className="bg-white rounded-3xl shadow-2xl p-10 text-center animate-scale-in max-w-sm w-full">
                    <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-[#13CD68]" />
                    <p className="text-lg font-bold text-[#111111]">¡Tu iglesia ya está creada!</p>
                    <p className="text-sm text-[#6E6E6E] mt-1">Ya puedes empezar a agregar tus servicios y miembros.</p>
                    <button onClick={() => navigate('/admin')}
                        className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        Ir a mi panel <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #010101 0%, #111111 40%, #2696D2 100%)' }}>
            <div className="w-full max-w-2xl">
                <div className="bg-white rounded-3xl shadow-2xl p-8 animate-scale-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                            <Church className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[#111111]">Crea la plataforma de tu iglesia</h1>
                            <p className="text-xs text-[#6E6E6E]">Paso {step} de 4</p>
                        </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="flex gap-1.5 mb-8 mt-4">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="h-1.5 flex-1 rounded-full" style={{ background: n <= step ? '#2696D2' : '#E5E7EB' }} />
                        ))}
                    </div>

                    {error && (
                        <div className="bg-[#FADBD8] text-[#E74C3C] text-sm px-4 py-3 rounded-xl mb-5 animate-fade-in">{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Paso 1: Iglesia */}
                        {step === 1 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Nombre de la iglesia *</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Iglesia Vida Nueva"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Lema o descripción (opcional)</label>
                                    <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ej: Un lugar para crecer en familia"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Color principal</label>
                                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-full h-11 rounded-xl border-2 border-gray-100 cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Logo (opcional)</label>
                                        <label className="flex items-center gap-2 h-11 px-3 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer text-xs text-[#6E6E6E] hover:border-[#2696D2]">
                                            {logoPreview ? <img src={logoPreview} alt="Logo" className="w-6 h-6 object-contain" /> : <ImageIcon className="w-4 h-4" />}
                                            {logoFile ? logoFile.name : 'Subir imagen'}
                                            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center justify-between">
                                        <span>Ubicación para el registro de asistencia por GPS (opcional)</span>
                                        <button type="button" onClick={handleUseMyLocation} disabled={locating}
                                            className="text-xs text-[#2696D2] font-medium hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50">
                                            {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />} Usar mi ubicación
                                        </button>
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitud"
                                            className="px-3 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                        <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitud"
                                            className="px-3 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                        <input type="number" value={radiusM} onChange={(e) => setRadiusM(e.target.value)} placeholder="Radio (m)"
                                            className="px-3 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Paso 2: Horarios */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <p className="text-sm text-[#6E6E6E]">¿Qué días y a qué hora tienen culto?</p>
                                {schedule.map(row => (
                                    <div key={row.id} className="flex items-center gap-2">
                                        <input type="text" value={row.name} onChange={(e) => updateScheduleRow(row.id, { name: e.target.value })}
                                            placeholder="Nombre (ej: Culto Dominical)"
                                            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                        <select value={row.weekday} onChange={(e) => updateScheduleRow(row.id, { weekday: e.target.value })}
                                            className="px-2 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                                            {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                        </select>
                                        <input type="time" value={row.starts_at} onChange={(e) => updateScheduleRow(row.id, { starts_at: e.target.value })}
                                            className="px-2 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                        <input type="time" value={row.ends_at} onChange={(e) => updateScheduleRow(row.id, { ends_at: e.target.value })}
                                            className="px-2 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                        {schedule.length > 1 && (
                                            <button type="button" onClick={() => removeScheduleRow(row.id)} className="p-2 text-[#E74C3C] hover:bg-[#FADBD8] rounded-lg cursor-pointer flex-shrink-0">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addScheduleRow} className="flex items-center gap-1.5 text-sm text-[#2696D2] font-medium hover:underline cursor-pointer">
                                    <Plus className="w-4 h-4" /> Agregar otro horario
                                </button>
                            </div>
                        )}

                        {/* Paso 3: Ministerios */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <p className="text-sm text-[#6E6E6E]">¿Qué ministerios o grupos tiene tu iglesia? (Jóvenes, Damas, Escuela Dominical, etc.)</p>
                                {ministries.map(row => (
                                    <div key={row.id} className="flex items-center gap-2">
                                        <input type="text" value={row.name} onChange={(e) => updateMinistryRow(row.id, { name: e.target.value })}
                                            placeholder="Nombre del ministerio"
                                            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                        <select value={row.icon} onChange={(e) => updateMinistryRow(row.id, { icon: e.target.value })}
                                            className="px-2 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                                            {ICON_OPTIONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                                        </select>
                                        {ministries.length > 1 && (
                                            <button type="button" onClick={() => removeMinistryRow(row.id)} className="p-2 text-[#E74C3C] hover:bg-[#FADBD8] rounded-lg cursor-pointer flex-shrink-0">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addMinistryRow} className="flex items-center gap-1.5 text-sm text-[#2696D2] font-medium hover:underline cursor-pointer">
                                    <Plus className="w-4 h-4" /> Agregar otro ministerio
                                </button>
                            </div>
                        )}

                        {/* Paso 4: Cuenta del administrador */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <p className="text-sm text-[#6E6E6E]">Crea tu cuenta — serás el administrador de {name || 'tu iglesia'}.</p>
                                <div>
                                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Tu nombre completo</label>
                                    <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#111111] mb-1.5">Tu correo electrónico</label>
                                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Contraseña</label>
                                        <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Confirmar</label>
                                        <input type="password" value={adminConfirm} onChange={(e) => setAdminConfirm(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navegación */}
                        <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
                            {step > 1 ? (
                                <button type="button" onClick={goBack}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-[#6E6E6E] hover:bg-gray-50 cursor-pointer">
                                    <ArrowLeft className="w-4 h-4" /> Atrás
                                </button>
                            ) : <Link to="/login" className="text-sm text-[#6E6E6E] hover:underline">Cancelar</Link>}

                            {step < 4 ? (
                                <button type="button" onClick={goNext}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg cursor-pointer"
                                    style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                                    Siguiente <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg disabled:opacity-50 cursor-pointer"
                                    style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Crear mi iglesia
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
