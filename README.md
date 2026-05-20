![Convertio Image](https://raw.githubusercontent.com/zett-8/images/refs/heads/master/hrr.png)

# 🔥 Hono React Router

**Hono React Router** is a production-ready template designed to launch your web app seamlessly on **Cloudflare Workers**.  
It builds upon the official [React Router Cloudflare D1 template](https://github.com/remix-run/react-router-templates/tree/main/cloudflare-d1), offering a more powerful and flexible foundation.

📖 Explore the [Hono](https://hono.dev/) and [React Router](https://reactrouter.com/) documentation for full feature references.

---

**Demo:** [https://hono-react-router.zett.workers.dev](https://hono-react-router.zett.workers.dev)

<br />

## 🚀 Available Setups

This repository also includes a lighter version under the [`mini`](https://github.com/zett-8/hono-react-router/tree/mini) branch — choose the version that best fits your needs.

| Feature / Branch                                        | `main` | `mini` |
| ------------------------------------------------------- | ------ | ------ |
| Hono Server                                             | ✅     | ✅     |
| └─ Clean Architecture                                   | ✅     |        |
| React Router (Framework mode)                           | ✅     | ✅     |
| D1 Database                                             | ✅     |        |
| Authentication ([Better Auth](https://better-auth.com)) | ✅     |        |
| Drizzle ORM                                             | ✅     |        |
| Testing (Vitest)                                        | ✅     |        |
| Zod Validation                                          | ✅     |        |
| Tailwind CSS                                            | ✅     | ✅     |
| Prettier                                                | ✅     | ✅     |
| ESLint (Flat Config)                                    | ✅     | ✅     |
| Vite                                                    | ✅     | ✅     |
| TypeScript                                              | ✅     | ✅     |

<br />

## 🛠️ Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Generate types

```bash
pnpm typegen
```

### 3. Set up environment variables

```bash
cp .dev.vars.sample .dev.vars
```

Then edit `.dev.vars` and set your `BETTER_AUTH_SECRET` (at least 32 characters).

### 4. Run initial database migration

```bash
pnpm db:generate
pnpm db:migrate
```

OR for Wrangler:
```bash
npx wrangler d1 migrations apply --remote DB
```
### 5. Start the development server (with HMR)

```bash
pnpm dev
```

Your app will be available at: http://localhost:5173

### Optional: Run with Wrangler

```sh
pnpm build
pnpm start
```

<br />

## 🏗 Building for Production

To create a production-ready build:

```bash
pnpm run build
```

<br />

## 🚢 Deployment

Deployment is handled via [Wrangler](https://developers.cloudflare.com/workers/wrangler/).

### Deploy to production:

```sh
npx wrangler deploy
```

### Deploy a preview version:

```sh
npx wrangler versions upload
```

Once validated, you can promote a version to production:

```sh
npx wrangler versions deploy
```

<br />

## 🎨 Styling

This template comes pre-configured with [Tailwind CSS](https://tailwindcss.com/) for rapid styling.
Feel free to replace or extend it with your preferred CSS framework or methodology.

    In your Worker project directory (where wrangler.jsonc or wrangler.toml is):


## Cloudflare D1 DB 

### update

```sh
pnpm dlx wrangler d1 execute vendula-bags-db --remote --command="INSERT INTO collections (name, season) VALUES ('Test','SS26');"
```

### check tables
```sh
pnpm dlx wrangler d1 execute vendula-bags-db --remote --command="SELECT name FROM sqlite_schema WHERE type='table';"
```
```sh
pnpm dlx wrangler d1 execute vendula-bags-db --remote --command="SELECT * FROM d1_migrations;"
```


## Deployment flow

For production, deploy the Worker with wrangler deploy, and run the DB migration separately with wrangler d1 migrations apply vendula-bags-db --remote. Wrangler’s D1 docs show that migrations are versioned SQL files applied to the remote database, and CI can run them directly against remote D1.

A GitHub Actions job should usually do:

   - Install dependencies.

   - Build the app.

   - Apply remote D1 migrations.

    - Deploy the Worker.

Cloudflare’s CI/CD docs also note that wrangler deploy is the standard deployment command for Workers in GitHub Actions.
If remote already has the tables

If the remote DB already contains Collections, Shapes, or Designs, do not try to recreate them in a later migration. Instead, either:

    keep the live schema and add only the missing users migration, or

    export/back up, drop the conflicting tables, and reapply the clean migration chain.

Recommended next command

After you update the migration files, run:

bash
pnpm dlx wrangler d1 migrations apply vendula-bags-db --remote

Then verify:

bash
pnpm dlx wrangler d1 execute vendula-bags-db --remote --command="SELECT name FROM sqlite_schema WHERE type='table';"


## Check validation issues

Fast fix

Run these in order:

bash
npx wrangler logout
unset CLOUDFLARE_API_TOKEN
unset CF_API_TOKEN
npx wrangler login
npx wrangler whoami

If whoami works, try:

bash
npx wrangler deploy

Wrangler docs support using either interactive login or a CLOUDFLARE_API_TOKEN environment variable for CI/CD and automation.
If you want API-token auth

Create a fresh Cloudflare API token and export it in your shell:

bash
export CLOUDFLARE_API_TOKEN="your_new_token"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
npx wrangler whoami
npx wrangler deploy

Make sure the token belongs to the same Cloudflare account as b39ccaeee2bfc196b30cf6b86fd59b0a, because Wrangler is trying to deploy into that account.
Common gotchas

    A token in .env is fine, but if an old token is also set in your shell, Wrangler may still pick that up.

    If you recently changed accounts, clear Wrangler’s cached auth state by logging out and logging back in.

    In GitHub Actions, the token must be stored as a repository secret and passed as CLOUDFLARE_API_TOKEN.

Best next check

Run:

bash
npx wrangler whoami

----

---- 
bash
npx wrangler dev

    Your Worker will be available at:

text
http://localhost:8787

    To test with D1 and other remote resources, use:

bash
npx wrangler dev --remote

This runs your code locally but uses remote Cloudflare resources like D1 databases.
Deploy to a public URL

To expose your Worker on the internet:

bash
npx wrangler deploy

Then your Worker will be live at:

text
https://<your-worker-name>.<your-subdomain>.workers.dev

Check DB connection: cd hono-react-router && wrangler d1 execute vendula-bags-db --remote "SELECT COUNT(*) as count FROM Collections;"