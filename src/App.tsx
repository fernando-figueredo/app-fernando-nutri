import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { LoginView } from "@/components/auth/LoginView"
import { RegisterView } from "@/components/auth/RegisterView"
import { DashboardView } from "@/components/dashboard/DashboardView"
import { Logo } from "@/components/auth/Logo"
import { ShieldCheck, Heart, Sparkles } from "lucide-react"

export function App() {
  const { isAuthenticated, isLoading } = useAuth()
  const [authView, setAuthView] = useState<"login" | "register">("login")

  // Tela de Carregamento inicial (sem flash indesejado)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse-subtle">
          <Logo size="lg" />
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <svg
              className="animate-spin h-3.5 w-3.5 text-emerald-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Carregando sua sessão...</span>
          </div>
        </div>
      </div>
    )
  }

  // Regra do Prompt 2: Se já estiver logado, redirecionar direto para o dashboard
  if (isAuthenticated) {
    return <DashboardView />
  }

  // Telas de Autenticação (Login / Cadastro)
  return (
    <div className="min-h-screen auth-gradient-bg flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Elementos decorativos de fundo sutis */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -left-24 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-green-200/20 rounded-full blur-3xl" />
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-6">
        {authView === "login" ? (
          <LoginView onNavigateToRegister={() => setAuthView("register")} />
        ) : (
          <RegisterView onNavigateToLogin={() => setAuthView("login")} />
        )}
      </div>

      {/* Rodapé institucional */}
      <footer className="relative z-10 text-center py-4 text-xs text-slate-400">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <Heart className="w-3.5 h-3.5 text-emerald-600" />
            Desenvolvido para Nutricionistas
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Neon Auth & PostgreSQL
          </span>
        </div>
        <p>© {new Date().getFullYear()} Fernando Nutri. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

export default App
