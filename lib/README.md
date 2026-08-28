# lib/

Shared helpers live here. They are built as they are needed, not designed up front:
the first session that wants a second copy of something moves it here. There is no
fixed interface to conform to and no helper you are obliged to use. Expect the
obvious candidates to appear over time - minting a Firebase session from an admin
signin token, seeding a persona idempotently, the capture wrapper that applies the
settings in `docs/style-guide.md`, content-hashing a screenshot filename, verifying
a jsDelivr URL, and the Intercom upsert - but write them when the work asks for
them, and keep each one small enough to read in one sitting.

Two rules. A helper must not make a capture non-deterministic: no clocks, no random
names, no waiting on durations. And Playwright config belongs in
`playwright.config.ts` at the repo root, created by the first session that runs a
spec, not hidden in a helper.
