# 6. Diagramas de Sequência

Os diagramas representam o fluxo de mensagens entre os atores e as camadas do sistema para as principais funcionalidades.

---

## 6.1 Diagrama de Sequência — Login de Usuário

```mermaid
sequenceDiagram
    actor U as Usuário
    participant FE as Frontend (React)
    participant API as Backend (Express)
    participant SVC as AuthService
    participant DB as MySQL

    U->>FE: Preenche e-mail e senha e clica "Entrar"
    FE->>FE: Valida formato de e-mail (regex)
    FE->>API: POST /api/auth/login { email, senha }
    API->>API: Verifica campos obrigatórios
    API->>SVC: authService.login(email, senha)
    SVC->>SVC: validateEmail(email)
    SVC->>DB: SELECT * FROM usuario WHERE email = ?
    DB-->>SVC: Retorna registro do usuário

    alt Usuário não encontrado
        SVC-->>API: throw Error("Usuário não encontrado")
        API-->>FE: HTTP 401 { mensagem }
        FE-->>U: Exibe erro no formulário
    else Usuário encontrado
        SVC->>SVC: bcrypt.compare(senha, hash)
        alt Senha incorreta
            SVC-->>API: throw Error("Senha incorreta")
            API-->>FE: HTTP 401 { mensagem }
            FE-->>U: Exibe erro no formulário
        else Senha correta
            SVC->>SVC: jwt.sign({ usuarioId, perfil }, JWT_SECRET)
            SVC-->>API: { token, usuario }
            API-->>FE: HTTP 200 { token, usuario }
            FE->>FE: Salva token no localStorage
            FE->>FE: Atualiza AuthContext com dados do usuário
            FE-->>U: Redireciona para /dashboard ou /admin
        end
    end
```

---

## 6.2 Diagrama de Sequência — Criação de Agendamento

```mermaid
sequenceDiagram
    actor C as Cliente
    participant FE as Frontend (React)
    participant API as Backend (Express)
    participant MW as Middleware (auth)
    participant SVC as AgendamentoService
    participant DB as MySQL

    C->>FE: Seleciona veículo, serviço, data/hora
    FE->>FE: Filtra serviços por tipo do veículo
    FE->>FE: Valida horário de funcionamento (frontend)

    alt Horário inválido (frontend)
        FE-->>C: Exibe mensagem de erro inline
    else Horário válido
        C->>FE: Clica "Confirmar Agendamento"
        FE->>API: POST /api/appointments { veiculoId, servicoId, agendadoPara, observacoes }\nAuthorization: Bearer <token>

        API->>MW: autenticar(req)
        MW->>MW: jwt.verify(token, JWT_SECRET)
        alt Token inválido
            MW-->>FE: HTTP 401 { mensagem }
            FE->>FE: Redireciona para /login
        else Token válido
            MW-->>API: req.usuario = { usuarioId, perfil }
            API->>SVC: agendamentoService.criar(dados)
            SVC->>DB: SELECT * FROM servico WHERE id = servicoId
            DB-->>SVC: Retorna dados do serviço (preço, duração)

            alt Serviço não encontrado
                SVC-->>API: throw Error("Serviço não encontrado")
                API-->>FE: HTTP 400 { mensagem }
                FE-->>C: Toast de erro
            else Serviço existe
                SVC->>SVC: validarHorarioFuncionamento(agendadoPara)

                alt Horário fora do funcionamento
                    SVC-->>API: throw Error("fora do horário")
                    API-->>FE: HTTP 400 { mensagem }
                    FE-->>C: Toast de erro
                else Horário válido
                    SVC->>DB: SELECT agendamentos pendentes e em_andamento\ncom include de serviço (duração)
                    DB-->>SVC: Lista de agendamentos ativos
                    SVC->>SVC: Verifica sobreposição de horários\n(inicio < fimExistente && fim > inicioExistente)

                    alt Conflito detectado
                        SVC-->>API: throw Error("horário ocupado")
                        API-->>FE: HTTP 400 { mensagem }
                        FE-->>C: Toast de erro
                    else Sem conflito
                        SVC->>DB: INSERT INTO agendamento\n(precoTotal = snapshot do preço)
                        DB-->>SVC: Agendamento criado
                        SVC-->>API: Retorna agendamento
                        API-->>FE: HTTP 201 { agendamento }
                        FE-->>C: Toast "Agendamento realizado!"
                        FE->>FE: Redireciona para /dashboard/agendamentos
                    end
                end
            end
        end
    end
```

