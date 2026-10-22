import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { Logo } from "@/components/auth/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react"

interface RegisterViewProps {
  onNavigateToLogin: () => void
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigateToLogin }) => {
  const { signup } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validate = (): boolean => {
    const errors: {
      name?: string
      email?: string
      password?: string
      confirmPassword?: string
    } = {}

    if (!name.trim()) {
      errors.name = "Informe seu nome completo."
    } else if (name.trim().length < 3) {
      errors.name = "O nome deve ter pelo menos 3 caracteres."
    }

    if (!email.trim()) {
      errors.email = "Informe seu endereço de email."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Formato de email inválido."
    }

    if (!password) {
      errors.password = "Informe uma senha de acesso."
    } else if (password.length < 9) {
      errors.password = "A senha deve ter no mínimo 9 caracteres."
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirme sua senha."
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "As senhas não coincidem."
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
      const result = await signup(name.trim(), email.trim(), password)
      if (!result.success && result.error) {
        setErrorMessage(result.error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isPasswordValidLength = password.length >= 9
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Topo com Logo */}
      <div className="text-center mb-6">
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
            Criar sua conta
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">
            Cadastre-se para gerenciar seus pacientes e planos alimentares
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

            {/* Campo Nome Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-name" required>
                Nome completo
              </Label>
              <Input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Dr(a). Seu Nome Completo"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (validationErrors.name) setValidationErrors((prev) => ({ ...prev, name: undefined }))
                }}
                icon={<User className="w-4 h-4" />}
                error={validationErrors.name}
                disabled={isLoading}
              />
            </div>

            {/* Campo Email */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-email" required>
                Email
              </Label>
              <Input
                id="reg-email"
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
                <Label htmlFor="reg-password" required>
                  Senha
                </Label>
                <span className={`text-[11px] font-medium ${isPasswordValidLength ? "text-emerald-700" : "text-slate-400"}`}>
                  Mínimo 9 caracteres
                </span>
              </div>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 9 caracteres"
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

              {/* Indicador de progresso da senha */}
              {password.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        password.length >= 9
                          ? "bg-emerald-600 w-full"
                          : password.length >= 6
                          ? "bg-amber-500 w-2/3"
                          : "bg-red-400 w-1/3"
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {password.length}/9
                  </span>
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm-password" required>
                Confirmar senha
              </Label>
              <div className="relative">
                <Input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (validationErrors.confirmPassword) {
                      setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                    }
                  }}
                  icon={<Lock className="w-4 h-4" />}
                  error={validationErrors.confirmPassword}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Indicador de confirmação */}
              {passwordsMatch && (
                <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Senhas conferem
                </p>
              )}
            </div>

            {/* Botão Criar Conta */}
            <Button
              type="submit"
              className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 shadow-md shadow-emerald-600/25 transition-all duration-200"
              isLoading={isLoading}
            >
              <span>Criar conta</span>
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col border-t border-slate-100/80 pt-5 bg-slate-50/50 text-center">
          <p className="text-sm text-slate-600">
            Já tem conta?{" "}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-emerald-700 font-semibold hover:text-emerald-800 hover:underline transition-colors cursor-pointer"
            >
              Faça login
            </button>
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seus dados são criptografados com segurança de ponta a ponta</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
