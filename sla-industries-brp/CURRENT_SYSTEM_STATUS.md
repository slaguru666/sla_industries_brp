# SLA Industries BRP - Current System Status

Date: 2026-02-21

## Overview

This system is a Foundry VTT v13 draft fork of BRP for SLA Industries.

- System ID: `sla-industries-brp`
- Version: `13.1.52`
- Companion module: `sla-industries-compendium`
- Core model: BRP base mechanics with SLA-first defaults and SLA-specific subsystems layered in.

## Core Architecture

Main runtime entrypoints:

- `module/hooks/init.mjs`: class registration, settings, sheets, API exposure
- `module/brp.mjs`: runtime hooks and startup behavior
- `module/combat/combat.mjs`: combat document behavior
- `module/combat/combat-tracker.mjs`: custom tracker template wrapper

Primary custom documents:

- `BRPActor` (`module/actor/actor.mjs`)
- `BRPItem` (`module/item/item.mjs`)
- `BRPCombat` (`module/combat/combat.mjs`)
- `BRPCombatTracker` (`module/combat/combat-tracker.mjs`)

## Current SLA Implementations

### Data model

`template.json` includes SLA character data:

- `system.sla.scl`
- `system.sla.bpnType`
- `system.sla.bpnRef`
- `system.sla.department`
- `system.sla.sponsor`
- `system.sla.mediaRating`
- `system.sla.credits`
- `system.sla.campaignNotes`

Skill pool creation scaffolding is present:

- `system.skillPools.creationCap`
- `system.skillPools.professional.*`
- `system.skillPools.general.*`

### Character sheet and UX

Implemented in `templates/actor/character-sheet.html` and `module/actor/sheets/character.mjs`:

- SLA branding and labels
- Account Credits field
- Drug status strip and drug actions
- EBB actions
- SAN and COOL actions
- Skill pool display (professional/general/cap)
- SLA-only item filtering on drops

### SLA subsystem APIs (exposed on `game.brp`)

- `SLASeedImporter`
- `SLACharacterGenerator`
- `SLASkillPoints`
- `SLAAmmoCatalog`
- `SLAAmmoTracker`
- `SLADrugSystem`
- `SLAEbbSystem`
- `SLAMentalSystem`
- `SLADamageResolver`

### Importing and content pipeline

The system importer reads canonical seed JSON from the companion module:

- `modules/sla-industries-compendium/sla-data/skills.json`
- `modules/sla-industries-compendium/sla-data/species.json`
- `modules/sla-industries-compendium/sla-data/training-packages.json`
- `modules/sla-industries-compendium/sla-data/ebb-abilities.json`
- `modules/sla-industries-compendium/sla-data/equipment.json`

Importer supports:

- world folder seeding
- training package linking
- compendium sync
- SLA-only enforcement mode
- audit output for missing links

### Current world defaults (SLA-oriented)

From settings registrations:

- HPL: enabled
- SAN: enabled
- Fatigue: enabled
- Resource 5 (COOL): enabled
- Power points relabeled to Flux (`Flux` / `FLX`)
- Psychic enabled and relabeled to EBB
- Magic/Mutation/Sorcery/Super disabled by default
- Wealth label switched to Credits
- Combat ammo tracking defaults enabled

## Known Gaps / Work In Progress

- Initiative currently uses BRP formula settings by default (`initStat` + `initMod`), not SLA Escalation Initiative.
- Many sheets remain on legacy Application V1 patterns (existing TODO comments for V2 migration).
- Some behavior is intentionally narrative rather than fully state-enforced (by design in current draft).

## Readiness

The system is ready for targeted feature work.

Current priority started in this pass:

- Add Escalation Initiative (normal/risk flow, Cool-triggered freeze outcomes, tie-break handling).

## Latest UI/Playflow Pass

Applied after baseline review:

- Character sheet quick initiative buttons beside portrait:
  - `DEX INIT`
  - `INT INIT`
  - `SHIFT` on either button performs a Risk roll
- Top title line switched to `SLA INDUSTRIES` wordmark styling (removed "BRP Draft" text treatment).
- Characteristics roll affordance increased (stronger clickable target styling).
- Skill roll rows now include a dice icon indicator.
- Personal details section typography increased and spacing tightened.
- Portrait recentered and enlarged.
- Fatigue removed from character and NPC front-sheet gameplay UI and hidden from optional rules form.

## Latest Rules Engine Pass

- Added SLA BRP roll-edge mechanic to standard checks:
  - `Advantage`: roll `1D100`, reroll only tens die, keep lowest
  - `Normal`: roll `1D100`
  - `Disadvantage`: roll `1D100`, reroll only tens die, keep highest
