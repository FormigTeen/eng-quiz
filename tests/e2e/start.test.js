require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('End-to-end: user flow', () => {
  test('test ping', async () => {
    // 1) Cria usuário
    const createRes = await axios.get(`https://ping.eu`);

    expect(createRes.status).toBe(200);
  });
});
