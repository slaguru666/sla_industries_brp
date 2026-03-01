# Vehicles & Chases (BRP - SLA Industries)

Document Status: First Draft - Playable  
Scope: Fast, table-ready vehicle and chase rules integrated into the SLA BRP Edge framework.

---

## 1. Design Goals

These rules are built to:

- plug into existing BRP roll-under checks,
- use the same Advantage/Normal/Disadvantage edge flow,
- avoid hex-by-hex bookkeeping,
- keep chase scenes tense and cinematic.

If a scene slows down, simplify to one opposed chase test per round.

---

## 2. Vehicle Stat Block

Each vehicle uses this profile:

- **Type** - Car, Van, Grav-Bike, APC, Train, etc.
- **SCL Access** - Typical minimum SCL for legal operation or issue.
- **Cost** - Credits (`c`).
- **Crew** - Driver + passengers.
- **Speed Bands** - Crawl / Street / Highway / Pursuit.
- **Handling** - Percentile base for control tests.
- **Armour** - Damage reduction against incoming damage.
- **Hull** - Structural HP before vehicle failure.
- **Size** - Small / Medium / Large.
- **Traits** - Offroad, Enclosed, Open, Airborne, Sluggish, etc.

---

## 3. Vehicle Templates

### Downtown Compact Car

Type: Civilian Car  
SCL Access: 10+  
Cost: 800c  
Crew: 1 + 3 passengers  
Speed: Crawl / Street / Highway / -  
Handling: 55%  
Armour: 2  
Hull: 20  
Size: Medium  
Traits: Enclosed, Common.

Notes:
- baseline Mort civilian profile,
- weak under sustained high-pressure pursuit.

### SLA Interceptor (Grav Car)

Type: SLA Patrol Interceptor  
SCL Access: 7+  
Cost: 8000c  
Crew: 1 + 1 to 2 passengers  
Speed: Crawl / Street / Highway / Pursuit  
Handling: 70%  
Armour: 4  
Hull: 30  
Size: Medium  
Traits: Enclosed, High-Performance, Airborne (low grav).

Notes:
- strong pursuit platform,
- favors aggressive closure and lane control.

### Downtown Delivery Van

Type: Panel Van  
SCL Access: 10+  
Cost: 1200c  
Crew: 1 + 1 passenger, cargo bay  
Speed: Crawl / Street / Highway / -  
Handling: 45%  
Armour: 3 front / 2 side  
Hull: 28  
Size: Large  
Traits: Enclosed, Sluggish, High Centre of Gravity.

Notes:
- excellent load utility,
- poor sudden maneuver profile.

### Mort Sector Sled Grav-Bike

Type: Grav-Bike  
SCL Access: 8+  
Cost: 3500c  
Crew: 1 rider (+1 at GM discretion)  
Speed: Crawl / Street / Highway / Pursuit  
Handling: 65%  
Armour: 1  
Hull: 16  
Size: Small  
Traits: Open, Agile, Exposed Rider.

Notes:
- strong threading and corner recovery,
- rider vulnerability remains high.

---

## 4. Vehicle Tests

Driving uses an appropriate skill:

- `Drive (Ground)`
- `Drive (Grav)`
- `Pilot` (for relevant craft)

### 4.1 When To Roll

Do not roll routine travel. Roll only when:

- maneuver is risky,
- speed pressure is high,
- conditions are degraded,
- active opposition exists,
- failure would matter to scene outcome.

### 4.2 Edge Assignment

**Advantage**
- clean visibility,
- familiar route,
- prepped maneuver,
- superior vehicle for current terrain.

**Normal**
- standard Mort traffic/weather pressure.

**Disadvantage**
- heavy rain/smog/oil,
- panic crowds,
- damaged vehicle,
- overloaded cargo,
- severe route complexity.

### 4.3 Modifiers

Apply tactical modifiers as normal:

- minor factor: +/-10%
- strong factor: +/-20%
- severe factor: +/-30%

Example:
- Interceptor Handling 70%
- heavy rain + skyway debris: Disadvantage, -10%
- final target: 60%

---

## 5. Speed Bands

Use qualitative speed:

- **Crawl** - parking/crowds/alley creep
- **Street** - normal city flow
- **Highway** - fast lanes, harder recovery
- **Pursuit** - near-limit operation

### Band Changes

Increasing one band:
- usually free in calm scenes,
- under pressure may require a control test.

Failing that test:
- delay, poor line, or minor consequence.

Fumble:
- major control loss, obstacle impact, or crash check.

---

## 6. Chase Structure (Abstract Bands)

Track relative distance only:

- **Engaged**
- **Close**
- **Far**
- **Lost**

No exact meter tracking required.

