import React, { useEffect, useState, useCallback, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { dataApiFetch } from "@/lib/data-api"
import { Paciente, Consulta, PlanoAlimentar, PacienteFormData } from "@/types/paciente"
import {
  formatPhone,
  formatTimeInput,
  calculateAge,
  calculateIMC,
} from "@/lib/formatters"
import { WeightEvolutionChart } from "@/components/pacientes/WeightEvolutionChart"
import { NovaConsultaModal } from "@/components/pacientes/NovaConsultaModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Calendar,
  Phone,
  MessageCircle,
  Mail,
  Scale,
  Target,
  AlertCircle,
  FileText,
  Clock,
  Droplets,
  Activity,
  HeartPulse,
  Pill,
  Sparkles,
  User,
  Plus,
  Save,
  CheckCircle2,
  X,
  Utensils,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface PacienteDetailViewProps {
  pacienteId: string
  onBack: () => void
}

// Opções fixas
const OBJETIVOS_OPTIONS = [
  "Emagrecer",
  "Ganhar massa",
  "Controlar diabetes",
  "Saúde geral",
  "Performance esportiva",
  "Reeducação alimentar",
]

const NIVEIS_ATIVIDADE = [
  "Sedentário",
  "Levemente ativo",
  "Moderadamente ativo",
  "Muito ativo",
  "Extremamente ativo",
]

const PATOLOGIAS_OPTIONS = [
  "Diabetes",
  "Hipertensão",
  "Hipotireoidismo",
  "Hipertireoidismo",
  "Síndrome do ovário policístico",
  "Doença celíaca",
  "Colesterol alto",
]

const RESTRICOES_OPTIONS = [
  "Lactose",
  "Glúten",
  "Açúcar",
  "Carne vermelha",
  "Frutos do mar",
]

const ALERGIAS_OPTIONS = [
  "Amendoim",
  "Leite",
  "Ovo",
  "Soja",
  "Trigo",
  "Frutos do mar",
]

export const PacienteDetailView: React.FC<PacienteDetailViewProps> = ({
  pacienteId,
  onBack,
}) => {
  const { session } = useAuth()

  // Seção principal selecionada
  const [activeSection, setActiveSection] = useState<"dados" | "consultas" | "planos">("dados")

  // Aba interna da Seção 1 (Dados do Paciente)
  const [activeTab, setActiveTab] = useState<"pessoal" | "clinico" | "habitos">("pessoal")

  // Estado dos dados do paciente e edição
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingPaciente, setSavingPaciente] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Estado do formulário editável
  const [editForm, setEditForm] = useState<PacienteFormData>({
    nome: "",
    data_nascimento: "",
    data_inicio_tratamento: "",
    sexo: "",
    telefone: "",
    whatsapp: "",
    email: "",
    peso_inicial: "",
    altura: "",
    objetivos: [],
    objetivo_texto: "",
    nivel_atividade: "",
    patologias: [],
    patologia_livre: "",
    restricoes_alimentares: [],
    restricao_livre: "",
    alergias: [],
    alergia_livre: "",
    medicamentos: "",
    suplementos: "",
    refeicoes_por_dia: "",
    horario_acorda: "",
    horario_dorme: "",
    litros_agua: "",
    atividade_fisica: false,
    atividade_fisica_descricao: "",
    observacoes: "",
  })

  // Estado das Consultas (Seção 2)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loadingConsultas, setLoadingConsultas] = useState(false)
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false)

  // Estado dos Planos Alimentares (Seção 3)
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([])
  const [loadingPlanos, setLoadingPlanos] = useState(false)
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null)

  // Carregar dados completos do paciente
  const loadPaciente = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await dataApiFetch<Paciente[]>(
        `/pacientes?id=eq.${pacienteId}&select=*`,
        { token: session?.token }
      )
      if (Array.isArray(res) && res.length > 0) {
        const p = res[0]
        setPaciente(p)
        setEditForm({
          nome: p.nome || "",
          data_nascimento: p.data_nascimento || "",
          data_inicio_tratamento: "",
          sexo: p.sexo || "",
          telefone: p.telefone || "",
          whatsapp: p.whatsapp || "",
          email: p.email || "",
          peso_inicial: p.peso_inicial != null ? String(p.peso_inicial) : "",
          altura: p.altura != null ? String(p.altura) : "",
          objetivos: Array.isArray(p.objetivos) ? p.objetivos : [],
          objetivo_texto: p.objetivo_texto || "",
          nivel_atividade: p.nivel_atividade || "",
          patologias: Array.isArray(p.patologias) ? p.patologias : [],
          patologia_livre: "",
          restricoes_alimentares: Array.isArray(p.restricoes_alimentares)
            ? p.restricoes_alimentares
            : [],
          restricao_livre: "",
          alergias: Array.isArray(p.alergias) ? p.alergias : [],
          alergia_livre: "",
          medicamentos: p.medicamentos || "",
          suplementos: p.suplementos || "",
          refeicoes_por_dia: p.refeicoes_por_dia != null ? String(p.refeicoes_por_dia) : "",
          horario_acorda: p.horario_acorda || "",
          horario_dorme: p.horario_dorme || "",
          litros_agua: p.litros_agua != null ? String(p.litros_agua) : "",
          atividade_fisica: !!p.atividade_fisica,
          atividade_fisica_descricao: p.atividade_fisica_descricao || "",
          observacoes: p.observacoes || "",
        })
      } else {
        setError("Paciente não encontrado.")
      }
    } catch (err: any) {
      console.error("Erro ao carregar paciente:", err)
      setError("Não foi possível carregar os dados deste paciente.")
    } finally {
      setLoading(false)
    }
  }, [pacienteId, session?.token])

  // Carregar histórico de consultas do paciente
  const loadConsultas = useCallback(async () => {
    setLoadingConsultas(true)
    try {
      const res = await dataApiFetch<Consulta[]>(
        `/consultas?paciente_id=eq.${pacienteId}&order=data_consulta.desc,created_at.desc`,
        { token: session?.token }
      )
      setConsultas(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error("Erro ao carregar consultas:", err)
    } finally {
      setLoadingConsultas(false)
    }
  }, [pacienteId, session?.token])

  // Carregar histórico de planos alimentares do paciente
  const loadPlanos = useCallback(async () => {
    setLoadingPlanos(true)
    try {
      const res = await dataApiFetch<PlanoAlimentar[]>(
        `/planos_alimentares?paciente_id=eq.${pacienteId}&order=created_at.desc`,
        { token: session?.token }
      )
      setPlanos(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error("Erro ao carregar planos alimentares:", err)
    } finally {
      setLoadingPlanos(false)
    }
  }, [pacienteId, session?.token])

  useEffect(() => {
    loadPaciente()
    loadConsultas()
    loadPlanos()
  }, [loadPaciente, loadConsultas, loadPlanos])

  // Handlers para edição do paciente
  const updateField = (field: keyof PacienteFormData, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleCheckbox = (
    field: "objetivos" | "patologias" | "restricoes_alimentares" | "alergias",
    item: string
  ) => {
    setEditForm((prev) => {
      const list = prev[field]
      if (item === "Nenhum") {
        return {
          ...prev,
          [field]: list.includes("Nenhum") ? [] : ["Nenhum"],
        }
      }
      const withoutNenhum = list.filter((x) => x !== "Nenhum")
      if (withoutNenhum.includes(item)) {
        return {
          ...prev,
          [field]: withoutNenhum.filter((x) => x !== item),
        }
      } else {
        return {
          ...prev,
          [field]: [...withoutNenhum, item],
        }
      }
    })
  }

  const handleAddCustomItem = (
    listField: "patologias" | "restricoes_alimentares" | "alergias",
    inputField: "patologia_livre" | "restricao_livre" | "alergia_livre"
  ) => {
    const val = editForm[inputField].trim()
    if (!val) return
    setEditForm((prev) => {
      const list = prev[listField].filter((x) => x !== "Nenhum")
      if (!list.includes(val)) {
        return {
          ...prev,
          [listField]: [...list, val],
          [inputField]: "",
        }
      }
      return { ...prev, [inputField]: "" }
    })
  }

  const handleRemoveCustomItem = (
    listField: "patologias" | "restricoes_alimentares" | "alergias",
    item: string
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [listField]: prev[listField].filter((x) => x !== item),
    }))
  }

  // Salvar alterações nos dados do paciente
  const handleSavePaciente = async () => {
    if (!editForm.nome.trim()) {
      alert("O nome completo é obrigatório.")
      return
    }

    setSavingPaciente(true)
    try {
      const pesoNum = editForm.peso_inicial
        ? parseFloat(editForm.peso_inicial.replace(",", "."))
        : null
      const alturaNum = editForm.altura
        ? parseFloat(editForm.altura.replace(",", "."))
        : null
      const refeicoesNum = editForm.refeicoes_por_dia
        ? parseInt(editForm.refeicoes_por_dia, 10)
        : null
      const litrosAguaNum = editForm.litros_agua
        ? parseFloat(editForm.litros_agua.replace(",", "."))
        : null

      const payload = {
        nome: editForm.nome.trim(),
        data_nascimento: editForm.data_nascimento || null,
        sexo: editForm.sexo || null,
        telefone: editForm.telefone.trim() || null,
        whatsapp: editForm.whatsapp.trim() || null,
        email: editForm.email.trim() || null,
        peso_inicial: isNaN(pesoNum as number) ? null : pesoNum,
        altura: isNaN(alturaNum as number) ? null : alturaNum,
        objetivos: editForm.objetivos.length > 0 ? editForm.objetivos : null,
        objetivo_texto: editForm.objetivo_texto.trim() || null,
        nivel_atividade: editForm.nivel_atividade || null,
        patologias: editForm.patologias.length > 0 ? editForm.patologias : null,
        restricoes_alimentares:
          editForm.restricoes_alimentares.length > 0
            ? editForm.restricoes_alimentares
            : null,
        alergias: editForm.alergias.length > 0 ? editForm.alergias : null,
        medicamentos: editForm.medicamentos.trim() || null,
        suplementos: editForm.suplementos.trim() || null,
        refeicoes_por_dia: isNaN(refeicoesNum as number) ? null : refeicoesNum,
        horario_acorda: editForm.horario_acorda.trim() || null,
        horario_dorme: editForm.horario_dorme.trim() || null,
        litros_agua: isNaN(litrosAguaNum as number) ? null : litrosAguaNum,
        atividade_fisica: editForm.atividade_fisica,
        atividade_fisica_descricao: editForm.atividade_fisica
          ? editForm.atividade_fisica_descricao.trim() || null
          : null,
        observacoes: editForm.observacoes.trim() || null,
      }

      await dataApiFetch(`/pacientes?id=eq.${pacienteId}`, {
        method: "PATCH",
        body: payload,
        token: session?.token,
      })

      // Atualiza estado local do paciente
      setPaciente((prev) => (prev ? { ...prev, ...payload } : null))
      setSuccessToast("Alterações salvas com sucesso! 🎉")
      setTimeout(() => setSuccessToast(null), 4000)
    } catch (err: any) {
      console.error("Erro ao salvar alterações do paciente:", err)
      alert("Não foi possível salvar as alterações. Tente novamente.")
    } finally {
      setSavingPaciente(false)
    }
  }

  // Callback de sucesso da nova consulta
  const handleConsultaSaved = () => {
    setIsConsultaModalOpen(false)
    setSuccessToast("Consulta registrada com sucesso! ⚖️")
    setTimeout(() => setSuccessToast(null), 4000)
    loadConsultas()
  }

  // Cálculos dinâmicos
  const idade = useMemo(() => calculateAge(editForm.data_nascimento), [editForm.data_nascimento])
  const imcInfo = useMemo(() => {
    const p = parseFloat(editForm.peso_inicial.replace(",", "."))
    const a = parseFloat(editForm.altura.replace(",", "."))
    return calculateIMC(p, a)
  }, [editForm.peso_inicial, editForm.altura])

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-pulse">
        <div className="h-8 w-44 bg-slate-200 rounded" />
        <div className="h-44 bg-white rounded-3xl border border-slate-200 p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-200" />
          <div className="space-y-3 flex-1">
            <div className="h-6 w-60 bg-slate-200 rounded" />
            <div className="h-4 w-40 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !paciente) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para lista de pacientes</span>
        </button>
        <Card className="p-8 text-center bg-white border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">{error || "Paciente não encontrado"}</h3>
          <Button onClick={loadPaciente} className="mt-4 bg-emerald-700 text-white">
            Tentar novamente
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ── Toast de Sucesso Flutuante ─────────────────────────────────── */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-800 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-700 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-300 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Botão Voltar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para pacientes</span>
        </button>

        {activeSection === "dados" && (
          <Button
            type="button"
            onClick={handleSavePaciente}
            disabled={savingPaciente}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 rounded-xl shadow-md shadow-emerald-700/20 gap-2"
          >
            {savingPaciente ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar alterações</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* ── Cabeçalho do Perfil ────────────────────────────────────────── */}
      <div className="bg-white border border-emerald-100/90 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300/80 text-emerald-900 font-extrabold flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 shadow-sm">
            {editForm.nome ? editForm.nome.charAt(0).toUpperCase() : "P"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {editForm.nome || "Sem nome"}
              </h2>
              {editForm.sexo && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                  {editForm.sexo}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-slate-500">
              {idade !== null && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {idade} anos
                </span>
              )}
              {editForm.whatsapp && (
                <a
                  href={`https://wa.me/55${editForm.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-700 hover:underline font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  {editForm.whatsapp}
                </a>
              )}
              {editForm.telefone && !editForm.whatsapp && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {editForm.telefone}
                </span>
              )}
              {editForm.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {editForm.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botão de Ação Rápida */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setIsConsultaModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 gap-2 flex-1 sm:flex-none justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Consulta</span>
          </Button>
        </div>
      </div>

      {/* ── Barra de Navegação das 3 Seções Principais (Prompt 5) ──────── */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSection("dados")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSection === "dados"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50"
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("consultas")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSection === "consultas"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>2. Consultas ({consultas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("planos")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSection === "planos"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>3. Planos Alimentares ({planos.length})</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* SEÇÃO 1: DADOS DO PACIENTE (EDITÁVEIS EM 3 ABAS)                  */}
      {/* ================================================================ */}
      {activeSection === "dados" && (
        <div className="space-y-6">
          {/* Sub-abas: Pessoal, Clínico e Hábitos */}
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            {[
              { id: "pessoal", label: "Pessoal", icon: User },
              { id: "clinico", label: "Clínico", icon: HeartPulse },
              { id: "habitos", label: "Hábitos", icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon
              const isCurrent = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <Card className="bg-white border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            {/* ABA 1: PESSOAL */}
            {activeTab === "pessoal" && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-800">Identificação e Contato</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Altere os dados diretamente nos campos e clique em "Salvar alterações"
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_nome" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Nome completo <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <Input
                    id="edit_nome"
                    type="text"
                    value={editForm.nome}
                    onChange={(e) => updateField("nome", e.target.value)}
                    icon={<User className="w-4 h-4" />}
                    className="bg-slate-50/50 border-slate-200 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data de Nascimento */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit_data_nascimento" className="text-xs font-semibold text-slate-700">
                        Data de nascimento
                      </Label>
                      {idade !== null && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          {idade} {idade === 1 ? "ano" : "anos"}
                        </span>
                      )}
                    </div>
                    <Input
                      id="edit_data_nascimento"
                      type="date"
                      value={editForm.data_nascimento}
                      onChange={(e) => updateField("data_nascimento", e.target.value)}
                      icon={<Calendar className="w-4 h-4" />}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white"
                    />
                  </div>

                  {/* Sexo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Sexo</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Feminino", "Masculino", "Outro"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateField("sexo", editForm.sexo === s ? "" : s)}
                          className={`h-11 rounded-xl text-xs font-semibold border transition-all ${
                            editForm.sexo === s
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                              : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contatos: WhatsApp e Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_whatsapp" className="text-xs font-semibold text-slate-700">
                      WhatsApp
                    </Label>
                    <Input
                      id="edit_whatsapp"
                      type="tel"
                      value={editForm.whatsapp}
                      onChange={(e) => updateField("whatsapp", formatPhone(e.target.value))}
                      icon={<MessageCircle className="w-4 h-4" />}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit_email" className="text-xs font-semibold text-slate-700">
                      Email
                    </Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      icon={<Mail className="w-4 h-4" />}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: CLÍNICO */}
            {activeTab === "clinico" && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-800">Medidas e Condições Clínicas</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Histórico clínico, patologias, restrições e objetivos do tratamento
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Peso Inicial */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_peso" className="text-xs font-semibold text-slate-700">
                      Peso inicial (kg)
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit_peso"
                        type="number"
                        step="0.1"
                        value={editForm.peso_inicial}
                        onChange={(e) => updateField("peso_inicial", e.target.value)}
                        icon={<Scale className="w-4 h-4" />}
                        className="bg-slate-50/50 border-slate-200 focus:bg-white pr-10"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Altura */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_altura" className="text-xs font-semibold text-slate-700">
                      Altura (cm)
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit_altura"
                        type="number"
                        step="0.5"
                        value={editForm.altura}
                        onChange={(e) => updateField("altura", e.target.value)}
                        className="bg-slate-50/50 border-slate-200 focus:bg-white pr-10"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        cm
                      </span>
                    </div>
                  </div>

                  {/* IMC Calculado */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      IMC Inicial
                    </Label>
                    <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">
                        {imcInfo ? `${imcInfo.imc} kg/m²` : "—"}
                      </span>
                      {imcInfo && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${imcInfo.cor}`}>
                          {imcInfo.classificacao}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold text-slate-700">Objetivos nutricionais</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {OBJETIVOS_OPTIONS.map((obj) => {
                      const isSelected = editForm.objetivos.includes(obj)
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => toggleCheckbox("objetivos", obj)}
                          className={`p-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs"
                              : "bg-slate-50/40 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span>{obj}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      )
                    })}
                  </div>
                  <Input
                    type="text"
                    placeholder="Objetivo adicional em texto livre..."
                    value={editForm.objetivo_texto}
                    onChange={(e) => updateField("objetivo_texto", e.target.value)}
                    className="mt-2 bg-slate-50/50 border-slate-200 focus:bg-white text-xs"
                  />
                </div>

                {/* Nível de Atividade */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold text-slate-700">Nível de atividade física</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {NIVEIS_ATIVIDADE.map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => updateField("nivel_atividade", editForm.nivel_atividade === nivel ? "" : nivel)}
                        className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                          editForm.nivel_atividade === nivel
                            ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs"
                            : "bg-slate-50/40 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {nivel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold text-slate-700">Patologias ou condições</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCheckbox("patologias", "Nenhum")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        editForm.patologias.includes("Nenhum")
                          ? "bg-emerald-700 border-emerald-700 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Nenhum
                    </button>
                    {PATOLOGIAS_OPTIONS.map((item) => {
                      const isSelected = editForm.patologias.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleCheckbox("patologias", item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    })}
                  </div>

                  {editForm.patologias.filter((p) => p !== "Nenhum" && !PATOLOGIAS_OPTIONS.includes(p)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {editForm.patologias
                        .filter((p) => p !== "Nenhum" && !PATOLOGIAS_OPTIONS.includes(p))
                        .map((custom) => (
                          <span
                            key={custom}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-medium"
                          >
                            {custom}
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomItem("patologias", custom)}
                              className="hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Input
                      type="text"
                      placeholder="Adicionar outra patologia..."
                      value={editForm.patologia_livre}
                      onChange={(e) => updateField("patologia_livre", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddCustomItem("patologias", "patologia_livre")
                        }
                      }}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustomItem("patologias", "patologia_livre")}
                      className="h-9 text-xs gap-1 border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Restrições Alimentares */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold text-slate-700">Restrições alimentares</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCheckbox("restricoes_alimentares", "Nenhum")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        editForm.restricoes_alimentares.includes("Nenhum")
                          ? "bg-emerald-700 border-emerald-700 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Nenhum
                    </button>
                    {RESTRICOES_OPTIONS.map((item) => {
                      const isSelected = editForm.restricoes_alimentares.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleCheckbox("restricoes_alimentares", item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    })}
                  </div>

                  {editForm.restricoes_alimentares.filter((p) => p !== "Nenhum" && !RESTRICOES_OPTIONS.includes(p)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {editForm.restricoes_alimentares
                        .filter((p) => p !== "Nenhum" && !RESTRICOES_OPTIONS.includes(p))
                        .map((custom) => (
                          <span
                            key={custom}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-medium"
                          >
                            {custom}
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomItem("restricoes_alimentares", custom)}
                              className="hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Input
                      type="text"
                      placeholder="Adicionar outra restrição..."
                      value={editForm.restricao_livre}
                      onChange={(e) => updateField("restricao_livre", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddCustomItem("restricoes_alimentares", "restricao_livre")
                        }
                      }}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustomItem("restricoes_alimentares", "restricao_livre")}
                      className="h-9 text-xs gap-1 border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Alergias */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold text-slate-700">Alergias alimentares</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCheckbox("alergias", "Nenhum")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        editForm.alergias.includes("Nenhum")
                          ? "bg-emerald-700 border-emerald-700 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Nenhum
                    </button>
                    {ALERGIAS_OPTIONS.map((item) => {
                      const isSelected = editForm.alergias.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleCheckbox("alergias", item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    })}
                  </div>

                  {editForm.alergias.filter((p) => p !== "Nenhum" && !ALERGIAS_OPTIONS.includes(p)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {editForm.alergias
                        .filter((p) => p !== "Nenhum" && !ALERGIAS_OPTIONS.includes(p))
                        .map((custom) => (
                          <span
                            key={custom}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-medium"
                          >
                            {custom}
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomItem("alergias", custom)}
                              className="hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Input
                      type="text"
                      placeholder="Adicionar outra alergia..."
                      value={editForm.alergia_livre}
                      onChange={(e) => updateField("alergia_livre", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddCustomItem("alergias", "alergia_livre")
                        }
                      }}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustomItem("alergias", "alergia_livre")}
                      className="h-9 text-xs gap-1 border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_medicamentos" className="text-xs font-semibold text-slate-700">
                      Medicamentos contínuos
                    </Label>
                    <textarea
                      id="edit_medicamentos"
                      rows={2}
                      value={editForm.medicamentos}
                      onChange={(e) => updateField("medicamentos", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit_suplementos" className="text-xs font-semibold text-slate-700">
                      Suplementos em uso
                    </Label>
                    <textarea
                      id="edit_suplementos"
                      rows={2}
                      value={editForm.suplementos}
                      onChange={(e) => updateField("suplementos", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: HÁBITOS */}
            {activeTab === "habitos" && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-800">Estilo de Vida e Rotina</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Horários habituais, refeições, hidratação e prática de exercícios
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_refeicoes" className="text-xs font-semibold text-slate-700">
                      Refeições por dia
                    </Label>
                    <Input
                      id="edit_refeicoes"
                      type="number"
                      min="1"
                      max="12"
                      value={editForm.refeicoes_por_dia}
                      onChange={(e) => updateField("refeicoes_por_dia", e.target.value)}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit_litros_agua" className="text-xs font-semibold text-slate-700">
                      Água por dia (litros)
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit_litros_agua"
                        type="number"
                        step="0.1"
                        value={editForm.litros_agua}
                        onChange={(e) => updateField("litros_agua", e.target.value)}
                        icon={<Droplets className="w-4 h-4 text-blue-500" />}
                        className="bg-slate-50/50 border-slate-200 focus:bg-white pr-14"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        litros
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit_horario_acorda" className="text-xs font-semibold text-slate-700">
                      Horário que acorda
                    </Label>
                    <Input
                      id="edit_horario_acorda"
                      type="text"
                      placeholder="Ex: 06:30"
                      value={editForm.horario_acorda}
                      onChange={(e) => updateField("horario_acorda", e.target.value)}
                      onBlur={() => updateField("horario_acorda", formatTimeInput(editForm.horario_acorda))}
                      icon={<Clock className="w-4 h-4" />}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit_horario_dorme" className="text-xs font-semibold text-slate-700">
                      Horário que dorme
                    </Label>
                    <Input
                      id="edit_horario_dorme"
                      type="text"
                      placeholder="Ex: 22:30"
                      value={editForm.horario_dorme}
                      onChange={(e) => updateField("horario_dorme", e.target.value)}
                      onBlur={() => updateField("horario_dorme", formatTimeInput(editForm.horario_dorme))}
                      icon={<Clock className="w-4 h-4" />}
                      className="bg-slate-50/50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-slate-800">Pratica atividade física?</Label>
                      <p className="text-[11px] text-slate-500">
                        Indique se realiza exercícios regulares
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateField("atividade_fisica", true)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          editForm.atividade_fisica
                            ? "bg-emerald-700 border-emerald-700 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("atividade_fisica", false)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          !editForm.atividade_fisica
                            ? "bg-slate-800 border-slate-800 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {editForm.atividade_fisica && (
                    <div className="pt-2 animate-fade-in space-y-1.5">
                      <Label htmlFor="edit_atv_desc" className="text-xs font-semibold text-slate-700">
                        Qual atividade e frequência semanal?
                      </Label>
                      <Input
                        id="edit_atv_desc"
                        type="text"
                        placeholder="Ex: Natação 3x na semana..."
                        value={editForm.atividade_fisica_descricao}
                        onChange={(e) => updateField("atividade_fisica_descricao", e.target.value)}
                        icon={<Activity className="w-4 h-4 text-emerald-600" />}
                        className="bg-white border-slate-200 text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="edit_observacoes" className="text-xs font-semibold text-slate-700">
                    Observações gerais
                  </Label>
                  <textarea
                    id="edit_observacoes"
                    rows={3}
                    value={editForm.observacoes}
                    onChange={(e) => updateField("observacoes", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Botão de Salvar Alterações na base da aba */}
            <div className="flex justify-end pt-5 mt-6 border-t border-slate-100">
              <Button
                type="button"
                onClick={handleSavePaciente}
                disabled={savingPaciente}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 rounded-xl shadow-md shadow-emerald-700/20 gap-2"
              >
                {savingPaciente ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar alterações</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================================================================ */}
      {/* SEÇÃO 2: CONSULTAS (GRÁFICO + HISTÓRICO + MODAL)                 */}
      {/* ================================================================ */}
      {activeSection === "consultas" && (
        <div className="space-y-6 animate-fade-in">
          {/* Gráfico de Evolução de Peso sempre visível */}
          <Card className="bg-white border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>Evolução de Peso ao Longo do Tempo</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Progresso registrado em cada consulta do paciente
                </p>
              </div>

              <Button
                onClick={() => setIsConsultaModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 rounded-xl shadow-sm gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Consulta</span>
              </Button>
            </div>

            <WeightEvolutionChart
              consultas={consultas}
              pesoInicial={paciente.peso_inicial}
            />
          </Card>

          {/* Lista de Consultas em ordem cronológica decrescente */}
          <Card className="bg-white border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Histórico de Consultas
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  {consultas.length} {consultas.length === 1 ? "consulta registrada" : "consultas registradas"}
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingConsultas ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : consultas.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Nenhuma consulta registrada ainda</p>
                  <p className="text-xs text-slate-400 mt-0.5 mb-4">
                    Clique no botão abaixo para adicionar a primeira consulta deste paciente.
                  </p>
                  <Button
                    onClick={() => setIsConsultaModalOpen(true)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 rounded-xl gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Primeira Consulta
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {consultas.map((c, idx) => {
                    const dataStr = new Date(c.data_consulta + "T00:00:00").toLocaleDateString("pt-BR")
                    const proxRetornoStr = c.proximo_retorno
                      ? new Date(c.proximo_retorno + "T00:00:00").toLocaleDateString("pt-BR")
                      : null

                    return (
                      <div key={c.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              #{consultas.length - idx}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{dataStr}</span>
                                {idx === 0 && (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    Mais recente
                                  </span>
                                )}
                              </div>
                              {proxRetornoStr && (
                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  <span>Próximo retorno: <strong className="text-slate-700">{proxRetornoStr}</strong></span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Medidas registradas */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                            {c.peso !== null && c.peso !== undefined && (
                              <div className="bg-emerald-50/70 border border-emerald-100 px-3 py-1.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px]">PESO</span>
                                <span className="font-extrabold text-emerald-900">{c.peso} kg</span>
                              </div>
                            )}

                            {c.percentual_gordura !== null && c.percentual_gordura !== undefined && (
                              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px]">% GORDURA</span>
                                <span className="font-bold text-slate-800">{c.percentual_gordura}%</span>
                              </div>
                            )}

                            {c.cintura !== null && c.cintura !== undefined && (
                              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px]">CINTURA</span>
                                <span className="font-bold text-slate-800">{c.cintura} cm</span>
                              </div>
                            )}

                            {c.quadril !== null && c.quadril !== undefined && (
                              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                <span className="text-slate-400 block text-[10px]">QUADRIL</span>
                                <span className="font-bold text-slate-800">{c.quadril} cm</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Observações da Consulta */}
                        {c.observacoes && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl">
                            <span className="font-semibold text-slate-500">Notas: </span>
                            {c.observacoes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================ */}
      {/* SEÇÃO 3: PLANOS ALIMENTARES                                      */}
      {/* ================================================================ */}
      {activeSection === "planos" && (
        <div className="space-y-6 animate-fade-in">
          <Card className="bg-white border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>Planos Alimentares do Paciente</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gere e consulte prescrições e cardápios individualizados
                </p>
              </div>

              {/* Botão Gerar Plano Alimentar bem visível (conforme regra do prompt 5: sem funcionalidade ainda) */}
              <Button
                onClick={() => alert("A geração de Planos Alimentares será implementada no próximo prompt! ✨")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md shadow-emerald-700/25 gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar Plano Alimentar</span>
              </Button>
            </div>

            {/* Histórico de Planos */}
            <div className="pt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Histórico de Planos Salvos
              </h4>

              {loadingPlanos ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : planos.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Nenhum plano alimentar gerado ainda
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                    Quando você gerar planos para este paciente, eles ficarão salvos aqui em ordem cronológica.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {planos.map((plano) => {
                    const isExpanded = selectedPlano?.id === plano.id
                    const dataCriacao = new Date(plano.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })

                    return (
                      <div
                        key={plano.id}
                        className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
                      >
                        <button
                          onClick={() => setSelectedPlano(isExpanded ? null : plano)}
                          className="w-full p-4 flex items-center justify-between text-left bg-white hover:bg-emerald-50/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                Plano Alimentar — {dataCriacao}
                              </p>
                              <p className="text-xs text-slate-400">
                                Clique para {isExpanded ? "ocultar" : "ver conteúdo completo"}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        {/* Conteúdo completo ao clicar no plano */}
                        {isExpanded && (
                          <div className="p-5 bg-slate-50 border-t border-slate-200 text-xs text-slate-700 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                            {typeof plano.conteudo === "object"
                              ? JSON.stringify(plano.conteudo, null, 2)
                              : String(plano.conteudo)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Modal de Nova Consulta ────────────────────────────────────── */}
      <NovaConsultaModal
        isOpen={isConsultaModalOpen}
        pacienteId={pacienteId}
        onClose={() => setIsConsultaModalOpen(false)}
        onSuccess={handleConsultaSaved}
      />
    </div>
  )
}
export default PacienteDetailView
