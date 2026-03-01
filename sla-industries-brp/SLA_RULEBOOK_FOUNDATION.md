# SLA Industries BRP
## Core Rulebook Foundation (Players + GMs)

Document Status: Living Foundation Draft  
Date: 2026-02-23  
System: `sla-industries-brp` (Foundry v13)  
Purpose: This is the long-form baseline rulebook for play, teaching, and in-app reference pages.

---

## How To Use This Rulebook

This document is designed for two audiences:

- **Players**: Learn what to roll, when to roll, and how decisions affect outcomes.
- **GMs**: Run missions, adjudicate edge cases, pace scenes, and keep SLA tone consistent.

It is intentionally structured for Foundry Journal conversion:

- Chapter-level headings can map to Journal pages.
- Sub-headings can map to anchored sections.
- Examples can be extracted into “quick cards” or “teaching popups.”

---

## Rulebook Conventions

### Terms
- `Target`: the percentage you roll against.
- `Kept Roll`: the final die value used after edge mode selection.
- `Edge`: Advantage, Normal, or Disadvantage.

### Priority
When there is a rules conflict at table:
1. Safety/common sense.
2. Mission clarity.
3. Core resolution consistency.
4. Narrative tone of SLA Industries.

### GM Transparency Standard
Players should always be told:
- what they are rolling,
- what edge mode applies,
- what major modifiers changed the target,
- what consequence tier occurred.

---

# Part I: Player Rules

---

## 1. Core Resolution

Most actions use BRP percentile roll-under checks:

1. Set a target percentage.
2. Apply modifiers.
3. Roll d100 (or edge roll).
4. Compare kept roll to final target.

Lower is better.

### Success Tiers
All kept results resolve as one of:
- `Critical`
- `Special`
- `Success`
- `Failure`
- `Fumble`

The exact tier affects narrative quality, damage quality, or follow-up opportunities.

---

## 2. Edge (Advantage / Disadvantage)

This system replaces old multiplier difficulty with edge mode.

### Edge Modes
- `Advantage`: roll `1D100`, reroll only the tens die, keep the lower result.
- `Normal`: roll `1D100`.
- `Disadvantage`: roll `1D100`, reroll only the tens die, keep the higher result.

### Why It Matters
- Advantage pushes toward better tiers.
- Disadvantage pushes toward failure/fumble.
- Core BRP success tiers remain unchanged.

### Quick Example
Skill target `60%`:
- Advantage roll: `74` and `32` -> keep `32` -> Success.
- Disadvantage roll: `41` and `89` -> keep `89` -> Failure.

---

## 3. Building Your Final Target

Your final target can include multiple layers:

- `Base`: starting skill/stat value.
- `Manual`: tactical flat modifier (`+/- %`).
- `SLA Mods`: system overlays (drug, EBB, mental).
- `Final`: the value actually tested.

The chat card presents this breakdown directly so everyone can audit the roll.

### Example
`Base 52% | Manual +10% | SLA Mods -20% | Final 42%`

---

## 4. Standard Skill and Characteristic Checks

When you click a skill or characteristic:

1. Select edge mode.
2. Apply tactical modifier if needed.
3. Confirm roll.
4. Read kept result and tier.

### Player Best Practice
Before confirming, ask:
- “Do we have positional advantage?”
- “Are conditions harming this test?”
- “Did we use tools/gear that should matter?”

That keeps modifiers meaningful and consistent.

---

## 5. Resistance and POW-v-POW

Some checks are direct opposed-force style checks.

Use when:
- resisting force,
- testing one will/power directly against another,
- resolving specific contest prompts.

You provide the opposing value, and target recalculates accordingly.

### Example
You resist a brute-force shove:
- enter opponent equivalent strength value,
- system recalculates target,
- roll and resolve tier.

---

## 6. SAN and COOL

SAN and COOL are integrated into check flows.

### SAN
Used for psychological and existential strain.

### COOL
Used for stress composure, tactical nerve, and emotional control under pressure.

Both support edge modes in prompts.

### Example: COOL under pressure
- Base COOL: `48%`
- Mental penalty: `-15%`
- Final COOL: `33%`
- Roll: `29` -> Success.

### Example: SAN with disadvantage
- SAN target: `55%`
- Disadvantage roll: `22`, `81` -> keep `81` -> Failure.

