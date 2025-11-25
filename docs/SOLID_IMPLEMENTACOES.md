# Documentação: Abstrações SOLID - Fase 1

## Visão Geral

Este documento descreve as abstrações criadas no projeto eng-quiz. As abstrações foram implementadas para seguir os princípios SOLID, especialmente o **Dependency Inversion Principle (DIP)** e o **Single Responsibility Principle (SRP)**.

---

## Princípios SOLID Aplicados

### 1. Single Responsibility Principle (SRP)
Cada abstração tem uma única responsabilidade bem definida:
- **EmailProvider**: Responsável apenas por envio de emails
- **CacheProvider**: Responsável apenas por operações de cache
- **HttpClient**: Responsável apenas por requisições HTTP

### 2. Open/Closed Principle (OCP)
As abstrações estão abertas para extensão (novas implementações) mas fechadas para modificação:
- Novos provedores de email podem ser criados sem modificar o código existente
- Novos provedores de cache podem ser adicionados facilmente
- Novos clientes HTTP podem ser implementados sem alterar a interface

### 3. Liskov Substitution Principle (LSP)
Todas as implementações podem ser substituídas sem quebrar o código:
- `NodemailerProvider` pode ser substituído por qualquer implementação de `EmailProvider`
- `RedisProvider` pode ser substituído por qualquer implementação de `CacheProvider`
- `FetchHttpClient` pode ser substituído por qualquer implementação de `HttpClient`

### 4. Interface Segregation Principle (ISP)
As interfaces são específicas e não forçam implementações desnecessárias:
- Cada interface define apenas os métodos essenciais para sua responsabilidade
- Não há métodos "fat" que forçam implementações vazias

### 5. Dependency Inversion Principle (DIP)
O código de alto nível (serviços de negócio) não depende mais de implementações concretas:
- Serviços dependem de abstrações (`EmailProvider`, `CacheProvider`, `HttpClient`)
- Implementações concretas (`NodemailerProvider`, `RedisProvider`, `FetchHttpClient`) dependem das abstrações

---

## 1. Email Provider

### 1.1 Interface Base

**Arquivo:** `services/auth/services/email.provider.js`

```javascript
class EmailProvider {
  async sendInvite(toEmail, fromEmail) { ... }
  async sendForgotPassword(toEmail, tempPassword) { ... }
}
```

**Responsabilidade:** Define o contrato para envio de emails no sistema.

**Métodos:**
- `sendInvite(toEmail, fromEmail)`: Envia email de convite para um usuário
- `sendForgotPassword(toEmail, tempPassword)`: Envia email de recuperação de senha

**Benefícios SOLID:**
- ✅ **SRP**: Responsabilidade única de definir contrato de email
- ✅ **DIP**: Abstração que permite inversão de dependência
- ✅ **OCP**: Permite adicionar novas implementações sem modificar código existente

### 1.2 Implementação Nodemailer

**Arquivo:** `services/auth/services/email.providers/nodemailer.provider.js`

**Implementação:** Usa a biblioteca `nodemailer` para envio via SMTP.

**Configuração:**
```javascript
{
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  user: process.env.SMTP_LOGIN,
  pass: process.env.SMTP_KEY,
  from: process.env.SMTP_FROM
}
```

**Características:**
- Lazy initialization do transporter (criado apenas quando necessário)
- Suporte a HTML e texto plano nos emails
- Tratamento de erros de configuração

**Exemplo de Uso:**
```javascript
const provider = new NodemailerProvider({
  host: 'smtp.example.com',
  port: 587,
  user: 'user@example.com',
  pass: 'password',
  from: 'noreply@example.com'
});

await provider.sendInvite('user@example.com', 'admin@example.com');
await provider.sendForgotPassword('user@example.com', 'temp123');
```

**Benefícios SOLID:**
- ✅ **LSP**: Pode ser substituído por qualquer implementação de `EmailProvider`
- ✅ **SRP**: Responsável apenas pela implementação concreta usando Nodemailer

---

## 2. Cache Provider

### 2.1 Interface Base

**Arquivo:** `services/auth/services/cache.provider.js`

```javascript
class CacheProvider {
  async get(key) { ... }
  async set(key, value, ttlSeconds) { ... }
  async del(key) { ... }
  async exists(key) { ... }
  async ttl(key) { ... }
}
```

**Responsabilidade:** Define o contrato para operações de cache.

