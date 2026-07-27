import { useState } from 'react'

const SIZE_MAP = {
    sm: { container: 'w-9 h-9', text: 'text-sm' },
    md: { container: 'w-14 h-14', text: 'text-xl' },
    lg: { container: 'w-24 h-24', text: 'text-3xl' },
    xl: { container: 'w-32 h-32', text: 'text-4xl' },
}

export default function UserAvatar({ photoUrl, name, size = 'md', bgColor = '#2696D2', className = '' }) {
    const [imageError, setImageError] = useState(false)

    const sizeStyles = SIZE_MAP[size] || SIZE_MAP.md
    const initial = name?.charAt(0)?.toUpperCase() || 'U'
    const hasValidImage = photoUrl && !imageError

    return (
        <div className={`${sizeStyles.container} rounded-full overflow-hidden flex-shrink-0 ${className}`}
            style={{ background: hasValidImage ? 'transparent' : `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)` }}>
            {hasValidImage ? (
                <img
                    src={photoUrl}
                    alt={`Foto de ${name}`}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className={`w-full h-full flex items-center justify-center text-white font-bold ${sizeStyles.text}`}>
                    {initial}
                </div>
            )}
        </div>
    )
}
