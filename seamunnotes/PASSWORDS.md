# Credentials Ledger

Keep this document offline (print it or store inside an encrypted vault). Whenever you rotate passwords, edit the `COMMITTEES` array inside `app.js`, click **Reset demo data** in the UI, and regenerate this sheet.

## Universal password pattern

| Item | Pattern | Example (EP) |
| --- | --- | --- |
| Chair credentials | ``{slug}-chairXX-dayY`` | Chair 02 → `ep-chair02-day1`, `ep-chair02-day2` |
| Delegate credentials | ``{slug}-delXX-dayY`` | Delegate 17 → `ep-del17-day1`, `ep-del17-day2` |

- `slug` = lower-cased committee code (see table below)  
- `XX` = zero-padded seat/chair number (01, 02, …)  
- `Y` = session day (1 or 2)

Because the pattern is deterministic, you can recreate any password on the fly without storing hundreds of individual strings.

## Committee directory

| Code | Slug | Committee | Chairs | Delegates | Chair Password Pattern | Delegate Password Pattern |
| --- | --- | --- | --- | --- | --- | --- |
| EP | `ep` | European Parliament | 3 | 25 | ``ep-chairXX-dayY`` | ``ep-delXX-dayY`` |
| USS | `uss` | United States Senate | 3 | 30 | ``uss-chairXX-dayY`` | ``uss-delXX-dayY`` |
| ECOSOC | `ecosoc` | Economic and Social Council | 2 | 25 | ``ecosoc-chairXX-dayY`` | ``ecosoc-delXX-dayY`` |
| HSC | `hsc` | Historical Security Council | 4 | 35 | ``hsc-chairXX-dayY`` | ``hsc-delXX-dayY`` |
| ICJ | `icj` | International Court of Justice | 3 | 15 | ``icj-chairXX-dayY`` | ``icj-delXX-dayY`` |
| INTERPOL | `interpol` | International Criminal Police Organization | 3 | 25 | ``interpol-chairXX-dayY`` | ``interpol-delXX-dayY`` |
| UNODC | `unodc` | UN Office on Drugs and Crime | 2 | 25 | ``unodc-chairXX-dayY`` | ``unodc-delXX-dayY`` |
| CSTD | `cstd` | Commission on Science & Technology for Development | 2 | 25 | ``cstd-chairXX-dayY`` | ``cstd-delXX-dayY`` |
| UNSC | `unsc` | Security Council | 2 | 30 | ``unsc-chairXX-dayY`` | ``unsc-delXX-dayY`` |
| UNHRC | `unhrc` | Human Rights Council | 2 | 30 | ``unhrc-chairXX-dayY`` | ``unhrc-delXX-dayY`` |
| DISEC | `disec` | Disarmament & International Security Committee | 2 | 30 | ``disec-chairXX-dayY`` | ``disec-delXX-dayY`` |
| UNICEF | `unicef` | United Nations Children’s Fund | 2 | 20 | ``unicef-chairXX-dayY`` | ``unicef-delXX-dayY`` |
| UNWOMEN | `unwomen` | UN Women | 2 | 30 | ``unwomen-chairXX-dayY`` | ``unwomen-delXX-dayY`` |
| WHO | `who` | World Health Organization | 2 | 30 | ``who-chairXX-dayY`` | ``who-delXX-dayY`` |
| UNEP | `unep` | UN Environmental Programme | 2 | 20 | ``unep-chairXX-dayY`` | ``unep-delXX-dayY`` |
| UNESCO | `unesco` | UNESCO | 2 | 20 | ``unesco-chairXX-dayY`` | ``unesco-delXX-dayY`` |
| F1 | `f1` | Formula One Council | 2 | 20 | ``f1-chairXX-dayY`` | ``f1-delXX-dayY`` |
| PRESS | `press` | Press Corps | 2 | 20 | ``press-chairXX-dayY`` | ``press-delXX-dayY`` |
| UNCSA | `uncsa` | Commission on Superhuman Activities | 2 | 20 | ``uncsa-chairXX-dayY`` | ``uncsa-delXX-dayY`` |
| FWC | `fwc` | Fantasy World Committee | 2 | 30 | ``fwc-chairXX-dayY`` | ``fwc-delXX-dayY`` |

## Worksheet / tracking template

Use the blank table below to log who received which physical card.

| Committee Code | Seat # | Day 1 Password | Day 2 Password | Issued To | Notes |
| --- | --- | --- | --- | --- | --- |
| EP | Chair 01 | `ep-chair01-day1` | `ep-chair01-day2` | | |
| EP | Delegate 07 | `ep-del07-day1` | `ep-del07-day2` | | |
| ... | ... | ... | ... | | |

Make as many rows as needed and archive/destroy sheets after each day.

## Rotation tips

- If you need Day 3, follow the same schema (`…-day3`) and update `generateUsers()` in `app.js`.
- After editing credentials, reload `index.html` and click **Reset demo data** so the browser cache picks up the new defaults.
- Share passwords on slips or cards; never email them to delegates.

