import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Logo } from "@/components/auth/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react"

interface LoginViewProps {
  onNavigateToRegister: () => void
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({})

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {}

    if (!email.trim()) {
      errors.email = "Informe seu endereço de email."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Formato de email inválido."
    }

    if (!password) {
      errors.password = "Informe sua senha de acesso."
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!validate()) return

    setIsLoading(true)
    try {
      const result = await login(email.trim(), password)
      if (!result.success && result.error) {
        setErrorMessage(result.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Topo com Logo */}
      <div className="text-center mb-8">
        <Logo size="lg" className="mb-2" />
        <p className="text-xs text-slate-500 font-medium mt-1">
          Plataforma de Alta Performance para Nutricionistas
        </p>
      </div>

      {/* Card Principal */}
      <Card className="glass-panel border-emerald-100 shadow-xl shadow-emerald-950/5 relative overflow-hidden">
        {/* Barra superior decorativa verde */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-500" />

        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Acessar sua conta
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">
            Digite seu email e senha para entrar no sistema
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mensagem de Erro Geral */}
            {errorMessage && (
              <Alert variant="destructive" className="bg-red-50/90 border-red-200 text-red-800 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <AlertDescription className="text-xs sm:text-sm font-medium leading-relaxed">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Campo Email */}
            <div className="space-y-1.5">
              <Label htmlFor="login-email" required>
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: undefined }))
                }}
                icon={<Mail className="w-4 h-4" />}
                error={validationErrors.email}
                disabled={isLoading}
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" required>
                  Senha
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="•••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  icon={<Lock className="w-4 h-4" />}
                  error={validationErrors.password}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <Button
              type="submit"
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 shadow-md shadow-emerald-600/25 transition-all duration-200"
              isLoading={isLoading}
            >
              <span>Entrar</span>
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t border-slate-100/80 pt-5 bg-slate-50/50 text-center">
          <p className="text-sm text-slate-600">
            Não tem conta?{" "}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-emerald-700 font-semibold hover:text-emerald-800 hover:underline transition-colors cursor-pointer"
            >
              Cadastre-se
            </button>
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ambiente seguro protegido por Neon Auth e criptografia</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
