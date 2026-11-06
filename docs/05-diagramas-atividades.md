# 5. Diagramas de Atividades (Fluxogramas de Regras de Negócio)

Os diagramas abaixo representam os principais fluxos de atividades do sistema, incluindo as regras de negócio aplicadas em cada etapa.

---

## 5.1 Diagrama de Atividades — Processo de Agendamento

Este fluxograma representa a regra de negócio mais complexa do sistema: a criação de um agendamento, com todas as validações envolvidas.

```mermaid
flowchart TD
    A([Início]) --> B[Cliente acessa\nNovo Agendamento]
    B --> C[Seleciona um veículo]
    C --> D{Possui\nveículos\ncadastrados?}
    D -- Não --> E[Exibe aviso:\ncadastre um veículo]
    E --> F([Fim])
    D -- Sim --> G[Sistema filtra serviços\ncompatíveis com o tipo\ndo veículo selecionado]
    G --> H[Cliente seleciona\num serviço]
    H --> I[Cliente seleciona\ndata e hora]
    I --> J{Data é\nno passado?}
    J -- Sim --> K[Erro: data inválida\nExibe mensagem]
    K --> I
    J -- Não --> L{Dia da\nsemana?}
    L -- Domingo --> M[Erro: não atendemos\naos domingos]
    M --> I
    L -- Sábado --> N{Horário entre\n08:00 e 12:00?}
    N -- Não --> O[Erro: sábado somente\n08:00 às 12:00]
    O --> I
    N -- Sim --> Q
    L -- Seg a Sex --> P{Horário dentro\ndo expediente?\n08-12 ou 13:30-18}
    P -- Não --> R[Erro: fora do\nhorário de atendimento]
    R --> I
    P -- Sim --> Q[Cliente confirma\no agendamento]
    Q --> S[Backend verifica\nconflito de horário]
    S --> T{Existe agendamento\npendente ou em andamento\nque se sobreponha?}
    T -- Sim --> U[Erro: horário ocupado\nEscolha outro horário]
    U --> I
    T -- Não --> V[Cria agendamento\ncom precoTotal = snapshot\nstatus = pendente]
    V --> W[Exibe confirmação\ntoast de sucesso]
    W --> X[Redireciona para\nMeus Agendamentos]
    X --> F2([Fim])
```

---

## 5.2 Diagrama de Atividades — Ciclo de Vida do Agendamento

Este fluxograma representa as transições de estado possíveis para um agendamento ao longo do tempo.

```mermaid
flowchart TD
    A([Agendamento\nCriado]) --> B[status: PENDENTE]

    B --> C{Quem atua?}
    C -- Cliente --> D{Ação do\ncliente}
    D -- Cancela --> E[status: CANCELADO]
    E --> FIM1([Fim])

    C -- Administrador --> F{Ação do\nadministrador}
    F -- Inicia atendimento --> G[status: EM ANDAMENTO]
    F -- Cancela --> E
    F -- Conclui direto --> H[status: CONCLUÍDO]

    G --> I{Ação do\nadministrador}
    I -- Conclui --> H[status: CONCLUÍDO]
    I -- Cancela --> E
    H --> FIM2([Fim])
```

---

## 5.3 Diagrama de Atividades — Cadastro e Autenticação

Este fluxograma cobre o processo de cadastro de novo usuário e posterior login, incluindo as validações de segurança.

```mermaid
flowchart TD
    A([Início]) --> B{Usuário tem\nconta?}

    B -- Não --> C[Acessa tela\nde Cadastro]
    C --> D[Preenche nome,\ne-mail, CPF,\nsenha, confirmação]
    D --> E{Validações\nfrontend OK?}
    E -- Não --> F[Exibe erros\ninline nos campos]
    F --> D
    E -- Sim --> G[Envia para\nAPI POST /users/cadastrar]
    G --> H{Backend:\ne-mail e CPF\njá existem?}
    H -- Sim --> I[Retorna erro 400:\ne-mail ou CPF já cadastrado]
    I --> D
    H -- Não --> J{Backend:\nsenha forte?}
    J -- Não --> K[Retorna erro 400:\nsenha fraca]
    K --> D
    J -- Sim --> L[Faz hash bcrypt\nda senha]
    L --> M[Salva usuário\nno banco]
    M --> N[Redireciona\npara Login]

    B -- Sim --> O[Acessa tela\nde Login]
    N --> O
    O --> P[Preenche e-mail\ne senha]
    P --> Q{Campos\npreenchidos?}
    Q -- Não --> R[Exibe erro\nnos campos]
    R --> P
    Q -- Sim --> S[Envia para\nAPI POST /auth/login]
    S --> T{Usuário\nencontrado?}
    T -- Não --> U[Retorna 401:\nusuário não encontrado]
    U --> P
    T -- Sim --> V{Senha\ncorreta?}
    V -- Não --> W[Retorna 401:\nsenha incorreta]
    W --> P
    V -- Sim --> X[Gera token JWT\ncom usuarioId e perfil]
    X --> Y{Perfil\ndo usuário?}
    Y -- admin --> Z1[Redireciona\npara /admin]
    Y -- cliente --> Z2[Redireciona\npara /dashboard]
    Z1 --> FIM([Fim])
    Z2 --> FIM
```

---

## 5.4 Diagrama de Atividades — Gerenciamento de Serviços pelo Administrador

```mermaid
flowchart TD
    A([Início]) --> B[Admin acessa\npainel de Serviços]
    B --> C[Sistema carrega\nlista de serviços]
    C --> D{Ação\nescolhida?}

    D -- Criar novo --> E[Abre modal\nde criação]
    E --> F[Preenche nome, descrição,\npreço, duração e\ntipos de veículo]
    F --> G{Validação:\ncampos obrigatórios\ne preco e duracao > 0?}
    G -- Falha --> H[Exibe erro\nno modal]
    H --> F
    G -- OK --> I[POST /api/services]
    I --> J[Serviço criado\nstatus ativo = true]
    J --> C

    D -- Editar --> K[Abre modal\nde edição com dados]
    K --> L[Altera campos\ndesejados]
    L --> M[PUT /api/services/:id]
    M --> C

    D -- Ativar/Desativar --> N[Altera campo ativo]
    N --> O[PUT /api/services/:id\ncom ativo = true/false]
    O --> C

    D -- Excluir --> P{Confirma\nexclusão?}
    P -- Não --> C
    P -- Sim --> Q[DELETE /api/services/:id]
    Q --> C
```
