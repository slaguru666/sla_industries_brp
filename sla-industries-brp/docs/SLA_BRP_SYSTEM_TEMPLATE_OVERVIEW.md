# SLA BRP System Template Overview

Date: 2026-03-02  
System: `sla-industries-brp`  
Companion module: `sla-industries-compendium`  
Foundry target: v13

## 1) Purpose of this document

This is the technical master overview of the current SLA BRP Foundry system, written so it can be used as a baseline template for building another BRP-derived system.

It documents:
- architecture and boot lifecycle
- data model and schema conventions
- subsystem boundaries and key files
- settings/rules toggles
- content seeding and icon sync pipeline
- chat/roll/combat flow
- safety constraints and migration behavior
- how to fork/retarget this codebase into a new BRP system

## 2) System identity and dependency model

## 2.1 Core identity
- System ID: `sla-industries-brp`
- Current version: `13.1.52`
- Manifest file: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/system.json`
- Template schema: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/template.json`

## 2.2 External dependency
This system is designed to pair with module:
- `sla-industries-compendium`

Seed data is pulled from companion module JSON files by the importer.

## 2.3 Runtime entrypoints
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/setup/load.mjs`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/brp.mjs`

## 3) Repository structure (functional map)

- `assets/`
  - system artwork, logos, generated icon packs (skills/weapons/ammo/gear/drugs/traits/species/training/ebb)
- `css/`
  - system visual layer, sheet/dialog/chat styling
- `docs/`
  - technical and rules documentation
- `lang/`
  - localization dictionaries
- `module/`
  - runtime logic (actors, items, rolls, combat, traits, setup, settings, tools)
- `packs/`
  - packaged macros
- `templates/`
  - actor/item/dialog/chat/settings HTML templates
- `template.json`
  - actor/item data schema defaults

## 4) Boot lifecycle and global API surface

## 4.1 Init phase
`module/hooks/init.mjs` sets up:
- `game.brp` API object
- custom document classes:
  - `BRPActor`
  - `BRPItem`
  - `BRPCombat`
  - `BRPCombatTracker`
  - `BRPActiveEffect`
- sheet registration
- handlebars helpers and template preload
- trait hooks registration

## 4.2 Ready phase
`module/brp.mjs` performs SLA startup orchestration:
- compatibility fallback imports into `game.brp`
- world migrations (`SLAMigrations.run()`)
- optional default scene creation for fresh world
- skill seeding and roster sync
- icon synchronization jobs:
  - skills, weapons, EBB, species, training packages, ammo, drugs, general gear
- rulebook/journal auto-ensure for GM

## 4.3 Exposed `game.brp` classes
Current SLA-focused API includes:
- `BRPActor`, `BRPItem`
- `SLASeedImporter`
- `SLACharacterGenerator`
- `SLAAmmoTracker`, `SLAAmmoCatalog`
- `SLADrugSystem`
- `SLAEbbSystem`
- `SLAMentalSystem`
- `SLADamageResolver`
- `SLASkillPoints`
- `SLAEscalationInitiative`
- `SLABPNToolkit`
- `SLADialog`
- `SLARollPipeline`
- `SLAQAHarness`
- `SLARulesConsole`
- `SLAMigrations`
- Trait stack:
  - `SLATraitDefinitions`
  - `SLATraitEngine`
  - `SLATraitValidator`
  - `SLATraitUI`
  - `SLATraitHooks`

## 5) Data model and schema conventions

## 5.1 Actor types
Defined in `template.json`:
- `character`
- `npc`

## 5.2 SLA character extension (`system.sla.*`)
Notable fields:
- `scl`
- `lad` (Life After Death)
- `bpnType`, `bpnRef`
- `department`, `sponsor`, `mediaRating`
- `credits`
- `campaignNotes`

## 5.3 Core resources
- Hit Points (`system.health`)
- Flux (`system.power`, relabeled PP)
- Sanity (`system.sanity`)
- Cool (`system.res5`, single-value roll button)

## 5.4 Skill pool model
Includes creation scaffolding for capped generation pipelines:
- `system.skillPools.creationCap`
- professional/general pools and allocation fields

## 5.5 Item ecosystem
The system uses standard BRP item types plus SLA-specific workflows around:
- `skill`, `weapon`, `armour`, `gear`
- `psychic` (EBB)
- `persTrait` (trait engine)
- other BRP legacy power/social items retained for compatibility

## 5.6 Flag strategy
Two major flag domains:
- `flags.brp.*` (BRPID + legacy BRP integration)
- `flags.sla-industries-brp.*` (SLA modules state)

Trait runtime state example:
- `flags.sla-industries-brp.slaTraits.conditions`
- `flags.sla-industries-brp.slaTraits.session`

## 6) Actor sheet architecture

