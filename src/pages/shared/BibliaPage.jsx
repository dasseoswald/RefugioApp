import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Search, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react'

const TRANSLATIONS = [
    { code: 'NTV', label: 'NTV — Nueva Traducción Viviente' },
    { code: 'PDT', label: 'PDT — Palabra de Dios para Todos' },
    { code: 'RV1960', label: 'RVR1960 — Reina Valera 1960' },
    { code: 'NVI', label: 'NVI — Nueva Versión Internacional' },
    { code: 'LBLA', label: 'LBLA — La Biblia de las Américas' },
]

const OLD_TESTAMENT_LAST_ID = 39

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripHtml(html) {
    return html
        .replace(/<\/(p|div)>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .trim()
}

function highlightMatch(text, term) {
    const plain = stripHtml(text)
    if (!term.trim()) return plain
    const parts = plain.split(new RegExp(`(${escapeRegExp(term)})`, 'gi'))
    return parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase()
            ? <mark key={i} className="bg-[#FFE8A3] text-[#111111] rounded px-0.5">{part}</mark>
            : part
    )
}

export default function BibliaPage() {
    const [translation, setTranslation] = useState('NTV')
    const [books, setBooks] = useState([])
    const [bookId, setBookId] = useState(43) // Juan
    const [chapter, setChapter] = useState(1)
    const [verses, setVerses] = useState([])
    const [loadingVerses, setLoadingVerses] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const [searchInput, setSearchInput] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState(null)
    const [searching, setSearching] = useState(false)

    const currentBook = books.find(b => b.bookid === bookId)
    const bookIndex = books.findIndex(b => b.bookid === bookId)

    useEffect(() => {
        fetch(`https://bolls.life/get-books/${translation}/`)
            .then(res => res.json())
            .then(data => setBooks(data))
            .catch(() => setErrorMsg('No se pudo cargar la lista de libros.'))
    }, [translation])

    useEffect(() => {
        setLoadingVerses(true)
        setErrorMsg('')
        fetch(`https://bolls.life/get-text/${translation}/${bookId}/${chapter}/`)
            .then(res => res.json())
            .then(data => { setVerses(data); setLoadingVerses(false) })
            .catch(() => { setErrorMsg('No se pudo cargar el capítulo. Intenta de nuevo.'); setLoadingVerses(false) })
    }, [translation, bookId, chapter])

    const goToChapter = useCallback((direction) => {
        if (!currentBook) return
        const nextChapter = chapter + direction
        if (nextChapter >= 1 && nextChapter <= currentBook.chapters) {
            setChapter(nextChapter)
            return
        }
        const nextBook = books[bookIndex + direction]
        if (nextBook) {
            setBookId(nextBook.bookid)
            setChapter(direction > 0 ? 1 : nextBook.chapters)
        }
    }, [chapter, currentBook, books, bookIndex])

    const handleSearch = (e) => {
        e.preventDefault()
        const term = searchInput.trim()
        if (!term) return
        setSearching(true)
        setSearchTerm(term)
        fetch(`https://bolls.life/v2/find/${translation}?search=${encodeURIComponent(term)}&limit=25`)
            .then(res => res.json())
            .then(data => { setSearchResults(data.results || []); setSearching(false) })
            .catch(() => { setErrorMsg('No se pudo completar la búsqueda.'); setSearching(false) })
    }

    const clearSearch = () => {
        setSearchInput('')
        setSearchTerm('')
        setSearchResults(null)
    }

    const goToVerse = (result) => {
        setBookId(result.book)
        setChapter(result.chapter)
        clearSearch()
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Biblia</h1>
                <p className="text-[#6E6E6E] mt-1">Lee y busca la Palabra en varias traducciones</p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <select value={translation} onChange={(e) => setTranslation(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-[#111111] focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                        {TRANSLATIONS.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                    <select value={bookId} onChange={(e) => { setBookId(Number(e.target.value)); setChapter(1) }}
                        className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-[#111111] focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer flex-1">
                        <optgroup label="Antiguo Testamento">
                            {books.filter(b => b.bookid <= OLD_TESTAMENT_LAST_ID).map(b => (
                                <option key={b.bookid} value={b.bookid}>{b.name}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Nuevo Testamento">
                            {books.filter(b => b.bookid > OLD_TESTAMENT_LAST_ID).map(b => (
                                <option key={b.bookid} value={b.bookid}>{b.name}</option>
                            ))}
                        </optgroup>
                    </select>
                    <select value={chapter} onChange={(e) => setChapter(Number(e.target.value))}
                        className="px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-[#111111] focus:outline-none focus:border-[#2696D2] text-sm cursor-pointer">
                        {currentBook && Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(c => (
                            <option key={c} value={c}>Capítulo {c}</option>
                        ))}
                    </select>
                </div>

                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
                    <input
                        type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Buscar palabra o frase en toda la Biblia..."
                        className="w-full pl-11 pr-10 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-[#111111] placeholder:text-[#6E6E6E]/50 focus:outline-none focus:border-[#2696D2] transition-all text-sm" />
                    {searchTerm && (
                        <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6E6E] hover:text-[#111111] cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </form>
            </div>

            {errorMsg && (
                <div className="bg-[#FADBD8] text-[#E74C3C] text-sm px-4 py-3 rounded-xl">{errorMsg}</div>
            )}

            {/* Search results */}
            {searchResults !== null ? (
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6">
                    <h2 className="text-sm font-semibold text-[#6E6E6E] uppercase tracking-wider mb-4">
                        {searching ? 'Buscando...' : `${searchResults.length} resultados para "${searchTerm}"`}
                    </h2>
                    {searching ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#2696D2] animate-spin" /></div>
                    ) : searchResults.length === 0 ? (
                        <p className="text-[#6E6E6E] text-sm">No se encontraron versículos.</p>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {searchResults.map(r => (
                                <li key={r.pk}>
                                    <button onClick={() => goToVerse(r)} className="w-full text-left py-3 hover:bg-[#E8F4FC]/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
                                        <span className="text-xs font-semibold text-[#2696D2]">
                                            {books.find(b => b.bookid === r.book)?.name || `Libro ${r.book}`} {r.chapter}:{r.verse}
                                        </span>
                                        <p className="text-sm text-[#111111] mt-1">{highlightMatch(r.text, searchTerm)}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                /* Chapter reader */
                <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <button onClick={() => goToChapter(-1)} className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 text-[#111111] font-semibold">
                            <BookOpen className="w-4 h-4 text-[#2696D2]" />
                            {currentBook?.name} {chapter}
                        </div>
                        <button onClick={() => goToChapter(1)} className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="px-6 py-6">
                        {loadingVerses ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#2696D2] animate-spin" /></div>
                        ) : (
                            <div className="space-y-3">
                                {verses.map(v => (
                                    <p key={v.pk} className="text-[#111111] leading-relaxed whitespace-pre-line">
                                        <span className="text-xs font-bold text-[#2696D2] align-super mr-1">{v.verse}</span>
                                        {stripHtml(v.text)}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
