import { BRPactorDetails } from "../apps/actorDetails.mjs";
import { BRPCombatRoll } from "./combat-roll.mjs";
import { BRPDamage } from "./damage.mjs";
import { SLADrugSystem } from "../apps/sla-drug-system.mjs";
import { SLAEbbSystem } from "../apps/sla-ebb-system.mjs";

export class SLADamageResolver {
  static getChatFlags(message) {
    return message?.flags?.[game.system.id] ?? message?.flags?.brp ?? {};
  }

  static async applyFromChat({ targetChatId, rank = 0, mode = "" } = {}) {
    const targetMsg = game.messages.get(targetChatId);
    if (!targetMsg) {
      ui.notifications.warn(game.i18n.localize("BRP.slaDamageNoCard"));
      return { ok: false, reason: "no-message" };
    }

    const msgFlags = this.getChatFlags(targetMsg);
    const chatCard = msgFlags?.chatCard?.[Number(rank)];
    if (!chatCard) {
      ui.notifications.warn(game.i18n.localize("BRP.slaDamageNoCard"));
      return { ok: false, reason: "no-card" };
    }

    const rollType = msgFlags?.rollType ?? chatCard.rollType;
    if (!["CM", "QC"].includes(rollType)) {
      ui.notifications.warn(game.i18n.localize("BRP.slaDamageInvalidRoll"));
      return { ok: false, reason: "invalid-roll-type" };
    }

    const forcedMode = this.normalizeMode(mode);
    const effectiveMode = forcedMode || this.modeFromResult(chatCard.resultLevel);
    const resultLevel = this.modeToResult(effectiveMode);
    if (resultLevel < 2) {
      ui.notifications.warn(game.i18n.localize("BRP.slaDamageNoHit"));
      return { ok: false, reason: "no-hit" };
    }
    const fireMode = String(chatCard?.fireMode ?? "single");
    const hitCount = Math.max(
      1,
      Number(chatCard?.fireModeHitCount ?? this.getFireModeHitCount(fireMode, resultLevel))
    );

    const attacker = await BRPactorDetails._getParticipant(chatCard.particId, chatCard.particType);
    if (!attacker) {
      ui.notifications.warn(game.i18n.localize("BRP.slaDamageNoAttacker"));
      return { ok: false, reason: "no-attacker" };
    }

    const weapon = attacker.items.get(chatCard.itemId);
    if (!weapon) {
      ui.notifications.warn(game.i18n.localize("BRP.slaDamageNoWeapon"));
      return { ok: false, reason: "no-weapon" };
    }

    const resolvedTarget = await this.resolveTargetActor(chatCard);
    const useDummyTarget = !resolvedTarget;
    const target = resolvedTarget ?? this.buildDummyTarget();

    const location = useDummyTarget
      ? {
        id: "",
        item: null,
        label: game.i18n.localize("BRP.general"),
        roll: null
      }
      : await this.resolveLocation(target, chatCard.locationId);
    if (!useDummyTarget && game.settings.get("sla-industries-brp", "useHPL") && !location?.item) {
      ui.notifications.warn(game.i18n.localize("BRP.slaDamageNoLocation"));
      return { ok: false, reason: "no-location" };
    }

    const ammoContext = BRPCombatRoll.getAmmoContext(weapon, String(resultLevel), chatCard.ammoTag ?? null);
    const resolvedHits = [];
    let appliedHits = 0;
    let totalFinalDamage = 0;
    let totalAppliedDamage = 0;

    for (let hitIndex = 1; hitIndex <= hitCount; hitIndex += 1) {
      const damageContext = await this.resolveDamage({
        rollType,
        chatCard,
        attacker,
        weapon,
        resultLevel
      });

      const armourContext = useDummyTarget
        ? {
          base: 0,
          effective: 0,
          ballistic: this.weaponUsesBallisticArmour(weapon),
          from: "dummy"
        }
        : await this.resolveArmour({
          target,
          location: location.item,
          weapon,
          ammoContext
        });

      const postArmour = Math.max(damageContext.baseDamage - armourContext.effective, 0);
      const baseFinalDamage = Math.max(Math.floor(postArmour + damageContext.ignoreBonus), 0);
      const drugDamage = useDummyTarget
        ? { damage: baseFinalDamage, reduced: 0, summary: "" }
        : await SLADrugSystem.modifyIncomingDamage({
          actor: target,
          damage: baseFinalDamage,
          source: "combat"
        });
      const finalDamage = Math.max(0, Number(drugDamage.damage ?? baseFinalDamage));

      let applied = { ok: true, reason: "dummy-target" };
      if (!useDummyTarget && finalDamage > 0) {
        applied = await BRPDamage.applyResolvedDamage({
          actor: target,
          damage: finalDamage,
          locationId: location.id
        });
        if (!applied.ok) {
          if (applied.reason === "no-damage") {
            continue;
          }
          return applied;
        }
      }

      totalFinalDamage += finalDamage;
      if (finalDamage > 0) {
        appliedHits += 1;
        totalAppliedDamage += finalDamage;
      }

      resolvedHits.push({
        hitIndex,
        damageContext,
        armourContext,
        drugDamage,
        finalDamage
      });
    }

    const locationLabel = location.label || game.i18n.localize("BRP.general");
    if (totalFinalDamage <= 0) {
      ui.notifications.info(game.i18n.localize("BRP.slaDamageNoPenetration"));
    } else if (hitCount > 1) {
      ui.notifications.info(
        game.i18n.format("BRP.slaDamageAppliedBurst", {
          target: target.name,
          damage: totalFinalDamage,
          location: locationLabel,
          hits: hitCount
        })
      );
    } else {
      ui.notifications.info(
        game.i18n.format("BRP.slaDamageApplied", {
          target: target.name,
          damage: totalFinalDamage,
          location: locationLabel
        })
      );
    }
    if (useDummyTarget) {
      ui.notifications.info(game.i18n.localize("BRP.slaDamageDummyApplied"));
    }

    const record = foundry.utils.deepClone(msgFlags?.slaAppliedDamage ?? []);
    for (const hit of resolvedHits) {
      record.push({
        timestamp: Date.now(),
        user: game.user.id,
        rank: Number(rank),
        hitIndex: Number(hit.hitIndex ?? 1),
        hitCount: Number(hitCount ?? 1),
        weaponName: String(chatCard?.weaponLabel ?? weapon?.name ?? chatCard?.label ?? ""),
        ammoTag: String(chatCard?.ammoTag ?? "STD"),
        fireMode: String(chatCard?.fireMode ?? "single"),
        targetId: useDummyTarget ? "" : target.id,
        targetName: target.name,
        locationId: location.id ?? "",
        location: locationLabel,
        rawDamage: hit.damageContext.baseDamage + hit.damageContext.ignoreBonus,
        armourApplied: hit.armourContext.effective,
        finalDamage: Number(hit.finalDamage ?? 0),
        damageFormula: hit.damageContext.formula ?? "",
        damageDice: hit.damageContext.diceRolled ?? "",
        damageRoll: Number(hit.damageContext.total ?? 0),
        ignoreFormula: hit.damageContext.ignoreFormula ?? "",
        ignoreDiceRolled: hit.damageContext.ignoreDiceRolled ?? "",
        ignoreRoll: Number(hit.damageContext.ignoreRoll ?? 0),
        drugMitigation: Number(hit.drugDamage.reduced ?? 0),
        drugSummary: hit.drugDamage.summary ?? "",
        dummyTarget: useDummyTarget
      });
    }
    const appliedMeta = this.buildAppliedMeta(record);
    await targetMsg.update({
      [`flags.${game.system.id}.slaAppliedDamage`]: record,
      [`flags.${game.system.id}.slaAppliedCardMeta`]: appliedMeta
    });

    const refreshedMsg = game.messages.get(targetChatId);
    const refreshedFlags = this.getChatFlags(refreshedMsg ?? targetMsg);
    if (refreshedMsg && refreshedFlags?.chatTemplate) {
      const pushHtml = await foundry.applications.handlebars.renderTemplate(
        refreshedFlags.chatTemplate,
        refreshedFlags
      );
      await refreshedMsg.update({ content: pushHtml });
      ui.chat?.render?.(true);
    }

    return {
      ok: true,
      target,
      location,
      hitCount,
      resolvedHits,
      finalDamage: totalFinalDamage,
      appliedHits,
      appliedDamage: totalAppliedDamage,
      dummyTarget: useDummyTarget
    };
  }