Primary sheet template:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/templates/actor/character-sheet.html`

Key SLA front-sheet behavior:
- SLA wordmark header and logo treatment
- Personal/Characteristics/Portrait top layout
- LAD checkbox in personal block
- DEX/INT initiative buttons near portrait (SHIFT risk flow)
- resources strip:
  - HP, Flux, Sanity, Cool
- Cool roll is explicit via dedicated button
- drug alert strip with state controls

Primary tabs:
- Skills
- Combat
- Items
- Traits
- Characteristic
- Story
- Effects
- optional power/social/pers tabs based on settings

Traits tab partial:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/templates/actor/parts/actor-traits.html`

## 7) Roll and resolution pipeline

## 7.1 Core check engine
Primary file:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/check.mjs`

Core capabilities:
- CH/SK/CM and related roll types
- edge normalization
- weapon fire-mode bonuses and hit-count mapping
- chat-card generation and update
- cancel-path handling

## 7.2 SLA edge model
Integrated edge modes:
- Normal
- Advantage
- Disadvantage

Current behavior:
- percentile roll + SLA edge handling (including tens re-roll logic where configured)
- final target breakdown output via `SLARollPipeline`

## 7.3 Dialog framework
`SLADialog` helper provides form capture and consistent dialog-handling utilities:
- safer form extraction
- choose/wait helpers

Main roll dialog template:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/templates/dialog/difficulty.html`

## 7.4 Combat and damage
Relevant files:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/combat/combat-roll.mjs`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/combat/sla-damage-resolver.mjs`

Features:
- weapon formula resolution
- ammo context and tag-based damage modifier handling
- dummy target fallback if no token target selected
- per-hit armor/location resolution path
- explicit chat meta for applied damage

## 8) Initiative model

Escalation initiative module:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/combat/sla-escalation-initiative.mjs`

Supported concepts:
- DEX/INT approach
- risk mode trigger
- optional differentiation setting
- foundry combat tracker integration

## 9) Ammo, economy, and fire control

## 9.1 Ammo catalog
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-ammo-catalog.mjs`

Responsibilities:
- calibre registry
- ammo tags: `STD`, `AP`, `HE`, `HEAP`
- cost by calibre/tag
- ammo item seeding
- weapon calibre audit/backfill helpers

## 9.2 Ammo tracker
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-ammo-tracker.mjs`

Responsibilities:
- loaded/reserve handling
- fire mode costs (single/burst/auto)
- auto spend/reload
- ammo-type cycling
- credit deduction and deficit modes

## 9.3 Combat settings tied to ammo
Important settings include:
- `ammoTracking`
- `ammoAutoSpend`
- `ammoNotify`
- `ammoDeficitMode`
- `combatTargetingMode`

## 10) Drug subsystem

File:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-drug-system.mjs`

Capabilities:
- drug definitions and aliases
- lifecycle state: use -> active -> close -> crash -> clear
- expiry queue + automatic resolution
- immediate/deferred effects (HP/SAN/fatigue/modifier sets)
- chat-state reporting
- icon sync and item seeding

## 11) EBB subsystem

File:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-ebb-system.mjs`

Capabilities:
- EBB species gate
- discipline metadata and aliases
- discipline skill candidate matching
- flux-cost tiers and tier prompts
- skill roll + result-level mapping
- offensive effect application through damage resolver
- healing/damage helpers
- active effect registration and expiry
- EBB state chat cards with detailed result lines

## 12) Mental subsystem

File:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-mental-system.mjs`

Responsibilities:
- SAN and Cool workflows
- shaken/panic style status interactions
- integration with roll context and trait/drug modifiers

## 13) Trait engine architecture

Files:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/traits/trait-definitions.mjs`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/traits/trait-engine.mjs`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/traits/trait-validator.mjs`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/traits/trait-ui.mjs`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/traits/trait-hooks.mjs`

Design pattern:
- runtime modifiers are applied dynamically to context
- base skills/characteristics are not destructively rewritten
- trait mod cap enforced (`±40%`)
- rank validation and mutual exclusion checks
- rank-balance reporting on actor Traits tab

Supporting docs:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/docs/SLA_TRAIT_ENGINE_RULES.md`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/docs/SLA_TRAIT_COVERAGE_AUDIT.md`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/docs/SLA_TRAITS_2E_REFERENCE.md`

## 14) Character generation pipeline

File:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-character-generator.mjs`

Supports:
- species application and bonuses
- training package assignment
- skill and loadout ensuring
- optional Pulp SLA rule choice integration
- roster-safe BRPID resolution

## 15) Content seed/import/sync pipeline

File:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-seed-importer.mjs`

Responsibilities:
- import skills/species/training/ebb/equipment
- enforce SLA-only item policy (optional)
- compendium sync and audit
- world folder ensure and safe update mode
- icon mapping + sync for:
  - skills
  - weapons
  - EBB
  - species
  - training packages
  - ammo
  - traits

## 16) BPN/rulebook/NPC/chase/wound toolkit

