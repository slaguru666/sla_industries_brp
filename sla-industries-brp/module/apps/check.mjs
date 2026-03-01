import { BRPactorDetails } from "./actorDetails.mjs"
import { BRPSelectLists } from "./select-lists.mjs"
import { BRPCombatRoll } from "../combat/combat-roll.mjs"
import { BRPDamage } from "../combat/damage.mjs"
import { GRCard } from "../cards/combined-card.mjs"
import { OPCard } from "../cards/opposed-card.mjs"
import { COCard } from "../cards/cooperative-card.mjs"
import { CBCard } from "../cards/combat-card.mjs"
import { SLAAmmoTracker } from "./sla-ammo-tracker.mjs"
import { SLADrugSystem } from "./sla-drug-system.mjs"
import { SLAEbbSystem } from "./sla-ebb-system.mjs"
import { SLAMentalSystem } from "./sla-mental-system.mjs"
import { SLATraitEngine } from "../traits/trait-engine.mjs"
import { SLADamageResolver } from "../combat/sla-damage-resolver.mjs"
import { SLADialog } from "./sla-dialog.mjs"
import { SLARollPipeline } from "./sla-roll-pipeline.mjs"

export class BRPCheck {
  static getChatFlags(message) {
    const systemFlags = message?.flags?.[game.system.id] ?? {};
    const legacyFlags = message?.flags?.brp ?? {};
    // Legacy brp flags may be newer on old cards; merge with legacy taking precedence.
    return { ...systemFlags, ...legacyFlags };
  }

  static getChatFlagUpdate(data = {}) {
    return {
      [`flags.${game.system.id}`]: data,
      "flags.brp": data
    };
  }

  static normaliseResistanceInput(rawValue) {
    const value = Number(rawValue)
    if (!Number.isFinite(value) || value < 0) return 0
    // Accept legacy/user-entered percent values (e.g. 65) and convert to stat scale (13).
    if (value > 25) return Math.round(value / 5)
    return value
  }

