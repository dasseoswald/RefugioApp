import { useState, useMemo } from 'react'
import Modal from '../ui/Modal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getMembers, createMember, getAttendancesByService, registerAttendance, cancelAttendance, findAttendanceByMemberAndService, addProfileNote } from '../../data/mockData.js'
import { Search, Users, CheckCircle2, Circle, User, UserPlus, Sparkles } from 'lucide-react'

export default function ServiceAttendanceModal({ isOpen, onClose, service }) {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('miembros')
    const [searchTerm, setSearchTerm] = useState('')
    const [members, setMembers] = useState(() => getMembers().filter(m => m.is_active).sort((a, b) => a.full_name.localeCompare(b.full_name)))
    const [attendances, setAttendances] = useState(() => getAttendancesByService(service.id))
    const [newVisitorIds, setNewVisitorIds] = useState([])
    const [newVisitorForm, setNewVisitorForm] = useState({ full_name: '', phone: '', gender: 'M', notes: '' })

    const filteredMembers = members.filter(m =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const isPresent = (memberId) => attendances.some(a => a.member_id === memberId)

    const handleToggle = (memberId) => {
        const attendance = findAttendanceByMemberAndService(memberId, service.id)
        if (attendance) {
            cancelAttendance(attendance.id, 'Marcado manual')
        } else {
            registerAttendance(memberId, service.id, 'manual')
        }
        // Update local state to reflect changes immediately
        setAttendances(getAttendancesByService(service.id))
    }

    const newlyAddedMembers = newVisitorIds.map(id => members.find(m => m.id === id)).filter(Boolean)

    const handleAddVisitor = () => {
        if (!newVisitorForm.full_name.trim()) return
        const newMember = createMember({
            full_name: newVisitorForm.full_name.trim(),
            phone: newVisitorForm.phone.trim(),
            gender: newVisitorForm.gender,
            member_type: 'Visitante',
            groups: [],
        })
        registerAttendance(newMember.id, service.id, 'manual')
        if (newVisitorForm.notes.trim()) {
            addProfileNote(newMember.id, user?.name || 'Equipo de Bienvenida', newVisitorForm.notes.trim())
        }

        setMembers(getMembers().filter(m => m.is_active).sort((a, b) => a.full_name.localeCompare(b.full_name)))
        setAttendances(getAttendancesByService(service.id))
        setNewVisitorIds(prev => [newMember.id, ...prev])
        setNewVisitorForm({ full_name: '', phone: '', gender: 'M', notes: '' })
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Asistencia: ${service.name}`} size="lg">
            <div className="space-y-4">
                {/* Header Stats */}
                <div className="flex items-center justify-between bg-[#E8F4FC] p-4 rounded-xl border border-[#2696D2]/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <Users className="w-5 h-5 text-[#2696D2]" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#6E6E6E] uppercase">Total Presentes</p>
                            <p className="text-xl font-extrabold text-[#111111]">
                                {attendances.length} <span className="text-sm font-normal text-[#6E6E6E]">de {members.length} miembros</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-100">
                    <button onClick={() => setActiveTab('miembros')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'miembros' ? 'border-[#2696D2] text-[#111111]' : 'border-transparent text-[#6E6E6E] hover:text-[#111111]'
                            }`}>
                        <Users className="w-4 h-4" /> Miembros
                    </button>
                    <button onClick={() => setActiveTab('nuevos')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'nuevos' ? 'border-[#2696D2] text-[#111111]' : 'border-transparent text-[#6E6E6E] hover:text-[#111111]'
                            }`}>
                        <Sparkles className="w-4 h-4" /> Nuevos {newlyAddedMembers.length > 0 && `(${newlyAddedMembers.length})`}
                    </button>
                </div>

                {activeTab === 'miembros' ? (
                <>
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E6E]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar hermano por nombre..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/30 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm"
                    />
                </div>

                {/* Members List */}
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="divide-y divide-gray-50">
                        {filteredMembers.map(member => {
                            const attended = isPresent(member.id)
                            return (
                                <div 
                                    key={member.id} 
                                    className={`flex items-center justify-between py-3 px-2 transition-all rounded-xl cursor-pointer hover:bg-gray-50 mb-1 ${
                                        attended ? 'bg-[#E1F9EC]/20' : ''
                                    }`}
                                    onClick={() => handleToggle(member.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {member.photo_url ? (
                                                <img src={member.photo_url} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                                                    attended ? 'bg-[#13CD68]' : 'bg-[#2696D2]'
                                                }`}>
                                                    {member.full_name.charAt(0)}
                                                </div>
                                            )}
                                            {attended && (
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-[#13CD68]/20">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#13CD68] fill-[#E1F9EC]" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold transition-colors ${attended ? 'text-[#0FA855]' : 'text-[#111111]'}`}>
                                                {member.full_name}
                                            </p>
                                            <p className="text-xs text-[#6E6E6E]">{member.member_type}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {attended ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E1F9EC] text-[#13CD68] font-bold text-[10px] uppercase tracking-wider border border-[#13CD68]/10 animate-scale-in">
                                                Presente
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center transition-all group-hover:border-[#2696D2]/30">
                                                <Circle className="w-4 h-4 text-transparent" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        {filteredMembers.length === 0 && (
                            <div className="py-12 text-center text-[#6E6E6E]">
                                <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-medium">No se encontraron miembros</p>
                            </div>
                        )}
                    </div>
                </div>
                </>
                ) : (
                <>
                {/* Quick visitor form */}
                <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-[#6E6E6E] uppercase tracking-wider flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Registrar Nuevo Visitante
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={newVisitorForm.full_name}
                            onChange={(e) => setNewVisitorForm(f => ({ ...f, full_name: e.target.value }))}
                            placeholder="Nombre completo *"
                            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm"
                        />
                        <input
                            type="tel"
                            value={newVisitorForm.phone}
                            onChange={(e) => setNewVisitorForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="Teléfono (opcional)"
                            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm"
                        />
                        <select
                            value={newVisitorForm.gender}
                            onChange={(e) => setNewVisitorForm(f => ({ ...f, gender: e.target.value }))}
                            className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            <option value="M">M</option>
                            <option value="F">F</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <textarea
                        value={newVisitorForm.notes}
                        onChange={(e) => setNewVisitorForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Notas (opcional) — observaciones sobre el visitante..."
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm resize-none"
                    />
                    <button
                        onClick={handleAddVisitor}
                        disabled={!newVisitorForm.full_name.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-md"
                        style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                        <CheckCircle2 className="w-4 h-4" /> Registrar y Marcar Presente
                    </button>
                </div>

                {/* Recently added visitors */}
                <div className="max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-xs font-bold text-[#6E6E6E] uppercase tracking-wider mb-2">Nuevos Registrados en Este Servicio</p>
                    {newlyAddedMembers.length === 0 ? (
                        <div className="py-10 text-center text-[#6E6E6E]">
                            <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium">Aún no has registrado visitantes nuevos hoy</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {newlyAddedMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between py-3 px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm bg-[#13CD68]">
                                            {member.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#0FA855]">{member.full_name}</p>
                                            <p className="text-xs text-[#6E6E6E]">{member.phone || 'Sin teléfono'} • Visitante</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#E1F9EC] text-[#13CD68] font-bold text-[10px] uppercase tracking-wider border border-[#13CD68]/10">
                                        Presente
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-gray-100 text-[#111111] font-bold text-sm hover:bg-gray-200 transition-all cursor-pointer"
                >
                    Listo
                </button>
            </div>
        </Modal>
    )
}
