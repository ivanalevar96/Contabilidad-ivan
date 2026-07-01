# Plantillas de correo — UltimaCuota

Diseño con tu marca (fondo oscuro `#0b1522`, acento verde `#10b981`, símbolo de UltimaCuota) para pegar en **Supabase → Authentication → Email Templates**.

Cada template usa el logo alojado en `https://ultimacuota.cl/brand/mark-transparent-128.png` — ya está en producción, así que las imágenes cargan directo sin subir nada más.

## Dónde pegar cada uno

En Supabase, cada tipo de correo tiene un campo de **Subject** y uno de **Message body (HTML)**. Copia el contenido de cada archivo en el campo HTML correspondiente, y usa el asunto sugerido (primera línea del archivo, como comentario) en el campo Subject.

| Archivo | Plantilla en Supabase | ¿Se usa hoy en la app? |
|---|---|---|
| `confirm-signup.html` | Confirm signup | **Sí** — al registrarse con email/contraseña |
| `reset-password.html` | Reset Password | **Sí** — recuperar contraseña |
| `magic-link.html` | Magic Link | No implementado en la app todavía, pero Supabase lo puede usar igual |
| `invite-user.html` | Invite user | No usado (no hay flujo de invitar usuarios) |
| `change-email.html` | Change Email Address | No implementado todavía en Configuración |
| `reauthentication.html` | Reauthentication | Solo si activas "Secure password change" en Supabase Auth |

## Prioridad

Si quieres avanzar rápido, solo necesitas pegar **`confirm-signup.html`** y **`reset-password.html`** — son los dos flujos que la app usa activamente. Los demás quedan listos por si los necesitas más adelante (ej. si agregas "cambiar email" a la vista de Configuración).

## Variables usadas

- `{{ .ConfirmationURL }}` — link de acción (confirmar, resetear, etc.)
- `{{ .NewEmail }}` — usado solo en `change-email.html`
- `{{ .Token }}` — código OTP, usado solo en `reauthentication.html`
