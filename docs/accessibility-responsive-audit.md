# Accessibility and responsive UI audit

## Scope

This pass covers shared navigation, authentication and researcher journeys, plus admin report review, company/program management, patch/payout actions, search and database privilege probes.

## Changes

| Area | Finding | Change |
|---|---|---|
| Keyboard navigation | No global skip target or shared focus treatment | Skip-to-main-content link and high-visibility `:focus-visible` outline |
| Primary navigation | Active route was only visually distinguished | Navigation landmark has an accessible name and active links expose `aria-current="page"` |
| Mobile navigation | Sidebar links remained a vertical list on narrow screens | Navigation becomes a horizontally scrollable row on small screens and returns to a vertical sidebar on desktop |
| Researcher report form | Core fields needed stable label associations | Program, title, description, severity and CVSS fields have matching `htmlFor`/`id` pairs |
| Admin review form | Decision, duplicate target and note labels were not associated with controls | Added stable, report-scoped IDs and matching labels |
| Admin company/program forms | Several visible labels were not programmatically associated with controls | Added matching IDs and labels for company, program, scope, status and company selection |
| Patch/payout forms | Date, notes, amount and currency controls relied on placeholders or proximity | Added explicit labels and report-scoped IDs |
| Search | Search query input had no accessible name | Added a visually-hidden label |
| Database privilege probes | Action column had no heading and repeated Run buttons lacked context | Added a column heading, probe-specific accessible button names and polite result announcements |
| Async form feedback | Error/success state was only visual text | Errors use an assertive alert; success feedback uses a polite status announcement |
| Data tables | Wide tables could push beyond the viewport | Shared table minimum width is contained by existing horizontal-scroll wrappers |
| Motion | No global reduced-motion override | Transitions and animations are minimized when the OS requests reduced motion |

## Automated verification

Run on the PR branch:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

CI results should be linked from the pull request after the workflow completes. These checks do not replace browser accessibility testing.

## Manual browser acceptance

Perform at 360px, 768px and 1440px widths:

- [ ] Tab from the address bar; skip link appears first and moves focus to the main region.
- [ ] Every primary navigation link is reachable by keyboard; active route is announced as current.
- [ ] Focus indicator remains visible on links, buttons, inputs and selects.
- [ ] Complete registration, login and report submission without a pointer.
- [ ] Complete admin review, company/program editing, patch recording, payout creation and privilege probes using only the keyboard.
- [ ] Every form control announces its label; required fields expose native required validation.
- [ ] Trigger a failed form request and confirm the error is announced; confirm successful feedback is announced politely.
- [ ] Privilege probe results are announced after the request completes.
- [ ] Researcher dashboard, program cards and report list fit the viewport; tables scroll within their own region rather than widening the page.
- [ ] Repeat with reduced motion enabled.
- [ ] Check primary flows with a screen reader and inspect text/control contrast.

## Evidence and limitations

The changes above are code-level fixes. CI provides automated lint, type, unit and production-build evidence. The viewport, keyboard-only, screen-reader and contrast checks remain manual acceptance items and must be checked by a reviewer in a browser; this document does not claim those manual checks have already been executed.
