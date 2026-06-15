# svelte-admin

Painel administrativo multi-loja. SvelteKit 5 + Tailwind CSS 4.

## Função

- **Dashboard** — Estatísticas, gráficos (Chart.js), pedidos recentes
- **Produtos** — CRUD completo com imagens, categorias, inventário
- **Pedidos** — Listagem, detalhes, atualização de status
- **Clientes** — Listagem e detalhes
- **Lojas** — Gerenciamento de múltiplas lojas (admin e super admin)
- **Storefront Personalizado** — Formulário para solicitar loja independente com branding próprio
- **Store Requests** — Super admin aprova/rejeita pedidos de novas lojas
- **Configurações** — Branding, DHL, multi-store toggle
- **i18n** — Português, English, Español

## Públicos

- **Admin** (`/admin/*`) — Donos de loja gerenciam seu negócio
- **Super Admin** (`/superadmin/*`) — Controle total sobre todas as lojas, usuários e pedidos

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | SvelteKit 5 |
| Estilos | Tailwind CSS 4 |
| Gráficos | Chart.js |
| Toast | svelte-sonner |
| Deploy | Vercel (SSR) |
| Domínio | `stadmin.fskk.site` |
