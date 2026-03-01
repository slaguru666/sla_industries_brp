# SLA BRP Foundry Packages

Installable Foundry VTT package repo for:

- System: `sla-industries-brp`
- World: `sla-brp`

## Install URLs

- System manifest:
  `https://raw.githubusercontent.com/slaguru666/sla_industries_brp/main/sla-industries-brp/system.json`
- World manifest:
  `https://raw.githubusercontent.com/slaguru666/sla_industries_brp/main/sla-brp/world.json`

## Important Install Order

1. Install **System** `sla-industries-brp` first.
2. Install **World** `sla-brp` second.

If the system is not installed first, Foundry marks the world unavailable.

## Repo Layout

- `sla-industries-brp/` - system content (`system.json`)
- `sla-brp/` - world content (`world.json`)
- `scripts/build-release.sh` - builds both release zips into `dist/`

## Release Steps

1. Update versions in:
   - `sla-industries-brp/system.json`
   - `sla-brp/world.json`
2. Build zips:

   ```bash
   ./scripts/build-release.sh
   ```

3. Create a GitHub release and attach:
   - `dist/sla-industries-brp.zip`
   - `dist/sla-brp.zip`

## Notes

- World `sla-brp` depends on system ID `sla-industries-brp`.
- Download URLs use GitHub `releases/latest/download/...`, so the latest release must include both zip assets.
