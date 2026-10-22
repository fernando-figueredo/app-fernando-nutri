# Prompt 3 — Dashboard principal

Agora vamos criar o dashboard principal do sistema. Essa é a primeira tela que a nutricionista vê após fazer login.

## Layout
- Menu lateral fixo com as opções: Dashboard, Pacientes
- Área principal com os cards de informação

## Cards de informação
O dashboard deve exibir 3 cards principais:

### Card 1 — Total de pacientes ativos
- Exibe o número total de pacientes cadastrados pela nutricionista logada

### Card 2 — Consultas da semana
- Exibe o número de consultas registradas na semana atual

### Card 3 — Pacientes sem retorno
- Exibe uma lista com o nome dos pacientes cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado
- Cada nome da lista deve ser clicável e redirecionar para o perfil do paciente

## Regras importantes
- Todos os dados devem ser carregados do Neon em tempo real
- Exibir apenas dados da nutricionista logada
- Se não houver pacientes sem retorno, exibir a mensagem "Nenhum paciente sem retorno no momento"

## Design
- Seguir o mesmo padrão visual da tela de autenticação
- Cards com visual limpo, moderno e profissional
- Menu lateral fixo com logo "Fernando Nutri" no topo