### 6.1 Chase Round

1. Set current band.
2. Each side declares approach:
   - Aggressive
   - Neutral
   - Evasive
3. Each driver makes chase test.
4. Compare outcomes.
5. Shift range band accordingly.

### 6.2 Comparison Priority

- Higher successful tier wins (`Critical > Special > Success`).
- If both fail, band usually does not change.
- If same tier tie, compare kept roll by table convention (for this subsystem, higher kept roll inside same tier wins tie).

### 6.3 Band Shift

- Aggressive winner: shift 1 toward **Engaged**.
- Evasive winner: shift 1 toward **Lost**.
- Neutral winner: usually hold band, or gain minor narrative edge.

Special/Critical may justify 2-step shift in extreme scenes.

---

## 7. Obstacles and Environmental Pressure

Insert obstacle beats to make chases dynamic:

Examples:
- collapsed scaffold,
- checkpoint wall,
- flood lane,
- jack-knifed cargo truck,
- panicked civilian wave,
- maintenance drone swarm.

### Obstacle Procedure

1. Describe hazard.
2. Call test (`Drive`, `Mobility`, `COOL`, etc.).
3. Apply edge from context.
4. Resolve:
   - Success: pass cleanly.
   - Failure: lose initiative/position or take minor damage.
   - Fumble: collision/spin-out sequence.

---

## 8. Collisions and Crashes

### 8.1 Severity Ladder

- Low (Crawl): `1d6`
- Medium (Street): `2d6-3d6`
- High (Highway): `4d6-6d6`
- Extreme (Pursuit): `8d6+`

### 8.2 Damage Application

1. Roll collision damage.
2. Apply vehicle armour reduction.
3. Subtract from Hull.
4. Apply occupant damage (usually 1/2 or 1/3 of post-armour collision damage).

On a driving fumble during collision:
- double damage or roll twice, take higher.

---

## 9. Vehicle Condition States

- **New** - no penalties.
- **Used** - normal.
- **Worn** - -10% Handling/chase tests.
- **Damaged** - -20% Handling; Pursuit unsafe.
- **Wrecked** - immobile, cover only.

When Hull drops below half:
- degrade one condition step.

At 0 Hull:
- Wrecked.

Repair uses existing repair gear/rules and costs.

---

## 10. On-Foot Chases

Use same band model (`Engaged/Close/Far/Lost`) with alternate skills:

- `Mobility` / `Athletics`
- `Stealth`
- `Survival`
- occasional `COOL` under panic

Approach declarations stay identical:
- Aggressive / Neutral / Evasive.

---

## 11. Example: RED BPN Skyway Pursuit

Setup:
- squad in SLA Interceptor,
- quarry in delivery van,
- heavy rain,
- starting at **Close**.

Round 1:
- Interceptor: Aggressive.
- Van: Evasive.
- Interceptor rolls success; van fails.
- Band shifts **Close -> Engaged**.

Round 2 (Obstacle):
- GM adds partial skyway collapse.
- Both roll at Disadvantage.
- Interceptor succeeds, van fumbles.
- Van takes collision damage and condition worsens.
- GM applies tactical reroute consequences and continues chase.

End conditions:
- quarry `Lost`,
- forced stop/surrender,
- vehicle disabled,
- or scene transitions to on-foot pursuit.

---

## 12. Foundry Integration Pattern

### 12.1 For Vehicle Items

Store on vehicle records/items:
- type,
- crew,
- speed bands,
- handling,
- armour,
- hull,
- size,
- traits,
- current condition.

### 12.2 For Chase Tracking

Use a chase helper flow:
- select current band,
- select approaches,
- set edge + modifiers,
- roll both sides,
- output winner + next band.

Keep this visible in chat or a reference panel so all players can follow progress.

---

## 13. Quick Reference Tables

### 13.1 Edge Defaults for Chases

| Situation | Edge |
|---|---|
| Clean weather, known route, superior platform | Advantage |
| Normal city pressure | Normal |
| Storm/smog/debris/critical traffic | Disadvantage |

### 13.2 Band Shift Intent

| Winner Approach | Typical Shift |
|---|---|
| Aggressive | toward Engaged |
| Neutral | maintain / minor gain |
| Evasive | toward Lost |

### 13.3 Crash Severity

| Speed | Typical Collision Damage |
|---|---|
| Crawl | 1d6 |
| Street | 2d6-3d6 |
| Highway | 4d6-6d6 |
| Pursuit | 8d6+ |

---

## 14. Expansion Slots (Future)

Reserved for future passes:
- mounted weapon fire in chase bands,
- airframe altitude strata,
- convoy multi-vehicle initiative,
- pursuit heat / law-response escalation,
- route-map generators by district.

