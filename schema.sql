-- ==============================================================================
-- Fernando Nutri — Schema do Banco de Dados PostgreSQL (Neon)
-- Executado e configurado diretamente via MCP Server do Neon
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID caso necessário
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Criação das Tabelas
-- ==============================================================================

-- Tabela: nutricionistas
CREATE TABLE IF NOT EXISTS public.nutricionistas (
    id uuid PRIMARY KEY DEFAULT COALESCE(auth.uid(), gen_random_uuid()),
    nome text NOT NULL,
    email text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: pacientes
CREATE TABLE IF NOT EXISTS public.pacientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nutricionista_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.nutricionistas(id) ON DELETE CASCADE,
    nome text NOT NULL,
    data_nascimento date,
    sexo text,
    telefone text,
    whatsapp text,
    email text,
    peso_inicial numeric,
    altura numeric,
    objetivos text[],
    objetivo_texto text,
    nivel_atividade text,
    patologias text[],
    restricoes_alimentares text[],
    alergias text[],
    medicamentos text,
    suplementos text,
    refeicoes_por_dia integer,
    horario_acorda text,
    horario_dorme text,
    litros_agua numeric,
    atividade_fisica boolean,
    atividade_fisica_descricao text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: consultas
CREATE TABLE IF NOT EXISTS public.consultas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    data_consulta date NOT NULL,
    peso numeric,
    cintura numeric,
    quadril numeric,
    percentual_gordura numeric,
    observacoes text,
    proximo_retorno date,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: planos_alimentares
CREATE TABLE IF NOT EXISTS public.planos_alimentares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    conteudo jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ==============================================================================
-- 3. Índices de Desempenho
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_pacientes_nutricionista_id ON public.pacientes(nutricionista_id);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON public.consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_planos_alimentares_paciente_id ON public.planos_alimentares(paciente_id);

-- ==============================================================================
-- 4. Permissões
-- ==============================================================================
GRANT ALL ON TABLE public.nutricionistas, public.pacientes, public.consultas, public.planos_alimentares TO authenticated;

-- ==============================================================================
-- 5. Row Level Security (RLS) & Policies
-- ==============================================================================
ALTER TABLE public.nutricionistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_alimentares ENABLE ROW LEVEL SECURITY;

-- Política nutricionistas: Nutricionista acessa e gerencia apenas seu próprio registro
CREATE POLICY "nutricionistas_manage_own" ON public.nutricionistas
FOR ALL TO authenticated
USING (auth.uid() = id OR id::text = auth.user_id())
WITH CHECK (auth.uid() = id OR id::text = auth.user_id());

-- Política pacientes: Nutricionista acessa e gerencia apenas seus próprios pacientes
CREATE POLICY "pacientes_manage_own" ON public.pacientes
FOR ALL TO authenticated
USING (auth.uid() = nutricionista_id OR nutricionista_id::text = auth.user_id())
WITH CHECK (auth.uid() = nutricionista_id OR nutricionista_id::text = auth.user_id());

-- Política consultas: Nutricionista acessa e gerencia consultas apenas dos seus pacientes
CREATE POLICY "consultas_manage_own" ON public.consultas
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.pacientes
        WHERE pacientes.id = consultas.paciente_id
        AND (pacientes.nutricionista_id = auth.uid() OR pacientes.nutricionista_id::text = auth.user_id())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.pacientes
        WHERE pacientes.id = consultas.paciente_id
        AND (pacientes.nutricionista_id = auth.uid() OR pacientes.nutricionista_id::text = auth.user_id())
    )
);

-- Política planos_alimentares: Nutricionista acessa e gerencia planos alimentares apenas dos seus pacientes
CREATE POLICY "planos_alimentares_manage_own" ON public.planos_alimentares
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.pacientes
        WHERE pacientes.id = planos_alimentares.paciente_id
        AND (pacientes.nutricionista_id = auth.uid() OR pacientes.nutricionista_id::text = auth.user_id())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.pacientes
        WHERE pacientes.id = planos_alimentares.paciente_id
        AND (pacientes.nutricionista_id = auth.uid() OR pacientes.nutricionista_id::text = auth.user_id())
    )
);
