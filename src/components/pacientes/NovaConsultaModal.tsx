import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { dataApiFetch } from "@/lib/data-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  X,
  Calendar,
  Scale,
  Activity,
  Percent,
  FileText,
  AlertCircle,
  Save,
} from "lucide-react"

interface NovaConsultaModalProps {
  isOpen: boolean
  pacienteId: string
  onClose: () => void
  onSuccess: () => void
}

export const NovaConsultaModal: React.FC<NovaConsultaModalProps> = ({
  isOpen,
  pacienteId,
  onClose,
  onSuccess,
}) => {
  const { session } = useAuth()

  // Form state com valores padrão (data de hoje pré-preenchida)
  const todayStr = new Date().toISOString().split("T")[0]
  const [dataConsulta, setDataConsulta] = useState(todayStr)
  const [peso, setPeso] = useState("")
  const [cintura, setCintura] = useState("")
  const [quadril, setQuadril] = useState("")
  const [percentualGordura, setPercentualGordura] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [proximoRetorno, setProximoRetorno] = useState("")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dataConsulta) {
      setError("A data da consulta é obrigatória.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const pesoNum = peso ? parseFloat(peso.replace(",", ".")) : null
      const cinturaNum = cintura ? parseFloat(cintura.replace(",", ".")) : null
      const quadrilNum = quadril ? parseFloat(quadril.replace(",", ".")) : null
      const gorduraNum = percentualGordura
        ? parseFloat(percentualGordura.replace(",", "."))
        : null

      const payload = {
        paciente_id: pacienteId,
        data_consulta: dataConsulta,
        peso: isNaN(pesoNum as number) ? null : pesoNum,
        cintura: isNaN(cinturaNum as number) ? null : cinturaNum,
        quadril: isNaN(quadrilNum as number) ? null : quadrilNum,
        percentual_gordura: isNaN(gorduraNum as number) ? null : gorduraNum,
        observacoes: observacoes.trim() || null,
        proximo_retorno: proximoRetorno || null,
      }

      await dataApiFetch("/consultas", {
        method: "POST",
        body: payload,
        token: session?.token,
      })

      // Limpa campos
      setPeso("")
      setCintura("")
      setQuadril("")
      setPercentualGordura("")
      setObservacoes("")
      setProximoRetorno("")

      onSuccess()
    } catch (err: any) {
      console.error("Erro ao registrar consulta:", err)
      setError("Não foi possível salvar a consulta. Verifique os dados e tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Registrar Nova Consulta</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Atualize as medidas antropométricas e notas do paciente
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Data da Consulta */}
          <div className="space-y-1.5">
            <Label htmlFor="data_consulta" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              Data da consulta <span className="text-red-500 font-bold">*</span>
            </Label>
            <Input
              id="data_consulta"
              type="date"
              value={dataConsulta}
              onChange={(e) => setDataConsulta(e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
              className="bg-slate-50/50 border-slate-200 focus:bg-white"
              required
            />
          </div>

          {/* Peso Atual e % Gordura */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="peso" className="text-xs font-semibold text-slate-700">
                Peso atual (kg)
              </Label>
              <div className="relative">
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 72.4"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  icon={<Scale className="w-4 h-4 text-emerald-600" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white pr-10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  kg
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="percentual_gordura" className="text-xs font-semibold text-slate-700">
                % Gordura (opcional)
              </Label>
              <div className="relative">
                <Input
                  id="percentual_gordura"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 21.5"
                  value={percentualGordura}
                  onChange={(e) => setPercentualGordura(e.target.value)}
                  icon={<Percent className="w-4 h-4 text-emerald-600" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white pr-8"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Cintura e Quadril */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cintura" className="text-xs font-semibold text-slate-700">
                Cintura (cm, opcional)
              </Label>
              <div className="relative">
                <Input
                  id="cintura"
                  type="number"
                  step="0.5"
                  placeholder="Ex: 80"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  icon={<Activity className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white pr-10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  cm
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quadril" className="text-xs font-semibold text-slate-700">
                Quadril (cm, opcional)
              </Label>
              <div className="relative">
                <Input
                  id="quadril"
                  type="number"
                  step="0.5"
                  placeholder="Ex: 98"
                  value={quadril}
                  onChange={(e) => setQuadril(e.target.value)}
                  icon={<Activity className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white pr-10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  cm
                </span>
              </div>
            </div>
          </div>

          {/* Próximo Retorno */}
          <div className="space-y-1.5">
            <Label htmlFor="proximo_retorno" className="text-xs font-semibold text-slate-700">
              Próximo retorno agendado (opcional)
            </Label>
            <Input
              id="proximo_retorno"
              type="date"
              value={proximoRetorno}
              onChange={(e) => setProximoRetorno(e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
              className="bg-slate-50/50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="observacoes" className="text-xs font-semibold text-slate-700">
              Observações da consulta (texto livre)
            </Label>
            <textarea
              id="observacoes"
              rows={3}
              placeholder="Evolução da dieta, adesão ao plano, sintomas relatados..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all resize-none"
            />
          </div>

          {/* Rodapé do Modal com Botões */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-slate-200 text-slate-600 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 rounded-xl shadow-md shadow-emerald-700/20 gap-2"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Consulta</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