---

## 7. Initiative (Escalation Intent)

Current sheet supports:
- `DEX INIT`
- `INT INIT`
- `SHIFT + click` for risk behavior where configured.

Core table goal:
- one fast initiative resolution each round,
- minimal bookkeeping,
- meaningful risk pressure.

### Simple Round Start Example
1. Op A: DEX INIT -> 18
2. Op B: INT INIT + risk -> 24
3. Op C: DEX INIT -> 11
4. Order: B, A, C

---

## 8. Combat at Player Level

Combat is a check + consequence loop:

1. Choose attack/action.
2. Set edge from circumstances.
3. Roll and resolve tier.
4. Apply ammo/effect context.
5. Continue action economy.

### Ammo Context
Combat cards can include:
- ammo tag/type,
- ammo effect text,
- ammo credit spend/surcharge where relevant.

### Example
Firearm (Rifle) `70%`, long range in rain:
- Edge: Disadvantage
- Roll: `14`, `83` -> keep `83`
- Result: Failure

---

## 9. Equipment in Play (Player Guide)

Seeded equipment items can be drag-dropped to your actor sheet.

Think of gear as tactical leverage, not decoration.

### Communication Gear
- **Headset Communicator**: keeps squad synced across split lanes.
- **Klippo Multi-Band**: broader comm control and channel flexibility.

### Detection/Investigation Gear
- **Environment Scanner**: hidden threats and scan-based discovery.
- **Forensic Kit**: scene-quality evidence handling.
- **Tactical Binoculars**: long-distance visual dominance.

### Medical Gear
- **BOOPA Medical Kit (Std/Adv)**: field treatment reliability.
- **Trauma Stabiliser**: preserve life until extraction.

### Movement/Breach Gear
- **Grapple Gun** + **Harness**: vertical route control.
- **Breaching Charge**: forced entry solutions.
- **Smoke Grenade**: reposition and extraction support.

### Specialist Gear
- **Ebb Damper**: localized anti-EBB pressure.
- **Magna-Clamp Tracker**: covert track-and-follow operations.

---

## 10. Example of Play: Street Contact to Firefight

### Scene Setup
A WHITE BPN investigation team tracks a suspect through a transit platform.

### Step 1: Search Sweep
- Investigator uses **Environment Scanner (Standard)**.
- GM grants favorable conditions -> Advantage.
- Search target `58%`.
- Roll `66`, `21` -> keep `21` -> Special.
- Outcome: suspect heat signature detected behind kiosk support wall.

### Step 2: Calm the Witness
- Social check under panic crowd noise.
- GM sets Disadvantage due chaos.
- Skill target `47%`.
- Roll `12`, `74` -> keep `74` -> Failure.
- Outcome: witness bolts toward unsafe exit.

### Step 3: Cover Movement
- Support op deploys **Smoke Grenade** between crowd and hostile lane.
- Team crosses open line with reduced direct observation.

### Step 4: Engagement
- Shooter attacks with pistol, target `53%` after all mods.
- Normal roll `29` -> Success.
- Hit resolves through combat card flow.

### Step 5: Post-Contact Evidence
- Team uses **Forensic Kit** + **Camera** for chain evidence.
- BPN debrief includes proof package and media-safe narrative.

---

## 11. Quick Player Reference

When you act, run this checklist:

1. What am I rolling?
2. What is my edge mode?
3. What tactical modifier applies?
4. Did gear/tooling change this?
5. What consequence happens on fail/fumble?

This keeps play fast and transparent.

---

# Part II: GM Rules and Procedures

---

## 12. GM Adjudication Framework

Use this order when deciding edge and modifiers:

1. Positioning and preparation.
2. Environmental pressure.
3. Opposition quality.
4. Time pressure.
5. Visibility/media constraints.

### Assigning Edge
Use edge for scene quality:
- clear advantage -> Advantage,
- ordinary conditions -> Normal,
- materially impaired -> Disadvantage.

### Assigning Flat Modifiers
Use flat mods for specific measurable impacts:
- `+10%` clear tactical help,
- `-10%` moderate interference,
- `-20%` severe but survivable pressure,
- `-30%+` extreme operational degradation.

---

## 13. Running the Mission Loop (BPN-Centric)

Recommended session loop:

