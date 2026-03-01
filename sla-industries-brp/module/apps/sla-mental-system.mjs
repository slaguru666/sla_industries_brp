import { SLADialog } from "./sla-dialog.mjs";
import { SLATraitEngine } from "../traits/trait-engine.mjs";

export class SLAMentalSystem {
  static FLAG_KEY = "slaMental";

  static TEMP_INSANITY_EFFECTS = [
    "Acute paranoia",
    "Fight-or-flight panic",
    "Catatonic shock",
    "Violent dissociation",
    "Hallucinatory breakdown",
    "Compulsive shaking"
  ];

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

  static get roundSeconds() {
    return Math.max(1, Number(CONFIG?.time?.roundTime ?? game.combat?.roundTime ?? 6));
  }

  static getWorldTime() {
    return Number(game.time?.worldTime ?? Math.floor(Date.now() / 1000));
  }

  static getDefaultState() {
    return {
      sanityLossLog: [],
      shakenUntil: 0,
      panickedUntil: 0,
      temporaryInsanityUntil: 0,
      temporaryInsanityEffect: "",
      last: {
        sanLoss: 0,
        sanRoll: 0,
        coolRoll: 0,
        coolResult: ""
      }
    };
  }

  static _cleanState(state, now = this.getWorldTime()) {
    const next = foundry.utils.deepClone(state ?? this.getDefaultState());
    const cutoff = now - 3600;
    next.sanityLossLog = (next.sanityLossLog ?? []).filter((entry) => Number(entry?.time ?? 0) >= cutoff);
    next.shakenUntil = Math.max(0, Number(next.shakenUntil ?? 0));
    next.panickedUntil = Math.max(0, Number(next.panickedUntil ?? 0));
    next.temporaryInsanityUntil = Math.max(0, Number(next.temporaryInsanityUntil ?? 0));
    if (next.temporaryInsanityUntil <= now) {
      next.temporaryInsanityEffect = "";
    }
    return next;
  }

