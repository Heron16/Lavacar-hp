import { test, expect } from '@playwright/test';
import { loginAs, loginAsAdmin, ADMIN_EMAIL, ADMIN_PASSWORD, uniqueSuffix } from './helpers';

// ============================================================
//  Testes E2E — Autenticação (Login)
// ============================================================

test.describe('Login', () => {

  test('sucesso — admin faz login e é redirecionado ao painel admin', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Deve redirecionar para /admin
    await expect(page).toHaveURL(/\/admin/);

    // Deve exibir algum elemento do dashboard admin
    await expect(page.getByText(/dashboard|painel|bem-vindo/i).first()).toBeVisible();
  });

  test('falha — e-mail inexistente exibe mensagem de erro', async ({ page }) => {
    await loginAs(page, 'naoexiste@aquawash.com', 'Senha@123');

    // Deve permanecer na página de login
    await expect(page).toHaveURL(/\/login/);

    // Deve exibir mensagem de erro
    await expect(
      page.getByText(/e-mail ou senha|inválid|incorret/i).first()
    ).toBeVisible();
  });

  test('falha — senha incorreta exibe mensagem de erro', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, 'SenhaErrada@999');

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByText(/e-mail ou senha|inválid|incorret/i).first()
    ).toBeVisible();
  });

  test('falha — campos vazios não submetem o formulário', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Deve permanecer na página de login (validação HTML5 ou JS)
    await expect(page).toHaveURL(/\/login/);
  });

});

// ============================================================
//  Testes E2E — Cadastro de Usuário
// ============================================================

test.describe('Cadastro de Usuário', () => {

  test('sucesso — novo usuário se cadastra e é redirecionado', async ({ page }) => {
    const suffix = uniqueSuffix();
    await page.goto('/cadastro');

    await page.getByLabel(/nome/i).fill(`Usuário Teste ${suffix}`);
    await page.getByLabel(/e-mail/i).fill(`teste${suffix}@gmail.com`);
    await page.getByLabel(/cpf/i).fill(uniqueCPF());
    await page.getByLabel(/senha/i).fill('Senha@123');
    await page.getByRole('button', { name: /cadastrar|criar conta/i }).click();

    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });

  test('falha — e-mail já cadastrado exibe erro', async ({ page }) => {
    await page.goto('/cadastro');

    await page.getByLabel(/nome/i).fill('Admin Duplicado');
    await page.getByLabel(/e-mail/i).fill(ADMIN_EMAIL);   // e-mail já existe
    await page.getByLabel(/cpf/i).fill('529.982.247-25');
    await page.getByLabel(/senha/i).fill('Senha@123');
    await page.getByRole('button', { name: /cadastrar|criar conta/i }).click();

    await expect(
      page.getByText(/já cadastrado|e-mail.*exist|cpf.*exist/i).first()
    ).toBeVisible();
  });

  test('falha — CPF inválido exibe erro de validação', async ({ page }) => {
    const suffix = uniqueSuffix();
    await page.goto('/cadastro');

    await page.getByLabel(/nome/i).fill(`Usuário ${suffix}`);
    await page.getByLabel(/e-mail/i).fill(`cpfinvalido${suffix}@gmail.com`);
    await page.getByLabel(/cpf/i).fill('111.111.111-11');  // CPF inválido
    await page.getByLabel(/senha/i).fill('Senha@123');
    await page.getByRole('button', { name: /cadastrar|criar conta/i }).click();

    await expect(
      page.getByText(/cpf inválido|cpf.*inválid/i).first()
    ).toBeVisible();
  });

  test('falha — senha fraca exibe erro de validação', async ({ page }) => {
    const suffix = uniqueSuffix();
    await page.goto('/cadastro');

    await page.getByLabel(/nome/i).fill(`Usuário ${suffix}`);
    await page.getByLabel(/e-mail/i).fill(`senhafraca${suffix}@gmail.com`);
    await page.getByLabel(/cpf/i).fill('529.982.247-25');
    await page.getByLabel(/senha/i).fill('123');           // senha fraca
    await page.getByRole('button', { name: /cadastrar|criar conta/i }).click();

    await expect(
      page.getByText(/senha.*fraca|senha.*mínimo|senha.*forte/i).first()
    ).toBeVisible();
  });

});
