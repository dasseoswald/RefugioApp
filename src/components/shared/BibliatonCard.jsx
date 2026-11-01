import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
    subscribeBibliatonDonations, getBibliatonDonations, getBibliatonTotal, addBibliatonDonation,
    setBibliatonDonationBibles, deleteBibliatonDonation, updateBibliatonSettings, getMembers, BIBLIATON_DEFAULT_GOAL,
} from '../../data/mockData.js'
import { getWhatsAppUrl } from '../../lib/whatsapp.js'
import Modal from '../ui/Modal.jsx'
import EventPosterControl, { posterHeaderStyle } from './EventPosterControl.jsx'
import {
    BookOpen, UserPlus, ListChecks, Settings, Search, X, Trash2, Minus, Plus, Phone, Mail,
    FileSpreadsheet, FileText, CheckCircle2, Target,
} from 'lucide-react'

const EMPTY_FORM = { name: '', phone: '', email: '', bibles: 1, notes: '' }

function formatDate(dateStr) {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

function WhatsAppIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    )
}

// Tarjeta fija del Bibliatón en Eventos: contador de biblias contra la meta
// y, para quien puede registrar (Administración y Bienvenida), el alta de
// cada hermano con las biblias que donará, más la lista exportable.
// canManage: además cambiar la meta/fecha. El resto de los roles solo ve el
// avance (el total lo mantiene el servidor en el evento).
export default function BibliatonCard({ event, canManage, canRegister, user }) {
    const [donations, setDonations] = useState([])
    const [showRegister, setShowRegister] = useState(false)
    const [showList, setShowList] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [mode, setMode] = useState('member') // 'member' | 'guest'
    const [memberSearch, setMemberSearch] = useState('')
    const [selectedMember, setSelectedMember] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [formError, setFormError] = useState('')
    const [listSearch, setListSearch] = useState('')
    const [notification, setNotification] = useState(null)
    const [goalInput, setGoalInput] = useState(BIBLIATON_DEFAULT_GOAL)
    const [dateInput, setDateInput] = useState('')

    useEffect(() => {
        if (!canRegister) return
        const refresh = () => setDonations(getBibliatonDonations())
        const unsub = subscribeBibliatonDonations(refresh)
        refresh()
        return unsub
    }, [canRegister])

    const goal = event.goal_bibles || BIBLIATON_DEFAULT_GOAL
    // Quien puede ver la lista suma en vivo; el resto lee el total del evento.
    const total = canRegister ? getBibliatonTotal() : (event.total_bibles || 0)
    const donorsCount = canRegister ? donations.length : (event.donors_count || 0)
    const percent = Math.min(100, Math.round((total / goal) * 100))
    const remaining = Math.max(0, goal - total)
    const goalReached = total >= goal

    const memberCandidates = useMemo(() => {
        const term = memberSearch.trim().toLowerCase()
        if (!term) return []
        return getMembers().filter(m => m.full_name.toLowerCase().includes(term)).slice(0, 6)
    }, [memberSearch])

    const filteredDonations = donations.filter(d => d.name.toLowerCase().includes(listSearch.trim().toLowerCase()))

    const showNotification = (message) => {
        setNotification(message)
        setTimeout(() => setNotification(null), 3500)
    }

    const openRegister = () => {
        setMode('member')
        setMemberSearch('')
        setSelectedMember(null)
        setForm(EMPTY_FORM)
        setFormError('')
        setShowRegister(true)
    }

    const handleRegister = (e) => {
        e.preventDefault()
        const result = addBibliatonDonation(
            { ...form, member_id: mode === 'member' ? selectedMember?.id : null },
            { name: user?.name, uid: user?.auth_uid }
        )
        if (result.error) {
            setFormError(result.error)
            return
        }
        const bibles = result.data.bibles
        setFormError('')
        setForm(EMPTY_FORM)
        setSelectedMember(null)
        setMemberSearch('')
        showNotification(`${result.data.name}: ${bibles} biblia${bibles === 1 ? '' : 's'} registrada${bibles === 1 ? '' : 's'}`)
    }

    const openSettings = () => {
        setGoalInput(goal)
        setDateInput(event.event_date || '')
        setShowSettings(true)
    }

    const saveSettings = () => {
        updateBibliatonSettings({ goal: goalInput, eventDate: dateInput })
        setShowSettings(false)
        showNotification('Meta actualizada')
    }

    const exportRows = () => filteredDonations.map((d, i) => [
        i + 1, d.name, d.is_member ? 'Miembro' : 'No miembro', d.phone || '-', d.email || '-',
        d.bibles, d.notes || '-', d.registered_by || '-', new Date(d.created_at).toLocaleDateString('es'),
    ])

    const exportToExcel = () => {
        const totalShown = filteredDonations.reduce((sum, d) => sum + (Number(d.bibles) || 0), 0)
        const wsData = [
            ['Bibliatón — Biblias a donar'],
            [`Meta: ${goal} biblias`, `Reunidas: ${total}`, `Personas: ${donations.length}`],
            [],
            ['#', 'Nombre', 'Tipo', 'Teléfono', 'Correo', 'Biblias', 'Nota', 'Registrado por', 'Fecha'],
            ...exportRows(),
            [],
            ['', '', '', '', 'TOTAL', totalShown],
        ]
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 28 }, { wch: 9 }, { wch: 30 }, { wch: 20 }, { wch: 12 }]
        XLSX.utils.book_append_sheet(wb, ws, 'Bibliatón')
        XLSX.writeFile(wb, `Bibliaton_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const exportToPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' })
        doc.setFontSize(18)
        doc.setTextColor(44, 62, 80)
        doc.text('Bibliatón — Biblias a donar', 14, 20)
        doc.setFontSize(11)
        doc.setTextColor(127, 140, 141)
        doc.text(`Reunidas: ${total} de ${goal} biblias — ${donations.length} personas`, 14, 28)
        autoTable(doc, {
            startY: 34,
            head: [['#', 'Nombre', 'Tipo', 'Teléfono', 'Correo', 'Biblias', 'Nota', 'Registrado por']],
            body: exportRows().map(r => r.slice(0, 8)),
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [74, 111, 165], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 246, 255] },
        })
        doc.save(`Bibliaton_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    return (
        <>
            <div className="rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(38,150,210,0.08)] bg-white">
                <div className="p-6 text-white relative overflow-hidden" style={posterHeaderStyle(event, 'linear-gradient(135deg, #0B3D2E 0%, #13CD68 100%)')}>
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                    {user?.role === 'admin' && <EventPosterControl event={event} className="relative z-10 mb-3 justify-end" />}
                    <div className="relative flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Evento permanente</span>
                            <h2 className="text-xl font-bold mt-1.5">{event.name}</h2>
                            <p className="text-white/80 text-sm mt-1">{event.description}</p>
                            {event.event_date && <p className="text-white/80 text-xs mt-1">Fecha: {formatDate(event.event_date)}</p>}
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {notification && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E1F9EC] text-[#111111] animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 text-[#13CD68]" />
                            <span className="text-sm font-medium">{notification}</span>
                        </div>
                    )}

                    {/* Contador de biblias */}
                    <div>
                        <div className="flex items-end justify-between gap-3 mb-2">
                            <div>
                                <span className="text-4xl font-black text-[#111111]">{total}</span>
                                <span className="text-lg font-semibold text-[#6E6E6E]"> / {goal} biblias</span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: goalReached ? '#13CD68' : '#2696D2' }}>{percent}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${percent}%`, background: goalReached ? 'linear-gradient(90deg, #13CD68, #0FA855)' : 'linear-gradient(90deg, #2696D2, #13CD68)' }} />
                        </div>
                        <p className="text-sm text-[#6E6E6E] mt-2 flex items-center gap-1.5">
                            <Target className="w-4 h-4" />
                            {goalReached ? '¡Meta cumplida!' : `Faltan ${remaining} biblia${remaining === 1 ? '' : 's'} para la meta`}
                            {donorsCount > 0 && ` · ${donorsCount} persona${donorsCount === 1 ? '' : 's'} aportando`}
                        </p>
                    </div>

                    {canRegister && (
                        <div className="flex flex-wrap gap-2">
                            <button onClick={openRegister}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:shadow-md cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                                <UserPlus className="w-4 h-4" /> Registrar hermano
                            </button>
                            <button onClick={() => { setListSearch(''); setShowList(true) }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:shadow-md cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                                <ListChecks className="w-4 h-4" /> Ver lista y exportar
                            </button>
                            {canManage && (
                                <button onClick={openSettings}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-[#6E6E6E] hover:bg-gray-50 cursor-pointer">
                                    <Settings className="w-4 h-4" /> Meta y fecha
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Registrar hermano */}
            <Modal isOpen={showRegister} onClose={() => setShowRegister(false)} title="Registrar hermano — Bibliatón" size="lg">
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex items-center justify-between bg-[#E1F9EC] rounded-xl px-4 py-3">
                        <span className="text-sm font-medium text-[#111111]">Llevamos</span>
                        <span className="text-lg font-black text-[#0FA855]">{total} / {goal} biblias</span>
                    </div>
                    {notification && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E1F9EC] text-[#111111] animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 text-[#13CD68]" />
                            <span className="text-sm font-medium">{notification}</span>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setMode('member'); setFormError('') }}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border-2 cursor-pointer ${mode === 'member' ? 'border-[#13CD68] text-[#0FA855] bg-[#E1F9EC]' : 'border-gray-200 text-[#6E6E6E]'}`}>
                            Ya es miembro de la app
                        </button>
                        <button type="button" onClick={() => { setMode('guest'); setFormError('') }}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border-2 cursor-pointer ${mode === 'guest' ? 'border-[#13CD68] text-[#0FA855] bg-[#E1F9EC]' : 'border-gray-200 text-[#6E6E6E]'}`}>
                            No está inscrito en la app
                        </button>
                    </div>

                    {mode === 'member' ? (
                        selectedMember ? (
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50">
                                <div>
                                    <p className="text-sm font-medium text-[#111111]">{selectedMember.full_name}</p>
                                    <p className="text-xs text-[#6E6E6E]">{selectedMember.member_type}{selectedMember.phone ? ` · ${selectedMember.phone}` : ''}</p>
                                </div>
                                <button type="button" onClick={() => setSelectedMember(null)} className="text-[#6E6E6E] hover:text-[#111111] cursor-pointer"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
                                    <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}
                                        placeholder="Buscar al miembro por nombre..."
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#13CD68] text-sm" />
                                </div>
                                {memberCandidates.map(m => (
                                    <button type="button" key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch('') }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-gray-100 hover:border-[#13CD68] text-left cursor-pointer">
                                        <span className="text-sm text-[#111111]">{m.full_name}</span>
                                        <span className="text-xs text-[#6E6E6E]">{m.member_type}</span>
                                    </button>
                                ))}
                                {memberSearch.trim() && memberCandidates.length === 0 && (
                                    <p className="text-xs text-[#6E6E6E] text-center py-1">Sin resultados — usa "No está inscrito en la app"</p>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Nombre *" className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#13CD68] text-sm" />
                            <input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="Teléfono / WhatsApp" className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#13CD68] text-sm" />
                            <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="Correo (opcional)" className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#13CD68] text-sm" />
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-[#111111]">Biblias que va a donar *</label>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setForm(f => ({ ...f, bibles: Math.max(1, (parseInt(f.bibles) || 1) - 1) }))}
                                className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><Minus className="w-4 h-4" /></button>
                            <input type="number" min="1" value={form.bibles} onChange={(e) => setForm(f => ({ ...f, bibles: e.target.value }))}
                                className="w-20 text-center px-2 py-2 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#13CD68] text-lg font-bold" />
                            <button type="button" onClick={() => setForm(f => ({ ...f, bibles: (parseInt(f.bibles) || 0) + 1 }))}
                                className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <input type="text" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Nota (opcional)" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#13CD68] text-sm" />

                    {formError && <p className="text-xs text-[#E74C3C]">{formError}</p>}

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={() => setShowRegister(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cerrar</button>
                        <button type="submit" disabled={mode === 'member' ? !selectedMember : !form.name.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                            <UserPlus className="w-4 h-4" /> Registrar y sumar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Lista */}
            <Modal isOpen={showList} onClose={() => setShowList(false)} title="Lista del Bibliatón" size="xl">
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-sm text-[#6E6E6E]"><strong className="text-[#111111]">{total}</strong> de {goal} biblias · {donations.length} persona{donations.length === 1 ? '' : 's'}</p>
                        {donations.length > 0 && (
                            <div className="flex gap-2">
                                <button onClick={exportToPDF}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:shadow-md cursor-pointer"
                                    style={{ background: 'linear-gradient(135deg, #E74C3C, #C0392B)' }}>
                                    <FileText className="w-4 h-4" /> PDF
                                </button>
                                <button onClick={exportToExcel}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:shadow-md cursor-pointer"
                                    style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                                    <FileSpreadsheet className="w-4 h-4" /> Excel
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
                        <input type="text" value={listSearch} onChange={(e) => setListSearch(e.target.value)} placeholder="Buscar por nombre..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                    {filteredDonations.length === 0 ? (
                        <p className="text-sm text-[#6E6E6E] text-center py-8">{donations.length === 0 ? 'Todavía no hay hermanos registrados.' : 'Sin resultados.'}</p>
                    ) : (
                        <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-50">
                            {filteredDonations.map(d => {
                                const whatsappUrl = getWhatsAppUrl(d.phone)
                                return (
                                    <div key={d.id} className="flex items-center gap-3 py-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-[#111111]">
                                                {d.name}
                                                <span className={`ml-2 align-middle text-[10px] font-bold px-2 py-0.5 rounded-full ${d.is_member ? 'bg-[#E8F4FC] text-[#2696D2]' : 'bg-gray-100 text-[#6E6E6E]'}`}>
                                                    {d.is_member ? 'Miembro' : 'No miembro'}
                                                </span>
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                                {d.phone && <span className="text-xs text-[#6E6E6E] flex items-center gap-1"><Phone className="w-3 h-3" /> {d.phone}</span>}
                                                {d.email && <span className="text-xs text-[#6E6E6E] flex items-center gap-1"><Mail className="w-3 h-3" /> {d.email}</span>}
                                                {d.registered_by && <span className="text-xs text-[#6E6E6E]">Registró: {d.registered_by}</span>}
                                            </div>
                                            {d.notes && <p className="text-xs text-[#6E6E6E] mt-1 italic">{d.notes}</p>}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button onClick={() => setBibliatonDonationBibles(d.id, d.bibles - 1)} disabled={d.bibles <= 1}
                                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                                            <span className="w-10 text-center text-sm font-black text-[#0FA855]">{d.bibles}</span>
                                            <button onClick={() => setBibliatonDonationBibles(d.id, d.bibles + 1)}
                                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {whatsappUrl && (
                                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="Escribir por WhatsApp"
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#E1F9EC] transition-colors">
                                                    <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                                                </a>
                                            )}
                                            <button onClick={() => deleteBibliatonDonation(d.id)} title="Quitar de la lista"
                                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer">
                                                <Trash2 className="w-4 h-4 text-[#E74C3C]" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Meta y fecha */}
            <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Meta del Bibliatón" size="sm">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Meta de biblias</label>
                        <input type="number" min="1" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#13CD68] text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Fecha del evento (opcional)</label>
                        <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#13CD68] text-sm" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowSettings(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={saveSettings} className="px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>Guardar</button>
                </div>
            </Modal>
        </>
    )
}
