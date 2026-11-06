# 7. Diagramas C4 — Contexto e Containers

Os diagramas C4 descrevem a arquitetura do sistema em dois níveis de abstração: **Contexto** (visão macro, quem usa o sistema e com o que ele se integra) e **Containers** (visão interna, quais peças de software compõem o sistema).

---

## 7.1 Nível 1 — Diagrama de Contexto

Mostra o sistema AquaWash como uma caixa preta e os atores/sistemas externos ao redor.

```mermaid
C4Context
    title Diagrama de Contexto — Sistema AquaWash

    Person(cliente, "Cliente", "Usuário final que agenda lavagens de seu veículo pelo navegador.")
    Person(admin, "Administrador", "Funcionário do lava-rápido que gerencia serviços, usuários e agendamentos.")

    System(aquawash, "AquaWash", "Sistema web de agendamento de lavagem de veículos. Permite ao cliente agendar serviços e ao administrador gerenciar toda a operação.")

    System_Ext(email, "Serviço de E-mail (futuro)", "Envio de confirmações e lembretes de agendamento. Não implementado na v1.0.")
    System_Ext(browser, "Navegador Web", "Chrome, Firefox, Edge ou Safari — interface de acesso ao sistema.")

    Rel(cliente, aquawash, "Acessa via", "HTTPS")
    Rel(admin, aquawash, "Acessa via", "HTTPS")
    Rel(aquawash, email, "Envia notificações via", "SMTP (planejado)")
    Rel(browser, aquawash, "Renderiza a interface do", "HTTPS")
```

---

## 7.2 Nível 2 — Diagrama de Containers

Mostra os containers (processos/aplicações) que compõem o sistema AquaWash e como eles se comunicam.

```mermaid
C4Container
    title Diagrama de Containers — Sistema AquaWash

    Person(cliente, "Cliente")
    Person(admin, "Administrador")

    System_Boundary(aquawash, "AquaWash") {

        Container(nginx, "Nginx", "Nginx 1.25 Alpine", "Proxy reverso. Termina TLS (HTTPS), redireciona HTTP→HTTPS, roteia /api/* ao backend e demais rotas ao frontend.")

        Container(frontend, "Frontend SPA", "React 18 + Vite + TypeScript + Tailwind CSS", "Interface web servida como build estático. Comunica-se com o backend exclusivamente via API REST.")

        Container(backend, "Backend API", "Node.js + Express + TypeScript + Sequelize", "API REST que implementa toda a lógica de negócio: autenticação JWT, CRUD de entidades e validação de agendamentos.")

        ContainerDb(db, "Banco de Dados", "MySQL 8.0", "Persiste usuários, veículos, serviços e agendamentos. Inicializado via script SQL. Volume Docker para durabilidade.")

        Container(uploads, "Armazenamento de Arquivos", "Volume Docker (sistema de arquivos)", "Armazena fotos de perfil e imagens de serviços enviadas via upload.")
    }

    Rel(cliente, nginx, "Acessa", "HTTPS :443")
    Rel(admin, nginx, "Acessa", "HTTPS :443")
    Rel(nginx, frontend, "Encaminha requisições de UI para", "HTTP interno")
    Rel(nginx, backend, "Encaminha /api/* para", "HTTP interno :3001")
    Rel(frontend, nginx, "Faz chamadas API via", "HTTPS /api/*")
    Rel(backend, db, "Lê e escreve via", "Sequelize ORM / TCP :3306")
    Rel(backend, uploads, "Grava e serve arquivos via", "Sistema de arquivos / /uploads")
```

---

## 7.3 Decisões de Design Refletidas nos Diagramas

| Decisão | Justificativa |
|---------|---------------|
| Nginx como único ponto de entrada | Centraliza TLS, headers de segurança e roteamento, evitando exposição direta dos serviços internos. |
| Frontend como SPA estática | Permite servir via Nginx sem Node.js em produção; build otimizado pelo Vite. |
| Backend isolado na rede interna Docker | Nunca exposto diretamente ao host; acessível apenas pelo Nginx. |
| MySQL com volume nomeado | Garante persistência de dados mesmo após restart/recriação do container. |
| Uploads em volume separado | Isola dados binários do banco relacional; facilita backup independente. |
