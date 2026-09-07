# Put the app's code on GitHub, and add a GitHub panel inside the app

Two separate things, done in order.

## 1. Send the code to GitHub (a setting, not code)

This part you do yourself in a couple of taps — I can't click it for you:

- In the chat box, open the **+** menu, choose **GitHub**, then **Connect project**.
- Approve Lovable on GitHub and pick the account or organization.
- Choose **Create Repository**.

After that the code lives in a GitHub repo and stays in sync both ways: changes here appear there, and changes pushed there appear here. From that repo you can download the code, invite collaborators, or host the app on another platform.

## 2. A GitHub panel inside the app

You connect one GitHub account, and the app can show and use that account's data.

- A new **GitHub** page in the app, reachable from the main screen.
- It lists your repositories (name, description, last updated, public or private) newest first.
- Tap a repository to see its open issues.
- Friendly messages while loading, when nothing is there, or if GitHub is busy.

Before this can work I'll open a connect card for GitHub so you can sign in and authorize it.

## Technical notes

- Connector: `standard_connectors--connect` with `connector_id: github`; calls go through the Lovable connector gateway (`https://connector-gateway.lovable.dev/github/...`) using `LOVABLE_API_KEY` + `GITHUB_API_KEY`, server-side only.
- New `src/lib/github.functions.ts` with `listRepos` and `listIssues` server functions (zod-validated input, gateway fetch inside the handler, non-OK status and body surfaced to the caller).
- New route `src/routes/github.tsx` using `useServerFn` + `useQuery`, styled with existing tokens, with its own `head()` title and description.
- Link added on the home screen next to the existing actions.
