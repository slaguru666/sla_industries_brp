import { BRPSelectLists } from "../apps/select-lists.mjs"
import { BRPCheck } from "../apps/check.mjs"

export class BRPCombatRoll {

  //Get damage formula from weapon/spell and actor
  static async damageFormula(weapon, actor, type, success, ammoTag = null) {

    let damage = ""
    let damageBonus = ""
    let askHands = false
    let askRange = false
    let askSuccess = true
    let askLevel = false
    let successOptions = await BRPSelectLists.getSuccessOptions()
    let range = ""
    let hands = ""
    let level = 1
    let damData = {}
    let handOptions = {}
    let rangeOptions = {}
    let label = game.i18n.localize('BRP.damage')

    //If success blank then ask for success level
    if (success != "") { askSuccess = false }

    //If this is a weapon Damage Roll
    if (type === 'DM') {
      //Get the damage
      damage = weapon.system.dmg1

      //Get weapon range Options
      rangeOptions = Object.assign(rangeOptions, await this.getRangeOptions(weapon));
      if (Object.keys(rangeOptions).length > 1) { askRange = true }

      //Het hand Options
      handOptions = Object.assign(handOptions, await this.getHandOptions(weapon));
      if (Object.keys(handOptions).length > 1) { askHands = true }

      //If this is a magic spell impact roll
    } else if (type === 'IM') {
      damage = weapon.system.damage
      //If no impact then return
      if (damage === "" || weapon.system.impact === 'other') { return }
      label = game.i18n.localize('BRP.' + weapon.system.impact)
      askLevel = true
      //If not weapon damage or spell impact then return
    } else { return }


    if (askRange || askHands || askSuccess || askLevel) {
      damData = {
        rollType: type,
        label: label,
        rangeOptions,
        handOptions,
        successOptions,
        askHands,
        askRange,
        askSuccess,
        askLevel,
        dialogTemplate: 'systems/sla-industries-brp/templates/dialog/damageDiff.html'
      }

      let usage = await BRPCheck.RollDialog(damData)
      if (usage) {
        range = usage.get('range')
        hands = usage.get('hands')
        success = usage.get('success')
        level = Number(usage.get('level'))
      }

      //If you've asked the range then get adjust damage for it
      if (askRange) {
        damage = weapon.system[range]
      }

      //If you asked the spell level then adjust damage for it
      if (askLevel) {
        let tempdam = ""
        for (let damlevel = 1; damlevel <= level; damlevel++) {
          tempdam = tempdam + "+" + damage
        }
        damage = tempdam
      }
    }

    //Work out damage bonus for Damage rolls
    if (type === 'DM') {
      damageBonus = await this.getDamageBonus(actor, weapon, hands)
    }


    //Work out damage formula based on weapon damage, damage bonus, success level and weapon special
    //damage = damage + damageBonus
    damage = await BRPCombatRoll.damageAssess(weapon, damage, damageBonus, success, type, ammoTag)

    let ammoContext = this.getAmmoContext(weapon, success || "2", ammoTag)
    let damageData = ({ damage, success, ammoContext })
    return damageData
  }

  static async damageAssess(weapon, damForm, damBon, success, type, ammoTag = null) {

    let newFormula = ""
    let specialType = "other"

    //If a Critical then set new formula to be max damage + damage bonus
    if (success === "4") {
      // newFormula = (new Roll(damForm).evaluate({ maximize: true }).total) + damBon
      newFormula = new Roll(damForm)
      newFormula = await newFormula.evaluate({ maximize: true })
      newFormula = newFormula.total + damBon
      if (type === 'DM') {
        specialType = weapon.system.special
      }
    } else if (success === "3") {
      if (type === 'DM') {
        specialType = weapon.system.special
      }
      switch (specialType) {
        case 'crush':
        case 'crushknock':
          if (damBon.startsWith('-')) {
            newFormula = damForm
          } else if (damBon === '+0') {
            newFormula = damForm + '+1D4'
          } else {
            newFormula = damForm + damBon + damBon
          }
          break
        case 'impale':
        case 'impknock':
          newFormula = damForm + "+" + damForm + damBon
          break
        default:
          newFormula = damForm + damBon
      }
    } else { newFormula = damForm + damBon }

    if (type === 'DM') {
      const ammoContext = this.getAmmoContext(weapon, success, ammoTag)
      newFormula = this.applyAmmoDamageModifiers(newFormula, ammoContext)
    }

    return newFormula
  }

  static normalizeAmmoTag(tag = "") {
    const normal = String(tag ?? "").trim().toUpperCase()
    if (["AP", "HE", "HEAP"].includes(normal)) return normal
    return "STD"
  }

  static getAmmoTag(weapon, ammoTag = null) {
    if (ammoTag !== null && ammoTag !== undefined && ammoTag !== "") {
      return this.normalizeAmmoTag(ammoTag)
    }
    return this.normalizeAmmoTag(weapon?.system?.ammoLoadedType ?? weapon?.system?.ammoTag ?? "STD")
  }

