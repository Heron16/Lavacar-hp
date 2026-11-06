# 8. Registros de Decisão Arquitetural (ADRs)

ADRs (*Architecture Decision Records*) documentam as decisões arquiteturais relevantes tomadas durante o desenvolvimento, com contexto, alternativas consideradas e justificativa da escolha.

---

## ADR-001 — Arquitetura Monolítica vs. Modular vs. Microsserviços

- **Data:** Fevereiro/2026
- **Status:** Aceito

### Contexto
O sistema AquaWash é um projeto acadêmico com equipe pequena e escopo bem definido (agendamentos de lavagem). Era necessário escolher entre uma arquitetura monolítica, modular (modulith) ou baseada em microsserviços.

### Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| Monólito simples | Simplicidade, baixo overhead operacional | Difícil de escalar módulos independentemente |
| **Modulith** (escolhido) | Separação de responsabilidades em camadas (routes → controllers → services → models), sem overhead de microsserviços | Não escala módulos individualmente |
| Microsserviços | Escalabilidade granular | Complexidade operacional incompatível com o tamanho do projeto |

### Decisão
Adotar arquitetura **monolítica com separação de camadas bem definidas** (estilo modulith): rotas, controllers, services e models são módulos independentes dentro de um único processo Express. Essa estrutura facilita eventual migração para microsserviços se o sistema crescer.

### Consequências
- Código organizado e testável por camada.
- Deploy simples via Docker Compose.
- Sem sobrecarga de comunicação entre serviços.

---

## ADR-002 — Escolha do Banco de Dados: MySQL vs. PostgreSQL vs. MongoDB

- **Data:** Fevereiro/2026
- **Status:** Aceito

### Contexto
O sistema precisa persistir dados relacionais fortemente ligados (usuários → veículos → agendamentos → serviços). Era necessário escolher um banco de dados adequado.

### Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **MySQL 8.0** (escolhido) | ACID, UUID nativo, amplamente utilizado, suporte Docker maduro | Licença Oracle (Community gratuita) |
| PostgreSQL | ACID, open-source puro, mais recursos avançados | Curva de aprendizado ligeiramente maior para a equipe |
| MongoDB | Flexibilidade de schema, bom para documentos | Dados do sistema são relacionais; joins complexos em NoSQL |

### Decisão
**MySQL 8.0** foi escolhido por ser amplamente conhecido pela equipe, ter suporte nativo a UUID, garantir integridade referencial via foreign keys com `ON DELETE CASCADE`, e ter imagem Docker oficial estável.

### Consequências
- Integridade relacional garantida pelo banco (FK + CASCADE).
- Queries parametrizadas via Sequelize previnem SQL Injection.
- Volume Docker garante durabilidade dos dados.

---

## ADR-003 — Autenticação: JWT vs. Session/Cookie vs. OAuth

- **Data:** Fevereiro/2026
- **Status:** Aceito

### Contexto
O sistema precisa autenticar usuários e distinguir perfis (cliente vs. admin) em todas as requisições à API.

### Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **JWT** (escolhido) | Stateless, sem necessidade de armazenamento server-side, fácil de validar | Token não pode ser revogado antes da expiração |
| Session + Cookie | Revogação simples | Requer armazenamento server-side (Redis/memória); não escala bem em múltiplas instâncias |
| OAuth 2.0 | Padrão de mercado para SSO | Complexidade desnecessária para um sistema sem identidade externa |

### Decisão
**JWT com expiração de 7 dias**, armazenado no `localStorage` do navegador. O payload carrega `usuarioId` e `perfil`, permitindo autorização granular sem consulta ao banco em cada request.

### Consequências
- API stateless e escalável horizontalmente.
- Interceptor Axios no frontend redireciona automaticamente para `/login` em caso de 401.
- Senhas armazenadas com bcrypt (12 rounds) — nunca em texto simples.

---

## ADR-004 — Proxy Reverso: Nginx vs. Traefik vs. Sem proxy

- **Data:** Março/2026
- **Status:** Aceito

### Contexto
Com o sistema containerizado, era necessário definir como expor os serviços ao usuário final de forma segura (HTTPS).

### Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **Nginx** (escolhido) | Maduro, amplamente documentado, configuração declarativa, ótimo para arquivos estáticos | Configuração manual de SSL |
| Traefik | Auto-discover de containers, SSL automático via Let's Encrypt | Mais complexo para ambiente local/acadêmico |
| Sem proxy | Simplicidade | Sem TLS, sem isolamento, backend exposto diretamente |

### Decisão
**Nginx 1.25** como único ponto de entrada. Termina TLS com certificados mkcert (desenvolvimento local), redireciona HTTP→HTTPS, serve frontend estático e faz proxy de `/api/*` para o backend.

### Consequências
- Backend nunca exposto diretamente ao host.
- Headers de segurança centralizados (HSTS, CSP, X-Frame-Options).
- Frontend servido diretamente pelo Nginx sem Node.js em produção.

---

## ADR-005 — Framework Frontend: React vs. Vue vs. Angular

- **Data:** Fevereiro/2026
- **Status:** Aceito

### Contexto
Escolha do framework para construção da SPA (Single Page Application).

### Alternativas Consideradas

| Alternativa | Prós | Contras |
|---|---|---|
| **React 18** (escolhido) | Ecossistema maduro, familiaridade da equipe, Vite nativo | Exige escolhas adicionais (roteamento, estado) |
| Vue 3 | Curva de aprendizado suave, opinionado | Menos adotado pela equipe |
| Angular | Completo, opinionado | Overhead para projeto de tamanho pequeno/médio |

### Decisão
**React 18 + Vite + TypeScript + Tailwind CSS**. Combinação com build ultra-rápido (Vite), tipagem estática (TypeScript) e estilização utility-first (Tailwind) sem necessidade de CSS customizado extenso.

### Consequências
- DX (Developer Experience) elevada com HMR instantâneo.
- Build estático otimizado para produção.
- Tailwind elimina conflitos de CSS e facilita responsividade.
