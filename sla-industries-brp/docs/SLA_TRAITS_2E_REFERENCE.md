# SLA BRP Trait Reference (Installed Traits + SLA 2e Effects)

## Scope
This document lists every trait currently installed in your SLA BRP system and pairs each with the corresponding **SLA Industries 2nd Edition** game effect summary.

## Sources Used
- Installed trait records: `/Users/timevans/FoundryVTT/Data/systems/sla-industries/packs/traits.db`
- 2e rule text extraction: `/Users/timevans/Downloads/494461073-SLA-Industries-2nd-Edition-Final-2020.txt`
- SLA BRP trait seed bridge: `/Users/timevans/FoundryVTT/Data/systems/sla-industries-brp/module/apps/sla-seed-importer.mjs`

## Point Value Convention
- `Cost X` = spend X trait points per rank (advantage-style trait)
- `Gain X` = gain X trait points per rank (disadvantage-style trait)

## Installed Trait Catalogue
| Trait | Type | Ranks | Point Value | 2e Game Effect Summary |
|---|---|---:|---|---|

| Addiction/Compulsion | disadvantage | 3 | Gain 1 | Specify a non-drug compulsion/addiction (for drugs use Drug Addict). For each rank, the character must feed the compulsion twice per day or take -1 to all dice on all rolls. Multiple instances allowed. |
| Allergy | disadvantage | 3 | Gain 1 | Specify allergen. While exposed: -1 to all dice on CONC-related rolls per rank until medication or removal. Rank 1 uncommon allergen, rank 2 common, rank 3 common and potentially life-threatening (immediate medication may be required). Multiple instances allowed. |
| Ambidextrous | advantage | 1 | Cost 2 | No off-hand penalties or increased difficulty for using the non-dominant hand. |
| Anger | disadvantage | 1 | Gain 2 | Must prioritize attacking anyone who has attacked them until target is neutralized; refuses retreat while such a target remains. Strong roleplay pressure toward violent escalation. |
| Anxiety | disadvantage | 3 | Gain 1 | -1 to dice on Fear Tests per rank. Character should be roleplayed as persistently on edge/worrying. Typically up to 2 ranks at creation, may rise to 3 later. |
| Arrogant | disadvantage | 1 | Gain 1 | -1 to all dice on CHA-related rolls when dealing with anyone whose SCL is not higher than the character's. Strong roleplay pressure toward entitlement/snobbery. |
| Attractive | advantage | 2 | Cost 1 | +1 Skill Die success per rank on CHA-based rolls where physical attractiveness matters (for example Seduction). Mutually exclusive with Unattractive. |
| Chicken | disadvantage | 1 | Gain 3 | Species maximum COOL reduced by 2. Fear effects persist 2 hours instead of 1 after leaving fear stimulus. Strong roleplay pressure to avoid danger. Mutually exclusive with Exceedingly Cool. |
| Contact | advantage | 4 | Cost 1 | A reliable contact/friend can provide intel/resources/help. Rank scales contact value from street-level source to high-ranking corporate/faction asset. Multiple instances allowed. |
| Debt | disadvantage | 3 | Gain 1 | Character owes a substantial debt. Pays 10% of earnings per rank; at rank 3 may be pursued/hounded for additional repayments. Can coexist with Savings. |
| Depression | disadvantage | 3 | Gain 1 | -1 to Success Die per rank on CHA-based skill rolls. Roleplay ongoing depressive effects. Usually up to 2 ranks at creation, may rise to 3 later. |
| Drug Addict | disadvantage | 3 | Gain 1 | Character is addicted to one or more specified drugs. Use the 2e drug addiction rules for dependency/withdrawal handling. Multiple instances allowed. |
| Enemy | disadvantage | 4 | Gain 1 | A person/organization has vendetta against the character. Rank scales from local threat to high-level dangerous adversary. GM should actively surface enemy pressure in play. Multiple instances allowed. |
| Exceedingly Cool | advantage | 1 | Cost 2 | Species maximum COOL +1 (to max 6). Once per session: automatic Fear Test success without rolling. Mutually exclusive with Chicken. |
| Good Hearing | advantage | 2 | Cost 1 | +1 Skill Die success per rank on hearing-based Detect rolls. Mutually exclusive with Poor Hearing. |
| Good Housing | advantage | 2 | Cost 1 | Safe and private base, secure storage, better living conditions and lower day-to-day vulnerability. Mutually exclusive with Poor Housing. |
| Good Vision | advantage | 2 | Cost 1 | +1 Skill Die success per rank on sight-based Detect rolls. Mutually exclusive with Poor Vision. |
| Illness | disadvantage | 3 | Gain 1 | Specify illness; regular medication/treatment required. Rank indicates severity. Multiple illness traits allowed. 2e examples: Asthma (max DEX -1; max 1 Body RP; daily meds), Migraine (-2 CONC/DEX during attacks), Diabetes (-2 STR/DEX/CONC during episodes), Epilepsy (light-triggered incapacitation), Cancer (max STR/DEX -1 and progressive decline), Haemophilia (bleeding worsened: 2 HP/20 min). |
| Natural Aptitude: Skill | advantage | 3 | Cost 1 | Exceptional capability in one non-combat/non-weapon skill. Once per session reroll a failed roll using Aptitude rank; Aptitude rank cannot exceed current skill rank. Only one Natural Aptitude: Skill may be taken. |
| Natural Aptitude: Stat | advantage | 1 | Cost 3 | Increase species maximum of one stat by 1 (to max 6). Does not increase current stat rank. COOL and LUCK/FLUX cannot be selected. Only one Natural Aptitude: Stat may be taken. |
| Pacifist | disadvantage | 1 | Gain 3 | Actively avoids violence and seeks peaceful outcomes. Never rolls initiative and is always treated as lowest initiative in combat. Violence should trigger guilt/internal conflict roleplay. |
| Phobia | disadvantage | 3 | Gain 1 | Specify fear stimulus. Rank 1: +2 Fear Rating when stimulus present. Each additional rank adds +1 further Fear Rating. Multiple phobias allowed with GM approval. |
| Poor Hearing | disadvantage | 2 | Gain 1 | -1 to Success Die per rank on hearing-based Detect rolls. Mutually exclusive with Good Hearing. |
| Poor Housing | disadvantage | 2 | Gain 1 | Unsafe/insecure living situation with increased risk of theft, vandalism and personal vulnerability. Mutually exclusive with Good Housing. |
| Poor Vision | disadvantage | 2 | Gain 1 | -1 to Success Die per rank on sight-based Detect rolls; rank 2 generally requires glasses/visual aid. Mutually exclusive with Good Vision. |
| Psychosis | disadvantage | 3 | Gain 2 | Severe mental illness; one rank usually at creation, can escalate with trauma. If raised to rank 3, character becomes non-playable under GM control. 2e examples include Sociopathy (harder CHA social success), Delusions (fear state when delusion triggered), DID (alternate personality episodes), Paranoia (periodic social/concentration penalties), Schizophrenia (concentration disruption and GM-driven intrusive prompts). |
| Savings | advantage | 3 | Cost 1 | Each rank represents 500c in saved funds. May attract unwanted attention. Can coexist with Debt (hidden reserves while owing money). |
| Sterile | disadvantage | 1 | Gain 1 | Character is infertile. Social consequences can apply (notably in Shiver culture). Stormers are already sterile and may not take this trait; Shaktar may face cultural ostracism. |
| Unattractive | disadvantage | 2 | Gain 1 | -1 to Success Die per rank on CHA-based rolls where appearance matters. Mutually exclusive with Attractive. |


## Notes for SLA BRP Conversion
- These entries preserve the **2e intent text** so you have a complete GM/player reference.
- Several effects use 2e terms (for example Skill Die / Success Die / Fear Rating). If you want, these can be translated into explicit BRP-percent mechanics in a second pass.
- Traits that are paired in 2e as one shared entry are split in your installed list:
  - `Hearing (good or poor)` -> `Good Hearing`, `Poor Hearing`
  - `Vision (good or poor)` -> `Good Vision`, `Poor Vision`
  - `Housing (good or poor)` -> `Good Housing`, `Poor Housing`
  - `Looks (attractive or unattractive)` -> `Attractive`, `Unattractive`

## Installed Count Check
- Total installed traits in source pack: **29**
- Total rows in this document: **29**
