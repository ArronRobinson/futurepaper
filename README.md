# The Alternate Times

An aged broadsheet front page that rewrites itself for any "What if…" premise.

## Files

- `index.html`: the newspaper page
- `api/edition.js`: a server function that sends the premise to the Claude API and streams the new front page back

## Deploy on Vercel

1. Get an API key at https://console.anthropic.com (Settings → API Keys). Add some credit under Billing.
2. Put the *contents* of this folder in a new GitHub repository, so `index.html`, `package.json` and the `api` folder sit at the top level of the repo, with `edition.js` inside `api`.
3. On https://vercel.com, click **Add New → Project** and import that repository. Leave the framework preset on **Other** and keep the build settings empty.
4. Before deploying, open **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` = your key
   - optional: `ANTHROPIC_MODEL` to use another Claude model (the default is `claude-sonnet-5-5`)
5. Click **Deploy**.

If you'd rather skip GitHub, you can deploy from a terminal: `npm i -g vercel`, then run `vercel` in this folder and follow the prompts. Add the key with `vercel env add ANTHROPIC_API_KEY`, then run `vercel --prod`.

## Costs and safety

- Every edition is one Claude API call, and your key pays for it. Set a monthly spend limit in the Anthropic Console (Settings → Limits) before you share the link.
- The key only exists on Vercel's servers. Visitors never see it.
- The server builds the newsroom prompt itself and accepts only a premise of up to 220 characters, so nobody can use the site as a general chatbot on your key.
- For a public launch, consider turning on Vercel's Firewall rate limiting for `/api/edition`.

## Test locally

Run `vercel dev` in this folder, with `ANTHROPIC_API_KEY` set in a `.env.local` file.
