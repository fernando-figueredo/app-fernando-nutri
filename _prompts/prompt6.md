Você é um desenvolvedor full-stack sênior especializado em React, Neon e integração de LLMs. Sua tarefa é implementar a funcionalidade completa de geração automatizada de planos alimentares via IA dentro do sistema "Fernando Nutri".

#  STACK
- React (Vite)
- Neon (PostgreSQL)
- Google Gen AI SDK (@google/generative-ai) -> Modelo: `gemini-3.8-flash` ou superior

# OBJETIVO
Permitir que o nutricionista clique em um botão para acionar uma inteligência artificial que lê o perfil do paciente (objetivos, restrições, alergias) e gera um plano alimentar semanal estruturado em JSON. O resultado deve ser exibido em uma interface interativa e totalmente editável antes de ser persistido no banco de dados.

# SERVERLESS FUNCTION: `/api/gerar-plano`
Crie a função server-side garantindo segurança absoluta e tratamento de erros.

### Responsabilidades Técnicas:
1. **Segurança:** A `GEMINI_API_KEY` deve ser consumida estritamente via variável de ambiente no backend. Nunca vaze chaves para o cliente.
2. **Uso do SDK:** Utilize a versão recente do SDK oficial da Google (`@google/generative-ai`).
3. **Structured Outputs (Crucial):** Para garantir 100% de certeza que o Gemini retornará um JSON válido sem quebras de texto ou markdown, configure a chamada utilizando o parâmetro `responseMimeType: "application/json"` e, se possível, defina o `responseSchema`.
4. **Prompt Interno da IA:** O prompt enviado ao Gemini deve ser o seguinte:


Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
{dados_do_paciente}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como ```json ... ```), explicações, introduções ou textos complementares.
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
}


# FLUXO DO FRONTEND & COMPORTAMENTO DA INTERFACE
1. **Ponto de Partida:** Dentro do perfil do paciente, exibir a lista de históricos de planos já gerados.
2. **Ação:** Um botão em destaque "✨ Gerar Plano com IA". Ao clicar:
   - Dispara um Loading visual com mensagens dinâmicas (ex: "Buscando dados do paciente...", "IA calculando cardápio...").
   - O botão fica desabilitado para evitar cliques duplos.
3. **Retorno da API:** O JSON recebido alimenta o estado do formulário React. 
4. **Interface de Edição:** Exiba o plano gerado em formato de abas (Tabs) para separar os dias da semana (evitando sobrecarga de tela). Cada refeição do dia ativo exibe seus 5 inputs de texto preenchidos pela IA.
5. **Ajuste Manual:** A nutricionista pode alterar qualquer um dos inputs diretamente caso ache necessário.
6. **Persistência:** O botão "Salvar Plano Alimentar" só fica visível se houver um plano gerado/carregado na tela. Ao salvar, insere na tabela `planos_alimentares` (`paciente_id`, `conteudo`) e atualiza o histórico imediatamente, limpando a tela de edição ou voltando ao modo de exibição.


# TRATAMENTO DE ERROS E RESILIÊNCIA
- Se a API do Gemini falhar ou estourar o tempo limite (Timeout), exiba um Toast amigável: "Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?".
- Adicione uma validação com `try/catch` ao tentar dar `JSON.parse()` na resposta da IA para evitar crash no sistema caso ocorra alguma anomalia no texto.
- Se não gerar a versão IA, construa o plano alimentar manualmente seguindo as orientações e regras estabelecidas acima.


# NÃO FAZER
- Não faça chamadas diretas para a API do Gemini a partir do código do lado do cliente (frontend).
- Não hardcodeie a estrutura de dados em inglês se a exibição final para o usuário é em português.
- Não limpe o histórico de planos antigos ao salvar um novo; trate cada geração como um novo registro histórico.

---

# ENTREGÁVEIS DESEJADOS
1. Código completo da Serverless Function (`/api/gerar-plano`) configurada para o Gemini.
2. Componente React com gerenciamento de estado (Loading, Dados do Plano, Lista de Histórico).