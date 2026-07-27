import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getMemberById, updateMember, getMemberProfile, updateMemberProfile } from '../../data/mockData.js'
import { enablePushNotifications, getNotificationPermission } from '../../lib/push.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import {
    Camera, Save, CheckCircle2, AlertCircle, Mail, Shield, User, Cake, Heart, Phone, UserCheck,
    MapPin, Briefcase, Church, Users as UsersIcon, Droplets, AlertTriangle, Calendar, Bell, BellRing,
} from 'lucide-react'

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const GENDERS = ['M', 'F', 'Otro']
const CIVIL_STATUSES = ['Soltero', 'Casado', 'Viudo', 'Divorciado']
const GENDER_LABELS = { M: 'Masculino', F: 'Femenino', Otro: 'Otro' }
const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

const roleLabels = {
    admin: { label: 'Administrador', color: '#2696D2', bg: '#E8F4FC' },
    controller: { label: 'Controlador', color: '#13CD68', bg: '#E1F9EC' },
    attendee: { label: 'Asistente', color: '#E8A838', bg: '#FFF3CD' },
}

function validateImageFile(file) {
    if (!file) return 'No se seleccionó ningún archivo'
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Formato no válido. Use JPG, PNG, WebP o GIF'
    if (file.size > MAX_FILE_SIZE_BYTES) return 'La imagen excede el tamaño máximo de 2MB'
    return null
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Error al leer el archivo'))
        reader.readAsDataURL(file)
    })
}

const EMPTY_MEMBER_FORM = { birth_date: '', gender: 'M', civil_status: 'Soltero', phone: '' }
const EMPTY_LIFE_FORM = { address: '', occupation: '', ministry: '', baptized: false, baptism_date: '', family_info: '', emergency_contact: '', emergency_phone: '', blood_type: '', allergies: '' }

