import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { listenToForumPosts, listenToForumReplies, createForumPost, createForumReply, deleteForumPost, deleteForumReply } from '../../data/mockData.js'
import { MessageCircleQuestion, Send, EyeOff, ChevronDown, ChevronUp, Trash2, User } from 'lucide-react'

export default function ForumPage() {
    const { user } = useAuth()
    const [posts, setPosts] = useState([])
    const [replies, setReplies] = useState([])
    const [content, setContent] = useState('')
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [expandedId, setExpandedId] = useState(null)
    const [replyDrafts, setReplyDrafts] = useState({})
    const [replyAnonDrafts, setReplyAnonDrafts] = useState({})

    useEffect(() => {
        const unsubPosts = listenToForumPosts(setPosts)
        const unsubReplies = listenToForumReplies(setReplies)
        return () => { unsubPosts(); unsubReplies() }
    }, [])

    const handleSubmitPost = () => {
        if (!content.trim()) return
        createForumPost({ content: content.trim(), authorId: user?.id, authorName: user?.name, isAnonymous })
        setContent('')
        setIsAnonymous(false)
    }

    const handleSubmitReply = (postId) => {
        const draft = (replyDrafts[postId] || '').trim()
        if (!draft) return
        createForumReply({ postId, content: draft, authorId: user?.id, authorName: user?.name, isAnonymous: !!replyAnonDrafts[postId] })
        setReplyDrafts(prev => ({ ...prev, [postId]: '' }))
    }

    const repliesForPost = (postId) => replies.filter(r => r.post_id === postId)
    const canDelete = (item) => user?.role === 'admin' || item.author_id === user?.id

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2696D2 0%, #111111 100%)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }}></div>
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <MessageCircleQuestion className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Foro de Preguntas</h1>
                        <p className="text-white/70 text-sm mt-1">Un espacio abierto para preguntar, con opción de hacerlo de forma anónima</p>
                    </div>
                </div>
            </div>

            {/* Compose */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-6 space-y-4">
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3}
                    placeholder="Escribe tu pregunta para la comunidad..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all text-sm resize-none" />
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-sm text-[#6E6E6E] cursor-pointer select-none">
                        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="w-4 h-4 rounded border-2 border-gray-300 cursor-pointer" />
                        <EyeOff className="w-4 h-4" /> Publicar de forma anónima
                    </label>
                    <button onClick={handleSubmitPost} disabled={!content.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                        <Send className="w-4 h-4" /> Publicar Pregunta
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {posts.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-[0_2px_12px_rgba(38,150,210,0.08)]">
                        <MessageCircleQuestion className="w-12 h-12 mx-auto mb-3 text-[#6E6E6E]/20" />
                        <p className="text-lg font-medium text-[#6E6E6E]">Aún no hay preguntas — ¡sé el primero!</p>
                    </div>
                ) : (
                    posts.map(post => {
                        const postReplies = repliesForPost(post.id)
                        const isExpanded = expandedId === post.id
                        const displayName = post.is_anonymous ? 'Anónimo' : (post.author_name || 'Sin nombre')
                        return (
                            <div key={post.id} className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(38,150,210,0.08)] p-5">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${post.is_anonymous ? 'bg-[#6E6E6E]' : ''}`}
                                            style={!post.is_anonymous ? { background: '#2696D2' } : {}}>
                                            {post.is_anonymous ? <User className="w-4 h-4" /> : displayName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#111111]">{displayName}</p>
                                            <span className="text-xs text-[#6E6E6E]">{formatDate(post.created_at)}</span>
                                        </div>
                                    </div>
                                    {canDelete(post) && (
                                        <button onClick={() => deleteForumPost(post.id)} title="Eliminar pregunta"
                                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0">
                                            <Trash2 className="w-4 h-4 text-[#E74C3C]" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-[#1F1F1F] leading-relaxed mb-3">{post.content}</p>
                                <button onClick={() => setExpandedId(isExpanded ? null : post.id)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#2696D2] cursor-pointer">
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    {postReplies.length > 0 ? `${postReplies.length} ${postReplies.length === 1 ? 'respuesta' : 'respuestas'}` : 'Responder'}
                                </button>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                        {postReplies.map(reply => {
                                            const replyName = reply.is_anonymous ? 'Anónimo' : (reply.author_name || 'Sin nombre')
                                            return (
                                                <div key={reply.id} className="flex items-start justify-between gap-3 bg-gray-50/70 rounded-xl px-4 py-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-[#111111]">{replyName} <span className="font-normal text-[#6E6E6E]">· {formatDate(reply.created_at)}</span></p>
                                                        <p className="text-sm text-[#1F1F1F] mt-0.5">{reply.content}</p>
                                                    </div>
                                                    {canDelete(reply) && (
                                                        <button onClick={() => deleteForumReply(reply.id)} title="Eliminar respuesta"
                                                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0">
                                                            <Trash2 className="w-3.5 h-3.5 text-[#E74C3C]" />
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={replyDrafts[post.id] || ''}
                                                onChange={(e) => setReplyDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitReply(post.id) }}
                                                placeholder="Escribe una respuesta..."
                                                className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm focus:outline-none focus:border-[#2696D2]" />
                                            <label className="flex items-center gap-1.5 text-xs text-[#6E6E6E] cursor-pointer select-none flex-shrink-0" title="Responder de forma anónima">
                                                <input type="checkbox" checked={!!replyAnonDrafts[post.id]}
                                                    onChange={(e) => setReplyAnonDrafts(prev => ({ ...prev, [post.id]: e.target.checked }))}
                                                    className="w-3.5 h-3.5 rounded border-2 border-gray-300 cursor-pointer" />
                                                <EyeOff className="w-3.5 h-3.5" />
                                            </label>
                                            <button onClick={() => handleSubmitReply(post.id)} disabled={!(replyDrafts[post.id] || '').trim()}
                                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
