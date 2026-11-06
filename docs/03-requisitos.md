# 3. Requisitos Funcionais e Não Funcionais

## 3.1 Requisitos Funcionais (RF)

Requisitos funcionais descrevem **o que** o sistema deve fazer.

### Módulo: Autenticação

| ID    | Requisito | Prioridade |
|-------|-----------|------------|
| RF-01 | O sistema deve permitir que qualquer visitante se cadastre informando nome, e-mail, CPF e senha. | Alta |
| RF-02 | O sistema deve autenticar usuários via e-mail e senha, retornando um token JWT. | Alta |
| RF-03 | O sistema deve redirecionar o usuário autenticado para o painel correspondente ao seu perfil (cliente ou admin). | Alta |
| RF-04 | O sistema deve encerrar a sessão ao receber um token expirado ou inválido, redirecionando para a tela de login. | Alta |

### Módulo: Usuários

| ID    | Requisito | Prioridade |
|-------|-----------|------------|
| RF-05 | O cliente deve poder visualizar e editar seus dados pessoais (nome, CPF, telefone, senha). | Alta |
| RF-06 | O e-mail do usuário não pode ser alterado após o cadastro. | Alta |
| RF-07 | O administrador deve poder listar todos os usuários cadastrados com paginação. | Média |
| RF-08 | O administrador deve poder excluir um usuário (e todos os seus dados em cascata). | Média |

### Módulo: Veículos

| ID    | Requisito | Prioridade |
|-------|-----------|------------|
| RF-09 | O cliente deve poder cadastrar veículos informando marca, modelo, ano, placa, cor e tipo. | Alta |
| RF-10 | A placa do veículo deve ser única no sistema; tentativa de duplicata deve ser rejeitada com mensagem clara. | Alta |
| RF-11 | O cliente deve poder editar os dados do veículo, exceto a placa. | Média |
| RF-12 | O cliente deve poder excluir seus próprios veículos. | Média |
| RF-13 | O administrador deve poder visualizar todos os veículos cadastrados com informações do proprietário. | Média |
| RF-14 | O administrador deve poder excluir qualquer veículo. | Média |

### Módulo: Serviços

| ID    | Requisito | Prioridade |
|-------|-----------|------------|
| RF-15 | O administrador deve poder criar serviços informando nome, descrição, preço, duração e tipos de veículo compatíveis. | Alta |
| RF-16 | O administrador deve poder editar e excluir serviços. | Alta |
| RF-17 | O administrador deve poder ativar ou desativar um serviço sem excluí-lo. | Média |
| RF-18 | Apenas serviços ativos devem ser listados para o cliente no momento do agendamento. | Alta |
| RF-19 | Os serviços disponíveis para agendamento devem ser filtrados pelo tipo do veículo selecionado. | Alta |

### Módulo: Agendamentos

| ID    | Requisito | Prioridade |
|-------|-----------|------------|
| RF-20 | O cliente deve poder agendar uma lavagem selecionando veículo, serviço, data/hora e observações opcionais. | Alta |
| RF-21 | O sistema deve impedir agendamentos em horários já ocupados, considerando a duração do serviço. | Alta |
| RF-22 | O sistema deve impedir agendamentos fora do horário de funcionamento: Seg–Sex 08:00–12:00 e 13:30–18:00; Sáb 08:00–12:00; fechado aos domingos. | Alta |
| RF-23 | O preço total do agendamento deve ser capturado no momento da criação (snapshot), sem influência de alterações futuras no preço do serviço. | Alta |
| RF-24 | O cliente deve poder cancelar seus agendamentos com status "pendente". | Alta |
| RF-25 | O cliente deve poder visualizar seus agendamentos com paginação e informações do serviço e veículo. | Alta |
| RF-26 | O administrador deve poder visualizar todos os agendamentos com filtro de paginação. | Alta |
| RF-27 | O administrador deve poder alterar o status de qualquer agendamento para qualquer valor válido. | Alta |
| RF-28 | O administrador deve poder excluir qualquer agendamento. | Média |

---

## 3.2 Requisitos Não Funcionais (RNF)

Requisitos não funcionais descrevem **como** o sistema deve se comportar.

### Segurança

| ID     | Requisito |
|--------|-----------|
| RNF-01 | Senhas devem ser armazenadas com hash bcrypt (fator de custo 12). Nunca em texto simples. |
| RNF-02 | A API deve ser protegida por autenticação JWT com expiração de 7 dias. |
| RNF-03 | Rotas administrativas devem verificar o perfil do token (`autorizar('admin')`), retornando HTTP 403 para acesso não autorizado. |
| RNF-04 | A aplicação deve ser servida exclusivamente via HTTPS (TLS 1.2+), com redirecionamento automático de HTTP → HTTPS. |
| RNF-05 | O Nginx deve configurar os cabeçalhos de segurança: `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy`. |
| RNF-06 | As origens permitidas pelo CORS devem ser configuradas via variável de ambiente (`CORS_ORIGIN`), nunca hardcoded. |
| RNF-07 | O backend deve estar em rede Docker interna, nunca exposto diretamente ao host. |

### Validação de Dados

| ID     | Requisito |
|--------|-----------|
| RNF-08 | E-mail deve ser validado por regex no backend e no frontend. |
| RNF-09 | CPF deve ser validado pelo algoritmo de dígitos verificadores (não apenas formato). |
| RNF-10 | Senha deve exigir mínimo 8 caracteres, letra maiúscula, minúscula, número e caractere especial (`@$!%*?&`). |
| RNF-11 | Todas as queries ao banco devem usar parâmetros do Sequelize (ORM), prevenindo SQL Injection. |

### Desempenho e Disponibilidade

| ID     | Requisito |
|--------|-----------|
| RNF-12 | Todas as listagens devem suportar paginação (`pagina` + `limite`), com limite máximo de 50 itens por página. |
| RNF-13 | O frontend deve exibir indicador de carregamento (spinner) durante requisições de fetch inicial de cada página. |
| RNF-14 | Os serviços Docker devem ter política de reinicialização `unless-stopped`. |
| RNF-15 | Os dados do MySQL devem ser persistidos em volume Docker nomeado (`mysql_data`). |

### Usabilidade e Compatibilidade

| ID     | Requisito |
|--------|-----------|
| RNF-16 | A interface deve ser responsiva, adaptando-se a dispositivos móveis (mínimo 375px de largura). |
| RNF-17 | Em dispositivos móveis, tabelas de dados devem ser substituídas por cards empilhados. |
| RNF-18 | O menu lateral (sidebar) deve ser colapsável em dispositivos com tela menor que 1024px (breakpoint `lg`). |
| RNF-19 | O sistema deve funcionar nos navegadores modernos: Chrome, Firefox, Edge e Safari (últimas 2 versões). |
| RNF-20 | Mensagens de erro e sucesso devem ser exibidas via notificações toast no topo da tela. |

### Manutenibilidade

| ID     | Requisito |
|--------|-----------|
| RNF-21 | O código-fonte deve ser escrito em TypeScript tanto no frontend quanto no backend. |
| RNF-22 | O backend deve seguir a separação de camadas: rotas → controllers → services → models. |
| RNF-23 | Commits devem seguir o padrão Conventional Commits, validados pelo Husky + commitlint. |
| RNF-24 | Segredos (senhas, JWT secret) devem ser armazenados em variáveis de ambiente (`.env`), nunca no repositório. |
| RNF-25 | O projeto deve ter cobertura de testes unitários no backend, verificável via `npm run test:coverage`. |