**Métodos:**
- `get(key)`: Obtém valor do cache
- `set(key, value, ttlSeconds)`: Define valor no cache com TTL opcional
- `del(key)`: Remove valor do cache
- `exists(key)`: Verifica se chave existe
- `ttl(key)`: Obtém tempo de vida restante da chave

**Benefícios SOLID:**
- ✅ **SRP**: Responsabilidade única de definir contrato de cache
- ✅ **DIP**: Abstração que permite inversão de dependência
- ✅ **ISP**: Interface específica apenas para operações de cache

### 2.2 Implementação Redis (Auth Service)

**Arquivo:** `services/auth/services/cache.providers/redis.provider.js`

**Implementação:** Usa a biblioteca `ioredis` para interagir com Redis.

**Configuração:**
```javascript
{
  url: process.env.REDIS_URL,        // Opção 1: URL completa
  host: process.env.REDIS_HOST,      // Opção 2: Host e porta
  port: process.env.REDIS_PORT || 6379
}
```

**Características:**
- Suporte a conexão via URL ou host/porta
- Lazy initialization do cliente Redis
- Tratamento de erros com mensagens descritivas
- Método `isAvailable()` para verificar disponibilidade

**Exemplo de Uso:**
```javascript
const cache = new RedisProvider({
  url: 'redis://localhost:6379'
  // ou
  // host: 'localhost',
  // port: 6379
});

await cache.set('key', 'value', 3600); // TTL de 1 hora
const value = await cache.get('key');
const exists = await cache.exists('key');
const remainingTTL = await cache.ttl('key');
await cache.del('key');
```

**Benefícios SOLID:**
- ✅ **LSP**: Pode ser substituído por qualquer implementação de `CacheProvider`
- ✅ **SRP**: Responsável apenas pela implementação concreta usando Redis

### 2.3 Implementação Redis (Engine Service)

**Arquivo:** `services/engine/services/cache.provider.js`

**Implementação:** Similar ao Redis Provider do Auth Service, mas com interface própria para evitar dependência cruzada entre serviços.

**Nota:** A interface foi duplicada intencionalmente para manter os serviços independentes. Em uma arquitetura mais madura, poderia ser extraída para um pacote compartilhado.

---

## 3. HTTP Client (Frontend)

### 3.1 Interface TypeScript

**Arquivo:** `client/quiz/src/api/http-client.interface.ts`

```typescript
interface HttpClient {
  get<T>(path: string, token?: string): Promise<T>;
  post<T>(path: string, body: any, token?: string): Promise<T>;
  put<T>(path: string, body: any, token?: string): Promise<T>;
  delete<T>(path: string, token?: string): Promise<T>;
}
```

**Responsabilidade:** Define o contrato para requisições HTTP no frontend.

**Métodos:**
- `get<T>(path, token?)`: Requisição GET tipada
- `post<T>(path, body, token?)`: Requisição POST tipada
- `put<T>(path, body, token?)`: Requisição PUT tipada
- `delete<T>(path, token?)`: Requisição DELETE tipada

**Benefícios SOLID:**
- ✅ **SRP**: Responsabilidade única de definir contrato HTTP
- ✅ **DIP**: Abstração que permite inversão de dependência
- ✅ **ISP**: Interface específica apenas para operações HTTP

### 3.2 Implementação Fetch

**Arquivo:** `client/quiz/src/api/fetch-client.ts`

**Implementação:** Usa a API nativa `fetch` do navegador.

**Características:**
- Suporte a TypeScript com generics
- Construção automática de headers
- Injeção automática de token de autenticação
- Tratamento de erros HTTP
- Base URL configurável

**Exemplo de Uso:**
```typescript
const client = new FetchHttpClient('http://localhost:3000');

// GET request
const user = await client.get<User>('/auth/v1/auth', token);

// POST request
const result = await client.post<LoginResponse>('/auth/v1/login', {
  email: 'user@example.com',
  password: 'password'
});

// PUT request
await client.put<User>('/users/123', { name: 'John' }, token);

// DELETE request
await client.delete<void>('/users/123', token);
```

**Benefícios SOLID:**
- ✅ **LSP**: Pode ser substituído por qualquer implementação de `HttpClient`
- ✅ **SRP**: Responsável apenas pela implementação concreta usando Fetch

### 3.3 Refatoração do Client Existente

**Arquivo:** `client/quiz/src/api/client.ts`

