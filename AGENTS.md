<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Personal single-user app with no login: tables allow full public access by design; add auth + per-user policies before sharing it. Why: user requested a solo tool without accounts.
- AI calls go through createServerFn in src/lib/ai.functions.ts so keys stay server-side.