  static getAmmoContext(weapon, success = "2", ammoTag = null) {
    const tag = this.getAmmoTag(weapon, ammoTag)
    const level = String(success ?? "2")
    const context = {
      tag,
      pipShift: 0,
      armourMultiplier: 1,
      ignoreAllArmour: false,
      bonusIgnoreArmourFormula: "",
      armourRule: "",
      damageRule: "",
      summary: ""
    }

    switch (tag) {
      case "AP":
        context.pipShift = -1
        context.armourMultiplier = 0.5
        context.armourRule = "Target armour is halved (round up)."
        context.damageRule = "Damage is reduced by 1 pip."
        break
      case "HE":
        context.armourRule = "Armour applies normally."
        context.damageRule = "Use blast/radius bands; no +1D6 primary-zone bonus."
        break
      case "HEAP":
        if (level === "4") {
          context.ignoreAllArmour = true
          context.armourMultiplier = 0
          context.armourRule = "Critical: ignore all armour."
          context.damageRule = "Critical damage ignores armour."
        } else {
          context.armourMultiplier = 0.5
          context.armourRule = "Target armour is halved (round up)."
          if (level === "3") {
            context.bonusIgnoreArmourFormula = "1D6"
            context.damageRule = "Special: add +1D6 that ignores armour."
          } else {
            context.damageRule = "Normal damage."
          }
        }
        break
      default:
        context.armourRule = "Armour applies normally."
        context.damageRule = "Standard ammunition."
    }

    context.summary = `${context.armourRule} ${context.damageRule}`.trim()
    return context
  }

  static applyAmmoDamageModifiers(formula, ammoContext = {}) {
    let output = formula
    const shift = Number(ammoContext?.pipShift ?? 0)
    if (shift !== 0) {
      output = this.shiftDamageFormula(output, shift)
    }
    if (ammoContext?.bonusIgnoreArmourFormula) {
      output = this.appendDamageFormula(output, ammoContext.bonusIgnoreArmourFormula)
    }
    return output
  }

  static shiftDamageFormula(formula, shift = 0) {
    const numeric = Number(formula)
    if (Number.isFinite(numeric)) {
      return numeric + shift
    }
    const clean = String(formula ?? "").trim()
    if (!clean) return clean
    if (shift > 0) return `(${clean})+${shift}`
    return `(${clean})${shift}`
  }

  static appendDamageFormula(formula, addition = "") {
    const cleanFormula = String(formula ?? "").trim()
    const cleanAddition = String(addition ?? "").trim()
    if (!cleanAddition) return cleanFormula
    if (!cleanFormula) return cleanAddition
    return `(${cleanFormula})+${cleanAddition}`
  }


  //Get weapon Range Options
  static async getRangeOptions(weapon) {
    let rangeOptions = {
      dmg1: game.i18n.localize("BRP.range") + ":" + weapon.system.range1,
    }
    if (weapon.system.range2 != "") {
      rangeOptions = Object.assign(rangeOptions, {
        dmg2: game.i18n.localize("BRP.range") + ":" + weapon.system.range2
      })
    }
    if (weapon.system.range3 != "") {
      rangeOptions = Object.assign(rangeOptions, {
        dmg3: game.i18n.localize("BRP.range") + ":" + weapon.system.range3
      })
    }
    return rangeOptions
  }

  //Get wweapon Hand Options
  static async getHandOptions(weapon) {
    let handOptions = {}
    if (weapon.system.hands === "1-2H") {
      handOptions = Object.assign(handOptions, {
        1: game.i18n.localize("BRP.1H"),
        2: game.i18n.localize("BRP.2H"),
      })
    }
    return handOptions
  }

  //Get weapon Damage Bonus
  static async getDamageBonus(actor, weapon, hands) {
    const half = String(actor?.system?.dmgBonus?.half ?? "+0")
    const full = String(actor?.system?.dmgBonus?.full ?? "+0")
    const handMode = String(hands ?? "").trim().toLowerCase()
    const dbRaw = weapon?.system?.db
    const dbMode = String(dbRaw ?? "").trim().toLowerCase()
    const weaponType = String(weapon?.system?.weaponType ?? "").trim().toLowerCase()
    const isMeleeWeapon = weaponType === "melee" || weaponType === "shield"

    // Explicit hand override (for 1-2H selection)
    if (handMode === "1") return half
    if (handMode === "2") return full

    // Canonical DB modes
    if (dbMode === "half") return half
    if (dbMode === "full") return full

    // Legacy DB values from seed/world data
    if (dbMode === "oneh" || dbMode === "1h") return half
    if (dbMode === "2h") return full
    if (dbMode === "none" || dbMode === "0") return isMeleeWeapon ? full : ""

    const dbNumeric = Number(dbRaw)
    if (Number.isFinite(dbNumeric)) {
      if (dbNumeric <= 0) return isMeleeWeapon ? full : ""
      return full
    }

    // SLA rule override: all melee weapons should apply damage modifier.
    if (isMeleeWeapon) return full

    return ""
  }
}
