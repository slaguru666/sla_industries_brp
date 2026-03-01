# SLA BRP - Escalation Initiative (Advantage Die System)

Version: 1.0

## Core Concept

Initiative is a single roll each round.

Operatives may gamble for speed using an Advantage Die.
If they push too hard and lose composure, they freeze.

This system is designed to:

- Use a single roll per round
- Require no bookkeeping between rounds
- Work cleanly at table or in Foundry
- Integrate COOL as a psychological pressure mechanic

## Round Procedure

Each round:

1. Choose your approach:
- DEX (Reflex)
- INT (Read the Fight)
2. Choose whether to take the Risk.
3. Roll initiative.

Highest total acts first.

## Normal Roll

Roll:

`1D10 + chosen stat (DEX or INT)`

Highest total acts first.

## Risk Roll (Advantage Die)

Instead of a normal roll, you may roll:

`2D10 + chosen stat`

Keep the highest die.

However:

If either die shows a 1, you must immediately roll COOL.

## COOL Test (When a 1 Is Rolled)

If no die shows 1:

- Act normally at your rolled initiative.

If a die shows 1:

- Immediately roll COOL.

COOL resolution:

Success:

- You act normally.

Failure:

- You freeze.
- You take no action this round.
- You may still Dodge or Parry.

Fumble:

- You catastrophically overcommit.
- You take no action this round.
- You cannot Dodge or Parry until after your initiative passes.
- GM may narrate a visible tactical error (stumble, twitch, hesitation, weapon slip).

## Tie Breakers

If two characters have the same initiative total:

1. Higher chosen stat wins.
2. If still tied:
- The character who chose INT wins ties against DEX.
3. If still tied:
- Actions are simultaneous.

## Design Notes

- Rolling `2D10` gives roughly a `19%` chance of triggering a COOL test.
- This creates tension without heavy bookkeeping.
- Low COOL characters become increasingly vulnerable to freezing.
- This interacts naturally with Sanity erosion if COOL is penalized by low SAN.
- No tokens, no tracking, no recalculation mid-round.
- Every consequence resolves immediately.

## Optional Differentiation (Optional Rule)

If the COOL roll succeeds after a Risk roll:

If you chose INT:

- `+10%` to your first attack this round.

If you chose DEX:

- Gain `1m` free movement before your first action.

This adds flavor without adding tracking.

## Foundry Implementation Notes

This system is simple to implement in Foundry because:

1. It requires only one roll per round.
2. No persistent state is required.
3. No tracking of damage, tokens, or flags is necessary.

Suggested implementation approach:

- Create two initiative macros:
  - A) Normal Roll
  - B) Risk Roll

Normal Roll formula:

`1d10 + @dex`

or

`1d10 + @int`

Risk Roll formula:

`2d10kh + @dex`

or

`2d10kh + @int`

(`kh` = keep highest)

After the roll:

- If any die result = 1, prompt a COOL roll manually or via macro.
- Apply freeze effect narratively (no system state required unless desired).

Optional automation:

- Add a dialog checkbox: Risk?
- If checked, roll `2d10kh`.
- If either die result is `1`, auto-prompt COOL roll.

No initiative reordering logic is required beyond setting initiative value.

### Current system API hooks (first implementation pass)

In this system build, Escalation Initiative is available via:

- `game.brp.SLAEscalationInitiative.rollControlled({ approach: "dex", risk: false })`
- `game.brp.SLAEscalationInitiative.rollControlled({ approach: "int", risk: true })`

Combat tracker single-combatant initiative rolls now prompt for:

- DEX or INT
- Risk on/off

Risk roll handling includes automatic COOL checks when any risk die shows `1`.

## Why This Works for 6 Players

- Everyone rolls once.
- Only risk-takers occasionally roll COOL.
- Freeze is immediate and resolved instantly.
- No end-of-round recalculation.
- No momentum tokens.
- No damage comparison.

It keeps combat moving.

It adds psychological risk.

It feels like SLA.

## End of Initiative Rules

Reserved for table-specific additions.