  static buildDummyTarget() {
    return {
      id: "",
      name: game.i18n.localize("BRP.slaDamageDummyTarget"),
      type: "dummy"
    };
  }

  static getTargetingMode() {
    const mode = String(game.settings.get("sla-industries-brp", "combatTargetingMode") ?? "prefer-selected");
    const supported = new Set(["prefer-selected", "selected-only", "card-then-selected", "dummy-only"]);
    return supported.has(mode) ? mode : "prefer-selected";
  }

  static async resolveTargetActor(chatCard) {
    const selected = await BRPactorDetails._getTargetId();
    const selectedActor = (selected.targetType && selected.targetType !== "none")
      ? await BRPactorDetails._getParticipant(selected.targetId, selected.targetType)
      : null;
    const cardActor = (chatCard.targetId && chatCard.targetType && chatCard.targetType !== "none")
      ? await BRPactorDetails._getParticipant(chatCard.targetId, chatCard.targetType)
      : null;

    const mode = this.getTargetingMode();
    if (mode === "dummy-only") return null;
    if (mode === "selected-only") return selectedActor ?? null;
    if (mode === "card-then-selected") return cardActor ?? selectedActor ?? null;
    if (mode === "prefer-selected") return selectedActor ?? cardActor ?? null;

    return null;
  }

