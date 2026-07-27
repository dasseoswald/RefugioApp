import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getUsers, getMembers, createUser, updateUserProfile } from '../../data/mockData.js'
import UserAvatar from '../../components/ui/UserAvatar.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { Shield, UserPlus, Edit2, Mail, UserCheck, CheckCircle2 } from 'lucide-react'

const EMPTY_FORM = { name: '', email: '', role: 'attendee', member_id: '' }

export default function UsersPage() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [members, setMembers] = useState([])
    const [notification, setNotification] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [formError, setFormError] = useState('')

    useEffect(() => {
        refreshData()
    }, [])

    const refreshData = () => {
        setUsers(getUsers())
        setMembers(getMembers())
    }

    const roleConfig = {
        admin: { label: 'Administrador', color: '#2696D2', bg: '#E8F4FC' },
        controller: { label: 'Controlador', color: '#13CD68', bg: '#E1F9EC' },
        attendee: { label: 'Asistente', color: '#E8A838', bg: '#FFF3CD' },
    }

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 3000)
    }

    const openCreateModal = () => {
        setForm(EMPTY_FORM)
        setFormError('')
        setShowCreateModal(true)
    }

    const handleCreateUser = () => {
        setFormError('')
        if (!form.name.trim() || !form.email.trim()) {
            setFormError('Nombre y correo electrónico son obligatorios')
            return
        }
        const result = createUser({
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            member_id: form.member_id || null,
        })
        if (result.error) {
            setFormError(result.error)
            return
        }
        setShowCreateModal(false)
        refreshData()
        showNotification(`Usuario ${result.data.name} creado como ${roleConfig[result.data.role].label}`)
    }

    const handleChangeRole = (targetUser, newRole) => {
        if (newRole === targetUser.role) return
        updateUserProfile(targetUser.id, { role: newRole })
        refreshData()
        showNotification(`${targetUser.name} ahora es ${roleConfig[newRole].label}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111111]">Gestión de Usuarios</h1>
                    <p className="text-[#6E6E6E] mt-1">Administrar cuentas y roles de acceso</p>
                </div>
                <button onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                    <UserPlus className="w-4 h-4" /> Nuevo Usuario
                </button>
            </div>

            {notification && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#E1F9EC] text-[#111111] animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-[#13CD68]" />
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            )}

            {/* Users grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {users.map((user) => {
                    const member = members.find(m => m.id === user.member_id)
                    const role = roleConfig[user.role]
                    return (
                        <div key={user.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 hover:shadow-[0_8px_24px_rgba(38,150,210,0.15)] transition-all hover:-translate-y-0.5">
                            <div className="flex items-start gap-4">
                                <UserAvatar
                                    photoUrl={user.photo_url}
                                    name={user.name}
                                    size="md"
                                    bgColor={role.color}
                                    className="rounded-2xl"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-[#111111] truncate">{user.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1 text-[#6E6E6E]">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="text-xs truncate">{user.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                                {user.id === currentUser?.id ? (
                                    <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: role.bg, color: role.color }}>
                                        <Shield className="w-3 h-3 inline mr-1" />{role.label}
                                    </span>
                                ) : (
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleChangeRole(user, e.target.value)}
                                        className="text-xs px-2.5 py-1.5 rounded-full font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1"
                                        style={{ background: role.bg, color: role.color }}
                                        title="Cambiar rol"
                                    >
                                        <option value="attendee">Asistente</option>
                                        <option value="controller">Controlador</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                )}
                                {member && (
                                    <span className="text-xs text-[#6E6E6E] flex items-center gap-1 flex-shrink-0">
                                        <UserCheck className="w-3.5 h-3.5" /> {member.member_type}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Roles explanation */}
            <div className="bg-[#E8F4FC] rounded-2xl p-6">
                <h3 className="text-base font-semibold text-[#111111] mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#2696D2]" /> Matriz de Permisos
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="text-left px-4 py-2 text-[#6E6E6E] font-medium">Permiso</th>
                                <th className="text-center px-4 py-2 font-medium" style={{ color: '#E8A838' }}>Asistente</th>
                                <th className="text-center px-4 py-2 font-medium" style={{ color: '#13CD68' }}>Controlador</th>
                                <th className="text-center px-4 py-2 font-medium" style={{ color: '#2696D2' }}>Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white">
                            {[
                                ['Registrar propia asistencia', true, true, true],
                                ['Registrar asistencia de terceros', false, true, true],
                                ['Gestión de miembros', false, true, true],
                                ['Ver reportes', false, true, true],
                                ['Exportar PDF/Excel', false, true, true],
                                ['Gestionar servicios', false, false, true],
                                ['Gestionar usuarios', false, false, true],
                                ['Crear otro Administrador', false, false, true],
                                ['Enviar mensajes a todos los grupos', false, false, true],
                                ['Configurar sistema', false, false, true],
                            ].map(([perm, att, ctrl, admin]) => (
                                <tr key={perm} className="hover:bg-white/60 transition-colors">
                                    <td className="px-4 py-2.5 text-[#111111] font-medium">{perm}</td>
                                    <td className="text-center px-4 py-2.5">{att ? '✅' : '❌'}</td>
                                    <td className="text-center px-4 py-2.5">{ctrl ? '✅' : '❌'}</td>
                                    <td className="text-center px-4 py-2.5">{admin ? '✅' : '❌'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Usuario">
                <div className="space-y-4">
                    {form.role === 'admin' && (
                        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[#E8F4FC] text-xs text-[#111111]">
                            <Shield className="w-4 h-4 text-[#2696D2] flex-shrink-0 mt-0.5" />
                            <span>Estás creando otra cuenta de <strong>Administrador</strong> como {currentUser?.name}. Solo administradores pueden otorgar este rol.</span>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Nombre Completo *</label>
                        <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ej: Pedro Sánchez" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Correo Electrónico *</label>
                        <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="correo@ejemplo.com" className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Rol *</label>
                        <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            <option value="attendee">Asistente</option>
                            <option value="controller">Controlador</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#111111] mb-1.5">Vincular a Miembro (opcional)</label>
                        <select value={form.member_id} onChange={(e) => setForm(f => ({ ...f, member_id: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                            <option value="">Sin vincular</option>
                            {members.filter(m => !users.some(u => u.member_id === m.id)).map(m => (
                                <option key={m.id} value={m.id}>{m.full_name}</option>
                            ))}
                        </select>
                    </div>
                    {formError && (
                        <div className="bg-[#FADBD8] text-[#E74C3C] text-sm px-4 py-3 rounded-xl">{formError}</div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 cursor-pointer">Cancelar</button>
                    <button onClick={handleCreateUser}
                        className="px-5 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        Crear Usuario
                    </button>
                </div>
            </Modal>
        </div>
    )
}
