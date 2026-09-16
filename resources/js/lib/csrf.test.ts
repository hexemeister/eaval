import { afterEach, describe, expect, it } from 'vitest';
import { getCsrfToken } from './csrf';

describe('getCsrfToken', () => {
  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('lê e decodifica o valor do cookie XSRF-TOKEN', () => {
    document.cookie = `XSRF-TOKEN=${encodeURIComponent('token com espaço')}`;
    expect(getCsrfToken()).toBe('token com espaço');
  });

  it('retorna string vazia quando o cookie não existe', () => {
    expect(getCsrfToken()).toBe('');
  });

  it('encontra o cookie mesmo entre outros cookies', () => {
    document.cookie = 'outro=valor';
    document.cookie = 'XSRF-TOKEN=abc123';
    expect(getCsrfToken()).toBe('abc123');
  });
});
