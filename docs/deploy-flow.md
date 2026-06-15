# Fluxo de Deploy — Admin Panel (svelte-admin)

O painel admin é o ponto de partida do fluxo de criação de lojas independentes.

## Papel no fluxo

```
Admin abre stadmin.fskk.site
  │
  ├── /admin/custom-storefront
  │     Preenche formulário com branding + token
  │     → POST /api/store-requests
  │
  └── /superadmin/store-requests
        Vê solicitações pendentes
        → PUT /api/store-requests/:id/approve
```

## Telas envolvidas

### `/admin/custom-storefront`
Formulário que coleta:
- Nome da loja
- Cores primária/secundária
- URL da logo e favicon
- Fonte
- Domínio customizado (opcional)
- Token de acesso (opcional)

Submete para `POST /api/store-requests` com `storefrontType: "INDEPENDENT"`.

### `/superadmin/store-requests`
Tabela com todas as solicitações. Super admin pode:
- **Aprovar**: dispara criação de DNS, store, branding
- **Rejeitar**: marca como REJECTED com motivo

### `/superadmin/stores`
Tabela com todas as lojas. Coluna "Tipo" mostra se é:
- **Padrão** (`DEFAULT`) — loja tradicional sem subdomínio
- **Personalizado** 🎨 (`INDEPENDENT`) — loja com subdomínio próprio + DNS

## Integração

- Todas as chamadas vão para `whatever-ecommerce-backend.vercel.app/api/*`
- Autenticação via JWT armazenado no localStorage
- i18n: pt / en / es

Para detalhes do fluxo completo de deploy, veja o `deploy-flow.md` do backend.
