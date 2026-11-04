import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai"

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Utilize POST." })
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY não encontrada nas variáveis de ambiente.")
      return res.status(500).json({ error: "Chave GEMINI_API_KEY não configurada no servidor." })
    }

    const { paciente } = req.body || {}
    if (!paciente) {
      return res.status(400).json({ error: "Dados do paciente não informados no corpo da requisição." })
    }

    const dadosFormatados = `
- Nome: ${paciente.nome || "Não informado"}
- Data de Nascimento: ${paciente.data_nascimento || "Não informado"}
- Sexo: ${paciente.sexo || "Não informado"}
- Peso Atual / Inicial: ${paciente.peso_inicial ? `${paciente.peso_inicial} kg` : "Não informado"}
- Altura: ${paciente.altura ? `${paciente.altura} cm` : "Não informado"}
- Objetivos Selecionados: ${Array.isArray(paciente.objetivos) && paciente.objetivos.length > 0 ? paciente.objetivos.join(", ") : "Nenhum informado"}
- Detalhes do Objetivo: ${paciente.objetivo_texto || "Nenhum detalhe adicional"}
- Nível de Atividade Física: ${paciente.nivel_atividade || "Não informado"}
- Pratica Atividade Física: ${paciente.atividade_fisica ? `Sim (${paciente.atividade_fisica_descricao || "Sem detalhes"})` : "Não"}
- Patologias / Condições de Saúde: ${Array.isArray(paciente.patologias) && paciente.patologias.length > 0 ? paciente.patologias.join(", ") : "Nenhuma relatada"}
- Restrições Alimentares: ${Array.isArray(paciente.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0 ? paciente.restricoes_alimentares.join(", ") : "Nenhuma"}
- Alergias e Intolerâncias: ${Array.isArray(paciente.alergias) && paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "Nenhuma"}
- Medicamentos em Uso: ${paciente.medicamentos || "Nenhum"}
- Suplementos em Uso: ${paciente.suplementos || "Nenhum"}
- Refeições desejadas por dia: ${paciente.refeicoes_por_dia || "Não especificado"}
- Horário que acorda: ${paciente.horario_acorda || "Não informado"}
- Horário que dorme: ${paciente.horario_dorme || "Não informado"}
- Consumo diário de água: ${paciente.litros_agua ? `${paciente.litros_agua} litros` : "Não informado"}
- Observações do Nutricionista: ${paciente.observacoes || "Nenhuma"}
    `.trim()

    const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`

    const genAI = new GoogleGenerativeAI(apiKey)
    const schema: ResponseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        plano_semanal: {
          type: SchemaType.ARRAY,
          description: "Lista com os dias da semana e suas respectivas refeições",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              dia: {
                type: SchemaType.STRING,
                description: "Nome do dia da semana (ex: Segunda-feira)",
              },
              refeicoes: {
                type: SchemaType.OBJECT,
                properties: {
                  cafe_da_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "5 opções ou itens para o café da manhã",
                  },
                  lanche_manha: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "5 opções ou itens para o lanche da manhã",
                  },
                  almoco: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "5 opções ou itens para o almoço",
                  },
                  lanche_tarde: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "5 opções ou itens para o lanche da tarde",
                  },
                  jantar: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "5 opções ou itens para o jantar",
                  },
                },
                required: ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"],
              },
            },
            required: ["dia", "refeicoes"],
          },
        },
      },
      required: ["plano_semanal"],
    }

    // Lista de modelos suportados em ordem de preferência
    const candidateModels = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"]

    let lastError: any = null
    let responseText: string | null = null

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        })

        const result = await model.generateContent(prompt)
        responseText = result.response.text()
        if (responseText) {
          break
        }
      } catch (err: any) {
        lastError = err
        console.warn(`Tentativa com modelo ${modelName} falhou:`, err?.message || err)
        // Se for 503 ou 404, tenta o próximo modelo da lista
        continue
      }
    }

    if (!responseText) {
      throw lastError || new Error("Nenhum modelo da IA respondeu com sucesso.")
    }

    // Validação com try/catch ao tentar parsear JSON
    let parsedPlan: any
    try {
      parsedPlan = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Falha ao analisar JSON retornado pelo Gemini:", responseText, parseError)
      return res.status(502).json({
        error: "Resposta da IA não está em formato JSON válido.",
        raw: responseText,
      })
    }

    return res.status(200).json(parsedPlan)
  } catch (error: any) {
    console.error("Erro na Serverless Function /api/gerar-plano:", error)
    return res.status(500).json({
      error: error?.message || "Erro interno ao processar a geração com IA.",
    })
  }
}
