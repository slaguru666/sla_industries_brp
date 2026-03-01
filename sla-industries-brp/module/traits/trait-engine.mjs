import { SLATraitDefinitions } from "./trait-definitions.mjs";

export class SLATraitEngine {
  static FLAG_KEY = "slaTraits";

  static PERCENTILE_ROLL_TYPES = new Set(["CH", "SK", "CM", "QC", "AL", "PA", "PT", "RP", "COOL", "SAN"]);

  static resolveActor(actorRef) {
    if (!actorRef) return null;
    if (actorRef.documentName === "Actor") return actorRef;
    if (typeof actorRef === "string") {
      return game.actors.get(actorRef) ?? game.actors.find((a) => a.name === actorRef) ?? null;
    }
    if (actorRef.id) return game.actors.get(actorRef.id) ?? null;
    return null;
  }

  static normalizeText(value = "") {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static normalizeSlug(value = "") {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  static getDefaultState() {
    return {
      conditions: {},
      session: {},
      meta: {
        lastResetAt: 0
      }
    };
  }

  static cleanState(state = this.getDefaultState()) {
    const next = foundry.utils.mergeObject(this.getDefaultState(), foundry.utils.deepClone(state ?? {}), {
      inplace: false
    });
    next.conditions = next.conditions && typeof next.conditions === "object" ? next.conditions : {};
    next.session = next.session && typeof next.session === "object" ? next.session : {};
    next.meta = next.meta && typeof next.meta === "object" ? next.meta : { lastResetAt: 0 };
    return next;
  }

  static async getState(actorRef, { clean = true } = {}) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return this.getDefaultState();

    const fromSystem = actor.flags?.[game.system.id]?.[this.FLAG_KEY];
    const fromLegacy = actor.flags?.brp?.[this.FLAG_KEY];
    const merged = foundry.utils.mergeObject(this.getDefaultState(), foundry.utils.deepClone(fromSystem ?? fromLegacy ?? {}), {
      inplace: false
    });
    return clean ? this.cleanState(merged) : merged;
  }

  static async setState(actorRef, state = this.getDefaultState()) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return;
    await actor.setFlag(game.system.id, this.FLAG_KEY, this.cleanState(state));
  }

  static getTraitConditionRecord(state = {}, traitKey = "") {
    const conditions = state?.conditions ?? {};
    return conditions?.[traitKey] ?? {};
  }

  static conditionBool(state = {}, traitKey = "", conditionKey = "", fallback = false) {
    const byTrait = this.getTraitConditionRecord(state, traitKey);
    if (conditionKey in byTrait) return Boolean(byTrait[conditionKey]);
    if (conditionKey in (state?.conditions ?? {})) return Boolean(state.conditions[conditionKey]);
    return Boolean(fallback);
  }

  static conditionNumber(state = {}, traitKey = "", conditionKey = "", fallback = 0) {
    const byTrait = this.getTraitConditionRecord(state, traitKey);
    if (conditionKey in byTrait) {
      const value = Number(byTrait[conditionKey]);
      return Number.isFinite(value) ? value : Number(fallback ?? 0);
    }
    if (conditionKey in (state?.conditions ?? {})) {
      const value = Number(state.conditions[conditionKey]);
      return Number.isFinite(value) ? value : Number(fallback ?? 0);
    }
    return Number(fallback ?? 0);
  }

  static conditionText(state = {}, traitKey = "", conditionKey = "", fallback = "") {
    const byTrait = this.getTraitConditionRecord(state, traitKey);
    if (conditionKey in byTrait) return String(byTrait[conditionKey] ?? "").trim();
    if (conditionKey in (state?.conditions ?? {})) return String(state.conditions[conditionKey] ?? "").trim();
    return String(fallback ?? "").trim();
  }

  static sessionKey(traitKey = "", ability = "default") {
    return `${traitKey}::${ability}`;
  }

  static isSessionAbilityUsed(state = {}, traitKey = "", ability = "default") {
    const key = this.sessionKey(traitKey, ability);
    const entry = state?.session?.[key];
    return Boolean(entry?.used);
  }