  static normalizeMode(mode) {
    const value = String(mode ?? "").toLowerCase().trim();
    if (["crit", "spec", "norm"].includes(value)) return value;
    return "";
  }

  static modeFromResult(resultLevel) {
    const level = Number(resultLevel ?? 0);
    if (level >= 4) return "crit";
    if (level === 3) return "spec";
    if (level === 2) return "norm";
    return "";
  }

  static modeToResult(mode) {
    switch (mode) {
      case "crit":
        return 4;
      case "spec":
        return 3;
      case "norm":
        return 2;
      default:
        return 0;
    }
  }

  static getFireModeHitCount(fireMode = "single", resultLevel = 0) {
    const mode = String(fireMode ?? "single").toLowerCase();
    const level = Number(resultLevel ?? 0);
    if (level < 2) return 0;
    if (mode === "burst") {
      if (level >= 4) return 3;
      if (level === 3) return 2;
      return 1;
    }
    if (mode === "auto") {
      if (level >= 4) return 6;
      if (level === 3) return 4;
      return 2;
    }
    return 1;
  }

  static resolveActorRef(actorRef) {
    if (!actorRef) return null;
    if (actorRef.documentName === "Actor") return actorRef;
    if (typeof actorRef === "string") {
      return game.actors.get(actorRef) ?? game.actors.find((a) => a.name === actorRef) ?? null;
    }
    return null;
  }

