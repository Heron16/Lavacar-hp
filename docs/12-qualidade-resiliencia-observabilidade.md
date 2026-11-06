# 12. Atributos de Qualidade, Resiliência e Observabilidade

---

## 12.1 SLIs e SLOs

**SLI** (*Service Level Indicator*) é a métrica que mede o comportamento real do sistema.  
**SLO** (*Service Level Objective*) é a meta que o sistema deve atingir para aquela métrica.

### Tabela de SLIs/SLOs

| ID | Categoria | SLI — O que medimos | SLO — Meta | Janela |
|---|---|---|---|---|
| SLO-01 | Disponibilidade | % de requisições que retornam resposta (não erro 5xx) sobre o total de requisições | ≥ 99,0% | Rolling 30 dias |
| SLO-02 | Latência — API | % de requisições à API com tempo de resposta ≤ 500ms | ≥ 95% (P95) | Rolling 7 dias |
| SLO-03 | Latência — Frontend | Tempo até First Contentful Paint (FCP) no carregamento inicial | ≤ 2 segundos | Por sessão |
| SLO-04 | Taxa de Erros | % de requisições que retornam 4xx ou 5xx sobre o total | ≤ 1% | Rolling 24 horas |
| SLO-05 | Tempo de Recuperação | Tempo entre falha detectada e serviço disponível novamente (MTTR) | ≤ 30 segundos | Por incidente |
| SLO-06 | Disponibilidade do Banco | % do tempo em que o MySQL responde ao healthcheck do Docker | ≥ 99,5% | Rolling 30 dias |

### Cálculo do Error Budget (SLO-01)

O **Error Budget** é o quanto de indisponibilidade é tolerado antes de violar o SLO:

```
Error Budget = 100% - SLO = 100% - 99,0% = 1,0%

Em 30 dias (43.200 minutos):
Downtime máximo permitido = 43.200 × 0,01 = 432 minutos (~7,2 horas/mês)
```

---

## 12.2 Estratégias de Resiliência Aplicadas

### RE-01 — Restart Automático de Containers (Docker)

**Padrão:** Auto-recovery  
**Implementação:** Todos os serviços Docker possuem `restart: unless-stopped`.

```yaml
# docker-compose.yml
services:
  backend:
    restart: unless-stopped
  frontend:
    restart: unless-stopped
  mysql:
    restart: unless-stopped
  nginx:
    restart: unless-stopped
```

**Comportamento:** Se um container crash, o Docker reinicia automaticamente em ≤ 30 segundos, sem intervenção humana.

---

### RE-02 — Health Check com Retry no MySQL

**Padrão:** Health Check + Dependency Wait  
**Implementação:** O backend só sobe após o MySQL estar saudável.

```yaml
# docker-compose.yml
mysql:
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    interval: 10s
    timeout: 5s
    retries: 10
    start_period: 30s

backend:
  depends_on:
    mysql:
      condition: service_healthy
```

**Comportamento:** O backend aguarda até 130 segundos (10 tentativas × 10s + 30s start_period) pelo MySQL antes de iniciar. Evita erros de conexão na inicialização.

---

### RE-03 — Timeout em Requisições HTTP (Frontend)

**Padrão:** Timeout  
**Implementação:** O cliente Axios no frontend pode ser configurado com timeout global para evitar que requisições travadas bloqueiem a UI indefinidamente.

```typescript
// src/services/api.ts — configuração recomendada
const api = axios.create({
  baseURL: '/api',
  timeout: 10000, // 10 segundos
});
```

**Comportamento:** Se o backend não responder em 10 segundos, o Axios rejeita a promise e o interceptor trata o erro, exibindo mensagem ao usuário.

---

### RE-04 — Interceptor de Autenticação com Redirecionamento (Frontend)

**Padrão:** Fail-fast + Auto-recovery  
**Implementação:** Interceptor de resposta no Axios detecta HTTP 401 e redireciona para login.

```typescript
// src/services/api.ts
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !isLoginRoute) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Comportamento:** Token expirado ou inválido → sessão limpa automaticamente → usuário redirecionado para login sem tela de erro.

---

### RE-05 — Validação em Duas Camadas (Frontend + Backend)

**Padrão:** Defense in Depth  
**Implementação:** As regras de negócio críticas são validadas tanto no frontend quanto no backend:

| Validação | Frontend | Backend |
|---|---|---|
| Horário de funcionamento | ✅ (impede seleção de horário inválido) | ✅ (rejeita mesmo se frontend for contornado) |
| Conflito de horário | ❌ (verificado via `/slots`) | ✅ (verificação definitiva no service) |
| Formato de e-mail | ✅ (regex em tempo real) | ✅ (validateEmail no service) |
| Validação de CPF | ✅ (dígitos verificadores) | ✅ (validateCPF no service) |
| Força de senha | ✅ (indicador visual) | ✅ (validatePasswordStrength) |

**Comportamento:** Mesmo que o frontend seja contornado (ex.: chamada direta à API via curl), o backend rejeita dados inválidos.

---

### RE-06 — Isolamento de Rede Docker

**Padrão:** Bulkhead (isolamento de falhas)  
**Implementação:** Backend e banco de dados estão em rede interna Docker, acessíveis apenas pelo Nginx.

```yaml
networks:
  internal:
    driver: bridge
    internal: false  # nginx precisa de acesso externo para TLS