  static markSessionAbilityUsed(state = {}, traitKey = "", ability = "default") {
    const key = this.sessionKey(traitKey, ability);
    const current = state?.session?.[key] ?? {};
    state.session = state.session ?? {};
    state.session[key] = {
      used: true,
      usedAt: Date.now(),
      count: Math.max(0, Number(current.count ?? 0)) + 1
    };
  }

  static rankFromTraitItem(item, def = null) {
    const maxRank = Math.max(
      1,
      Number(def?.maxRank ?? 1),
      Number(item?.flags?.[game.system.id]?.slaTrait?.rank ?? 0),
      Number(item?.flags?.brp?.slaTrait?.rank ?? 0)
    );
    const rankRaw = Math.max(
      1,
      Number(item?.system?.base ?? 0),
      Number(item?.flags?.[game.system.id]?.slaTrait?.rank ?? 0),
      Number(item?.flags?.brp?.slaTrait?.rank ?? 0)
    );
    return Math.min(maxRank, Math.max(1, Math.floor(rankRaw)));
  }

  static getActorTraits(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return [];
    const items = actor.items?.filter((item) => item.type === "persTrait") ?? [];
    return items.map((item) => {
      const key = SLATraitDefinitions.toKey(item.name);
      const def = SLATraitDefinitions.getByKey(key);
      const rank = this.rankFromTraitItem(item, def);
      const fallbackType = String(item?.flags?.[game.system.id]?.slaTrait?.type ?? item?.flags?.brp?.slaTrait?.type ?? "neutral").trim();
      return {
        id: String(item.id ?? ""),
        name: String(item.name ?? "Trait"),
        key,
        rank,
        maxRank: Math.max(1, Number(def?.maxRank ?? rank)),
        type: String(def?.type ?? fallbackType ?? "neutral"),
        definition: def,
        item
      };
    });
  }

  static hasTrait(actorRef, traitKey = "") {
    const key = SLATraitDefinitions.toKey(traitKey);
    return this.getActorTraits(actorRef).some((row) => row.key === key);
  }

  static inferSkillName(actor, config = {}) {
    const fromItem = config?.skillId ? actor?.items?.get(config.skillId)?.name : "";
    return String(fromItem ?? config?.label ?? "").trim();
  }

  static buildContext(actor, config = {}) {
    const rollType = String(config?.rollType ?? "").toUpperCase();
    const cardType = String(config?.cardType ?? "").toUpperCase();
    const skillName = this.inferSkillName(actor, config);
    const skillNorm = this.normalizeText(skillName);
    const labelNorm = this.normalizeText(config?.label ?? "");
    const weapon = config?.itemId ? actor?.items?.get(config.itemId) : null;
    const reasonText = String(config?.reason ?? "").trim();
    const reasonNorm = this.normalizeText(reasonText);

    const communicationSet = new Set(["command", "fasttalk", "intimidate", "persuade", "streetwise"]);
    const physicalSet = new Set([
      "athletics", "climb", "dodge", "swim", "brawl", "throw", "pilot",
      "drivecivilian", "drivemilitary", "firearmautosupport", "firearmpistol",
      "firearmrifleshotgun", "firearmsmg", "meleeaxe", "meleeblade1h", "meleeblade2h", "meleeclub"
    ]);

    const isSkillRoll = ["SK", "CM", "QC", "AL", "PA", "PT", "RP"].includes(rollType);
    const isCombat = rollType === "CM" || rollType === "QC" || /firearm|melee|brawl|throw|dodge/.test(skillNorm);
    const isRangedCombat = isCombat && (/(firearm)/.test(skillNorm) || String(weapon?.system?.weaponType ?? "").toLowerCase() === "firearm");

    return {
      rollType,
      cardType,
      characteristic: String(config?.characteristic ?? "").trim().toLowerCase(),
      skillName,
      skillNorm,
      labelNorm,
      isPercentile: this.PERCENTILE_ROLL_TYPES.has(rollType),
      isSkillRoll,
      isCombat,
      isRangedCombat,
      isPhysical: physicalSet.has(skillNorm) || isCombat,
      isCommunication: communicationSet.has(skillNorm),
      isListen: skillNorm === "listen",
      isSpotHidden: skillNorm === "spothidden",
      isBureaucracy: skillNorm === "bureaucracy",
      isCoolRoll: rollType === "COOL" || labelNorm === "cool" || labelNorm === "coolrating",
      isSanRoll: rollType === "SAN" || labelNorm === "sanity" || labelNorm === "sanitypoints",
      actorScl: Number(actor?.system?.sla?.scl ?? NaN),
      targetScl: Number(config?.targetScl ?? NaN),
      reasonText,
      reasonNorm,
      hasFearTag: /fear|terror|horror|phobia|panic/.test(reasonNorm),
      hasAppearanceTag: /appearance|attractive|looks|charm|social/.test(reasonNorm),
      isDowntimeRecovery: /downtime|recovery|heal|rest/.test(reasonNorm)
    };
  }

