import { useState, useRef, useEffect } from 'react'
import { getMembers } from '../../data/mockData.js'

// Typeahead reutilizable de miembros: a medida que se escribe, sugiere
// coincidencias por nombre. Al elegir una sugerencia, `onSelectMember` recibe
// el miembro completo; si la persona sigue escribiendo texto libre sin elegir
// ninguna sugerencia, `onSelectMember` recibe null (queda como texto libre,
// útil para nombres de gente que todavía no es miembro registrado).
export default function MemberAutocomplete({ value, onChange, onSelectMember, placeholder, className }) {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setShowSuggestions(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const query = value.trim().toLowerCase()
    const suggestions = query.length > 0
        ? getMembers().filter(m => m.is_active && m.full_name.toLowerCase().includes(query)).slice(0, 8)
        : []

    const handleInputChange = (e) => {
        onChange(e.target.value)
        onSelectMember(null)
        setShowSuggestions(true)
    }

    const handleSelect = (member) => {
        onChange(member.full_name)
        onSelectMember(member)
        setShowSuggestions(false)
    }

    return (
        <div ref={containerRef} className={`relative ${className || ''}`}>
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm"
            />
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-56 overflow-y-auto">
                    {suggestions.map(m => (
                        <button key={m.id} type="button" onClick={() => handleSelect(m)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 cursor-pointer">
                            <div className="w-7 h-7 rounded-full bg-[#2696D2] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {m.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[#111111] truncate">{m.full_name}</p>
                                <p className="text-xs text-[#6E6E6E]">{m.member_type}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