**Mudanças:**
- Refatorado para usar `FetchHttpClient` internamente
- Mantém funções `apiPost` e `apiGet` para compatibilidade retroativa
- Exporta instância singleton `httpClient` para uso direto
- Exporta tipos `HttpClient` para uso em outros módulos

**Compatibilidade:**
```typescript
// Código antigo continua funcionando
const result = await apiPost<LoginResponse>('/auth/v1/login', data);

// Novo código pode usar diretamente
const result = await httpClient.post<LoginResponse>('/auth/v1/login', data);
```

---

## Benefícios Gerais da Fase 1

### 1. Testabilidade
- Interfaces permitem criar mocks facilmente
- Testes unitários podem usar implementações fake
- Testes de integração podem usar implementações reais

### 2. Flexibilidade
- Troca de implementações sem modificar código de negócio
- Exemplo: trocar Nodemailer por SendGrid apenas mudando a instância
- Exemplo: trocar Redis por Memcached apenas mudando o provider

### 3. Manutenibilidade
- Código mais limpo e organizado
- Responsabilidades bem definidas
- Fácil adicionar novas funcionalidades

### 4. Escalabilidade
- Novos provedores podem ser adicionados facilmente
- Suporte a múltiplas implementações simultâneas
- Preparado para arquitetura de microserviços

---

## Pontos do Projeto que Já Seguem SOLID

Antes da refatoração da Fase 1, o projeto já apresentava várias implementações que seguem os princípios SOLID. Esta seção documenta essas boas práticas existentes.

### 1. Arquitetura de Microserviços (SRP)

**Localização:** Estrutura geral do projeto em `services/`

**Princípio:** Single Responsibility Principle (SRP)

**Descrição:**
O projeto está organizado em microserviços independentes, cada um com responsabilidade única:
- `auth` - Autenticação e gerenciamento de usuários
- `content` - Gerenciamento de quizzes e conteúdo
- `engine` - Lógica de jogo e pontuação
- `gateway` - API Gateway e roteamento
- `ws` - WebSocket e comunicação em tempo real

**Benefícios:**
- ✅ Cada serviço tem uma única responsabilidade bem definida
- ✅ Serviços podem ser desenvolvidos, testados e deployados independentemente
- ✅ Facilita escalabilidade horizontal

**Exemplo:**
```javascript
// services/auth/services/auth.service.js
module.exports = {
  name: "auth",  // Responsável apenas por autenticação
  // ...
};

// services/content/services/content.service.js
module.exports = {
  name: "content",  // Responsável apenas por conteúdo
  // ...
};
```

---

### 2. Mixins do Moleculer (SRP, DIP, LSP)

**Localização:** `services/*/mixins/db.mixin.js`

**Princípios:** Single Responsibility Principle (SRP), Dependency Inversion Principle (DIP), Liskov Substitution Principle (LSP)

**Descrição:**
Os mixins do Moleculer separam a responsabilidade de acesso a banco de dados dos serviços de negócio. O mixin `db.mixin.js` encapsula toda a lógica de persistência e pode ser reutilizado por múltiplos serviços.

**Características:**
- Separação de responsabilidades: lógica de DB separada da lógica de negócio
- Inversão de dependência: serviços dependem de abstrações (adapters)
- Substituição: diferentes adapters (MongoDB, NeDB, Memory) podem ser usados sem modificar o código

**Exemplo:**
```javascript
// services/gateway/mixins/db.mixin.js
module.exports = function(collection) {
  const schema = {
    mixins: [DbService],  // Reutiliza funcionalidade de DB
    
    // Lógica de cache separada
    events: {
      async [cacheCleanEventName]() {
        if (this.broker.cacher) {
          await this.broker.cacher.clean(`${this.fullName}.*`);
        }
      }
    }
  };
  
  // DIP: Depende de abstração (adapter), não de implementação concreta
  if (process.env.MONGO_URI) {
    schema.adapter = new MongoAdapter(process.env.MONGO_URI);
  } else if (process.env.NODE_ENV === 'test') {
    schema.adapter = new DbService.MemoryAdapter();  // LSP: Substituível
  } else {
    schema.adapter = new DbService.MemoryAdapter({ filename: `./data/${collection}.db` });
  }
  
  return schema;
};
```

