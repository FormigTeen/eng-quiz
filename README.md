# ⚽ Soccer Quiz - App de Futebol

Este projeto é uma aplicação completa de Quiz de Futebol, composta por uma arquitetura de *Microserviços* no Backend e um aplicativo móvel híbrido no Frontend.

## 🚀 Tecnologias Utilizadas

### Backend (Microserviços)
- *Node.js* com framework *Moleculer JS*
- *Docker* & *Docker Compose* (Orquestração)
- *MongoDB* (Banco de Dados)
- *Redis* (Cache)
- *NATS* (Mensageria entre serviços)

### Frontend (Mobile)
- *Ionic Framework* 7
- *React* (TypeScript)
- *Jotai* (Gerenciamento de Estado)
- *TanStack Query* (Comunicação com API)
- *Vite* (Build Tool)

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

### Software Necessário

1. **Node.js** (Versão 18 ou superior)
   - Download: [https://nodejs.org/](https://nodejs.org/)
   - Verificar instalação: `node --version`
   - Verificar npm: `npm --version`

2. **Docker Desktop** (ou Docker Engine + Docker Compose)
   - Download: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - **IMPORTANTE**: Docker Desktop deve estar **rodando** antes de executar os comandos
   - Verificar instalação: `docker --version`
   - Verificar Docker Compose: `docker compose version`

3. **Git**
   - Download: [https://git-scm.com/](https://git-scm.com/)
   - Verificar instalação: `git --version`

---

## 🛠️ Instalação e Configuração

Siga os passos abaixo na ordem para rodar o projeto.

### 1. Clonar o Repositório

```bash
git clone https://github.com/FormigTeen/eng-quiz.git
cd eng-quiz
```

### 2. Configurar Variáveis de Ambiente do Backend

Crie um arquivo `.env` na pasta `services/` com as seguintes variáveis:

```bash
cd services
```

Crie o arquivo `.env`:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# Linux/Mac
touch .env
```

Adicione as seguintes variáveis ao arquivo `.env`:

```env
# Configurações Gerais
NAMESPACE=
LOGGER=true
LOGLEVEL=info
SERVICEDIR=services

# Transporter NATS
TRANSPORTER=nats://nats:4222

# MongoDB
MONGO_URI=mongodb://mongodb:27017/db_auth_service

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret (IMPORTANTE: Use uma string segura em produção)
JWT_SECRET=eng-quiz-jwt

# Password Seed (IMPORTANTE: Use uma string segura em produção)
PASSWORD_SEED=eng-quiz-seed

# Configurações SMTP (para envio de emails)
# NOTA: O hostname smtp-relay.brevo.com será automaticamente convertido para smtp-relay.sendinblue.com
# para resolver problemas de certificado SSL. O certificado SSL é válido apenas para sendinblue.com
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_LOGIN=9bef88001@smtp-brevo.com
SMTP_KEY= CONFIGURAR SERVIDOR SMTP
SMTP_FROM=msformigteen@gmail.com

# Porta do Gateway
PORT=3000
```

### 3. Instalar Dependências do Frontend

```bash
# Voltar para a raiz do projeto
cd ..

# Entrar na pasta do cliente
cd client/quiz

# Instalar dependências
npm install
```

### 4. Configurar Variáveis de Ambiente do Frontend (Opcional)

O frontend usa `http://localhost:3000` como padrão para a API. Se precisar alterar, crie um arquivo `.env` na pasta `client/quiz/`:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# Linux/Mac
touch .env
```

Adicione:

```env
VITE_API_URL=http://localhost:3000
```

---

## 🚀 Executando o Projeto

### Backend (Microserviços)

1. **Certifique-se de que o Docker Desktop está rodando**

2. **Navegue até a pasta de serviços**:

```bash
cd services
```

3. **Suba todos os serviços com Docker Compose**:

```bash
# Construir e subir todos os serviços
docker compose up -d --build
```

Este comando irá:
- Construir as imagens Docker de todos os microserviços
- Subir os containers: MongoDB, Redis, NATS, Gateway, Auth, Content, Engine, WS, Ping e Pong
- Criar a rede `eng-quiz-net` para comunicação entre serviços

4. **Verificar se os serviços estão rodando**:

```bash
# Listar containers em execução
docker compose ps

# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico (ex: gateway)
docker compose logs -f gateway
```

5. **Verificar se a API está respondendo**:

```bash
# Testar endpoint de ping
curl http://localhost:3000/api/ping/v1/trigger

# Ou abra no navegador
# http://localhost:3000/api/ping/v1/trigger
```

### Frontend (Aplicativo Mobile)

1. **Navegue até a pasta do cliente**:

```bash
cd client/quiz
```

2. **Inicie o servidor de desenvolvimento**:

```bash
npm run dev
```

O aplicativo estará disponível em:
- **URL Local**: `http://localhost:5173` (porta padrão do Vite)
- O Vite mostrará a URL exata no terminal após iniciar

3. **Para build de produção**:

```bash
npm run build
```

4. **Para preview da build de produção**:

```bash
npm run preview
```

---

## 🧪 Testes

### Testes do Frontend

```bash
cd client/quiz

# Testes unitários
npm run test.unit

# Testes E2E (requer Cypress)
npm run test.e2e

# Linter
npm run lint
```

### Testes do Backend

```bash
cd tests

# Instalar dependências dos testes (se necessário)
npm install

# Executar testes
npm test
```

## 🛑 Parando os Serviços

### Parar Backend

```bash
cd services

# Parar todos os containers
docker compose down

# Parar e remover volumes (apaga dados do MongoDB)
docker compose down -v
```

### Parar Frontend

Pressione `Ctrl + C` no terminal onde o frontend está rodando.

---

## 🔧 Comandos Úteis

### Docker Compose

```bash
cd services

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f gateway
docker compose logs -f auth
docker compose logs -f mongodb

# Reiniciar um serviço específico
docker compose restart gateway

# Reconstruir e subir serviços
docker compose up -d --build

# Ver status dos containers
docker compose ps

# Parar todos os serviços
docker compose stop

# Iniciar serviços parados
docker compose start
```

### Limpeza

```bash
cd services

# Remover containers, redes e volumes
docker compose down -v

# Remover imagens não utilizadas
docker image prune

# Limpeza completa (cuidado!)
docker system prune -a
```

---

## 🐛 Troubleshooting

### Problema: Porta 3000 já está em uso

**Solução**: 
- Pare o processo que está usando a porta 3000
- Ou altere a porta no `docker-compose.yml` e no `.env` do frontend

### Problema: Docker não está rodando

**Solução**: 
- Inicie o Docker Desktop
- Verifique com `docker ps`

### Problema: Erro de conexão com MongoDB

**Solução**: 
- Verifique se o container do MongoDB está rodando: `docker compose ps`
- Verifique os logs: `docker compose logs mongodb`
- Verifique a variável `MONGO_URI` no arquivo `.env`

### Problema: Erro de conexão com NATS

**Solução**: 
- Verifique se o container do NATS está rodando
- Verifique a variável `TRANSPORTER` no arquivo `.env`
- Deve ser: `TRANSPORTER=nats://nats:4222`

### Problema: Frontend não consegue conectar com a API

**Solução**: 
- Verifique se o backend está rodando: `docker compose ps`
- Verifique a URL da API no arquivo `.env` do frontend
- Verifique se a porta 3000 está acessível: `curl http://localhost:3000`

### Problema: Erro ao instalar dependências

**Solução**: 
- Limpe o cache do npm: `npm cache clean --force`
- Delete `node_modules` e `package-lock.json`
- Execute `npm install` novamente

---

## 📁 Estrutura do Projeto

```
eng-quiz/
├── client/
│   └── quiz/              # Frontend (Ionic + React)
│       ├── src/
│       ├── public/
│       └── package.json
├── services/              # Backend (Microserviços)
│   ├── auth/              # Serviço de autenticação
│   ├── content/           # Serviço de conteúdo
│   ├── engine/            # Serviço de engine do quiz
│   ├── gateway/           # API Gateway
│   ├── ping/              # Serviço ping
│   ├── pong/              # Serviço pong
│   ├── ws/                # Serviço WebSocket
│   ├── docker-compose.yml # Orquestração dos serviços
│   └── .env              # Variáveis de ambiente (criar)
├── tests/                 # Testes E2E
└── README.md
```

---

## 📝 Notas Importantes

1. **Segurança**: Nunca commite o arquivo `.env` com valores reais em produção. Use variáveis de ambiente do sistema ou serviços de gerenciamento de secrets.

2. **Desenvolvimento**: Em desenvolvimento, os serviços podem ser executados individualmente sem Docker usando `npm run dev` em cada pasta de serviço.

3. **Produção**: Para produção, configure adequadamente:
   - Variáveis de ambiente seguras
   - SSL/TLS para a API
   - Firewall e segurança de rede
   - Backup do banco de dados

4. **Performance**: O Redis é usado para cache. Certifique-se de que está configurado corretamente para melhor performance.

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

## 👥 Autores

- Seu Nome - *Desenvolvimento Inicial*

---

## 🙏 Agradecimentos

- Moleculer JS pela excelente framework de microserviços
- Ionic Framework pela plataforma mobile híbrida
- Comunidade open source