# SLA BRP Trait Engine (Automation Map)

## Runtime Modules
- `module/traits/trait-definitions.mjs`
- `module/traits/trait-engine.mjs`
- `module/traits/trait-validator.mjs`
- `module/traits/trait-hooks.mjs`
- `module/traits/trait-ui.mjs`

## Integration Points
- Core roll pipeline: `module/apps/check.mjs`
- SAN/COOL checks: `module/apps/sla-mental-system.mjs`
- Escalation initiative sorting: `module/combat/sla-escalation-initiative.mjs`

## Automation Scope
The trait engine applies dynamic modifiers at roll time only. Base skill values are not mutated.

Hard cap: trait-derived roll modifier contribution is clamped to `±40%`.

## Trait State Flags
Trait condition state is stored on actor flags:
- `flags.sla-industries-brp.slaTraits.conditions`

Session-use state is stored on actor flags:
- `flags.sla-industries-brp.slaTraits.session`

Edit state using:
- `game.brp.SLATraitUI.openStateEditor(actor)`

Validate actor traits using:
- `game.brp.SLATraitValidator.validateActor(actor)`

## Implemented Mechanical Conversions

### Disadvantages
- Addiction/Compulsion: `unmet` => `-10%` per rank to percentile rolls.
- Allergy: `exposed` => `-10/-20%` CON/physical penalties by rank.
- Anger: `attacked` can impose fixation penalty on non-combat actions.
- Anxiety: penalties to COOL and fear-tagged SAN checks.
- Arrogant: social penalty vs equal/lower SCL contexts.
- Chicken: COOL cap pressure (`-10%`) and optional first-combat COOL gate.
- Debt: rank 3 audit pressure on Bureaucracy in monthly audit contexts.
- Depression: Communication penalties (`-10%` per rank), extra if SAN<50 context supplied.
- Drug Addict: `withdrawal` penalties to physical/COOL/SAN.
- Illness: rank-scaled penalty in configured scope while active.
- Pacifist: forces COOL gate before combat attack rolls; initiative always last.
- Phobia: exposure-based COOL penalty; severe SAN pressure marker at rank 3.
- Poor Hearing: Listen penalties by rank.
- Poor Vision: Spot Hidden penalties and optional long-range ranged-combat penalties.
- Psychosis: active rank-scaled penalties in configured scope.
- Unattractive: appearance-based social penalties.

### Advantages
- Ambidextrous: off-hand mitigation when `offHandUsed` condition is set.
- Attractive: appearance-based social bonuses.
- Contact: once/session Bureaucracy boost when invoked.
- Exceedingly Cool: COOL cap pressure (`+10%`) and optional once/session auto-pass.
- Good Hearing: Listen bonuses.
- Good Vision: Spot Hidden bonuses.
- Good Housing: downtime recovery bonuses.
- Natural Aptitude: Skill: once/session failed-skill reroll support.
- Natural Aptitude: Stat: +1 characteristic max equivalent (`+5%`) on selected stat rolls.
- Savings: retained as non-roll economy trait.

## Session Ability Reset
Session-use flags reset on world `ready` for GM via trait hooks.

## Notes
- Narrative-only traits (e.g., Enemy, Sterile) are retained with minimal/no roll automation.
- Trait conditions are intentionally explicit flags to avoid hidden side effects in normal play.