  static async applyEbbAttack({
    attacker = null,
    targetActor = null,
    damage = 0,
    damageFormula = "",
    damageDice = "",
    ignoreArmour = 0,
    ignoreAllArmour = false,
    locationId = "",
    hitCount = 1
  } = {}) {
    const resolvedAttacker = this.resolveActorRef(attacker);
    if (!resolvedAttacker) {
      return { ok: false, reason: "no-attacker" };
    }

    const providedTarget = this.resolveActorRef(targetActor);
    let resolvedTarget = providedTarget;
    if (!resolvedTarget) {
      const selected = await BRPactorDetails._getTargetId();
      if (selected.targetType && selected.targetType !== "none") {
        resolvedTarget = await BRPactorDetails._getParticipant(selected.targetId, selected.targetType);
      }
    }

    const useDummyTarget = !resolvedTarget;
    const target = resolvedTarget ?? this.buildDummyTarget();
    const location = useDummyTarget
      ? {
        id: "",
        item: null,
        label: game.i18n.localize("BRP.general"),
        roll: null
      }
      : await this.resolveLocation(target, locationId);
    if (!useDummyTarget && game.settings.get("sla-industries-brp", "useHPL") && !location?.item) {
      return { ok: false, reason: "no-location" };
    }

    const safeHitCount = Math.max(1, Number(hitCount ?? 1) || 1);
    const baseDamage = Math.max(0, Math.floor(Number(damage ?? 0) || 0));
    const ignoreFlat = Math.max(0, Math.floor(Number(ignoreArmour ?? 0) || 0));
    const hits = [];
    let appliedHits = 0;
    let totalFinalDamage = 0;
    let totalAppliedDamage = 0;

    for (let hitIndex = 1; hitIndex <= safeHitCount; hitIndex += 1) {
      const armourContext = useDummyTarget
        ? {
          base: 0,
          effective: 0,
          ballistic: false,
          from: "dummy",
          ebbBonus: 0
        }
        : await this.resolveArmour({
          target,
          location: location.item,
          weapon: null,
          ammoContext: null
        });

      const effectiveArmour = ignoreAllArmour
        ? 0
        : Math.max(0, Number(armourContext.effective ?? 0));
      const postArmour = Math.max(baseDamage - effectiveArmour, 0);
      const baseFinalDamage = Math.max(Math.floor(postArmour + (ignoreAllArmour ? 0 : ignoreFlat)), 0);
      const drugDamage = useDummyTarget
        ? { damage: baseFinalDamage, reduced: 0, summary: "" }
        : await SLADrugSystem.modifyIncomingDamage({
          actor: target,
          damage: baseFinalDamage,
          source: "ebb"
        });
      const finalDamage = Math.max(0, Number(drugDamage.damage ?? baseFinalDamage));

      let applied = { ok: true, reason: "dummy-target" };
      if (!useDummyTarget && finalDamage > 0) {
        applied = await BRPDamage.applyResolvedDamage({
          actor: target,
          damage: finalDamage,
          locationId: location.id
        });
        if (!applied.ok) {
          if (applied.reason === "no-damage") continue;
          return applied;
        }
      }

      totalFinalDamage += finalDamage;
      if (finalDamage > 0) {
        appliedHits += 1;
        totalAppliedDamage += finalDamage;
      }

      hits.push({
        hitIndex,
        baseDamage,
        finalDamage,
        armourApplied: effectiveArmour,
        ignoreArmour: ignoreFlat,
        ignoreAllArmour: Boolean(ignoreAllArmour),
        drugMitigation: Number(drugDamage?.reduced ?? 0),
        drugSummary: String(drugDamage?.summary ?? ""),
        damageFormula: String(damageFormula ?? ""),
        damageDice: String(damageDice ?? ""),
        damageRoll: baseDamage
      });
    }

    const locationLabel = location?.label || game.i18n.localize("BRP.general");
    const hitBreakdownText = hits.map((entry) => `#${entry.hitIndex}:${entry.finalDamage}`).join(" | ");
    const damageDiceSummary = hits
      .map((entry) => `#${entry.hitIndex} ${entry.damageFormula} [${entry.damageDice}] = ${entry.damageRoll}`)
      .join(" || ");

    return {
      ok: true,
      target,
      location,
      locationLabel,
      hitCount: safeHitCount,
      resolvedHits: hits,
      finalDamage: totalFinalDamage,
      appliedHits,
      appliedDamage: totalAppliedDamage,
      hitBreakdownText,
      damageDiceSummary,
      dummyTarget: useDummyTarget
    };
  }

  static async resolveLocation(target, locationId = "") {
    if (!game.settings.get("sla-industries-brp", "useHPL")) {
      return {
        id: "",
        item: null,
        label: game.i18n.localize("BRP.general"),
        roll: null
      };
    }

    const locations = target.items.filter((item) => item.type === "hit-location");
    if (!locations.length) {
      return { id: "", item: null, label: "", roll: null };
    }

    const direct = locationId ? target.items.get(locationId) : null;
    if (direct) {
      return {
        id: direct.id,
        item: direct,
        label: direct.system?.displayName ?? direct.name,
        roll: null
      };
    }

    if (locations.length === 1) {
      const only = locations[0];
      return {
        id: only.id,
        item: only,
        label: only.system?.displayName ?? only.name,
        roll: null
      };
    }

    const general = locations.find((loc) => loc.system?.locType === "general");
    const roll = await new Roll("1D20").evaluate();
    const rollVal = Number(roll.total ?? 0);
    const located = locations.find((loc) => {
      const low = Number(loc.system?.lowRoll ?? 0);
      const high = Number(loc.system?.highRoll ?? 0);
      return high > 0 && rollVal >= low && rollVal <= high;
    }) ?? general ?? locations[0];

    return {
      id: located.id,
      item: located,
      label: located.system?.displayName ?? located.name,
      roll: rollVal
    };
  }

  static weaponUsesBallisticArmour(weapon) {
    const type = String(weapon?.system?.weaponType ?? "").toLowerCase();
    if (/(fire|gun|pistol|rifle|smg|shot|heavy|launcher|artillery)/.test(type)) return true;
    const skill1 = String(weapon?.system?.skill1 ?? "").toLowerCase();
    const skill2 = String(weapon?.system?.skill2 ?? "").toLowerCase();
    return skill1.includes("firearm") || skill2.includes("firearm");
  }

