# 9. Cenários de Qualidade (Quality Scenarios)

Cenários de qualidade tornam os atributos de qualidade do sistema mensuráveis e verificáveis. Cada cenário segue a estrutura: **Estímulo → Contexto → Resposta → Medida**.

---

## 9.1 Desempenho

### QS-01 — Tempo de resposta da API em carga normal

| Campo | Descrição |
|---|---|
| **Atributo** | Desempenho |
| **Estímulo** | Um cliente autenticado envia uma requisição `GET /api/appointments/meus` |
| **Contexto** | Sistema em operação normal com até 50 usuários simultâneos |
| **Resposta** | A API processa a requisição e retorna os dados paginados |
| **Medida** | Tempo de resposta ≤ 500ms em 95% das requisições (P95) |

### QS-02 — Carregamento inicial do frontend

| Campo | Descrição |
|---|---|
| **Atributo** | Desempenho |
| **Estímulo** | Usuário acessa `https://meuapp.local` pela primeira vez |
| **Contexto** | Rede local (LAN), conexão cabeada |
| **Resposta** | Nginx serve o bundle estático compilado pelo Vite |
| **Medida** | First Contentful Paint (FCP) ≤ 2 segundos |

---

## 9.2 Disponibilidade

### QS-03 — Disponibilidade do sistema

| Campo | Descrição |
|---|---|
| **Atributo** | Disponibilidade |
| **Estímulo** | Requisições contínuas de usuários ao longo do dia |
| **Contexto** | Ambiente de produção (Docker Compose com `restart: unless-stopped`) |
| **Resposta** | O sistema processa as requisições sem interrupção |
| **Medida** | Disponibilidade ≥ 99% (downtime máximo: ~7,2 h/mês) |

### QS-04 — Recuperação após falha do container backend

| Campo | Descrição |
|---|---|
| **Atributo** | Disponibilidade / Resiliência |
| **Estímulo** | O container `aquawash_backend` para inesperadamente (crash) |
| **Contexto** | Docker Compose em execução com política `restart: unless-stopped` |
| **Resposta** | Docker reinicia o container automaticamente |
| **Medida** | Tempo de recuperação ≤ 30 segundos |

---

## 9.3 Segurança

### QS-05 — Acesso não autorizado a rotas administrativas

| Campo | Descrição |
|---|---|
| **Atributo** | Segurança |
| **Estímulo** | Usuário com perfil `cliente` tenta acessar `GET /api/users` (rota admin) |
| **Contexto** | Token JWT válido, mas com `perfil = cliente` |
| **Resposta** | Middleware `autorizar('admin')` rejeita a requisição |
| **Medida** | Retorna HTTP 403 em 100% dos casos; nenhum dado é exposto |

### QS-06 — Tentativa de SQL Injection

| Campo | Descrição |
|---|---|
| **Atributo** | Segurança |
| **Estímulo** | Atacante envia payload malicioso em campo de e-mail: `' OR '1'='1` |
| **Contexto** | Endpoint `POST /api/auth/login` |
| **Resposta** | Sequelize usa parâmetros preparados; a query é executada com segurança |
| **Medida** | Nenhum dado não autorizado é retornado; sistema não é comprometido |

---

## 9.4 Usabilidade

### QS-07 — Feedback visual durante carregamento

| Campo | Descrição |
|---|---|
| **Atributo** | Usabilidade |
| **Estímulo** | Usuário navega para uma página que faz fetch de dados |
| **Contexto** | Qualquer página do dashboard (agendamentos, veículos, etc.) |
| **Resposta** | Frontend exibe `LoadingSpinner` durante a requisição |
| **Medida** | Spinner aparece em ≤ 100ms após a navegação; desaparece ao receber resposta |

### QS-08 — Responsividade em dispositivos móveis

| Campo | Descrição |
|---|---|
| **Atributo** | Usabilidade |
| **Estímulo** | Usuário acessa o sistema num smartphone com tela de 375px |
| **Contexto** | Qualquer página do sistema |
| **Resposta** | Layout adapta-se: sidebar recolhida, tabelas substituídas por cards |
| **Medida** | Nenhum elemento ultrapassa a largura da viewport; scroll horizontal ausente |

---

## 9.5 Manutenibilidade

### QS-09 — Adição de novo endpoint à API

| Campo | Descrição |
|---|---|
| **Atributo** | Manutenibilidade |
| **Estímulo** | Desenvolvedor precisa adicionar um novo recurso à API (ex.: relatórios) |
| **Contexto** | Código existente com separação routes → controllers → services → models |
| **Resposta** | Desenvolvedor cria arquivo de rota, controller e service sem alterar outros módulos |
| **Medida** | Mudança isolada em ≤ 3 arquivos; build compila sem erros de TypeScript |

### QS-10 — Identificação de erro em produção

| Campo | Descrição |
|---|---|
| **Atributo** | Manutenibilidade / Observabilidade |
| **Estímulo** | Usuário reporta erro 500 ao criar agendamento |
| **Contexto** | Ambiente de produção em execução |
| **Resposta** | Desenvolvedor consulta logs do container backend |
| **Medida** | Causa raiz identificada em ≤ 10 minutos via `docker logs aquawash_backend` |
