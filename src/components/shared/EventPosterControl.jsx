import { useRef, useState } from 'react'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../firebase.js'
import { setEventPoster } from '../../data/mockData.js'
import { Image as ImageIcon, Trash2, Loader2 } from 'lucide-react'

// Estilo de la cabecera de una tarjeta de evento permanente: si el evento
// tiene imagen se usa de fondo (con un velo oscuro para que el texto blanco
// siga leyéndose); si no, el degradado de siempre.
export function posterHeaderStyle(event, gradient) {
    if (!event?.poster_url) return { background: gradient }
    return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("${event.poster_url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }
}

// Botones para subir, cambiar o quitar la imagen de CET / Bibliatón. Solo se
// renderiza para un administrador (las reglas de Firestore también lo exigen:
// solo admin puede guardar poster_url en estos eventos).
export default function EventPosterControl({ event, className = '' }) {
    const inputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState('')

    const deleteOld = () => {
        if (event.poster_path) deleteObject(storageRef(storage, event.poster_path)).catch(() => {})
    }

    const handleFile = (e) => {
        const file = e.target.files[0]
        if (inputRef.current) inputRef.current.value = ''
        if (!file) return
        if (!file.type.startsWith('image/')) { setError('El archivo debe ser una imagen'); return }
        if (file.size > 10 * 1024 * 1024) { setError('La imagen pesa más de 10 MB'); return }
        setError('')
        const path = `eventPosters/${event.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const task = uploadBytesResumable(storageRef(storage, path), file)
        setUploading(true)
        setProgress(0)
        task.on('state_changed',
            (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
            (err) => {
                console.error('No se pudo subir la imagen', err)
                setError('No se pudo subir la imagen. Intenta de nuevo.')
                setUploading(false)
            },
            async () => {
                const url = await getDownloadURL(task.snapshot.ref)
                deleteOld()
                setEventPoster(event.id, url, path)
                setUploading(false)
            })
    }

    const handleRemove = () => {
        deleteOld()
        setEventPoster(event.id, null, null)
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {error && <span className="text-xs font-medium bg-[#FADBD8] text-[#E74C3C] px-2 py-1 rounded-lg">{error}</span>}
            <input type="file" ref={inputRef} onChange={handleFile} accept="image/*" className="hidden" />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/90 hover:bg-white text-[#111111] disabled:opacity-60 cursor-pointer transition-colors">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                {uploading ? `Subiendo ${progress}%` : (event.poster_url ? 'Cambiar imagen' : 'Subir imagen')}
            </button>
            {event.poster_url && !uploading && (
                <button type="button" onClick={handleRemove} title="Quitar imagen"
                    className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer transition-colors">
                    <Trash2 className="w-4 h-4 text-[#E74C3C]" />
                </button>
            )}
        </div>
    )
}
