import { SLADialog } from "./sla-dialog.mjs";

export class SLAEbbSystem {
  static FLAG_KEY = "slaEbb";
  static DEFAULT_CORE_SKILL = "Ebb (Core)";
  static EBB_SPECIES = new Set(["ebon", "brainwaster"]);

  static DISCIPLINE_DEFAULTS = {
    awareness: {
      id: "awareness",
      name: "Awareness",
      skillRef: "Ebb Awareness",
      attack: false,
      tiers: [
        { id: "basic", label: "Basic", cost: 1, duration: "1 minute" },
        { id: "strong", label: "Strong", cost: 3, duration: "2 minutes" },
        { id: "extreme", label: "Extreme", cost: 5, duration: "3 minutes" }
      ]
    },
    blast: {
      id: "blast",
      name: "Blast",
      skillRef: "Ebb Blast",
      attack: true,
      special: { specialDoubleDice: true, criticalMode: "max-ignore-armour" },
      tiers: [
        { id: "basic", label: "Basic", cost: 1, damage: "1D6", ignoreArmour: 2 },
        { id: "strong", label: "Strong", cost: 3, damage: "2D6", ignoreArmour: 4 },
        { id: "extreme", label: "Extreme", cost: 5, damage: "3D6", ignoreArmour: 6 }
      ]
    },
    "thermal-red": {
      id: "thermal-red",
      name: "Thermal (Red)",
      skillRef: "Ebb Thermal (Red)",
      attack: true,
      tiers: [
        { id: "basic", label: "Basic", cost: 1, damage: "1D6", ignoreArmour: 2 },
        { id: "strong", label: "Strong", cost: 3, damage: "2D6", ignoreArmour: 4 },
        { id: "extreme", label: "Extreme", cost: 5, damage: "3D6", ignoreArmour: 6 }
      ]
    },
    "thermal-blue": {
      id: "thermal-blue",
      name: "Thermal (Blue)",
      skillRef: "Ebb Thermal (Blue)",
      attack: true,
      tiers: [
        { id: "basic", label: "Basic", cost: 1, damage: "1D6" },
        { id: "strong", label: "Strong", cost: 3, damage: "2D6" },
        { id: "extreme", label: "Extreme", cost: 5, damage: "3D6" }
      ]
    },
    telekinesis: {
      id: "telekinesis",
      name: "Telekinesis",
      skillRef: "Ebb Telekinesis",
      attack: false,
      tiers: [
        { id: "basic", label: "Basic", cost: 1, duration: "Sustained" },
        { id: "strong", label: "Strong", cost: 3, duration: "Sustained" },
        { id: "extreme", label: "Extreme", cost: 5, duration: "Sustained" }
      ]
    },
    communicate: {
      id: "communicate",
      name: "Communicate",
      skillRef: "Ebb Communicate",
      attack: false,
      tiers: [
        { id: "basic", label: "Basic", cost: 1, duration: "1 minute" },
        { id: "strong", label: "Strong", cost: 3, duration: "1 minute" },
        { id: "extreme", label: "Extreme", cost: 5, duration: "1 minute" }
      ]
    },
    senses: {
      id: "senses",
      name: "Senses",
      skillRef: "Ebb Senses",
      attack: false,
      tiers: [
        { id: "basic", label: "Basic", cost: 1, duration: "POW rounds", rollMods: { perception: 20 } },
        { id: "strong", label: "Strong", cost: 3, duration: "POW rounds", rollMods: { perception: 30 } },
        { id: "extreme", label: "Extreme", cost: 5, duration: "POW rounds", rollMods: { perception: 40 } }
      ]
    },
    protect: {
      id: "protect",
      name: "Protect",
      skillRef: "Ebb Protect",
      attack: false,
      special: { criticalMode: "dual-protect" },
      tiers: [
        { id: "basic", label: "Basic", cost: 1, duration: "POW rounds", avBonus: 2, protectType: "physical" },
        { id: "strong", label: "Strong", cost: 3, duration: "POW rounds", avBonus: 4, protectType: "physical" },
        { id: "extreme", label: "Extreme", cost: 5, duration: "POW rounds", avBonus: 6, protectType: "physical" }
      ]
    },
    heal: {
      id: "heal",
      name: "Heal",
      skillRef: "Ebb Heal",
      attack: false,
      tiers: [
        { id: "basic", label: "Basic", cost: 2, healing: "1D6" },
        { id: "strong", label: "Strong", cost: 4, healing: "2D6" },
        { id: "extreme", label: "Extreme", cost: 6, healing: "3D6" }
      ]
    },
    "reality-fold": {
      id: "reality-fold",
      name: "Reality Fold",
      skillRef: "Ebb Reality Fold",
      attack: false,
      tiers: [
        { id: "basic", label: "Basic", cost: 5, duration: "Instant" },
        { id: "strong", label: "Strong", cost: 7, duration: "Instant" },
        { id: "extreme", label: "Extreme", cost: 9, duration: "Instant" }
      ]
    }
  };

  static DISCIPLINE_ALIASES = {
    ebbheal: "heal",
    gorecannon: "blast",
    ebbenhancement: "protect",
    realityfold: "reality-fold",
    thermalred: "thermal-red",
    thermalblue: "thermal-blue"
  };

  static resolveActor(actorRef) {
    if (!actorRef) return null;
    if (actorRef.documentName === "Actor") return actorRef;
    if (typeof actorRef === "string") {
      return game.actors.get(actorRef) ?? game.actors.find((a) => a.name === actorRef) ?? null;
    }
    return null;
  }

