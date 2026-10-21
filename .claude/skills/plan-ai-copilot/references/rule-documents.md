# Rule documents (policies) for the decision agent

The decision agent receives these documents as rules it must follow and cites them in its justification. Write them for that use.

## Structure

- One document per case type, e.g. `docs/policies/return-policy.md`, `docs/policies/complaint-policy.md`.
- Language of the end user (Polish by default), because the agent quotes them. State this exception to the English-docs rule in PRD §12.
- Header note: sample document, not legal advice, requires legal review before production use, injected into the agent's instructions.
- Numbered sections `§N` with numbered `ust.` so the agent can cite "§3 ust. 3 Regulaminu zwrotów". Never renumber after the PRD references them; if you must, update every reference in the same commit.
- Sections in this order: definitions; each path with its deadline and conditions; exclusions; typical eligible cases (examples); procedure (including "the preliminary assessment is not a formal submission"); safety.

## Content rules

- Express every deadline as a number of days counted from a named event (purchase, delivery, submission), so the system can compute it and the PRD can state the threshold (e.g. 14, 30, 730 days).
- State how the system date relates to the legal event (e.g. "purchase date is treated as delivery date in the MVP").
- Distinguish statutory rights from voluntary company rules when both exist; the agent must not apply voluntary conditions to statutory rights.
- Make conditions observable from a photo or the form wherever possible (e.g. "no scratches, dents, fingerprints"), because the analysis step reports exactly those.
- List excluded causes and typical eligible defects as concrete visual signs.
- Rules needed by **every** case type (e.g. safety with swollen batteries) go into a shared section or a shared document. Do not put them only into one case type's document, or the other case type's agent will not see them.

## Fact verification

- Confirm every legal deadline, presumption and remedy order with a primary source (statute text, government/regulator site). Commercial blogs are only hints.
- Record the sources in the chat report and in PRD §12.
- A fact not confirmed by a primary source is written as `[DO WERYFIKACJI]` in the document and listed in PRD §12 Open questions. Never present it as settled.
