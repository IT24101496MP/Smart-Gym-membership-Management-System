# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Backend URL Configuration

Configure frontend API target via environment variables:

- `VITE_API_BASE_URL`: Axios base URL used by the frontend.
- `VITE_DEV_API_TARGET`: Dev-only backend target for Vite proxy (`/api`).

Recommended values:

- Local development: `VITE_API_BASE_URL=/` and `VITE_DEV_API_TARGET=http://localhost:8080`
- Deployment (same domain/reverse proxy): `VITE_API_BASE_URL=/`
- Deployment (separate backend domain): `VITE_API_BASE_URL=https://your-backend-domain`

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## PayHere Setup (Checkout API)

1. Configure backend env values:
	- `PAYHERE_MERCHANT_ID`
	- `PAYHERE_MERCHANT_SECRET`
	- `PAYHERE_SANDBOX=true|false`
	- `PAYHERE_RETURN_URL`
	- `PAYHERE_CANCEL_URL`
	- `PAYHERE_NOTIFY_URL` (must be publicly reachable)
2. Start backend and frontend.
3. Open `/payment/:planId`, create payment intent, then click **Proceed to PayHere**.

Notes:
- Frontend posts an HTML form directly to PayHere checkout URL using backend-generated hash.
- PayHere payment completion is finalized by backend verification at `/api/payments/payhere/notify`.
- **Confirm Payment (Test)** remains available for local-only fallback testing.