  static async resolveArmour({ target, location, weapon, ammoContext }) {
    const useHPL = game.settings.get("sla-industries-brp", "useHPL");
    const useRand = game.settings.get("sla-industries-brp", "useAVRand");
    const ballistic = this.weaponUsesBallisticArmour(weapon);
    const avKey = ballistic ? "av2" : "av1";
    const avrKey = ballistic ? "avr2" : "avr1";

    let base = 0;
    if (useHPL && location?.system) {
      if (useRand && String(location.system[avrKey] ?? "").trim() !== "") {
        const avRoll = await new Roll(String(location.system[avrKey])).evaluate();
        base = Number(avRoll.total ?? 0);
      } else {
        base = Number(location.system[avKey] ?? 0);
        if (ballistic && base === 0) {
          base = Number(location.system.av1 ?? 0);
        }
      }
    } else {
      if (useRand && String(target?.system?.[avrKey] ?? "").trim() !== "") {
        const avRoll = await new Roll(String(target.system[avrKey])).evaluate();
        base = Number(avRoll.total ?? 0);
      } else {
        base = Number(target?.system?.[avKey] ?? 0);
        if (ballistic && base === 0) {
          base = Number(target?.system?.av1 ?? 0);
        }
      }
    }

    const ebbBonus = await SLAEbbSystem.getArmourBonus(target, {
      vs: ballistic ? "physical" : "physical",
      preview: true
    });
    const baseWithEbb = base + Math.max(0, Number(ebbBonus ?? 0));

    let effective = baseWithEbb;
    if (ammoContext?.ignoreAllArmour) {
      effective = 0;
    } else if (Number(ammoContext?.armourMultiplier ?? 1) !== 1) {
      effective = Math.ceil(baseWithEbb * Number(ammoContext.armourMultiplier));
    }

    return {
      base: Math.max(Math.floor(baseWithEbb), 0),
      effective: Math.max(Math.floor(effective), 0),
      ballistic,
      ebbBonus: Math.max(0, Math.floor(ebbBonus))
    };
  }

