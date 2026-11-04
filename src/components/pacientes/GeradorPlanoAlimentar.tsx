import React, { useState, useEffect } from "react"
import { Sparkles, Save, RotateCcw, Plus, Trash2, Calendar, Utensils, CheckCircle2, AlertCircle, Info, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Paciente, PlanoSemanalConteudo, DiaPlanoAlimentar } from "@/types/paciente"

interface GeradorPlanoAlimentarProps {
  paciente: Paciente
  onPlanoSalvo: (conteudo: PlanoSemanalConteudo) => Promise<void>
  onCancelarEdicao?: () => void
}

const DIAS_PADRAO = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
]

const NOMES_REFEICOES: Record<keyof DiaPlanoAlimentar["refeicoes"], string> = {
  cafe_da_manha: "Café da Manhã",
  lanche_manha: "Lanche da Manhã",
  almoco: "Almoço",
  lanche_tarde: "Lanche da Tarde",
  jantar: "Jantar",
}

const ORDEM_REFEICOES: Array<keyof DiaPlanoAlimentar["refeicoes"]> = [
  "cafe_da_manha",
  "lanche_manha",
  "almoco",
  "lanche_tarde",
  "jantar",
]

export const GeradorPlanoAlimentar: React.FC<GeradorPlanoAlimentarProps> = ({
  paciente,
  onPlanoSalvo,
  onCancelarEdicao,
}) => {
  const [loading, setLoading] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [plano, setPlano] = useState<PlanoSemanalConteudo | null>(null)
  const [diaAtivo, setDiaAtivo] = useState<string>("Segunda-feira")
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  // Mensagens rotativas durante o loading da IA
  const loadingMessages = [
    "Buscando dados do paciente...",
    "Cruzando objetivos e restrições alimentares...",
    "IA calculando cardápio semanal balanceado...",
    "Diversificando opções da culinária brasileira...",
    "Quase pronto! Estruturando refeições...",
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (loading) {
      setLoadingMessageIndex(0)
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
      }, 2500)
    }
    return () => clearInterval(interval)
  }, [loading])

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null)
    }, 6000)
  }

  // Gera estrutura de plano em branco para preenchimento manual
  const criarPlanoManual = () => {
    const novoPlano: PlanoSemanalConteudo = {
      plano_semanal: DIAS_PADRAO.map((dia) => ({
        dia,
        refeicoes: {
          cafe_da_manha: ["", "", "", "", ""],
          lanche_manha: ["", "", "", "", ""],
          almoco: ["", "", "", "", ""],
          lanche_tarde: ["", "", "", "", ""],
          jantar: ["", "", "", "", ""],
        },
      })),
    }
    setPlano(novoPlano)
    setDiaAtivo("Segunda-feira")
    showToast("info", "Modo de edição manual iniciado. Preencha as opções conforme desejado.")
  }

  // Requisição para a Serverless Function `/api/gerar-plano`
  const gerarComIA = async () => {
    setLoading(true)
    setToast(null)

    try {
      const response = await fetch("/api/gerar-plano", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paciente }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro na requisição: ${response.status}`)
      }

      const data = await response.json()

      // Validação defensiva da estrutura
      if (!data || !Array.isArray(data.plano_semanal) || data.plano_semanal.length === 0) {
        throw new Error("Estrutura do plano retornada pela IA é inválida.")
      }

      // Garante que cada refeição tenha exatamente 5 opções (strings)
      const planoNormalizado: PlanoSemanalConteudo = {
        plano_semanal: data.plano_semanal.map((diaItem: any) => ({
          dia: diaItem.dia || "Dia",
          refeicoes: {
            cafe_da_manha: normalizarRefeicao(diaItem.refeicoes?.cafe_da_manha),
            lanche_manha: normalizarRefeicao(diaItem.refeicoes?.lanche_manha),
            almoco: normalizarRefeicao(diaItem.refeicoes?.almoco),
            lanche_tarde: normalizarRefeicao(diaItem.refeicoes?.lanche_tarde),
            jantar: normalizarRefeicao(diaItem.refeicoes?.jantar),
          },
        })),
      }

      setPlano(planoNormalizado)
      if (planoNormalizado.plano_semanal.length > 0) {
        setDiaAtivo(planoNormalizado.plano_semanal[0].dia)
      }

      showToast("success", "Plano alimentar gerado com IA com sucesso! Você pode revisar e editar abaixo.")
    } catch (err: any) {
      console.error("Erro ao gerar plano via IA:", err)
      showToast(
        "error",
        "Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?"
      )
    } finally {
      setLoading(false)
    }
  }

  const normalizarRefeicao = (opcoes: any): string[] => {
    if (!Array.isArray(opcoes)) {
      return ["", "", "", "", ""]
    }
    const arr = [...opcoes]
    while (arr.length < 5) arr.push("")
    return arr.slice(0, 5)
  }

  // Manipulação de inputs de texto das opções
  const handleOpcaoChange = (
    diaNome: string,
    refeicaoKey: keyof DiaPlanoAlimentar["refeicoes"],
    index: number,
    novoValor: string
  ) => {
    if (!plano) return

    setPlano({
      ...plano,
      plano_semanal: plano.plano_semanal.map((dia) => {
        if (dia.dia !== diaNome) return dia

        const novasOpcoes = [...dia.refeicoes[refeicaoKey]]
        novasOpcoes[index] = novoValor

        return {
          ...dia,
          refeicoes: {
            ...dia.refeicoes,
            [refeicaoKey]: novasOpcoes,
          },
        }
      }),
    })
  }

  // Salvar no Banco de Dados
  const handleSalvarPlano = async () => {
    if (!plano) return

    setSalvando(true)
    try {
      await onPlanoSalvo(plano)
      showToast("success", "Plano alimentar salvo e associado ao paciente com sucesso!")
      setPlano(null) // Limpa tela de edição e retorna ao histórico
      if (onCancelarEdicao) {
        onCancelarEdicao()
      }
    } catch (err: any) {
      console.error("Erro ao persistir plano:", err)
      showToast("error", `Erro ao salvar o plano: ${err.message || "Tente novamente."}`)
    } finally {
      setSalvando(false)
    }
  }

  // Encontra o dia selecionado atualmente
  const diaSelecionado = plano?.plano_semanal.find((d) => d.dia === diaAtivo) || plano?.plano_semanal[0]

  return (
    <div className="space-y-6">
      {/* Toast Notificação de Feedback */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-start justify-between gap-3 shadow-md animate-fade-in ${
            toast.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
            <div>
              <p className="text-xs sm:text-sm font-semibold">{toast.message}</p>
              {toast.type === "error" && (
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={gerarComIA}
                    className="text-xs font-bold underline hover:text-rose-950 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                  <span className="text-rose-400">•</span>
                  <button
                    type="button"
                    onClick={criarPlanoManual}
                    className="text-xs font-bold underline hover:text-rose-950 transition-colors"
                  >
                    Criar Plano Manual
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Ações do Topo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 border border-emerald-100 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Prescrição com Inteligência Artificial
            </h4>
            <p className="text-xs text-slate-500">
              Gere cardápios semanais personalizados respeitando restrições e gostos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Button
            type="button"
            onClick={gerarComIA}
            disabled={loading || salvando}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 gap-2 transition-all flex-1 sm:flex-initial"
          >
            <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Processando..." : "✨ Gerar Plano com IA"}</span>
          </Button>

          {!plano && (
            <Button
              type="button"
              variant="outline"
              onClick={criarPlanoManual}
              disabled={loading || salvando}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-xl gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Plano Manual</span>
            </Button>
          )}

          {plano && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm("Deseja descartar a edição atual do plano?")) {
                  setPlano(null)
                  if (onCancelarEdicao) onCancelarEdicao()
                }
              }}
              disabled={loading || salvando}
              className="border-slate-200 text-slate-500 hover:bg-slate-100 font-bold text-xs px-3.5 py-2.5 rounded-xl gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Descartar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Loading animado com mensagens dinâmicas */}
      {loading && (
        <Card className="p-8 sm:p-12 text-center bg-white border-emerald-100 rounded-3xl shadow-sm space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-pulse" />
            <div className="w-16 h-16 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-600 animate-bounce" />
            </div>
          </div>
          <div>
            <h5 className="text-base font-bold text-slate-800 animate-fade-in transition-all">
              {loadingMessages[loadingMessageIndex]}
            </h5>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              A inteligência artificial está analisando calorias, variedade culinária e restrições específicas cadastradas para este paciente.
            </p>
          </div>
        </Card>
      )}

      {/* Interface de Edição do Plano (Abas por Dia da Semana) */}
      {plano && !loading && (
        <div className="space-y-5 animate-fade-in">
          {/* Header de Abas por Dia da Semana */}
          <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {plano.plano_semanal.map((dia) => {
              const isActive = dia.dia === diaAtivo
              return (
                <button
                  key={dia.dia}
                  type="button"
                  onClick={() => setDiaAtivo(dia.dia)}
                  className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                    isActive
                      ? "bg-white text-emerald-800 shadow-xs border border-emerald-100/60"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  }`}
                >
                  {dia.dia}
                </button>
              )
            })}
          </div>

          {/* Card com as Refeições do Dia Selecionado */}
          {diaSelecionado && (
            <Card className="bg-white border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Cardápio: {diaSelecionado.dia}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Edite as 5 opções de cada refeição caso precise personalizar quantidades ou substituições
                  </p>
                </div>

                <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 w-fit">
                  Total: {ORDEM_REFEICOES.length} Refeições
                </span>
              </div>

              {/* Grid de Refeições */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ORDEM_REFEICOES.map((refeicaoKey) => {
                  const nomeRefeicao = NOMES_REFEICOES[refeicaoKey]
                  const opcoes = diaSelecionado.refeicoes[refeicaoKey] || ["", "", "", "", ""]

                  return (
                    <div
                      key={refeicaoKey}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 transition-colors space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{nomeRefeicao}</span>
                        </Label>
                        <span className="text-[10px] font-semibold text-slate-400">
                          5 Opções sugeridas
                        </span>
                      </div>

                      <div className="space-y-2">
                        {opcoes.map((opcao, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {optIndex + 1}
                            </span>
                            <Input
                              value={opcao}
                              onChange={(e) =>
                                handleOpcaoChange(
                                  diaSelecionado.dia,
                                  refeicaoKey,
                                  optIndex,
                                  e.target.value
                                )
                              }
                              placeholder={`Opção ${optIndex + 1} para ${nomeRefeicao.toLowerCase()}`}
                              className="text-xs bg-white rounded-xl border-slate-200 focus-visible:ring-emerald-600 h-9"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Barra de Persistência no Rodapé do Formulário */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Ao salvar, este plano semanal completo será adicionado ao histórico do paciente.
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Deseja cancelar as alterações e voltar?")) {
                        setPlano(null)
                        if (onCancelarEdicao) onCancelarEdicao()
                      }
                    }}
                    className="border-slate-200 text-slate-600 text-xs px-5 py-2.5 rounded-xl flex-1 sm:flex-initial"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSalvarPlano}
                    disabled={salvando}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 gap-2 flex-1 sm:flex-initial"
                  >
                    <Save className={`w-4 h-4 ${salvando ? "animate-spin" : ""}`} />
                    <span>{salvando ? "Salvando no Banco..." : "Salvar Plano Alimentar"}</span>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

