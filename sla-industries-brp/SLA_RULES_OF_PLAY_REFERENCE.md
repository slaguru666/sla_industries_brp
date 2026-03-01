# SLA Industries BRP
## Rules of Play Reference (Expanded)

Date: 2026-02-23  
Scope: Practical table-facing rules reference for the current Foundry implementation.

---

## 1. Core Resolution Engine

This system uses BRP-style percentile checks:

1. Determine target percentage.
2. Apply modifiers.
3. Roll d100 (or edge roll, see below).
4. Compare kept result to target.

Lower results are better.

### Success Tiers
- `Critical`
- `Special`
- `Success`
- `Failure`
- `Fumble`

The tier is determined from the kept d100 result against the final target.

---

## 2. Edge System (Advantage / Disadvantage)

Difficulty multipliers are replaced by edge mode:

- `Advantage`: roll `1D100`, reroll only the tens die, keep the lower result.
- `Normal`: roll `1D100`.
- `Disadvantage`: roll `1D100`, reroll only the tens die, keep the higher result.

### Why this matters
- Advantage increases chance of critical/special/success.
- Disadvantage increases chance of failure/fumble.
- The system keeps BRP tier math; only the die selection changes.

### Example (Skill 60%)
- **Advantage**: roll `74` and `32`, keep `32` -> Success.
- **Disadvantage**: roll `41` and `89`, keep `89` -> Failure.

---

## 3. Target Score Construction

The system calculates a final target from multiple layers.

Displayed in chat as:
- `Base`
- `Manual` (tactical flat modifier)
- `SLA Mods` (drug/EBB/mental overlays)
- `Final`

### Example Breakdown
`Base 52% | Manual +10% | SLA Mods -20% | Final 42%`

This makes it clear what changed the roll and by how much.

---

## 4. Roll Dialog Workflow

The roll dialog now functions as `SLA Roll Control` with `EDGE CONTROL` framing.

Typical fields:
- `Roll Edge` (Advantage/Normal/Disadvantage)
- `Tactical Modifier (%)`
- Context fields when relevant:
  - Resistance value
  - Range / hands used
  - Ammo type
  - Wound target (First Aid flows)

### Fast use pattern
- Routine action: Normal, `0` modifier.
- Favored tactical setup: Advantage, positive modifier if justified.
- Harsh conditions: Disadvantage, negative modifier if justified.

---

## 5. Characteristic and Skill Checks

### Characteristic checks
Use characteristic roll controls (e.g., STR/DEX/INT/POW).

### Skill checks
Use skill row roll controls.

Both route into the same core pipeline:
- edge selection,
- target build,
- kept roll,
- BRP tier.

### Example: Athletics Under Fire
- Base Athletics: `64%`
- GM applies tactical penalty for suppression: `-20%`
- Drug effect grants `+10%`
- Final: `54%`
- Roll (Disadvantage): `18` and `77`, keep `77` -> Failure.

---

## 6. Resistance and POW-v-POW

Resistance style flows remain supported for opposed-characteristic logic.

Use cases:
- Strength vs physical force.
- POW-v-POW contests.

Inputs include the opposing value, and target is recalculated accordingly.

### Example
- Operative STR test vs opposing STR equivalent.
- Enter resistance value in prompt.
- System recalculates percentile chance and resolves as normal.

---

## 7. SAN and COOL Flows

SAN/COOL checks support edge mode like standard checks:
- Advantage / Normal / Disadvantage.

Mental-state modifiers can alter target.

### Example: COOL Under Psychological Pressure
- Base COOL: `48%`
- Mental pressure modifier: `-15%`
- Final COOL target: `33%`
- Roll (Normal): `29` -> Success.

### Example: SAN Shock With Disadvantage
- SAN target: `55%`
- Disadvantage roll: `22` and `81`, keep `81` -> Failure.

---

## 8. Escalation Initiative (Current Play Intent)

Character sheet supports initiative actions:
- `DEX INIT`
- `INT INIT`
- `SHIFT` + click invokes risk behavior.

Design intent:
- One initiative roll per round.
- Fast turn ordering with optional risk pressure.

### Example Round Start
1. Op A uses `DEX INIT` -> 18.
2. Op B uses `INT INIT` with risk -> 24.
3. Op C uses `DEX INIT` -> 11.
4. Turn order: B, A, C.

---

## 9. Combat Resolution Overview

Combat rolls use the same percentile edge pipeline, then branch to combat effects:
- result tier,
- ammo context,
- optional quick-apply damage actions from chat card.

### Ammo Context in Combat
Combat cards can show:
- ammo tag/type,
- ammo effect summary,
- credits spent/surcharge where relevant.

### Example: Rifle Attack
- Firearm (Rifle): `70%`
- Long range and smoke: Disadvantage.
- Roll: `14` and `83`, keep `83` -> Failure.
- Ammo still consumed per fire mode.

