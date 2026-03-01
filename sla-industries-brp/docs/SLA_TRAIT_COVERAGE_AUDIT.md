# SLA BRP Trait Coverage Audit

Generated from live trait engine definitions.

- Total mapped traits: 29
- SLA2 seed rows: 29
- Result: all seeded SLA2 traits are recognized by the BRP trait engine key map.

| Trait | Type | Max Rank | Automation | BRP Conversion Summary |
|---|---:|---:|---|---|
| Addiction / Compulsion | disadvantage | 3 | Full | Unmet condition applies -30% to rolls. |
| Allergy | disadvantage | 3 | Partial | Exposure applies major CON/physical penalties; severe rank tracks hazard pressure. |
| Ambidextrous | advantage | 1 | Full | Off-hand combat penalty suppression when condition is set. |
| Anger | disadvantage | 1 | Partial | Attacked state enforces behavioral pressure and tactical focus penalty. |
| Anxiety | disadvantage | 3 | Full | COOL and fear SAN penalties (-30%). |
| Arrogant | disadvantage | 1 | Full | Social penalty vs equal/lower SCL contexts. |
| Attractive | advantage | 2 | Full | Appearance-social bonus (+20%). |
| Chicken | disadvantage | 1 | Partial | COOL cap reduction and optional first-combat COOL gate. |
| Contact | advantage | 4 | Full | Once/session Bureaucracy leverage when invoked. |
| Debt | disadvantage | 3 | Partial | Economic pressure tracked; rank 3 adds Bureaucracy audit strain. |
| Depression | disadvantage | 3 | Full | Communication penalty (-30%); additional SAN-linked pressure. |
| Drug Addict | disadvantage | 3 | Full | Withdrawal penalties to physical, COOL, and SAN rolls. |
| Enemy | disadvantage | 4 | Narrative | Narrative antagonist trigger; no flat roll modifier by default. |
| Exceedingly Cool | advantage | 1 | Full | COOL cap boost and once/session auto-pass hook. |
| Good Hearing | advantage | 2 | Full | Listen bonus (+20%). |
| Good Housing | advantage | 2 | Full | Downtime recovery bonus. |
| Good Vision | advantage | 2 | Full | Spot Hidden bonus (+20%). |
| Illness | disadvantage | 3 | Partial | Scoped penalties when active; severe rank retains long-term characteristic pressure. |
| Natural Aptitude: Skill | advantage | 3 | Full | Once/session failed-skill reroll automation. |
| Natural Aptitude: Stat | advantage | 1 | Full | Selected characteristic roll boost for max+1 equivalent. |
| Pacifist | disadvantage | 1 | Full | Combat attacks require COOL pass and initiative priority is forced last. |
| Phobia | disadvantage | 3 | Partial | Exposure applies COOL penalties; severe rank flags immediate SAN pressure. |
| Poor Hearing | disadvantage | 2 | Full | Listen penalty (-20%). |
| Poor Housing | disadvantage | 2 | Full | Downtime recovery penalty. |
| Poor Vision | disadvantage | 2 | Full | Spot/ranged-vision penalties (-20% in scoped cases). |
| Psychosis | disadvantage | 3 | Partial | Active scoped instability penalties with rank scaling. |
| Savings | advantage | 3 | Narrative | Economic reserve trait tracked narratively (credits policy). |
| Sterile | disadvantage | 1 | Narrative | Narrative-only biological consequence. |
| Unattractive | disadvantage | 2 | Full | Appearance-social penalty (-20%). |

## Notes
- `Full`: direct BRP modifier/behavior implemented in roll, COOL/SAN, or initiative pipeline.
- `Partial`: core modifier path implemented, with remaining narrative or GM-triggered context flags.
- `Narrative`: tracked for rules fidelity but intentionally not auto-modifying rolls by default.

## Actor Sheet
Use the character `TRAITS` tab to:
- drag/drop SLA traits to the actor
- inspect rank/type/automation status
- view BRP effect summary
- run validator checks
- edit runtime trait conditions (GM)
