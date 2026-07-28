import { useState, useEffect, useRef } from 'react'
import { Radio, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { listenToRadioMessages, sendRadioMessage } from '../../data/mockData.js'
import ChatBox from '../../components/shared/ChatBox.jsx'

const STREAM_URL = 'https://comunikadostreaming.us:10948/;'
const NOW_PLAYING_URL = 'https://comunikadostreaming.us:10948/currentsong?sid=1'

export default function RadioPage() {
    const audioRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [volume, setVolume] = useState(0.8)
    const [muted, setMuted] = useState(false)
    const [nowPlaying, setNowPlaying] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchNowPlaying = () => {
            fetch(NOW_PLAYING_URL)
                .then(res => res.text())
                .then(text => setNowPlaying(text.trim()))
                .catch(() => {})
        }
        fetchNowPlaying()
        const interval = setInterval(fetchNowPlaying, 15000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
    }, [volume, muted])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return
        setError('')
        if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
        } else {
            setIsLoading(true)
            audio.src = `${STREAM_URL}?t=${Date.now()}`
            audio.play()
                .then(() => { setIsPlaying(true); setIsLoading(false) })
                .catch(() => { setError('No se pudo conectar con la radio. Intenta de nuevo.'); setIsLoading(false) })
        }
    }

    return (
        <div className="space-y-6 max-w-xl">
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Radio Refugio</h1>
                <p className="text-[#6E6E6E] mt-1">Escucha la radio de la iglesia en vivo</p>
            </div>

            <div className="rounded-3xl p-8 text-center text-white relative overflow-hidden shadow-lg"
                style={{ background: 'linear-gradient(135deg, #111111, #2696D2)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(20%, -20%)' }}></div>

                <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                        <Radio className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-xl font-bold">Radio Un Refugio Para La Familia</h2>

                    <div className="flex items-center justify-center gap-2 mt-2 mb-6">
                        {isPlaying && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15">
                                <span className="w-2 h-2 rounded-full bg-[#E74C3C] animate-pulse"></span>
                                EN VIVO
                            </span>
                        )}
                    </div>

                    {nowPlaying && (
                        <p className="text-sm text-white/80 mb-6 truncate px-4">🎵 {nowPlaying}</p>
                    )}

                    <button
                        onClick={togglePlay}
                        disabled={isLoading}
                        className="w-20 h-20 mx-auto rounded-full bg-white text-[#2696D2] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-60"
                    >
                        {isLoading ? (
                            <div className="w-7 h-7 border-4 border-[#2696D2]/30 border-t-[#2696D2] rounded-full animate-spin"></div>
                        ) : isPlaying ? (
                            <Pause className="w-8 h-8" fill="currentColor" />
                        ) : (
                            <Play className="w-8 h-8 ml-1" fill="currentColor" />
                        )}
                    </button>

                    {error && <p className="text-sm text-red-200 mt-4">{error}</p>}

                    <div className="flex items-center justify-center gap-3 mt-8">
                        <button onClick={() => setMuted(m => !m)} className="text-white/80 hover:text-white cursor-pointer">
                            {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={muted ? 0 : volume}
                            onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false) }}
                            className="w-32 accent-white cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <audio ref={audioRef} preload="none" />

            <div>
                <h2 className="text-lg font-semibold text-[#111111] mb-3">Chat de la Radio</h2>
                <ChatBox
                    listenFn={listenToRadioMessages}
                    sendFn={sendRadioMessage}
                    heightClass="h-[420px]"
                    emptyMessage="Comenta mientras escuchas la radio"
                />
            </div>
        </div>
    )
}