1. Briefing issued (BPN page).
2. Infiltration/contact phase.
3. Escalation and conflict phase.
4. Resolution/debrief phase.
5. Rewards/reputation consequences.

### BPN Toolkit Support
Use toolkit for:
- color coding,
- mission tables,
- objective layers,
- escalation events,
- GM debrief pages.

---

## 14. Consequences and Stakes

Set consequence expectations before high-risk rolls.

### Good consequence declarations
- “If this fails, the convoy leaves and you lose pursuit window.”
- “On fumble, the feed goes live with compromised footage.”

Players should know what they are risking.

---

## 15. Media and Corporate Pressure (Tone Layer)

SLA missions are often performative.

GM pressure levers:
- witness optics,
- collateral narratives,
- sponsor-safe behavior,
- command-facing reporting quality.

Keep this layer active without drowning tactical clarity.

---

## 16. Gear Adjudication by Scene Type

### Investigation scenes
Prioritize:
- scanner, forensics, camera, recorder, organizer.

### Tactical entry scenes
Prioritize:
- breaching, smoke/flash, motion tracking, comm discipline.

### Biohazard / occult scenes
Prioritize:
- environment scanners, medical stabilization, EBB dampening support.

### Escort / logistics scenes
Prioritize:
- tracking tools, convoy comms, route planning, rapid first response gear.

---

## 17. Full GM Example: RED BPN Crisis

### Brief
Red BPN: hijacked monorail platform, live media saturation.

### GM Setup
- Primary objective: stop hijackers before train departure.
- Secondary objective: recover encrypted drive from handler.
- Cleanup objective: avoid public footage of forbidden methods.

### Encounter 1: Crowd Control
- Crowd density imposes Disadvantage on broad social command checks.
- Successful use of loud comm routing and visible authority can restore Normal.

### Encounter 2: Access Control
- Locked control room.
- Team uses **Electronic Lockpick/Bypass**.
- GM grants Advantage if data from organizer maps gives door architecture insights.

### Encounter 3: Live Fire Corridor
- Smoke deployed to split hostile LOS.
- One op uses tactical binoculars from elevated angle to call target movement.
- Combat resolves with ammo and damage context.

### Aftermath
- Debrief judges tactical success plus media narrative compliance.
- Reward outcomes include CBS + SCL effect + reputation implications.

---

## 18. Teaching Mode for New Tables

For onboarding sessions:

1. First hour: use only Normal edge.
2. Introduce Advantage/Disadvantage once players understand target flow.
3. Add tactical modifiers only after two to three resolved checks.
4. Introduce SAN/COOL pressure in scene 2 or 3.
5. Add ammo/equipment depth when players are ready.

This staged rollout prevents overload.

---

# Part III: Foundry Journal / Module Structure

---

## 19. Suggested Journal Page Map

Recommended split for module teaching/reference pages:

1. Core Resolution
2. Edge System
3. Target Modifiers
4. Skill and Characteristic Checks
5. SAN and COOL
6. Initiative
7. Combat Flow
8. Equipment Use
9. Player Quickstart
10. GM Adjudication
11. BPN Mission Loop
12. Advanced Examples
13. FAQ and Clarifications
14. Changelog
15. Expansion Notes

---

## 20. Suggested Tags for Internal Linking

Use these tags in page headings or metadata:
- `rules-core`
- `rules-edge`
- `rules-combat`
- `rules-sanity-cool`
- `rules-equipment`
- `gm-procedure`
- `gm-examples`
- `player-quickref`

This helps searchable teaching UI and sidebar filtering.

---

## 21. Expansion Slots (Deliberate Future Sections)

Reserved for future passes:

- Character creation full walkthrough
- Species and package deep rules
- Downtime/economy cycle rules
- Injury and recovery deep chapter
- Advanced EBB chapter
- Encounter templates by BPN color
- Solo-play chapter expansion
- Optional realism toggles

Each slot can become its own chapter without restructuring this foundation.

---

# Part IV: Reference Tables

---

## 22. Edge Quick Table

| Situation | Edge Recommendation |
|---|---|
| Prepared, superior angle, good intel | Advantage |
| Standard operating conditions | Normal |
| Low visibility, time pressure, suppression | Disadvantage |

---

## 23. Modifier Quick Table

| Pressure Level | Typical Modifier |
|---|---|
| Minor help/hindrance | +/-10% |
| Strong tactical impact | +/-20% |
| Extreme condition | +/-30% or more |

