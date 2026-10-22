import React, { useState, useMemo } from "react"
import { Paciente } from "@/types/paciente"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Search,
  UserPlus,
  Users,
  Calendar,
  Target,
  ChevronRight,
  UserCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

interface PacientesListViewProps {
  pacientes: Paciente[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onNovoPaciente: () => void
  onSelectPaciente: (pacienteId: string) => void
}

export const PacientesListView: React.FC<PacientesListViewProps> = ({
  pacientes,
  loading,
  error,
  onRefresh,
  onNovoPaciente,
  onSelectPaciente,
}) => {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPacientes = useMemo(() => {
    if (!searchTerm.trim()) return pacientes
    const term = searchTerm.toLowerCase().trim()
    return pacientes.filter((p) => p.nome.toLowerCase().includes(term))
  }, [pacientes, searchTerm])

  return (
    <div className="space-y-6">
      {/* ── Barra Superior de Ações ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Buscar paciente por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="bg-white border-slate-200 shadow-xs h-11"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-11 px-3.5 border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={onNovoPaciente}
            className="h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 rounded-xl shadow-md shadow-emerald-700/20 gap-2 flex-1 sm:flex-none justify-center"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </Button>
        </div>
      </div>

      {/* ── Mensagem de Erro se houver ─────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* ── Lista de Pacientes ─────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4 animate-pulse"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-24 bg-slate-100 rounded-lg hidden sm:block" />
            </div>
          ))}
        </div>
      ) : filteredPacientes.length === 0 ? (
        <Card className="border border-slate-200 bg-white p-12 text-center shadow-xs rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            {searchTerm ? <Search className="w-8 h-8" /> : <Users className="w-8 h-8" />}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado ainda"}
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
            {searchTerm
              ? `Não encontramos nenhum resultado para "${searchTerm}". Verifique a digitação ou tente outro termo.`
              : "Cadastre seu primeiro paciente para começar a registrar avaliações, planos alimentares e consultas."}
          </p>
          {searchTerm ? (
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              className="border-slate-200 text-slate-600"
            >
              Limpar busca
            </Button>
          ) : (
            <Button
              onClick={onNovoPaciente}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 rounded-xl shadow-md shadow-emerald-700/20 gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Cadastrar Primeiro Paciente
            </Button>
          )}
        </Card>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredPacientes.map((paciente) => {
            const initialLetter = paciente.nome ? paciente.nome.charAt(0).toUpperCase() : "P"

            // Objetivos resumidos
            const objetivosText =
              paciente.objetivos && paciente.objetivos.length > 0
                ? paciente.objetivos.join(", ")
                : paciente.objetivo_texto || "Sem objetivo informado"

            // Formatação de data da última consulta
            const ultimaConsultaText = paciente.ultima_consulta
              ? new Date(paciente.ultima_consulta + "T00:00:00").toLocaleDateString("pt-BR")
              : "Nenhuma consulta registrada"

            return (
              <div
                key={paciente.id}
                onClick={() => onSelectPaciente(paciente.id)}
                className="p-4 sm:p-5 flex items-center gap-4 hover:bg-emerald-50/40 cursor-pointer transition-all duration-150 group"
              >
                {/* Avatar com inicial */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300/60 text-emerald-900 font-bold flex items-center justify-center text-lg flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  {initialLetter}
                </div>

                {/* Dados do Paciente */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-800 truncate group-hover:text-emerald-800 transition-colors">
                      {paciente.nome}
                    </h4>
                    {paciente.sexo && (
                      <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {paciente.sexo}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                    {/* Objetivo */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Target className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate max-w-[260px]">{objetivosText}</span>
                    </div>

                    {/* Data da última consulta */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{ultimaConsultaText}</span>
                    </div>
                  </div>
                </div>

                {/* Seta indicativa */}
                <div className="flex items-center gap-2 flex-shrink-0 text-slate-300 group-hover:text-emerald-600 transition-colors">
                  <span className="text-xs font-semibold hidden md:inline text-slate-400 group-hover:text-emerald-700">
                    Ver perfil
                  </span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