  static async resolveDamage({ rollType, chatCard, attacker, weapon, resultLevel }) {
    const mode = this.modeFromResult(resultLevel);
    const ammoContext = BRPCombatRoll.getAmmoContext(weapon, String(resultLevel), chatCard.ammoTag ?? null);

    if (rollType === "QC") {
      const valueKey = mode === "crit" ? "dmgCrit" : (mode === "spec" ? "dmgSpec" : "dmgNorm");
      const fallback = Number(chatCard[valueKey] ?? 0);
      const formula = mode === "crit"
        ? String(chatCard.dmgCritForm ?? "")
        : (mode === "spec" ? String(chatCard.dmgSpecForm ?? "") : String(chatCard.dmgNormForm ?? ""));

      let rollTotal = fallback;
      let diceRolled = fallback > 0 ? `pre-rolled ${fallback}` : "";
      if (formula) {
        const roll = await new Roll(formula).evaluate();
        if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
          game.dice3d.showForRoll(roll, game.user, true, null, false);
        }
        rollTotal = Math.max(Math.floor(Number(roll.total ?? 0)), 0);
        diceRolled = this.collectDiceValues(roll);
      }

      let ignoreBonus = 0;
      let ignoreDiceRolled = "";
      if (ammoContext.bonusIgnoreArmourFormula) {
        const ignoreRoll = await new Roll(ammoContext.bonusIgnoreArmourFormula).evaluate();
        if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
          game.dice3d.showForRoll(ignoreRoll, game.user, true, null, false);
        }
        ignoreBonus = Number(ignoreRoll.total ?? 0);
        ignoreDiceRolled = this.collectDiceValues(ignoreRoll);
      }
      return {
        baseDamage: Math.max(Math.floor(rollTotal), 0),
        ignoreBonus: Math.max(Math.floor(ignoreBonus), 0),
        formula,
        total: rollTotal,
        diceRolled,
        ignoreFormula: String(ammoContext.bonusIgnoreArmourFormula ?? ""),
        ignoreRoll: Math.max(Math.floor(ignoreBonus), 0),
        ignoreDiceRolled
      };
    }

    const rangeKey = chatCard.rangeUsed ?? "dmg1";
    const damageBase = weapon.system[rangeKey] || weapon.system.dmg1 || "0";
    const handsUsed = chatCard.handsUsed ?? "";
    const damageBonus = await BRPCombatRoll.getDamageBonus(attacker, weapon, handsUsed);
    const cleanWeapon = weapon.toObject();
    cleanWeapon.system = cleanWeapon.system ?? {};

    let formula = await BRPCombatRoll.damageAssess(
      cleanWeapon,
      damageBase,
      damageBonus,
      String(resultLevel),
      "DM",
      chatCard.ammoTag ?? null
    );

    const roll = await new Roll(String(formula)).evaluate();
    if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(roll, game.user, true, null, false);
    }
    let ignoreBonus = 0;
    let ignoreDiceRolled = "";
    if (ammoContext.bonusIgnoreArmourFormula) {
      const ignoreRoll = await new Roll(ammoContext.bonusIgnoreArmourFormula).evaluate();
      if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
        game.dice3d.showForRoll(ignoreRoll, game.user, true, null, false);
      }
      ignoreBonus = Number(ignoreRoll.total ?? 0);
      ignoreDiceRolled = this.collectDiceValues(ignoreRoll);
    }

    return {
      baseDamage: Math.max(Math.floor(Number(roll.total ?? 0)), 0),
      ignoreBonus: Math.max(Math.floor(ignoreBonus), 0),
      formula: String(formula),
      total: Math.max(Math.floor(Number(roll.total ?? 0)), 0),
      diceRolled: this.collectDiceValues(roll),
      ignoreFormula: String(ammoContext.bonusIgnoreArmourFormula ?? ""),
      ignoreRoll: Math.max(Math.floor(ignoreBonus), 0),
      ignoreDiceRolled
    };
  }

  static collectDiceValues(roll) {
    const values = [];
    for (const die of roll?.dice ?? []) {
      if (Array.isArray(die?.values)) {
        for (const value of die.values) values.push(String(value));
      }
    }
    return values.join(", ");
  }

  static buildAppliedMeta(records = []) {
    const byRank = {};
    for (const entry of records) {
      const key = Number(entry?.rank ?? -1);
      if (!Number.isFinite(key) || key < 0) continue;
      if (!byRank[key]) {
        byRank[key] = { count: 0, totalDamage: 0, hitBreakdown: [], diceSummary: [] };
      }
      byRank[key].count += 1;
      const hitIndex = Number(entry?.hitIndex ?? byRank[key].count);
      const hitDamage = Number(entry?.finalDamage ?? 0);
      byRank[key].totalDamage += hitDamage;
      byRank[key].lastDamage = hitDamage;
      byRank[key].lastLocation = String(entry?.location ?? game.i18n.localize("BRP.general"));
      byRank[key].lastTarget = String(entry?.targetName ?? game.i18n.localize("BRP.slaDamageDummyTarget"));
      byRank[key].lastWeaponName = String(entry?.weaponName ?? "");
      byRank[key].lastAmmoTag = String(entry?.ammoTag ?? "STD");
      byRank[key].lastFireMode = String(entry?.fireMode ?? "single");
      byRank[key].lastDamageRoll = Number(entry?.damageRoll ?? 0);
      byRank[key].lastDamageFormula = String(entry?.damageFormula ?? "");
      byRank[key].lastDamageDice = String(entry?.damageDice ?? "");
      byRank[key].lastIgnoreRoll = Number(entry?.ignoreRoll ?? 0);
      byRank[key].lastIgnoreFormula = String(entry?.ignoreFormula ?? "");
      byRank[key].lastIgnoreDice = String(entry?.ignoreDiceRolled ?? "");
      byRank[key].dummyTarget = Boolean(entry?.dummyTarget);
      byRank[key].hitBreakdown.push(`#${hitIndex}:${hitDamage}`);
      const baseDice = `${entry?.damageFormula ?? ""} [${entry?.damageDice ?? ""}] = ${Number(entry?.damageRoll ?? 0)}`;
      if (Number(entry?.ignoreRoll ?? 0) > 0) {
        byRank[key].diceSummary.push(`#${hitIndex} ${baseDice} | ignore ${entry?.ignoreFormula ?? ""} [${entry?.ignoreDiceRolled ?? ""}] = ${Number(entry?.ignoreRoll ?? 0)}`);
      } else {
        byRank[key].diceSummary.push(`#${hitIndex} ${baseDice}`);
      }
    }

    const meta = [];
    for (const [rank, info] of Object.entries(byRank)) {
      info.lastDamage = Number(info.totalDamage ?? info.lastDamage ?? 0);
      info.hitBreakdownText = info.hitBreakdown.join(" | ");
      info.damageDiceSummary = info.diceSummary.join(" || ");
      meta[Number(rank)] = info;
    }
    return meta;
  }
}
