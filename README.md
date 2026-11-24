# FinFlow AI

App de finanzas personales para iOS y Android: registras tus gastos hablando con una IA
("Compré gasolina en Puma por Q250 con tarjeta BAC"), la app detecta compras desde las
notificaciones y correos del banco, y una mascota (Flo, Coco, Leo o Balam) cambia de humor
según cómo van tus finanzas del mes.

## Estructura

```
apps/
  api/      Backend NestJS 12 + Prisma 7 + PostgreSQL
  mobile/   App Expo SDK 58 (React Native, Expo Router, NativeWind, TanStack Query, Zustand)
```

Cada app tiene sus propias dependencias (`npm install` dentro de cada carpeta).

## Arrancar en local

Necesitas Node 24 y Docker (o cualquier PostgreSQL 16).

```bash
# 1. Base de datos
docker compose up -d

# 2. API
cd apps/api
cp .env.example .env          # llena JWT_SECRET y DATA_ENCRYPTION_KEY (los comandos están en el archivo)
npm install
npx prisma migrate deploy
npm run db:seed               # categorías del sistema
npm run start:dev             # http://localhost:3000/health

# 3. App
cd ../mobile
cp .env.example .env          # en un teléfono físico usa la IP de tu compu, no localhost
npm install
npx expo start
```

El reconocimiento de voz, la lectura de notificaciones de Android y los anuncios usan módulos
nativos: para probarlos hace falta un build de desarrollo (`npx eas-cli@latest build --profile development`),
no Expo Go.

## API (prefijo `/api/v1`)

| Ruta | Qué hace |
| --- | --- |
| `POST /auth/register`, `POST /auth/token` | Crear cuenta / entrar. Devuelve access token (15 min) y refresh token |
| `POST /auth/token/refresh`, `POST /auth/token/revoke` | Rotar o cerrar sesión. Reusar un refresh token revoca toda la familia |
| `GET /dashboard` | Inicio: saldo, mes, presupuestos, metas, últimos movimientos y humor de la mascota |
| `POST /ai/chat` | Registrar con lenguaje natural (`{ "text": "..." }`). Límite de 30 mensajes al día |
| `GET/POST /transactions`, `PATCH /transactions/:id/category`, `DELETE /transactions/:id` | Movimientos. Corregir una categoría enseña a la IA |
| `GET/POST /accounts` | Cuentas y tarjetas (últimos 4 dígitos cifrados) |
| `GET /categories`, `GET/POST /budgets`, `GET/POST /goals`, `POST /goals/:id/contributions` | Categorías, presupuestos y metas |
| `POST /captures`, `GET /captures/pending`, `POST /captures/:id/confirm|dismiss` | Gastos detectados por notificación |
| `POST /webhooks/inbound-email` | Correos del banco reenviados (Cloudflare Email Worker, con secreto) |
| `GET/PATCH /me`, `GET /me/inbound-address`, `POST /me/no-spend`, `DELETE /me` | Perfil, mascota, racha y borrar cuenta |
| `GET /health`, `GET /ready` | Salud del servicio (sin prefijo) |

## Seguridad

- Contraseñas con scrypt y tokens con rotación y detección de reuso (`@nestjs/authentication`).
- Campos sensibles (últimos 4 dígitos, notas, tokens bancarios) cifrados con AES-256-GCM.
- Helmet, límite de peticiones por usuario, validación con Zod en cada entrada, y cada consulta filtrada por `userId`.
- El texto que va a Gemini se anonimiza (sin números de tarjeta, cuentas ni correos).
- En el teléfono: tokens en Keychain/Keystore, bloqueo con Face ID o huella al volver a la app.
- CI con pruebas, CodeQL y Dependabot.

## Despliegue gratuito

- API en Render (`render.yaml`), base de datos en Supabase, IA con la capa gratuita de Gemini.
- App con EAS Build (`apps/mobile/eas.json`).
