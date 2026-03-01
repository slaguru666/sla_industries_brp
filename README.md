# SLA BRP Foundry World

Installable Foundry VTT world package for `sla-brp`.

## Repo Layout

- `sla-brp/` - The world content directory (must contain `world.json`).
- `scripts/build-release.sh` - Builds `dist/sla-brp.zip` for Foundry install.

## One-time Setup

1. Create a GitHub repo and push this folder.
2. Update these fields in `sla-brp/world.json`:
   - `manifest`
   - `download`
   - `url`

Use:

- `manifest`: `https://raw.githubusercontent.com/slaguru666/sla_industries_brp/main/sla-brp/world.json`
- `download`: `https://github.com/slaguru666/sla_industries_brp/releases/latest/download/sla-brp.zip`
- `url`: `https://github.com/slaguru666/sla_industries_brp`

## Release Steps

1. Update `sla-brp/world.json` `version`.
2. Build zip locally:

   ```bash
   ./scripts/build-release.sh
   ```

3. Create a GitHub release and upload `dist/sla-brp.zip` as an asset.
   - If you publish a GitHub release event, the included workflow can auto-attach `dist/sla-brp.zip`.

## Install in Foundry

In Foundry setup screen:

1. Open **Game Worlds**.
2. Click **Install World**.
3. Paste manifest URL:

   `https://raw.githubusercontent.com/slaguru666/sla_industries_brp/main/sla-brp/world.json`

4. Install.

## Notes

- This world requires system ID: `sla-industries-brp`.
- Keep world assets and data inside `sla-brp/` so the zip stays installable.
