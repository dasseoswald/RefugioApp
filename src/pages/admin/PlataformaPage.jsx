import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { getCurrentChurchId } from '../../data/mockData.js'
import { Church, ShieldAlert, CheckCircle2, Ban } from 'lucide-react'

// Panel de supervisión de la plataforma multi-iglesia: solo tiene sentido
// para Refugio (el único que puede ver todas las iglesias creadas, ya que
// "churches" es de lectura pública) — cualquier otra iglesia que llegue acá
// por URL directa (la ruta solo exige role admin, no iglesia) ve un aviso en
// vez del panel real.
export default function PlataformaPage() {
    const [churches, setChurches] = useState([])
    const isRefugio = getCurrentChurchId() === 'refugio'

    useEffect(() => {
        if (!isRefugio) return
        return onSnapshot(collection(db, 'churches'), (snap) => {
            setChurches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
    }, [isRefugio])

    if (!isRefugio) {
        return (
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-8 text-center">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-[#E8A838]" />
                <p className="text-[#111111] font-medium">Esta pantalla no está disponible para tu iglesia.</p>
            </div>
        )
    }

    const setStatus = (churchId, status) => updateDoc(doc(db, 'churches', churchId), { status }).catch(console.error)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Plataforma</h1>
                <p className="text-[#6E6E6E] mt-1">Iglesias creadas en Refugio App</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {churches.map(church => (
                    <div key={church.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                        <div className="flex items-center gap-3 mb-3">
                            {church.logo_url ? (
                                <img src={church.logo_url} alt={church.name} className="w-10 h-10 rounded-xl object-contain bg-gray-50" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: church.primary_color || '#2696D2' }}>
                                    <Church className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-semibold text-[#111111] truncate">{church.name}</p>
                                <p className="text-xs text-[#6E6E6E]">/{church.slug}</p>
                            </div>
                        </div>
                        <p className="text-xs text-[#6E6E6E] mb-1">{church.ministries?.length || 0} ministerios · {church.service_schedule?.length || 0} horarios</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full mt-2 ${church.status === 'active' ? 'bg-[#E1F9EC] text-[#13CD68]' : church.status === 'suspended' ? 'bg-[#FADBD8] text-[#E74C3C]' : 'bg-[#FFF3CD] text-[#E8A838]'}`}>
                            {church.status === 'active' ? 'Activa' : church.status === 'suspended' ? 'Suspendida' : 'Pendiente de revisión'}
                        </span>
                        {church.id !== 'refugio' && (
                            <div className="flex gap-2 mt-4">
                                {church.status !== 'active' && (
                                    <button onClick={() => setStatus(church.id, 'active')}
                                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#E1F9EC] text-[#13CD68] hover:bg-[#c8f3dd] cursor-pointer">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Marcar activa
                                    </button>
                                )}
                                {church.status !== 'suspended' && (
                                    <button onClick={() => setStatus(church.id, 'suspended')}
                                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#FADBD8] text-[#E74C3C] hover:bg-[#f5c2bc] cursor-pointer">
                                        <Ban className="w-3.5 h-3.5" /> Suspender
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