  static normalizeText(value = "") {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static getActorSpeciesName(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return "";
    const cultureItem = actor.items?.find((item) => item.type === "culture");
    const raw = String(cultureItem?.name ?? actor.system?.culture ?? "");
    return raw.trim();
  }

  static isEbbSpecies(actorRef) {
    const species = this.normalizeText(this.getActorSpeciesName(actorRef));
    if (!species) return false;
    if (species.includes("ebon")) return true;
    if (species.includes("brainwaster")) return true;
    return this.EBB_SPECIES.has(species);
  }

  static normalizeDisciplineId(value = "") {
    const norm = this.normalizeText(value);
    if (!norm) return "";
    const mapped = this.DISCIPLINE_ALIASES[norm] ?? norm;
    if (mapped in this.DISCIPLINE_DEFAULTS) return mapped;
    if (mapped.startsWith("thermalred")) return "thermal-red";
    if (mapped.startsWith("thermalblue")) return "thermal-blue";
    if (mapped.startsWith("realityfold")) return "reality-fold";
    if (mapped.startsWith("telekinesis")) return "telekinesis";
    if (mapped.startsWith("communicate")) return "communicate";
    if (mapped.startsWith("awareness")) return "awareness";
    if (mapped.startsWith("blast")) return "blast";
    if (mapped.startsWith("senses")) return "senses";
    if (mapped.startsWith("protect")) return "protect";
    if (mapped.startsWith("heal")) return "heal";
    return mapped;
  }

  static get roundSeconds() {
    return Math.max(1, Number(CONFIG?.time?.roundTime ?? game.combat?.roundTime ?? 6));
  }

  static getDefaultState() {
    return {
      active: {},
      counters: {
        fumbles: 0,
        overchargeFails: 0
      },
      lastUse: {
        abilityId: "",
        disciplineId: "",
        tierId: "",
        resultLevel: 0,
        spent: 0
      }
    };
  }

  static async getState(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return this.getDefaultState();
    const fromSystem = actor.flags?.[game.system.id]?.[this.FLAG_KEY];
    const fromLegacy = actor.flags?.brp?.[this.FLAG_KEY];
    return foundry.utils.mergeObject(
      this.getDefaultState(),
      foundry.utils.deepClone(fromSystem ?? fromLegacy ?? {}),
      { inplace: false }
    );
  }

  static async setState(actorRef, state) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return;
    await actor.setFlag(game.system.id, this.FLAG_KEY, state);
  }

  static isEbbAbility(item) {
    if (!item || item.type !== "psychic") return false;
    const brpid = String(
      item.flags?.[game.system.id]?.brpidFlag?.id ??
      item.flags?.brp?.brpidFlag?.id ??
      ""
    ).toLowerCase();
    if (brpid.startsWith("i.psychic.sla-")) return true;

    const hasMeta = Boolean(item.flags?.[game.system.id]?.slaEbb ?? item.flags?.brp?.slaEbb);
    if (hasMeta) return true;

    return /ebb/i.test(String(item.name ?? ""));
  }

  static getAbilityMeta(ability) {
    const rawMeta = foundry.utils.mergeObject(
      foundry.utils.deepClone(this.DISCIPLINE_DEFAULTS[this.normalizeDisciplineId(ability?.name ?? "")] ?? {}),
      foundry.utils.deepClone(ability?.flags?.[game.system.id]?.slaEbb ?? ability?.flags?.brp?.slaEbb ?? {}),
      { inplace: false }
    );

    const id = this.normalizeDisciplineId(
      rawMeta.id ?? rawMeta.disciplineId ?? ability?.name ?? ability?.id ?? ""
    );
    const baseMeta = foundry.utils.deepClone(this.DISCIPLINE_DEFAULTS[id] ?? {});
    const merged = foundry.utils.mergeObject(baseMeta, rawMeta, { inplace: false });
    merged.id = id || this.normalizeDisciplineId(ability?.name ?? "");
    merged.name = merged.name ?? ability?.name ?? "Ebb Discipline";
    merged.skillRef = merged.skillRef ?? `Ebb ${merged.name}`;
    merged.coreSkillRef = merged.coreSkillRef ?? this.DEFAULT_CORE_SKILL;
    merged.attack = Boolean(merged.attack);

    const tiers = Array.isArray(merged.tiers) ? merged.tiers : [];
    if (!tiers.length) {
      tiers.push({
        id: "basic",
        label: "Basic",
        cost: Math.max(1, Number(ability?.system?.pppl ?? 1) || 1),
        duration: String(ability?.system?.duration ?? "Instant")
      });
    }
    merged.tiers = tiers
      .map((tier, index) => ({
        id: String(tier.id ?? ["basic", "strong", "extreme"][index] ?? `tier-${index + 1}`),
        label: String(tier.label ?? tier.id ?? `Tier ${index + 1}`),
        cost: Math.max(1, Number(tier.cost ?? ability?.system?.pppl ?? 1) || 1),
        damage: String(tier.damage ?? ""),
        healing: String(tier.healing ?? ""),
        duration: tier.duration ?? ability?.system?.duration ?? "Instant",
        range: String(tier.range ?? ability?.system?.range ?? ""),
        ignoreArmour: Number(tier.ignoreArmour ?? 0),
        rollMods: tier.rollMods ?? {},
        avBonus: Number(tier.avBonus ?? 0),
        protectType: String(tier.protectType ?? "physical"),
        effect: String(tier.effect ?? "")
      }))
      .sort((a, b) => this.tierOrder(a.id) - this.tierOrder(b.id));

    return merged;
  }

  static tierOrder(id = "") {
    const key = String(id).toLowerCase();
    if (key === "basic") return 0;
    if (key === "strong") return 1;
    if (key === "extreme") return 2;
    return 99;
  }

  static getTier(meta, tierId = "") {
    const tiers = Array.isArray(meta?.tiers) ? meta.tiers : [];
    if (!tiers.length) return null;
    if (tierId) {
      const key = String(tierId).toLowerCase();
      const found = tiers.find((tier) => String(tier.id).toLowerCase() === key);
      if (found) return found;
    }
    return tiers[0];
  }

