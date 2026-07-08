# Upgrade GitHub Actions para Node.js 24 — Design Spec

**Data:** 2026-05-26  
**Status:** Aprovado

---

## Problema

Os workflows do CI emitem avisos de deprecação:

```
Node.js 20 is deprecated. The following actions target Node.js 20 but are being
forced to run on Node.js 24: actions/checkout@v4, actions/cache@v4, actions/setup-node@v4
```

O GitHub Actions está forçando essas actions a rodar em Node.js 24, mas as versões `@v4` ainda declaram Node.js 20 como runtime. Isso não quebra nada agora, mas o suporte forçado pode ser removido no futuro.

---

## Solução

Atualizar as actions para as versões mais recentes, que já declaram Node.js 24 como runtime.

| Action | Versão atual | Versão alvo |
|---|---|---|
| `actions/checkout` | `v4` | `v6.0.2` |
| `actions/cache` | `v4` | `v5.0.5` |
| `actions/setup-node` | `v4` | `v6.4.0` |

---

## Arquivos a modificar

- `.github/workflows/main.yml` — 2× `actions/checkout`, 1× `actions/cache`, 1× `actions/setup-node`
- `.github/workflows/lint.yml` — 2× `actions/checkout`, 1× `actions/setup-node`

---

## Fora de escopo

- `shivammathur/setup-php@v2` — não gerou aviso, não alterar
- `SamKirkland/FTP-Deploy-Action@v4.4.0` — não gerou aviso, não alterar
- Versão do Node.js do projeto (atualmente 22.x) — não relacionado

---

## Verificação

Após o push, confirmar que os avisos de deprecação não aparecem mais no log do CI.
