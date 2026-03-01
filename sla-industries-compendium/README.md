# sla-industries-compendium

Companion module for `sla-industries-brp` with:

- SLA seed JSON content (`sla-data/*.json`)
- SLA compendium packs
- SLA artwork (`assets/SLA_Assets`)

## Install

- Module ID: `sla-industries-compendium`
- Target system: `sla-industries-brp`
- Manifest:
  `https://raw.githubusercontent.com/slaguru666/sla_industries_brp/main/sla-industries-compendium/module.json`

## Import Content Into A New World

After installing the system and module, run this in a GM script macro:

```js
const { SLASeedImporter } = await import("/systems/sla-industries-brp/module/apps/sla-seed-importer.mjs");
await SLASeedImporter.buildDraft2({ overwrite: false, syncCompendia: true });
```

This seeds skills, species, training packages, ebb abilities, equipment, drugs, and related links using module data/artwork paths.

## ORC Notice

BRP source material remains subject to Chaosium's ORC licensing terms where applicable.
