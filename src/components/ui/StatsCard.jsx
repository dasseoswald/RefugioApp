import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, trendLabel, variant = 'default' }) {
    const trendColor = trend > 0 ? 'text-[#13CD68]' : trend < 0 ? 'text-[#E74C3C]' : 'text-[#6E6E6E]'
    const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus

    const bgVariants = {
        default: 'bg-white',
        primary: 'bg-gradient-to-br from-[#2696D2] to-[#1D74A8] text-white',
        secondary: 'bg-gradient-to-br from-[#13CD68] to-[#0FA855] text-white',
        accent: 'bg-gradient-to-br from-[#E8A838] to-[#D09530] text-white',
    }

    const isColored = variant !== 'default'

    return (
        <div className={`${bgVariants[variant]} rounded-2xl p-6 shadow-[0_2px_12px_rgba(38,150,210,0.08)] hover:shadow-[0_8px_24px_rgba(38,150,210,0.15)] transition-all duration-300 hover:-translate-y-0.5`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isColored ? 'bg-white/20' : 'bg-[#E8F4FC]'}`}>
                    {Icon && <Icon className={`w-6 h-6 ${isColored ? 'text-white' : 'text-[#2696D2]'}`} />}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${isColored ? 'text-white/80' : trendColor}`}>
                        <TrendIcon className="w-3.5 h-3.5" />
                        <span>{trend > 0 ? '+' : ''}{trend}%</span>
                    </div>
                )}
            </div>
            <div>
                <p className={`text-3xl font-bold mb-1 ${isColored ? 'text-white' : 'text-[#111111]'}`}>{value}</p>
                <p className={`text-sm font-medium ${isColored ? 'text-white/80' : 'text-[#6E6E6E]'}`}>{title}</p>
                {subtitle && <p className={`text-xs mt-1 ${isColored ? 'text-white/60' : 'text-[#6E6E6E]/70'}`}>{subtitle}</p>}
            </div>
        </div>
    )
}