  static getAbilityCost(ability, tierId = "") {
    const meta = this.getAbilityMeta(ability);
    const tier = this.getTier(meta, tierId);
    return Math.max(1, Number(tier?.cost ?? ability?.system?.pppl ?? 1) || 1);
  }

  static resolveAbility(actor, abilityRef) {
    if (!actor) return null;
    if (!abilityRef) return null;
    if (typeof abilityRef === "string") {
      return actor.items.get(abilityRef) ?? actor.items.find((i) => i.name === abilityRef && i.type === "psychic") ?? null;
    }
    if (abilityRef.type === "psychic") return abilityRef;
    return null;
  }

  static resolveSkillByBrpid(actor, brpid) {
    if (!actor || !brpid || brpid === "none") return null;
    return actor.items.find((item) => {
      if (item.type !== "skill") return false;
      const id = String(
        item.flags?.[game.system.id]?.brpidFlag?.id ??
        item.flags?.brp?.brpidFlag?.id ??
        ""
      ).trim();
      return id === brpid;
    }) ?? null;
  }

  static resolveSkillByName(actor, name = "") {
    const target = this.normalizeText(name);
    if (!actor || !target) return null;
    return actor.items.find((item) => item.type === "skill" && this.normalizeText(item.name) === target) ?? null;
  }

  static isEbbSkillName(name = "") {
    const norm = this.normalizeText(name);
    if (!norm) return false;
    return norm === "ebbcore" || norm.startsWith("ebb");
  }

  static resolveAnyEbbSkill(actor) {
    if (!actor) return null;
    return actor.items.find((item) => item.type === "skill" && this.isEbbSkillName(item.name)) ?? null;
  }

  static getDisciplineSkillCandidates(abilityMeta = null, ability = null) {
    const meta = abilityMeta ?? {};
    const out = [];
    const push = (value) => {
      const text = String(value ?? "").trim();
      if (!text) return;
      const key = this.normalizeText(text);
      if (!key || out.some((existing) => this.normalizeText(existing) === key)) return;
      out.push(text);
    };

    push(meta.skillRef);
    push(meta.coreSkillRef);
    push(this.DEFAULT_CORE_SKILL);
    if (meta.name) {
      push(`Ebb ${meta.name}`);
      push(meta.name);
      push(String(meta.name).replace(/[()]/g, " ").replace(/\s+/g, " ").trim());
    }
    if (ability?.name) {
      push(`Ebb ${ability.name}`);
      push(ability.name);
    }
    return out;
  }

  static resolveDisciplineSkill(actor, ability, meta = null) {
    const abilityMeta = meta ?? this.getAbilityMeta(ability);
    const metaSkillBrpid = String(abilityMeta?.skillBrpid ?? "");
    const byBrpid = this.resolveSkillByBrpid(actor, metaSkillBrpid);
    if (byBrpid) return byBrpid;

    for (const candidate of this.getDisciplineSkillCandidates(abilityMeta, ability)) {
      const byName = this.resolveSkillByName(actor, candidate);
      if (byName) return byName;
    }

    const coreFallback = this.resolveCoreSkill(actor, abilityMeta);
    if (coreFallback) return coreFallback;

    const genericEbbFallback = this.resolveAnyEbbSkill(actor);
    if (genericEbbFallback) return genericEbbFallback;

    return null;
  }

  static resolveCoreSkill(actor, meta = null) {
    const coreBrpid = String(meta?.coreSkillBrpid ?? "");
    const fromBrpid = this.resolveSkillByBrpid(actor, coreBrpid);
    if (fromBrpid) return fromBrpid;
    return this.resolveSkillByName(actor, meta?.coreSkillRef ?? this.DEFAULT_CORE_SKILL);
  }

  static getRollTarget(actor, item) {
    if (!actor || !item) return 0;
    const base = Number(item.system?.total ?? 0);
    if (actor.type !== "character") return base;
    const category = String(item.system?.category ?? "");
    const categoryBonus = Number(actor.system?.skillcategory?.[category] ?? 0);
    return base + categoryBonus;
  }

  static resultLevelFromRoll(rollVal, targetScore, cardType = "NO") {
    const critChance = Math.ceil(0.05 * targetScore);
    const fumbleChance = Math.min(95 + critChance, 100);
    const specialChance = Math.round(0.2 * targetScore);
    let successChance = Math.min(targetScore, 95);
    if (["RE", "PP"].includes(cardType)) {
      successChance = targetScore;
    }
    if (rollVal <= critChance) return 4;
    if (rollVal <= specialChance) return 3;
    if (rollVal <= successChance) return 2;
    if (rollVal >= fumbleChance) return 0;
    return 1;
  }

  static resultLabel(resultLevel = 1) {
    const map = {
      0: "Fumble",
      1: "Failure",
      2: "Success",
      3: "Special",
      4: "Critical"
    };
    return map[Number(resultLevel)] ?? "Result";
  }

