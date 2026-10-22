import React, { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { Logo } from "@/components/auth/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dataApiFetch } from "@/lib/data-api"
import { Paciente } from "@/types/paciente"
import { PacientesListView } from "@/components/pacientes/PacientesListView"
import { PacienteFormView } from "@/components/pacientes/PacienteFormView"
import { PacienteDetailView } from "@/components/pacientes/PacienteDetailView"
import {
  Users,
  Calendar,
  AlertCircle,
  LogOut,
  LayoutDashboard,
  UserCheck,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react"

// ─── Tipos do Dashboard ───────────────────────────────────────────────────────
interface PacienteSemRetorno {
  id: string
  nome: string
  ultima_consulta: string
}

interface DashboardData {
  totalPacientes: number
  consultasSemana: number
  pacientesSemRetorno: PacienteSemRetorno[]
}

// ─── Helpers de Data ──────────────────────────────────────────────────────────
function getWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  }
}

function get30DaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split("T")[0]
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export const DashboardView: React.FC = () => {
  const { user, session, logout } = useAuth()

  // Navegação
  const [activeNav, setActiveNav] = useState<"dashboard" | "pacientes">("dashboard")
  const [pacienteSubView, setPacienteSubView] = useState<"list" | "form" | "detail">("list")
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null)

  // Mensagem toast de sucesso (ex: "Paciente cadastrado com sucesso!")
  const [toastSuccess, setToastSuccess] = useState<string | null>(null)

  // Dados do Dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashLoading, setDashLoading] = useState(true)
  const [dashError, setDashError] = useState<string | null>(null)

  // Dados da Lista de Pacientes
  const [pacientesList, setPacientesList] = useState<Paciente[]>([])
  const [pacientesLoading, setPacientesLoading] = useState(false)
  const [pacientesError, setPacientesError] = useState<string | null>(null)

  const token = session?.token

  // Carregar Métricas do Dashboard
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return
    setDashLoading(true)
    setDashError(null)

    try {
      const { start, end } = getWeekRange()
      const cutoff = get30DaysAgo()

      // 1. Total de pacientes da nutricionista logada
      const pacientesRes = await dataApiFetch<any[]>(
        `/pacientes?nutricionista_id=eq.${user.id}&select=id`,
        { token }
      )
      const totalPacientes: number = Array.isArray(pacientesRes) ? pacientesRes.length : 0

      const pacienteIds: string[] = Array.isArray(pacientesRes)
        ? pacientesRes.map((p: { id: string }) => p.id)
        : []

      let consultasSemana = 0
      let pacientesSemRetorno: PacienteSemRetorno[] = []

      if (pacienteIds.length > 0) {
        const idFilter = `(${pacienteIds.join(",")})`

        // 2. Consultas desta semana
        const consultasRes = await dataApiFetch<any[]>(
          `/consultas?paciente_id=in.${idFilter}&data_consulta=gte.${start}&data_consulta=lte.${end}&select=id`,
          { token }
        )
        consultasSemana = Array.isArray(consultasRes) ? consultasRes.length : 0

        // 3. Última consulta por paciente — filtra sem retorno há +30 dias
        const ultimasConsultasRes = await dataApiFetch<any[]>(
          `/consultas?paciente_id=in.${idFilter}&select=paciente_id,data_consulta,proximo_retorno&order=data_consulta.desc`,
          { token }
        )

        if (Array.isArray(ultimasConsultasRes)) {
          const ultimaPorPaciente = new Map<string, { data_consulta: string; proximo_retorno: string | null }>()
          for (const c of ultimasConsultasRes) {
            if (!ultimaPorPaciente.has(c.paciente_id)) {
              ultimaPorPaciente.set(c.paciente_id, {
                data_consulta: c.data_consulta,
                proximo_retorno: c.proximo_retorno ?? null,
              })
            }
          }

          const idsSemRetorno: string[] = []
          for (const [pid, info] of ultimaPorPaciente.entries()) {
            if (info.data_consulta <= cutoff && !info.proximo_retorno) {
              idsSemRetorno.push(pid)
            }
          }

          if (idsSemRetorno.length > 0) {
            const idsSemRetornoFilter = `(${idsSemRetorno.join(",")})`
            const nomesRes = await dataApiFetch<any[]>(
              `/pacientes?id=in.${idsSemRetornoFilter}&select=id,nome`,
              { token }
            )
            if (Array.isArray(nomesRes)) {
              pacientesSemRetorno = nomesRes.map((p: { id: string; nome: string }) => ({
                id: p.id,
                nome: p.nome,
                ultima_consulta: ultimaPorPaciente.get(p.id)?.data_consulta ?? "",
              }))
            }
          }
        }
      }

      setDashboardData({ totalPacientes, consultasSemana, pacientesSemRetorno })
    } catch (err: any) {
      console.error("Erro ao carregar dados do dashboard:", err)
      setDashError("Não foi possível carregar os dados. Tente novamente.")
    } finally {
      setDashLoading(false)
    }
  }, [user?.id, token])

  // Carregar Lista de Pacientes com datas das últimas consultas
  const loadPacientesList = useCallback(async () => {
    if (!user?.id) return
    setPacientesLoading(true)
    setPacientesError(null)

    try {
      const res = await dataApiFetch<Paciente[]>(
        `/pacientes?nutricionista_id=eq.${user.id}&order=created_at.desc&select=*`,
        { token }
      )

      if (Array.isArray(res)) {
        if (res.length > 0) {
          const pIds = res.map((p) => p.id)
          const idFilter = `(${pIds.join(",")})`

          try {
            const ultimasConsultas = await dataApiFetch<any[]>(
              `/consultas?paciente_id=in.${idFilter}&select=paciente_id,data_consulta&order=data_consulta.desc`,
              { token }
            )

            const mapUltimaConsulta = new Map<string, string>()
            if (Array.isArray(ultimasConsultas)) {
              for (const c of ultimasConsultas) {
                if (!mapUltimaConsulta.has(c.paciente_id)) {
                  mapUltimaConsulta.set(c.paciente_id, c.data_consulta)
                }
              }
            }

            const merged = res.map((p) => ({
              ...p,
              ultima_consulta: mapUltimaConsulta.get(p.id) || null,
            }))
            setPacientesList(merged)
          } catch {
            setPacientesList(res)
          }
        } else {
          setPacientesList([])
        }
      } else {
        setPacientesList([])
      }
    } catch (err: any) {
      console.error("Erro ao carregar lista de pacientes:", err)
      setPacientesError("Não foi possível carregar a lista de pacientes.")
    } finally {
      setPacientesLoading(false)
    }
  }, [user?.id, token])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  useEffect(() => {
    if (activeNav === "pacientes") {
      loadPacientesList()
    }
  }, [activeNav, loadPacientesList])

  // Ações de navegação do Paciente
  const handleOpenPacienteDetail = (id: string) => {
    setSelectedPacienteId(id)
    setActiveNav("pacientes")
    setPacienteSubView("detail")
  }

  const handleOpenNovoPaciente = () => {
    setSelectedPacienteId(null)
    setActiveNav("pacientes")
    setPacienteSubView("form")
  }

  const handlePacienteCreated = (newId: string) => {
    setToastSuccess("Paciente cadastrado com sucesso! 🎉")
    setTimeout(() => setToastSuccess(null), 5000)

    // Atualiza listas e métricas em background
    loadDashboardData()
    loadPacientesList()

    // Redireciona imediatamente para o perfil do paciente recém-cadastrado
    if (newId) {
      setSelectedPacienteId(newId)
      setPacienteSubView("detail")
    } else {
      setPacienteSubView("list")
    }
  }

  // ─── Skeleton ─────────────────────────────────────────────────────────────
  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
  )

  return (
    <div className="min-h-screen bg-[#F3F7F5] flex">
      {/* ── Toast de Sucesso Flutuante ─────────────────────────────────── */}
      {toastSuccess && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-800 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-700 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastSuccess}</span>
          <button
            onClick={() => setToastSuccess(null)}
            className="text-emerald-300 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Sidebar Fixa ─────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-emerald-100 shadow-sm flex flex-col z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-emerald-50">
          <Logo size="sm" showTagline={false} />
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => {
              setActiveNav("dashboard")
              setPacienteSubView("list")
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              activeNav === "dashboard"
                ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/25"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            Dashboard
          </button>

          <button
            onClick={() => {
              setActiveNav("pacientes")
              setPacienteSubView("list")
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              activeNav === "pacientes"
                ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/25"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
            }`}
          >
            <UserCheck className="w-4 h-4 flex-shrink-0" />
            Pacientes
          </button>
        </nav>

        {/* User info + Logout */}
        <div className="px-4 py-4 border-t border-emerald-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "N"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full text-slate-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors text-xs"
          >
            <LogOut className="w-3 h-3 mr-1.5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* ── Conteúdo Principal ────────────────────────────────────────── */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-xs px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {activeNav === "dashboard"
                ? "Dashboard"
                : pacienteSubView === "form"
                ? "Cadastrar Novo Paciente"
                : pacienteSubView === "detail"
                ? "Perfil do Paciente"
                : "Pacientes"}
            </h1>
            <p className="text-xs text-slate-400">
              Bem-vinda(o), {user?.name?.split(" ")[0]} 👋
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeNav === "dashboard" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDashboardData}
                disabled={dashLoading}
                className="text-slate-500 hover:text-emerald-700 gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dashLoading ? "animate-spin" : ""}`} />
                <span className="text-xs">Atualizar</span>
              </Button>
            )}
          </div>
        </header>

        {/* ── Renderização da Tela Ativa ─────────────────────────────── */}
        <div className="px-8 py-8">
          {/* VISÃO 1: DASHBOARD */}
          {activeNav === "dashboard" && (
            <div className="space-y-8">
              {/* Error state */}
              {dashError && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{dashError}</span>
                  <button
                    onClick={loadDashboardData}
                    className="ml-auto text-xs font-semibold underline hover:no-underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* ── Cards grid ────────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 — Total de Pacientes Ativos */}
                <Card
                  onClick={() => {
                    setActiveNav("pacientes")
                    setPacienteSubView("list")
                  }}
                  className="glass-panel border-emerald-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-500 tracking-wide uppercase group-hover:text-emerald-700 transition-colors">
                      Pacientes Ativos
                    </CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dashLoading ? (
                      <Skeleton className="h-10 w-20 mb-1" />
                    ) : (
                      <div className="text-4xl font-extrabold text-slate-900 tabular-nums">
                        {dashboardData?.totalPacientes ?? 0}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5 flex items-center justify-between">
                      <span>Total de pacientes cadastrados</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity" />
                    </p>
                  </CardContent>
                </Card>

                {/* Card 2 — Consultas da Semana */}
                <Card className="glass-panel border-emerald-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                      Consultas da Semana
                    </CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dashLoading ? (
                      <Skeleton className="h-10 w-16 mb-1" />
                    ) : (
                      <div className="text-4xl font-extrabold text-slate-900 tabular-nums">
                        {dashboardData?.consultasSemana ?? 0}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">
                      Registradas nesta semana
                    </p>
                  </CardContent>
                </Card>

                {/* Card 3 — Pacientes sem retorno */}
                <Card className="glass-panel border-emerald-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                      Pacientes Sem Retorno
                    </CardTitle>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dashLoading ? (
                      <Skeleton className="h-10 w-16 mb-1" />
                    ) : (
                      <div className="text-4xl font-extrabold text-slate-900 tabular-nums">
                        {dashboardData?.pacientesSemRetorno.length ?? 0}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">
                      Última consulta há mais de 30 dias
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* ── Card expandido — Lista Pacientes Sem Retorno ───────── */}
              <Card className="border-emerald-100 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        Pacientes Sem Retorno Agendado
                      </CardTitle>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Última consulta há mais de 30 dias e sem próximo retorno marcado
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {dashLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <Skeleton className="h-4 flex-1" />
                        </div>
                      ))}
                    </div>
                  ) : dashboardData?.pacientesSemRetorno.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                        <UserCheck className="w-7 h-7 text-emerald-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        Nenhum paciente sem retorno no momento
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Todos os seus pacientes estão com retornos em dia 🎉
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {dashboardData?.pacientesSemRetorno.map((p) => (
                        <li key={p.id}>
                          <button
                            onClick={() => handleOpenPacienteDetail(p.id)}
                            className="w-full flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-amber-50 transition-colors text-left group"
                          >
                            <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 text-amber-800 font-bold flex items-center justify-center text-sm flex-shrink-0">
                              {p.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-amber-800 transition-colors">
                                {p.nome}
                              </p>
                              <p className="text-xs text-slate-400">
                                Última consulta em{" "}
                                {p.ultima_consulta
                                  ? new Date(p.ultima_consulta + "T00:00:00").toLocaleDateString("pt-BR")
                                  : "—"}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 flex-shrink-0 transition-colors" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* VISÃO 2: PACIENTES */}
          {activeNav === "pacientes" && (
            <div>
              {pacienteSubView === "list" && (
                <PacientesListView
                  pacientes={pacientesList}
                  loading={pacientesLoading}
                  error={pacientesError}
                  onRefresh={loadPacientesList}
                  onNovoPaciente={handleOpenNovoPaciente}
                  onSelectPaciente={handleOpenPacienteDetail}
                />
              )}

              {pacienteSubView === "form" && (
                <PacienteFormView
                  onBack={() => setPacienteSubView("list")}
                  onSuccess={handlePacienteCreated}
                />
              )}

              {pacienteSubView === "detail" && selectedPacienteId && (
                <PacienteDetailView
                  pacienteId={selectedPacienteId}
                  onBack={() => setPacienteSubView("list")}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
export default DashboardView
