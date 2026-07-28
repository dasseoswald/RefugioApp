import { useState, useEffect } from 'react'
import { getSystemSettings, updateSystemSettings } from '../../data/mockData.js'
import { Settings, Church, Clock, Globe, Save, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
    const [settings, setSettings] = useState(null)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        setSettings(getSystemSettings())
    }, [])

    const handleSave = () => {
        updateSystemSettings(settings)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    const updateField = (field, value) => setSettings(prev => ({ ...prev, [field]: value }))

    if (!settings) return null

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Configuración del Sistema</h1>
                <p className="text-[#6E6E6E] mt-1">Parámetros generales de Refugio App</p>
            </div>

            {saved && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E1F9EC] text-[#111111] animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-[#13CD68]" />
                    <span className="text-sm font-medium">Configuración guardada exitosamente</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                {/* Church info */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Church className="w-5 h-5 text-[#2696D2]" />
                    <h3 className="text-base font-semibold text-[#111111]">Información de la Iglesia</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Nombre de la Iglesia</label>
                        <input type="text" value={settings.church_name} onChange={(e) => updateField('church_name', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm" />
                    </div>
                </div>

                {/* Schedule */}
                <div className="px-6 py-4 border-b border-t border-gray-100 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#2696D2]" />
                    <h3 className="text-base font-semibold text-[#111111]">Horario de Servicios</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Hora de Inicio</label>
                        <input type="time" value={settings.service_start_time} onChange={(e) => updateField('service_start_time', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Hora de Cierre</label>
                        <input type="time" value={settings.service_end_time} onChange={(e) => updateField('service_end_time', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                </div>

                {/* Timezone */}
                <div className="px-6 py-4 border-b border-t border-gray-100 flex items-center gap-3">
                    <Globe className="w-5 h-5 text-[#2696D2]" />
                    <h3 className="text-base font-semibold text-[#111111]">Regional</h3>
                </div>
                <div className="p-6">
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Zona Horaria</label>
                        <select value={settings.timezone} onChange={(e) => updateField('timezone', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            <option value="America/La_Paz">America/La_Paz (GMT-4)</option>
                            <option value="America/Bogota">America/Bogota (GMT-5)</option>
                            <option value="America/Lima">America/Lima (GMT-5)</option>
                            <option value="America/Santiago">America/Santiago (GMT-3)</option>
                            <option value="America/Buenos_Aires">America/Buenos_Aires (GMT-3)</option>
                            <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                        </select>
                    </div>
                </div>

                {/* Facial recognition */}
                <div className="px-6 py-4 border-b border-t border-gray-100 flex items-center gap-3">
                    <Settings className="w-5 h-5 text-[#2696D2]" />
                    <h3 className="text-base font-semibold text-[#111111]">Módulos</h3>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#111111]">Reconocimiento Facial</p>
                            <p className="text-xs text-[#6E6E6E] mt-0.5">Activar el módulo de reconocimiento facial automático</p>
                        </div>
                        <button
                            onClick={() => updateField('facial_recognition_enabled', !settings.facial_recognition_enabled)}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer ${settings.facial_recognition_enabled ? 'bg-[#13CD68]' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${settings.facial_recognition_enabled ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                        </button>
                    </div>
                </div>
            </div>

            <button onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                <Save className="w-4 h-4" /> Guardar Configuración
            </button>
        </div>
    )
}
