# NEW SYSTEM PORTING CHECKLIST

Date: 2026-03-02  
Base template: `sla-industries-brp`  
Target: Any new BRP-derived Foundry system

## 1) Scope

Use this checklist when cloning SLA BRP into a new game system while preserving:
- boot/runtime stability
- actor/item compatibility
- roll/combat integrity
- migration safety

This checklist is intentionally conservative.

---

## 2) Preconditions

- Source system folder exists:
  - `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp`
- Foundry is stopped before file operations.
- You have backup space available.

---

## 3) Create backups first (mandatory)

## 3.1 System backup

```bash
cd /Users/timevans/FoundryVTT/Data/systems
tar -czf sla-industries-brp-backup-$(date +%Y%m%d-%H%M%S).tar.gz sla-industries-brp
```

## 3.2 Companion module backup (if used)

```bash
cd /Users/timevans/FoundryVTT/Data/modules
tar -czf sla-industries-compendium-backup-$(date +%Y%m%d-%H%M%S).tar.gz sla-industries-compendium
```

---

## 4) Clone to new system ID

Define your new ID (example): `my-new-brp-system`

```bash
cd /Users/timevans/FoundryVTT/Data/systems
cp -R sla-industries-brp my-new-brp-system
```

---

## 5) High-risk rename map (must be complete)

Perform these renames in this order.

## 5.1 System manifest identity

File:
- `/Users/timevans/FoundryVTT/Data/systems/my-new-brp-system/system.json`

Update:
- `id`
- `title`
- `description`
- `url`/`manifest`/`download` (if present)
- author metadata

## 5.2 Namespace key replacement

Replace all namespace literals:
- `sla-industries-brp` -> `my-new-brp-system`

Critical locations:
- all `game.settings.register(...)`
- all `game.settings.get/set(...)`
- `flags.sla-industries-brp.*`
- socket channel names
- template paths under `systems/sla-industries-brp/...`

## 5.3 System asset path replacement

Replace paths:
- `systems/sla-industries-brp/` -> `systems/my-new-brp-system/`

---

## 6) Safe bulk replace commands

Run from:
- `/Users/timevans/FoundryVTT/Data/systems/my-new-brp-system`

## 6.1 Preview occurrences first

```bash
rg -n "sla-industries-brp|systems/sla-industries-brp|flags\.sla-industries-brp"
```

## 6.2 Apply non-destructive text replacement

```bash
find . -type f \( -name "*.mjs" -o -name "*.json" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) \
  -print0 | xargs -0 sed -i '' \
  -e 's/sla-industries-brp/my-new-brp-system/g' \
  -e 's#systems/sla-industries-brp/#systems/my-new-brp-system/#g'
```

Note (Linux): use `sed -i` instead of `sed -i ''`.

## 6.3 Re-scan

```bash
rg -n "sla-industries-brp|systems/sla-industries-brp|flags\.sla-industries-brp"
```

Target result:
- zero hits, except historical docs you intentionally keep.

---

## 7) Keep vs replace matrix

## 7.1 Keep unchanged initially

- `module/actor/actor.mjs`
- `module/item/item.mjs`
- `module/apps/check.mjs`
- `module/combat/sla-damage-resolver.mjs` (rename later if desired)
- `module/apps/sla-dialog.mjs` (or equivalent)
- `module/setup/*`
- `templates/dialog/*`

Reason: these are core runtime rails.

## 7.2 Replace early for new setting

- Branding and labels in:
  - `templates/actor/character-sheet.html`
  - `css/brp.css`
  - `lang/*.json`
- Data content sources (skills/species/packages) in seeder paths.
- Rulebook markdown files and toolkit journal titles.

## 7.3 Replace later (phase 2)

- Module/class/file names with SLA prefixes (`SLA*`)
- Trait dictionaries specific to SLA lore
- BPN/NPC/EBB-specific generators if not applicable

---

## 8) Companion module strategy

If new game has its own compendium module:

1. Clone module folder:
```bash
cd /Users/timevans/FoundryVTT/Data/modules
cp -R sla-industries-compendium my-new-brp-compendium
```

2. Update module manifest ID/title.
3. Replace importer references in new system:
- `modules/sla-industries-compendium/...` -> `modules/my-new-brp-compendium/...`

4. Validate seed file contracts remain identical or update importer methods accordingly.

---

## 9) Seed data contract checklist

