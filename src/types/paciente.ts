export interface Paciente {
  id: string
  nutricionista_id: string
  nome: string
  data_nascimento?: string | null
  sexo?: string | null
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[] | null
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[] | null
  restricoes_alimentares?: string[] | null
  alergias?: string[] | null
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
  created_at?: string
  // Campos computados ou agregados para a listagem
  ultima_consulta?: string | null
}

export interface PacienteFormData {
  // Aba 1 - Pessoal
  nome: string
  data_nascimento: string
  data_inicio_tratamento: string // Data de início do tratamento (criará a 1ª consulta automaticamente)
  sexo: string
  telefone: string
  whatsapp: string
  email: string

  // Aba 2 - Clínico
  peso_inicial: string
  altura: string
  objetivos: string[]
  objetivo_texto: string
  nivel_atividade: string
  patologias: string[]
  patologia_livre: string
  restricoes_alimentares: string[]
  restricao_livre: string
  alergias: string[]
  alergia_livre: string
  medicamentos: string
  suplementos: string

  // Aba 3 - Hábitos
  refeicoes_por_dia: string
  horario_acorda: string
  horario_dorme: string
  litros_agua: string
  atividade_fisica: boolean
  atividade_fisica_descricao: string
  observacoes: string
}

export interface Consulta {
  id: string
  paciente_id: string
  data_consulta: string
  peso?: number | null
  cintura?: number | null
  quadril?: number | null
  percentual_gordura?: number | null
  observacoes?: string | null
  proximo_retorno?: string | null
  created_at?: string
}

export interface PlanoAlimentar {
  id: string
  paciente_id: string
  conteudo: any
  created_at: string
}