export default function ProfilePage() {
    const { user, updateProfile } = useAuth()
    const fileInputRef = useRef(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)
    const [member, setMember] = useState(null)
    const [memberForm, setMemberForm] = useState(EMPTY_MEMBER_FORM)
    const [savingMember, setSavingMember] = useState(false)
    const [lifeForm, setLifeForm] = useState(EMPTY_LIFE_FORM)
    const [savingLife, setSavingLife] = useState(false)
    const [notifPermission, setNotifPermission] = useState('default')
    const [enablingNotifs, setEnablingNotifs] = useState(false)

    useEffect(() => {
        if (!user?.member_id) return
        const m = getMemberById(user.member_id)
        setMember(m)
        if (m) {
            setMemberForm({
                birth_date: m.birth_date || '',
                gender: m.gender || 'M',
                civil_status: m.civil_status || 'Soltero',
                phone: m.phone || '',
            })
        }
        const profile = getMemberProfile(user.member_id)
        setLifeForm({
            address: profile.address || '',
            occupation: profile.occupation || '',
            ministry: profile.ministry || '',
            baptized: !!profile.baptized,
            baptism_date: profile.baptism_date || '',
            family_info: profile.family_info || '',
            emergency_contact: profile.emergency_contact || '',
            emergency_phone: profile.emergency_phone || '',
            blood_type: profile.blood_type || '',
            allergies: profile.allergies || '',
        })
    }, [user?.member_id])

    useEffect(() => {
        setNotifPermission(getNotificationPermission())
    }, [])

    if (!user) return null

    const role = roleLabels[user.role]
    const displayPhotoUrl = previewUrl || user.photo_url
    const hasUnsavedChanges = previewUrl !== null

    const updateMemberField = (field, value) => setMemberForm(prev => ({ ...prev, [field]: value }))

    const handleSaveMemberInfo = () => {
        if (!user.member_id) return
        setSavingMember(true)
        setTimeout(() => {
            const updated = updateMember(user.member_id, memberForm)
            setSavingMember(false)
            if (!updated) {
                showToast('No se pudo actualizar tu información', 'error')
                return
            }
            setMember(updated)
            showToast('Información personal actualizada correctamente')
        }, 300)
    }

    const updateLifeField = (field, value) => setLifeForm(prev => ({ ...prev, [field]: value }))

    const handleSaveLifeInfo = () => {
        if (!user.member_id) return
        setSavingLife(true)
        setTimeout(() => {
            const updated = updateMemberProfile(user.member_id, lifeForm)
            setSavingLife(false)
            if (!updated) {
                showToast('No se pudo actualizar tu hoja de vida', 'error')
                return
            }
            showToast('Hoja de vida actualizada correctamente')
        }, 300)
    }

    const handleEnableNotifications = async () => {
        setEnablingNotifs(true)
        const result = await enablePushNotifications(user.id)
        setEnablingNotifs(false)
        setNotifPermission(getNotificationPermission())
        if (result.error) {
            showToast(result.error, 'error')
            return
        }
        showToast('¡Notificaciones activadas! Recibirás avisos de tus grupos')
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3500)
    }

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        const error = validateImageFile(file)
        if (error) {
            showToast(error, 'error')
            return
        }

        try {
            const dataUrl = await readFileAsDataUrl(file)
            setPreviewUrl(dataUrl)
        } catch {
            showToast('Error al procesar la imagen', 'error')
        }
    }

    const handleSave = () => {
        if (!previewUrl) return
        setSaving(true)
        // Simulate brief network delay for UX
        setTimeout(() => {
            const result = updateProfile({ photo_url: previewUrl })
            setSaving(false)
            if (result.error) {
                showToast(result.error, 'error')
                return
            }
            setPreviewUrl(null)
            showToast('Foto de perfil actualizada correctamente')
        }, 400)
    }

    const handleRemovePhoto = () => {
        const result = updateProfile({ photo_url: null })
        setPreviewUrl(null)
        if (result.error) {
            showToast(result.error, 'error')
            return
        }
        showToast('Foto de perfil eliminada')
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Mi Perfil</h1>
                <p className="text-[#6E6E6E] mt-1">Gestionar información personal y foto de perfil</p>
            </div>

            {/* Toast notification */}
            {toast && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl animate-fade-in ${toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-[#E1F9EC] text-[#111111]'
                    }`}>
                    {toast.type === 'error'
                        ? <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        : <CheckCircle2 className="w-5 h-5 text-[#13CD68] flex-shrink-0" />
                    }
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                {/* Profile photo section */}
                <div className="px-6 py-8 flex flex-col items-center gap-5 border-b border-gray-100"
                    style={{ background: 'linear-gradient(180deg, #E8F4FC 0%, #FFFFFF 100%)' }}>
                    <div className="relative group">
                        <UserAvatar
                            photoUrl={displayPhotoUrl}
                            name={user.name}
                            size="xl"
                            bgColor={role.color}
                            className="shadow-lg ring-4 ring-white"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300 cursor-pointer"
                            aria-label="Cambiar foto de perfil"
                        >
                            <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-[#111111]">{user.name}</h2>
                        <span className="inline-flex items-center gap-1.5 mt-2 text-xs px-3 py-1.5 rounded-full font-semibold"
                            style={{ background: role.bg, color: role.color }}>
                            <Shield className="w-3 h-3" />{role.label}
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[#2696D2] bg-[#E8F4FC] hover:bg-[#D6EEFA] transition-all cursor-pointer"
                        >
                            <Camera className="w-4 h-4" />
                            Cambiar foto
                        </button>
                        {(user.photo_url || previewUrl) && (
                            <button
                                onClick={handleRemovePhoto}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-all cursor-pointer"
                            >
                                Eliminar foto
                            </button>
                        )}
                    </div>
                </div>

                {/* User info (read only) */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/80">
                        <User className="w-5 h-5 text-[#6E6E6E] flex-shrink-0" />
                        <div>
                            <p className="text-xs text-[#6E6E6E] font-medium">Nombre</p>
                            <p className="text-sm text-[#111111] font-semibold">{user.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/80">
                        <Mail className="w-5 h-5 text-[#6E6E6E] flex-shrink-0" />
                        <div>
                            <p className="text-xs text-[#6E6E6E] font-medium">Correo electrónico</p>
                            <p className="text-sm text-[#111111] font-semibold">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/80">
                        <Shield className="w-5 h-5 text-[#6E6E6E] flex-shrink-0" />
                        <div>
                            <p className="text-xs text-[#6E6E6E] font-medium">Rol</p>
                            <p className="text-sm font-semibold" style={{ color: role.color }}>{role.label}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notificaciones push */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {notifPermission === 'granted'
                            ? <BellRing className="w-5 h-5 text-[#13CD68] flex-shrink-0" />
                            : <Bell className="w-5 h-5 text-[#6E6E6E] flex-shrink-0" />}
                        <div>
                            <h3 className="text-base font-semibold text-[#111111]">Notificaciones</h3>
                            <p className="text-xs text-[#6E6E6E] mt-0.5">
                                {notifPermission === 'granted'
                                    ? 'Activadas en este dispositivo'
                                    : notifPermission === 'denied'
                                        ? 'Bloqueadas. Actívalas en la configuración de tu navegador'
                                        : 'Recibe avisos de tus grupos aunque no tengas la app abierta'}
                            </p>
                        </div>
                    </div>
                    {notifPermission !== 'granted' && notifPermission !== 'denied' && (
                        <button
                            onClick={handleEnableNotifications}
                            disabled={enablingNotifs}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
                            style={{ background: '#2696D2' }}
                        >
                            <Bell className="w-4 h-4" />
                            {enablingNotifs ? 'Activando...' : 'Activar'}
                        </button>
                    )}
                </div>
            </div>

            {/* Información personal del miembro */}
            {member && (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 space-y-4">
                    <div>
                        <h3 className="text-base font-semibold text-[#111111]">Información Personal</h3>
                        <p className="text-xs text-[#6E6E6E] mt-0.5">Completa estos datos para tu ficha de miembro</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><Cake className="w-3.5 h-3.5" /> Fecha de Nacimiento</label>
                            <input type="date" value={memberForm.birth_date} onChange={(e) => updateMemberField('birth_date', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Género</label>
                            <select value={memberForm.gender} onChange={(e) => updateMemberField('gender', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                                {GENDERS.map(g => <option key={g} value={g}>{GENDER_LABELS[g]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Estado Civil</label>
                            <select value={memberForm.civil_status} onChange={(e) => updateMemberField('civil_status', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                                {CIVIL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Teléfono</label>
                            <input type="tel" value={memberForm.phone} onChange={(e) => updateMemberField('phone', e.target.value)}
                                placeholder="+591 7XX-XXXX" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                        </div>
                    </div>

                    {/* Datos administrados por la iglesia (solo lectura) */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                        <span className="text-xs text-[#6E6E6E] flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" /> {member.member_type || 'Miembro'}
                        </span>
                        {(member.groups || []).length > 0 && (
                            <span className="text-xs text-[#6E6E6E]">· {member.groups.join(', ')}</span>
                        )}
                        <span className="text-xs text-[#6E6E6E]/70">(asignado por la iglesia)</span>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSaveMemberInfo}
                            disabled={savingMember}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}
                        >
                            <Save className="w-4 h-4" />
                            {savingMember ? 'Guardando...' : 'Guardar Información Personal'}
                        </button>
                    </div>
                </div>
            )}

            {/* Hoja de Vida */}
            {member && (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 space-y-4">
                    <div>
                        <h3 className="text-base font-semibold text-[#111111]">Hoja de Vida</h3>
                        <p className="text-xs text-[#6E6E6E] mt-0.5">Información adicional para tu ficha de miembro</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Dirección</label>
                            <input type="text" value={lifeForm.address} onChange={(e) => updateLifeField('address', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Ocupación</label>
                            <input type="text" value={lifeForm.occupation} onChange={(e) => updateLifeField('occupation', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><Church className="w-3.5 h-3.5" /> Ministerio</label>
                            <input type="text" value={lifeForm.ministry} onChange={(e) => updateLifeField('ministry', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" /> Tipo de Sangre</label>
                            <select value={lifeForm.blood_type} onChange={(e) => updateLifeField('blood_type', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                                <option value="">Sin especificar</option>
                                {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={lifeForm.baptized}
                                    onChange={(e) => updateLifeField('baptized', e.target.checked)}
                                    className="w-4 h-4 rounded accent-[#2696D2] cursor-pointer" />
                                <span className="text-sm font-medium text-[#111111] flex items-center gap-1.5"><Church className="w-3.5 h-3.5" /> Bautizado</span>
                            </label>
                        </div>
                        {lifeForm.baptized && (
                            <div>
                                <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fecha de Bautismo</label>
                                <input type="date" value={lifeForm.baptism_date} onChange={(e) => updateLifeField('baptism_date', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contacto de Emergencia</label>
                            <input type="text" value={lifeForm.emergency_contact} onChange={(e) => updateLifeField('emergency_contact', e.target.value)}
                                placeholder="Nombre" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Teléfono de Emergencia</label>
                            <input type="tel" value={lifeForm.emergency_phone} onChange={(e) => updateLifeField('emergency_phone', e.target.value)}
                                placeholder="+591 7XX-XXXX" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5" /> Información Familiar</label>
                            <textarea value={lifeForm.family_info} onChange={(e) => updateLifeField('family_info', e.target.value)} rows={2}
                                placeholder="Ej: Esposo/a, hijos..." className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm resize-none" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-[#111111] mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Alergias</label>
                            <input type="text" value={lifeForm.allergies} onChange={(e) => updateLifeField('allergies', e.target.value)}
                                placeholder="Ej: Ninguna" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <button
                            onClick={handleSaveLifeInfo}
                            disabled={savingLife}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer disabled:opacity-60 mt-4"
                            style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}
                        >
                            <Save className="w-4 h-4" />
                            {savingLife ? 'Guardando...' : 'Guardar Hoja de Vida'}
                        </button>
                    </div>
                </div>
            )}

            {/* Save button (visible when there's a preview) */}
            {hasUnsavedChanges && (
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-default"
                    style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar foto de perfil'}
                </button>
            )}

            <p className="text-xs text-[#6E6E6E]">
                Formatos aceptados: JPG, PNG, WebP, GIF. Tamaño máximo: 2MB.
            </p>
        </div>
    )
}
