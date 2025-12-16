# Documentação: Abstrações SOLID

## Visão Geral

Este documento descreve as abstrações e padrões SOLID implementados no projeto eng-quiz. As abstrações foram implementadas para seguir os princípios SOLID, especialmente o **Dependency Inversion Principle (DIP)** e o **Single Responsibility Principle (SRP)**.

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

## Pontos do Projeto que Já Seguem SOLID

### 1. Arquitetura de Microserviços (SRP)

**Localização:** Estrutura geral do projeto em `services/`

**Princípio:** Single Responsibility Principle (SRP)

**Descrição:**
O projeto está organizado em microserviços independentes, cada um com responsabilidade única:
- `auth` - Autenticação e gerenciamento de usuários
- `content` - Gerenciamento de quizzes e conteúdo (Strapi CMS)
- `engine` - Lógica de jogo e pontuação
- `gateway` - API Gateway e roteamento
- `payment` - Processamento de pagamentos (AbacatePay)
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

**Exemplos:**

**Auth Gateway:**
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

**Payment Gateway:**
```javascript
// services/gateway/services/v1/payment.service.js
module.exports = {
  name: "gateway.payment.v1",  // Responsabilidade única: proxy de pagamento
  actions: {
    createPayment: {
      auth: "required",
      async handler(ctx) {
        const user = ctx.meta.user;
        return ctx.call("payment.createPayment", {
          userId: user.email,
          packageId: ctx.params.packageId,
          amount: ctx.params.amount,
          coins: ctx.params.coins
        });
      }
    },
    getPaymentStatus: { ... },
    webhook: { ... }
    // Apenas ações relacionadas a pagamento
  }
};
```

**Benefícios:**
- ✅ **SRP**: Cada gateway service tem responsabilidade única de proxy para um domínio
- ✅ **ISP**: Cada serviço expõe apenas as ações necessárias para seu domínio
- ✅ Separação clara entre camada de API e camada de negócio
- ✅ Consistência: Todos os gateway services seguem o mesmo padrão (auth, content, engine, payment)

---

## Padrões SOLID Identificados 

### 8. Lazy Loading Pattern no Payment Service (DIP)

**Localização:** `services/payment/services/payment.service.js`

**Princípio:** Dependency Inversion Principle (DIP)

**Descrição:**
O serviço de pagamento implementa lazy loading para o módulo AbacatePay, carregando-o apenas quando necessário e quando a API key está configurada. Isso permite que o serviço funcione mesmo sem o SDK instalado (modo simulado).

**Implementação:**
```javascript
// Importar AbacatePay apenas se necessário (lazy loading)
let AbacatePay = null;
function getAbacatePayModule() {
  if (!AbacatePay && process.env.ABACATE_PAY_API_KEY) {
    try {
      AbacatePay = require("abacatepay-nodejs-sdk");
    } catch (err) {
      console.warn("Failed to load abacatepay-nodejs-sdk:", err.message);
    }
  }
  return AbacatePay;
}

getAbacatePayClient() {
  const apiKey = process.env.ABACATE_PAY_API_KEY;
  if (!apiKey) {
    throw new Error("ABACATE_PAY_API_KEY not configured");
  }
  
  const AbacatePayModule = getAbacatePayModule();
  // Tenta diferentes formas de usar a biblioteca
  if (typeof AbacatePayModule === "function") {
    return AbacatePayModule(apiKey);
  } else if (AbacatePayModule.default && typeof AbacatePayModule.default === "function") {
    return AbacatePayModule.default(apiKey);
  } else if (AbacatePayModule.createClient) {
    return AbacatePayModule.createClient(apiKey);
  }
}
```

**Benefícios SOLID:**
- ✅ **DIP**: O serviço não depende diretamente do módulo AbacatePay no momento da inicialização
- ✅ **OCP**: Permite adicionar novos formatos de SDK sem modificar a lógica principal
- ✅ **SRP**: A responsabilidade de carregar o módulo está isolada
- ✅ **Flexibilidade**: O serviço pode funcionar em modo simulado sem o SDK instalado

**Oportunidade de Melhoria:**
Este padrão poderia ser abstraído em um `PaymentProvider` seguindo o mesmo padrão dos outros providers (EmailProvider, CacheProvider), permitindo trocar AbacatePay por outro gateway de pagamento.

---

### 9. Strategy Pattern Implícito - Modo Simulado vs Real (OCP, DIP)

**Localização:** `services/payment/services/payment.service.js`

**Princípios:** Open/Closed Principle (OCP) e Dependency Inversion Principle (DIP)

**Descrição:**
O serviço de pagamento implementa um padrão Strategy implícito, alternando entre modo simulado e modo real baseado na configuração. O modo é determinado pela presença da `ABACATE_PAY_API_KEY`.

**Implementação:**
```javascript
methods: {
  isSimulatedMode() {
    return !process.env.ABACATE_PAY_API_KEY;
  },
  
  // No handler createPayment:
  const isSimulated = this.isSimulatedMode();
  
  if (isSimulated) {
    // Modo simulado: criar pagamento sem AbacatePay
    // Gera QR Code e PIX Code simulados usando QRCode e crypto
    const qrCode = await this.generateSimulatedQRCode(paymentId);
    const pixCode = this.generateSimulatedPixCode(paymentId);
  } else {
    // Modo real: usar AbacatePay
    const abacate = this.getAbacatePayClient();
    const billing = await abacate.billing.create({ ... });
  }
}
```

