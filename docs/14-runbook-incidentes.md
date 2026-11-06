# 14. Runbook de Incidentes — AquaWash

> **Como usar este documento:** Quando o sistema apresentar falha, localize o sintoma na seção correspondente e siga os passos em ordem. Execute cada comando e verifique o resultado antes de prosseguir.

---

## Comandos de Diagnóstico Rápido

Antes de qualquer investigação, execute este bloco para ter uma visão geral do estado do sistema:

```bash
# Status de todos os containers
docker compose ps

# Uso de recursos em tempo real
docker stats --no-stream

# Logs recentes de cada serviço
docker logs aquawash_backend  --tail 30
docker logs aquawash_nginx    --tail 30
docker logs aquawash_mysql    --tail 30
docker logs aquawash_frontend --tail 10
```

---

## INC-01 — Sistema completamente inacessível (site fora do ar)

**Sintoma:** Navegador retorna "Não foi possível acessar o site" ou timeout.

```bash
# Passo 1: Verificar se os containers estão rodando
docker compose ps

# Passo 2: Se algum container estiver parado, reiniciar
docker compose up -d

# Passo 3: Verificar se o Nginx está respondendo
curl -k https://localhost -o /dev/null -w "%{http_code}"
# Esperado: 200 ou 301

# Passo 4: Se Nginx estiver travado, forçar reinício
docker compose restart nginx

# Passo 5: Verificar logs do Nginx por erros de configuração
docker logs aquawash_nginx --tail 50
```

**Se não resolver:** verificar se o servidor (host) está com disco cheio ou sem memória:
```bash
df -h          # espaço em disco
free -m        # memória disponível
```

---

## INC-02 — API retornando erros 500

**Sintoma:** Chamadas à API retornam HTTP 500; frontend exibe "Erro interno do servidor".

```bash
# Passo 1: Ver logs detalhados do backend
docker logs aquawash_backend --tail 100

# Passo 2: Verificar conexão com banco de dados
docker compose ps mysql
# Status deve ser "healthy"

# Passo 3: Se MySQL não estiver saudável
docker logs aquawash_mysql --tail 50

# Passo 4: Reiniciar backend (pode resolver erros transitórios)
docker compose restart backend

# Passo 5: Aguardar healthcheck e testar
sleep 15
curl -k https://localhost/api/services
# Esperado: HTTP 200 com lista de serviços
```

**Se o problema persistir após reinício → verificar INC-03 (banco de dados).**

---

## INC-03 — Banco de dados indisponível

**Sintoma:** Logs do backend mostram `SequelizeConnectionError` ou `ECONNREFUSED 3306`.

```bash
# Passo 1: Verificar status do MySQL
docker compose ps mysql
docker inspect aquawash_mysql | grep -A 10 '"Health"'

# Passo 2: Ver logs do MySQL
docker logs aquawash_mysql --tail 50

# Passo 3: Reiniciar MySQL
docker compose restart mysql

# Passo 4: Aguardar o healthcheck ficar healthy (pode levar até 2 min)
watch docker compose ps mysql

# Passo 5: Após MySQL healthy, reiniciar backend
docker compose restart backend

# Passo 6: Verificar que a API responde
curl -k https://localhost/api/services
```

**⚠️ NUNCA execute `docker compose down -v`** — isso apaga o volume `mysql_data` e **todos os dados do banco são perdidos permanentemente**.

---

## INC-04 — Erro de autenticação (todos os usuários recebem 401)

**Sintoma:** Nenhum usuário consegue fazer login; API retorna 401 para todas as requisições autenticadas.

```bash
# Passo 1: Verificar se JWT_SECRET está configurado no backend
docker exec aquawash_backend env | grep JWT

# Passo 2: Verificar o .env do backend
cat /opt/aquawash/backend/.env | grep JWT

# Passo 3: Se JWT_SECRET estiver vazio ou diferente do esperado, corrigir o .env
# e reiniciar o backend
docker compose restart backend
```

**Causa mais comum:** variável `JWT_SECRET` ausente ou alterada entre deploys — tokens anteriores ficam inválidos.

---

## INC-05 — Upload de imagens falhando

**Sintoma:** Foto de perfil ou imagem de serviço não salva; erro 500 no endpoint `/api/upload`.

```bash
# Passo 1: Verificar se o volume de uploads está montado
docker inspect aquawash_backend | grep -A 5 "Mounts"

# Passo 2: Verificar permissões na pasta de uploads
docker exec aquawash_backend ls -la /app/uploads

# Passo 3: Verificar espaço em disco
df -h

# Passo 4: Se pasta não existir, recriar
docker exec aquawash_backend mkdir -p /app/uploads/perfil /app/uploads/servico
docker exec aquawash_backend chmod 755 /app/uploads
```

---

## INC-06 — Deploy falhou, sistema em estado inconsistente

**Sintoma:** Após um deploy, o backend não sobe ou retorna erros; versão nova está com problema.

```bash
# Passo 1: Identificar a versão anterior estável (tag SHA)
docker images ghcr.io/<org>/aquawash/backend

# Passo 2: Fazer rollback para a versão anterior
# Editar /opt/aquawash/docker-compose.yml:
#   image: ghcr.io/<org>/aquawash/backend:<sha-anterior>
nano /opt/aquawash/docker-compose.yml

# Passo 3: Aplicar rollback
docker compose up -d --no-deps backend
docker compose up -d --no-deps frontend

# Passo 4: Verificar que o rollback funcionou
docker compose ps
curl -k https://localhost/api/services

# Passo 5: Registrar o incidente e abrir issue no repositório
```

---

## INC-07 — Alta latência / sistema lento

**Sintoma:** Páginas demoram mais de 5 segundos para carregar; usuários reclamam de lentidão.

```bash
# Passo 1: Verificar uso de recursos
docker stats --no-stream

# Passo 2: Verificar se há muitas conexões abertas no MySQL
docker exec aquawash_mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} \
  -e "SHOW STATUS LIKE 'Threads_connected';"

# Passo 3: Verificar slow queries
docker exec aquawash_mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} \
  -e "SHOW FULL PROCESSLIST;"

# Passo 4: Reiniciar backend para liberar pool de conexões
docker compose restart backend

# Passo 5: Se CPU estiver alta no host, verificar processos
top
```

---

## Matriz de Severidade e Escalação

| Severidade | Descrição | Tempo de Resposta | Ação |
|---|---|---|---|
| 🔴 **P1 — Crítico** | Sistema completamente fora do ar | Imediato (< 15 min) | Executar runbook + acionar responsável técnico |
| 🟠 **P2 — Alto** | Funcionalidade principal quebrada (ex.: não consegue agendar) | < 1 hora | Executar runbook específico |
| 🟡 **P3 — Médio** | Funcionalidade secundária com problema (ex.: upload falhando) | < 4 horas | Executar runbook + planejar correção |
| 🟢 **P4 — Baixo** | Lentidão leve, bug visual, erro pontual | < 24 horas | Criar issue no repositório |

---

## Após Resolver o Incidente

1. **Registrar** o incidente em uma issue no repositório com: data/hora, sintoma, causa raiz e solução aplicada.
2. **Verificar** se o SLO foi violado (ver `docs/12-qualidade-resiliencia-observabilidade.md`).
3. **Atualizar** este runbook se um novo cenário foi descoberto.
4. **Post-mortem** para incidentes P1/P2: analisar causa raiz e propor melhoria preventiva.
