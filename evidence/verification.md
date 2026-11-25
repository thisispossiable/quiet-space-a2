# Implementation verification

Date: 25 November 2026.

## Method

Run `python -m unittest discover -s tests -v` from the repository root.
The runner starts an ephemeral loopback HTTP server, launches installed Microsoft Edge headlessly in a fresh Playwright context, and closes both after the run. No personal browser profile is used.

## Results

12 tests passed, 0 failed on the final SafeBrowse run.

| Test | Verified behaviour |
|---|---|
| Protective decision | Block, inspectable rule P1 and no continuation control |
| Guided decision | Continuation opens an internal placeholder without navigation |
| False-positive review | Request remains pending until explicit scripted correction |
| Retained-risk review | Review upholds block and offers no restored preview |
| Unflagged fixture | Ordinary task does not trigger a warning |
| Understanding feedback | Wrong and correct selections receive explanations; safe exit remains available |
| Context change | Changing fixtures clears the prior decision, pending review and preview |
| Trace/reset | Downloaded JSON records actions; reset/reload clear memory; storage stays empty |
| Keyboard | Scenario buttons operate with Tab and Enter and expose selected state |
| Narrow layouts | No horizontal document overflow at 390 and 320 pixels during review |
| Screenshots | Three scenario states plus a 390-pixel layout captured from the real UI |
| Diagram XML | Both SVG source files parse successfully |

Every browser test also checks for JavaScript errors and unexpected external requests. No such errors or requests were observed.

An additional direct-file check opened `index.html` without a server, evaluated a fixture, followed the report link and verified all three embedded figures loaded. Report export checked the 175-word abstract, 946-word main report and 550-word README. The generated Word archive contains three embedded figures; the PDF has six pages and a complete PDF header/trailer.

## Captured states

- [Guided warning](01-guided-warning.png).
- [Protective block](02-protective-block.png).
- [Corrected false positive](03-reviewed-false-positive.png).
- [Mobile review](04-mobile-review.png).

## Limits

These are automated implementation checks performed by the coding agent. They do not establish usability, clinical or security effectiveness, accessibility conformance, or student personal review. No participant study, participant quotes, comprehension improvement or long-term fatigue measurement is claimed. Desktop and mobile images were visually inspected by the agent for obvious clipping and state inconsistencies.

The specialized TypeScript runtime-validation tools described by the installed skill were not available in the exposed tool catalog. Reproducible browser tests were run directly instead; no unavailable-tool result or upgrade baseline is claimed.