---

## 24. Gear Utility Quick Table

| Gear | Typical Use |
|---|---|
| Headset Communicator | coordination under split movement |
| Environment Scanner | hidden threat detection |
| Forensic Kit | evidence-grade scene processing |
| BOOPA Medical Kit | trauma and field treatment |
| Grapple Gun | vertical movement/insertion |
| Smoke Grenade | LOS disruption and reposition |
| Ebb Damper | anti-EBB tactical control |
| Magna-Clamp Tracker | covert vehicle tracking |

---

# Part V: Living Document Management

---

## 25. Update Protocol

When rules change:

1. Update affected chapter text.
2. Add one concrete example reflecting new behavior.
3. Add change note in changelog section.
4. Ensure Foundry page map remains aligned.

---

## 26. Changelog (Rulebook)

### 2026-02-23
- Created full rulebook foundation for players and GMs.
- Added structured chapter split for Foundry journal/module teaching use.
- Added core play examples and gear examples.
- Added explicit expansion slots for future development.
- Added Part VI: Wounds, Death & Healing (0-HP CON save flow, bleed-out, first aid, serious injury model).
- Added Part VII: NPCs & Adversaries (tier model, BPN threat mapping, Foundry NPC workflow).

---

## 27. Final Note

This rulebook is intentionally built as a **foundation**, not a closed final text.

As the system grows, continue expanding chapter-by-chapter while preserving:
- core resolution clarity,
- edge consistency,
- transparent modifier math,
- SLA mission tone and consequence pressure.

---

# Part VI: Wounds, Death & Healing

---

## 28. Hit Points, Collapse, and CON Saves

This system uses a single HP track with a dangerous 0-HP threshold.

- At `HP > 0`: you remain active (with penalties at low HP).
- At `HP <= 0`: you are in a critical state and must resolve a CON Save.

### Suggested HP Formula

Use BRP baseline:

- `HP = (CON + SIZ) / 2`, rounded up.

If a table is running without SIZ:

- `HP = CON` (or a similar simplified house variant).

### Wound State Language

Use these labels for clarity:

- `Healthy`: above half max HP.
- `Wounded`: at or below half max HP, above 1 HP.
- `Severely Wounded`: 1 HP or less, but still above 0.
- `Critical`: 0 HP or below.

---

## 29. Low-HP Penalties

When HP falls to `<= half max HP` (round down):

- Apply `-10%` to most physical actions:
  - Athletics
  - Mobility
  - Melee
  - Firearms
  - similarly strenuous checks

When HP is `1` (or very close to collapse but still positive):

- Apply `-20%` to most physical actions.
- GM may add Disadvantage on extreme exertion.

These penalties model pain, shock, and blood loss before total collapse.

---

## 30. 0 HP or Below: CON Save Procedure

When a character is reduced to `0 HP or below`:

1. Record the new HP value (including negative values if used).
2. Immediately resolve a CON Save.

### CON Save Roll

- Roll `d100` against CON% (usually CON x5).
- Apply Edge as normal:
  - Advantage for favorable survival factors.
  - Disadvantage for massive trauma, blast impact, or compounded injuries.

### CON Save Results

- `Success / Special / Critical`: **Down but Alive**.
- `Failure`: **Dying**.
- `Fumble`: **Dead** (or catastrophic non-survivable trauma).

This keeps 0-HP moments fast and decisive.

---

## 31. Critical States

### Down but Alive

The character is out of the fight (unconscious or barely responsive), but not immediately bleeding out.

- Cannot take normal actions.
- Requires treatment before meaningful return to action.
- Further damage can still kill.

### Dying

Without aid, the character will die.

- Start a bleed-out timer in rounds:
  - default guide: rounds remaining = CON score.
- Timer expires -> death.

Successful stabilisation shifts state to **Down but Alive**.

### Dead

On CON Save fumble at 0 HP:

- character is dead, or
- injuries are narratively irrecoverable without extraordinary intervention.

---

## 32. Serious Injury Table (Recommended)

When a character survives 0 HP (Down but Alive or stabilised), roll `1d6`:

