# Bordero sans Base44 — mode d'emploi

L'application ne dépend plus de la plateforme Base44 : les pages parlent à notre
propre backend (`server/`), servi sur la même origine que le site. Le domaine
`thebordero.com` pointe vers ce déploiement unique.

## Ce qui a été remplacé

| Base44 | Remplaçant |
| --- | --- |
| Comptes / mots de passe | `server/auth.ts` — PBKDF2 120 000 itérations, cookie `HttpOnly` + `SameSite=Lax` + `Secure` hors localhost, sessions en base, réinitialisation par e-mail |
| Base de données | D1 (Cloudflare) / SQLite local, table `entity_rows` (un enregistrement = un document JSON) |
| Règles d'accès (RLS) | Les RLS des 21 entités sont rejouées côté serveur + `server/policies.ts` (champs financiers, rôles, validations) |
| Fonctions (44) | Les fichiers `base44/functions/*/entry.ts` sont réutilisés tels quels via `server/sdk.ts` |
| Fichiers / images | R2 (`FILES`) via `/api/storage/upload` et `/api/files/:clé` |
| SDK `@base44/sdk` côté navigateur | `src/api/localClient.js` (même surface : `entities`, `auth`, `functions`, `integrations`) |

## Lancer en local

```bash
npm install
npm run server:dev     # backend + site construit sur http://localhost:8787
```

Pour développer avec le rechargement à chaud du front : `npm run server:dev` dans
un terminal, `npm run dev` dans un autre (Vite proxifie `/api` vers `:8787`).

Variables utiles (facultatives en local) :

- `ADMIN_EMAILS` — adresses créées avec le rôle `admin` (séparées par des virgules).
- `ALLOW_SIGNUP=false` — ferme les inscriptions publiques.
- `RESEND_API_KEY` + `MAIL_FROM` — envoi réel des e-mails. Sans clé, les messages
  sont mis en file dans la table `outbox` (consultable, rien n'est perdu).
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — paiement.
- `CRON_SECRET` — protège `/api/cron/:nom`.

## Déployer

1. `npm run build:all` produit `dist/` (site) et `server-dist/worker.mjs` +
   `sites.manifest.json` (Worker).
2. Créer le site puis une base D1 et un bucket R2 (bindings `DB` et `FILES`).
3. Déployer le manifeste, puis renseigner les secrets (aucune clé dans le code).
4. Faire pointer `thebordero.com` vers le déploiement (enregistrement fourni par
   l'hébergeur, puis domaine personnalisé).

## Reprise des données

Les données et les comptes Base44 ne sont pas accessibles par API : il faut
exporter les entités en CSV depuis Base44, puis les réimporter. L'import crée les
enregistrements avec leurs identifiants d'origine (`upsertRaw`), ce qui préserve
les liens entre commandes, missions et relais.

Les mots de passe Base44 (dont les connexions Google) ne sont pas transférables :
chaque personne définit le sien via « Mot de passe oublié » sur `/login`.

## Ce qui reste à brancher

- Clé d'e-mail (Resend/SendGrid) : sans elle, les messages restent en file.
- Stripe : clés live + endpoint webhook `/api/functions/stripeWebhook`.
- Google Analytics : le connecteur Base44 n'est pas repris (`getConnection`
  répond 501).
- Tâches planifiées : appeler `/api/cron/:nom` avec l'en-tête `x-cron-secret`.
