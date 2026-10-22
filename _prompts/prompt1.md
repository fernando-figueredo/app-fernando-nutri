# Prompt 1 — Base do projeto + Neon completo

Você vai criar o banco de dados para um sistema de gestão para nutricionistas. Você tem acesso ao Neon via MCP e o projeto já foi criado com o nome de "Fernando Nutri". Então pode e deve criar toda a estrutura diretamente via MCP, sem necessidade de copiar SQL manualmente.

Crie as seguintes tabelas com todos os campos abaixo:

## Tabela `nutricionistas`
- id (uuid, primary key, gerado automaticamente)
- nome (text, not null)
- email (text, not null, unique)
- created_at (timestamp, gerado automaticamente)

## Tabela `pacientes`
- id (uuid, primary key, gerado automaticamente)
- nutricionista_id (uuid, foreign key → nutricionistas.id)
- nome (text, not null)
- data_nascimento (date)
- sexo (text)
- telefone (text)
- whatsapp (text)
- email (text)
- peso_inicial (numeric)
- altura (numeric)
- objetivos (text array)
- objetivo_texto (text)
- nivel_atividade (text)
- patologias (text array)
- restricoes_alimentares (text array)
- alergias (text array)
- medicamentos (text)
- suplementos (text)
- refeicoes_por_dia (integer)
- horario_acorda (text)
- horario_dorme (text)
- litros_agua (numeric)
- atividade_fisica (boolean)
- atividade_fisica_descricao (text)
- observacoes (text)
- created_at (timestamp, gerado automaticamente)

## Tabela `consultas`
- id (uuid, primary key, gerado automaticamente)
- paciente_id (uuid, foreign key → pacientes.id)
- data_consulta (date, not null)
- peso (numeric)
- cintura (numeric)
- quadril (numeric)
- percentual_gordura (numeric)
- observacoes (text)
- proximo_retorno (date)
- created_at (timestamp, gerado automaticamente)

## Tabela `planos_alimentares`
- id (uuid, primary key, gerado automaticamente)
- paciente_id (uuid, foreign key → pacientes.id)
- conteudo (jsonb, not null)
- created_at (timestamp, gerado automaticamente)

Após criar todas as tabelas e relacionamentos, ative o Row Level Security (RLS) em todas as tabelas para garantir que cada nutricionista acesse apenas os seus próprios dados. Configure as policies necessárias para isso. Neon Auth está habilitado no banco.

Por fim, confirme que tudo foi criado corretamente listando as tabelas e seus campos.