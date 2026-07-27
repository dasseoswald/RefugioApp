import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import { getMemberById, getMemberEscuelaProgress } from '../../data/mockData.js';
import { CheckCircle2, XCircle, BookOpen, GraduationCap, Target, Calendar, BarChart3 } from 'lucide-react';

const LEVEL_CONFIG = {
    1: { name: 'Nivel 1', color: '#2696D2', bg: '#E8F4FC' },
    2: { name: 'Nivel 2', color: '#13CD68', bg: '#E1F9EC' },
    3: { name: 'Nivel 3', color: '#E8A838', bg: '#FFF3CD' },
};

export default function MemberEscuelaSummaryModal({ memberId, onClose }) {
    const [member, setMember] = useState(null);
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        if (memberId) {
            setMember(getMemberById(memberId));
            setProgress(getMemberEscuelaProgress(memberId));
        }
    }, [memberId]);

    if (!memberId || !member || !progress) return null;

    const conf = LEVEL_CONFIG[progress.level] || LEVEL_CONFIG[1];

    return (
        <Modal isOpen={!!memberId} onClose={onClose} title="Resumen de Asistencia">
            <div className="space-y-6">
                {/* Header Profile */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-sm" style={{ background: conf.color }}>
                        {member.full_name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#111111]">{member.full_name}</h2>
                        <span className="text-sm font-medium px-2.5 py-1 rounded-full mt-1 inline-block" style={{ background: conf.bg, color: conf.color }}>
                            {conf.name}
                        </span>
                    </div>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-[#6E6E6E] mb-1">
                            <Target className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Progreso</span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: conf.color }}>
                            {progress.percentage}%
                        </p>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${progress.percentage}%`, background: conf.color }}></div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 text-[#6E6E6E] mb-1">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Estado Actual</span>
                        </div>
                        <p className="text-lg font-bold text-[#111111] mt-0.5">
                            Unidad {progress.currentUnit}
                        </p>
                        <p className="text-xs text-[#6E6E6E] mt-1">
                            Clase {progress.currentClassNumber} / {progress.totalClasses}
                        </p>
                    </div>
                </div>

                {/* Completed vs Pending split */}
                <div className="flex gap-4 p-4 rounded-xl" style={{ background: conf.bg }}>
                    <div className="flex-1 text-center border-r border-white/40">
                        <p className="text-2xl font-bold" style={{ color: conf.color }}>{progress.attendedCount}</p>
                        <p className="text-xs font-medium" style={{ color: `${conf.color}99` }}>Completadas</p>
                    </div>
                    <div className="flex-1 text-center">
                        <p className="text-2xl font-bold" style={{ color: conf.color }}>{progress.pendingCount}</p>
                        <p className="text-xs font-medium" style={{ color: `${conf.color}99` }}>Pendientes</p>
                    </div>
                </div>

                {/* History List */}
                <div>
                    <h3 className="text-sm font-semibold text-[#111111] mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Historial de Clases
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {progress.history.map((cls, idx) => (
                            <div key={cls.id} className={`flex items-center justify-between p-3 rounded-xl border ${cls.attended ? 'bg-white border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-[#6E6E6E] mb-0.5">Unidad {cls.unit} • Clase {cls.class_number}</span>
                                    <span className={`text-sm font-semibold ${cls.attended ? 'text-[#111111]' : 'text-[#6E6E6E]'}`}>{cls.topic}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {cls.attended ? (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                            <XCircle className="w-3.5 h-3.5" /> Faltó/Pendiente
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[#6E6E6E] font-medium text-sm hover:bg-gray-50 transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #E2E8F0;
                    border-radius: 10px;
                }
            `}</style>
        </Modal>
    );
}
