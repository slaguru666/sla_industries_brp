# SLA Seed Data (Draft 2)

This folder contains source JSON for SLA-specific compendium generation.

## Files
- `skills.json`: SLA-specific skill definitions and categories
- `species.json`: race templates and characteristic formulas
- `training-packages.json`: training package definitions and baseline skills
- `ebb-abilities.json`: SLA Ebb psychic ability seeds
- `equipment.json`: SLA weapon/armour baseline entries and package loadouts

## Purpose
These are canonical seed inputs for the next pass where we generate/update Foundry compendium documents in `sla-industries-compendium` using a deterministic importer.

## Draft 2 Commands
In Foundry (GM user), run in console:

```js
await game.brp.SLASeedImporter.importAll({ overwrite: false })
```

Creates/updates world items in:
- `SLA Skills` (Item type `skill`)
- `SLA Species` (Item type `culture`)
- `SLA Training Packages` (Item type `profession`)

For full Draft 2 pass (Ebb, equipment, package linking, compendium sync):

```js
await game.brp.SLASeedImporter.buildDraft2({ overwrite: false, syncCompendia: true })
```

Character generator workflow:

```js
await game.brp.SLACharacterGenerator.createCharacter({
  name: "Operative One",
  species: "Human",
  packageName: null, // auto from species starterPackage
  rollCharacteristics: true,
  assignLoadout: true
})
```