---

## 10. Chat Card Reading Guide

For non-resistance checks, each card now shows:
- Header: edge roll type (`Advantage Roll`, etc.)
- Main line: skill/stat and final target.
- Meta line 1: edge + target breakdown.
- Meta line 2: roll details (`1D100 base + tens re-roll -> keep best/worst`).

### Example Chat Interpretation
`Edge: Advantage | Base 60% | Manual +10% | SLA Mods -5% | Final 65%`
`Roll: 1D100 base 74 | Edge tens d10:3 => 34 | keep lowest 34`
Result: `Success: 32`

This gives full transparency for players and GM.

---

## 11. Drugs, EBB, and Mental Overlays

Subsystem overlays can add flat target modifiers or state effects.

Displayed/used in roll pipeline:
- Drug summary + roll modifier.
- EBB effects and roll modifier.
- Mental effects and roll modifier.

### Example Combined Overlay
- Base skill: `45%`
- Tactical mod: `+10%`
- Drug mod: `+15%`
- Mental stress: `-20%`
- Final: `50%`

Roll at Normal: `47` -> Success.

---

## 12. Equipment Play Usage (With Examples)

The system includes seeded drag/drop `gear` items from the SLA equipment catalogue.

### Common Gear Categories
- Communications
- Surveillance/Detection
- Medical
- Climbing/Exploration
- Utility/Breaching
- Personal/Field sustainment
- Specialist tech
- Non-lethal/security

### Example Gear in Play

#### A) Headset Communicator
Use: keep squad coordinated in split locations.
- Practical effect: easier coordinated tactical calls.
- Example: two-team pincer where rear team feeds movement updates.

#### B) Environment Scanner (Standard)
Use: detect hidden hostiles/heat signatures.
- Example: squad sweeps maintenance corridor before breach.
- GM can grant better detection outcomes where scanner is relevant.

#### C) Forensic Kit
Use: evidence-grade scene processing.
- Example: White BPN murder scene.
- Without kit, forensics performance is worse; with kit, evidence capture is reliable.

#### D) BOOPA Medical Kit (Advanced)
Use: trauma stabilization and field treatment.
- Example: teammate drops to critical after hallway ambush.
- Medic uses advanced kit to stabilize before extraction.

#### E) Grapple Gun + Climbing Harness
Use: vertical insertion/exfiltration.
- Example: rooftop access to avoid checkpoint firefight.

#### F) Smoke Grenade
Use: break LOS, reposition, or extract.
- Example: pop smoke across open street and relocate to hard cover.

#### G) Ebb Damper
Use: suppress EBB activity in close zone.
- Example: hostile EBB user in confined room; team deploys damper before entry.

#### H) Magna-Clamp Tracker
Use: covertly mark target vehicle.
- Example: Grey BPN convoy tail without open confrontation.

---

## 13. BPN Toolkit in Active Play

GM can generate mission packets and run operations quickly.

Typical cycle:
1. Generate BPN journal from toolkit.
2. Present player-facing brief.
3. Keep GM-only debrief hidden.
4. Link scenes, opposition actors, and items.
5. Run mission and update debrief with outcomes.

### Example Session Start
- Generate `WHITE BPN - Missing Precinct Team`.
- Seed opposition clues and locations.
- Squad rolls initial Investigate/Perception checks with edge based on scene conditions.

---

## 14. End-to-End Example of Play (Full Turn)

### Setup
- Op skill (Firearm Pistol): `58%`
- Tactical stance bonus: `+10%`
- Panic penalty: `-15%`
- Final target: `53%`

### Action 1: Opening Shot
- Edge: Advantage (target exposed)
- Roll: `64`, `27`, keep `27`
- Result: Success (27 <= 53)
- Combat card resolves hit path.

### Action 2: Return Fire Pressure
- Same skill, now under smoke + movement penalty.
- Edge: Disadvantage
- Manual mod: `-10%`
- Final target: `43%`
- Roll: `18`, `71`, keep `71`
- Result: Failure.

### Team Utility Action
- Support op throws smoke grenade to cut enemy LOS.
- Next ally movement occurs behind visual disruption.

This demonstrates how edge + modifiers drive tactical tempo.

---

## 15. GM Adjudication Tips

- Use edge mode for situational quality; use flat modifier for specific numeric pressure.
- Keep modifier math visible to maintain trust.
- Use equipment relevance as a real tactical lever.
- Reserve disadvantage for genuinely degraded conditions, not routine difficulty.
- When in doubt, prefer consistent edge rulings over ad hoc multiplier math.

---

## 16. Current Draft State

This reference reflects implemented behavior in the present build.

As the system evolves, update this file whenever these change:
- edge logic,
- initiative process,
- combat/ammo handling,
- SAN/COOL automation,
- equipment effect handling.