  static normaliseDiffValue(rawValue, fallback = 1) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) return Number(fallback ?? 1);
    return value;
  }

  static normaliseRollEdge(rawValue, fallback = "normal") {
    const value = String(rawValue ?? "").trim().toLowerCase();
    if (["advantage", "adv", "easy"].includes(value)) return "advantage";
    if (["disadvantage", "dis", "difficult", "hard", "extreme", "impossible", "tricky", "awkward"].includes(value)) return "disadvantage";
    if (["normal", "average"].includes(value)) return "normal";
    return String(fallback || "normal");
  }

  static rollFormulaForEdge(edge) {
    const mode = BRPCheck.normaliseRollEdge(edge);
    if (mode === "advantage") return "1D100";
    if (mode === "disadvantage") return "1D100";
    return "1D100";
  }

  static rollEdgeLabel(edge) {
    const mode = BRPCheck.normaliseRollEdge(edge);
    if (mode === "advantage") return game.i18n.localize("BRP.adv");
    if (mode === "disadvantage") return game.i18n.localize("BRP.dis");
    return game.i18n.localize("BRP.normal");
  }

  static formatSigned(value = 0) {
    return SLARollPipeline.formatSigned(value);
  }

  static buildTargetBreakdown(config = {}) {
    return SLARollPipeline.buildTargetBreakdown(config);
  }

  static getFireModeHitBonus(mode = "single") {
    switch (String(mode ?? "single").toLowerCase()) {
      case "burst":
        return 10;
      case "auto":
        return 20;
      default:
        return 0;
    }
  }

  static getFireModeHitCount(mode = "single", resultLevel = 0) {
    const level = Number(resultLevel ?? 0);
    if (level < 2) return 0;
    switch (String(mode ?? "single").toLowerCase()) {
      case "burst":
        if (level >= 4) return 3;
        if (level === 3) return 2;
        return 1;
      case "auto":
        if (level >= 4) return 6;
        if (level === 3) return 4;
        return 2;
      default:
        return 1;
    }
  }

  static buildEdgeRollText(config = {}) {
    const mode = BRPCheck.normaliseRollEdge(config.diff);
    const kept = Number(config.rollVal ?? config.rollResult ?? 0);
    const base = Number(config.edgeBaseRoll ?? kept);
    const candidate = Number(config.edgeCandidateRoll ?? kept);
    const tensRaw = Number(config.edgeTensRaw ?? 0);
    const tensDigit = Number(config.edgeTensDigit ?? 0);
    const unitsDigit = Number(config.edgeUnitsDigit ?? (base % 10));
    const rolled = String(config.diceRolled ?? "").trim();
    if (mode === "advantage") {
      return `1D100 base ${base} | Edge tens d10:${tensRaw} => ${tensDigit}${unitsDigit} (${candidate}) | keep lowest ${kept}`;
    }
    if (mode === "disadvantage") {
      return `1D100 base ${base} | Edge tens d10:${tensRaw} => ${tensDigit}${unitsDigit} (${candidate}) | keep highest ${kept}`;
    }
    return `1D100 (${rolled || kept})`;
  }

  static _unitsDigitFromPercentile(rollVal = 100) {
    const value = Math.max(1, Math.min(100, Number(rollVal ?? 100) || 100));
    return value % 10;
  }

  static _tensDigitFromD10(rollVal = 10) {
    const value = Number(rollVal ?? 10);
    if (!Number.isFinite(value)) return 0;
    return ((value % 10) + 10) % 10;
  }

  static _percentileFromDigits(tensDigit = 0, unitsDigit = 0) {
    const tens = Math.max(0, Math.min(9, Number(tensDigit ?? 0) || 0));
    const units = Math.max(0, Math.min(9, Number(unitsDigit ?? 0) || 0));
    // BRP percentile convention: 00 is read as 100.
    if (tens === 0 && units === 0) return 100;
    return (tens * 10) + units;
  }

  static async _rollPercentileWithEdge(edge = "normal") {
    const mode = BRPCheck.normaliseRollEdge(edge);
    const baseRoll = await new Roll("1D100").evaluate();
    if (mode !== "normal" && game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(baseRoll, game.user, true, null, false);
    }
    const base = Math.max(1, Math.min(100, Number(baseRoll.total ?? 100) || 100));
    const unitsDigit = BRPCheck._unitsDigitFromPercentile(base);

    if (mode === "normal") {
      return {
        mode,
        baseRoll,
        rollForChat: baseRoll,
        base,
        unitsDigit,
        tensRaw: null,
        tensDigit: null,
        candidate: base,
        kept: base,
        diceRolled: String(base)
      };
    }

    const tensRoll = await new Roll("1D10").evaluate();
    if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(tensRoll, game.user, true, null, false);
    }
    const tensRaw = Number(tensRoll.total ?? 10);
    const tensDigit = BRPCheck._tensDigitFromD10(tensRaw);
    const candidate = BRPCheck._percentileFromDigits(tensDigit, unitsDigit);
    const kept = mode === "advantage"
      ? Math.min(base, candidate)
      : Math.max(base, candidate);
    const rollForChat = await new Roll(String(kept)).evaluate();

    return {
      mode,
      baseRoll,
      tensRoll,
      rollForChat,
      base,
      unitsDigit,
      tensRaw,
      tensDigit,
      candidate,
      kept,
      diceRolled: `${base}, ${tensRaw}`
    };
  }

  //Roll Types
  //CH = Characteristic
  //SK = Skill
  //DM = Damage
  //CM = Combat
  //AR = Armour (Random)
  //AL = Allegiance Roll
  //PA - Passion Roll
  //PT - Personality Trait Roll
  //RP - Reputation Roll
  //IM - Spell Impact Roll
  //QC - Quick Combat

  //Card Types
  //NO = Normnal Roll
  //RE = Resistance Roll (CH only)
  //PP = POW v POW (CH only)
  //GR = Combined (Group) Roll
  //CO = Cooperative Roll
  //OP = Opposed Roll
  //CB = Combat Roll


  //Start to prepare the config
  static async _trigger(options = {}) {
    let config = await BRPCheck.normaliseRequest(options)
    if (config === false) { return }
    BRPCheck.startCheck(config)
    return
  }


  //Check the request and build out the config
  static async normaliseRequest(options) {
    //Set Basic Config
    let partic = await BRPactorDetails._getParticipantId(options.token, options.actor)
    let particImg = await BRPactorDetails.getParticImg(partic.particId, partic.particType)
    let particActor = await BRPactorDetails._getParticipant(partic.particId, partic.particType)
    let target = await BRPactorDetails._getTargetId()
    let weapon = ""
    let skill = ""
    let config = {
      rollType: options.rollType,
      cardType: options.cardType,
      dialogTemplate: 'systems/sla-industries-brp/templates/dialog/difficulty.html',
      chatTemplate: 'systems/sla-industries-brp/templates/chat/roll-result.html',
      state: options.state ?? "open",
      wait: options.wait ?? false,
      successLevel: -1,
      chatType: options.chatType,
      particName: partic.particName,
      particId: partic.particId,
      particType: partic.particType,
      particImg,
      targetName: target.targetName,
      targetId: target.targetId,
      targetType: target.targetType,
      characteristic: options.characteristic ?? false,
      skillId: options.skillId ?? false,
      itemId: options.itemId ?? false,
      addStat: options.addStat ?? "none",
      targetScore: options.targetScore ?? 0,
      rawScore: options.rawScore ?? 0,
      resistance: options.resistance ?? 0,
      diff: options.diff ?? "normal",
      diffVal: options.diffVal ?? 1,
      useDiffValue: game.settings.get('sla-industries-brp', 'diffValue'),
      edgeMode: options.edgeMode ?? "normal",
      rollFormula: options.rollFormula ?? "1D100",
      flatMod: options.flatMod ?? 0,
      diceMod: options.diceMod ?? 0,
      targetBase: 0,
      targetAfterManual: 0,
      targetPreCap: 0,
      targetCapApplied: 0,
      systemFlatModTotal: 0,
      totalFlatMod: 0,
      flatModSigned: "+0",
      systemModSigned: "+0",
      totalModSigned: "+0",
      fireModeHitBonus: 0,
      fireModeHitCount: 0,
      fireModeStrayRisk: false,
      targetBreakdownText: "",
      edgeRollText: "",
      resultLevel: options.resultLevel ?? 0,
      malfunction: options.malfunction ?? 0,
      shiftKey: options.shiftKey ?? false,
      needDiff: options.needDiff ?? true,
      label: options.label ?? "",
      weaponLabel: options.weaponLabel ?? "",
      specLabel: options.specLabel ?? "",
      opp: options.opp ?? "false",
      fireMode: options.fireMode ?? "single",
      askFireMode: false,
      fireModeOptions: {},
      ammoTag: "STD",
      askAmmoTag: false,
      ammoTagOptions: {},
      ammoCalibreLabel: "",
      ammoBaseCost: 0,
      ammoRoundsSpent: 0,
      ammoRoundCost: 0,
      ammoSurchargePerRound: 0,
      ammoCreditsSpent: 0,
      ammoCreditsBefore: 0,
      ammoCreditsAfter: 0,
      ammoCreditsDeficit: false,
      ammoCreditsDeficitAmount: 0,
      ammoCostTotal: 0,
      ammoSummary: "",
      ammoArmourRule: "",
      ammoDamageRule: "",
      ammoIgnoreAllArmour: false,
      ammoArmourMultiplier: 1,
      ammoBonusIgnoreArmour: "",
      drugFlatMod: 0,
      drugExtraActions: 0,
      drugDamageTakenMultiplier: 1,
      drugIgnoreFear: false,
      drugIgnoreSanity: false,
      drugIgnoreWoundPenalties: false,
      drugMoveMultiplier: 1,
      drugEffects: [],
      drugSummary: "",
      ebbFlatMod: 0,
      ebbEffects: [],
      ebbSummary: "",
      mentalFlatMod: 0,
      mentalEffects: [],
      mentalSummary: "",
      traitFlatMod: 0,
      traitEffects: [],
      traitSummary: "",
      traitRequiresCoolGate: false,
      traitAutoPassCool: false,
      traitRerollSkill: false,
      traitCoolPercentDelta: 0,
      traitRerollApplied: false,
      traitRerollVal: 0,
      traitRerollLevel: 0,
      traitCoolGateResultLevel: 0,
      description: "",
      askHand: false,
      askRange: false,
      handOptions: {},
      rangeOptions: {},
      handsUsed: "",
      rangeUsed: "dmg1",
      dmgCrit: 0,
      dmgSpec: 0,
      dmgNorm: 0,
      dmgCritForm: "",
      dmgSpecForm: "",
      dmgNormForm: "",
      dmgCritAmmoSummary: "",
      dmgSpecAmmoSummary: "",
      dmgNormAmmoSummary: "",
      firstAid: false,
      woundList: {},
      woundTreated: "",
      healing: 0,
      healingLabel: ""
    }

    //Adjust Config based on roll type
    switch (options.rollType) {
      case 'CH':
        config.label =
          String(options.label ?? "").trim()
          || particActor.system?.stats?.[config.characteristic]?.labelShort
          || String(config.characteristic ?? "").toUpperCase()
        config.rawScore = particActor.system.stats[config.characteristic].total
        config.targetScore = particActor.system.stats[config.characteristic].total * 5 ?? 0
        if (Number.isFinite(Number(options.targetScore))) {
          config.targetScore = Number(options.targetScore)
          if (Number.isFinite(Number(options.rawScore))) {
            config.rawScore = Number(options.rawScore)
          } else {
            config.rawScore = Math.round(Number(config.targetScore ?? 0) / 5)
          }
        }
        if (config.cardType === 'RE' || config.cardType === 'PP') {
          // BRP resistance rolls are percentile via opposed characteristics, not difficulty-scaled skill checks.
          config.needDiff = false
        }
        break
      case 'SK':
        skill = particActor.items.get(config.skillId)
        config.label = skill.name ?? ""
        if (options.actor.type === 'npc') {
          config.rawScore = skill.system.total
          config.targetScore = skill.system.total
        } else {
          config.rawScore = skill.system.total + (options.actor.system.skillcategory[skill.system.category] ?? 0)
          config.targetScore = skill.system.total + (options.actor.system.skillcategory[skill.system.category] ?? 0)
        }
        if (["magic", "mutation", "psychic", "sorcery", "super", "failing"].includes(skill.type)) {
          config.description = skill.system.description.replace(/(<([^>]+)>)/g, "");
        }

        //Check for First Aid
        const firstAidBrpid = skill?.flags?.[game.system.id]?.brpidFlag?.id ?? skill?.flags?.brp?.brpidFlag?.id ?? "";
        if (game.settings.get('sla-industries-brp', 'firstAidBRPID') != "" && game.settings.get('sla-industries-brp', 'firstAidBRPID') === firstAidBrpid) {
          await BRPCheck.firstAid(config)
        }

        break
      case 'AL':
      case 'PA':
      case 'RP':
        skill = particActor.items.get(config.skillId)
        config.label = skill.name ?? ""
        config.rawScore = skill.system.total
        config.targetScore = skill.system.total
        break
      case 'PT':
        skill = particActor.items.get(config.skillId)
        config.label = skill.name ?? ""
        config.rawScore = skill.system.total
        config.targetScore = skill.system.total
        if (config.opp === 'true') {
          config.label = skill.system.oppName ?? ""
          config.rawScore = skill.system.opptotal
          config.targetScore = skill.system.opptotal
        }
        break;
      case 'DM':
      case 'IM':
        weapon = particActor.items.get(config.itemId)
        config.label = weapon.name ?? ""
        if (options.rollType === 'IM') {
          config.label = config.label + " [" + game.i18n.localize('BRP.' + weapon.system.impact) + "] "
        }
        let damageData = await BRPCombatRoll.damageFormula(weapon, particActor, options.rollType, "")
        if (options.rollType === 'DM') {
          config.specLabel = game.i18n.localize('BRP.' + weapon.system.special)
        } else {
          config.specLabel = ""
        }
        config.ammoTag = damageData.ammoContext?.tag ?? BRPCombatRoll.getAmmoTag(weapon)
        config.ammoSummary = damageData.ammoContext?.summary ?? ""
        config.ammoArmourRule = damageData.ammoContext?.armourRule ?? ""
        config.ammoDamageRule = damageData.ammoContext?.damageRule ?? ""
        config.ammoIgnoreAllArmour = damageData.ammoContext?.ignoreAllArmour ?? false
        config.ammoArmourMultiplier = damageData.ammoContext?.armourMultiplier ?? 1
        config.ammoBonusIgnoreArmour = damageData.ammoContext?.bonusIgnoreArmourFormula ?? ""
        config.rollFormula = damageData.damage
        config.resultLevel = damageData.success
        config.shiftKey = true
        config.chatTemplate = 'systems/sla-industries-brp/templates/chat/roll-damage.html'
        break
      case 'CM':
        weapon = particActor.items.get(config.itemId)
        config.weaponLabel = weapon?.name ?? ""
        config.label = weapon.name ?? ""
        if (particActor.type === 'npc') {
          config.rawScore = weapon.system.npcVal
          config.targetScore = weapon.system.npcVal
        } else {
          skill = particActor.items.get(config.skillId)
          config.label = skill.name ?? ""
          config.rawScore = skill.system.total + (options.actor.system.skillcategory[skill.system.category] ?? 0)
          config.targetScore = skill.system.total + (options.actor.system.skillcategory[skill.system.category] ?? 0)
        }
        config.malfunction = weapon.system.mal
        const rawModeOptionsCM = SLAAmmoTracker.getFireModeOptions(weapon)
        config.fireModeOptions = {}
        for (const [modeKey, modeLabel] of Object.entries(rawModeOptionsCM)) {
          const roundsForMode = SLAAmmoTracker.getSpendCost(weapon, modeKey)
          config.fireModeOptions[modeKey] = `${modeLabel} (${roundsForMode} rd)`
        }
        config.askFireMode = Object.keys(config.fireModeOptions).length > 1
        if (!config.fireModeOptions[config.fireMode]) {
          config.fireMode = Object.keys(config.fireModeOptions)[0] ?? "single"
        }
        if (weapon && SLAAmmoTracker.usesAmmo(weapon)) {
          const ammoDialogData = SLAAmmoTracker.getAmmoDialogData(particActor, weapon, config.fireMode)
          config.askAmmoTag = Object.keys(ammoDialogData.ammoTagOptions ?? {}).length > 1
          config.ammoTagOptions = ammoDialogData.ammoTagOptions ?? {}
          config.ammoCalibreLabel = ammoDialogData.ammoCalibreLabel ?? ""
          config.ammoBaseCost = Number(ammoDialogData.ammoBaseCost ?? 0)
          config.ammoRoundsSpent = Number(ammoDialogData.ammoRoundsSpent ?? 0)
          config.ammoCreditsBefore = Number(ammoDialogData.actorCredits ?? 0)
          config.ammoCreditsAfter = config.ammoCreditsBefore
          config.ammoTag = SLAAmmoTracker.normalizeAllowedAmmoTag(
            weapon,
            options.ammoTag ?? ammoDialogData.ammoTagSelected ?? BRPCombatRoll.getAmmoTag(weapon)
          )
        } else {
          config.ammoTag = BRPCombatRoll.getAmmoTag(weapon)
        }
        break
      case 'AR':
        config.label = options.label
        config.rollFormula = options.AVform
        config.shiftKey = true
        config.chatTemplate = 'systems/sla-industries-brp/templates/chat/roll-armour.html'
        break
      case 'QC':
        weapon = particActor.items.get(config.itemId)
        config.weaponLabel = weapon?.name ?? ""
        config.label = weapon.name ?? ""
        if (particActor.type === 'npc') {
          config.rawScore = weapon.system.npcVal
          config.targetScore = weapon.system.npcVal
        } else {
          skill = particActor.items.get(config.skillId)
          config.label = skill.name ?? ""
          config.rawScore = skill.system.total + (options.actor.system.skillcategory[skill.system.category] ?? 0)
          config.targetScore = skill.system.total + (options.actor.system.skillcategory[skill.system.category] ?? 0)
        }
        if (weapon.system.hands === "1-2H") {
          config.handOptions = Object.assign(config.handOptions, await BRPCombatRoll.getHandOptions(weapon));
          config.askHands = true
        }
        config.rangeOptions = Object.assign(config.rangeOptions, await BRPCombatRoll.getRangeOptions(weapon));
        if (Object.keys(config.rangeOptions).length > 1) { config.askRange = true }
        config.malfunction = weapon.system.mal
        config.chatTemplate = 'systems/sla-industries-brp/templates/chat/quick-combat.html'
        config.specLabel = game.i18n.localize('BRP.' + weapon.system.special)
        const rawModeOptionsQC = SLAAmmoTracker.getFireModeOptions(weapon)
        config.fireModeOptions = {}
        for (const [modeKey, modeLabel] of Object.entries(rawModeOptionsQC)) {
          const roundsForMode = SLAAmmoTracker.getSpendCost(weapon, modeKey)
          config.fireModeOptions[modeKey] = `${modeLabel} (${roundsForMode} rd)`
        }
        config.askFireMode = Object.keys(config.fireModeOptions).length > 1
        if (!config.fireModeOptions[config.fireMode]) {
          config.fireMode = Object.keys(config.fireModeOptions)[0] ?? "single"
        }
        if (weapon && SLAAmmoTracker.usesAmmo(weapon)) {
          const ammoDialogData = SLAAmmoTracker.getAmmoDialogData(particActor, weapon, config.fireMode)
          config.askAmmoTag = Object.keys(ammoDialogData.ammoTagOptions ?? {}).length > 1
          config.ammoTagOptions = ammoDialogData.ammoTagOptions ?? {}
          config.ammoCalibreLabel = ammoDialogData.ammoCalibreLabel ?? ""
          config.ammoBaseCost = Number(ammoDialogData.ammoBaseCost ?? 0)
          config.ammoRoundsSpent = Number(ammoDialogData.ammoRoundsSpent ?? 0)
          config.ammoCreditsBefore = Number(ammoDialogData.actorCredits ?? 0)
          config.ammoCreditsAfter = config.ammoCreditsBefore
          config.ammoTag = SLAAmmoTracker.normalizeAllowedAmmoTag(
            weapon,
            options.ammoTag ?? ammoDialogData.ammoTagSelected ?? BRPCombatRoll.getAmmoTag(weapon)
          )
        } else {
          config.ammoTag = BRPCombatRoll.getAmmoTag(weapon)
        }

        break
      default:
        ui.notifications.error(options.rollType + ": " + game.i18n.format('BRP.errorRollInvalid'))
        return false


    }

    //Adjust Config based on card type
    switch (options.cardType) {
      case 'NO':
        config.state = 'closed'
        break
      case 'RE':
      case 'PP':
        config.needDiff = false
        config.shiftKey = false
        config.state = 'closed'
        break
      case 'GR':
        config.wait = true
        config.chatType = CONST.CHAT_MESSAGE_STYLES.OTHER
        config.chatTemplate = 'systems/sla-industries-brp/templates/chat/roll-combined.html'
        break
      case 'OP':
        config.chatType = CONST.CHAT_MESSAGE_STYLES.OTHER
        config.chatTemplate = 'systems/sla-industries-brp/templates/chat/roll-opposed.html'
        break
      case 'CO':
        config.chatType = CONST.CHAT_MESSAGE_STYLES.OTHER
        config.chatTemplate = 'systems/sla-industries-brp/templates/chat/roll-cooperative.html'
        break
      case 'CB':
        config.chatType = CONST.CHAT_MESSAGE_STYLES.OTHER
        config.chatTemplate = 'systems/sla-industries-brp/templates/chat/roll-combat.html'
        break
      default:
        ui.notifications.error(options.cardType + ": " + game.i18n.format('BRP.errorCardInvalid'))
        return false
    }

    if (particActor?.type === "character") {
      const drugPreview = await SLADrugSystem.getCheckContext(particActor, config, { preview: true })
      config.drugFlatMod = Number(drugPreview.flatMod ?? 0)
      config.drugExtraActions = Number(drugPreview.extraActions ?? 0)
      config.drugDamageTakenMultiplier = Number(drugPreview.damageTakenMultiplier ?? 1)
      config.drugIgnoreFear = Boolean(drugPreview.ignoreFear)
      config.drugIgnoreSanity = Boolean(drugPreview.ignoreSanity)
      config.drugIgnoreWoundPenalties = Boolean(drugPreview.ignoreWoundPenalties)
      config.drugMoveMultiplier = Number(drugPreview.moveMultiplier ?? 1)
      config.drugEffects = Array.isArray(drugPreview.effects) ? drugPreview.effects : []
      config.drugSummary = String(drugPreview.summary ?? "")

      const ebbPreview = await SLAEbbSystem.getCheckContext(particActor, config, { preview: true })
      config.ebbFlatMod = Number(ebbPreview.flatMod ?? 0)
      config.ebbEffects = Array.isArray(ebbPreview.effects) ? ebbPreview.effects : []
      config.ebbSummary = String(ebbPreview.summary ?? "")

      const mentalPreview = await SLAMentalSystem.getCheckContext(particActor, config, { preview: true })
      config.mentalFlatMod = Number(mentalPreview.flatMod ?? 0)
      config.mentalEffects = Array.isArray(mentalPreview.effects) ? mentalPreview.effects : []
      config.mentalSummary = String(mentalPreview.summary ?? "")

      const traitPreview = await SLATraitEngine.getCheckContext(particActor, config, { preview: true })
      config.traitFlatMod = Number(traitPreview.flatMod ?? 0)
      config.traitEffects = Array.isArray(traitPreview.effects) ? traitPreview.effects : []
      config.traitSummary = String(traitPreview.summary ?? "")
      config.traitRequiresCoolGate = Boolean(traitPreview.requiresCoolGate)
      config.traitAutoPassCool = Boolean(traitPreview.autoPassCool)
      config.traitRerollSkill = Boolean(traitPreview.rerollSkill)
      config.traitCoolPercentDelta = Number(traitPreview.coolPercentDelta ?? 0)
    }

    return config

  }


  //Start the check now that the config has been prepared
  static async startCheck(config) {
    let actor = await BRPactorDetails._getParticipant(config.particId, config.particType)
    const forceDialog = config.askAmmoTag || config.askHands || config.askRange || config.firstAid
    //If Shift key has been held then accept defaults unless this roll still needs extra inputs
    if (!config.shiftKey || forceDialog) {
      let usage = await BRPCheck.RollDialog(config)
      if (!usage) {
        return
      }
      config.diff = BRPCheck.normaliseRollEdge(usage.get('difficulty') ?? config.diff)
      config.addStat = usage.get('addStat')
      config.resistance = BRPCheck.normaliseResistanceInput(usage.get('resistance'))
      config.flatMod = Number(usage.get('flatMod'))
      config.diffVal = BRPCheck.normaliseDiffValue(usage.get('diffVal'), config.diffVal)
      if (config.askHands) {
        config.handsUsed = usage.get('hands')
      }
      if (config.askRange) {
        config.rangeUsed = usage.get('range')
      }
      if (config.firstAid) {
        config.woundTreated = usage.get('wound')
      }
      if (config.askFireMode) {
        config.fireMode = String(usage.get('fireMode') ?? config.fireMode ?? "single")
      }
      if (config.askAmmoTag) {
        config.ammoTag = SLAAmmoTracker.normalizeAmmoTag(usage.get('ammoTag') ?? config.ammoTag)
      }
    }

    //If this is a resistance roll and a second characteristic has been added updated chances and label
    if (config.addStat != 'none' && config.cardType === 'RE') {
      config.label = config.label + ' & ' + actor.system.stats[config.addStat].labelShort
      config.targetScore = config.targetScore + (actor.system.stats[config.addStat].total * 5)
    }

    const isResistanceFlow = (config.cardType === 'RE' || config.cardType === 'PP')
    config.targetBase = Number(config.targetScore ?? 0)

    //Adjust roll edge and modifiers for percentile checks (not used for BRP resistance/PvP characteristic rolls).
    const supportsRollEdge = ['CH', 'SK', 'CM', 'QC', 'AL', 'PA', 'PT', 'RP'].includes(String(config.rollType))
    if (supportsRollEdge && !isResistanceFlow) {
      config.diff = BRPCheck.normaliseRollEdge(config.diff)
      // Legacy numeric multipliers are mapped to edge modes so old macros/cards still behave predictably.
      if (config.diff === "normal" && Number.isFinite(Number(config.diffVal))) {
        if (Number(config.diffVal) > 1) config.diff = "advantage"
        else if (Number(config.diffVal) < 1) config.diff = "disadvantage"
      }
      config.edgeMode = config.diff
      config.targetScore = Number(config.targetScore) + Number(config.flatMod)
      config.rollFormula = BRPCheck.rollFormulaForEdge(config.diff)
    }
    config.targetAfterManual = Number(config.targetScore ?? 0)

    //For Resistance and PvP recalc the Targetscore
    if (isResistanceFlow) {
      config.targetScore = (((config.targetScore / 5) - config.resistance) * 5) + 50
      //Change target score bases on game setting options
      if (game.settings.get('sla-industries-brp', 'resistRoll')) {
        config.targetScore = Math.max(config.targetScore, 1)
        config.targetScore = Math.min(config.targetScore, 99)
      } else {
        config.targetScore = Math.max(config.targetScore, 0)
        config.targetScore = Math.min(config.targetScore, 100)
      }
    }

    if (actor?.type === "character") {
      const drugContext = await SLADrugSystem.getCheckContext(actor, config)
      config.drugFlatMod = Number(drugContext.flatMod ?? 0)
      config.drugExtraActions = Number(drugContext.extraActions ?? 0)
      config.drugDamageTakenMultiplier = Number(drugContext.damageTakenMultiplier ?? 1)
      config.drugIgnoreFear = Boolean(drugContext.ignoreFear)
      config.drugIgnoreSanity = Boolean(drugContext.ignoreSanity)
      config.drugIgnoreWoundPenalties = Boolean(drugContext.ignoreWoundPenalties)
      config.drugMoveMultiplier = Number(drugContext.moveMultiplier ?? 1)
      config.drugEffects = Array.isArray(drugContext.effects) ? drugContext.effects : []
      config.drugSummary = String(drugContext.summary ?? "")

      if (!isResistanceFlow && config.drugFlatMod !== 0) {
        config.targetScore = Number(config.targetScore) + Number(config.drugFlatMod)
        if (config.cardType === 'RE' || config.cardType === 'PP') {
          if (game.settings.get('sla-industries-brp', 'resistRoll')) {
            config.targetScore = Math.max(config.targetScore, 1)
            config.targetScore = Math.min(config.targetScore, 99)
          } else {
            config.targetScore = Math.max(config.targetScore, 0)
            config.targetScore = Math.min(config.targetScore, 100)
          }
        }
      }

      const ebbContext = await SLAEbbSystem.getCheckContext(actor, config)
      config.ebbFlatMod = Number(ebbContext.flatMod ?? 0)
      config.ebbEffects = Array.isArray(ebbContext.effects) ? ebbContext.effects : []
      config.ebbSummary = String(ebbContext.summary ?? "")
      if (!isResistanceFlow && config.ebbFlatMod !== 0) {
        config.targetScore = Number(config.targetScore) + Number(config.ebbFlatMod)
        if (config.cardType === 'RE' || config.cardType === 'PP') {
          if (game.settings.get('sla-industries-brp', 'resistRoll')) {
            config.targetScore = Math.max(config.targetScore, 1)
            config.targetScore = Math.min(config.targetScore, 99)
          } else {
            config.targetScore = Math.max(config.targetScore, 0)
            config.targetScore = Math.min(config.targetScore, 100)
          }
        }
      }

      const mentalContext = await SLAMentalSystem.getCheckContext(actor, config)
      config.mentalFlatMod = Number(mentalContext.flatMod ?? 0)
      config.mentalEffects = Array.isArray(mentalContext.effects) ? mentalContext.effects : []
      config.mentalSummary = String(mentalContext.summary ?? "")
      if (!isResistanceFlow && config.mentalFlatMod !== 0) {
        config.targetScore = Number(config.targetScore) + Number(config.mentalFlatMod)
        if (config.cardType === 'RE' || config.cardType === 'PP') {
          if (game.settings.get('sla-industries-brp', 'resistRoll')) {
            config.targetScore = Math.max(config.targetScore, 1)
            config.targetScore = Math.min(config.targetScore, 99)
          } else {
            config.targetScore = Math.max(config.targetScore, 0)
            config.targetScore = Math.min(config.targetScore, 100)
          }
        }
      }

      const traitContext = await SLATraitEngine.getCheckContext(actor, config)
      config.traitFlatMod = Number(traitContext.flatMod ?? 0)
      config.traitEffects = Array.isArray(traitContext.effects) ? traitContext.effects : []
      config.traitSummary = String(traitContext.summary ?? "")
      config.traitRequiresCoolGate = Boolean(traitContext.requiresCoolGate)
      config.traitAutoPassCool = Boolean(traitContext.autoPassCool)
      config.traitRerollSkill = Boolean(traitContext.rerollSkill)
      config.traitCoolPercentDelta = Number(traitContext.coolPercentDelta ?? 0)

      if (!isResistanceFlow && config.traitFlatMod !== 0) {
        config.targetScore = Number(config.targetScore) + Number(config.traitFlatMod)
        if (config.cardType === 'RE' || config.cardType === 'PP') {
          if (game.settings.get('sla-industries-brp', 'resistRoll')) {
            config.targetScore = Math.max(config.targetScore, 1)
            config.targetScore = Math.min(config.targetScore, 99)
          } else {
            config.targetScore = Math.max(config.targetScore, 0)
            config.targetScore = Math.min(config.targetScore, 100)
          }
        }
      }
    }

    if (["CM", "QC"].includes(String(config.rollType))) {
      config.fireModeHitBonus = BRPCheck.getFireModeHitBonus(config.fireMode);
      if (config.fireModeHitBonus !== 0) {
        config.targetScore = Number(config.targetScore ?? 0) + Number(config.fireModeHitBonus);
      }
    } else {
      config.fireModeHitBonus = 0;
    }

    config.systemFlatModTotal = Number(config.drugFlatMod ?? 0) + Number(config.ebbFlatMod ?? 0) + Number(config.mentalFlatMod ?? 0) + Number(config.traitFlatMod ?? 0)
    config.totalFlatMod = Number(config.flatMod ?? 0) + Number(config.systemFlatModTotal ?? 0) + Number(config.fireModeHitBonus ?? 0)
    config.flatModSigned = BRPCheck.formatSigned(config.flatMod)
    config.systemModSigned = BRPCheck.formatSigned(config.systemFlatModTotal)
    config.totalModSigned = BRPCheck.formatSigned(config.totalFlatMod)
    config.targetPreCap = Number(config.targetScore ?? 0)

    // SLA creation hard cap: skill-based checks cannot exceed creation cap while creation mode is active.
    if (
      actor?.type === "character"
      && actor.system?.creationMode
      && ["SK", "CM", "QC"].includes(String(config.rollType))
    ) {
      const cap = Number(game.brp?.SLASkillPoints?.getCreationCapForActor?.(actor) ?? 75);
      const beforeCapRaw = Number(config.rawScore ?? 0);
      const beforeCapTarget = Number(config.targetScore ?? 0);
      config.rawScore = Math.min(cap, Number(config.rawScore ?? 0));
      config.targetScore = Math.min(cap, Number(config.targetScore ?? 0));
      config.targetCapApplied = Math.max(0, beforeCapTarget - Number(config.targetScore ?? 0));
      // Keep base aligned with capped raw values when creation rules force the ceiling.
      if (beforeCapRaw !== Number(config.rawScore ?? 0) && Number(config.targetBase ?? 0) > cap) {
        config.targetBase = Number(config.rawScore ?? 0);
      }
    }

    config.targetBreakdownText = BRPCheck.buildTargetBreakdown(config)

    if (actor?.type === "character" && ["CM", "QC"].includes(String(config.rollType)) && config.traitRequiresCoolGate) {
      const coolGate = await SLAMentalSystem.coolCheck({
        actor,
        edge: "normal",
        modifier: 0,
        reason: "Trait gate: Pacifist requires COOL pass to attack"
      });
      config.traitCoolGateResultLevel = Number(coolGate?.resultLevel ?? 1);
      if (Number(coolGate?.resultLevel ?? 1) < 2) {
        ui.notifications.warn(`${actor.name}: attack aborted by trait gate (COOL check failed).`);
        return;
      }
    }

    if (!config.wait) {
      const ammoResult = await SLAAmmoTracker.consumeForCheck(config, actor)
      if (!ammoResult.ok) {
        return
      }
      if (!ammoResult.skipped) {
        config.ammoTag = ammoResult.ammoTag ?? config.ammoTag
        config.ammoRoundCost = Number(ammoResult.ammoRoundCost ?? config.ammoRoundCost ?? 0)
        config.ammoSurchargePerRound = Number(ammoResult.ammoSurchargePerRound ?? config.ammoSurchargePerRound ?? 0)
        config.ammoRoundsSpent = Number(ammoResult.rounds ?? config.ammoRoundsSpent ?? 0)
        config.fireMode = String(ammoResult.mode ?? config.fireMode ?? "single")
        if (["CM", "QC"].includes(String(config.rollType))) {
          const nextFireModeBonus = BRPCheck.getFireModeHitBonus(config.fireMode)
          const fireModeDelta = Number(nextFireModeBonus ?? 0) - Number(config.fireModeHitBonus ?? 0)
          if (fireModeDelta !== 0) {
            config.fireModeHitBonus = nextFireModeBonus
            config.targetScore = Number(config.targetScore ?? 0) + fireModeDelta
            config.targetPreCap = Number(config.targetScore ?? 0)
            config.totalFlatMod = Number(config.flatMod ?? 0) + Number(config.systemFlatModTotal ?? 0) + Number(config.fireModeHitBonus ?? 0)
            config.totalModSigned = BRPCheck.formatSigned(config.totalFlatMod)
          }
        }
        config.ammoCreditsSpent = Number(ammoResult.ammoCreditsSpent ?? config.ammoCreditsSpent ?? 0)
        config.ammoCreditsBefore = Number(ammoResult.ammoCreditsBefore ?? config.ammoCreditsBefore ?? 0)
        config.ammoCreditsAfter = Number(ammoResult.ammoCreditsAfter ?? config.ammoCreditsAfter ?? 0)
        config.ammoCreditsDeficit = Boolean(ammoResult.ammoCreditsDeficit ?? config.ammoCreditsDeficit)
        config.ammoCreditsDeficitAmount = Number(ammoResult.ammoCreditsDeficitAmount ?? config.ammoCreditsDeficitAmount ?? 0)
        config.ammoCostTotal = Number(ammoResult.ammoCostTotal ?? config.ammoCostTotal ?? 0)
        config.targetBreakdownText = BRPCheck.buildTargetBreakdown(config)
      }
      await BRPCheck.makeRoll(config)
    }

    //Format the data so it's in the same format as will be held in the Chat Message when saved
    let diffLabel = config.needDiff ? BRPCheck.rollEdgeLabel(config.diff) : game.i18n.localize("BRP.none")
    const edgeHeaderLabel = config.needDiff ? `${diffLabel} Roll` : game.i18n.localize('BRP.card.NO')

    let chatMsgData = {
      rollType: config.rollType,
      cardType: config.cardType,
      chatType: config.chatType,
      chatTemplate: config.chatTemplate,
      state: config.state,
      wait: config.wait,
      rolls: config.roll,
      successLevel: config.successLevel,
      rollResult: config.rollResult,
      edgeHeaderLabel,
      chatCard: [{
        rollType: config.rollType,
        particName: config.particName,
        particId: config.particId,
        particType: config.particType,
        particImg: config.particImg,
        targetName: config.targetName,
        targetId: config.targetId,
        targetType: config.targetType,
        characteristic: config.characteristic ?? false,
        label: config.label,
        weaponLabel: config.weaponLabel,
        skillId: config.skillId,
        itemId: config.itemId,
        addStat: config.addStat,
        targetScore: config.targetScore,
        rawScore: config.rawScore,
        resistance: config.resistance,
        diff: config.diff,
        edgeMode: config.edgeMode,
        diffVal: config.diffVal,
        useDiffValue: config.useDiffValue,
        diffLabel: diffLabel,
        rollFormula: config.rollFormula,
        flatMod: config.flatMod,
        flatModSigned: config.flatModSigned,
        systemFlatModTotal: config.systemFlatModTotal,
        systemModSigned: config.systemModSigned,
        totalFlatMod: config.totalFlatMod,
        totalModSigned: config.totalModSigned,
        targetBase: config.targetBase,
        targetAfterManual: config.targetAfterManual,
        targetPreCap: config.targetPreCap,
        targetCapApplied: config.targetCapApplied,
        targetBreakdownText: config.targetBreakdownText,
        diceMod: config.diceMod,
        malfunction: config.malfunction,
        rollResult: config.rollResult,
        rollVal: config.rollVal,
        roll: config.roll,
        diceRolled: config.diceRolled,
        edgeRollText: config.edgeRollText,
        resultLevel: config.resultLevel,
        resultLabel: game.i18n.localize('BRP.resultLevel.' + config.resultLevel),
        specLabel: config.specLabel,
        opp: config.opp,
        fireMode: config.fireMode,
        fireModeHitBonus: config.fireModeHitBonus,
        fireModeHitCount: config.fireModeHitCount,
        fireModeStrayRisk: config.fireModeStrayRisk,
        ammoTag: config.ammoTag,
        ammoCalibreLabel: config.ammoCalibreLabel,
        ammoBaseCost: config.ammoBaseCost,
        ammoRoundCost: config.ammoRoundCost,
        ammoSurchargePerRound: config.ammoSurchargePerRound,
        ammoRoundsSpent: config.ammoRoundsSpent,
        ammoCreditsSpent: config.ammoCreditsSpent,
        ammoCreditsBefore: config.ammoCreditsBefore,
        ammoCreditsAfter: config.ammoCreditsAfter,
        ammoCreditsDeficit: config.ammoCreditsDeficit,
        ammoCreditsDeficitAmount: config.ammoCreditsDeficitAmount,
        ammoCostTotal: config.ammoCostTotal,
        ammoSummary: config.ammoSummary,
        ammoArmourRule: config.ammoArmourRule,
        ammoDamageRule: config.ammoDamageRule,
        ammoIgnoreAllArmour: config.ammoIgnoreAllArmour,
        ammoArmourMultiplier: config.ammoArmourMultiplier,
        ammoBonusIgnoreArmour: config.ammoBonusIgnoreArmour,
        drugFlatMod: config.drugFlatMod,
        drugExtraActions: config.drugExtraActions,
        drugDamageTakenMultiplier: config.drugDamageTakenMultiplier,
        drugIgnoreFear: config.drugIgnoreFear,
        drugIgnoreSanity: config.drugIgnoreSanity,
        drugIgnoreWoundPenalties: config.drugIgnoreWoundPenalties,
        drugMoveMultiplier: config.drugMoveMultiplier,
        drugEffects: config.drugEffects,
        drugSummary: config.drugSummary,
        ebbFlatMod: config.ebbFlatMod,
        ebbEffects: config.ebbEffects,
        ebbSummary: config.ebbSummary,
        mentalFlatMod: config.mentalFlatMod,
        mentalEffects: config.mentalEffects,
        mentalSummary: config.mentalSummary,
        traitFlatMod: config.traitFlatMod,
        traitEffects: config.traitEffects,
        traitSummary: config.traitSummary,
        traitRequiresCoolGate: config.traitRequiresCoolGate,
        traitAutoPassCool: config.traitAutoPassCool,
        traitRerollSkill: config.traitRerollSkill,
        traitCoolPercentDelta: config.traitCoolPercentDelta,
        traitRerollApplied: config.traitRerollApplied,
        traitRerollVal: config.traitRerollVal,
        traitRerollLevel: config.traitRerollLevel,
        traitCoolGateResultLevel: config.traitCoolGateResultLevel,
        description: config.description,
        dmgCrit: config.dmgCrit,
        dmgSpec: config.dmgSpec,
        dmgNorm: config.dmgNorm,
        dmgCritForm: config.dmgCritForm,
        dmgSpecForm: config.dmgSpecForm,
        dmgNormForm: config.dmgNormForm,
        dmgCritAmmoSummary: config.dmgCritAmmoSummary,
        dmgSpecAmmoSummary: config.dmgSpecAmmoSummary,
        dmgNormAmmoSummary: config.dmgNormAmmoSummary,
        healing: config.healing,
        healingLabel: config.healingLabel,
        showDebug: Boolean(game.settings.get("sla-industries-brp", "debugRollOverlay")),
        debugPayload: SLARollPipeline.debugPayload(config)
      }]
    }


    //Create the ChatMessage and Roll Dice
    if (['GR', 'OP', 'CO', 'CB'].includes(config.cardType)) {
      let checkMsgId = await BRPCheck.checkNewMsg(chatMsgData)
      if (checkMsgId != false) {
        //Trigger adding check to the card.
        await GRCard.GRAdd(chatMsgData, checkMsgId)
        return
      }
    }


    const html = await BRPCheck.startChat(chatMsgData)
    let msgId = await BRPCheck.showChat(html, chatMsgData)

    //Check for adding Improvement tick depending on autoXP game setting
    if (actor.type === 'character' && ["1", "2"].includes(game.settings.get('sla-industries-brp', 'autoXP'))) {
      await BRPCheck.tickXP(chatMsgData)
    }

    return msgId
  }

  //Call Dice Roll, calculate Result and store original results in rollVal
  static async makeRoll(config) {
    const percentileEdgeRoll = ['CH', 'SK', 'CM', 'QC', 'AL', 'PA', 'PT', 'RP'].includes(String(config.rollType))
      && !['RE', 'PP'].includes(String(config.cardType));

    if (percentileEdgeRoll) {
      try {
        const edgeRoll = await BRPCheck._rollPercentileWithEdge(config.diff);
        config.roll = edgeRoll.rollForChat;
        config.rollResult = Number(edgeRoll.kept);
        config.rollVal = Number(config.rollResult);
        config.diceRolled = String(edgeRoll.diceRolled ?? config.rollResult);
        config.edgeBaseRoll = Number(edgeRoll.base ?? config.rollResult);
        config.edgeCandidateRoll = Number(edgeRoll.candidate ?? config.rollResult);
        config.edgeTensRaw = Number(edgeRoll.tensRaw ?? 0);
        config.edgeTensDigit = Number(edgeRoll.tensDigit ?? 0);
        config.edgeUnitsDigit = Number(edgeRoll.unitsDigit ?? (config.rollResult % 10));
        config.edgeRollText = BRPCheck.buildEdgeRollText(config);
      } catch (err) {
        console.error("sla-industries-brp | edge roll failed, falling back to normal 1D100", err);
        const fallbackRoll = new Roll("1D100");
        await fallbackRoll.evaluate();
        config.roll = fallbackRoll;
        config.rollResult = Number(fallbackRoll.total);
        config.rollVal = Number(config.rollResult);
        config.diceRolled = String(config.rollResult);
        config.edgeRollText = `1D100 (${config.rollResult})`;
      }
    } else {
      let roll = new Roll(config.rollFormula)
      await roll.evaluate()
      config.roll = roll
      config.rollResult = Number(roll.total)
      config.rollVal = Number(config.rollResult)

      let diceRolled = ""
      for (let diceRoll = 0; diceRoll < roll.dice.length; diceRoll++) {
        for (let thisDice = 0; thisDice < roll.dice[diceRoll].values.length; thisDice++) {
          if (thisDice != 0 || diceRoll != 0) {
            diceRolled = diceRolled + ", "
          }
          diceRolled = diceRolled + roll.dice[diceRoll].values[thisDice]
        }
      }
      config.diceRolled = diceRolled
      config.edgeRollText = BRPCheck.buildEdgeRollText(config)
    }

    //Don't need success levels in some cases
    if (['DM', 'AR', 'IM'].includes(config.rollType)) { return }

    //Get the level of Success
    config.resultLevel = await BRPCheck.successLevel(config)

    if (
      config.traitRerollSkill
      && Number(config.resultLevel ?? 0) < 2
      && ['SK', 'CM', 'QC', 'AL', 'PA', 'PT', 'RP'].includes(String(config.rollType))
    ) {
      const reroll = await BRPCheck._rollPercentileWithEdge(config.diff);
      const rerollVal = Number(reroll?.kept ?? 100);
      const rerollLevel = await BRPCheck.successLevel({
        ...config,
        rollVal: rerollVal
      });
      config.traitRerollApplied = true;
      config.traitRerollVal = rerollVal;
      config.traitRerollLevel = rerollLevel;
      if (rerollLevel > Number(config.resultLevel ?? 0)) {
        config.roll = reroll.rollForChat;
        config.rollResult = Number(reroll.kept);
        config.rollVal = Number(reroll.kept);
        config.diceRolled = String(reroll.diceRolled ?? rerollVal);
        config.edgeBaseRoll = Number(reroll.base ?? rerollVal);
        config.edgeCandidateRoll = Number(reroll.candidate ?? rerollVal);
        config.edgeTensRaw = Number(reroll.tensRaw ?? 0);
        config.edgeTensDigit = Number(reroll.tensDigit ?? 0);
        config.edgeUnitsDigit = Number(reroll.unitsDigit ?? (rerollVal % 10));
        config.edgeRollText = `${String(config.edgeRollText ?? "")} | Natural Aptitude reroll: ${BRPCheck.buildEdgeRollText({
          ...config,
          rollVal: rerollVal,
          edgeBaseRoll: Number(reroll.base ?? rerollVal),
          edgeCandidateRoll: Number(reroll.candidate ?? rerollVal),
          edgeTensRaw: Number(reroll.tensRaw ?? 0),
          edgeTensDigit: Number(reroll.tensDigit ?? 0),
          edgeUnitsDigit: Number(reroll.unitsDigit ?? (rerollVal % 10)),
          diceRolled: String(reroll.diceRolled ?? rerollVal)
        })}`.trim();
        config.resultLevel = rerollLevel;
        config.traitSummary = String(config.traitSummary ?? "").trim();
        config.traitSummary = [config.traitSummary, `Natural Aptitude reroll applied (${rerollVal})`].filter(Boolean).join("; ");
      } else {
        config.edgeRollText = `${String(config.edgeRollText ?? "")} | Natural Aptitude reroll held at ${rerollVal}`.trim();
        config.traitSummary = String(config.traitSummary ?? "").trim();
        config.traitSummary = [config.traitSummary, `Natural Aptitude reroll used (no improvement)`].filter(Boolean).join("; ");
      }

      try {
        const actorForTrait = await BRPactorDetails._getParticipant(config.particId, config.particType);
        await SLATraitEngine.consumeSessionAbility(actorForTrait, "natural-aptitude-skill", "skill-reroll");
      } catch (err) {
        console.warn("sla-industries-brp | trait reroll session consume failed", err);
      }
    }

    //If a Combat Roll and with a malfunction chance > 0 then make the check
    if (config.rollType === 'CM' && config.malfunction > 0 && config.rollVal >= config.malfunction) {
      config.malfunction = -config.malfunction
    }

    //If Resistance roll and not using detailed results then change result to simple Success/Failure
    if ((config.cardType === 'RE' || config.cardType === 'PP') && !game.settings.get('sla-industries-brp', 'resistLevels')) {
      if (config.resultLevel > 2) { config.resultLevel = 2 }
      if (config.resultLevel < 1) { config.resultLevel = 1 }
    }

    if (['CM', 'QC'].includes(config.rollType)) {
      config.fireModeHitCount = BRPCheck.getFireModeHitCount(config.fireMode, config.resultLevel)
      config.fireModeStrayRisk = (String(config.fireMode ?? "single").toLowerCase() === "auto" && Number(config.resultLevel ?? 0) === 0)
      let ammoActor = await BRPactorDetails._getParticipant(config.particId, config.particType)
      let ammoWeapon = await ammoActor.items.get(config.itemId)
      if (ammoWeapon) {
        const ammoContext = BRPCombatRoll.getAmmoContext(ammoWeapon, String(config.resultLevel), config.ammoTag)
        config.ammoTag = ammoContext.tag
        config.ammoSummary = ammoContext.summary
        config.ammoArmourRule = ammoContext.armourRule
        config.ammoDamageRule = ammoContext.damageRule
        config.ammoIgnoreAllArmour = ammoContext.ignoreAllArmour
        config.ammoArmourMultiplier = ammoContext.armourMultiplier
        config.ammoBonusIgnoreArmour = ammoContext.bonusIgnoreArmourFormula
      }
    } else {
      config.fireModeHitCount = 0
      config.fireModeStrayRisk = false
    }

    //If Successful Quick Combat Roll then get the damage scores
    if (config.rollType === 'QC' && config.resultLevel > 1) {
      let actor = await BRPactorDetails._getParticipant(config.particId, config.particType)
      let weapon = await actor.items.get(config.itemId)
      let damBon = await BRPCombatRoll.getDamageBonus(actor, weapon, config.handsUsed)
      let damForm = weapon.system[config.rangeUsed]

      config.dmgCritForm = await BRPCombatRoll.damageAssess(weapon, damForm, damBon, "4", "DM", config.ammoTag)
      config.dmgSpecForm = await BRPCombatRoll.damageAssess(weapon, damForm, damBon, "3", "DM", config.ammoTag)
      config.dmgNormForm = await BRPCombatRoll.damageAssess(weapon, damForm, damBon, "2", "DM", config.ammoTag)
      config.dmgCritAmmoSummary = BRPCombatRoll.getAmmoContext(weapon, "4", config.ammoTag).summary
      config.dmgSpecAmmoSummary = BRPCombatRoll.getAmmoContext(weapon, "3", config.ammoTag).summary
      config.dmgNormAmmoSummary = BRPCombatRoll.getAmmoContext(weapon, "2", config.ammoTag).summary

      let critRoll = new Roll(config.dmgCritForm)
      await critRoll.evaluate()
      config.dmgCrit = Number(critRoll.total)
      let specRoll = new Roll(config.dmgSpecForm)
      await specRoll.evaluate()
      config.dmgSpec = Number(specRoll.total)
      let normRoll = new Roll(config.dmgNormForm)
      await normRoll.evaluate()
      config.dmgNorm = Number(normRoll.total)
    }

    //If First Aid Roll
    if (config.firstAid) {
      let healing = []
      healing = await BRPDamage.applyHealing(config.woundTreated, config.resultLevel)
      config.healing = healing.value
      config.healingLabel = healing.formula
    }
    return
  }



  //Function to call the Difficulty & Modifier Dialog box
  static async RollDialog(options) {
    let data = ""
    const addStatOptions = await BRPSelectLists.addStatOptions(options.characteristic)
    const difficultyOptions = await BRPSelectLists.getDifficultyOptions()
    switch (options.rollType) {
      case 'DM':
      case 'IM':
        data = {
          type: options.rollType,
          rangeOptions: options.rangeOptions,
          handOptions: options.handOptions,
          successOptions: options.successOptions,
          label: options.label,
          drugSummary: options.drugSummary,
          drugFlatMod: options.drugFlatMod,
          drugExtraActions: options.drugExtraActions,
          mentalSummary: options.mentalSummary,
          mentalFlatMod: options.mentalFlatMod,
          traitSummary: options.traitSummary,
          traitFlatMod: options.traitFlatMod,
          askHands: options.askHands,
          askRange: options.askRange,
          askSuccess: options.askSuccess,
          askLevel: options.askLevel
        }
        break
      case 'CH':
        const difficultyCHOptions = await BRPSelectLists.getCHDifficultyOptions()
        data = {
          type: options.rollType,
          addStat: options.addStat,
          resistance: options.resistance,
          diffVal: options.diffVal,
          flatMod: options.flatMod,
          cardType: options.cardType,
          needDiff: options.needDiff,
          useDiffValue: options.useDiffValue,
          label: options.label,
          drugSummary: options.drugSummary,
          drugFlatMod: options.drugFlatMod,
          drugExtraActions: options.drugExtraActions,
          mentalSummary: options.mentalSummary,
          mentalFlatMod: options.mentalFlatMod,
          traitSummary: options.traitSummary,
          traitFlatMod: options.traitFlatMod,
          diff: options.diff,
          difficultyOptions: difficultyCHOptions,
          addStatOptions,
        }
        break
      case 'QC':
        data = {
          type: options.rollType,
          weaponLabel: options.weaponLabel,
          resistance: options.resistance,
          diffVal: options.diffVal,
          flatMod: options.flatMod,
          cardType: options.cardType,
          needDiff: options.needDiff,
          useDiffValue: options.useDiffValue,
          label: options.label,
          drugSummary: options.drugSummary,
          drugFlatMod: options.drugFlatMod,
          drugExtraActions: options.drugExtraActions,
          mentalSummary: options.mentalSummary,
          mentalFlatMod: options.mentalFlatMod,
          traitSummary: options.traitSummary,
          traitFlatMod: options.traitFlatMod,
          diff: options.diff,
          difficultyOptions: difficultyOptions,
          askHands: options.askHands,
          askRange: options.askRange,
          rangeOptions: options.rangeOptions,
          handOptions: options.handOptions,
          askFireMode: options.askFireMode,
          fireMode: options.fireMode,
          fireModeOptions: options.fireModeOptions,
          askAmmoTag: options.askAmmoTag,
          ammoTag: options.ammoTag,
          ammoTagOptions: options.ammoTagOptions,
          ammoCalibreLabel: options.ammoCalibreLabel,
          ammoBaseCost: options.ammoBaseCost,
          ammoRoundsSpent: options.ammoRoundsSpent
        }
        break

      default:

        data = {
          type: options.rollType,
          weaponLabel: options.weaponLabel,
          addStat: options.addStat,
          resistance: options.resistance,
          diffVal: options.diffVal,
          flatMod: options.flatMod,
          cardType: options.cardType,
          needDiff: options.needDiff,
          useDiffValue: options.useDiffValue,
          label: options.label,
          drugSummary: options.drugSummary,
          drugFlatMod: options.drugFlatMod,
          drugExtraActions: options.drugExtraActions,
          mentalSummary: options.mentalSummary,
          mentalFlatMod: options.mentalFlatMod,
          traitSummary: options.traitSummary,
          traitFlatMod: options.traitFlatMod,
          diff: options.diff,
          difficultyOptions,
          addStatOptions,
          firstAid: options.firstAid,
          woundList: options.woundList,
          askFireMode: options.askFireMode,
          fireMode: options.fireMode,
          fireModeOptions: options.fireModeOptions,
          askAmmoTag: options.askAmmoTag,
          ammoTag: options.ammoTag,
          ammoTagOptions: options.ammoTagOptions,
          ammoCalibreLabel: options.ammoCalibreLabel,
          ammoBaseCost: options.ammoBaseCost,
          ammoRoundsSpent: options.ammoRoundsSpent
        }
        break
    }
    const html = await foundry.applications.handlebars.renderTemplate(options.dialogTemplate, data)
    return SLADialog.waitForm({
      title: "SLA Roll Control",
      content: html,
      formSelector: "#difficulty-roll-form",
      submitLabel: game.i18n.localize("BRP.proceed"),
      cancelLabel: game.i18n.localize("Cancel"),
      cancelValue: false
    })
  }

  // Calculate Success Level
  //
  static async successLevel(config) {
    //Set the critical and fumble chances
    let critChance = Math.ceil(0.05 * config.targetScore)
    let fumbleChance = Math.min(95 + critChance, 100)
    let specialChance = Math.round(0.2 * config.targetScore)
    let successChance = Math.min(config.targetScore, 95)
    if (config.cardType === 'RE' || config.cardType === 'PP') {
      successChance = config.targetScore
    }
    //Get the level of success
    let resultLevel = 0

    if (config.rollVal <= critChance) {
      resultLevel = 4  //4 = Critical
    } else if (config.rollVal <= specialChance) {
      resultLevel = 3  //3 = Special
    } else if (config.rollVal <= successChance) {
      resultLevel = 2  //2 = Success
    } else if (config.rollVal >= fumbleChance) {
      resultLevel = 0  //0 = Fumble
    } else {
      resultLevel = 1  //1 = Fail
    }
    return resultLevel
  }


  // Prep the chat card
  static async startChat(chatMsgData) {
    let html = await foundry.applications.handlebars.renderTemplate(chatMsgData.chatTemplate, chatMsgData)
    return html
  }


  // Display the chat card and roll the dice
  static async showChat(html, chatMsgData) {
    let chatData = {}
    chatData = {
      author: game.user.id,
      type: chatMsgData.chatType,
      content: html,
      flags: {
        [game.system.id]: {
          initiator: chatMsgData.chatCard[0].particId,
          initiatorType: chatMsgData.chatCard[0].particType,
          chatTemplate: chatMsgData.chatTemplate,
          state: chatMsgData.state,
          cardType: chatMsgData.cardType,
          rollType: chatMsgData.rollType,
          wait: chatMsgData.wait,
          successLevel: chatMsgData.successLevel,
          chatCard: chatMsgData.chatCard,
          opp: chatMsgData.opp,
        },
        'brp': {
          initiator: chatMsgData.chatCard[0].particId,
          initiatorType: chatMsgData.chatCard[0].particType,
          chatTemplate: chatMsgData.chatTemplate,
          state: chatMsgData.state,
          cardType: chatMsgData.cardType,
          rollType: chatMsgData.rollType,
          wait: chatMsgData.wait,
          successLevel: chatMsgData.successLevel,
          chatCard: chatMsgData.chatCard,
          opp: chatMsgData.opp,
        }
      },
      speaker: {
        actor: chatMsgData.chatCard[0].particId,
        alias: chatMsgData.chatCard[0].particName,
      },
    }

    if (['NO', 'RE', 'PP'].includes(chatMsgData.cardType)) {
      chatData.rolls = [chatMsgData.rolls]
    }

    let msg = await ChatMessage.create(chatData)
    return msg._id
  }


  //Handle XP tickbox
  static async tickXP(msg) {
    let item = ""
    let actor = ""
    let autoXP = game.settings.get('sla-industries-brp', 'autoXP')
    //Don't do XP check until card is closed
    if (msg.state != 'closed') { return }
    switch (msg.cardType) {
      case "RE":
        //No checks for a resist card
        return
      case "PP":
        //If a POW v POW check target POW greater than current POW
        actor = await BRPactorDetails._getParticipant(msg.chatCard[0].particId, msg.chatCard[0].particType)
        if (msg.chatCard[0].resistance <= actor.system.stats.pow.total) { return }
        if (autoXP === '1' && msg.chatCard[0].resultLevel < 2) { return }
        if (autoXP === '2' && msg.chatCard[0].resultLevel > 1) { return }
        await actor.update({ 'system.stats.pow.improve': true })
        break
      case "NO":
      case "GR":
      case "OP":
      case "CB":
      case "CO":
        //Allow checks for Normal,Combined and Oppossed cards, unless it's a Characteristic or Allegiance Check or a Damage Roll or an Impact Roll
        if (['CH', 'AL', 'DM', 'IM'].includes(msg.rollType)) { return }
        for (let i of msg.chatCard) {
          const rollEdge = BRPCheck.normaliseRollEdge(i.diff)
          if (rollEdge === 'advantage' || Number(i.diffVal ?? 1) > 1) { continue }
          if (autoXP === '1' && i.resultLevel < 2) { continue }
          if (autoXP === '2' && i.resultLevel > 1) { continue }
          actor = await BRPactorDetails._getParticipant(i.particId, i.particType)
          item = await actor.items.get(i.skillId)
          if (item.type != 'reputation') {
            if (item.type === 'persTrait' && i.opp === 'true') {
              await item.update({ 'system.oppimprove': true })
            } else {
              await item.update({ 'system.improve': true })
            }
          }
        }
        break
    }
    return
  }


  //Function when Chat Message buttons activated to call socket
  static async triggerChatButton(event) {
    const targetElement = event.currentTarget
    const presetType = targetElement.dataset?.preset
    const dataset = targetElement.dataset
    const targetChat = $(targetElement).closest('.message')
    const targetChatId = targetChat?.[0]?.dataset?.messageId
    if (!targetChatId) {
      ui.notifications.error("Chat action failed: message id not found.")
      return
    }
    let origin = game.user.id
    let originGM = game.user.isGM

    if (game.user.isGM) {
      try {
        await BRPCheck.handleChatButton({ presetType, targetChatId, origin, originGM, dataset })
      } catch (err) {
        console.error("sla-industries-brp | chat action failed", err)
        ui.notifications.error("Chat action failed. See console for details.")
      }
    } else {
      const availableGM = game.users.find(d => d.active && d.isGM)?.id
      if (availableGM) {
        game.socket.emit('system.sla-industries-brp', {
          type: 'chatUpdate',
          to: availableGM,
          value: { presetType, targetChatId, origin, originGM, dataset }
        })
      } else {
        ui.notifications.warn(game.i18n.localize('BRP.noAvailableGM'))
      }
    }
  }


  //Handle changes to Cards based on the presetType value - will be carried out by a GM
  static async handleChatButton(data) {
    const presetType = data.presetType
    let targetMsg = await game.messages.get(data.targetChatId)
    if (!targetMsg) return

    switch (presetType) {
      case "close-card":
        await GRCard.GRClose(data)
        break
      case "remove-gr-roll":
        await GRCard.GRRemove(data)
        break
      case "resolve-gr-card":
        await GRCard.GRResolve(data)
        break
      case "resolve-op-card":
        await OPCard.OPResolve(data)
        break
      case "resolve-cb-card":
        await CBCard.CBResolve(data)
        break
      case "resolve-co-card":
        await COCard.COResolve(data)
        break
      case "apply-sla-damage":
        await SLADamageResolver.applyFromChat({
          targetChatId: data.targetChatId,
          rank: data.dataset?.rank ?? 0,
          mode: data.dataset?.mode ?? ""
        })
        break
      default:
        return
    }
    ui.chat?.render?.(true)

    return
  }


  //Check to see if there is an open card that matches the cardTyoe that's not more than a day old
  static async checkNewMsg(config) {
    let messages = ui.chat.collection.filter(message => {
      const msgFlags = message.flags?.[game.system.id] ?? message.flags?.brp ?? {}
      if (
        config.cardType === msgFlags.cardType &&
        msgFlags.state !== 'closed'
      ) {
        if (['GR'].includes(config.cardType)) {
          return msgFlags.initiator === config.chatCard[0].particId
        }
        return true
      }
      return false
    })

    if (messages.length) {
      // Old messages can't be used if message is more than a day old mark it as resolved
      const timestamp = new Date(messages[0].timestamp)
      const now = new Date()
      const timeDiffSec = (now - timestamp) / 1000
      if (60 * 60 * 24 < timeDiffSec) {
        await messages[0].update({
          [`flags.${game.system.id}.state`]: 'closed',
          'flags.brp.state': 'closed'
        })
        messages = []
      }
    }

    if (!messages.length) { return false }
    else { return messages[0].id }
  }

  //First Aid Roll
  static async firstAid(config) {

    //DO NOT PROCESS YET - still a work in progress
    return

    //If not Coop, Combined or Normal Roll then don't trigger first aid
    if (!['GR', 'CO', 'NO'].includes(config.cardType)) {
      return
    }

    //If Cooperatie or Combined Roll and not first partipant then don't trigger first aid
    if (['GR', 'CO'].includes(config.cardType)) {
      let checkData = {
        cardType: config.cardType,
        chatCard: [{
          particId: config.particId
        }]
      }
      let checkMsgId = await BRPCheck.checkNewMsg(checkData)
      if (checkMsgId != false) {
        return
      }
    }

    let actor = await BRPactorDetails._getParticipant(config.particId, config.particType)
    let target = await BRPactorDetails._getParticipant(config.targetId, config.targetType)
    //If there is target selected then use them, otherwise the actor making the roll
    let partic = actor
    if (target) { partic = target }

    //Get wounds depending on whether this is a character or NPC
    if (partic.type === 'character') {
      let wounds = await partic.items.filter(itm => itm.type === 'wound').filter(wnd => !wnd.system.treated)
      if (wounds.length === 0) { return }
      config.firstAid = true
      wounds.sort(function (a, b) {
        let x = a.system.value;
        let y = b.system.value;
        if (x < y) { return 1 };
        if (x > y) { return -1 };
        return 0;
      });
      for (let wound of wounds) {
        let wndLoc = partic.items.get(wound.system.locId)
        let label = ""
        if (wndLoc) {
          label = partic.name + ": " + wndLoc.system.displayName + " (" + wound.system.value + ")"
        } else {
          label = partic.name + ": " + game.i18n.localize('BRP.general') + " (" + wound.system.value + ")"
        }
        config.woundList = Object.assign(config.woundList, { [wound.uuid]: label })
      }

    }


    return
  }



}
