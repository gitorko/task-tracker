# Task Tracker

A simple task tracking app built with React and Vite.

## Run Locally

**Prerequisites:** Node.js 18+ and npm installed.

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd task-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`

## Database Setup (Vercel Postgres)

This app uses Vercel Postgres for persistent storage. Set it up once before deploying:

1. Go to your project in the [Vercel dashboard](https://vercel.com/dashboard).
2. Click the **Storage** tab → **Create Database** → choose **Postgres**.
3. Follow the prompts — Vercel automatically adds `POSTGRES_URL` and related env vars to your project.
4. That's it. The table is created automatically on the first request.

For **local development**, install the [Vercel CLI](https://vercel.com/docs/cli) and run:
```bash
npm install -g vercel
vercel link        # link to your Vercel project
vercel env pull .env.local   # pulls DATABASE_URL into a local .env file
npm run dev
```

## Deploy to Vercel

### Option 1 — Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. From the project root, run:
   ```bash
   vercel
   ```

3. Follow the prompts. Vercel will auto-detect Vite and set the build settings correctly.

### Option 2 — Vercel Dashboard (recommended)

1. Push your code to a GitHub, GitLab, or Bitbucket repository.

2. Go to [vercel.com](https://vercel.com) and sign in.

3. Click **Add New Project** and import your repository.

4. Vercel will auto-detect the Vite framework. Confirm the following settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Click **Deploy**. Your app will be live in under a minute.

> Every push to your main branch will trigger an automatic redeployment.
