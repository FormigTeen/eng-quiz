# Configuração de Permissões do Strapi

## Configuração Manual via Admin UI

Após iniciar o Strapi, acesse `http://localhost:1337/admin` e configure as permissões:

### 1. Permissões Públicas (Leitura)

1. Vá em **Settings** → **Users & Permissions plugin** → **Roles** → **Public**
2. Na seção **Question**, marque:
   - `find` (GET /api/questions)
   - `findOne` (GET /api/questions/:id)
3. Na seção **Quiz**, marque:
   - `find` (GET /api/quizzes)
   - `findOne` (GET /api/quizzes/:id)
4. Clique em **Save**

### 2. Criar API Token (Para o Serviço Content)

1. Vá em **Settings** → **API Tokens** → **Create new API Token**
2. Configure:
   - **Name**: `Content Service Token`
   - **Token duration**: `Unlimited` (ou conforme necessário)
   - **Token type**: `Full access` (ou `Custom` com permissões específicas)
3. Clique em **Save**
4. **Copie o token gerado** e adicione ao arquivo `.env` como `STRAPI_API_TOKEN`

### 3. Permissões do API Token (Se usar Custom)

Se escolher `Custom` no passo anterior, configure:
- **Question**: `create`, `find`, `findOne`, `update`, `delete`
- **Quiz**: `create`, `find`, `findOne`, `update`, `delete`
- **Team**: `create`, `find`, `findOne`, `update`, `delete`

## Variáveis de Ambiente

Adicione ao arquivo `services/.env`:

```env
STRAPI_URL=http://content:1337
STRAPI_API_TOKEN=<token-gerado-no-admin>
```


