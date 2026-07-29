# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: business-flow.spec.ts >> @smoke DTS Full Business Flow >> @critical admin can view dashboard with stats
- Location: tests/e2e/business-flow.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded while setting up "adminPage".
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Cambiar Idioma:ES" [ref=e5] [cursor=pointer]
  - generic [ref=e7]:
    - heading "Sistema de Gestión de Diplomas" [level=1] [ref=e8]
    - paragraph [ref=e9]: Servicios Universitarios
    - button "Demo Access — Explore the System" [ref=e10] [cursor=pointer]
    - separator [ref=e11]:
      - generic [ref=e12]: or sign in
    - generic [ref=e13]:
      - alert [ref=e14]:
        - img [ref=e16]
        - generic [ref=e18]: Invalid credentials
      - generic [ref=e19]:
        - generic [ref=e20]:
          - text: Correo Electrónico
          - generic [ref=e21]: "*"
        - generic [ref=e22]:
          - textbox "Correo Electrónico" [ref=e23]: admin@dts.unc.edu.ar
          - group:
            - generic: Correo Electrónico *
      - generic [ref=e24]:
        - generic [ref=e25]:
          - text: Contraseña
          - generic [ref=e26]: "*"
        - generic [ref=e27]:
          - textbox "Contraseña" [ref=e28]: Admin123456!
          - group:
            - generic: Contraseña *
      - button "Entrar" [ref=e29] [cursor=pointer]: Entrar
```

# Test source

```ts
  1  | import type { Page } from '@playwright/test';
  2  | 
  3  | export class LoginPage {
  4  |   constructor(private page: Page) {}
  5  | 
  6  |   async goto() {
  7  |     await this.page.goto('/login');
  8  |   }
  9  | 
  10 |   async fillCredentials(email: string, password: string) {
  11 |     await this.page.getByTestId('email-input').fill(email);
  12 |     await this.page.getByTestId('password-input').fill(password);
  13 |   }
  14 | 
  15 |   async submit() {
  16 |     await this.page.getByTestId('login-btn').click();
> 17 |     await this.page.waitForURL(/\/dashboard/);
     |                     ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  18 |   }
  19 | 
  20 |   async loginAs(email: string, password: string) {
  21 |     await this.goto();
  22 |     await this.fillCredentials(email, password);
  23 |     await this.submit();
  24 |   }
  25 | }
  26 | 
```