Main tool file:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-bpn-toolkit.mjs`

Includes:
- BPN creation wizard
- one-click quick random BPN
- searchable rulebook journal generation/sync
- vehicles/chases journal generation/sync
- NPC/adversary journal generation/sync
- extended random tables and mission hooks
- NPC archetype seeding and random adversary generation
- non-combat issue generator
- chase round assistant
- wound crisis assistant
- general equipment catalog seeding + icon sync

## 17) Settings model (world rules surface)

Settings are grouped into menu apps in `/module/settings/`:
- power rules
- optional rules
- dice options
- combat options
- XP options
- NPC options
- character options
- game modifiers
- display options
- BRPID options
- SLA rules panel

High-impact SLA settings:
- `initiativeMode` (`escalation` default)
- `pulpSla` (double-HP style mode for players via creation flow)
- `useSAN`, `useRes5`, `useHPL`
- `showManipulationSkills`, `showSocialSkills`, `showSupernaturalSkills`
- `quickCombat`
- `ammoTracking`, `ammoAutoSpend`
- `economyDebtInterestEnabled`, `economyDebtInterestRate`
- `economyFinancierCutEnabled`, `economyFinancierCutPercent`

## 18) Visual/theme architecture

Primary style file:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/css/brp.css`

Current visual pattern:
- SLA dark/steel base palette with red emphasis lines
- compact industrial panels
- branded sheet and dialog skins
- consistent chat-card framing for combat/initiative/ebb
- icon-driven rows for skills/items

## 19) Migration and compatibility strategy

Migration file:
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/migrations/sla-migrations.mjs`

Compatibility principles currently in codebase:
- additive upgrades preferred over destructive rewrites
- runtime fallback attachment for missing `game.brp` modules
- seeding operations support non-overwrite mode
- legacy BRP structures preserved where needed

## 20) Known technical caveats to account for in forks

- Foundry V1 dialog/application patterns still exist in parts of the stack and should be migrated to V2 over time.
- Some sync operations are heavy and run at GM-ready; if forking for high-scale worlds, consider scheduling/throttling.
- Several subsystems rely on naming/BRPID consistency; rename plans must include deterministic alias maps.

## 21) Reusable template strategy for your next BRP system

Use SLA BRP as a platform, not a copy-paste dump.

## 21.1 Clone baseline
1. Duplicate `sla-industries-brp` directory to new system folder.
2. Rename system ID in `system.json`.
3. Rename namespace keys currently hardcoded as `sla-industries-brp`.
4. Duplicate/update companion data module and seed paths.

## 21.2 Keep these foundational layers
- actor/item/combat document framework
- check/roll/chat pipeline
- dialog helper (`SLADialog` style wrapper)
- seed importer pattern and BRPID strategy
- trait engine scaffold
- toolkit generator architecture (journal + random table composition)

## 21.3 Replace these domain-specific layers
- SLA content labels and terminology (Flux, EBB, BPN, SCL, LAD)
- asset folders and icon maps
- rulebook markdown content and journal titles
- species/training/ability datasets
- setting defaults tuned for target game

## 21.4 Do-not-break invariants during retarget
- Keep roll pipeline signatures stable until all callers are updated.
- Keep actor/item type compatibility with existing templates or migrate both together.
- Preserve fallback behavior for no-target damage unless explicitly changing combat UX.
- Keep non-destructive seeding defaults (`overwrite: false`) for safety.

## 22) Validation checklist for a new derived BRP system

After creating a fork from this template, validate in this order:

1. Boot and schema:
- system loads
- no manifest/schema errors
- actor and item sheets open

2. Core rolling:
- characteristic roll
- skill roll
- combat roll with cancel path
- edge modes (normal/adv/disadv)

3. Combat/damage:
- hit resolution
- damage roll output
- no-target dummy path
- ammo spend/reload

4. Specialized systems:
- mental/SAN/Cool flow
- EBB/power equivalent flow
- trait modifier and validation flow
- drug lifecycle flow (if retained)

5. Tooling:
- seed import
- icon sync
- journal generators
- random generators

6. Migration safety:
- existing actors still open
- no destructive data loss on ready hooks

## 23) Source index (quick links)

- System manifest: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/system.json`
- Schema: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/template.json`
- Init hook: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/hooks/init.mjs`
- Ready/runtime orchestration: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/brp.mjs`
- Actor document: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/actor/actor.mjs`
- Check pipeline: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/check.mjs`
- Damage resolver: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/combat/sla-damage-resolver.mjs`
- Actor sheet template: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/templates/actor/character-sheet.html`
- BPN/toolkit: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-bpn-toolkit.mjs`
- Seed importer: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-seed-importer.mjs`
- Trait engine: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/traits/trait-engine.mjs`
- Technical transfer guide: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/SLA_TECHNICAL_INSTALL_TRANSFER_GUIDE.md`
- Current status snapshot: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/CURRENT_SYSTEM_STATUS.md`

## 24) Recommended next template artifact

To fully operationalize this as a reusable BRP platform, add a second document:
- `NEW_SYSTEM_PORTING_CHECKLIST.md`

That checklist should include exact search/replace keys, renamed namespaces, required seed JSON contracts, and per-module acceptance tests for the new setting.
