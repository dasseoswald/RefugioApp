import { useState, useEffect, useMemo } from 'react'
import { getServices, getAttendancesByService, getMembers, getMemberById } from '../../data/mockData.js'
import { BarChart3, Download, FileText, Table, Filter, CalendarDays, Users, TrendingUp, TrendingDown, Minus, UserX } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function ReportsPage() {
    const [services, setServices] = useState([])
    const [selectedServiceId, setSelectedServiceId] = useState('')
    const [reportData, setReportData] = useState([])
    const [filterType, setFilterType] = useState('')
    const [activeMembers, setActiveMembers] = useState([])

    useEffect(() => {
        const allServices = getServices()
        setServices(allServices)
        setActiveMembers(getMembers().filter(m => m.is_active))
        if (allServices.length > 0) {
            setSelectedServiceId(allServices[0].id)
        }
    }, [])

    useEffect(() => {
        if (!selectedServiceId) return
        const attendances = getAttendancesByService(selectedServiceId)
        const data = attendances.map(att => {
            const member = getMemberById(att.member_id)
            return { ...att, memberName: member?.full_name || 'Desconocido', memberType: member?.member_type || 'N/A', memberGroup: member?.groups?.length > 0 ? member.groups.join(', ') : 'Sin ministerio' }
        })
        setReportData(data)
    }, [selectedServiceId])

    const filtered = filterType ? reportData.filter(r => r.memberType === filterType) : reportData
    const selectedService = services.find(s => s.id === selectedServiceId)
    const selectedIndex = services.findIndex(s => s.id === selectedServiceId)

    // services[] viene ordenado del más reciente al más antiguo
    const previousService = selectedIndex >= 0 ? services[selectedIndex + 1] : null
    const previousCount = previousService ? getAttendancesByService(previousService.id).length : 0
    const trendPercent = previousCount > 0 ? Math.round(((reportData.length - previousCount) / previousCount) * 100) : 0
    const TrendIcon = trendPercent > 0 ? TrendingUp : trendPercent < 0 ? TrendingDown : Minus
    const trendColor = trendPercent > 0 ? '#13CD68' : trendPercent < 0 ? '#E74C3C' : '#6E6E6E'

    const attendedMemberIds = new Set(reportData.map(r => r.member_id))
    const absentMembers = activeMembers.filter(m => !attendedMemberIds.has(m.id))
    const attendanceRate = activeMembers.length > 0 ? Math.round((reportData.length / activeMembers.length) * 100) : 0

    // Ventana de las últimas semanas terminando en el servicio seleccionado, para dar contexto de tendencia
    const trendWindow = useMemo(() => {
        if (selectedIndex < 0) return []
        return services
            .slice(selectedIndex, selectedIndex + 6)
            .map(s => ({ id: s.id, date: s.service_date, count: getAttendancesByService(s.id).length }))
            .reverse()
    }, [selectedIndex, services])

    const trendChartData = {
        labels: trendWindow.map(w => new Date(w.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })),
        datasets: [{
            label: 'Asistentes',
            data: trendWindow.map(w => w.count),
            backgroundColor: trendWindow.map(w => w.id === selectedServiceId ? '#2696D2' : 'rgba(38,150,210,0.25)'),
            borderRadius: 6,
            borderSkipped: false,
        }]
    }

    const trendChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Outfit', size: 11 }, color: '#6E6E6E' } },
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Outfit', size: 11 }, color: '#6E6E6E' }, grid: { color: 'rgba(0,0,0,0.04)' } },
        },
    }

    const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    const formatDate = (dateStr) => new Date(dateStr + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })

    const exportToPDF = () => {
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.setTextColor(44, 62, 80)
        doc.text('Reporte de Asistencia', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(127, 140, 141)
        doc.text(`${selectedService?.name} — ${formatDate(selectedService?.service_date || '')}`, 14, 30)
        doc.text(`Total asistentes: ${filtered.length}`, 14, 37)

        doc.autoTable({
            startY: 44,
            head: [['#', 'Nombre', 'Tipo', 'Ministerio', 'Hora', 'Método']],
            body: filtered.map((r, i) => [i + 1, r.memberName, r.memberType, r.memberGroup, formatTime(r.check_in_time), r.method === 'facial' ? 'Facial' : 'Manual']),
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [74, 111, 165], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 246, 255] },
        })

        doc.save(`Asistencia_${selectedService?.service_date || 'reporte'}.pdf`)
    }

    const exportToExcel = () => {
        const wsData = [
            ['Reporte de Asistencia - Refugio App'],
            [`Servicio: ${selectedService?.name}`, `Fecha: ${formatDate(selectedService?.service_date || '')}`],
            [],
            ['#', 'Nombre', 'Tipo de Miembro', 'Ministerio', 'Hora de Ingreso', 'Método', 'Tipo Asistencia'],
            ...filtered.map((r, i) => [i + 1, r.memberName, r.memberType, r.memberGroup, formatTime(r.check_in_time), r.method, r.attendance_type])
        ]
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 10 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(wb, ws, 'Asistencia')
        XLSX.writeFile(wb, `Asistencia_${selectedService?.service_date || 'reporte'}.xlsx`)
    }

    const memberTypes = [...new Set(reportData.map(r => r.memberType))]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111111]">Reportes de Asistencia</h1>
                    <p className="text-[#6E6E6E] mt-1">Generar y exportar reportes del sistema</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #E74C3C, #C0392B)' }}>
                        <FileText className="w-4 h-4" /> PDF
                    </button>
                    <button onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #13CD68, #0FA855)' }}>
                        <Table className="w-4 h-4" /> Excel
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">
                        <CalendarDays className="w-4 h-4 inline mr-1" /> Servicio
                    </label>
                    <select value={selectedServiceId} onChange={(e) => { setSelectedServiceId(e.target.value); setFilterType('') }}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-[#111111] focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                        {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name} — {formatDate(s.service_date)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#111111] mb-1.5">
                        <Filter className="w-4 h-4 inline mr-1" /> Tipo de Miembro
                    </label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-white text-[#111111] focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                        <option value="">Todos</option>
                        {memberTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* Resumen tipo Dashboard del servicio seleccionado */}
            {selectedService && (
                <div className="space-y-4 animate-fade-in">
                    <h2 className="text-lg font-semibold text-[#111111] flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#2696D2]" /> Resumen del Domingo — {formatDate(selectedService.service_date)}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-2xl p-5 text-white shadow-[0_2px_12px_rgba(38,150,210,0.08)]" style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                {previousService && (
                                    <div className="flex items-center gap-1 text-xs font-medium text-white/80">
                                        <TrendIcon className="w-3.5 h-3.5" />
                                        <span>{trendPercent > 0 ? '+' : ''}{trendPercent}%</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-3xl font-bold">{reportData.length}</p>
                            <p className="text-sm text-white/80 mt-1">Asistentes Totales</p>
                            {previousService && <p className="text-xs text-white/60 mt-1">vs. domingo anterior ({previousCount})</p>}
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                            <div className="w-10 h-10 rounded-xl bg-[#E1F9EC] flex items-center justify-center mb-3">
                                <BarChart3 className="w-5 h-5 text-[#13CD68]" />
                            </div>
                            <p className="text-3xl font-bold text-[#111111]">{attendanceRate}%</p>
                            <p className="text-sm text-[#6E6E6E] mt-1">Tasa de Asistencia</p>
                            <p className="text-xs text-[#6E6E6E]/70 mt-1">de {activeMembers.length} miembros activos</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                            <div className="w-10 h-10 rounded-xl bg-[#FADBD8] flex items-center justify-center mb-3">
                                <UserX className="w-5 h-5 text-[#E74C3C]" />
                            </div>
                            <p className="text-3xl font-bold text-[#111111]">{absentMembers.length}</p>
                            <p className="text-sm text-[#6E6E6E] mt-1">Ausentes Este Domingo</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                            <div className="w-10 h-10 rounded-xl bg-[#E8F4FC] flex items-center justify-center mb-3">
                                <CalendarDays className="w-5 h-5 text-[#2696D2]" />
                            </div>
                            <p className="text-base font-bold text-[#111111] truncate">{selectedService.pastor_name || 'Sin pastor asignado'}</p>
                            <p className="text-sm text-[#6E6E6E] mt-1">{selectedService.starts_at} - {selectedService.ends_at}</p>
                        </div>
                    </div>

                    {/* Mini tendencia */}
                    {trendWindow.length > 1 && (
                        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                            <h3 className="text-sm font-semibold text-[#111111] mb-4">Tendencia — Últimas Semanas</h3>
                            <div style={{ height: '180px' }}>
                                <Bar data={trendChartData} options={trendChartOptions} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary */}
            <h2 className="text-lg font-semibold text-[#111111] flex items-center gap-2">
                <Table className="w-5 h-5 text-[#2696D2]" /> Detalle del Reporte
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#E8F4FC] rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#2696D2]">{filtered.length}</p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Total Asistentes</p>
                </div>
                <div className="bg-[#E1F9EC] rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#13CD68]">{filtered.filter(r => r.method === 'manual').length}</p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Registro Manual</p>
                </div>
                <div className="bg-[#FFF3CD] rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#E8A838]">{filtered.filter(r => r.method === 'facial').length}</p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Reconocimiento Facial</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-[#111111]">{filtered.filter(r => r.attendance_type === 'presencial').length}</p>
                    <p className="text-xs text-[#6E6E6E] mt-1">Presenciales</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">#</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Nombre</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider hidden md:table-cell">Tipo</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider hidden lg:table-cell">Ministerio</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Hora</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-[#6E6E6E] uppercase tracking-wider">Método</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((r, i) => (
                                <tr key={r.id} className="hover:bg-[#E8F4FC]/50 transition-colors">
                                    <td className="px-6 py-3.5 text-sm text-[#6E6E6E]">{i + 1}</td>
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#2696D2] flex items-center justify-center text-white text-xs font-semibold">{r.memberName.charAt(0)}</div>
                                            <span className="text-sm font-medium text-[#111111]">{r.memberName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 hidden md:table-cell">
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#E8F4FC] text-[#2696D2] font-medium">{r.memberType}</span>
                                    </td>
                                    <td className="px-6 py-3.5 hidden lg:table-cell text-sm text-[#6E6E6E]">{r.memberGroup}</td>
                                    <td className="px-6 py-3.5 text-sm font-medium text-[#111111]">{formatTime(r.check_in_time)}</td>
                                    <td className="px-6 py-3.5">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.method === 'facial' ? 'bg-[#E8A838]/10 text-[#E8A838]' : 'bg-[#E1F9EC] text-[#13CD68]'}`}>
                                            {r.method === 'facial' ? '🤖 Facial' : '✋ Manual'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