  static addFlat(acc, value = 0, label = "") {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n) || n === 0) return;
    acc.flatMod += n;
    if (label) {
      const sign = n >= 0 ? "+" : "";
      acc.effects.push(`${label}: ${sign}${n}%`);
    }
  }

  static applyTraitToContext(trait, ctx, state, acc) {
    const rank = Number(trait.rank ?? 1);
    const key = trait.key;

    switch (key) {
      case "addiction-compulsion": {
        if (this.conditionBool(state, key, "unmet", false)) {
          this.addFlat(acc, -10 * rank, `${trait.name} (unmet)`);
          const unmetHours = this.conditionNumber(state, key, "hoursUnmet", 0);
          if (unmetHours >= 24) {
            acc.effects.push(`${trait.name}: unmet 24h+ (daily SAN loss pressure active)`);
          }
        }
        break;
      }
      case "allergy": {
        if (!this.conditionBool(state, key, "exposed", false)) break;
        const penalty = rank <= 1 ? -10 : -20;
        if (ctx.isPhysical || (ctx.rollType === "CH" && ctx.characteristic === "con")) {
          this.addFlat(acc, penalty, `${trait.name} exposure`);
        }
        if (rank >= 3) {
          acc.effects.push(`${trait.name}: severe exposure (hourly CONx5 / 1D3 HP risk)`);
        }
        break;
      }
      case "anger": {
        if (this.conditionBool(state, key, "attacked", false) && !ctx.isCombat && ctx.isPercentile) {
          this.addFlat(acc, -20, `${trait.name} fixation`);
        }
        break;
      }
      case "anxiety": {
        if (ctx.isCoolRoll) this.addFlat(acc, -10 * rank, trait.name);
        if (ctx.isSanRoll && (ctx.hasFearTag || this.conditionBool(state, key, "fear", false))) {
          this.addFlat(acc, -10 * rank, `${trait.name} (fear)`);
        }
        break;
      }
      case "arrogant": {
        const lowerScl = Number.isFinite(ctx.actorScl) && Number.isFinite(ctx.targetScl) ? ctx.targetScl <= ctx.actorScl : false;
        if (ctx.isCommunication && (lowerScl || this.conditionBool(state, key, "equalOrLowerScl", false))) {
          this.addFlat(acc, -10, trait.name);
        }
        break;
      }
      case "chicken": {
        if (ctx.isCoolRoll) {
          acc.coolPercentDelta -= 10;
          acc.effects.push(`${trait.name}: COOL cap -10%`);
        }
        if (ctx.isCombat && this.conditionBool(state, key, "firstCombatRound", false)) {
          acc.requiresCoolGate = true;
          acc.effects.push(`${trait.name}: first combat action requires COOL check`);
        }
        break;
      }
      case "debt": {
        if (rank >= 3 && ctx.isBureaucracy && this.conditionBool(state, key, "monthlyAudit", false)) {
          this.addFlat(acc, -10, `${trait.name} rank 3`);
        }
        break;
      }
      case "depression": {
        if (ctx.isCommunication) {
          this.addFlat(acc, -10 * rank, trait.name);
          const sanValue = Number(this.conditionNumber(state, key, "sanValue", Number.NaN));
          const actorSan = Number(this.conditionNumber(state, key, "actorSan", Number.NaN));
          const san = Number.isFinite(sanValue) ? sanValue : (Number.isFinite(actorSan) ? actorSan : Number.NaN);
          if (Number.isFinite(san) && san < 50) {
            this.addFlat(acc, -10, `${trait.name} (SAN < 50)`);
          }
        }
        break;
      }
      case "drug-addict": {
        if (!this.conditionBool(state, key, "withdrawal", false)) break;
        if (ctx.isPhysical) this.addFlat(acc, -20, `${trait.name} withdrawal`);
        if (ctx.isCoolRoll) this.addFlat(acc, -10, `${trait.name} withdrawal`);
        if (ctx.isSanRoll) this.addFlat(acc, -10, `${trait.name} withdrawal`);
        break;
      }
      case "illness": {
        if (!this.conditionBool(state, key, "active", false)) break;
        const scope = this.normalizeText(this.conditionText(state, key, "scope", "physical"));
        const penalty = rank <= 1 ? -10 : -20;
        if ((scope === "physical" && ctx.isPhysical)
          || (scope === "communication" && ctx.isCommunication)
          || (scope === "cool" && ctx.isCoolRoll)
          || (scope === "san" && ctx.isSanRoll)
          || (scope === "all" && ctx.isPercentile)
          || (scope === "bureaucracy" && ctx.isBureaucracy)
          || (scope === "listen" && ctx.isListen)
          || (scope === "spot" && ctx.isSpotHidden)) {
          this.addFlat(acc, penalty, `${trait.name} active`);
        }
        if (rank >= 3) {
          acc.effects.push(`${trait.name}: severe (max characteristic reduction pressure)`);
        }
        break;
      }
      case "pacifist": {
        if (ctx.isCombat) {
          acc.requiresCoolGate = true;
          acc.effects.push(`${trait.name}: attack requires COOL pass`);
        }
        break;
      }
      case "phobia": {
        if (!this.conditionBool(state, key, "exposed", false)) break;
        if (ctx.isCoolRoll) {
          const penalty = rank === 1 ? -10 : rank === 2 ? -20 : -30;
          this.addFlat(acc, penalty, `${trait.name} exposure`);
        }
        if (rank >= 3 && ctx.isSanRoll) {
          this.addFlat(acc, -10, `${trait.name} severe exposure`);
          acc.effects.push(`${trait.name}: immediate SAN pressure event`);
        }
        break;
      }
      case "poor-hearing": {
        if (ctx.isListen) this.addFlat(acc, -10 * rank, trait.name);
        break;
      }
      case "poor-vision": {
        if (ctx.isSpotHidden) this.addFlat(acc, -10 * rank, trait.name);
        if (ctx.isRangedCombat && this.conditionBool(state, key, "rangedBeyond20m", false)) {
          this.addFlat(acc, -10 * rank, `${trait.name} (range >20m)`);
        }
        break;
      }
      case "psychosis": {
        if (!this.conditionBool(state, key, "active", false)) break;
        const scope = this.normalizeText(this.conditionText(state, key, "scope", "all"));
        const penalty = rank <= 1 ? -10 : rank === 2 ? -20 : -30;
        if ((scope === "all" && ctx.isPercentile)
          || (scope === "physical" && ctx.isPhysical)
          || (scope === "communication" && ctx.isCommunication)
          || (scope === "cool" && ctx.isCoolRoll)
          || (scope === "san" && ctx.isSanRoll)
          || (scope === "combat" && ctx.isCombat)
          || (scope === "listen" && ctx.isListen)
          || (scope === "spot" && ctx.isSpotHidden)
          || (scope === "bureaucracy" && ctx.isBureaucracy)) {
          this.addFlat(acc, penalty, `${trait.name} active`);
        }
        break;
      }
      case "unattractive": {
        if (ctx.isCommunication && (ctx.hasAppearanceTag || this.conditionBool(state, key, "appearance", false))) {
          this.addFlat(acc, -10 * rank, trait.name);
        }
        break;
      }
      case "ambidextrous": {
        if (ctx.isCombat && this.conditionBool(state, key, "offHandUsed", false)) {
          this.addFlat(acc, +20, `${trait.name} (off-hand penalty ignored)`);
        }
        break;
      }
      case "attractive": {
        if (ctx.isCommunication && (ctx.hasAppearanceTag || this.conditionBool(state, key, "appearance", false))) {
          this.addFlat(acc, +10 * rank, trait.name);
        }
        break;
      }
      case "contact": {
        if (ctx.isBureaucracy && this.conditionBool(state, key, "invokeBureaucracy", false)) {
          const abilityKey = "bureaucracy-boost";
          if (!this.isSessionAbilityUsed(state, key, abilityKey)) {
            this.addFlat(acc, +10, `${trait.name} contact leverage`);
            acc.sessionMarks.push({ traitKey: key, abilityKey });
          }
        }
        break;
      }
      case "exceedingly-cool": {
        if (ctx.isCoolRoll) {
          acc.coolPercentDelta += 10;
          acc.effects.push(`${trait.name}: COOL cap +10%`);
        }
        if (ctx.isCoolRoll && this.conditionBool(state, key, "autoPass", false)) {
          const abilityKey = "auto-cool-pass";
          if (!this.isSessionAbilityUsed(state, key, abilityKey)) {
            acc.autoPassCool = true;
          }
        }
        break;
      }
      case "good-hearing": {
        if (ctx.isListen) this.addFlat(acc, +10 * rank, trait.name);
        break;
      }
      case "good-vision": {
        if (ctx.isSpotHidden) this.addFlat(acc, +10 * rank, trait.name);
        break;
      }
      case "good-housing": {
        if (ctx.isDowntimeRecovery || this.conditionBool(state, key, "downtimeRecovery", false)) {
          this.addFlat(acc, +10 * rank, trait.name);
        }
        break;
      }
      case "natural-aptitude-skill": {
        if (ctx.isSkillRoll && this.conditionBool(state, key, "invokeReroll", false)) {
          const abilityKey = "skill-reroll";
          if (!this.isSessionAbilityUsed(state, key, abilityKey)) {
            acc.rerollSkill = true;
            acc.effects.push(`${trait.name}: once/session reroll armed`);
          }
        }
        break;
      }
      case "natural-aptitude-stat": {
        const chosen = this.conditionText(state, key, "stat", "").toLowerCase();
        if (ctx.rollType === "CH" && chosen && chosen === ctx.characteristic) {
          this.addFlat(acc, +5, `${trait.name} (${chosen.toUpperCase()} max +1)`);
        }
        break;
      }
      case "poor-housing": {
        if (ctx.isDowntimeRecovery || this.conditionBool(state, key, "downtimeRecovery", false)) {
          this.addFlat(acc, -10 * rank, trait.name);
        }
        break;
      }
      default:
        break;
    }
  }

  static clampTraitModifier(value = 0) {
    const cap = Number(SLATraitDefinitions.TRAIT_MOD_CAP ?? 40);
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    if (n > cap) return cap;
    if (n < -cap) return -cap;
    return n;
  }

  static async evaluate(actorRef, config = {}, { preview = false } = {}) {
    const actor = this.resolveActor(actorRef);
    if (!actor) {
      return {
        flatMod: 0,
        effects: [],
        summary: "",
        requiresCoolGate: false,
        autoPassCool: false,
        rerollSkill: false,
        coolPercentDelta: 0,
        traits: []
      };
    }

    const state = await this.getState(actor, { clean: true });
    const traits = this.getActorTraits(actor);
    const ctx = this.buildContext(actor, config);
    const acc = {
      flatMod: 0,
      effects: [],
      sessionMarks: [],
      requiresCoolGate: false,
      autoPassCool: false,
      rerollSkill: false,
      coolPercentDelta: 0
    };

    if (!ctx.isPercentile) {
      return {
        flatMod: 0,
        effects: [],
        summary: "",
        requiresCoolGate: false,
        autoPassCool: false,
        rerollSkill: false,
        coolPercentDelta: 0,
        traits
      };
    }

    for (const trait of traits) {
      this.applyTraitToContext(trait, ctx, state, acc);
    }

    const beforeClamp = Number(acc.flatMod ?? 0);
    acc.flatMod = this.clampTraitModifier(acc.flatMod);
    if (beforeClamp !== acc.flatMod) {
      acc.effects.push(`Trait cap applied (${beforeClamp >= 0 ? "+" : ""}${beforeClamp}% -> ${acc.flatMod >= 0 ? "+" : ""}${acc.flatMod}%)`);
    }

    if (!preview && acc.sessionMarks.length > 0) {
      for (const mark of acc.sessionMarks) {
        this.markSessionAbilityUsed(state, mark.traitKey, mark.abilityKey);
      }
      await this.setState(actor, state);
    }

    return {
      flatMod: Number(acc.flatMod ?? 0),
      effects: acc.effects,
      summary: acc.effects.join("; "),
      requiresCoolGate: Boolean(acc.requiresCoolGate),
      autoPassCool: Boolean(acc.autoPassCool),
      rerollSkill: Boolean(acc.rerollSkill),
      coolPercentDelta: Number(acc.coolPercentDelta ?? 0),
      traits
    };
  }

  static async getCheckContext(actorRef, config = {}, { preview = false } = {}) {
    return this.evaluate(actorRef, config, { preview });
  }

  static async getMentalContext(actorRef, {
    kind = "cool",
    reason = "",
    preview = false,
    modifier = 0
  } = {}) {
    const rollType = String(kind ?? "cool").toLowerCase() === "san" ? "SAN" : "COOL";
    const config = {
      rollType,
      cardType: "NO",
      label: rollType,
      reason,
      flatMod: Number(modifier ?? 0)
    };
    const ctx = await this.evaluate(actorRef, config, { preview });
    return {
      flatMod: Number(ctx.flatMod ?? 0),
      coolPercentDelta: Number(ctx.coolPercentDelta ?? 0),
      autoPassCool: Boolean(ctx.autoPassCool && rollType === "COOL"),
      effects: Array.isArray(ctx.effects) ? ctx.effects : [],
      summary: String(ctx.summary ?? ""),
      requiresCoolGate: Boolean(ctx.requiresCoolGate)
    };
  }

  static async evaluateCombatGate(actorRef, config = {}, { preview = false } = {}) {
    const ctx = await this.evaluate(actorRef, {
      ...config,
      rollType: String(config?.rollType ?? "CM").toUpperCase(),
      cardType: String(config?.cardType ?? "NO").toUpperCase()
    }, { preview });

    return {
      requiresCoolGate: Boolean(ctx.requiresCoolGate),
      summary: String(ctx.summary ?? ""),
      effects: Array.isArray(ctx.effects) ? ctx.effects : []
    };
  }

  static initiativePriority(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return 0;
    return this.hasTrait(actor, "pacifist") ? -10000 : 0;
  }

  static async resetActorSessionUsage(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return { ok: false, reason: "no-actor" };
    const state = await this.getState(actor, { clean: true });
    state.session = {};
    state.meta = state.meta ?? {};
    state.meta.lastResetAt = Date.now();
    await this.setState(actor, state);
    return { ok: true, actor: actor.name };
  }

  static async resetAllSessionUsage({ includeNPC = false } = {}) {
    const actorTypes = includeNPC ? new Set(["character", "npc"]) : new Set(["character"]);
    let updated = 0;
    for (const actor of game.actors ?? []) {
      if (!actorTypes.has(String(actor.type ?? ""))) continue;
      if (!(actor.items?.some((item) => item.type === "persTrait"))) continue;
      const state = await this.getState(actor, { clean: true });
      state.session = {};
      state.meta = state.meta ?? {};
      state.meta.lastResetAt = Date.now();
      await this.setState(actor, state);
      updated += 1;
    }
    return { ok: true, updated };
  }

  static async consumeSessionAbility(actorRef, traitKey = "", abilityKey = "default") {
    const actor = this.resolveActor(actorRef);
    if (!actor) return { ok: false, reason: "no-actor" };
    const key = SLATraitDefinitions.toKey(traitKey);
    if (!key) return { ok: false, reason: "no-trait" };
    const state = await this.getState(actor, { clean: true });
    this.markSessionAbilityUsed(state, key, abilityKey);
    await this.setState(actor, state);
    return { ok: true, actor: actor.name, trait: key, ability: abilityKey };
  }

  static automationStatus(traitKey = "") {
    const key = SLATraitDefinitions.toKey(traitKey);
    const narrativeOnly = new Set(["enemy", "savings", "sterile"]);
    const partial = new Set(["anger", "chicken", "debt", "allergy", "illness", "phobia", "psychosis"]);
    if (narrativeOnly.has(key)) return "Narrative";
    if (partial.has(key)) return "Partial";
    return "Full";
  }

  static automationSummary(traitKey = "", rank = 1) {
    const key = SLATraitDefinitions.toKey(traitKey);
    const r = Math.max(1, Number(rank ?? 1));
    switch (key) {
      case "addiction-compulsion": return `Unmet condition applies -${10 * r}% to rolls.`;
      case "allergy": return r >= 2 ? "Exposure applies major CON/physical penalties; severe rank tracks hazard pressure." : "Exposure applies CON/physical penalty.";
      case "anger": return "Attacked state enforces behavioral pressure and tactical focus penalty.";
      case "anxiety": return `COOL and fear SAN penalties (-${10 * r}%).`;
      case "arrogant": return "Social penalty vs equal/lower SCL contexts.";
      case "chicken": return "COOL cap reduction and optional first-combat COOL gate.";
      case "debt": return "Economic pressure tracked; rank 3 adds Bureaucracy audit strain.";
      case "depression": return `Communication penalty (-${10 * r}%); additional SAN-linked pressure.`;
      case "drug-addict": return "Withdrawal penalties to physical, COOL, and SAN rolls.";
      case "enemy": return "Narrative antagonist trigger; no flat roll modifier by default.";
      case "illness": return "Scoped penalties when active; severe rank retains long-term characteristic pressure.";
      case "pacifist": return "Combat attacks require COOL pass and initiative priority is forced last.";
      case "phobia": return "Exposure applies COOL penalties; severe rank flags immediate SAN pressure.";
      case "poor-hearing": return `Listen penalty (-${10 * r}%).`;
      case "poor-vision": return `Spot/ranged-vision penalties (-${10 * r}% in scoped cases).`;
      case "psychosis": return "Active scoped instability penalties with rank scaling.";
      case "unattractive": return `Appearance-social penalty (-${10 * r}%).`;
      case "ambidextrous": return "Off-hand combat penalty suppression when condition is set.";
      case "attractive": return `Appearance-social bonus (+${10 * r}%).`;
      case "contact": return "Once/session Bureaucracy leverage when invoked.";
      case "exceedingly-cool": return "COOL cap boost and once/session auto-pass hook.";
      case "good-hearing": return `Listen bonus (+${10 * r}%).`;
      case "good-vision": return `Spot Hidden bonus (+${10 * r}%).`;
      case "good-housing": return "Downtime recovery bonus.";
      case "natural-aptitude-skill": return "Once/session failed-skill reroll automation.";
      case "natural-aptitude-stat": return "Selected characteristic roll boost for max+1 equivalent.";
      case "savings": return "Economic reserve trait tracked narratively (credits policy).";
      case "poor-housing": return "Downtime recovery penalty.";
      case "sterile": return "Narrative-only biological consequence.";
      default: return "No automation mapping found.";
    }
  }
}
