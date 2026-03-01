# SLA Industries BRP
## Technical Installation and Transfer Guide

Date: 2026-02-23  
System ID: `sla-industries-brp`  
Companion Module: `sla-industries-compendium`  
System Version: `13.1.52`  
Foundry Compatibility: v13 (verified `13.350`)

## 1. Purpose
This guide documents how to install, transfer, validate, and maintain the current SLA Industries BRP system build between Foundry environments.

This system is not standalone content-only. It relies on:
- System code: `systems/sla-industries-brp`
- Seed/content module: `modules/sla-industries-compendium`

## 2. What Has Been Created
Current implementation includes:
- SLA-focused BRP fork for Foundry v13.
- SLA actor-sheet UI pass:
  - SLA wordmark styling.
  - tighter personal panel layout.
  - improved roll affordances for characteristics and skills.
  - portrait/initiative side layout updates.
  - fatigue removed from front-sheet play UI.
- Escalation Initiative support:
  - DEX/INT initiative actions.
  - risk roll support and COOL-trigger workflow.
- Advantage/Disadvantage edge system:
  - `Advantage`: roll `1D100`, then reroll only the tens die and keep the better result.
  - `Disadvantage`: roll `1D100`, then reroll only the tens die and keep the worse result.
  - integrated across standard checks and SAN/COOL prompts.
- Enhanced chat output for checks:
  - explicit edge mode shown.
  - edge roll details (dice and kept value).
  - target breakdown (base/manual/SLA mods/final target).
- BPN Toolkit:
  - journal tooling and random generators.
  - color tables, mission tables, rewards, solo procedures.
  - cyberpunk dossier visual styling.
- Equipment system expansion:
  - full equipment catalogue journal.
  - one-click world seeding of drag/drop `gear` items.
  - item folder structure and duplicate-safe BRP ID flags.
- SLA subsystem APIs exposed on `game.brp`:
  - `SLASeedImporter`, `SLACharacterGenerator`, `SLASkillPoints`
  - `SLAAmmoCatalog`, `SLAAmmoTracker`
  - `SLADrugSystem`, `SLAEbbSystem`, `SLAMentalSystem`
  - `SLADamageResolver`, `SLAEscalationInitiative`, `SLABPNToolkit`

## 3. Required Directories
On target Foundry Data path:
- `Data/systems/sla-industries-brp`
- `Data/modules/sla-industries-compendium`

## 4. Transfer Procedure (Recommended)
1. Stop Foundry on the target machine.
2. Back up target `Data/systems/sla-industries-brp` and `Data/modules/sla-industries-compendium` if they already exist.
3. Extract transfer bundle so it writes into target `Data/`.
4. Start Foundry.
5. In the world:
  - enable system `SLA Industries BRP (Draft)`.
  - enable module `sla-industries-compendium`.
6. Open Journal sidebar:
  - run `Create BPN` / `BPN Toolkit` as needed to ensure BPN journals.
7. Open Items sidebar:
  - run `Seed SLA Equipment` to populate drag/drop equipment items.

## 5. Post-Transfer Validation Checklist
Run these checks in a test world:
- System loads without startup errors.
- Character sheet opens and renders SLA title/header correctly.
- Skill roll dialog shows edge selector and tactical modifier.
- Chat card shows:
  - edge label (Advantage/Normal/Disadvantage),
  - roll detail (kept die logic),
  - target breakdown line.
- Initiative buttons appear near portrait (`DEX INIT`, `INT INIT`).
- BPN tools visible in Journal sidebar.
- Equipment seeding button visible in Items sidebar.
- Seeded equipment can be drag/dropped to actor sheets.

## 6. Content Ownership and Scope Notes
- System folder transfer includes rules/UI/code and templates.
- Companion module transfer includes source seed JSON and module assets.
- World-specific journals/items/actors/scenes are world data and are not part of system folder backup unless world folder is separately copied.

## 7. If You Also Need World Data
For complete campaign migration, additionally copy:
- `Data/worlds/<your-world-id>`

Without world copy, seeded journals/items can be recreated by toolkit actions, but your custom world-created records will not transfer.

## 8. Known Implementation Notes
- Rules are SLA-focused BRP and still evolving.
- Some features are narrative-first by design rather than strict state enforcement.
- Legacy BRP internals are still present beneath SLA overlays in some flows.

## 9. Recovery / Rollback
To roll back:
1. Stop Foundry.
2. Replace system and module directories with previous backups.
3. Restart Foundry.

## 10. Suggested Versioning Practice
For each major change pass:
- create timestamped backup archive.
- update `CURRENT_SYSTEM_STATUS.md`.
- record changed files and intended behavior.
- validate in a scratch world before campaign world use.
