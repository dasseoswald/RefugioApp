import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import { Camera, Save, CheckCircle2, AlertCircle, Mail, Shield, User } from 'lucide-react'

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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

export default function ProfilePage() {
    const { user, updateProfile } = useAuth()
    const fileInputRef = useRef(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    if (!user) return null

    const role = roleLabels[user.role]
    const displayPhotoUrl = previewUrl || user.photo_url
    const hasUnsavedChanges = previewUrl !== null

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
