# SLA BRP Foundry Packages

Installable Foundry VTT package repo for:

- System: `sla-industries-brp`
- Module: `sla-industries-compendium` (companion content and artwork)
- World: `sla-brp`

## Install URLs

- System manifest:
  `https://raw.githubusercontent.com/slaguru666/sla_industries_brp/main/sla-industries-brp/system.json`
- Module manifest:
  `https://raw.githubusercontent.com/slaguru666/sla_industries_brp/main/sla-industries-compendium/module.json`
- World manifest:
  `https://raw.githubusercontent.com/slaguru666/sla_industries_brp/main/sla-brp/world.json`

## Important Install Order

1. Install **System** `sla-industries-brp` first.
2. Install **Module** `sla-industries-compendium` second.
3. Install **World** `sla-brp` optionally (or create a new world with the system).

If the system is not installed first, Foundry marks the world unavailable.

## Populate A Fresh World

In a new `sla-industries-brp` world with the companion module enabled:

1. Open the **Compendium** tab.
2. Use either:
   - the new download button in the Compendium header, or
   - right-click any `sla-industries-compendium` pack and choose **Import SLA Companion Content**.
3. Choose **Merge** or **Overwrite** when prompted.

No script macro is required.

Optional fallback (GM script macro):

```js
const { SLASeedImporter } = await import("/systems/sla-industries-brp/module/apps/sla-seed-importer.mjs");
await SLASeedImporter.buildDraft2({ overwrite: false, syncCompendia: true });
```

## Repo Layout

- `sla-industries-brp/` - system content (`system.json`)
- `sla-industries-compendium/` - companion module content (`module.json`, `sla-data`, compendium packs, artwork)
- `sla-brp/` - world content (`world.json`)
- `scripts/build-release.sh` - builds all release zips into `dist/`

## Release Steps

1. Update versions in:
   - `sla-industries-brp/system.json`
   - `sla-industries-compendium/module.json`
   - `sla-brp/world.json`
2. Build zips:

   ```bash
   ./scripts/build-release.sh
   ```

3. Create a GitHub release and attach:
   - `dist/sla-industries-brp.zip`
   - `dist/sla-industries-compendium.zip`
   - `dist/sla-brp.zip`

## Notes

- World `sla-brp` depends on system ID `sla-industries-brp`.
- Companion module contains `sla-data/*.json` plus artwork under `assets/SLA_Assets`.
- Download URLs use GitHub `releases/latest/download/...`, so the latest release must include all three zip assets.