**Benefícios SOLID:**
- ✅ **OCP**: O código está aberto para extensão (novos modos podem ser adicionados) mas fechado para modificação
- ✅ **DIP**: A lógica de negócio não depende diretamente de implementações concretas
- ✅ **SRP**: Cada modo tem responsabilidade única
- ✅ **Testabilidade**: Facilita testes sem necessidade de integração com gateway real

**Oportunidade de Melhoria:**
Este padrão poderia ser formalizado criando uma abstração `PaymentStrategy`:
```javascript
class PaymentStrategy {
  async createPayment(params) { ... }
  async processWebhook(payload) { ... }
}

class SimulatedPaymentStrategy extends PaymentStrategy { ... }
class AbacatePayStrategy extends PaymentStrategy { ... }
```

---

### 10. Idempotency Pattern no Payment Service (SRP)

**Localização:** `services/payment/services/payment.service.js`

**Princípio:** Single Responsibility Principle (SRP)

**Descrição:**
O serviço implementa um padrão de idempotência usando Redis para garantir que operações críticas (criação de pagamento, processamento de webhook, crédito de moedas) não sejam executadas múltiplas vezes.

**Implementação:**
```javascript
methods: {
  async checkIdempotency(key) {
    if (!this.redis) return false;
    try {
      const exists = await this.redis.get(key);
      return exists !== null;
    } catch (err) {
      this.logger.warn("Redis idempotency check failed", err?.message);
      return false;
    }
  },

  async setIdempotency(key, ttl = 86400) {
    if (!this.redis) return;
    try {
      await this.redis.set(key, "1", "EX", ttl);
    } catch (err) {
      this.logger.warn("Redis idempotency set failed", err?.message);
    }
  }
}

// Uso no processWebhook:
const idempotencyKey = `payment:webhook:${billingId}`;
if (await this.checkIdempotency(idempotencyKey)) {
  this.logger.info("Webhook already processed", { billingId });
  return { success: true, message: "Webhook já processado" };
}
await this.setIdempotency(idempotencyKey, 86400);
```

**Benefícios SOLID:**
- ✅ **SRP**: A responsabilidade de idempotência está isolada em métodos específicos
- ✅ **Reutilização**: Os métodos podem ser usados em diferentes contextos
- ✅ **Resiliência**: Previne execução duplicada de operações críticas
- ✅ **Testabilidade**: Métodos isolados facilitam testes

**Oportunidade de Melhoria:**
A lógica de idempotência poderia ser abstraída usando o `CacheProvider` existente, seguindo o padrão já estabelecido no projeto.

---

### 11. Strapi Factory Pattern (DIP)

**Localização:** `services/content/src/api/*/services/*.ts` e `services/content/src/api/*/controllers/*.ts`

**Princípio:** Dependency Inversion Principle (DIP)

**Descrição:**
O serviço de conteúdo (Strapi) usa o padrão Factory do framework para criar controllers e services. Isso segue o DIP ao depender de abstrações (`factories`) em vez de implementações concretas.

**Implementação:**
```typescript
// services/content/src/api/pergunta/services/pergunta.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::pergunta.pergunta');

// services/content/src/api/pergunta/controllers/pergunta.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::pergunta.pergunta');
```

**Benefícios SOLID:**
- ✅ **DIP**: Depende de abstrações (`factories`) do framework, não de implementações concretas
- ✅ **OCP**: Novos content types podem ser criados sem modificar código existente
- ✅ **Consistência**: Segue padrões estabelecidos do Strapi
- ✅ **Manutenibilidade**: Código mais limpo e padronizado

**Observação:**
Este é um padrão do framework Strapi, não uma implementação customizada. No entanto, demonstra o uso correto de DIP ao depender de abstrações fornecidas pelo framework.

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
| **SRP** | Microserviços, Mixins, Gateway Services, Hooks, Idempotency | Cada serviço tem responsabilidade única |
| **OCP** | Mixins com adapters, Payment Strategy | Novos adapters/estratégias podem ser adicionados sem modificar código |
| **LSP** | Adapters de banco de dados | MongoDB, NeDB, Memory adapters são substituíveis |
| **ISP** | Gateway Services, Hooks | Cada serviço/hook expõe apenas o necessário |
| **DIP** | Context API, Mixins com adapters, Lazy Loading, Strapi Factories | Dependências de abstrações, não implementações |

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

services/
└── payment/
    └── services/
        └── payment.service.js (com lazy loading e strategy pattern)

services/
└── content/ (Strapi)
    └── src/
        └── api/
            ├── pergunta/
            │   ├── services/
            │   │   └── pergunta.ts (usa factories)
            │   └── controllers/
            │       └── pergunta.ts (usa factories)
            └── equipe/
                ├── services/
                │   └── equipe.ts (usa factories)
                └── controllers/
                    └── equipe.ts (usa factories)

services/
└── gateway/
    └── services/
        └── v1/
            ├── auth.service.js
            ├── content.service.js
            ├── engine.service.js
            └── payment.service.js

client/quiz/src/api/
├── http-client.interface.ts
├── fetch-client.ts
└── client.ts (refatorado)
```

---

