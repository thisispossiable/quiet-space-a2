# SafeBrowse: Who Carries the Risk?

Prose word count: 550 (headings included; code and setup commands excluded).

A1-aligned browser-warning interaction prototype. The repository retains its original `quiet-space-a2` name and earlier wellbeing commits so the change of scope remains traceable.

## Status and boundaries

- **Implemented:** English responsive UI, two policies, four fixtures, rule explanations, safe return, review states, optional understanding feedback, memory-only trace and local export.
- **Simulated:** all threat signals, `.example` websites and review outcomes. Internal previews never open real sites.
- **Not implemented:** live scanning, trained AI, a browser extension, real appeals or participant evaluation.
- **Technology:** HTML, CSS and vanilla JavaScript; no backend, model API, account or persistent storage. The rules represent simulated intelligent behaviour, not verified threat classification.

## Run and inspect

Open `index.html` directly, or serve this folder:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8000`. Nothing is sent to external services by the prototype. Reload or **Reset demonstration** clears the trace. **Export local trace** saves only scenario, policy and action/outcome records.

Try:

1. Login mismatch + guided choice: evaluate, inspect reasons, continue internally or return.
2. Unexpected download + protective default: inspect the block; there is no bypass.
3. Legitimate site + protective default: request review, observe pending, run scripted review, open the corrected fixture.
4. Ordinary library: no unnecessary warning under either policy.

## Verification

Development dependencies are needed only for automated checks and report export. Tests use an installed Microsoft Edge through an isolated headless Playwright session, not your personal profile.

```powershell
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
python tools\export_report.py
```

Twelve automated tests cover policy outcomes, both review results, internal-only continuation, optional answer feedback, keyboard operation, trace export/reset, storage/network boundaries, narrow layouts and SVG parsing. See [verification evidence](evidence/verification.md) and [screenshots](evidence/). These are agent-run implementation checks, not participant research.

## Development record

- **Initial scope:** a wellbeing draft was built before A1 was available; preserved in earlier commits.
- **Evidence-led pivot:** A1 concerned browser warnings and responsibility. SafeBrowse replaced the draft to connect literature to implemented decisions rather than retrofit unrelated citations.
- **Protection versus agency:** two policies expose different control allocations on identical fixtures.
- **Recourse:** a pending state and separate scripted outcome distinguish requesting review from actually resolving an error.
- **Verification-driven correction:** the previous invalid SVG was replaced; browser tests check state transitions and 320/390-pixel overflow. Evidence is captured from the working UI.

## AI assistance and authorship

An AI assistant using Copilot SDK in VS Code generated implementation code, tests, diagram source and report drafts. Requests included aligning the prototype with A1 and checking behaviour against written claims. The agent ran automated checks, inspected screenshots, and revised the design to label rules, threats and reviews honestly. This does **not** establish that the student personally checked every output.

The student supplied A1, chose the direction and requested changes. Before submission, the student must review the code and claims, understand the decisions, verify citations and map the named design concepts to the actual Weeks 1-4 materials. Those slides and lecturer feedback were not supplied; no matching course coverage or feedback has been invented.

## Submission files and access

- [Report source](PROJECT_REPORT.md), [printable report](report.html), [PDF](SafeBrowse-A2-Report.pdf), [editable Word report](SafeBrowse-A2-Report.docx).
- [System diagram](system-diagram.svg) and [storyboard](storyboard.svg); rendered versions and real UI screenshots are in [evidence](evidence/).
- Submitted version: Git tag `a2-safebrowse-v1`.
- [Repository](https://github.com/thisispossiable/quiet-space-a2) is private at the owner's request. Confirm the course accepts private access and invite assessors before submission, or make it public deliberately.

No separate ZIP is needed. No credentials or original A1 document are included.