If reusing `SLASeedImporter` architecture, ensure new JSONs provide equivalent fields required by importer methods:

- skills
- species
- training packages
- abilities/powers
- equipment

Validation steps:

```bash
rg -n "loadSeed\(|importSkills\(|importSpecies\(|importTrainingPackages\(|importEbbAbilities\(|importEquipment\(" module/apps/sla-seed-importer.mjs
```

Then verify each referenced key exists in your new seed files.

---

## 10) Settings port checklist

Files:
- `/module/settings/*.mjs`

Required actions:
- Keep setting keys stable until first boot succeeds.
- Only after stable boot, rename setting keys if needed and add migration for old keys.
- Confirm menu registrations still render and save.

Test command:

```bash
rg -n "game\.settings\.register\(|registerMenu\(" module/settings
```

---

## 11) Flags and migration safety

## 11.1 Rule
Do not delete old flags immediately.

## 11.2 Add migration shims
In migration pass:
- map old `flags.sla-industries-brp.*` to new namespace flags
- keep read fallback for legacy flags for at least one release cycle

Migration file entrypoint:
- `/module/migrations/sla-migrations.mjs` (rename later)

---

## 12) Runtime boot smoke test

After first port pass, start Foundry and verify:

1. System appears in setup list.
2. New world boots with no fatal console errors.
3. Character sheet opens.
4. Skill roll dialog opens and cancel works.
5. Combat roll executes and posts result.
6. If targeting disabled: dummy damage path still resolves.
7. Settings menus open and persist values.

---

## 13) Focused regression test matrix

## 13.1 Roll/UI tests
- CH roll
- SK roll
- CM roll
- cancel path from dialog
- edge mode toggles

## 13.2 Resource tests
- HP edit and display
- power/flux workflow
- sanity/cool checks

## 13.3 Item tests
- drag/drop item to actor
- item sheet open/edit
- icon render

## 13.4 Chat card tests
- standard roll card
- combat result card
- damage output clarity

---

## 14) Optional subsystem decoupling plan

If new system does not need SLA-specific subsystems, disable in sequence (one at a time):

1. BPN toolkit (`SLABPNToolkit`) hooks/UI
2. EBB system hooks
3. Drug system hooks
4. Trait engine hooks

After each removal:
- boot
- roll smoke test
- actor sheet open

Do not remove multiple subsystems in one pass.

---

## 15) Renaming SLA-prefixed classes (later, not first pass)

Current prefix appears throughout runtime classes (e.g. `SLA*`).

Recommendation:
- keep SLA-prefixed class names until new system is stable
- then perform mechanical rename with IDE-safe refactor, not ad-hoc grep

Reason: reduces boot break risk from partial imports.

---

## 16) Git workflow for port

Use isolated branch:

```bash
git checkout -b codex/port-my-new-brp-system
```

Commit sequence:
1. clone + manifest + namespace replacement
2. boot fixups
3. branding/theme
4. content seed replacement
5. subsystem adaptation
6. migrations

Avoid large mixed commits.

---

## 17) Acceptance criteria (port complete)

Port is considered complete when:
- new system ID and namespace are consistent
- zero unresolved old system path references
- no fatal startup/runtime errors
- all core roll flows pass smoke tests
- settings + actor sheets + chat cards are stable
- seed import works with new content source
- migration path for legacy data exists

---

## 18) Quick command bundle (copy/paste)

```bash
# 1) clone
cd /Users/timevans/FoundryVTT/Data/systems
cp -R sla-industries-brp my-new-brp-system

# 2) replace namespace + paths
cd /Users/timevans/FoundryVTT/Data/systems/my-new-brp-system
find . -type f \( -name "*.mjs" -o -name "*.json" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) \
  -print0 | xargs -0 sed -i '' \
  -e 's/sla-industries-brp/my-new-brp-system/g' \
  -e 's#systems/sla-industries-brp/#systems/my-new-brp-system/#g'

# 3) verify no stale refs
rg -n "sla-industries-brp|systems/sla-industries-brp|flags\.sla-industries-brp"
```

---

## 19) Related docs

- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/docs/SLA_BRP_SYSTEM_TEMPLATE_OVERVIEW.md`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/SLA_TECHNICAL_INSTALL_TRANSFER_GUIDE.md`
- `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/CURRENT_SYSTEM_STATUS.md`