  static async getState(actorRef, { clean = true } = {}) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return this.getDefaultState();
    const fromSystem = actor.flags?.[game.system.id]?.[this.FLAG_KEY];
    const fromLegacy = actor.flags?.brp?.[this.FLAG_KEY];
    let state = foundry.utils.mergeObject(
      this.getDefaultState(),
      foundry.utils.deepClone(fromSystem ?? fromLegacy ?? {}),
      { inplace: false }
    );
    if (clean) {
      state = this._cleanState(state);
    }
    return state;
  }

  static async setState(actorRef, state) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return;
    await actor.setFlag(game.system.id, this.FLAG_KEY, state);
  }

  static getSkillTarget(actor, item) {
    if (!actor || !item) return 0;
    const base = Number(item.system?.total ?? 0);
    const category = String(item.system?.category ?? "");
    const catBonus = Number(actor.system?.skillcategory?.[category] ?? 0);
    return base + catBonus;
  }

  static findCoolSkill(actor) {
    if (!actor) return null;
    const preferred = new Set([
      "cool",
      "coolrating",
      "coolheaded",
      "coolness"
    ]);
    return actor.items.find((item) => {
      if (item.type !== "skill") return false;
      return preferred.has(this.normalizeText(item.name ?? ""));
    }) ?? null;
  }

  static getCoolTarget(actor, { fallbackMultiplier = 2 } = {}) {
    if (!actor) return { target: 0, source: "none", skillId: "" };

    const res5Value = Number(actor.system?.res5?.value ?? 0);
    const res5Max = Number(actor.system?.res5?.max ?? 0);
    const coolTrack = Math.max(0, res5Value, res5Max);
    if (coolTrack > 0) {
      return {
        target: Math.max(1, coolTrack),
        source: String(actor.system?.res5?.label ?? game.i18n.localize("BRP.res5")),
        skillId: ""
      };
    }

    const coolSkill = this.findCoolSkill(actor);
    if (coolSkill) {
      return {
        target: Math.max(1, Number(this.getSkillTarget(actor, coolSkill) ?? 0)),
        source: coolSkill.name,
        skillId: coolSkill.id
      };
    }

    const pow = Number(actor.system?.stats?.pow?.total ?? 0);
    return {
      target: Math.max(1, pow * Math.max(1, Number(fallbackMultiplier ?? 2))),
      source: "POW fallback",
      skillId: ""
    };
  }

  static parseSanityLossNotation(loss = "0/1D4") {
    const text = String(loss ?? "0/1D4").trim();
    if (!text.includes("/")) {
      return { successLoss: "0", failureLoss: text || "0" };
    }
    const [successPart, failurePart] = text.split("/", 2);
    return {
      successLoss: (successPart ?? "0").trim() || "0",
      failureLoss: (failurePart ?? "0").trim() || "0"
    };
  }

  static async rollFormulaTotal(formula = "0") {
    const text = String(formula ?? "0").trim();
    if (!text) return 0;
    if (/^[+-]?\d+$/.test(text)) return Number(text);
    const roll = await new Roll(text).evaluate();
    if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(roll, game.user, true, null, false);
    }
    return Number(roll.total ?? 0);
  }

  static resultLevelFromRoll(rollVal, targetScore) {
    const critChance = Math.ceil(0.05 * targetScore);
    const fumbleChance = Math.min(95 + critChance, 100);
    const specialChance = Math.round(0.2 * targetScore);
    const successChance = Math.min(targetScore, 95);

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

  static normaliseRollEdge(rawValue = "normal") {
    const value = String(rawValue ?? "").trim().toLowerCase();
    if (["advantage", "adv", "easy"].includes(value)) return "advantage";
    if (["disadvantage", "dis", "difficult", "hard", "extreme", "impossible", "tricky", "awkward"].includes(value)) return "disadvantage";
    return "normal";
  }

  static rollFormulaForEdge(edge = "normal") {
    const mode = this.normaliseRollEdge(edge);
    if (mode === "advantage") return "1D100";
    if (mode === "disadvantage") return "1D100";
    return "1D100";
  }

  static rollEdgeLabel(edge = "normal") {
    const mode = this.normaliseRollEdge(edge);
    if (mode === "advantage") return game.i18n.localize("BRP.adv");
    if (mode === "disadvantage") return game.i18n.localize("BRP.dis");
    return game.i18n.localize("BRP.normal");
  }

  static extractRollValues(roll) {
    const values = [];
    for (const die of roll?.dice ?? []) {
      if (Array.isArray(die?.values)) {
        for (const value of die.values) values.push(Number(value));
      }
    }
    return values.filter((value) => Number.isFinite(value));
  }

  static unitsDigitFromPercentile(rollVal = 100) {
    const value = Math.max(1, Math.min(100, Number(rollVal ?? 100) || 100));
    return value % 10;
  }

  static tensDigitFromD10(rollVal = 10) {
    const value = Number(rollVal ?? 10);
    if (!Number.isFinite(value)) return 0;
    return ((value % 10) + 10) % 10;
  }

  static percentileFromDigits(tensDigit = 0, unitsDigit = 0) {
    const tens = Math.max(0, Math.min(9, Number(tensDigit ?? 0) || 0));
    const units = Math.max(0, Math.min(9, Number(unitsDigit ?? 0) || 0));
    if (tens === 0 && units === 0) return 100;
    return (tens * 10) + units;
  }

  static async rollPercentileWithEdge(edge = "normal") {
    const mode = this.normaliseRollEdge(edge);
    const baseRoll = await new Roll("1D100").evaluate();
    if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(baseRoll, game.user, true, null, false);
    }
    const base = Math.max(1, Math.min(100, Number(baseRoll.total ?? 100) || 100));
    const unitsDigit = this.unitsDigitFromPercentile(base);

    if (mode === "normal") {
      return {
        mode,
        base,
        candidate: base,
        kept: base,
        unitsDigit,
        tensRaw: null,
        tensDigit: null,
        values: [base],
        detail: String(base)
      };
    }

    const tensRoll = await new Roll("1D10").evaluate();
    if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(tensRoll, game.user, true, null, false);
    }
    const tensRaw = Number(tensRoll.total ?? 10);
    const tensDigit = this.tensDigitFromD10(tensRaw);
    const candidate = this.percentileFromDigits(tensDigit, unitsDigit);
    const kept = mode === "advantage" ? Math.min(base, candidate) : Math.max(base, candidate);
    return {
      mode,
      base,
      candidate,
      kept,
      unitsDigit,
      tensRaw,
      tensDigit,
      values: [base, candidate],
      detail: `${base} | d10:${tensRaw} => ${candidate} | keep ${kept}`
    };
  }

  static async postMentalChat({
    actor,
    title = "Mental Check",
    summary = "",
    details = []
  } = {}) {
    if (!actor) return;
    const lines = [];
    if (summary) lines.push(`<div>${summary}</div>`);
    for (const line of details ?? []) {
      if (line) lines.push(`<div>${line}</div>`);
    }
    const content = `
      <form class="brp gr-card">
        <div class="bold">${title}</div>
        <div class="quick-combat" style="margin-left:0;">
          <div><strong>${actor.name}</strong></div>
          ${lines.join("")}
        </div>
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

  static sanityThreshold(currentSanity = 0) {
    return Math.max(1, Math.floor(Math.max(0, Number(currentSanity ?? 0)) / 5));
  }

  static async getSanityThresholdInfo(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor) {
      return {
        current: 0,
        threshold: 1,
        lastHourLoss: 0,
        temporaryInsanity: false
      };
    }
    const current = Math.max(0, Number(actor.system?.sanity?.value ?? 0));
    const threshold = this.sanityThreshold(current);
    const state = await this.getState(actor, { clean: true });
    const lastHourLoss = Number(
      (state.sanityLossLog ?? []).reduce((sum, entry) => sum + Math.max(0, Number(entry?.loss ?? 0)), 0)
    );
    const now = this.getWorldTime();
    return {
      current,
      threshold,
      lastHourLoss,
      temporaryInsanity: Number(state.temporaryInsanityUntil ?? 0) > now,
      temporaryInsanityEffect: String(state.temporaryInsanityEffect ?? "")
    };
  }

  static randomEntry(entries = []) {
    if (!entries.length) return "";
    const index = Math.floor(Math.random() * entries.length);
    return entries[index] ?? "";
  }

  static async applySanityLoss(actorRef, loss = 0, { reason = "" } = {}) {
    const actor = this.resolveActor(actorRef);
    const value = Math.max(0, Number(loss ?? 0));
    if (!actor || value <= 0) {
      return {
        before: Number(actor?.system?.sanity?.value ?? 0),
        after: Number(actor?.system?.sanity?.value ?? 0),
        applied: 0,
        threshold: this.sanityThreshold(Number(actor?.system?.sanity?.value ?? 0)),
        thresholdBreached: false,
        temporaryInsanity: false,
        permanentInsanity: Number(actor?.system?.sanity?.value ?? 0) <= 0,
        reason
      };
    }

    const before = Math.max(0, Number(actor.system?.sanity?.value ?? 0));
    const after = Math.max(0, before - value);
    const applied = before - after;
    await actor.update({ "system.sanity.value": after });

    const now = this.getWorldTime();
    const state = await this.getState(actor, { clean: true });
    state.sanityLossLog.push({
      time: now,
      loss: applied,
      reason: String(reason ?? "")
    });
    const clean = this._cleanState(state, now);
    const threshold = this.sanityThreshold(before);
    const lastHourLoss = Number(
      (clean.sanityLossLog ?? []).reduce((sum, entry) => sum + Math.max(0, Number(entry?.loss ?? 0)), 0)
    );
    const thresholdBreached = lastHourLoss >= threshold;
    let temporaryInsanity = false;
    let temporaryInsanityEffect = String(clean.temporaryInsanityEffect ?? "");

    if (thresholdBreached && Number(clean.temporaryInsanityUntil ?? 0) <= now) {
      const durationMinutes = Math.max(10, await this.rollFormulaTotal("1D10*10"));
      clean.temporaryInsanityUntil = now + (durationMinutes * 60);
      temporaryInsanity = true;
      temporaryInsanityEffect = this.randomEntry(this.TEMP_INSANITY_EFFECTS);
      clean.temporaryInsanityEffect = temporaryInsanityEffect;
    }

    clean.last = clean.last ?? {};
    clean.last.sanLoss = applied;
    await this.setState(actor, clean);

    return {
      before,
      after,
      applied,
      threshold,
      lastHourLoss,
      thresholdBreached,
      temporaryInsanity: temporaryInsanity || (Number(clean.temporaryInsanityUntil ?? 0) > now),
      temporaryInsanityEffect: String(clean.temporaryInsanityEffect ?? ""),
      permanentInsanity: after <= 0,
      reason
    };
  }

  static async sanityCheck({
    actor,
    loss = "0/1D4",
    reason = "",
    edge = "normal"
  } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) {
      ui.notifications.warn("SLA SAN: actor not found.");
      return { ok: false, reason: "no-actor" };
    }

    const beforeSan = Math.max(0, Number(resolvedActor.system?.sanity?.value ?? 0));
    const traitContext = await SLATraitEngine.getMentalContext(resolvedActor, {
      kind: "san",
      reason,
      preview: false
    });
    const target = Math.max(1, Math.min(99, beforeSan + Number(traitContext.flatMod ?? 0)));
    const rollEdge = this.normaliseRollEdge(edge);
    const edgeRoll = await this.rollPercentileWithEdge(rollEdge);
    const rollValues = edgeRoll.values;
    const rollVal = Number(edgeRoll.kept ?? 0);
    const success = rollVal <= target;
    const parsed = this.parseSanityLossNotation(loss);
    const lossFormula = success ? parsed.successLoss : parsed.failureLoss;
    const lossAmount = await this.rollFormulaTotal(lossFormula);
    const applied = await this.applySanityLoss(resolvedActor, lossAmount, { reason });

    const details = [
      `Roll (${this.rollEdgeLabel(rollEdge)}): ${edgeRoll.detail} vs SAN ${target} (${success ? "Success" : "Failure"})`,
      `Loss: ${lossFormula} -> ${applied.applied} SAN`,
      `SAN: ${applied.before} -> ${applied.after}`,
      `Threshold: ${applied.lastHourLoss}/${applied.threshold} SAN in last hour`
    ];
    if (traitContext.summary) {
      details.push(`Traits: ${traitContext.summary}`);
    }
    if (applied.temporaryInsanity) {
      details.push(`Temporary insanity: ${applied.temporaryInsanityEffect || "Triggered"}`);
    }
    if (applied.permanentInsanity) {
      details.push("SAN reached 0: permanent insanity.");
    }

    await this.postMentalChat({
      actor: resolvedActor,
      title: "SAN Check",
      summary: reason ? `Trigger: ${reason}` : "Sanity stress event",
      details
    });

    ui.notifications.info(
      `${resolvedActor.name}: SAN check ${success ? "success" : "failure"}, loss ${applied.applied}.`
    );
    return {
      ok: true,
      actor: resolvedActor,
      edge: rollEdge,
      rollValues,
      rollVal,
      target,
      success,
      traitFlatMod: Number(traitContext.flatMod ?? 0),
      traitSummary: String(traitContext.summary ?? ""),
      lossFormula,
      lossAmount: applied.applied,
      before: applied.before,
      after: applied.after,
      thresholdBreached: applied.thresholdBreached,
      temporaryInsanity: applied.temporaryInsanity,
      permanentInsanity: applied.permanentInsanity
    };
  }

  static async promptSanityCheck({ actor } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) return { ok: false, reason: "no-actor" };
    const content = `
      <form class="brp sla-roll-dialog" id="sla-san-check-form">
        <header class="sla-dialog-head">
          <div class="sla-dialog-kicker">SLA INDUSTRIES // MENTAL CONTROL</div>
          <div class="diff-label">SAN CHECK</div>
          <div class="sla-dialog-sub">Set edge, loss formula, and reason before rolling.</div>
        </header>
        <div class="flexcol">
          <div class="flexrow">
            <label class="resource-label-diff">Edge</label>
            <select name="edge">
              <option value="advantage">${game.i18n.localize("BRP.adv")} (1D100 + tens re-roll, keep best)</option>
              <option value="normal" selected>${game.i18n.localize("BRP.normal")} (1D100)</option>
              <option value="disadvantage">${game.i18n.localize("BRP.dis")} (1D100 + tens re-roll, keep worst)</option>
            </select>
          </div>
          <div class="flexrow">
            <label class="resource-label-diff">Loss</label>
            <input class="diff-number-input" name="loss" type="text" value="0/1D4" />
          </div>
          <div class="flexrow">
            <label class="resource-label-diff">Reason</label>
            <input class="diff-number-input" name="reason" type="text" value="" />
          </div>
        </div>
      </form>
    `;
    const formData = await SLADialog.waitForm({
      title: "SAN Check",
      content,
      formSelector: "#sla-san-check-form",
      submitLabel: game.i18n.localize("BRP.proceed"),
      cancelLabel: game.i18n.localize("Cancel"),
      cancelValue: false
    });
    if (!formData) return { ok: false, reason: "cancelled" };
    return this.sanityCheck({
      actor: resolvedActor,
      edge: String(formData.get("edge") ?? "normal"),
      loss: String(formData.get("loss") ?? "0/1D4"),
      reason: String(formData.get("reason") ?? "")
    });
  }

  static async promptCoolCheck({ actor, reason = "Immediate threat response" } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) return { ok: false, reason: "no-actor" };
    const content = `
      <form class="brp sla-roll-dialog" id="sla-cool-check-form">
        <header class="sla-dialog-head">
          <div class="sla-dialog-kicker">SLA INDUSTRIES // MENTAL CONTROL</div>
          <div class="diff-label">COOL CHECK</div>
          <div class="sla-dialog-sub">Set edge, modifier, and reason before rolling.</div>
        </header>
        <div class="flexcol">
          <div class="flexrow">
            <label class="resource-label-diff">Edge</label>
            <select name="edge">
              <option value="advantage">${game.i18n.localize("BRP.adv")} (1D100 + tens re-roll, keep best)</option>
              <option value="normal" selected>${game.i18n.localize("BRP.normal")} (1D100)</option>
              <option value="disadvantage">${game.i18n.localize("BRP.dis")} (1D100 + tens re-roll, keep worst)</option>
            </select>
          </div>
          <div class="flexrow">
            <label class="resource-label-diff">Modifier</label>
            <input class="diff-number-input" name="modifier" type="number" value="0" />
          </div>
          <div class="flexrow">
            <label class="resource-label-diff">Reason</label>
            <input class="diff-number-input" name="reason" type="text" value="${String(reason ?? "")}" />
          </div>
        </div>
      </form>
    `;
    const formData = await SLADialog.waitForm({
      title: "COOL Check",
      content,
      formSelector: "#sla-cool-check-form",
      submitLabel: game.i18n.localize("BRP.proceed"),
      cancelLabel: game.i18n.localize("Cancel"),
      cancelValue: false
    });
    if (!formData) return { ok: false, reason: "cancelled" };
    return this.coolCheck({
      actor: resolvedActor,
      edge: String(formData.get("edge") ?? "normal"),
      modifier: Number(formData.get("modifier") ?? 0),
      reason: String(formData.get("reason") ?? reason ?? "")
    });
  }

  static async coolCheck({
    actor,
    modifier = 0,
    reason = "",
    edge = "normal"
  } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) {
      ui.notifications.warn("SLA COOL: actor not found.");
      return { ok: false, reason: "no-actor" };
    }

    const cool = this.getCoolTarget(resolvedActor);
    const traitContext = await SLATraitEngine.getMentalContext(resolvedActor, {
      kind: "cool",
      reason,
      modifier: Number(modifier ?? 0),
      preview: false
    });
    const coolPercentDelta = Number(traitContext.coolPercentDelta ?? 0);
    const coolTargetAfterCap = Math.round(Number(cool.target ?? 0) * (1 + (coolPercentDelta / 100)));
    const target = Math.max(
      1,
      Math.min(
        99,
        Number(coolTargetAfterCap ?? cool.target ?? 0)
        + Number(modifier ?? 0)
        + Number(traitContext.flatMod ?? 0)
      )
    );
    const rollEdge = this.normaliseRollEdge(edge);
    const edgeRoll = await this.rollPercentileWithEdge(rollEdge);
    const rollValues = edgeRoll.values;
    const rollVal = Number(edgeRoll.kept ?? 0);
    let resultLevel = this.resultLevelFromRoll(rollVal, target);
    let resultLabel = this.resultLabel(resultLevel);

    const now = this.getWorldTime();
    const state = await this.getState(resolvedActor, { clean: true });
    let shock = "Steady";
    let traitAutoPassUsed = false;
    if (resultLevel < 2 && traitContext.autoPassCool) {
      resultLevel = 2;
      resultLabel = "Success";
      traitAutoPassUsed = true;
      shock = "Steady (Exceedingly Cool auto-pass)";
      try {
        await SLATraitEngine.consumeSessionAbility(resolvedActor, "exceedingly-cool", "auto-cool-pass");
      } catch (err) {
        console.warn("sla-industries-brp | Trait auto-pass consume failed", err);
      }
    }
    if (resultLevel < 2) {
      if (resultLevel === 0) {
        state.panickedUntil = Math.max(Number(state.panickedUntil ?? 0), now + this.roundSeconds);
        state.shakenUntil = Math.max(Number(state.shakenUntil ?? 0), now + this.roundSeconds);
        shock = "Panicked: lose control for 1 round";
      } else {
        state.shakenUntil = Math.max(Number(state.shakenUntil ?? 0), now + this.roundSeconds);
        shock = "Shaken: -20% actions for 1 round";
      }
    }
    state.last = state.last ?? {};
    state.last.coolRoll = rollVal;
    state.last.coolResult = resultLabel;
    await this.setState(resolvedActor, state);

    await this.postMentalChat({
      actor: resolvedActor,
      title: "COOL Check",
      summary: reason ? `Trigger: ${reason}` : "Immediate stress response",
      details: [
        `Source: ${cool.source}`,
        `Roll (${this.rollEdgeLabel(rollEdge)}): ${edgeRoll.detail} vs COOL ${target} (${resultLabel})`,
        traitContext.summary ? `Traits: ${traitContext.summary}` : "",
        shock
      ].filter(Boolean)
    });

    ui.notifications.info(`${resolvedActor.name}: COOL ${resultLabel.toLowerCase()}.`);
    return {
      ok: true,
      actor: resolvedActor,
      edge: rollEdge,
      rollValues,
      rollVal,
      target,
      resultLevel,
      resultLabel,
      shock,
      source: cool.source,
      traitFlatMod: Number(traitContext.flatMod ?? 0),
      traitSummary: String(traitContext.summary ?? ""),
      coolPercentDelta,
      traitAutoPassUsed
    };
  }

  static async clearStress(actorRef) {
    const actor = this.resolveActor(actorRef);
    if (!actor) return { ok: false, reason: "no-actor" };
    const state = await this.getState(actor, { clean: true });
    state.shakenUntil = 0;
    state.panickedUntil = 0;
    await this.setState(actor, state);
    ui.notifications.info(`${actor.name}: shaken/panicked stress cleared.`);
    return { ok: true };
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

    const now = this.getWorldTime();
    const state = await this.getState(actor, { clean: true });
    if (!preview) {
      await this.setState(actor, state);
    }

    const rollType = String(config?.rollType ?? "").toUpperCase();
    const cardType = String(config?.cardType ?? "").toUpperCase();
    // SLA: COOL/SAN state should not directly suppress core characteristic resistance checks.
    if (rollType === "CH" || cardType === "RE" || cardType === "PP") {
      return {
        flatMod: 0,
        effects: [],
        summary: ""
      };
    }

    const effects = [];
    let flatMod = 0;
    const currentSan = Math.max(0, Number(actor.system?.sanity?.value ?? 0));
    if (currentSan <= 20) {
      flatMod -= 20;
      effects.push("SAN <= 20: COOL penalty -20%");
    } else if (currentSan <= 40) {
      flatMod -= 10;
      effects.push("SAN <= 40: COOL penalty -10%");
    }

    if (Number(state.temporaryInsanityUntil ?? 0) > now) {
      flatMod -= 20;
      const label = state.temporaryInsanityEffect ? `Temporary insanity (${state.temporaryInsanityEffect})` : "Temporary insanity";
      effects.push(`${label}: -20%`);
    }

    if (Number(state.panickedUntil ?? 0) > now) {
      flatMod -= 40;
      effects.push("Panicked: -40%");
    } else if (Number(state.shakenUntil ?? 0) > now) {
      flatMod -= 20;
      effects.push("Shaken: -20%");
    }

    return {
      flatMod,
      effects,
      summary: effects.join("; ")
    };
  }
}
