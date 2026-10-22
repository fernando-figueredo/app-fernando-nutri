# Prompt 5 — Perfil do paciente + Consultas

Agora vamos criar a página de perfil do paciente. Essa tela é acessada ao clicar em um paciente na listagem ou nos cards do dashboard.

## Layout geral
A página deve ser organizada em 3 seções: Dados do Paciente, Consultas e Planos Alimentares.

## Seção 1 — Dados do paciente

- Exibir todos os dados cadastrados do paciente organizados nas mesmas 3 abas do cadastro: Pessoal, Clínico e Hábitos
- Os campos devem ser editáveis diretamente na página
- Botão "Salvar alterações" para confirmar as edições
- Exibir mensagem de sucesso ao salvar

---

## Seção 2 — Consultas

- Gráfico de evolução de peso sempre visível, exibindo o peso registrado em cada consulta ao longo do tempo
- Preciso que ao cadastrar o Paciente eu possa colocar a data de início do tratamento, essa data ficará registrada como a primeira consulta
- Se não houver consultas ainda, o gráfico deve aparecer vazio com a mensagem "Nenhuma consulta registrada ainda"
- Lista de todas as consultas em ordem cronológica decrescente (mais recente primeiro) com: data, peso, cintura, quadril, % de gordura, observações e próximo retorno
- Botão "Nova Consulta" que abre um modal com o seguinte formulário:
  - Data da consulta (seletor de data, preenchida automaticamente com hoje, editável)
  - Peso atual em kg (número)
  - Cintura em cm (número, opcional)
  - Quadril em cm (número, opcional)
  - % de gordura (número, opcional)
  - Observações (texto livre)
  - Próximo retorno (seletor de data)
  - Botão "Salvar consulta"
- Ao salvar a consulta, fechar o modal, atualizar o gráfico e a lista automaticamente


## Seção 3 — Planos alimentares

- Botão "Gerar Plano Alimentar" bem visível
- Histórico de todos os planos salvos em ordem cronológica decrescente (mais recente primeiro) com a data de geração
- Ao clicar em um plano do histórico, exibir o conteúdo completo dele
- Se não houver planos salvos ainda, exibir a mensagem "Nenhum plano alimentar gerado ainda"

## Regras importantes
- Todos os dados devem ser carregados do Neon em tempo real
- Todas as alterações devem ser salvas no Neon
- A seção de planos alimentares será implementada no próximo prompt — por enquanto deixar o botão "Gerar Plano Alimentar" visível mas sem funcionalidade

## Design
- Seguir o mesmo padrão visual do sistema
- Menu lateral fixo mantido
- Gráfico de evolução de peso em destaque na seção de consultas