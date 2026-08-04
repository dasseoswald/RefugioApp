import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { getMembers } from '../../data/mockData.js'

// Typeahead reutilizable de miembros: a medida que se escribe, sugiere
// coincidencias por nombre. Al elegir una sugerencia, `onSelectMember` recibe
// el miembro completo; si la persona sigue escribiendo texto libre sin elegir
// ninguna sugerencia, `onSelectMember` recibe null (queda como texto libre,
// útil para nombres de gente que todavía no es miembro registrado).
//
// El menú de sugerencias se renderiza en un portal a document.body (con
// position: fixed calculado desde el input) en vez de con position: absolute
// dentro del propio contenedor — así no lo recorta un ancestro con
// overflow-hidden/overflow-y-auto, como pasa dentro de Modal.jsx.
export default function MemberAutocomplete({ value, onChange, onSelectMember, placeholder, className }) {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [position, setPosition] = useState(null)
    const containerRef = useRef(null)
    const inputRef = useRef(null)
    const dropdownRef = useRef(null)

    const updatePosition = useCallback(() => {
        if (!inputRef.current) return
        const rect = inputRef.current.getBoundingClientRect()
        setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }, [])

    useEffect(() => {
        const handleClickOutside = (e) => {
            const insideInput = containerRef.current && containerRef.current.contains(e.target)
            const insideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target)
            if (!insideInput && !insideDropdown) setShowSuggestions(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!showSuggestions) return
        updatePosition()
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
        return () => {
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [showSuggestions, updatePosition])

    const query = value.trim().toLowerCase()
    const suggestions = query.length > 0
        ? getMembers().filter(m => m.is_active && m.full_name.toLowerCase().includes(query)).slice(0, 8)
        : []

    const handleInputChange = (e) => {
        onChange(e.target.value)
        onSelectMember(null)
        setShowSuggestions(true)
    }

    const handleFocus = () => {
        updatePosition()
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
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={handleFocus}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white focus:outline-none focus:border-[#2696D2] text-sm"
            />
            {showSuggestions && suggestions.length > 0 && position && createPortal(
                <div
                    ref={dropdownRef}
                    style={{ position: 'fixed', top: position.top, left: position.left, width: position.width, zIndex: 200 }}
                    className="bg-white rounded-xl shadow-lg border border-gray-100 max-h-56 overflow-y-auto"
                >
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
                </div>,
                document.body
            )}
        </div>
    )
}
