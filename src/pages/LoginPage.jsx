import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { isInAppBrowser } from '../lib/installPrompt.js'
import InAppBrowserBanner from '../components/shared/InAppBrowserBanner.jsx'
import logo from '../assets/logo.png'

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    )
}

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login, loginWithGoogle } = useAuth()

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setIsLoading(true)

        const result = await login(email, password)
        setIsLoading(false)

        if (result.error) {
            setError(result.error)
        }
    }

    const handleGoogle = async () => {
        setError('')
        if (isInAppBrowser()) {
            setError('Google no permite iniciar sesión desde aquí. Abre este link en Safari o Chrome (toca ••• arriba y elige "Abrir en Safari").')
            return
        }
        setIsLoading(true)
        const result = await loginWithGoogle()
        setIsLoading(false)
        if (result.error) {
            setError(result.error)
        }
    }

    return (
        <div className="min-h-screen relative flex overflow-hidden">
            <video autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
                src="/videofondo.mp4" />
            <div className="absolute inset-0 z-0"
                style={{ background: 'linear-gradient(135deg, rgba(1,1,1,0.85) 0%, rgba(17,17,17,0.78) 40%, rgba(38,150,210,0.72) 100%)' }} />

            {/* Left - Branding */}
            <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 text-white relative z-10">
                <div className="max-w-md text-center">
                    <div className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20">
                        <img src={logo} alt="Refugio App" className="w-14 h-14 object-contain" />
                    </div>
                    <h1 className="text-5xl font-bold mb-4 leading-tight">
                        Refugio<span className="text-[#E8A838]"> App</span>
                    </h1>
                    <p className="text-xl text-white/70 mb-6">Somos un refugio para la familia</p>
                    <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                        <div className="w-2 h-2 rounded-full bg-[#13CD68]"></div>
                        <span>Seguro • Confiable • Moderno</span>
                    </div>
                </div>
            </div>

            {/* Right - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 animate-scale-in">
                        {/* Mobile logo */}
                        <div className="lg:hidden text-center mb-8">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}>
                                <img src={logo} alt="Refugio App" className="w-10 h-10 object-contain" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#111111]">
                                Refugio<span className="text-[#E8A838]"> App</span>
                            </h1>
                        </div>

                        <h2 className="text-2xl font-bold text-[#111111] mb-1">Bienvenido</h2>
                        <p className="text-[#6E6E6E] text-sm mb-8">Inicia sesión para continuar</p>

                        <InAppBrowserBanner />

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-[#111111] mb-2">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E6E]" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-[#111111] placeholder:text-[#6E6E6E]/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-[#111111] mb-2">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6E6E6E]" />
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Tu contraseña"
                                        required
                                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-[#111111] placeholder:text-[#6E6E6E]/50 focus:outline-none focus:border-[#2696D2] focus:bg-white transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E6E6E] hover:text-[#111111] cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-[#FADBD8] text-[#E74C3C] text-sm px-4 py-3 rounded-xl animate-fade-in">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                id="login-submit"
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #2696D2, #1D74A8)' }}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Iniciar Sesión
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-[#6E6E6E]">o continúa con</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {/* Google */}
                        <button
                            type="button"
                            onClick={handleGoogle}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white hover:bg-gray-50 text-[#111111] font-semibold rounded-xl border-2 border-gray-100 transition-all text-sm disabled:opacity-50 cursor-pointer"
                        >
                            <GoogleIcon />
                            Continuar con Google
                        </button>

                        <p className="mt-6 text-center text-sm text-[#6E6E6E]">
                            ¿No tienes cuenta?{' '}
                            <Link to="/register" className="text-[#2696D2] hover:underline font-medium">
                                Crear cuenta gratis
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
