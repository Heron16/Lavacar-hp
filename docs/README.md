# Documentação Técnica — AquaWash

Sistema de agendamento de lavagem de veículos desenvolvido como projeto acadêmico.

> **Como visualizar os diagramas**: todos os diagramas usam a sintaxe **Mermaid**.
> - **GitHub**: renderizado automaticamente em qualquer arquivo `.md`.
> - **VS Code**: instale a extensão [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid).
> - **Online**: cole o código em [mermaid.live](https://mermaid.live).

---

## Índice

| # | Documento | Conteúdo |
|---|-----------|----------|
| 1 | [Contextualização e Evolução do Produto](./01-contextualizacao.md) | Problema, solução, histórico de versões, arquitetura e tecnologias |
| 2 | [Diagrama Entidade-Relacionamento](./02-diagrama-er.md) | DER completo com todas as entidades, atributos, PKs, FKs e regras de integridade |
| 3 | [Requisitos Funcionais e Não Funcionais](./03-requisitos.md) | 28 RFs e 25 RNFs organizados por módulo e categoria |
| 4 | [Diagramas de Casos de Uso](./04-casos-de-uso.md) | 3 diagramas: módulo cliente, módulo administrador e fluxo de agendamento detalhado |
| 5 | [Diagramas de Atividades](./05-diagramas-atividades.md) | 4 fluxogramas: criação de agendamento, ciclo de vida do agendamento, cadastro/login e gerenciamento de serviços |
| 6 | [Diagramas de Sequência](./06-diagramas-sequencia.md) | 4 diagramas: login, criação de agendamento, cadastro de usuário e alteração de status pelo admin |
| 7 | [Diagramas C4](./07-c4-diagramas.md) | Nível 1 (Contexto) e Nível 2 (Containers) em Mermaid C4 |
| 8 | [ADRs — Decisões Arquiteturais](./08-adrs.md) | 5 ADRs: arquitetura monolítica, banco de dados, autenticação JWT, Nginx e React |
| 9 | [Cenários de Qualidade](./09-quality-scenarios.md) | 10 quality scenarios: desempenho, disponibilidade, segurança, usabilidade e manutenibilidade |
| 10 | [DDD — Arquitetura de Domínio](./10-ddd-arquitetura.md) | Context Map, 4 Bounded Contexts, Entities, Value Objects e Aggregates |
| 11 | [OpenAPI / Swagger](./11-openapi.yaml) | Especificação completa da API REST (OpenAPI 3.0.3) com todos os endpoints |
| 12 | [Qualidade, Resiliência e Observabilidade](./12-qualidade-resiliencia-observabilidade.md) | SLIs/SLOs, Error Budget, 7 estratégias de resiliência e plano de observabilidade |
| 13 | [Estratégia de Deploy e CI/CD](./13-deploy-strategy.md) | Pipeline CI/CD, rolling update, rollback por SHA e fluxo de branches |
| 14 | [Runbook de Incidentes](./14-runbook-incidentes.md) | 7 cenários de incidente com passos de diagnóstico e resolução |

---

## Resumo do Sistema

**AquaWash** é uma aplicação full-stack para gerenciamento de agendamentos de lavagem automotiva com dois perfis de acesso:

- **Cliente**: cadastra veículos e agenda serviços de forma autônoma, respeitando regras de horário e disponibilidade.
- **Administrador**: gerencia o catálogo de serviços, monitora todos os agendamentos e clientes cadastrados.

### Stack Principal

```
Frontend          Backend            Banco           Infraestrutura
─────────         ────────           ─────           ──────────────
React 18          Express            MySQL 8.0       Docker Compose
TypeScript        TypeScript         Sequelize ORM   Nginx (HTTPS)
Tailwind CSS      JWT + bcrypt       4 tabelas       mkcert (TLS local)
Vite              Jest (testes)      UUID PKs        Husky + commitlint
```

### Entidades do Banco

```
USUARIO ──< VEICULO
   │
   └──< AGENDAMENTO >── SERVICO
                   └── VEICULO
```

### Regras de Negócio Principais

1. **Horário de funcionamento**: Seg–Sex 08:00–12:00 e 13:30–18:00 | Sáb 08:00–12:00 | Dom fechado.
2. **Conflito de horário**: verificação automática considerando a duração do serviço.
3. **Filtro por tipo de veículo**: serviços exibem apenas para os tipos de veículo que atendem.
4. **Snapshot de preço**: o valor registrado no agendamento não muda com alterações futuras do serviço.
5. **Cascata de exclusão**: remover um usuário remove automaticamente seus veículos e agendamentos.

---

## Credenciais Padrão (desenvolvimento)

| Campo  | Valor               |
|--------|---------------------|
| E-mail | `admin@aquawash.com` |
| Senha  | `Admin@123`         |

---

## Como Rodar o Projeto

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env

# 2. Gerar certificado HTTPS local (Windows PowerShell como Admin)
.\scripts\gerar-certificado.ps1

# 3. Adicionar ao hosts: 127.0.0.1  meuapp.local

# 4. Subir todos os serviços
docker compose up --build

# Acesse: https://meuapp.local
```
