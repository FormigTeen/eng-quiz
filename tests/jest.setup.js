// Custom Jest matchers to improve HTTP error messages in failures

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'string' && value.length > 500) {
        return value.slice(0, 500) + '…(truncated)';
      }
      return value;
    }, 2);
  } catch (e) {
    return String(obj);
  }
}

expect.extend({
  toHaveStatus(received, expected) {
    const isResp = received && typeof received.status === 'number';
    if (!isResp) {
      return {
        pass: false,
        message: () => `Expected an axios response with a status, but received: ${safeStringify(received)}`
      };
    }

    const pass = received.status === expected;
    const msg = () => {
      const parts = [
        `Expected status ${expected} but received ${received.status}.`,
        'Response snapshot:',
        safeStringify({
          status: received.status,
          data: received.data,
          headers: received.headers,
          request: received.config
        })
      ];
      return parts.join('\n');
    };
    return { pass, message: msg };
  }
});

// Type hints for TS users running tests (ignored in JS)
// declare global { namespace jest { interface Matchers<R> { toHaveStatus(code: number): R } } }
