import { useState, useEffect } from 'react'
import { listenToGeneralMessages, sendGeneralMessage, getUsers, isUserOnline } from '../../data/mockData.js'
import ChatBox from '../../components/shared/ChatBox.jsx'

export default function LiveChatPage() {
    const [onlineCount, setOnlineCount] = useState(0)

    useEffect(() => {
        const updateOnlineCount = () => setOnlineCount(getUsers().filter(isUserOnline).length)
        updateOnlineCount()
        const interval = setInterval(updateOnlineCount, 15000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#111111]">Chat en Vivo</h1>
                <p className="text-[#6E6E6E] mt-1 flex items-center gap-2">
                    Conversa con toda la comunidad de Refugio App
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E1F9EC] text-[#13CD68]">
                        <span className="w-2 h-2 rounded-full bg-[#13CD68] animate-pulse"></span>
                        {onlineCount} en línea
                    </span>
                </p>
            </div>

            <ChatBox
                listenFn={listenToGeneralMessages}
                sendFn={sendGeneralMessage}
                heightClass="h-[calc(100vh-220px)] min-h-[400px]"
                emptyMessage="Envía el primer mensaje de la comunidad"
            />
        </div>
    )
}
