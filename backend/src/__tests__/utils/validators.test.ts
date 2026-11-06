import { validateEmail, validatePasswordStrength } from '../../utils/validators';

describe('validateEmail', () => {
  it('aceita e-mails em formato válido', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('joao.silva@dominio.com.br')).toBe(true);
    expect(validateEmail('a_b@c-d.org')).toBe(true);
  });

  it('rejeita e-mails inválidos', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('sem-arroba.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@dominio')).toBe(false);
    expect(validateEmail('user@dominio.')).toBe(false);
    expect(validateEmail('com espaço@dominio.com')).toBe(false);
    expect(validateEmail('user@dom inio.com')).toBe(false);
  });
});

describe('validatePasswordStrength', () => {
  it('aceita senhas fortes (minúscula, maiúscula, número e especial)', () => {
    expect(validatePasswordStrength('Senha@123')).toBe(true);
    expect(validatePasswordStrength('Abcdef1!')).toBe(true);
    expect(validatePasswordStrength('P@ssw0rd')).toBe(true);
  });

  it('rejeita senhas sem caractere especial', () => {
    expect(validatePasswordStrength('Senha1234')).toBe(false);
  });

  it('rejeita senhas sem número', () => {
    expect(validatePasswordStrength('Senha@xxx')).toBe(false);
  });

  it('rejeita senhas sem letra maiúscula', () => {
    expect(validatePasswordStrength('senha@123')).toBe(false);
  });

  it('rejeita senhas sem letra minúscula', () => {
    expect(validatePasswordStrength('SENHA@123')).toBe(false);
  });

  it('rejeita senhas curtas (< 8 caracteres)', () => {
    expect(validatePasswordStrength('S@1a')).toBe(false);
  });
});