**Benefícios:**
- ✅ **SRP**: Mixin responsável apenas por operações de banco de dados
- ✅ **DIP**: Serviços dependem de abstração (adapter), não de implementação
- ✅ **LSP**: Diferentes adapters podem ser substituídos sem quebrar o código
- ✅ **OCP**: Novos adapters podem ser adicionados sem modificar o mixin

---

### 3. Gateway Services (SRP, ISP)

**Localização:** `services/gateway/services/v1/*.service.js`

**Princípios:** Single Responsibility Principle (SRP), Interface Segregation Principle (ISP)

**Descrição:**
Os serviços do gateway atuam como proxies/facades, com responsabilidade única de rotear requisições HTTP para os serviços internos. Cada serviço do gateway expõe apenas as ações necessárias para seu domínio.

**Exemplo:**
```javascript
// services/gateway/services/v1/auth.service.js
module.exports = {
  name: "gateway.auth.v1",  // Responsabilidade única: proxy de autenticação
  actions: {
    register: {
      params: { email: { type: "email" }, password: { type: "string", min: 6 } },
      async handler(ctx) {
        return ctx.call("auth.register", { email: ctx.params.email, password: ctx.params.password });
      }
    },
    login: {
      params: { email: { type: "email" }, password: { type: "string", min: 1 } },
      async handler(ctx) {
        return ctx.call("auth.login", { email: ctx.params.email, password: ctx.params.password });
      }
    }
    // Apenas ações relacionadas a autenticação
  }
};
```

**Benefícios:**
- ✅ **SRP**: Cada gateway service tem responsabilidade única de proxy para um domínio
- ✅ **ISP**: Cada serviço expõe apenas as ações necessárias para seu domínio
- ✅ Separação clara entre camada de API e camada de negócio

---

### 4. Hooks React Customizados (SRP, ISP)

**Localização:** `client/quiz/src/hooks/useAuth.ts`

**Princípios:** Single Responsibility Principle (SRP), Interface Segregation Principle (ISP)

**Descrição:**
O hook `useAuth` encapsula toda a lógica de autenticação do frontend, separando-a dos componentes. O hook expõe apenas a interface necessária para os componentes consumirem.

**Exemplo:**
```typescript
// client/quiz/src/hooks/useAuth.ts
export function useAuth() {
  // Lógica de autenticação encapsulada
  const authQuery = useQuery({ /* ... */ });
  const loginMutation = useMutation({ /* ... */ });
  const registerMutation = useMutation({ /* ... */ });
  const logoutMutation = useMutation({ /* ... */ });

  // ISP: Expõe apenas o necessário
  return {
    token,
    user: authQuery.data || null,
    sendLogin: loginMutation.mutateAsync,
    sendRegister: registerMutation.mutateAsync,
    sendLogout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error as Error | null,
    registerError: registerMutation.error as Error | null,
    signOut
  };
}
```

**Benefícios:**
- ✅ **SRP**: Hook responsável apenas por lógica de autenticação
- ✅ **ISP**: Expõe apenas métodos e propriedades necessários
- ✅ Reutilização: Pode ser usado em múltiplos componentes
- ✅ Testabilidade: Lógica isolada facilita testes

**Uso nos Componentes:**
```typescript
// client/quiz/src/pages/Login.tsx
const { sendLogin, isLoggingIn, loginError } = useAuth();
// Componente não precisa conhecer detalhes de implementação
```

---

### 5. Validação com Yup (SRP)

**Localização:** Vários serviços (ex: `services/auth/services/auth.service.js`)

**Princípio:** Single Responsibility Principle (SRP)

**Descrição:**
A validação de dados é separada da lógica de negócio usando a biblioteca Yup. Isso mantém a responsabilidade de validação isolada e reutilizável.

**Exemplo:**
```javascript
// services/auth/services/auth.service.js
register: {
  async handler(ctx) {
    // SRP: Validação separada da lógica de negócio
    const schema = yup.object({
      email: yup.string().email().required(),
      password: yup.string().min(6).required()
    });
    
    try {
      await schema.validate(ctx.params, { abortEarly: false, stripUnknown: true });
    } catch (e) {
      return false;  // Validação falhou
    }
    
    // Lógica de negócio após validação
    const email = String(ctx.params.email).trim().toLowerCase();
    // ...
  }
}
```

**Benefícios:**
- ✅ **SRP**: Validação é responsabilidade única e isolada
- ✅ Reutilização: Schemas podem ser reutilizados
- ✅ Manutenibilidade: Regras de validação centralizadas
- ✅ Testabilidade: Validação pode ser testada independentemente

