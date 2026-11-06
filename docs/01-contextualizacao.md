# 1. Contextualização e Evolução do Produto

## 1.1 Problema Identificado

Lava-rápidos e empresas de higienização automotiva em geral gerenciam seus agendamentos de forma manual — por telefone, WhatsApp ou caderno de papel. Esse modelo apresenta diversos problemas:

- **Conflitos de horário**: sem controle centralizado, dois clientes podem ser marcados no mesmo horário.
- **Perda de clientes**: sem canal de agendamento online, o cliente depende do atendente estar disponível para marcar.
- **Falta de histórico**: sem registro digital, o estabelecimento não sabe quais serviços foram realizados, qual a receita do mês ou qual cliente é mais fiel.
- **Retrabalho operacional**: confirmações, lembretes e cancelamentos são feitos manualmente, consumindo tempo da equipe.

## 1.2 Solução Proposta

O **AquaWash** é um sistema web de agendamento de lavagem de veículos que resolve esses problemas ao digitalizar o fluxo de ponta a ponta:

1. O cliente cria uma conta, cadastra seu(s) veículo(s) e agenda um horário de forma autônoma.
2. O sistema valida automaticamente conflitos de horário, regras de funcionamento e compatibilidade de serviço × tipo de veículo.
3. O administrador acompanha todos os agendamentos em tempo real, gerencia serviços e clientes via painel dedicado.

## 1.3 Evolução do Produto

A tabela abaixo registra as versões entregues ao longo do desenvolvimento:

| Versão | Data       | Descrição das entregas                                                                                   |
|--------|------------|----------------------------------------------------------------------------------------------------------|
| 0.1    | Fev/2026   | Definição de escopo, escolha de stack (React + Express + MySQL + Docker) e modelagem inicial do banco.   |
| 0.2    | Mar/2026   | Backend: autenticação JWT, CRUD de usuários e serviços. Banco de dados com migrations e seeds.           |
| 0.3    | Mar/2026   | Backend: CRUD de veículos e agendamentos com validação de conflito de horário e regra de funcionamento. |
| 0.4    | Abr/2026   | Frontend: páginas de login, cadastro, dashboard do cliente, veículos e agendamentos.                    |
| 0.5    | Abr/2026   | Frontend: painel administrativo (usuários, serviços, veículos, agendamentos). Testes unitários backend. |
| 0.6    | Abr/2026   | Infraestrutura Docker completa (Nginx + HTTPS + proxy reverso). Testes E2E com Playwright.              |
| 1.0    | Ago/2026   | Ajustes de qualidade: CORS via env, filtro de serviços por tipo de veículo, responsividade mobile, loading states, coluna de proprietário no painel admin, reconstrução do src/ do backend. |

## 1.4 Arquitetura Geral

```
Usuário (navegador)
        │  HTTPS
        ▼
    [ Nginx ]  ← único ponto exposto (portas 80/443)
     /      \
[Frontend]  [Backend]   ← rede Docker interna
  React       Express
  Vite        Sequelize
              │
           [MySQL 8]    ← volume persistente Docker
```

- **Frontend**: SPA React 18 + TypeScript + Tailwind CSS, servido como build estático pelo Nginx interno.
- **Backend**: API REST Express + Sequelize + TypeScript, porta 3001 (não exposta ao host).
- **Banco de dados**: MySQL 8.0, inicializado pelo script `database.sql` via `docker-entrypoint-initdb.d`.
- **Nginx**: termina TLS (mkcert local), redireciona HTTP → HTTPS, encaminha `/api/*` ao backend e demais rotas ao frontend.

## 1.5 Tecnologias Utilizadas

| Camada       | Tecnologia                        | Justificativa                                              |
|--------------|-----------------------------------|------------------------------------------------------------|
| Frontend     | React 18 + Vite + TypeScript      | Ecossistema maduro, tipagem estática, build otimizado      |
| Estilização  | Tailwind CSS v3                   | Utility-first, responsividade integrada                    |
| HTTP Client  | Axios                             | Interceptores para JWT e tratamento de 401 automático      |
| Backend      | Node.js + Express + TypeScript    | Leveza, grande ecossistema npm, familiaridade da equipe    |
| ORM          | Sequelize v6                      | Abstração de queries, suporte a migrations e associações   |
| Banco        | MySQL 8.0                         | ACID, suporte a UUID nativos, amplamente utilizado         |
| Auth         | JWT + bcryptjs                    | Stateless, escalável; bcrypt para hash seguro de senhas    |
| Containers   | Docker + Docker Compose           | Ambiente reproduzível, isolamento de serviços              |
| Proxy        | Nginx 1.25                        | TLS, headers de segurança (HSTS, CSP, X-Frame-Options)     |
| Testes Unit. | Jest + Istanbul                   | Cobertura de código, integração com CI                     |
| Testes E2E   | Playwright                        | Testes de ponta a ponta em ambiente real                   |
| Git Hooks    | Husky + commitlint                | Padronização de commits (Conventional Commits)             |