  static async rollFormulaTotal(formula = "") {
    const text = String(formula ?? "").trim();
    if (!text) return 0;
    const roll = await new Roll(text).evaluate();
    if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(roll, game.user, true, null, false);
    }
    return Number(roll.total ?? 0);
  }

  static maxFromFormula(formula = "", fallback = 0) {
    const text = String(formula ?? "").replace(/\s+/g, "").toLowerCase();
    const match = text.match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (!match) return Number(fallback ?? 0);
    const dice = Number(match[1] ?? 0);
    const faces = Number(match[2] ?? 0);
    const mod = Number(match[3] ?? 0);
    return (dice * faces) + mod;
  }

  static async rollSkillCheck(actor, item) {
    const target = Math.max(1, Number(this.getRollTarget(actor, item) ?? 0));
    const roll = await new Roll("1D100").evaluate();
    if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(roll, game.user, true, null, false);
    }
    const rollVal = Number(roll.total ?? 0);
    const resultLevel = this.resultLevelFromRoll(rollVal, target, "NO");
    return {
      rollVal,
      target,
      resultLevel,
      resultLabel: this.resultLabel(resultLevel),
      sourceId: item?.id ?? "",
      sourceName: item?.name ?? ""
    };
  }

  static durationToSeconds(durationSpec, actor) {
    if (!durationSpec) return 0;
    if (typeof durationSpec === "object") {
      let total = 0;
      total += Math.max(0, Number(durationSpec.hours ?? 0)) * 3600;
      total += Math.max(0, Number(durationSpec.minutes ?? 0)) * 60;
      let rounds = Math.max(0, Number(durationSpec.rounds ?? 0));
      if (durationSpec.powRounds) {
        rounds = Math.max(rounds, Math.max(0, Number(actor?.system?.stats?.pow?.total ?? 0)));
      }
      total += rounds * this.roundSeconds;
      return Math.max(0, Math.floor(total));
    }

    const text = String(durationSpec).trim().toLowerCase();
    if (!text || text === "instant") return 0;
    const pow = Math.max(0, Number(actor?.system?.stats?.pow?.total ?? 0));
    const first = Number((text.match(/(\d+)/)?.[1] ?? 0) || 0);

    if (text.includes("pow") && text.includes("round")) return pow * this.roundSeconds;
    if (text.includes("pow") && text.includes("minute")) return pow * 60;
    if (text.includes("pow") && text.includes("hour")) return pow * 3600;
    if (text.includes("round")) return first * this.roundSeconds;
    if (text.includes("minute") || text.includes("min")) return first * 60;
    if (text.includes("hour")) return first * 3600;
    return 0;
  }

  static formatRemaining(expiresAt = 0, now = Date.now()) {
    const remainingMs = Math.max(0, Number(expiresAt ?? 0) - Number(now));
    if (remainingMs <= 0) return "0s";
    const seconds = Math.ceil(remainingMs / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${secs}s`;
  }

  static async promptTier(meta) {
    const tiers = Array.isArray(meta?.tiers) ? meta.tiers : [];
    if (!tiers.length) return null;
    if (tiers.length === 1) return tiers[0];

    const options = tiers
      .map((tier) => `<option value="${tier.id}">${tier.label} (${tier.cost} EBB)</option>`)
      .join("");

    const content = `
      <form id="sla-ebb-tier-form" class="brp sla-roll-dialog">
        <header class="sla-dialog-head">
          <div class="sla-dialog-kicker">SLA INDUSTRIES // EBB CONTROL</div>
          <div class="diff-label">${foundry.utils.escapeHTML(String(meta?.name ?? "EBB"))}</div>
          <div class="sla-dialog-sub">Select tier and confirm cost before activation.</div>
        </header>
        <div class="flexrow">
          <label class="resource-label-diff">Tier</label>
          <select name="tierId">${options}</select>
        </div>
      </form>
    `;

    const formData = await SLADialog.waitForm({
      title: `Use ${meta.name}`,
      content,
      formSelector: "#sla-ebb-tier-form",
      submitLabel: "Use",
      cancelLabel: "Cancel",
      cancelValue: false
    });
    if (!formData) return null;
    const tierId = String(formData.get("tierId") ?? "");
    return this.getTier(meta, tierId) ?? tiers[0];
  }

  static async promptBacklashMode(actorName = "") {
    const content = `
      <form class="brp sla-roll-dialog">
        <header class="sla-dialog-head">
          <div class="sla-dialog-kicker">SLA INDUSTRIES // EBB BACKLASH</div>
          <div class="diff-label">${foundry.utils.escapeHTML(String(actorName || "Actor"))}</div>
          <div class="sla-dialog-sub">Fumbled EBB control. Choose backlash mode.</div>
        </header>
      </form>
    `;
    const choice = await SLADialog.choose({
      title: "EBB Backlash",
      content,
      choices: {
        hp: { label: "HP Burn", value: "hp" },
        san: { label: "SAN Shock", value: "san" }
      },
      defaultChoice: "hp",
      cancelValue: "hp"
    });
    return String(choice ?? "hp");
  }

  static async applyHealthDamage(actor, amount) {
    const value = Math.max(0, Number(amount ?? 0));
    if (!actor || value <= 0) return 0;
    const { BRPDamage } = await import("../combat/damage.mjs");
    const result = await BRPDamage.applyResolvedDamage({ actor, damage: value, locationId: "" });
    return result.ok ? value : 0;
  }

  static async applySanityDamage(actor, amount) {
    const value = Math.max(0, Number(amount ?? 0));
    if (!actor || value <= 0) return 0;
    const current = Math.max(0, Number(actor.system?.sanity?.value ?? 0));
    const next = Math.max(0, current - value);
    await actor.update({ "system.sanity.value": next });
    return current - next;
  }

  static async applyHealingDetailed(actor, amount) {
    const rolled = Math.max(0, Number(amount ?? 0));
    if (!actor || rolled <= 0) {
      return {
        rolled,
        applied: 0,
        before: Math.max(0, Number(actor?.system?.health?.value ?? 0)),
        after: Math.max(0, Number(actor?.system?.health?.value ?? 0)),
        max: Math.max(0, Number(actor?.system?.health?.max ?? 0))
      };
    }
    const maxHp = Math.max(0, Number(actor.system?.health?.max ?? 0));
    const currentHp = Math.max(0, Number(actor.system?.health?.value ?? 0));
    const nextHp = Math.min(maxHp, currentHp + rolled);
    await actor.update({ "system.health.value": nextHp });
    return {
      rolled,
      applied: Math.max(0, nextHp - currentHp),
      before: currentHp,
      after: nextHp,
      max: maxHp
    };
  }

  static async applyHealing(actor, amount) {
    const result = await this.applyHealingDetailed(actor, amount);
    return Number(result.applied ?? 0);
  }

  static resolvePrimaryTargetActor(actor, { fallbackToActor = true } = {}) {
    const targetToken = [...(game.user?.targets ?? [])][0];
    if (targetToken?.actor) return targetToken.actor;
    return fallbackToActor ? actor : null;
  }

  static getDummyTargetName() {
    const localized = game.i18n.localize("BRP.slaDamageDummyTarget");
    if (localized && localized !== "BRP.slaDamageDummyTarget") return localized;
    return "Dummy Target";
  }

  static buildEffectSummary(entry = {}) {
    const parts = [];
    const rollMods = entry.rollMods ?? {};
    if (Number(rollMods.perception ?? 0)) {
      parts.push(`Perception ${rollMods.perception > 0 ? "+" : ""}${Number(rollMods.perception)}%`);
    }
    if (Number(entry.avBonus ?? 0)) {
      const typeLabel = String(entry.protectType ?? "physical").toLowerCase();
      parts.push(`+${Number(entry.avBonus)} AV (${typeLabel})`);
    }
    if (entry.effectText) parts.push(entry.effectText);
    return parts.join(" | ");
  }

  static async resolveExpired(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return { expired: 0 };
    const state = await this.getState(actor);
    const now = Date.now();
    let expired = 0;
    let changed = false;

    for (const [key, entry] of Object.entries(state.active ?? {})) {
      if (!entry?.expiresAt || Number(entry.expiresAt) > now) continue;
      delete state.active[key];
      expired += 1;
      changed = true;
    }

    if (changed) {
      await this.setState(actor, state);
    }
    return { expired };
  }

  static _buildSkillContext(actor, config = {}) {
    const result = {
      characteristic: String(config?.characteristic ?? "").toLowerCase(),
      isSkillRoll: ["SK", "CM", "QC", "AL", "PA", "PT", "RP"].includes(config?.rollType),
      isPerception: false
    };
    const item = config?.skillId ? actor?.items?.get(config.skillId) : null;
    const text = this.normalizeText(`${item?.name ?? config?.label ?? ""} ${item?.system?.category ?? ""}`);
    result.isPerception = /spot|listen|perception|awareness|sense|research|insight/.test(text);
    return result;
  }

  static _applyRollModsToContext(ctx, rollMods = {}, skillCtx = {}, label = "EBB", effects = []) {
    const add = (value, text) => {
      if (!value) return;
      ctx.flatMod += Number(value);
      const sign = Number(value) > 0 ? "+" : "";
      effects.push(`${label}: ${text} ${sign}${Number(value)}%`);
    };

    if (skillCtx.isSkillRoll) {
      add(rollMods.allSkills, "all skills");
      if (skillCtx.isPerception) {
        add(rollMods.perception, "perception");
      }
    }
  }

  static async getCheckContext(actorRef, config = {}, { preview = false } = {}) {
    const actor = this.resolveActor(actorRef);
    if (!actor) {
      return {
        flatMod: 0,
        effects: [],
        summary: ""
      };
    }
    if (!this.isEbbSpecies(actor)) {
      return {
        flatMod: 0,
        effects: [],
        summary: ""
      };
    }
    if (!preview) {
      await this.resolveExpired(actor);
    }
    const state = await this.getState(actor);
    const now = Date.now();
    const skillCtx = this._buildSkillContext(actor, config);
    const ctx = { flatMod: 0 };
    const effects = [];

    for (const entry of Object.values(state.active ?? {})) {
      if (!entry || (entry.expiresAt && Number(entry.expiresAt) <= now)) continue;
      this._applyRollModsToContext(ctx, entry.rollMods ?? {}, skillCtx, entry.name ?? "EBB", effects);
    }

    return {
      flatMod: Number(ctx.flatMod ?? 0),
      effects,
      summary: effects.join("; ")
    };
  }

  static async getArmourBonus(actorRef, { vs = "physical", preview = false } = {}) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return 0;
    if (!this.isEbbSpecies(actor)) return 0;
    if (!preview) {
      await this.resolveExpired(actor);
    }
    const state = await this.getState(actor);
    const now = Date.now();
    const mode = String(vs ?? "physical").toLowerCase();
    let bonus = 0;

    for (const entry of Object.values(state.active ?? {})) {
      if (!entry || (entry.expiresAt && Number(entry.expiresAt) <= now)) continue;
      const entryMode = String(entry.protectType ?? "").toLowerCase();
      const value = Math.max(0, Number(entry.avBonus ?? 0));
      if (!value) continue;
      if (entryMode === "both") {
        bonus += value;
      } else if (mode === "ebb" && entryMode === "ebb") {
        bonus += value;
      } else if (mode !== "ebb" && (entryMode === "physical" || entryMode === "kinetic" || entryMode === "ballistic")) {
        bonus += value;
      }
    }

    return bonus;
  }

  static async postEbbStateChat({
    actor,
    title = "EBB Use",
    summary = "",
    details = [],
    ability = null
  } = {}) {
    if (!actor) return;
    const lines = [];
    if (summary) lines.push(`<div class="sla-ebb-chat-summary">${summary}</div>`);
    for (const line of details ?? []) {
      if (line) lines.push(`<div class="sla-ebb-chat-line">${line}</div>`);
    }

    const actorName = foundry.utils.escapeHTML(String(actor.name ?? ""));
    const titleText = foundry.utils.escapeHTML(String(title ?? "EBB Use"));
    const actorImg = String(actor.img ?? "icons/svg/mystery-man.svg");
    const abilityImg = String(ability?.img ?? actorImg);

    const content = `
      <form class="brp gr-card sla-ebb-chat-card">
        <div class="bold sla-ebb-chat-title">${titleText}</div>
        <ol class="gr-list">
          <li class="actor-roll">
            <img class="open-actor sla-ebb-chat-portrait" src="${actorImg}" height="60" width="60" title="${actorName}" />
            <div class="roll-details">
              <div class="header roll-truncate">
                <img class="sla-ebb-chat-discipline-icon" src="${abilityImg}" width="26" height="26" />
                <div class="name"><span class="tag">${actorName}</span></div>
              </div>
              <div class="sla-ebb-chat-block">
          ${lines.join("")}
              </div>
            </div>
          </li>
        </ol>
      </form>
    `;
    let chatType = "";
    if (!foundry.utils.isNewerVersion(game.version, "11")) {
      chatType = CONST.CHAT_MESSAGE_STYLES.OTHER;
    } else {
      chatType = CONST.CHAT_MESSAGE_OTHER;
    }
    await ChatMessage.create({
      author: game.user.id,
      type: chatType,
      content,
      speaker: {
        actor: actor.id,
        alias: actor.name
      }
    });
  }

  static buildActiveEntry(actor, meta, tier, resultLevel) {
    const durationSeconds = this.durationToSeconds(tier.duration ?? meta.duration, actor);
    if (durationSeconds <= 0) return null;
    const now = Date.now();
    const key = `${meta.id}-${tier.id}-${now}`;
    const effectText = tier.effect || meta.effect || "";
    let protectType = String(tier.protectType ?? "physical");
    if (meta.id === "protect" && Number(resultLevel) >= 4 && meta.special?.criticalMode === "dual-protect") {
      protectType = "both";
    }
    return {
      id: key,
      disciplineId: meta.id,
      name: `${meta.name} (${tier.label})`,
      startedAt: now,
      expiresAt: now + (durationSeconds * 1000),
      duration: tier.duration ?? meta.duration ?? "",
      rollMods: foundry.utils.deepClone(tier.rollMods ?? {}),
      avBonus: Number(tier.avBonus ?? 0),
      protectType,
      effectText
    };
  }

  static async registerActiveEntry(actor, entry) {
    if (!actor || !entry) return;
    const state = await this.getState(actor);
    state.active[entry.id] = entry;
    await this.setState(actor, state);
  }

  static async useAbility({
    actor,
    ability,
    tierId = "",
    level = 0,
    spend = true,
    shiftKey = false,
    promptTier = true
  } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) {
      ui.notifications.warn("SLA EBB: actor not found.");
      return { ok: false, reason: "no-actor" };
    }
    if (!this.isEbbSpecies(resolvedActor)) {
      ui.notifications.warn(`${resolvedActor.name}: EBB is restricted to Ebon or Brain Waster operatives.`);
      return { ok: false, reason: "species-not-eligible" };
    }

    await this.resolveExpired(resolvedActor);

    const ebbAbility = this.resolveAbility(resolvedActor, ability);
    if (!ebbAbility || ebbAbility.type !== "psychic") {
      ui.notifications.warn("SLA EBB: ability not found.");
      return { ok: false, reason: "no-ability" };
    }

    const meta = this.getAbilityMeta(ebbAbility);
    let requestedTierId = String(tierId ?? "");
    const numericLevel = Math.max(0, Number(level ?? 0));
    if (!requestedTierId && numericLevel > 0) {
      requestedTierId = ["basic", "strong", "extreme"][Math.min(2, numericLevel - 1)] ?? "basic";
    }
    let tier = this.getTier(meta, requestedTierId);
    if (!tier) {
      ui.notifications.warn("SLA EBB: no tier definition.");
      return { ok: false, reason: "no-tier" };
    }
    if (promptTier && !shiftKey) {
      const picked = await this.promptTier(meta);
      if (!picked) return { ok: false, reason: "cancelled" };
      tier = picked;
    }

    const currentFlux = Math.max(0, Number(resolvedActor.system?.power?.value ?? 0));
    const declaredCost = Math.max(1, Number(tier.cost ?? 1));
    if (spend && currentFlux < declaredCost) {
      ui.notifications.warn(`${resolvedActor.name}: not enough EBB (${currentFlux}/${declaredCost}).`);
      return { ok: false, reason: "insufficient-ebb", currentFlux, cost: declaredCost };
    }

    const disciplineSkill = this.resolveDisciplineSkill(resolvedActor, ebbAbility, meta);
    const rollSource = disciplineSkill ?? ebbAbility;
    const check = await this.rollSkillCheck(resolvedActor, rollSource);

    const detailLines = [];
    if (!disciplineSkill) {
      detailLines.push(`Formulation fallback: no linked skill found, rolled from ${rollSource.name}.`);
    }
    detailLines.push(`${rollSource.name}: ${check.rollVal} vs ${check.target} (${check.resultLabel})`);

    let spentFlux = 0;
    let extraFluxLoss = 0;
    let hpDamage = 0;
    let sanityDamage = 0;
    let healingDone = 0;
    let healingRolled = 0;
    let damageRolled = 0;
    let appliedAttackDamage = 0;
    let attackTargetName = "";
    let attackUsedDummy = false;
    let attackLocationLabel = "";
    let ignoreAllArmour = false;
    let appliedDamageFormula = "";
    let ignoreArmourLabel = "";
    let effectSummary = "";

    if (spend) {
      if (check.resultLevel >= 2) {
        spentFlux = declaredCost;
      } else if (check.resultLevel === 1) {
        spentFlux = 1;
      } else {
        spentFlux = declaredCost;
      }
    }

    if (check.resultLevel === 0) {
      const backlashFlux = spend ? Math.max(0, await this.rollFormulaTotal("1D3")) : 0;
      extraFluxLoss += backlashFlux;
      const backlashMode = await this.promptBacklashMode(resolvedActor.name);
      if (backlashMode === "san") {
        const loss = await this.rollFormulaTotal("1D3");
        sanityDamage = await this.applySanityDamage(resolvedActor, loss);
        detailLines.push(`Backlash SAN loss: ${sanityDamage}`);
      } else {
        const burn = await this.rollFormulaTotal("1D6");
        hpDamage = await this.applyHealthDamage(resolvedActor, burn);
        detailLines.push(`Backlash HP burn: ${hpDamage}`);
      }

      if (meta.id === "reality-fold") {
        const shear = await this.rollFormulaTotal("1D6");
        const extra = await this.applyHealthDamage(resolvedActor, shear);
        hpDamage += extra;
        detailLines.push(`Reality Fold shear: ${extra} HP`);
      }
    }

    if (check.resultLevel >= 2) {
      if (meta.attack && tier.damage) {
        appliedDamageFormula = String(tier.damage);
        const baseDamage = await this.rollFormulaTotal(appliedDamageFormula);
        damageRolled = baseDamage;

        if (check.resultLevel === 3 && meta.special?.specialDoubleDice) {
          const extra = await this.rollFormulaTotal(appliedDamageFormula);
          damageRolled += extra;
          detailLines.push(`Special: +${extra} bonus damage`);
        }

        if (check.resultLevel >= 4 && meta.special?.criticalMode === "max-ignore-armour") {
          damageRolled = this.maxFromFormula(appliedDamageFormula, damageRolled);
          ignoreArmourLabel = "Ignore all armour";
          ignoreAllArmour = true;
        } else if (Number(tier.ignoreArmour ?? 0) > 0) {
          ignoreArmourLabel = `Ignore ${Number(tier.ignoreArmour)} armour`;
        }

        detailLines.push(`Damage: ${damageRolled} (${appliedDamageFormula})`);
        if (ignoreArmourLabel) detailLines.push(ignoreArmourLabel);

        const attackTarget = this.resolvePrimaryTargetActor(resolvedActor, { fallbackToActor: false });
        const { SLADamageResolver } = await import("../combat/sla-damage-resolver.mjs");
        const resolvedAttack = await SLADamageResolver.applyEbbAttack({
          attacker: resolvedActor,
          targetActor: attackTarget,
          damage: damageRolled,
          damageFormula: appliedDamageFormula,
          damageDice: String(damageRolled),
          ignoreArmour: Number(tier.ignoreArmour ?? 0),
          ignoreAllArmour,
          hitCount: 1
        });
        if (resolvedAttack?.ok) {
          attackTargetName = String(resolvedAttack.target?.name ?? this.getDummyTargetName());
          attackUsedDummy = Boolean(resolvedAttack.dummyTarget);
          attackLocationLabel = String(resolvedAttack.locationLabel ?? game.i18n.localize("BRP.general"));
          appliedAttackDamage = Math.max(0, Number(resolvedAttack.finalDamage ?? 0));
          detailLines.push(`${attackTargetName} took ${appliedAttackDamage} HP at ${attackLocationLabel}.`);
          if (resolvedAttack.hitBreakdownText) {
            detailLines.push(`Hit breakdown: ${resolvedAttack.hitBreakdownText}`);
          }
          if (resolvedAttack.damageDiceSummary) {
            detailLines.push(`Damage dice: ${resolvedAttack.damageDiceSummary}`);
          }
          if (attackUsedDummy) {
            detailLines.push("No target selected: resolved against dummy target.");
          }
        } else {
          const reason = String(resolvedAttack?.reason ?? "unknown");
          detailLines.push(`Damage application failed (${reason}).`);
        }
      }

      if (tier.healing) {
        const healTarget = this.resolvePrimaryTargetActor(resolvedActor);
        const healAmount = await this.rollFormulaTotal(tier.healing);
        const healingResult = await this.applyHealingDetailed(healTarget, healAmount);
        healingRolled = Number(healingResult.rolled ?? 0);
        healingDone = Number(healingResult.applied ?? 0);
        detailLines.push(
          `${healTarget.name} healing rolled: +${healingRolled} HP (applied +${healingDone} HP; ${healingResult.before} -> ${healingResult.after}).`
        );
      }

      const activeEntry = this.buildActiveEntry(resolvedActor, meta, tier, check.resultLevel);
      if (activeEntry) {
        await this.registerActiveEntry(resolvedActor, activeEntry);
        effectSummary = this.buildEffectSummary(activeEntry);
        if (effectSummary) {
          detailLines.push(`Active: ${effectSummary} (${this.formatRemaining(activeEntry.expiresAt)})`);
        } else {
          detailLines.push(`Active: ${activeEntry.name} (${this.formatRemaining(activeEntry.expiresAt)})`);
        }
      }
    } else if (meta.id === "heal" && check.resultLevel === 0) {
      const healTarget = this.resolvePrimaryTargetActor(resolvedActor);
      const backlash = await this.rollFormulaTotal("1D4");
      const applied = await this.applyHealthDamage(healTarget, backlash);
      detailLines.push(`${healTarget.name} suffers heal backlash: ${applied} HP`);
      hpDamage += applied;
    }

    if (check.resultLevel >= 2 && declaredCost > (Math.max(1, Number(resolvedActor.system?.stats?.pow?.total ?? 0)) / 2)) {
      const coreSkill = this.resolveCoreSkill(resolvedActor, meta);
      if (coreSkill) {
        const overcheck = await this.rollSkillCheck(resolvedActor, coreSkill);
        detailLines.push(`Overcharge check (${coreSkill.name}): ${overcheck.rollVal} vs ${overcheck.target} (${overcheck.resultLabel})`);
        if (overcheck.resultLevel < 2) {
          extraFluxLoss += spend ? 1 : 0;
          const overHp = await this.applyHealthDamage(resolvedActor, 1);
          hpDamage += overHp;
          detailLines.push("Overcharge backlash: +1 EBB lost, 1 HP damage");
        }
      } else {
        detailLines.push("Overcharge check skipped (no Ebb Core skill found).");
      }
    }

    const totalSpent = Math.max(0, Number(spentFlux + extraFluxLoss));
    const spendApplied = spend ? Math.min(currentFlux, totalSpent) : 0;
    const afterFlux = spend ? Math.max(0, currentFlux - spendApplied) : currentFlux;
    if (spend && spendApplied > 0) {
      await resolvedActor.update({ "system.power.value": afterFlux });
    }

    const state = await this.getState(resolvedActor);
    state.lastUse = {
      abilityId: ebbAbility.id,
      disciplineId: meta.id,
      tierId: tier.id,
      resultLevel: check.resultLevel,
      spent: spendApplied
    };
    if (check.resultLevel === 0) {
      state.counters.fumbles = Math.max(0, Number(state.counters?.fumbles ?? 0)) + 1;
    }
    if (extraFluxLoss > 0 && check.resultLevel >= 2) {
      state.counters.overchargeFails = Math.max(0, Number(state.counters?.overchargeFails ?? 0)) + 1;
    }
    await this.setState(resolvedActor, state);

    detailLines.push(`Flux: ${currentFlux} -> ${afterFlux} (spent ${spendApplied})`);

    const summary = `${meta.name} [${tier.label}] - ${check.resultLabel}`;
    await this.postEbbStateChat({
      actor: resolvedActor,
      title: "EBB Discipline Use",
      summary,
      details: detailLines,
      ability: ebbAbility
    });

    ui.notifications.info(`${resolvedActor.name} uses ${meta.name} (${tier.label}) - ${check.resultLabel}.`);
    return {
      ok: true,
      actor: resolvedActor,
      ability: ebbAbility,
      meta,
      tier,
      check,
      spent: spendApplied,
      before: currentFlux,
      after: afterFlux,
      damage: damageRolled,
      damageFormula: appliedDamageFormula,
      healing: healingDone,
      healingRolled,
      attackDamageApplied: appliedAttackDamage,
      attackTargetName,
      attackDummyTarget: attackUsedDummy,
      attackLocation: attackLocationLabel,
      hpDamage,
      sanityDamage,
      ignoreArmourLabel
    };
  }

  static async recover({ actor, amount = 1 } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) return { ok: false, reason: "no-actor" };
    if (!this.isEbbSpecies(resolvedActor)) {
      ui.notifications.warn(`${resolvedActor.name}: EBB is restricted to Ebon or Brain Waster operatives.`);
      return { ok: false, reason: "species-not-eligible" };
    }

    const max = Number(resolvedActor.system?.power?.max ?? 0);
    const before = Number(resolvedActor.system?.power?.value ?? 0);
    const next = Math.min(max, before + Math.max(0, Number(amount ?? 0)));
    await resolvedActor.update({ "system.power.value": next });
    ui.notifications.info(`${resolvedActor.name}: EBB recovered (${before} -> ${next}).`);
    return { ok: true, before, after: next, max };
  }

  static async useDiscipline(options = {}) {
    return this.useAbility(options);
  }

  static async getActorOverview(actorRef, { resolveExpiry = true } = {}) {
    const actor = this.resolveActor(actorRef);
    if (!actor) {
      return {
        eligible: false,
        species: "",
        power: { value: 0, max: 0 },
        abilities: [],
        coreSkill: null,
        active: []
      };
    }

    if (resolveExpiry) {
      await this.resolveExpired(actor);
    }
    const state = await this.getState(actor);
    const now = Date.now();
    const eligible = this.isEbbSpecies(actor);
    const species = this.getActorSpeciesName(actor);

    const abilities = actor.items
      .filter((i) => this.isEbbAbility(i))
      .map((ability) => ({
        id: ability.id,
        name: ability.name,
        disciplineId: this.getAbilityMeta(ability).id,
        cost: this.getAbilityCost(ability, "basic"),
        total: Number(ability.system?.total ?? 0),
        range: String(ability.system?.range ?? ""),
        duration: String(ability.system?.duration ?? "")
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const coreSkill = this.resolveCoreSkill(actor, {});
    const active = Object.values(state.active ?? {})
      .filter((entry) => !entry.expiresAt || Number(entry.expiresAt) > now)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        summary: this.buildEffectSummary(entry),
        remaining: this.formatRemaining(entry.expiresAt, now)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      eligible,
      species,
      power: {
        value: Number(actor.system?.power?.value ?? 0),
        max: Number(actor.system?.power?.max ?? 0)
      },
      abilities,
      coreSkill: coreSkill
        ? {
            id: coreSkill.id,
            name: coreSkill.name,
            total: Number(coreSkill.system?.total ?? 0)
          }
        : null,
      active
    };
  }

  static auditActorDisciplineSkills(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return [];
    const rows = [];
    for (const ability of actor.items.filter((item) => item.type === "psychic" && this.isEbbAbility(item))) {
      const meta = this.getAbilityMeta(ability);
      const linkedSkill = this.resolveDisciplineSkill(actor, ability, meta);
      rows.push({
        abilityId: ability.id,
        abilityName: String(ability.name ?? ""),
        requiredSkill: String(meta?.skillRef ?? this.DEFAULT_CORE_SKILL),
        linkedSkillId: String(linkedSkill?.id ?? ""),
        linkedSkillName: String(linkedSkill?.name ?? ""),
        ok: Boolean(linkedSkill)
      });
    }
    return rows;
  }
}