---

### 6. Separação de Camadas (SRP, DIP)

**Localização:** Estrutura geral do projeto

**Princípios:** Single Responsibility Principle (SRP), Dependency Inversion Principle (DIP)

**Descrição:**
O projeto apresenta uma clara separação de camadas:
- **Frontend** (`client/quiz/`): Responsável apenas por UI e interação com usuário
- **Gateway** (`services/gateway/`): Responsável apenas por roteamento e autenticação HTTP
- **Serviços de Negócio** (`services/auth/`, `services/content/`, etc.): Responsáveis pela lógica de negócio
- **API Client** (`client/quiz/src/api/`): Abstração de comunicação HTTP

**Fluxo de Dependência:**
```
Frontend (UI)
    ↓ depende de
API Client (Abstração)
    ↓ depende de
Gateway (Roteamento)
    ↓ depende de
Serviços de Negócio (Lógica)
```

**Benefícios:**
- ✅ **SRP**: Cada camada tem responsabilidade única
- ✅ **DIP**: Camadas superiores dependem de abstrações
- ✅ Facilita manutenção e evolução do sistema
- ✅ Permite substituição de implementações sem afetar outras camadas

---

### 7. Uso de Context API do Moleculer (DIP)

**Localização:** Todos os serviços Moleculer

**Princípio:** Dependency Inversion Principle (DIP)

**Descrição:**
Os serviços Moleculer usam `ctx.call()` para comunicação entre serviços, que é uma abstração sobre o transporte de mensagens. Isso permite que os serviços não dependam de implementações concretas de comunicação.

**Exemplo:**
```javascript
// services/gateway/services/v1/auth.service.js
async handler(ctx) {
  // DIP: Depende de abstração (ctx.call), não de implementação concreta
  return ctx.call("auth.register", { 
    email: ctx.params.email, 
    password: ctx.params.password 
  });
}
```

**Benefícios:**
- ✅ **DIP**: Serviços dependem de abstração (`ctx.call`), não de transporte específico
- ✅ Flexibilidade: Transporte pode ser NATS, Redis, RabbitMQ, etc.
- ✅ Testabilidade: `ctx.call` pode ser mockado facilmente

---

## Resumo dos Princípios SOLID Já Aplicados

| Princípio | Onde Está Aplicado | Exemplo |
|-----------|-------------------|---------|
| **SRP** | Microserviços, Mixins, Gateway Services, Hooks | Cada serviço tem responsabilidade única |
| **OCP** | Mixins com adapters | Novos adapters podem ser adicionados sem modificar código |
| **LSP** | Adapters de banco de dados | MongoDB, NeDB, Memory adapters são substituíveis |
| **ISP** | Gateway Services, Hooks | Cada serviço/hook expõe apenas o necessário |
| **DIP** | Context API, Mixins com adapters | Dependências de abstrações, não implementações |

---

## Próximos Passos (Fases 2 e 3)

### Fase 2: Refatoração do Auth Service
- Criar `PasswordService` para hash de senhas
- Criar `TokenService` para JWT e blacklist
- Criar `EmailService` usando `EmailProvider`
- Criar `SequenceService` para lógica de sequência
- Refatorar `auth.service.js` para usar os novos serviços

### Fase 3: Refatoração do Quiz Component
- Criar hook `useQuizGame` para lógica de jogo
- Criar hook `useQuizAPI` para chamadas HTTP
- Criar componentes de tela separados
- Refatorar `Quiz.tsx` para usar hooks e componentes

---

## Estrutura de Arquivos Criados

```
services/
└── auth/
    └── services/
        ├── email.provider.js
        ├── email.providers/
        │   └── nodemailer.provider.js
        ├── cache.provider.js
        └── cache.providers/
            └── redis.provider.js

services/
└── engine/
    └── services/
        └── cache.provider.js

client/quiz/src/api/
├── http-client.interface.ts
├── fetch-client.ts
└── client.ts (refatorado)
```

---

## Conclusão

A Fase 1 estabeleceu as bases para a refatoração SOLID do projeto. As abstrações criadas seguem todos os princípios SOLID e preparam o código para as próximas fases de refatoração, onde os serviços serão divididos em responsabilidades menores e mais específicas.

**Status:** ✅ Fase 1 Concluída  
**Próxima Fase:** Fase 2 - Refatoração do Auth Service