| d6 | Injury Type | Effect |
|---|---|---|
| 1 | Close Call | No lasting body injury; shaken. -10% to SAN/COOL checks for rest of current BPN. |
| 2 | Deep Flesh Wound | -10% to one physical skill until fully recovered. |
| 3 | Fracture / Broken Limb | -20% to relevant limb actions until proper treatment. |
| 4 | Internal Damage | Temporary max HP reduction (suggest `-2`) until clinical care. |
| 5 | Disfigurement / Scar | Contextual social modifier (`-10%` with some NPCs, possible intimidation upside elsewhere). |
| 6 | Near-Death Trauma | Mental scar: situational `-10%` to SAN/COOL until therapy, downtime processing, or equivalent recovery. |

Use this to preserve campaign consequence without overcomplicating core combat timing.

---

## 33. Healing Flow

### Natural Recovery

If stable and at positive HP:

- recover `1 HP/day` with full rest.
- harsh conditions can reduce this rate.

If at 0 or below and only just stabilised:

- no natural recovery until first aid/medicine establishes stability.

### First Aid (Field)

A successful First Aid attempt can:

- stop bleeding (if Dying),
- move Dying -> Down but Alive,
- restore a small amount of HP (typical `1d3`, or `1d3+1` with superior kit).

Failure: no effect.  
Fumble: condition worsens at GM discretion.

### Medicine (Clinical / Advanced)

Medicine governs surgery, deep treatment, and structured recovery.

- Clinical care can restore HP faster and remove serious-injury penalties.
- Field medicine with advanced kit can partially replicate this at higher risk.

---

## 34. Drugs and Trauma Gear in This Flow

Use existing system effects to support crisis resolution:

- `KickStart`: emergency HP regain; repeated use should carry crash risk.
- `Splatter`: rapid bleed control and stabilisation support.
- `Trauma Stabiliser`: buys extraction time for otherwise terminal casualties.

If your table has removed Fatigue tracking, convert any fatigue references into short-duration action penalties or post-scene crash effects.

---

## 35. Wounds Example (Table Flow)

Operative starts at 11 HP and takes 13 damage:

- New HP = `-2`.
- Immediate CON Save at CON%.
- Roll succeeds -> **Down but Alive**.
- Medic applies field treatment and restores small HP.
- Character is alive, out of action, and may carry a serious injury into later scenes.

This gives fast high-stakes resolution while preserving campaign consequences.

---

# Part VII: NPCs & Adversaries

---

## 36. Tiered Opposition Model

Use tiers to control prep effort and encounter intensity:

- Tier 1: Extras (fast to drop, low complexity)
- Tier 2: Standard Opposition (core mission pressure)
- Tier 3: Elite Operatives (specialists with strong action impact)
- Tier 4: Horrors/Set Pieces (scene-defining threats)

This is the default adversary scaling model for SLA BRP.

---

## 37. Standard NPC Block

Keep NPC blocks concise and table-usable:

- Name and Role
- Tier
- STR/CON/DEX/INT/POW/CHA/SIZ
- HP
- Key Skills only
- Attack lines (%, damage, notable effect)
- Armour
- Traits
- Gear
- BPN hooks

Do not overbuild non-essential NPCs.

---

## 38. BPN Colour to Threat Mix

Use colour code to choose opposition rapidly:

- Blue: gangers, low-end cults, minor Carrien
- White: serial killers, corrupt staff, hidden handlers
- Yellow: retrieval rivals, thieves, smugglers
- Green: Carrien packs, Manchines, sector horrors
- Red: cells, riot threats, heavy response contacts
- Grey: rogue ops, corporate/internal enforcement
- Jade: biohazard and Ebb-unstable entities
- Black: high-tier deniable threats
- Silver: media-facing sabotage and PR adversaries
- Platinum: unique custom threats only

---

## 39. Foundry NPC Workflow

System support includes:

- Searchable NPC/adversary guide journal:
  - `SLA NPCS & ADVERSARIES – PLAYERS & GMS`
- Sidebar access:
  - Journal button: `NPC Guide`
  - Actor button: `Seed NPC Adversaries`
- Seeded archetype actors by tier:
  - Downtown Ganger
  - Basic Civilian
  - Shiver Patrol Officer
  - DarkNight Cell Operative
  - Cloak Division Agent
  - Thresher Powersuit Pilot
  - Carrien Hunter
  - Manchine

This gives immediate drag-and-run opposition without manual stat construction each session.