---

## 6.3 Diagrama de Sequência — Cadastro de Usuário

```mermaid
sequenceDiagram
    actor V as Visitante
    participant FE as Frontend (React)
    participant API as Backend (Express)
    participant SVC as UserService
    participant DB as MySQL

    V->>FE: Preenche formulário de cadastro\n(nome, e-mail, CPF, senha, confirmação)
    FE->>FE: Valida campos em tempo real (blur)
    FE->>FE: validateEmail(), validateCPF(), getPasswordStrength()

    alt Erros de validação frontend
        FE-->>V: Exibe erros inline por campo
    else Todos campos válidos
        V->>FE: Clica "Criar conta"
        FE->>API: POST /api/users/cadastrar\n{ nome, email, cpf, senha }

        API->>API: Verifica campos obrigatórios
        API->>SVC: userService.criar(nome, email, senha, cpf)
        SVC->>SVC: validateEmail(email)
        SVC->>SVC: validateCPF(cpf)
        SVC->>SVC: validatePasswordStrength(senha)

        alt Alguma validação falhou
            SVC-->>API: throw Error(mensagem específica)
            API-->>FE: HTTP 400 { mensagem }
            FE-->>V: Toast de erro
        else Validações OK
            SVC->>DB: SELECT * FROM usuario\nWHERE email = ? OR cpf = ?
            DB-->>SVC: Resultado da busca

            alt E-mail ou CPF já cadastrado
                SVC-->>API: throw Error("E-mail ou CPF já cadastrado")
                API-->>FE: HTTP 400 { mensagem }
                FE-->>V: Toast de erro
            else Dados únicos
                SVC->>SVC: bcrypt.hash(senha, 12)
                SVC->>DB: INSERT INTO usuario (nome, email, senhaHash, cpf, perfil='cliente')
                DB-->>SVC: Usuário criado
                SVC-->>API: { id, nome, email, perfil }
                API-->>FE: HTTP 201 { usuario }
                FE-->>V: Toast "Cadastro realizado! Faça login."
                FE->>FE: Redireciona para /login
            end
        end
    end
```

---

## 6.4 Diagrama de Sequência — Alteração de Status pelo Administrador

```mermaid
sequenceDiagram
    actor A as Administrador
    participant FE as Frontend (React)
    participant API as Backend (Express)
    participant MW as Middleware (auth)
    participant SVC as AgendamentoService
    participant DB as MySQL

    A->>FE: Acessa painel de Agendamentos
    FE->>API: GET /api/appointments?pagina=1&limite=10\nAuthorization: Bearer <token>
    API->>MW: autenticar() + autorizar('admin')
    MW-->>API: OK
    API->>DB: SELECT agendamentos\ncom usuario, veiculo, servico
    DB-->>API: Lista de agendamentos
    API-->>FE: HTTP 200 { dados, total, pagina, totalPaginas }
    FE-->>A: Renderiza tabela de agendamentos\ncom dropdown de status

    A->>FE: Seleciona novo status no dropdown
    FE->>API: PATCH /api/appointments/:id/status\n{ status: "concluido" }\nAuthorization: Bearer <token>
    API->>MW: autenticar()
    MW-->>API: req.usuario = { usuarioId, perfil: 'admin' }
    API->>SVC: agendamentoService.atualizarStatus(id, status, isAdmin=true, usuarioId)
    SVC->>DB: SELECT * FROM agendamento\nWHERE id = :id\n(sem filtro de usuarioId pois isAdmin=true)
    DB-->>SVC: Agendamento encontrado

    alt Agendamento não encontrado
        SVC-->>API: throw Error("Agendamento não encontrado")
        API-->>FE: HTTP 400 { mensagem }
        FE-->>A: Toast de erro
    else Encontrado
        SVC->>DB: UPDATE agendamento SET status = ? WHERE id = ?
        DB-->>SVC: OK
        SVC-->>API: Agendamento atualizado
        API-->>FE: HTTP 200 { agendamento }
        FE-->>A: Toast "Status atualizado"
        FE->>FE: Re-busca lista de agendamentos
    end
```
