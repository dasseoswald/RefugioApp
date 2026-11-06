import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { SESION_ANUAL_REVISTA_URL } from '../../data/mockData.js'
import { CalendarDays, FileText, ExternalLink, Download, QrCode, Link2, CheckCircle2 } from 'lucide-react'

// Tarjeta fija de la "Sesión Anual IML Coelemu 2026" en Eventos: la Revista
// Compilatoria 2026 (PDF que vive en /public, así que se abre sin iniciar
// sesión) y un QR fijo que apunta a ese mismo enlace para repartirlo impreso.
export default function SesionAnualCard({ event }) {
    const [copied, setCopied] = useState(false)

    const handleDownloadQr = () => {
        const canvas = document.getElementById('sesion-anual-qr-canvas')
        if (!canvas) return
        const link = document.createElement('a')
        link.download = 'codigo-qr-revista-compilatoria-2026.png'
        link.href = canvas.toDataURL('image/png')
        link.click()
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(SESION_ANUAL_REVISTA_URL)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch { /* sin permiso de portapapeles: el enlace igual está visible */ }
    }

    return (
        <div className="rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(38,150,210,0.08)] bg-white">
            <div className="p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #2696D2 100%)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="w-7 h-7 text-white" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Evento permanente</span>
                        <h2 className="text-xl font-bold mt-1.5">{event.name}</h2>
                        <p className="text-white/80 text-sm mt-1">{event.description}</p>
                    </div>
                </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-[#E8F4FC]">
                        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#2696D2]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-[#111111]">Revista Compilatoria 2026</p>
                            <p className="text-xs text-[#6E6E6E]">Informes de la Sesión Anual · PDF</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <a href={SESION_ANUAL_REVISTA_URL} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:shadow-md"
                            style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                            <ExternalLink className="w-4 h-4" /> Abrir revista
                        </a>
                        <a href={SESION_ANUAL_REVISTA_URL} download="Revista_Compilatoria_2026.pdf"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-[#6E6E6E] hover:bg-gray-50">
                            <Download className="w-4 h-4" /> Descargar PDF
                        </a>
                        <button onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-[#6E6E6E] hover:bg-gray-50 cursor-pointer">
                            {copied ? <CheckCircle2 className="w-4 h-4 text-[#13CD68]" /> : <Link2 className="w-4 h-4" />}
                            {copied ? 'Enlace copiado' : 'Copiar enlace'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 mx-auto">
                    <div className="p-3 bg-white rounded-xl border-2 border-gray-100">
                        <QRCodeCanvas id="sesion-anual-qr-canvas" value={SESION_ANUAL_REVISTA_URL} size={600} level="M" marginSize={2}
                            style={{ width: 160, height: 160 }} />
                    </div>
                    <p className="text-xs text-[#6E6E6E] flex items-center gap-1"><QrCode className="w-3.5 h-3.5" /> Escanea para leer la revista</p>
                    <button onClick={handleDownloadQr}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white hover:shadow-md cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                        <Download className="w-3.5 h-3.5" /> Descargar QR
                    </button>
                </div>
            </div>
        </div>
    )
}
