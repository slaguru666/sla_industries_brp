# SLA Industries BRP Draft Notes

## Source Material Reviewed
- `/Users/timevans/Downloads/SLA_BRP.txt`
- `/Users/timevans/Downloads/880025437-Basic-Roleplaying-Universal-Game-Engine-Quickstart.pdf` (50 pages, text extracted)

## Foundry Research Summary
- Base system analyzed: `/Users/timevans/FoundryVTT/data/systems/brp`
- UGE module analyzed: `/Users/timevans/FoundryVTT/data/modules/basic-role-playing-uge-compendium`
- UGE packs are Foundry LevelDB pack folders (not plain JSON files), so direct text editing of entries is not the right workflow.

## Draft 1 Implemented
- New cloned system created:
  - `/Users/timevans/FoundryVTT/data/systems/sla-industries-brp`
- New cloned compendium module created:
  - `/Users/timevans/FoundryVTT/data/modules/sla-industries-compendium`
- System manifest updated:
  - `id` set to `sla-industries-brp`
  - title set to `SLA Industries BRP (Draft)`
  - internal system references point to `sla-industries-brp`
- Compendium module manifest updated:
  - `id` set to `sla-industries-compendium`
  - title set to `SLA Industries Compendium (Draft)`
  - all pack `system` values set to `sla-industries-brp`
  - `relationships.systems[0].id` set to `sla-industries-brp`
- Internal hardcoded paths updated:
  - all `systems/brp/...` template/asset paths changed to `systems/sla-industries-brp/...`
- Settings namespace isolated:
  - all `game.settings.*('brp', ...)` changed to `game.settings.*('sla-industries-brp', ...)`
- Sheet registration fixed for cloned system:
  - all `registerSheet('brp', ...)` updated to `registerSheet('sla-industries-brp', ...)`

## SLA Default World Settings Applied (Draft)
Based on your SLA conversion document, default values were set to:
- Optional rules:
  - `useHPL = true`
  - `useSAN = true`
  - `useFP = true`
  - `useRes5 = true`
  - `skillBonus = 1`
- Resource labels:
  - `ppLabelLong = Flux`
  - `ppLabelShort = FLX`
  - `fpLabelLong = Fatigue`
  - `fpLabelShort = FP`
  - `res5LabelLong = COOL Rating`
  - `res5LabelShort = COOL`
- Power categories:
  - `magic = false`
  - `mutation = false`
  - `psychic = true`
  - `psychicLabel = Ebb`
  - `sorcery = false`
  - `super = false`
- Character sheet labels:
  - `background1 = Dossier`
  - `background2 = BPN Log`
  - `background3 = Notes`
  - `wealthLabel = Credits`

## Branding Swap Applied
- Setup media, default scene image, and character sheet logo now use SLA-branded assets:
  - `/Users/timevans/FoundryVTT/data/systems/sla-industries-brp/assets/sla-logo-powered_by-solid.svg`
  - `/Users/timevans/FoundryVTT/data/systems/sla-industries-brp/assets/sla-logo-powered_by-02.svg`
  - `/Users/timevans/FoundryVTT/data/systems/sla-industries-brp/assets/sla-char-sheet-logo.svg`
- BRP-branded readmes replaced with draft SLA readmes in:
  - `/Users/timevans/FoundryVTT/data/systems/sla-industries-brp/Readme.md`
  - `/Users/timevans/FoundryVTT/data/modules/sla-industries-compendium/README.md`

## Draft 2 (Current)
- Added SLA operation metadata fields to actor data model:
  - `system.sla.scl`
  - `system.sla.bpnType`
  - `system.sla.bpnRef`
  - `system.sla.department`
  - `system.sla.sponsor`
  - `system.sla.mediaRating`
  - `system.sla.campaignNotes`
- Added SLA Operations UI block to character background tab:
  - `/Users/timevans/FoundryVTT/data/systems/sla-industries-brp/templates/actor/parts/actor-background.html`
  - `/Users/timevans/FoundryVTT/data/systems/sla-industries-brp/css/brp.css`
- Added compendium seed data files for upcoming automated import:
  - `/Users/timevans/FoundryVTT/data/modules/sla-industries-compendium/sla-data/species.json`
  - `/Users/timevans/FoundryVTT/data/modules/sla-industries-compendium/sla-data/training-packages.json`
  - `/Users/timevans/FoundryVTT/data/modules/sla-industries-compendium/sla-data/README.md`
- Added importer utility exposed on `game.brp`:
  - `/Users/timevans/FoundryVTT/data/systems/sla-industries-brp/module/apps/sla-seed-importer.mjs`
  - usage: `await game.brp.SLASeedImporter.importAll({ overwrite: false })`

## Immediate Next Steps (Phase 2)
1. Decide item data strategy for SLA conversions:
   - Import new compendium module for SLA
   - Or keep BRP UGE module and layer SLA content as separate packs
2. Build SLA starter packs:
   - species/racial templates
   - professions (training packages)
   - skills and categories
   - Ebb psychic abilities
   - weapon and armor baseline entries
3. Configure character defaults:
   - default SCL field handling
   - COOL roll macro and usage points
   - starting credits and package templates

## Confirmed Decisions
1. Clone UGE module now: yes.
2. Module ID/name: `sla-industries-compendium`.
3. Mutation default: disabled (still selectable).
4. Skill bonus default: simple.
5. Flux short label: `FLX`.
6. Branding swap: now.
