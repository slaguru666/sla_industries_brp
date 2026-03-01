# SLA Industries BRP (Draft)

This is a draft system fork for Foundry VTT based on the BRP system, configured for a SLA Industries conversion workflow.

## Notes
- System ID: `sla-industries-brp`
- Intended companion module: `sla-industries-compendium`
- This draft keeps BRP mechanics as the base and applies SLA-first defaults (Flux/Ebb labels, SAN/Hit Locations/Fatigue/COOL enabled by default).

## Transfer Backup (2026-02-18)
Backup archives created for migration/testing:
- `/Users/timevans/FoundryVTT/Backups/sla-industries-brp-system-20260218-002446.tar.gz`
- `/Users/timevans/FoundryVTT/Backups/sla-industries-compendium-module-20260218-002446.tar.gz`
- `/Users/timevans/FoundryVTT/Backups/sla-industries-brp-transfer-bundle-20260218-002446.tar.gz`

## Transfer Backup (2026-02-23)
Latest transfer set (system + module + bundle):
- `/Users/timevans/FoundryVTT/Backups/sla-industries-brp-system-20260223-090401.tar.gz`
- `/Users/timevans/FoundryVTT/Backups/sla-industries-compendium-module-20260223-090401.tar.gz`
- `/Users/timevans/FoundryVTT/Backups/sla-industries-brp-transfer-bundle-20260223-090401.tar.gz`
- `/Users/timevans/FoundryVTT/Backups/sla-industries-brp-transfer-bundle-20260223-090401.zip`
- Manifest/checksums:
  - `/Users/timevans/FoundryVTT/Backups/sla-industries-brp-transfer-20260223-090401/BACKUP_MANIFEST.md`
  - `/Users/timevans/FoundryVTT/Backups/sla-industries-brp-transfer-20260223-090401/SHA256SUMS.txt`

Restore under Foundry Data:
- `systems/sla-industries-brp`
- `modules/sla-industries-compendium`

## Documentation
- Technical installation/transfer:
  - `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/SLA_TECHNICAL_INSTALL_TRANSFER_GUIDE.md`
- Rules/play reference (expanded, with play + gear examples):
  - `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/SLA_RULES_OF_PLAY_REFERENCE.md`
- Full player+GM rulebook foundation (module-ready living document):
  - `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/SLA_RULEBOOK_FOUNDATION.md`
- Vehicles & chases chapter source:
  - `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/SLA_VEHICLES_AND_CHASES.md`
- NPCs and adversaries chapter source:
  - `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/SLA_NPCS_AND_ADVERSARIES.md`
- Searchable in-world Journal rulebook:
  - `SLA RULEBOOK – PLAYERS & GMS` (auto-synced from foundation markdown by GM on world load)
- Searchable in-world Vehicles & Chases journal:
  - `SLA VEHICLES & CHASES – PLAYERS & GMS` (auto-synced from vehicles/chases markdown by GM on world load)
- Searchable in-world NPC guide journal:
  - `SLA NPCS & ADVERSARIES – PLAYERS & GMS` (auto-synced from NPC/adversary markdown by GM on world load)
- Chase round play aid:
  - Journal sidebar `Chase Helper` button (all users) opens an opposed roll assistant with chat output.
- Wounds / death / healing integration:
  - Rulebook chapter included in `SLA_RULEBOOK_FOUNDATION.md` (0-HP CON save model).
  - Journal sidebar `Wound Helper` button (all users) opens the trauma resolver assistant.
- NPC/adversary play aids:
  - Journal sidebar `NPC Guide` button (all users).
  - Actor sidebar `Seed NPC Adversaries` button (GM) seeds tiered SLA NPC archetypes.

## Visual Direction
The actor sheet, dialogs, and chat cards are tuned for an SLA red-forward theme with higher-contrast readability:
- Title font: `Cinzel`
- Body font: `Cormorant Garamond`
- UI font: `Barlow Condensed`

## ORC Notice
BRP source material remains subject to Chaosium's ORC licensing terms where applicable.