- Difficulty selection now uses edge modes instead of multiplier labels in the standard check dialog.
- Flat modifier remains in place and applies normally.
- BRP success tiers (critical/special/success/fail/fumble) remain unchanged and are resolved from the kept die.
- Legacy difficulty values map safely to new edge modes for backward compatibility with older cards/macros.
- SAN and COOL prompts now include explicit edge selection (`Advantage`, `Normal`, `Disadvantage`) and apply the same kept-die behavior.
  - Added built-in `SLABPNToolkit`:
  - Journal sidebar `BPN Toolkit` button for GMs.
  - Journal sidebar `Equipment` button for direct access to the SLA general equipment catalogue.
  - Items sidebar `Seed SLA Equipment` button to create drag/drop gear items directly in-world.
  - One-click setup of `BPN FORMAT & COLOUR CODES`, `TEMPLATE – BPN`, `BPN RANDOM DATA – EXTENDED`, and `BPN TOOLKIT – COMPLETE` journals.
  - Added `SLA GENERAL EQUIPMENT CATALOGUE` journal section split into communications, surveillance, medical, exploration, tools, personal gear, specialist tech, lifestyle, maintenance, and non-lethal security.
  - Added starting loadout packages, availability-by-SCL guidance, and maintenance/condition rules to the equipment section.
  - 1st Edition complete colour code reference: Blue/Yellow/Green/White/Grey/Silver/Jade/Red/Black/Platinum plus optional Orange supplement entry.
  - Guided BPN creation dialog now uses expanded d20/d12 tables and includes reward flow support (payment type, CBS tier, SCL tier, media roll).
  - Extended random layers: colour mission hooks, contacts, civilian factions, opposition attitudes, atmosphere, local twists, extra objectives, and escalation events.
  - Built-in Table 10 reward calculator logic for generated BPNs (Per Operative/Per Squad CBS + SCL increase + media outcome).
  - Journal rendering now uses a dedicated SLA cyberpunk dossier theme (`.sla-bpn-dossier`) with neon accents, dark panels, and compact data grids.
  - Quick random BPN generation that creates player-facing briefing + GM-only debrief journals.
  - Added equipment item seeding pipeline for all catalogue entries:
    - Creates `gear` items under `SLA General Equipment` folders by category.
    - Adds stable BRP ID flags to avoid duplicate reseeds.
    - Supports update mode (`overwrite`) for refreshing existing seeded entries.
  - Added a searchable in-world rulebook journal for players and GMs:
    - Journal name: `SLA RULEBOOK – PLAYERS & GMS`.
    - Auto-created/synced by GM on world ready.
    - Split into multi-page sections for sidebar/page search.
    - Default permission set to `Observer` so all players can access it.
    - Added `Rulebook` button to Journal sidebar (visible to all users).
  - Added a searchable in-world Vehicles & Chases journal for players and GMs:
    - Journal name: `SLA VEHICLES & CHASES – PLAYERS & GMS`.
    - Source markdown: `SLA_VEHICLES_AND_CHASES.md`.
    - Auto-created/synced by GM on world ready.
    - Default permission set to `Observer` for full player access.
    - Added `Vehicles & Chases` button to Journal sidebar (visible to all users).
  - Added `Chase Helper` button to Journal sidebar (visible to all users):
    - Opens `SLA Chase Round Assistant` dialog.
    - Resolves opposed chase rolls using Edge (Advantage/Normal/Disadvantage).
    - Applies approach-based range-band movement with optional 2-step surge on Special/Critical wins.
    - Posts a structured chase-round summary to chat (targets, modifiers, kept dice, result tiers, and new range band).
  - Added Wounds/Death/Healing rules integration:
    - Rulebook foundation extended with a dedicated chapter for 0-HP CON saves, bleed-out, first aid, serious injuries, and recovery.
    - Journal sidebar `Wound Helper` button (visible to all users).
    - Added `SLA Wound Crisis Assistant`:
      - Resolves HP drop + immediate CON save at Edge.
      - Applies outcome states (Down but Alive, Dying, Dead).
      - Tracks bleed-out rounds from CON score.
      - Optional first aid resolution with kit profiles and healing rolls.
      - Optional serious injury d6 roll with long-term consequences.
      - Can write state to actor and post full trauma summary to chat.
  - Added full NPC/adversary system layer:
    - Source chapter file: `SLA_NPCS_AND_ADVERSARIES.md`.
    - Searchable player-facing NPC dossier journal:
      - Journal name: `SLA NPCS & ADVERSARIES – PLAYERS & GMS`.
      - Auto-created/synced by GM on world ready.
      - Default permission set to `Observer`.
      - Journal sidebar `NPC Guide` button (visible to all users).
    - Added seeded adversary actor pipeline:
      - Actor sidebar `Seed NPC Adversaries` button.
      - Creates tiered archetype actors under `SLA NPC Adversaries` folders.
      - Seeded set: Downtown Ganger, Basic Civilian, Shiver Patrol Officer, DarkNight Cell Operative, Cloak Division Agent, Thresher Powersuit Pilot, Carrien Hunter, Manchine.
      - Supports reseed update mode (`overwrite`) through toolkit API.