```

**Comportamento:** Uma falha ou ataque direto ao backend não é possível via internet — todo tráfego passa pelo Nginx, que pode ser configurado com rate limiting.

---

### RE-07 — Snapshot de Preço (Consistência de Dados)

**Padrão:** Immutable Data / Snapshot  
**Implementação:** O `precoTotal` é capturado no momento da criação do agendamento e nunca recalculado.

```typescript
// AgendamentoService.ts
return AppointmentModel.create({
  ...dados,
  precoTotal: Number(servico.preco), // snapshot
});
```

**Comportamento:** Alterações futuras no preço do serviço não afetam agendamentos já criados. Consistência histórica garantida.

---

## 12.3 Plano de Observabilidade

### O que Coletar

#### Logs

| Origem | O que logar | Formato sugerido |
|---|---|---|
| **Nginx** | Toda requisição HTTP/HTTPS: método, rota, status code, tempo de resposta, IP de origem | JSON (`log_format json`) |
| **Backend (Express)** | Início e fim de cada requisição com status, rota, tempo de resposta e `usuarioId` quando autenticado | Morgan middleware: `combined` |
| **Backend — Erros** | Stack trace completo de erros não tratados (unhandledRejection, uncaughtException) | JSON estruturado com timestamp |
| **MySQL** | Slow queries (queries acima de 1 segundo) | MySQL slow query log |
| **Docker** | Eventos de container: start, stop, crash, restart | `docker events` |

**Comando para acessar logs em produção:**
```bash
# Backend
docker logs aquawash_backend --tail 100 -f

# Nginx (acesso + erros)
docker logs aquawash_nginx --tail 100 -f

# MySQL
docker logs aquawash_mysql --tail 50
```

---

#### Métricas

| Métrica | Origem | Por que importa |
|---|---|---|
| **Taxa de requisições por segundo** | Nginx / Express | Detectar picos de tráfego |
| **Taxa de erros 4xx e 5xx** | Nginx / Express | SLO-04: alertar se > 1% |
| **Latência P50/P95/P99** | Express (Morgan) | SLO-02: latência da API |
| **Uso de CPU/RAM dos containers** | Docker Stats | Detectar vazamentos de memória |
| **Tamanho do pool de conexões MySQL** | Sequelize | Detectar exaustão de conexões |
| **Tempo de resposta do healthcheck** | Docker healthcheck | SLO-06: disponibilidade do banco |
| **Número de agendamentos criados/hora** | MySQL | Métricas de negócio |
| **Logins com falha (401)** | Express | Detectar ataques de força bruta |

---

#### Alertas Prioritários

| Alerta | Condição | Severidade | Ação imediata |
|---|---|---|---|
| **Alta taxa de erros 5xx** | > 1% das requisições em 5 min | 🔴 Crítico | Ver runbook de incidentes |
| **Backend indisponível** | Health check falha por > 30s | 🔴 Crítico | `docker restart aquawash_backend` |
| **MySQL indisponível** | Health check falha por > 60s | 🔴 Crítico | Ver logs do MySQL |
| **Latência elevada** | P95 > 2 segundos por 10 min | 🟡 Aviso | Verificar slow queries |
| **Container reiniciado** | `docker events` detecta restart | 🟡 Aviso | Checar logs do container |
| **Disco quase cheio** | Volume uploads > 80% | 🟡 Aviso | Limpar uploads antigos |

---

### Implementação Sugerida (Ferramentas)

Para uma evolução da observabilidade além dos logs Docker nativos:

| Ferramenta | Função | Integração |
|---|---|---|
| **Morgan** | Log de requisições HTTP no Express | Já disponível no ecossistema Node.js |
| **Prometheus** | Coleta de métricas (future) | `prom-client` no Express |
| **Grafana** | Dashboard de métricas (future) | Consome Prometheus |
| **Loki** | Agregação de logs (future) | Consome logs Docker via Promtail |
| **Docker Stats** | Métricas de container em tempo real | Nativo: `docker stats` |

**Para o projeto atual (v1.0), o mínimo viável de observabilidade é:**

```bash
# 1. Ver logs em tempo real
docker logs aquawash_backend -f

# 2. Monitorar uso de recursos
docker stats

# 3. Verificar status dos containers
docker compose ps

# 4. Checar health do banco
docker inspect aquawash_mysql | grep -A5 Health
```
