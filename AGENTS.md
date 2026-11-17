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

- Keep legal documents as public TanStack routes and run self-account deletion and consent recording through authenticated server functions; this reuses the existing auth boundary and avoids changing the admin system.
- Keep PayU checkout in server-generated test-mode form data and a public callback that verifies PayU before atomically recording payment or activating a plan; this keeps credentials and premium grants out of the browser.
