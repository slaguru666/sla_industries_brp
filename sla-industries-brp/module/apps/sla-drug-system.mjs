export class SLADrugSystem {
  static FLAG_KEY = "slaDrugs";
  static DRUG_ICON_PATH = "systems/sla-industries-brp/assets/SLA_Assets/Drugs/Generated";

  static DRUG_DEFINITIONS = {
    shatter: {
      id: "shatter",
      name: "Shatter",
      category: "combat",
      cost: 120,
      duration: { hours: 6 },
      active: {
        extraActions: 1,
        damageTakenMultiplier: 0.5,
        ignoreFear: true,
        ignoreSanity: true
      },
      crash: {
        duration: { hours: 24 },
        rollMods: { str: -1, con: -1, physical: -20 },
        fatigueFormula: "1D3"
      },
      addiction: "CONx3",
      longTerm: {
        counter: "shatterUses",
        threshold: 5,
        permanentStep: { str: -1, con: -1, pow: -2, healthMod: -1 }
      },
      notes: [
        "No fear/stress checks for normal terror while active.",
        "Incoming damage is halved after armour while active.",
        "Crash: STR/CON drop and physical penalties.",
        "Long-term abuse causes permanent degradation."
      ]
    },
    blaze: {
      id: "blaze",
      name: "Blaze UV",
      category: "combat",
      cost: 180,
      duration: { powRounds: true, minRounds: 10 },
      active: {
        extraActions: 2,
        rollMods: { physical: 20, combat: 20 }
      },
      crash: {
        duration: { hours: 1 },
        rollMods: { perception: -20 },
        fatigueFlat: 2
      },
      addiction: "CONx3",
      notes: [
        "Hyper-acceleration and aggression.",
        "Crash causes perception tunnel and fatigue."
      ]
    },
    drum: {
      id: "drum",
      name: "Drum",
      category: "combat",
      cost: 90,
      duration: { rounds: 15 },
      active: {
        ignoreWoundPenalties: true
      },
      crash: {
        duration: { minutes: 10 },
        notes: ["When Drum ends, delayed injury shock can cause blackout or fatal collapse."]
      },
      addiction: "CONx3",
      notes: [
        "Ignore wound penalties while active.",
        "Crash can trigger severe collapse; GM adjudication recommended."
      ]
    },
    rush: {
      id: "rush",
      name: "Rush",
      category: "combat",
      cost: 65,
      duration: { rounds: 6 },
      active: {
        moveMultiplier: 2,
        rollMods: { physical: 20 }
      },
      crash: {
        duration: { minutes: 30 },
        rollMods: { physical: -10 },
        fatigueFormula: "2D6",
        hpDamageFormula: "1D6"
      },
      addiction: "CONx4",
      notes: ["Short sprint-burst enhancer with harsh crash."]
    },
    honesty: {
      id: "honesty",
      name: "Honesty",
      category: "psych",
      cost: 70,
      duration: { rounds: 20 },
      active: {
        ignoreSanity: true
      },
      crash: {
        duration: { hours: 1 },
        rollMods: { pow: -1 },
        applyDeferredSanity: true
      },
      addiction: "CONx4",
      notes: [
        "Suppresses SAN/fear impact while active.",
        "Deferred SAN is applied at crash."
      ]
    },
    flip: {
      id: "flip",
      name: "Flip",
      category: "social",
      cost: 25,
      duration: { minutes: 30 },
      active: {
        rollMods: { communication: 20, insight: -10 }
      },
      crash: {
        duration: { hours: 1 },
        rollMods: { communication: -10 },
        fatigueFlat: 1
      },
      addiction: "CONx4",
      notes: ["Soft social enhancer with mild comedown."]
    },
    bozerker: {
      id: "bozerker",
      name: "Bozerker",
      category: "combat",
      cost: 220,
      duration: { rounds: 10 },
      active: {
        rollMods: { str: 2, con: 2, melee: 20, physical: 10 },
        berserkCompulsion: true
      },
      crash: {
        duration: { hours: 2 },
        hpDamageFormula: "1D6",
        fatigueFormula: "1D6",
        notes: ["CONx3 test recommended: on fail, unconsciousness."]
      },
      addiction: "CONx2",
      longTerm: {
        counter: "bozerkerUses",
        threshold: 5,
        permanentStep: { str: -1, con: -1 }
      },
      notes: ["Extreme strength/aggression cocktail; severe body damage on crash."]
    },
    push: {
      id: "push",
      name: "Push",
      category: "medical",
      cost: 140,
      duration: { rounds: 0 },
      active: {},
      crash: null,
      addiction: "Low",
      notes: [
        "Purges active drug effects.",
        "Forces immediate crash resolution for all removed drugs.",
        "Can cause severe trauma if user is saturated."
      ]
    },
    bubbles: {
      id: "bubbles",
      name: "Bubbles",
      category: "soft",
      cost: 18,
      duration: { hours: 2 },
      active: {
        rollMods: { communication: 10 }
      },
      crash: {
        duration: { hours: 3 },
        rollMods: { communication: -10 },
        fatigueFlat: 1
      },
      addiction: "CONx4",
      notes: ["Common soft social booster."]
    },
    slosh: {
      id: "slosh",
      name: "Slosh",
      category: "soft",
      cost: 15,
      duration: { hours: 2 },
      active: {
        rollMods: { perception: 10 }
      },
      crash: {
        duration: { hours: 3 },
        rollMods: { perception: -10 },
        fatigueFlat: 1
      },
      addiction: "CONx4",
      notes: ["Common street stimulant with mild rebound drop."]
    }
  };

  static DRUG_ALIASES = new Map();
  static _expiryQueue = new Set();

  static _initAliases() {
    if (this.DRUG_ALIASES.size) return;
    for (const [id, def] of Object.entries(this.DRUG_DEFINITIONS)) {
      this.DRUG_ALIASES.set(id, id);
      this.DRUG_ALIASES.set(this.normalizeText(def.name), id);
      this.DRUG_ALIASES.set(this.normalizeText(`drug ${def.name}`), id);
      this.DRUG_ALIASES.set(this.normalizeText(`drug: ${def.name}`), id);
    }
  }

  static normalizeText(value = "") {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static get roundSeconds() {
    return Math.max(1, Number(CONFIG?.time?.roundTime ?? game.combat?.roundTime ?? 6));
  }

  static getDefaultState() {
    return {
      active: {},
      crashes: {},
      counters: {
        shatterUses: 0,
        bozerkerUses: 0
      },
      permanent: {
        shatterSteps: 0,
        bozerkerSteps: 0
      },
      deferred: {
        sanityLoss: 0
      }
    };
  }

  static async getState(actor) {
    if (!actor) return this.getDefaultState();
    const fromSystem = actor.flags?.[game.system.id]?.[this.FLAG_KEY];
    const fromLegacy = actor.flags?.brp?.[this.FLAG_KEY];
    const merged = foundry.utils.mergeObject(
      this.getDefaultState(),
      foundry.utils.deepClone(fromSystem ?? fromLegacy ?? {}),
      { inplace: false }
    );
    return merged;
  }

  static async setState(actor, state) {
    if (!actor) return;
    await actor.setFlag(game.system.id, this.FLAG_KEY, state);
  }

  static resolveDrugDef(drugRef) {
    this._initAliases();
    if (!drugRef) return null;
    if (typeof drugRef === "object" && drugRef.id && this.DRUG_DEFINITIONS[drugRef.id]) {
      return this.DRUG_DEFINITIONS[drugRef.id];
    }
    const key = this.normalizeText(drugRef);
    const id = this.DRUG_ALIASES.get(key) ?? this.DRUG_ALIASES.get(String(drugRef).toLowerCase());
    if (!id) return null;
    return this.DRUG_DEFINITIONS[id] ?? null;
  }

  static resolveActor(actorRef) {
    if (!actorRef) return null;
    if (actorRef.documentName === "Actor") return actorRef;
    if (typeof actorRef === "string") {
      return game.actors.get(actorRef) ?? game.actors.find((a) => a.name === actorRef) ?? null;
    }
    return null;
  }

  static getDrugMetaFromItem(item) {
    if (!item || item.type !== "gear") return null;
    const direct = item.flags?.[game.system.id]?.slaDrug ?? item.flags?.brp?.slaDrug ?? null;
    if (direct?.id && this.DRUG_DEFINITIONS[direct.id]) {
      const def = this.DRUG_DEFINITIONS[direct.id];
      return {
        id: def.id,
        name: def.name,
        cost: Number(direct.cost ?? def.cost ?? 0)
      };
    }

    const strippedName = String(item.name ?? "")
      .replace(/^\s*drug\s*[:\-]?\s*/i, "")
      .trim();
    const def = this.resolveDrugDef(strippedName);
    if (!def) return null;
    return {
      id: def.id,
      name: def.name,
      cost: Number(def.cost ?? 0)
    };
  }

  static durationToSeconds(duration, actor) {
    if (!duration) return 0;
    let total = 0;
    total += Math.max(0, Number(duration.hours ?? 0)) * 3600;
    total += Math.max(0, Number(duration.minutes ?? 0)) * 60;
    let rounds = Math.max(0, Number(duration.rounds ?? 0));
    if (duration.powRounds) {
      const pow = Math.max(0, Number(actor?.system?.stats?.pow?.total ?? 0));
      rounds = Math.max(rounds, pow);
    }
    if (duration.minRounds) {
      rounds = Math.max(rounds, Number(duration.minRounds));
    }
    total += rounds * this.roundSeconds;
    return Math.max(0, Math.floor(total));
  }

  static formatRemaining(expiresAt = 0, now = Date.now()) {
    const remainingMs = Math.max(0, Number(expiresAt ?? 0) - Number(now ?? Date.now()));
    if (remainingMs <= 0) return "0m";
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  }

  static summarizeRollModSet(set = {}) {
    if (!set || typeof set !== "object") return "";
    const labels = {
      str: "STR",
      con: "CON",
      siz: "SIZ",
      int: "INT",
      pow: "POW",
      dex: "DEX",
      cha: "CHA",
      combat: "Combat",
      physical: "Physical",
      communication: "Communication",
      perception: "Perception",
      insight: "Insight",
      melee: "Melee",
      allSkills: "All Skills"
    };
    const parts = [];
    for (const [key, label] of Object.entries(labels)) {
      const value = Number(set[key] ?? 0);
      if (!value) continue;
      const sign = value > 0 ? "+" : "";
      const suffix = ["str", "con", "siz", "int", "pow", "dex", "cha"].includes(key) ? "" : "%";
      parts.push(`${label} ${sign}${value}${suffix}`);
    }
    return parts.join(" | ");
  }

  static summarizeActiveEffect(def, entry) {
    const active = foundry.utils.mergeObject(
      foundry.utils.deepClone(def?.active ?? {}),
      foundry.utils.deepClone(entry?.active ?? {}),
      { inplace: false }
    );
    const details = [];
    const rollSummary = this.summarizeRollModSet(active.rollMods ?? entry?.rollMods ?? {});
    if (rollSummary) details.push(rollSummary);
    if (Number(active.extraActions ?? 0) > 0) {
      details.push(`+${Number(active.extraActions)} action(s)`);
    }
    if (Number(active.damageTakenMultiplier ?? 1) !== 1) {
      details.push(`Incoming damage x${Number(active.damageTakenMultiplier)}`);
    }
    if (Number(active.moveMultiplier ?? 1) > 1) {
      details.push(`Move x${Number(active.moveMultiplier)}`);
    }
    if (active.ignoreFear) details.push("Fear ignored");
    if (active.ignoreSanity) details.push("SAN deferred");
    if (active.ignoreWoundPenalties) details.push("Ignore wound penalties");
    return details.join(" | ");
  }

  static summarizeCrashEffect(entry = {}) {
    const crash = entry.crash ?? {};
    const details = [];
    const rollSummary = this.summarizeRollModSet(crash.rollMods ?? {});
    if (rollSummary) details.push(rollSummary);
    if (Number(crash.fatigueFlat ?? 0) > 0) details.push(`Fatigue -${Number(crash.fatigueFlat)}`);
    if (crash.fatigueFormula) details.push(`Fatigue ${crash.fatigueFormula}`);
    if (crash.hpDamageFormula) details.push(`HP ${crash.hpDamageFormula}`);
    if (crash.applyDeferredSanity) details.push("Apply deferred SAN");
    if (Array.isArray(entry.notes) && entry.notes.length) {
      details.push(entry.notes[0]);
    }
    return details.join(" | ");
  }

  static findEntryByDrugId(state, drugId, now = Date.now()) {
    const directActive = state?.active?.[drugId] ?? null;
    const byNameEntry = Object.values(state?.active ?? {}).find((entry) => {
      const nameMatch = this.normalizeText(entry?.name ?? "") === this.normalizeText(drugId);
      const idMatch = this.normalizeText(entry?.id ?? "") === this.normalizeText(drugId);
      return nameMatch || idMatch;
    }) ?? null;
    const active = directActive ?? byNameEntry;
    const hasActive = Boolean(active && (!active.expiresAt || active.expiresAt > now));
    const crashes = Object.values(state?.crashes ?? {})
      .filter((entry) => {
        const drugMatch = this.normalizeText(entry?.drugId ?? "") === this.normalizeText(drugId);
        const idMatch = this.normalizeText(entry?.id ?? "") === this.normalizeText(drugId);
        const nameMatch = this.normalizeText(entry?.name ?? "").includes(this.normalizeText(drugId));
        return (drugMatch || idMatch || nameMatch) && (!entry.expiresAt || entry.expiresAt > now);
      })
      .sort((a, b) => Number(b.startedAt ?? 0) - Number(a.startedAt ?? 0));
    return {
      active: hasActive ? active : null,
      crash: crashes[0] ?? null,
      crashes
    };
  }

  static entryMatchesDrug(def, entry, key = "") {
    if (!def || !entry) return false;
    const keyNorm = this.normalizeText(key);
    const defIdNorm = this.normalizeText(def.id);
    const defNameNorm = this.normalizeText(def.name);
    const entryIdNorm = this.normalizeText(entry.id ?? entry.drugId ?? "");
    const entryNameNorm = this.normalizeText(entry.name ?? "");
    if (keyNorm && (keyNorm === defIdNorm || keyNorm === defNameNorm)) return true;
    if (entryIdNorm && (entryIdNorm === defIdNorm || entryIdNorm === defNameNorm)) return true;
    return Boolean(entryNameNorm && (entryNameNorm.includes(defNameNorm) || entryNameNorm.includes(defIdNorm)));
  }

  static collectMatchingKeys(collection = {}, def, { now = Date.now(), onlyOpen = true } = {}) {
    return Object.entries(collection)
      .filter(([key, entry]) => {
        if (!entry) return false;
        if (onlyOpen) {
          const isOpen = !entry.expiresAt || Number(entry.expiresAt) > now;
          if (!isOpen) return false;
        }
        return this.entryMatchesDrug(def, entry, key);
      })
      .map(([key]) => key);
  }

  static async getActorOverview(actorRef, { resolveExpiry = true } = {}) {
    const actor = this.resolveActor(actorRef);
    if (!actor) {
      return {
        alerts: [],
        itemStates: {},
        state: this.getDefaultState()
      };
    }

    if (resolveExpiry) {
      await this.resolveExpired(actor);
    } else {
      // Keep sheet rendering side-effect free while still processing timed transitions.
      this.queueResolveExpired(actor);
    }

    const state = await this.getState(actor);
    const now = Date.now();
    const itemStates = {};
    const alerts = [];
    const firstItemByDrug = new Map();
    const activeLabel = game.i18n.localize("BRP.active");
    const withdrawalLabel = game.i18n.localize("BRP.withdrawal");
    const readyLabel = game.i18n.localize("BRP.drugReady");

    for (const item of actor.items ?? []) {
      const meta = this.getDrugMetaFromItem(item);
      if (!meta) continue;

      if (!firstItemByDrug.has(meta.id)) {
        firstItemByDrug.set(meta.id, item.id);
      }

      const entry = this.findEntryByDrugId(state, meta.id, now);
      const status = entry.active ? "active" : (entry.crash ? "withdrawal" : "inactive");
      const statusLabel = status === "active"
        ? activeLabel
        : (status === "withdrawal" ? withdrawalLabel : readyLabel);
      const duration = status === "active"
        ? this.formatRemaining(entry.active?.expiresAt, now)
        : (status === "withdrawal" ? this.formatRemaining(entry.crash?.expiresAt, now) : "");
      const summary = status === "active"
        ? this.summarizeActiveEffect(this.DRUG_DEFINITIONS[meta.id], entry.active)
        : (status === "withdrawal" ? this.summarizeCrashEffect(entry.crash) : "");

      itemStates[item.id] = {
        itemId: item.id,
        drugId: meta.id,
        name: meta.name,
        status,
        statusLabel,
        duration,
        summary,
        canUse: status !== "active",
        canClose: status !== "inactive"
      };
    }

    for (const [activeKey, activeEntry] of Object.entries(state.active ?? {})) {
      if (!activeEntry || (activeEntry.expiresAt && activeEntry.expiresAt <= now)) continue;
      const def = this.resolveDrugDef(activeEntry?.id ?? activeEntry?.drugId ?? activeEntry?.name ?? activeKey);
      if (!def) continue;
      alerts.push({
        itemId: firstItemByDrug.get(def.id) ?? "",
        drugId: def.id,
        name: def.name,
        state: "active",
        stateLabel: activeLabel,
        duration: this.formatRemaining(activeEntry.expiresAt, now),
        summary: this.summarizeActiveEffect(def, activeEntry),
        canClose: true
      });
    }

    const crashByDrug = new Map();
    for (const crashEntry of Object.values(state.crashes ?? {})) {
      if (!crashEntry || (crashEntry.expiresAt && crashEntry.expiresAt <= now)) continue;
      const current = crashByDrug.get(crashEntry.drugId);
      if (!current || Number(crashEntry.startedAt ?? 0) > Number(current.startedAt ?? 0)) {
        crashByDrug.set(crashEntry.drugId, crashEntry);
      }
    }
    for (const [drugId, crashEntry] of crashByDrug.entries()) {
      const def = this.resolveDrugDef(crashEntry?.drugId ?? crashEntry?.name ?? drugId);
      if (!def) continue;
      alerts.push({
        itemId: firstItemByDrug.get(def.id) ?? "",
        drugId: def.id,
        name: def.name,
        state: "withdrawal",
        stateLabel: withdrawalLabel,
        duration: this.formatRemaining(crashEntry.expiresAt, now),
        summary: this.summarizeCrashEffect(crashEntry),
        canClose: true
      });
    }

    alerts.sort((a, b) => {
      const score = (a.state === "active" ? 0 : 1) - (b.state === "active" ? 0 : 1);
      if (score !== 0) return score;
      return String(a.name).localeCompare(String(b.name));
    });

    return { alerts, itemStates, state };
  }

  static async rollFormulaTotal(formula) {
    const text = String(formula ?? "").trim();
    if (!text) return 0;
    const roll = await new Roll(text).evaluate();
    if (game.modules.get("dice-so-nice")?.active) {
      game.dice3d.showForRoll(roll, game.user, true, null, false);
    }
    return Math.max(0, Number(roll.total ?? 0));
  }

  static async applyFatigue(actor, amount) {
    const value = Math.max(0, Number(amount ?? 0));
    if (!value || !actor) return 0;
    const current = Math.max(0, Number(actor.system?.fatigue?.value ?? 0));
    const next = Math.max(0, current - value);
    await actor.update({ "system.fatigue.value": next });
    return current - next;
  }

  static async applySanity(actor, amount) {
    const value = Math.max(0, Number(amount ?? 0));
    if (!value || !actor) return 0;
    const current = Math.max(0, Number(actor.system?.sanity?.value ?? 0));
    const next = Math.max(0, current - value);
    await actor.update({ "system.sanity.value": next });
    return current - next;
  }

  static async applyHpDamage(actor, amount) {
    const value = Math.max(0, Number(amount ?? 0));
    if (!value || !actor) return 0;
    const { BRPDamage } = await import("../combat/damage.mjs");
    const applied = await BRPDamage.applyResolvedDamage({ actor, damage: value, locationId: "" });
    if (!applied.ok) return 0;
    return value;
  }

  static async findDrugItem(actor, drugDef, itemId = "") {
    if (!actor || !drugDef) return null;
    if (itemId) {
      const direct = actor.items.get(itemId);
      if (direct?.type === "gear") return direct;
    }
    const byFlag = actor.items.find((i) => {
      if (i.type !== "gear") return false;
      const meta = this.getDrugMetaFromItem(i);
      return meta?.id === drugDef.id;
    });
    if (byFlag) return byFlag;
    return actor.items.find((i) => i.type === "gear" && i.name.toLowerCase().includes(drugDef.name.toLowerCase())) ?? null;
  }

  static getPermanentStepCount(state, drugDef) {
    if (!drugDef?.longTerm) return 0;
    if (drugDef.id === "shatter") return Number(state?.permanent?.shatterSteps ?? 0);
    if (drugDef.id === "bozerker") return Number(state?.permanent?.bozerkerSteps ?? 0);
    return 0;
  }

  static async applyPermanentLongTerm(actor, state, drugDef) {
    if (!actor || !state || !drugDef?.longTerm) return;
    const counterKey = String(drugDef.longTerm.counter ?? "");
    if (!counterKey) return;
    const threshold = Math.max(1, Number(drugDef.longTerm.threshold ?? 5));
    const uses = Math.max(0, Number(state?.counters?.[counterKey] ?? 0));
    const currentSteps = this.getPermanentStepCount(state, drugDef);
    const targetSteps = Math.floor(uses / threshold);
    if (targetSteps <= currentSteps) return;

    const stepsToApply = targetSteps - currentSteps;
    const step = drugDef.longTerm.permanentStep ?? {};
    if (!Object.keys(step).length) return;

    const updates = {};
    const adjustStat = (statKey, delta) => {
      const path = `system.stats.${statKey}.effects`;
      const current = Number(foundry.utils.getProperty(actor, path) ?? 0);
      updates[path] = current + delta;
    };

    const scale = (n) => Number(n ?? 0) * stepsToApply;

    if (step.str) adjustStat("str", scale(step.str));
    if (step.con) adjustStat("con", scale(step.con));
    if (step.pow) adjustStat("pow", scale(step.pow));
    if (step.dex) adjustStat("dex", scale(step.dex));
    if (step.int) adjustStat("int", scale(step.int));
    if (step.cha) adjustStat("cha", scale(step.cha));
    if (step.siz) adjustStat("siz", scale(step.siz));
    if (step.healthMod) {
      const healthCurrent = Number(actor.system?.health?.mod ?? 0);
      updates["system.health.mod"] = healthCurrent + scale(step.healthMod);
    }

    if (Object.keys(updates).length) {
      await actor.update(updates);
      ui.notifications.warn(`${actor.name}: permanent ${drugDef.name} degradation applied (${stepsToApply} stage).`);
    }

    if (drugDef.id === "shatter") {
      state.permanent.shatterSteps = targetSteps;
    }
    if (drugDef.id === "bozerker") {
      state.permanent.bozerkerSteps = targetSteps;
    }
  }

  static async applyCrashImmediate(actor, state, crashEntry) {
    if (!actor || !crashEntry || crashEntry.appliedImmediate) return crashEntry;
    const crash = crashEntry.crash ?? {};
    let fatigueApplied = 0;
    let hpApplied = 0;
    let sanityApplied = 0;

    if (Number(crash.fatigueFlat ?? 0) > 0) {
      fatigueApplied += await this.applyFatigue(actor, Number(crash.fatigueFlat));
    }
    if (crash.fatigueFormula) {
      const fatigueLoss = await this.rollFormulaTotal(crash.fatigueFormula);
      fatigueApplied += await this.applyFatigue(actor, fatigueLoss);
    }
    if (crash.hpDamageFormula) {
      const hpLoss = await this.rollFormulaTotal(crash.hpDamageFormula);
      hpApplied += await this.applyHpDamage(actor, hpLoss);
    }

    if (crash.applyDeferredSanity) {
      const deferred = Math.max(0, Number(state?.deferred?.sanityLoss ?? 0));
      if (deferred > 0) {
        sanityApplied += await this.applySanity(actor, deferred);
      }
      state.deferred.sanityLoss = 0;
    }

    crashEntry.appliedImmediate = true;
    crashEntry.applied = { fatigueApplied, hpApplied, sanityApplied };

    const pieces = [];
    if (fatigueApplied > 0) pieces.push(`Fatigue -${fatigueApplied}`);
    if (hpApplied > 0) pieces.push(`HP damage ${hpApplied}`);
    if (sanityApplied > 0) pieces.push(`SAN -${sanityApplied}`);
    if (pieces.length) {
      ui.notifications.warn(`${actor.name}: ${crashEntry.name} crash applied (${pieces.join(", ")}).`);
    }

    return crashEntry;
  }

  static async resolveExpired(actor) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) return { expired: 0, crashes: 0 };

    const state = await this.getState(resolvedActor);
    const now = Date.now();
    let changed = false;
    let expiredCount = 0;
    let crashCount = 0;

    for (const [id, entry] of Object.entries(state.active ?? {})) {
      if (!entry?.expiresAt || entry.expiresAt > now) continue;
      const def = this.DRUG_DEFINITIONS[id];
      delete state.active[id];
      changed = true;
      expiredCount += 1;
      if (!def?.crash) continue;

      const crashDurationSeconds = this.durationToSeconds(def.crash.duration, resolvedActor);
      const crashId = `${id}-${entry.expiresAt}`;
      state.crashes[crashId] = {
        id: crashId,
        drugId: id,
        name: `${def.name} Crash`,
        startedAt: now,
        expiresAt: crashDurationSeconds > 0 ? (now + crashDurationSeconds * 1000) : now,
        crash: foundry.utils.deepClone(def.crash),
        notes: def.crash.notes ?? []
      };
      await this.applyCrashImmediate(resolvedActor, state, state.crashes[crashId]);
      crashCount += 1;
    }

    for (const [id, entry] of Object.entries(state.crashes ?? {})) {
      if (!entry?.expiresAt || entry.expiresAt > now) continue;
      delete state.crashes[id];
      changed = true;
    }

    if (changed) {
      await this.setState(resolvedActor, state);
    }

    return { expired: expiredCount, crashes: crashCount };
  }

  static queueResolveExpired(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor?.id) return;
    if (this._expiryQueue.has(actor.id)) return;
    this._expiryQueue.add(actor.id);
    setTimeout(async () => {
      try {
        await this.resolveExpired(actor);
      } catch (err) {
        console.error(`${game.system.id} | SLADrugSystem.queueResolveExpired failed`, err);
      } finally {
        this._expiryQueue.delete(actor.id);
      }
    }, 0);
  }

  static async useDrug({ actor, drug, itemId = "", consume = true } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) {
      ui.notifications.warn("No actor found for drug use.");
      return { ok: false, reason: "no-actor" };
    }

    let def = this.resolveDrugDef(drug);
    if (!def && itemId) {
      const fromItem = resolvedActor.items?.get(itemId);
      const meta = this.getDrugMetaFromItem(fromItem);
      if (meta?.id) def = this.DRUG_DEFINITIONS[meta.id] ?? null;
    }
    if (!def) {
      ui.notifications.warn(`Unknown drug: ${drug}`);
      return { ok: false, reason: "unknown-drug" };
    }

    await this.resolveExpired(resolvedActor);
    const state = await this.getState(resolvedActor);
    const now = Date.now();

    const drugItem = await this.findDrugItem(resolvedActor, def, itemId);
    if (consume && !drugItem) {
      ui.notifications.warn(`${resolvedActor.name}: no ${def.name} dose item in gear.`);
      return { ok: false, reason: "no-item" };
    }
    if (consume && drugItem) {
      const qty = Math.max(0, Number(drugItem.system?.quantity ?? 0));
      if (qty < 1) {
        ui.notifications.warn(`${resolvedActor.name}: no ${def.name} doses available.`);
        return { ok: false, reason: "no-dose" };
      }
      await drugItem.update({ "system.quantity": qty - 1 });
    }

    if (def.id === "push") {
      const purged = await this.applyPush(resolvedActor, state);
      await this.setState(resolvedActor, state);
      ui.notifications.info(`${resolvedActor.name}: Push purged ${purged.removed} active drug effects.`);
      return { ok: true, actor: resolvedActor, drug: def.id, purged };
    }

    // Clear any legacy duplicate active/crash records for this drug before applying a new dose.
    for (const key of this.collectMatchingKeys(state.active, def, { now, onlyOpen: false })) {
      delete state.active[key];
    }
    for (const key of this.collectMatchingKeys(state.crashes, def, { now, onlyOpen: false })) {
      delete state.crashes[key];
    }

    const durationSeconds = this.durationToSeconds(def.duration, resolvedActor);
    state.active[def.id] = {
      id: def.id,
      name: def.name,
      startedAt: now,
      expiresAt: durationSeconds > 0 ? now + durationSeconds * 1000 : now,
      rounds: durationSeconds > 0 ? Math.round(durationSeconds / this.roundSeconds) : 0,
      active: foundry.utils.deepClone(def.active ?? {}),
      rollMods: foundry.utils.deepClone(def.active?.rollMods ?? {})
    };

    if (def.id === "honesty") {
      state.deferred.sanityLoss = Math.max(0, Number(state.deferred?.sanityLoss ?? 0));
    }

    if (def.longTerm?.counter) {
      const key = String(def.longTerm.counter);
      state.counters[key] = Math.max(0, Number(state.counters[key] ?? 0)) + 1;
      await this.applyPermanentLongTerm(resolvedActor, state, def);
    }

    await this.setState(resolvedActor, state);

    const durationLabel = durationSeconds > 0 ? `${Math.round(durationSeconds / 60)}m` : "instant";
    ui.notifications.info(`${resolvedActor.name}: ${def.name} dosed (${durationLabel}).`);
    await this.postDrugStateChat({
      actor: resolvedActor,
      title: `${def.name} Activated`,
      state: "active",
      duration: durationLabel,
      summary: this.summarizeActiveEffect(def, state.active[def.id]),
      details: [
        `Addiction: ${def.addiction ?? "Varies"}`
      ]
    });

    return {
      ok: true,
      actor: resolvedActor,
      drug: def.id,
      state
    };
  }

  static async closeDrug({ actor, drug = "", itemId = "" } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) {
      return { ok: false, reason: "no-actor" };
    }

    let def = this.resolveDrugDef(drug);
    if (!def && itemId) {
      const fromItem = resolvedActor.items?.get(itemId);
      const meta = this.getDrugMetaFromItem(fromItem);
      if (meta?.id) def = this.DRUG_DEFINITIONS[meta.id] ?? null;
    }
    if (!def) {
      return { ok: false, reason: "unknown-drug" };
    }

    await this.resolveExpired(resolvedActor);
    const state = await this.getState(resolvedActor);
    const now = Date.now();
    let changed = false;
    let stage = "inactive";

    const activeKeys = this.collectMatchingKeys(state.active, def, { now, onlyOpen: true });
    if (activeKeys.length > 0) {
      for (const key of activeKeys) {
        delete state.active[key];
      }
      changed = true;
      stage = "cleared";

      if (def.crash) {
        const crashDurationSeconds = this.durationToSeconds(def.crash.duration, resolvedActor);
        const crashId = `${def.id}-manual-${now}`;
        state.crashes[crashId] = {
          id: crashId,
          drugId: def.id,
          name: `${def.name} Crash`,
          startedAt: now,
          expiresAt: crashDurationSeconds > 0 ? (now + crashDurationSeconds * 1000) : now,
          crash: foundry.utils.deepClone(def.crash),
          notes: ["Triggered by manual close"]
        };
        await this.applyCrashImmediate(resolvedActor, state, state.crashes[crashId]);
        stage = "withdrawal";
      }
    } else {
      const staleActiveKeys = this.collectMatchingKeys(state.active, def, { now, onlyOpen: false });
      if (staleActiveKeys.length > 0) {
        for (const key of staleActiveKeys) {
          delete state.active[key];
        }
        changed = true;
        stage = "cleared";
      }

      const crashKeys = this.collectMatchingKeys(state.crashes, def, { now, onlyOpen: false });
      if (crashKeys.length > 0) {
        for (const key of crashKeys) {
          delete state.crashes[key];
        }
        changed = true;
        stage = "cleared";
      }
    }

    if (!changed) {
      return { ok: true, skipped: true, stage: "inactive" };
    }

    await this.setState(resolvedActor, state);

    if (stage === "withdrawal") {
      ui.notifications.warn(`${resolvedActor.name}: ${def.name} moved to withdrawal/crash effects.`);
      const crashEntry = Object.values(state.crashes ?? {})
        .filter((entry) => this.normalizeText(entry?.drugId ?? "") === this.normalizeText(def.id))
        .sort((a, b) => Number(b.startedAt ?? 0) - Number(a.startedAt ?? 0))[0] ?? null;
      await this.postDrugStateChat({
        actor: resolvedActor,
        title: `${def.name} Withdrawal`,
        state: "withdrawal",
        duration: crashEntry ? this.formatRemaining(crashEntry.expiresAt, now) : "",
        summary: this.summarizeCrashEffect(crashEntry ?? { crash: def.crash ?? {} }),
        details: ["Crash effects applied."]
      });
    } else if (stage === "cleared") {
      ui.notifications.info(`${resolvedActor.name}: ${def.name} effects cleared.`);
      await this.postDrugStateChat({
        actor: resolvedActor,
        title: `${def.name} Cleared`,
        state: "cleared",
        duration: "",
        summary: "No active drug state.",
        details: []
      });
    }

    return { ok: true, stage, actor: resolvedActor, drug: def.id };
  }

  static async getModifierSnapshot(actorRef, { resolveExpiry = true } = {}) {
    const actor = this.resolveActor(actorRef);
    if (!actor) {
      return {
        statMods: { str: 0, con: 0, siz: 0, int: 0, pow: 0, dex: 0, cha: 0 },
        skillMods: { allSkills: 0, combat: 0, physical: 0, communication: 0, perception: 0, insight: 0, melee: 0 },
        extraActions: 0,
        damageTakenMultiplier: 1,
        moveMultiplier: 1,
        ignoreFear: false,
        ignoreSanity: false,
        ignoreWoundPenalties: false
      };
    }

    if (resolveExpiry) {
      await this.resolveExpired(actor);
    }
    const state = await this.getState(actor);
    const now = Date.now();
    const out = {
      statMods: { str: 0, con: 0, siz: 0, int: 0, pow: 0, dex: 0, cha: 0 },
      skillMods: { allSkills: 0, combat: 0, physical: 0, communication: 0, perception: 0, insight: 0, melee: 0 },
      extraActions: 0,
      damageTakenMultiplier: 1,
      moveMultiplier: 1,
      ignoreFear: false,
      ignoreSanity: false,
      ignoreWoundPenalties: false
    };

    const addMods = (set = {}) => {
      for (const key of Object.keys(out.statMods)) {
        out.statMods[key] += Number(set[key] ?? 0);
      }
      for (const key of Object.keys(out.skillMods)) {
        out.skillMods[key] += Number(set[key] ?? 0);
      }
    };

    for (const [activeKey, activeEntry] of Object.entries(state.active ?? {})) {
      if (!activeEntry || (activeEntry.expiresAt && activeEntry.expiresAt <= now)) continue;
      const def = this.resolveDrugDef(activeEntry?.id ?? activeEntry?.name ?? activeKey);
      if (!def) continue;
      const active = foundry.utils.mergeObject(
        foundry.utils.deepClone(def.active ?? {}),
        foundry.utils.deepClone(activeEntry.active ?? {}),
        { inplace: false }
      );
      addMods(active.rollMods ?? activeEntry.rollMods ?? {});
      out.extraActions += Number(active.extraActions ?? 0);
      out.damageTakenMultiplier *= Number(active.damageTakenMultiplier ?? 1);
      out.moveMultiplier = Math.max(out.moveMultiplier, Number(active.moveMultiplier ?? 1));
      out.ignoreFear = out.ignoreFear || Boolean(active.ignoreFear);
      out.ignoreSanity = out.ignoreSanity || Boolean(active.ignoreSanity);
      out.ignoreWoundPenalties = out.ignoreWoundPenalties || Boolean(active.ignoreWoundPenalties);
    }

    for (const crashEntry of Object.values(state.crashes ?? {})) {
      if (!crashEntry || (crashEntry.expiresAt && crashEntry.expiresAt <= now)) continue;
      addMods(crashEntry.crash?.rollMods ?? {});
    }

    return out;
  }

  static async applyPush(actor, state) {
    const activeEntries = Object.values(state.active ?? {});
    const removed = activeEntries.length;
    const now = Date.now();

    for (const entry of activeEntries) {
      const def = this.DRUG_DEFINITIONS[entry.id];
      if (!def?.crash) continue;
      const crashDurationSeconds = this.durationToSeconds(def.crash.duration, actor);
      const crashId = `${entry.id}-push-${now}-${Math.floor(Math.random() * 10000)}`;
      state.crashes[crashId] = {
        id: crashId,
        drugId: entry.id,
        name: `${def.name} Crash`,
        startedAt: now,
        expiresAt: crashDurationSeconds > 0 ? (now + crashDurationSeconds * 1000) : now,
        crash: foundry.utils.deepClone(def.crash),
        notes: ["Triggered by Push"]
      };
      await this.applyCrashImmediate(actor, state, state.crashes[crashId]);
    }

    state.active = {};

    const saturation = removed;
    if (saturation >= 2) {
      const traumaDamage = await this.rollFormulaTotal("2D6");
      const traumaFatigue = await this.rollFormulaTotal("2D6");
      await this.applyHpDamage(actor, traumaDamage);
      await this.applyFatigue(actor, traumaFatigue);
      ui.notifications.warn(`${actor.name}: Push trauma (${traumaDamage} HP, ${traumaFatigue} Fatigue).`);
    }

    return { removed, saturation };
  }

  static async clearDrug({ actor, drug } = {}) {
    const resolvedActor = this.resolveActor(actor);
    const def = this.resolveDrugDef(drug);
    if (!resolvedActor || !def) return { ok: false };

    const state = await this.getState(resolvedActor);
    const now = Date.now();
    for (const key of this.collectMatchingKeys(state.active, def, { now, onlyOpen: false })) {
      delete state.active[key];
    }
    for (const key of this.collectMatchingKeys(state.crashes, def, { now, onlyOpen: false })) {
      delete state.crashes[key];
    }
    await this.setState(resolvedActor, state);
    return { ok: true };
  }

  static async clearAll({ actor } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) return { ok: false };
    const state = await this.getState(resolvedActor);
    state.active = {};
    state.crashes = {};
    await this.setState(resolvedActor, state);
    return { ok: true };
  }

  static async recordDeferredSanityLoss(actor, value = 0) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) return { ok: false, reason: "no-actor" };

    const amount = Math.max(0, Number(value ?? 0));
    if (amount <= 0) return { ok: true, skipped: true };

    await this.resolveExpired(resolvedActor);
    const state = await this.getState(resolvedActor);
    const hasHonesty = Boolean(state.active?.honesty);

    if (hasHonesty) {
      state.deferred.sanityLoss = Math.max(0, Number(state.deferred?.sanityLoss ?? 0)) + amount;
      await this.setState(resolvedActor, state);
      return { ok: true, deferred: true, amount, totalDeferred: state.deferred.sanityLoss };
    }

    const applied = await this.applySanity(resolvedActor, amount);
    return { ok: true, deferred: false, amount: applied };
  }

  static async postDrugStateChat({ actor, title = "Drug State", state = "", duration = "", summary = "", details = [] } = {}) {
    if (!actor) return;
    const stateClass = String(state || "active").toLowerCase();
    const lines = [];
    if (summary) lines.push(`<div>${summary}</div>`);
    for (const detail of details ?? []) {
      if (detail) lines.push(`<div>${detail}</div>`);
    }

    const html = `
      <form class="brp gr-card">
        <div class="bold">${title}</div>
        <div class="quick-combat" style="margin-left:0;">
          <div><strong>${actor.name}</strong> - ${stateClass.toUpperCase()}${duration ? ` (${duration})` : ""}</div>
          ${lines.join("")}
        </div>
      </form>
    `;
    let chatType = "";
    if (!foundry.utils.isNewerVersion(game.version, '11')) {
      chatType = CONST.CHAT_MESSAGE_STYLES.OTHER;
    } else {
      chatType = CONST.CHAT_MESSAGE_OTHER;
    }

    await ChatMessage.create({
      author: game.user.id,
      type: chatType,
      content: html,
      speaker: {
        actor: actor.id,
        alias: actor.name
      }
    });
  }

  static _buildSkillContext(actor, config) {
    const result = {
      hasSkill: false,
      name: "",
      categoryKey: "",
      categoryName: "",
      isCombat: false,
      isPhysical: false,
      isCommunication: false,
      isPerception: false,
      isInsight: false,
      isMelee: false,
      characteristic: String(config?.characteristic ?? "").toLowerCase()
    };

    const skill = config?.skillId ? actor?.items?.get(config.skillId) : null;
    result.hasSkill = Boolean(skill);
    result.name = String(skill?.name ?? config?.label ?? "").toLowerCase();
    result.categoryKey = String(skill?.system?.category ?? "");

    const catByBrpid = actor?.items?.find((i) =>
      i.type === "skillcat"
      && ((i.flags?.[game.system.id]?.brpidFlag?.id ?? i.flags?.brp?.brpidFlag?.id) === result.categoryKey)
    );
    result.categoryName = String(catByBrpid?.name ?? result.categoryKey).toLowerCase();

    const scan = `${result.name} ${result.categoryName} ${result.categoryKey}`;
    result.isCombat = ["CM", "QC"].includes(config?.rollType) || /combat|weapon|firearm|rifle|pistol|smg|shotgun|heavy/.test(scan);
    result.isMelee = /melee|brawl|axe|club|sword|knife|claw/.test(scan);
    result.isPhysical = result.isCombat || /physical|dodge|climb|jump|swim|stealth|athlet/.test(scan);
    result.isCommunication = /communication|persuade|command|telegen|perform|fasttalk/.test(scan);
    result.isPerception = /perception|insight|listen|spot|research|awareness/.test(scan);
    result.isInsight = /insight/.test(scan);

    return result;
  }

  static _applyRollModSet(ctx, set, skillCtx, labelPrefix, effectLines) {
    if (!set) return;
    let delta = 0;

    const pushEffect = (text) => {
      if (!text) return;
      effectLines.push(text);
    };

    const addStatMod = (statKey) => {
      const points = Number(set[statKey] ?? 0);
      if (!points) return;
      if (ctx.rollType === "CH" && skillCtx.characteristic === statKey) {
        const value = points * 5;
        delta += value;
        const sign = value >= 0 ? "+" : "";
        pushEffect(`${labelPrefix}: ${statKey.toUpperCase()} ${sign}${value}%`);
      }
    };

    addStatMod("str");
    addStatMod("con");
    addStatMod("pow");
    addStatMod("dex");
    addStatMod("int");
    addStatMod("cha");
    addStatMod("siz");

    const addCategoryMod = (cond, key, label) => {
      const value = Number(set[key] ?? 0);
      if (!value || !cond) return;
      delta += value;
      const sign = value >= 0 ? "+" : "";
      pushEffect(`${labelPrefix}: ${label} ${sign}${value}%`);
    };

    const skillRoll = ["SK", "CM", "QC", "AL", "PA", "PT", "RP"].includes(ctx.rollType);
    addCategoryMod(skillRoll, "allSkills", "all skills");
    addCategoryMod(skillRoll && skillCtx.isCombat, "combat", "combat");
    addCategoryMod(skillRoll && skillCtx.isPhysical, "physical", "physical");
    addCategoryMod(skillRoll && skillCtx.isCommunication, "communication", "communication");
    addCategoryMod(skillRoll && skillCtx.isPerception, "perception", "perception");
    addCategoryMod(skillRoll && skillCtx.isInsight, "insight", "insight");
    addCategoryMod(skillRoll && skillCtx.isMelee, "melee", "melee");

    ctx.flatMod += delta;
  }

  static async getCheckContext(actorRef, config = {}, { preview = false } = {}) {
    const actor = this.resolveActor(actorRef);
    if (!actor) {
      return {
        flatMod: 0,
        extraActions: 0,
        damageTakenMultiplier: 1,
        ignoreFear: false,
        ignoreSanity: false,
        ignoreWoundPenalties: false,
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

    const ctx = {
      rollType: config.rollType,
      flatMod: 0,
      extraActions: 0,
      damageTakenMultiplier: 1,
      ignoreFear: false,
      ignoreSanity: false,
      ignoreWoundPenalties: false,
      moveMultiplier: 1
    };
    const effects = [];

    for (const [id, entry] of Object.entries(state.active ?? {})) {
      if (!entry || (entry.expiresAt && entry.expiresAt <= now)) continue;
      const def = this.DRUG_DEFINITIONS[id];
      if (!def) continue;
      const active = def.active ?? {};

      if (Number(active.extraActions ?? 0) !== 0) {
        ctx.extraActions += Number(active.extraActions);
        effects.push(`${def.name}: +${Number(active.extraActions)} actions`);
      }

      if (Number(active.damageTakenMultiplier ?? 1) !== 1) {
        ctx.damageTakenMultiplier *= Number(active.damageTakenMultiplier);
        effects.push(`${def.name}: incoming damage x${Number(active.damageTakenMultiplier)}`);
      }

      if (active.ignoreFear) {
        ctx.ignoreFear = true;
        effects.push(`${def.name}: fear ignored`);
      }
      if (active.ignoreSanity) {
        ctx.ignoreSanity = true;
        effects.push(`${def.name}: SAN deferred/ignored`);
      }
      if (active.ignoreWoundPenalties) {
        ctx.ignoreWoundPenalties = true;
        effects.push(`${def.name}: wound penalties suppressed`);
      }
      if (Number(active.moveMultiplier ?? 1) > 1) {
        ctx.moveMultiplier = Math.max(ctx.moveMultiplier, Number(active.moveMultiplier));
        effects.push(`${def.name}: MOVE x${Number(active.moveMultiplier)}`);
      }

      this._applyRollModSet(ctx, active.rollMods ?? entry.rollMods ?? {}, skillCtx, def.name, effects);
    }

    for (const entry of Object.values(state.crashes ?? {})) {
      if (!entry || (entry.expiresAt && entry.expiresAt <= now)) continue;
      const set = entry.crash?.rollMods ?? {};
      this._applyRollModSet(ctx, set, skillCtx, entry.name ?? "Drug Crash", effects);
    }

    const summary = effects.join("; ");

    return {
      flatMod: Number(ctx.flatMod ?? 0),
      extraActions: Number(ctx.extraActions ?? 0),
      damageTakenMultiplier: Number(ctx.damageTakenMultiplier ?? 1),
      ignoreFear: Boolean(ctx.ignoreFear),
      ignoreSanity: Boolean(ctx.ignoreSanity),
      ignoreWoundPenalties: Boolean(ctx.ignoreWoundPenalties),
      moveMultiplier: Number(ctx.moveMultiplier ?? 1),
      effects,
      summary
    };
  }

  static async modifyIncomingDamage({ actor, damage = 0, source = "" } = {}) {
    const resolvedActor = this.resolveActor(actor);
    const incoming = Math.max(0, Number(damage ?? 0));
    if (!resolvedActor || incoming <= 0) {
      return { damage: incoming, reduced: 0, multiplier: 1, summary: "" };
    }

    const ctx = await this.getCheckContext(resolvedActor, { rollType: "DM" });
    const multiplier = Math.max(0, Number(ctx.damageTakenMultiplier ?? 1));
    if (multiplier === 1) {
      return { damage: incoming, reduced: 0, multiplier: 1, summary: "" };
    }

    const next = Math.max(0, Math.ceil(incoming * multiplier));
    const reduced = Math.max(0, incoming - next);
    const summary = `Drug mitigation (${source || "damage"}): ${incoming} -> ${next}`;

    return {
      damage: next,
      reduced,
      multiplier,
      summary
    };
  }

  static buildDrugDescription(def) {
    const durationSec = this.durationToSeconds(def.duration, { system: { stats: { pow: { total: 10 } } } });
    const durationLabel = durationSec > 0 ? `${Math.max(1, Math.round(durationSec / 60))} min` : "instant";
    const lines = [];
    lines.push(`<p><strong>${def.name}</strong> (${def.category})</p>`);
    lines.push(`<p><strong>Duration:</strong> ${durationLabel}</p>`);
    lines.push(`<p><strong>Addiction:</strong> ${def.addiction ?? "Varies"}</p>`);
    if (def.notes?.length) {
      lines.push("<ul>");
      for (const note of def.notes) {
        lines.push(`<li>${note}</li>`);
      }
      lines.push("</ul>");
    }
    return lines.join("");
  }

  static buildDrugGearData(def) {
    const brpid = `i.gear.sla-drug-${def.id}`;
    return {
      name: `Drug: ${def.name}`,
      type: "gear",
      img: this.getDrugIconPath(def),
      system: {
        quantity: 0,
        enc: 0,
        crdEach: Number(def.cost ?? 0),
        crdTotal: 0,
        price: "average",
        equipStatus: "carried",
        description: this.buildDrugDescription(def)
      },
      flags: {
        [game.system.id]: {
          brpidFlag: {
            id: brpid,
            lang: game.i18n.lang,
            priority: 0
          },
          slaDrug: {
            id: def.id,
            name: def.name,
            cost: Number(def.cost ?? 0)
          }
        },
        brp: {
          brpidFlag: {
            id: brpid,
            lang: game.i18n.lang,
            priority: 0
          },
          slaDrug: {
            id: def.id,
            name: def.name,
            cost: Number(def.cost ?? 0)
          }
        }
      }
    };
  }

  static getDrugIconPath(drugRef) {
    const def = this.resolveDrugDef(drugRef);
    if (!def?.id) return "icons/svg/vial.svg";
    return `${this.DRUG_ICON_PATH}/${String(def.id).toLowerCase()}.svg`;
  }

  static async syncDrugIcons({ includeActors = true, includeCompendium = true, notify = false } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, unmatched: [], packs: [] };
    }

    const unmatched = new Set();
    let worldUpdated = 0;
    const worldUpdates = [];

    for (const item of game.items ?? []) {
      if (item.type !== "gear") continue;
      const meta = this.getDrugMetaFromItem(item);
      if (!meta?.id) continue;
      const iconPath = this.getDrugIconPath(meta.id);
      if (!iconPath) {
        unmatched.add(String(item.name ?? "").trim());
        continue;
      }
      if (item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }

    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items ?? []) {
          if (item.type !== "gear") continue;
          const meta = this.getDrugMetaFromItem(item);
          if (!meta?.id) continue;
          const iconPath = this.getDrugIconPath(meta.id);
          if (!iconPath) {
            unmatched.add(String(item.name ?? "").trim());
            continue;
          }
          if (item.img === iconPath) continue;
          updates.push({ _id: item.id, img: iconPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => pack.documentName === "Item");
      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          if (pack.locked) await pack.configure({ locked: false });
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            if (doc.type !== "gear") continue;
            const meta = this.getDrugMetaFromItem(doc);
            if (!meta?.id) continue;
            const iconPath = this.getDrugIconPath(meta.id);
            if (!iconPath) {
              unmatched.add(String(doc.name ?? "").trim());
              continue;
            }
            if (doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await pack.documentClass.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += packUpdated;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed syncing drug icons for pack ${pack.collection}`, err);
        } finally {
          packs.push({ collection: pack.collection, updated: packUpdated });
        }
      }
    }

    const summary = {
      worldUpdated,
      actorUpdated,
      compendiumUpdated,
      unmatched: Array.from(unmatched).sort((a, b) => a.localeCompare(b)),
      packs
    };

    if (notify) {
      ui.notifications.info(
        `SLA drug icons synced: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }

    return summary;
  }

  static async ensureFolder(folderName = "SLA Drugs") {
    let folder = game.folders.find((f) => f.type === "Item" && f.name === folderName && !f.folder);
    if (!folder) {
      folder = await Folder.create({
        name: folderName,
        type: "Item",
        color: "#7f4f6b"
      });
    }
    return folder;
  }

  static async seedWorldDrugGear({ overwrite = false, folderName = "SLA Drugs" } = {}) {
    const folder = await this.ensureFolder(folderName);
    const existing = new Map(
      game.items
        .filter((item) => item.type === "gear" && item.folder?.id === folder.id)
        .map((item) => [item.name.toLowerCase().trim(), item])
    );

    let created = 0;
    let updated = 0;

    for (const def of Object.values(this.DRUG_DEFINITIONS)) {
      const payload = this.buildDrugGearData(def);
      payload.folder = folder.id;
      const key = payload.name.toLowerCase().trim();
      const current = existing.get(key);
      if (!current) {
        await Item.create(payload);
        created += 1;
      } else if (overwrite) {
        await current.update(payload);
        updated += 1;
      }
    }

    ui.notifications.info(`SLA drugs seeded: ${created} created, ${updated} updated.`);
    return { created, updated, folder: folder.name };
  }
}
