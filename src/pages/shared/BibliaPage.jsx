import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
    subscribeBibleAnnotations, setVerseHighlight, addVerseComment, deleteVerseComment,
} from '../../data/mockData.js'
import {
    BookOpen, Search, ChevronLeft, ChevronRight, X, Loader2,
    Highlighter, MessageSquare, Share2, Trash2, Send, Check,
} from 'lucide-react'

// Paleta de colores para destacar versículos (cada persona elige el suyo).
const HIGHLIGHT_COLORS = [
    { id: 'yellow', bg: '#FFF3CD', swatch: '#F5C518' },
    { id: 'green', bg: '#D9F7E3', swatch: '#13CD68' },
    { id: 'blue', bg: '#DCEEFB', swatch: '#2696D2' },
    { id: 'pink', bg: '#FBE1EE', swatch: '#E85D9C' },
    { id: 'orange', bg: '#FDE6D0', swatch: '#E8A838' },
]
const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_COLORS[0]
const colorInfo = (id) => HIGHLIGHT_COLORS.find(c => c.id === id) || DEFAULT_HIGHLIGHT_COLOR

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
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'
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

    // Destacados y comentarios son colaborativos entre todos los usuarios y
    // no dependen de la traducción (aplican al versículo, no al texto exacto
    // de una traducción en particular) — se vuelven a suscribir solo cuando
    // cambia el libro o el capítulo que se está leyendo.
    const [annotations, setAnnotations] = useState({ highlights: [], comments: [] })
    const [openCommentsVerse, setOpenCommentsVerse] = useState(null)
    const [colorPickerVerse, setColorPickerVerse] = useState(null)
    const [commentDraft, setCommentDraft] = useState('')
    const [copiedVerse, setCopiedVerse] = useState(null)

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

    useEffect(() => {
        setOpenCommentsVerse(null)
        setColorPickerVerse(null)
        const unsubscribe = subscribeBibleAnnotations(bookId, chapter, setAnnotations)
        return unsubscribe
    }, [bookId, chapter])

    const highlightsFor = (verseNum) => annotations.highlights.filter(h => h.verse === verseNum)
    const commentsFor = (verseNum) => annotations.comments.filter(c => c.verse === verseNum)

    const handleSetHighlight = (verseNum, color) => {
        const mine = highlightsFor(verseNum).find(h => h.author_uid === user.auth_uid)
        setVerseHighlight(bookId, chapter, verseNum, { auth_uid: user.auth_uid, name: user.name, color, currentColor: mine?.color })
        setColorPickerVerse(null)
    }

    const handleAddComment = (verseNum) => {
        if (!commentDraft.trim()) return
        addVerseComment(bookId, chapter, verseNum, {
            content: commentDraft.trim(),
            author_id: user.id,
            author_name: user.name,
            author_photo: user.photo_url,
            author_uid: user.auth_uid,
        })
        setCommentDraft('')
    }

    const handleShare = async (verseNum, text) => {
        const shareText = `${currentBook?.name} ${chapter}:${verseNum} (${translation})\n"${text}"`
        if (navigator.share) {
            navigator.share({ text: shareText }).catch(() => {})
            return
        }
        try {
            await navigator.clipboard.writeText(shareText)
            setCopiedVerse(verseNum)
            setTimeout(() => setCopiedVerse(null), 2000)
        } catch {
            setErrorMsg('No se pudo copiar el versículo.')
        }
    }

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
                            <div className="space-y-1">
                                {verses.map(v => {
                                    const text = stripHtml(v.text)
                                    const verseHighlights = highlightsFor(v.verse)
                                    const verseComments = commentsFor(v.verse)
                                    const mineHighlight = verseHighlights.find(h => h.author_uid === user.auth_uid)
                                    // Se ve el color propio si uno destacó; si no, el de la
                                    // destacada más reciente de otra persona (para que igual
                                    // se note que alguien de la comunidad lo marcó).
                                    const displayHighlight = mineHighlight || verseHighlights[verseHighlights.length - 1]
                                    const isOpen = openCommentsVerse === v.verse
                                    const isPickingColor = colorPickerVerse === v.verse

                                    return (
                                        <div key={v.pk} className="rounded-lg -mx-2 px-2 py-1.5">
                                            <p className="text-[#111111] leading-relaxed whitespace-pre-line rounded px-1 -mx-1"
                                                style={displayHighlight ? { background: colorInfo(displayHighlight.color).bg } : {}}>
                                                <span className="text-xs font-bold text-[#2696D2] align-super mr-1">{v.verse}</span>
                                                {text}
                                            </p>

                                            <div className="relative flex items-center gap-4 mt-1 flex-wrap text-xs">
                                                <button onClick={() => setColorPickerVerse(isPickingColor ? null : v.verse)}
                                                    className={`flex items-center gap-1 cursor-pointer font-medium ${mineHighlight ? '' : 'text-[#6E6E6E] hover:text-[#111111]'}`}
                                                    style={mineHighlight ? { color: colorInfo(mineHighlight.color).swatch } : {}}>
                                                    <Highlighter className="w-3.5 h-3.5" />
                                                    {verseHighlights.length > 0 ? `Destacado (${verseHighlights.length})` : 'Destacar'}
                                                </button>
                                                <button onClick={() => setOpenCommentsVerse(isOpen ? null : v.verse)}
                                                    className={`flex items-center gap-1 cursor-pointer font-medium ${isOpen ? 'text-[#2696D2]' : 'text-[#6E6E6E] hover:text-[#111111]'}`}>
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    {verseComments.length > 0 ? `Comentarios (${verseComments.length})` : 'Comentar'}
                                                </button>
                                                <button onClick={() => handleShare(v.verse, text)} className="flex items-center gap-1 cursor-pointer font-medium text-[#6E6E6E] hover:text-[#111111]">
                                                    {copiedVerse === v.verse ? <Check className="w-3.5 h-3.5 text-[#13CD68]" /> : <Share2 className="w-3.5 h-3.5" />}
                                                    {copiedVerse === v.verse ? 'Copiado' : 'Compartir'}
                                                </button>

                                                {isPickingColor && (
                                                    <div className="absolute top-6 left-0 z-10 flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-100 shadow-lg">
                                                        {HIGHLIGHT_COLORS.map(c => (
                                                            <button key={c.id} onClick={() => handleSetHighlight(v.verse, c.id)} title={c.id}
                                                                className="w-6 h-6 rounded-full cursor-pointer flex items-center justify-center border-2 transition-transform hover:scale-110"
                                                                style={{ background: c.swatch, borderColor: mineHighlight?.color === c.id ? '#111111' : 'transparent' }}>
                                                                {mineHighlight?.color === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                                                            </button>
                                                        ))}
                                                        {mineHighlight && (
                                                            <button onClick={() => handleSetHighlight(v.verse, mineHighlight.color)} title="Quitar destacado"
                                                                className="w-6 h-6 rounded-full cursor-pointer flex items-center justify-center border-2 border-gray-200 text-[#6E6E6E] hover:text-[#E74C3C] hover:border-[#E74C3C]">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {isOpen && (
                                                <div className="mt-2 mb-1 p-3 bg-gray-50 rounded-xl space-y-2.5">
                                                    {verseComments.length === 0 ? (
                                                        <p className="text-xs text-[#6E6E6E]">Todavía no hay comentarios en este versículo.</p>
                                                    ) : (
                                                        verseComments.map(c => (
                                                            <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
                                                                <p className="text-[#111111]"><span className="font-semibold">{c.author_name}: </span>{c.content}</p>
                                                                {(c.author_uid === user.auth_uid || isAdmin) && (
                                                                    <button onClick={() => deleteVerseComment(c.id)} title="Borrar comentario"
                                                                        className="text-[#6E6E6E] hover:text-[#E74C3C] cursor-pointer flex-shrink-0">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <input type="text" value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(v.verse)}
                                                            placeholder="Escribe un comentario..."
                                                            className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-100 bg-white text-sm focus:outline-none focus:border-[#2696D2]" />
                                                        <button onClick={() => handleAddComment(v.verse)} disabled={!commentDraft.trim()}
                                                            className="p-2 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" style={{ background: '#2696D2' }}>
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
