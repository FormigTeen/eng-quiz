require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const http = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

function uniqueEmail(prefix = 'user') {
  return `${prefix}.${Date.now()}_${Math.floor(Math.random()*1e6)}@example.com`;
}

describe('Auth via Gateway', () => {
  test('cadastro (register): cria usuário e bloqueia duplicado', async () => {
    const email = uniqueEmail('register');
    const password = 'password123';

    const r1 = await http.post('/auth/v1/register', { email, password });
    expect(r1.status).toBe(200);
    expect(r1.data).toBe(true);

    const r2 = await http.post('/auth/v1/register', { email, password });
    expect(r2.status).toBe(200);
    expect(r2.data).toBe(false);
  });

  test('login (email) e validação do token (auth)', async () => {
    const email = uniqueEmail('login');
    const password = 'password123';

    const reg = await http.post('/auth/v1/register', { email, password });
    expect(reg.status).toBe(200);
    expect(reg.data).toBe(true);

    const login = await http.post('/auth/v1/login', { email, password });
    expect(login.status).toBe(200);
    expect(login.data && typeof login.data.token).toBe('string');

    const token = login.data.token;
    const auth = await http.post('/auth/v1/auth', { token });
    expect(auth.status).toBe(200);
    expect(auth.data && auth.data.email).toBe(email);
    expect(auth.data && auth.data.role).toBe('basic');
  });

  test('logout: invalida o token por blacklist no Redis', async () => {
    const email = uniqueEmail('logout');
    const password = 'password123';

    const reg = await http.post('/auth/v1/register', { email, password });
    expect(reg.status).toBe(200);
    expect(reg.data).toBe(true);

    const login = await http.post('/auth/v1/login', { email, password });
    expect(login.status).toBe(200);
    expect(login.data && typeof login.data.token).toBe('string');

    const token = login.data.token;

    const logout = await http.post('/auth/v1/logout', { token });
    expect(logout.status).toBe(200);
    expect(logout.data).toBe(true);

    // Após logout, a autenticação deve falhar (token na blacklist)
    const auth = await http.post('/auth/v1/auth', { token });
    expect(auth.status).toBe(200);
    expect(auth.data).toBe(false);
  });

  test('login com usuário admin', async () => {
    const login = await http.post('/auth/v1/login', { email: 'admin@admin.com', password: 'admin123' });
    expect(login.status).toBe(200);
    expect(login.data && typeof login.data.token).toBe('string');

    const token = login.data.token;
    const auth = await http.post('/auth/v1/auth', { token });
    expect(auth.status).toBe(200);
    expect(auth.data && auth.data.email).toBe('admin@admin.com');
    expect(auth.data && auth.data.role).toBe('admin');
  });

  test('invite: solicita envio de convite autenticado', async () => {
    // autentica como admin
    const login = await http.post('/auth/v1/login', { email: 'admin@admin.com', password: 'admin123' });
    expect(login.status).toBe(200);
    const token = login.data.token;

    const inviteRes = await http.post(
      '/auth/v1/invite',
      { email: 'matheussf@ufba.br' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(inviteRes.status).toBe(200);
    expect(inviteRes.data).toBe(true);
  });
});
