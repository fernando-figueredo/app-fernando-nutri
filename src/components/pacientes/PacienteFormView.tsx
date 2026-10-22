import React, { useState, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { dataApiFetch } from "@/lib/data-api"
import { PacienteFormData } from "@/types/paciente"
import {
  formatPhone,
  formatTimeInput,
  calculateAge,
  calculateIMC,
} from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User,
  HeartPulse,
  Sparkles,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Scale,
  Calendar,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Droplets,
  Activity,
  FileText,
  Pill,
} from "lucide-react"

interface PacienteFormViewProps {
  onBack: () => void
  onSuccess: (newPacienteId: string) => void
}

// Opções pré-definidas conforme especificação do Prompt 4
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

export const PacienteFormView: React.FC<PacienteFormViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { user, session } = useAuth()
  const [activeTab, setActiveTab] = useState<"pessoal" | "clinico" | "habitos">("pessoal")

  // Estado do Formulário
  const [formData, setFormData] = useState<PacienteFormData>({
    nome: "",
    data_nascimento: "",
    data_inicio_tratamento: new Date().toISOString().split("T")[0],
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

  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ nome?: string }>({})

  // Cálculos dinâmicos em tempo real
  const idade = useMemo(
    () => calculateAge(formData.data_nascimento),
    [formData.data_nascimento]
  )

  const imcInfo = useMemo(() => {
    const peso = parseFloat(formData.peso_inicial.replace(",", "."))
    const altura = parseFloat(formData.altura.replace(",", "."))
    return calculateIMC(peso, altura)
  }, [formData.peso_inicial, formData.altura])

  // Handlers para campos básicos
  const updateField = (field: keyof PacienteFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "nome" && value.trim()) {
      setFieldErrors((prev) => ({ ...prev, nome: undefined }))
    }
  }

  // Helper para múltipla escolha com toggle e tratamento de "Nenhum"
  const toggleCheckbox = (
    field: "objetivos" | "patologias" | "restricoes_alimentares" | "alergias",
    item: string
  ) => {
    setFormData((prev) => {
      const list = prev[field]
      if (item === "Nenhum") {
        return {
          ...prev,
          [field]: list.includes("Nenhum") ? [] : ["Nenhum"],
        }
      }

      // Se marcou outro item, remove o "Nenhum"
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

  // Adicionar item livre para listas
  const handleAddCustomItem = (
    listField: "patologias" | "restricoes_alimentares" | "alergias",
    inputField: "patologia_livre" | "restricao_livre" | "alergia_livre"
  ) => {
    const val = formData[inputField].trim()
    if (!val) return

    setFormData((prev) => {
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
    setFormData((prev) => ({
      ...prev,
      [listField]: prev[listField].filter((x) => x !== item),
    }))
  }

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Regra obrigatória: Apenas o Nome Completo é obrigatório
    if (!formData.nome.trim()) {
      setFieldErrors({ nome: "O nome completo é obrigatório." })
      setActiveTab("pessoal")
      setErrorMessage("Por favor, preencha o nome completo do paciente.")
      return
    }

    if (!user?.id) {
      setErrorMessage("Sessão expirada. Faça login novamente.")
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const pesoNum = formData.peso_inicial
        ? parseFloat(formData.peso_inicial.replace(",", "."))
        : null
      const alturaNum = formData.altura
        ? parseFloat(formData.altura.replace(",", "."))
        : null
      const refeicoesNum = formData.refeicoes_por_dia
        ? parseInt(formData.refeicoes_por_dia, 10)
        : null
      const litrosAguaNum = formData.litros_agua
        ? parseFloat(formData.litros_agua.replace(",", "."))
        : null

      // Payload compatível com a tabela public.pacientes do Postgres
      const payload: Record<string, any> = {
        nutricionista_id: user.id,
        nome: formData.nome.trim(),
        data_nascimento: formData.data_nascimento || null,
        sexo: formData.sexo || null,
        telefone: formData.telefone.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        email: formData.email.trim() || null,
        peso_inicial: isNaN(pesoNum as number) ? null : pesoNum,
        altura: isNaN(alturaNum as number) ? null : alturaNum,
        objetivos: formData.objetivos.length > 0 ? formData.objetivos : null,
        objetivo_texto: formData.objetivo_texto.trim() || null,
        nivel_atividade: formData.nivel_atividade || null,
        patologias: formData.patologias.length > 0 ? formData.patologias : null,
        restricoes_alimentares:
          formData.restricoes_alimentares.length > 0
            ? formData.restricoes_alimentares
            : null,
        alergias: formData.alergias.length > 0 ? formData.alergias : null,
        medicamentos: formData.medicamentos.trim() || null,
        suplementos: formData.suplementos.trim() || null,
        refeicoes_por_dia: isNaN(refeicoesNum as number) ? null : refeicoesNum,
        horario_acorda: formData.horario_acorda.trim() || null,
        horario_dorme: formData.horario_dorme.trim() || null,
        litros_agua: isNaN(litrosAguaNum as number) ? null : litrosAguaNum,
        atividade_fisica: formData.atividade_fisica,
        atividade_fisica_descricao: formData.atividade_fisica
          ? formData.atividade_fisica_descricao.trim() || null
          : null,
        observacoes: formData.observacoes.trim() || null,
      }

      // Inserção na Data API com Prefer: return=representation para recuperar o id gerado
      const res = await dataApiFetch<any[]>("/pacientes", {
        method: "POST",
        body: payload,
        token: session?.token,
        prefer: "return=representation",
      })

      const createdId = Array.isArray(res) && res[0]?.id ? res[0].id : null

      let finalPacienteId = createdId
      if (!finalPacienteId) {
        // Fallback: se não retornar representation, consulta pelo nome recente
        const lookup = await dataApiFetch<any[]>(
          `/pacientes?nutricionista_id=eq.${user.id}&nome=eq.${encodeURIComponent(
            formData.nome.trim()
          )}&order=created_at.desc&limit=1`,
          { token: session?.token }
        )
        finalPacienteId = lookup?.[0]?.id
      }

      // Se informou data de início do tratamento, registra automaticamente como a 1ª consulta
      if (finalPacienteId && formData.data_inicio_tratamento) {
        try {
          await dataApiFetch("/consultas", {
            method: "POST",
            body: {
              paciente_id: finalPacienteId,
              data_consulta: formData.data_inicio_tratamento,
              peso: isNaN(pesoNum as number) ? null : pesoNum,
              observacoes: "Primeira consulta (Início do acompanhamento nutricional)",
            },
            token: session?.token,
          })
        } catch (consultaErr) {
          console.warn("Aviso ao registrar consulta inicial do paciente:", consultaErr)
        }
      }

      onSuccess(finalPacienteId || "")
    } catch (err: any) {
      console.error("Erro ao salvar paciente:", err)
      setErrorMessage(
        "Não foi possível salvar o paciente no momento. Verifique a conexão e tente novamente."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ── Topo do Formulário com Botão Voltar ──────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para pacientes</span>
        </button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={saving}
            className="border-slate-200 text-slate-600"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-md shadow-emerald-700/20 gap-2 min-w-[140px]"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Paciente</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Mensagem de Erro ────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Abas de Navegação ───────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("pessoal")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "pessoal"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50"
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Pessoal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("clinico")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "clinico"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50"
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>2. Clínico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("habitos")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "habitos"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>3. Hábitos</span>
        </button>
      </div>

      {/* ── Conteúdo do Formulário ──────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* ================================================================ */}
        {/* ABA 1: PESSOAL                                                   */}
        {/* ================================================================ */}
        {activeTab === "pessoal" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-800">Dados Pessoais do Paciente</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Identificação básica e informações de contato
              </p>
            </div>

            {/* Nome Completo (Obrigatório) e Data de Início do Tratamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="nome" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  Nome completo <span className="text-red-500 font-bold">*</span>
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Maria Eduarda Silva"
                  value={formData.nome}
                  onChange={(e) => updateField("nome", e.target.value)}
                  error={fieldErrors.nome}
                  icon={<User className="w-4 h-4" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white"
                  required
                />
              </div>

              {/* Data de Início do Tratamento (1ª Consulta) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="data_inicio_tratamento" className="text-sm font-semibold text-slate-700">
                    Início do tratamento
                  </Label>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    1ª Consulta
                  </span>
                </div>
                <Input
                  id="data_inicio_tratamento"
                  type="date"
                  value={formData.data_inicio_tratamento}
                  onChange={(e) => updateField("data_inicio_tratamento", e.target.value)}
                  icon={<Calendar className="w-4 h-4" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            {/* Data de Nascimento e Sexo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data de Nascimento */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="data_nascimento" className="text-sm font-semibold text-slate-700">
                    Data de nascimento
                  </Label>
                  {idade !== null && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {idade} {idade === 1 ? "ano" : "anos"}
                    </span>
                  )}
                </div>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => updateField("data_nascimento", e.target.value)}
                  icon={<Calendar className="w-4 h-4" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Sexo */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Sexo</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["Feminino", "Masculino", "Outro"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateField("sexo", formData.sexo === s ? "" : s)}
                      className={`h-11 rounded-xl text-xs font-semibold border transition-all ${
                        formData.sexo === s
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
              {/* WhatsApp */}
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="text-sm font-semibold text-slate-700">
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(00) 90000-0000"
                  value={formData.whatsapp}
                  onChange={(e) => updateField("whatsapp", formatPhone(e.target.value))}
                  icon={<MessageCircle className="w-4 h-4" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="paciente@exemplo.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="button"
                onClick={() => setActiveTab("clinico")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 rounded-xl"
              >
                Prosseguir para Clínico →
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* ABA 2: CLÍNICO                                                   */}
        {/* ================================================================ */}
        {activeTab === "clinico" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-800">Avaliação Clínica e Histórico</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Medidas corporais, patologias, restrições e objetivos
              </p>
            </div>

            {/* Medidas: Peso, Altura, IMC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Peso Inicial */}
              <div className="space-y-1.5">
                <Label htmlFor="peso_inicial" className="text-sm font-semibold text-slate-700">
                  Peso atual (kg)
                </Label>
                <div className="relative">
                  <Input
                    id="peso_inicial"
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={formData.peso_inicial}
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
                <Label htmlFor="altura" className="text-sm font-semibold text-slate-700">
                  Altura (cm)
                </Label>
                <div className="relative">
                  <Input
                    id="altura"
                    type="number"
                    step="0.5"
                    placeholder="175"
                    value={formData.altura}
                    onChange={(e) => updateField("altura", e.target.value)}
                    className="bg-slate-50/50 border-slate-200 focus:bg-white pr-10"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    cm
                  </span>
                </div>
              </div>

              {/* IMC Calculado (somente leitura) */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">
                  IMC (calculado automaticamente)
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
              <Label className="text-sm font-semibold text-slate-700">
                Objetivos nutricionais (múltipla escolha)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OBJETIVOS_OPTIONS.map((obj) => {
                  const isSelected = formData.objetivos.includes(obj)
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
                placeholder="Objetivo adicional em texto livre (opcional)"
                value={formData.objetivo_texto}
                onChange={(e) => updateField("objetivo_texto", e.target.value)}
                className="mt-2 bg-slate-50/50 border-slate-200 focus:bg-white text-xs"
              />
            </div>

            {/* Nível de Atividade Física */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold text-slate-700">
                Nível de atividade física geral
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {NIVEIS_ATIVIDADE.map((nivel) => (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => updateField("nivel_atividade", formData.nivel_atividade === nivel ? "" : nivel)}
                    className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                      formData.nivel_atividade === nivel
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
              <Label className="text-sm font-semibold text-slate-700">
                Patologias ou condições de saúde
              </Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleCheckbox("patologias", "Nenhum")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    formData.patologias.includes("Nenhum")
                      ? "bg-emerald-700 border-emerald-700 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Nenhum
                </button>
                {PATOLOGIAS_OPTIONS.map((item) => {
                  const isSelected = formData.patologias.includes(item)
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

              {/* Itens adicionados livremente */}
              {formData.patologias.filter((p) => p !== "Nenhum" && !PATOLOGIAS_OPTIONS.includes(p)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.patologias
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

              {/* Campo para adicionar livremente */}
              <div className="flex gap-2 mt-2">
                <Input
                  type="text"
                  placeholder="Adicionar outra patologia..."
                  value={formData.patologia_livre}
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
              <Label className="text-sm font-semibold text-slate-700">Restrições alimentares</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleCheckbox("restricoes_alimentares", "Nenhum")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    formData.restricoes_alimentares.includes("Nenhum")
                      ? "bg-emerald-700 border-emerald-700 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Nenhum
                </button>
                {RESTRICOES_OPTIONS.map((item) => {
                  const isSelected = formData.restricoes_alimentares.includes(item)
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

              {formData.restricoes_alimentares.filter((p) => p !== "Nenhum" && !RESTRICOES_OPTIONS.includes(p)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.restricoes_alimentares
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
                  value={formData.restricao_livre}
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

            {/* Alergias Alimentares */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-semibold text-slate-700">Alergias alimentares</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleCheckbox("alergias", "Nenhum")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    formData.alergias.includes("Nenhum")
                      ? "bg-emerald-700 border-emerald-700 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Nenhum
                </button>
                {ALERGIAS_OPTIONS.map((item) => {
                  const isSelected = formData.alergias.includes(item)
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

              {formData.alergias.filter((p) => p !== "Nenhum" && !ALERGIAS_OPTIONS.includes(p)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.alergias
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
                  value={formData.alergia_livre}
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
                <Label htmlFor="medicamentos" className="text-sm font-semibold text-slate-700">
                  Medicamentos contínuos
                </Label>
                <textarea
                  id="medicamentos"
                  rows={2}
                  placeholder="Ex: Losartana 50mg pela manhã..."
                  value={formData.medicamentos}
                  onChange={(e) => updateField("medicamentos", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="suplementos" className="text-sm font-semibold text-slate-700">
                  Suplementos em uso
                </Label>
                <textarea
                  id="suplementos"
                  rows={2}
                  placeholder="Ex: Creatina 5g, Vitamina D 2000UI..."
                  value={formData.suplementos}
                  onChange={(e) => updateField("suplementos", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("pessoal")}
                className="border-slate-200 text-slate-600"
              >
                ← Voltar para Pessoal
              </Button>
              <Button
                type="button"
                onClick={() => setActiveTab("habitos")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 rounded-xl"
              >
                Prosseguir para Hábitos →
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* ABA 3: HÁBITOS                                                   */}
        {/* ================================================================ */}
        {activeTab === "habitos" && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-800">Rotina diária e Estilo de Vida</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Horários, hidratação, refeições e atividade física
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantas refeições por dia */}
              <div className="space-y-1.5">
                <Label htmlFor="refeicoes_por_dia" className="text-sm font-semibold text-slate-700">
                  Refeições por dia
                </Label>
                <Input
                  id="refeicoes_por_dia"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Ex: 4"
                  value={formData.refeicoes_por_dia}
                  onChange={(e) => updateField("refeicoes_por_dia", e.target.value)}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Quantidade de água por dia */}
              <div className="space-y-1.5">
                <Label htmlFor="litros_agua" className="text-sm font-semibold text-slate-700">
                  Água por dia (litros)
                </Label>
                <div className="relative">
                  <Input
                    id="litros_agua"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.5"
                    value={formData.litros_agua}
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

            {/* Horários: Acorda e Dorme com conversão automática */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Horário que acorda */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="horario_acorda" className="text-sm font-semibold text-slate-700">
                    Horário que acorda
                  </Label>
                  <span className="text-[11px] text-slate-400">Ex: 6 → 06:00, 630 → 06:30</span>
                </div>
                <Input
                  id="horario_acorda"
                  type="text"
                  placeholder="Ex: 06:30"
                  value={formData.horario_acorda}
                  onChange={(e) => updateField("horario_acorda", e.target.value)}
                  onBlur={() => updateField("horario_acorda", formatTimeInput(formData.horario_acorda))}
                  icon={<Clock className="w-4 h-4" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Horário que dorme */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="horario_dorme" className="text-sm font-semibold text-slate-700">
                    Horário que dorme
                  </Label>
                  <span className="text-[11px] text-slate-400">Ex: 23 → 23:00, 2230 → 22:30</span>
                </div>
                <Input
                  id="horario_dorme"
                  type="text"
                  placeholder="Ex: 22:30"
                  value={formData.horario_dorme}
                  onChange={(e) => updateField("horario_dorme", e.target.value)}
                  onBlur={() => updateField("horario_dorme", formatTimeInput(formData.horario_dorme))}
                  icon={<Clock className="w-4 h-4" />}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>

            {/* Pratica Atividade Física */}
            <div className="space-y-3 pt-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-bold text-slate-800">Pratica atividade física?</Label>
                  <p className="text-xs text-slate-500">
                    Indique se o paciente realiza exercícios físicos regulares
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("atividade_fisica", true)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      formData.atividade_fisica
                        ? "bg-emerald-700 border-emerald-700 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("atividade_fisica", false)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      !formData.atividade_fisica
                        ? "bg-slate-800 border-slate-800 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {/* Se sim: Qual atividade e frequência semanal */}
              {formData.atividade_fisica && (
                <div className="pt-2 animate-fade-in space-y-1.5">
                  <Label htmlFor="atividade_descricao" className="text-xs font-semibold text-slate-700">
                    Qual atividade e frequência semanal?
                  </Label>
                  <Input
                    id="atividade_descricao"
                    type="text"
                    placeholder="Ex: Musculação 4x na semana + Corrida aos sábados"
                    value={formData.atividade_fisica_descricao}
                    onChange={(e) => updateField("atividade_fisica_descricao", e.target.value)}
                    icon={<Activity className="w-4 h-4 text-emerald-600" />}
                    className="bg-white border-slate-200 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Observações Gerais */}
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="observacoes" className="text-sm font-semibold text-slate-700">
                Observações gerais adicionais
              </Label>
              <textarea
                id="observacoes"
                rows={3}
                placeholder="Anotações livres sobre a rotina, preferências alimentares, histórico familiar, etc."
                value={formData.observacoes}
                onChange={(e) => updateField("observacoes", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all resize-none"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("clinico")}
                className="border-slate-200 text-slate-600"
              >
                ← Voltar para Clínico
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-8 rounded-xl shadow-md shadow-emerald-700/20 gap-2"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Concluir e Salvar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
