# FIX-06 root cause
Browser console (chromium, production build, temporary diagnostic in submitCase fetch catch):
`TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation`
Where: lib/session/use-submission.ts passed `fetch: globalThis.fetch` in SubmitDeps; submitCase calls `deps.fetch(...)`, so `this` = deps object. Reduction itself succeeded (reduce catch never fired). Error mapped to NETWORK_ERROR, banner text is the AC-22 one.
After fix: POST /api/analyze sent (200), UI shows "Analizujemy zdjęcie…" / "Przygotowujemy decyzję…", chat route called.
