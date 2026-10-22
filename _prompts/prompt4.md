# Prompt 4 — Cadastro e listagem de pacientes

Agora vamos criar a tela de pacientes do sistema. Ela é composta por duas partes: a listagem de pacientes e o formulário de cadastro.

## Tela de listagem de pacientes

- Exibir todos os pacientes cadastrados pela nutricionista logada
- Cada paciente exibe: nome, objetivo e data da última consulta
- Campo de busca por nome no topo da listagem
- Botão "Novo Paciente" que redireciona para o formulário de cadastro
- Cada paciente da lista deve ser clicável e redirecionar para o perfil do paciente
- Se não houver pacientes cadastrados, exibir a mensagem "Nenhum paciente cadastrado ainda"

## Formulário de cadastro — página nova

O formulário deve ser organizado em 3 abas: Pessoal, Clínico e Hábitos.

### Aba 1 — Pessoal
- Nome completo (texto, obrigatório)
- Data de nascimento (seletor de data — sistema calcula a idade automaticamente)
- Sexo (seleção única: Feminino, Masculino, Outro)
- WhatsApp (número formatado)
- Email (texto, formato email)

### Aba 2 — Clínico
- Peso atual em kg (número — sistema exibe "kg" automaticamente)
- Altura em cm (número — sistema exibe "cm" automaticamente)
- IMC (calculado automaticamente pelo sistema a partir do peso e altura, somente leitura)
- Objetivo (múltipla escolha: Emagrecer, Ganhar massa, Controlar diabetes, Saúde geral, Performance esportiva, Reeducação alimentar) + campo de texto livre adicional
- Nível de atividade física (seleção única: Sedentário, Levemente ativo, Moderadamente ativo, Muito ativo, Extremamente ativo)
- Patologias ou condições de saúde (múltipla escolha: Diabetes, Hipertensão, Hipotireoidismo, Hipertireoidismo, Síndrome do ovário policístico, Doença celíaca, Colesterol alto) + opção "Nenhum" + campo para adicionar livremente
- Restrições alimentares (múltipla escolha: Lactose, Glúten, Açúcar, Carne vermelha, Frutos do mar) + opção "Nenhum" + campo para adicionar livremente
- Alergias alimentares (múltipla escolha: Amendoim, Leite, Ovo, Soja, Trigo, Frutos do mar) + opção "Nenhum" + campo para adicionar livremente
- Medicamentos contínuos (texto livre)
- Suplementos em uso (texto livre)

### Aba 3 — Hábitos
- Quantas refeições faz por dia (número)
- Horário que acorda (número — sistema converte automaticamente para formato de hora, ex: 6 → "06:00", 630 → "06:30")
- Horário que dorme (número — sistema converte automaticamente para formato de hora, ex: 23 → "23:00", 2230 → "22:30")
- Quantidade de água por dia (número — sistema exibe "litros" automaticamente)
- Pratica atividade física (sim/não — se sim, abre campo de texto: qual atividade e frequência semanal)
- Observações gerais (texto livre)

## Regras importantes
- O único campo obrigatório é o nome completo
- Ao salvar, vincular o paciente à nutricionista logada via nutricionista_id
- Após salvar, redirecionar para o perfil do paciente recém cadastrado
- Exibir mensagem de sucesso ao salvar

## Design
- Seguir o mesmo padrão visual do sistema (verde e branco)
- Menu lateral fixo mantido na tela de listagem e no formulário