# Gym & Tonic release checklist

- [ ] Vercel production environment sets `PUBLIC_ENABLE_ANALYTICS=true` and `PUBLIC_PLAUSIBLE_DOMAIN`; preview environments do not.
- [ ] Check response headers on a Vercel preview and confirm CSP, `X-Frame-Options`, referrer policy, and permissions policy are present.
- [ ] Verify `/`, `/plan`, `/privacy`, `/data`, and `/safety` on desktop and a narrow mobile viewport.
- [ ] Complete one session, reload during a workout, export data, import it into a clean browser profile, then test the explicit delete control.
- [ ] Load `/plan` once, go offline, then reopen it and verify the saved plan and local images remain available.
- [ ] Complete a keyboard-only and reduced-motion pass through setup, session details, guided workout, reflection, and proposal approval.
- [ ] Review every image in `public/images/CREDITS.md` for current licence and commercial suitability.
- [ ] Obtain Kenyan privacy/legal review before collecting names, contacts, payments, health data, or other personal information.
