import { SLAMentalSystem } from "../apps/sla-mental-system.mjs";
import { SLATraitEngine } from "../traits/trait-engine.mjs";

export class SLAEscalationInitiative {
  static APPROACHES = new Set(["dex", "int"]);

  static getActiveCombat() {
    return game.combat ?? game.combats?.active ?? null;
  }

  static findCombatant(combat, actor = null, token = null) {
    if (!combat) return null;
    const tokenId = String(token?.id ?? token?._id ?? "");
    const actorId = String(actor?.id ?? "");

    if (tokenId) {
      const byToken = combat.combatants.find((row) => String(row.tokenId ?? "") === tokenId);
      if (byToken) return byToken;
    }
    if (actorId) {
      return combat.combatants.find((row) => String(row.actorId ?? "") === actorId) ?? null;
    }
    return null;
  }

  static async rollControlled({
    approach = "dex",
    risk = false
  } = {}) {
    const combat = this.getActiveCombat();
    if (!combat) {
      ui.notifications.warn("No active combat.");
      return { ok: false, reason: "no-combat" };
    }

    const controlled = canvas?.tokens?.controlled ?? [];
    if (!controlled.length) {
      ui.notifications.warn("Select one or more controlled tokens.");
      return { ok: false, reason: "no-controlled-token" };
    }

    const ids = [];
    for (const token of controlled) {
      const combatant = token.combatant ?? this.findCombatant(combat, token.actor, token);
      if (combatant) ids.push(combatant.id);
    }
    if (!ids.length) {
      ui.notifications.warn("No combatants found for controlled tokens.");
      return { ok: false, reason: "no-combatants" };
    }

    await combat.rollInitiative(ids, {
      sla: {
        approach: this.normalizeApproach(approach),
        risk: Boolean(risk)
      }
    });

    return {
      ok: true,
      combat,
      rolled: ids.length
    };
  }

  static resolveActor(actorRef) {
    if (!actorRef) return null;
    if (actorRef instanceof Actor) return actorRef;
    if (typeof actorRef === "string") {
      return game.actors.get(actorRef) ?? game.actors.getName(actorRef) ?? null;
    }
    if (actorRef.id) return game.actors.get(actorRef.id) ?? null;
    return null;
  }

  static normalizeApproach(approach = "dex") {
    const norm = String(approach ?? "dex").trim().toLowerCase();
    if (this.APPROACHES.has(norm)) return norm;
    return "dex";
  }

  static getApproachLabel(approach = "dex") {
    const norm = this.normalizeApproach(approach);
    if (norm === "int") return "INT";
    return "DEX";
  }

  static getActorStatTotal(actor, approach = "dex") {
    const norm = this.normalizeApproach(approach);
    const value = Number(actor?.system?.stats?.[norm]?.total ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  static getD10Results(roll) {
    const values = [];
    for (const term of roll?.dice ?? []) {
      if (Number(term?.faces) !== 10) continue;
      for (const row of term?.results ?? []) {
        values.push(Number(row?.result ?? 0));
      }
    }
    return values;
  }

  static hasAnyOne(roll) {
    return this.getD10Results(roll).some((value) => value === 1);
  }

  static getInitiativeFlag(combatant) {
    return combatant?.flags?.[game.system.id]?.slaInitiative
      ?? combatant?.flags?.brp?.slaInitiative
      ?? {};
  }

  static compareCombatants(a, b) {
    const traitPriorityA = Number(SLATraitEngine.initiativePriority(a?.actor) ?? 0);
    const traitPriorityB = Number(SLATraitEngine.initiativePriority(b?.actor) ?? 0);
    if (traitPriorityA !== traitPriorityB) return traitPriorityB - traitPriorityA;

    const initA = Number.isFinite(Number(a?.initiative)) ? Number(a.initiative) : -Infinity;
    const initB = Number.isFinite(Number(b?.initiative)) ? Number(b.initiative) : -Infinity;
    if (initA !== initB) return initB - initA;

    const flagA = this.getInitiativeFlag(a);
    const flagB = this.getInitiativeFlag(b);
    const statA = Number(flagA?.statTotal ?? 0);
    const statB = Number(flagB?.statTotal ?? 0);
    if (statA !== statB) return statB - statA;

    const appA = this.normalizeApproach(flagA?.approach ?? "dex");
    const appB = this.normalizeApproach(flagB?.approach ?? "dex");
    const appWeightA = appA === "int" ? 1 : 0;
    const appWeightB = appB === "int" ? 1 : 0;
    if (appWeightA !== appWeightB) return appWeightB - appWeightA;

    return 0;
  }

  static async promptInitiativeChoice({
    actor,
    defaultApproach = "dex",
    defaultRisk = false
  } = {}) {
    const resolvedApproach = this.normalizeApproach(defaultApproach);
    const actorName = String(actor?.name ?? game.i18n.localize("BRP.character"));
    const content = `
      <form class="brp sla-roll-dialog" id="sla-init-choice-form">
        <header class="sla-dialog-head">
          <div class="sla-dialog-kicker">SLA INDUSTRIES // ESCALATION INITIATIVE</div>
          <div class="diff-label">${foundry.utils.escapeHTML(actorName)}</div>
          <div class="sla-dialog-sub">Choose approach and whether to take the risk roll.</div>
        </header>
        <div class="flexcol">
          <div class="flexrow" style="gap: 12px;">
            <label class="resource-label-diff"><input type="radio" name="approach" value="dex" ${resolvedApproach === "dex" ? "checked" : ""}> DEX (Reflex)</label>
            <label class="resource-label-diff"><input type="radio" name="approach" value="int" ${resolvedApproach === "int" ? "checked" : ""}> INT (Read the Fight)</label>
          </div>
          <div class="flexrow">
            <label class="resource-label-diff"><input type="checkbox" name="risk" ${defaultRisk ? "checked" : ""}> Risk roll (2D10 keep highest, trigger COOL if any die = 1)</label>
          </div>
        </div>
      </form>
    `;

    return new Promise((resolve) => {
      new Dialog({
        title: "Escalation Initiative",
        content,
        buttons: {
          roll: {
            label: game.i18n.localize("COMBAT.InitiativeRoll"),
            callback: (html) => {
              const form = html[0]?.querySelector("#sla-init-choice-form");
              const approach = this.normalizeApproach(form?.querySelector("input[name='approach']:checked")?.value ?? "dex");
              const risk = Boolean(form?.querySelector("input[name='risk']")?.checked);
              resolve({ approach, risk });
            }
          }
        },
        default: "roll",
        close: () => resolve(null)
      }).render(true);
    });
  }

  static getOptionalDifferentiationBonus(approach = "dex") {
    const enabled = Boolean(game.settings.get("sla-industries-brp", "escalationDifferentiation"));
    if (!enabled) return { enabled: false, type: "", label: "" };

    const norm = this.normalizeApproach(approach);
    if (norm === "int") {
      return {
        enabled: true,
        type: "attack",
        label: "+10% to first attack this round"
      };
    }
    return {
      enabled: true,
      type: "movement",
      label: "Gain 1m free movement before first action"
    };
  }

  static async rollForCombatant({
    combat,
    combatant,
    approach = "dex",
    risk = false
  } = {}) {
    if (!combatant?.actor || !combat) return { ok: false, reason: "invalid-combatant" };
    const actor = combatant.actor;
    const resolvedApproach = this.normalizeApproach(approach);
    const statLabel = this.getApproachLabel(resolvedApproach);
    const statTotal = this.getActorStatTotal(actor, resolvedApproach);
    const formula = risk
      ? `2D10kh + @stats.${resolvedApproach}.total`
      : `1D10 + @stats.${resolvedApproach}.total`;

    const roll = await new Roll(formula, actor.getRollData?.() ?? actor.system).evaluate();
    if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(roll, game.user, true, null, false);
    }

    const d10Values = this.getD10Results(roll);
    const coolTriggered = Boolean(risk) && d10Values.some((value) => value === 1);
    let coolResult = null;
    let noAction = false;
    let dodgeParryAllowed = true;

    if (coolTriggered) {
      coolResult = await SLAMentalSystem.coolCheck({
        actor,
        reason: "Escalation initiative risk trigger"
      });
      const coolLevel = Number(coolResult?.resultLevel ?? 1);
      if (coolLevel <= 1) {
        noAction = true;
      }
      if (coolLevel === 0) {
        dodgeParryAllowed = false;
      }
    }

    const optionalBonus = (coolTriggered && Number(coolResult?.resultLevel ?? 0) >= 2)
      ? this.getOptionalDifferentiationBonus(resolvedApproach)
      : { enabled: false, type: "", label: "" };

    const initiative = Number(roll.total ?? 0);
    const flagData = {
      mode: "escalation",
      approach: resolvedApproach,
      approachLabel: statLabel,
      statTotal,
      risk: Boolean(risk),
      formula,
      rollTotal: initiative,
      d10Values,
      coolTriggered,
      coolResultLevel: Number(coolResult?.resultLevel ?? -1),
      coolResultLabel: String(coolResult?.resultLabel ?? ""),
      noAction,
      dodgeParryAllowed,
      catastrophic: Number(coolResult?.resultLevel ?? 1) === 0,
      optionalBonus,
      round: Number(combat?.round ?? 0),
      timestamp: Date.now()
    };

    await combat.updateEmbeddedDocuments("Combatant", [{
      _id: combatant.id,
      initiative,
      [`flags.${game.system.id}.slaInitiative`]: flagData,
      "flags.brp.slaInitiative": flagData
    }]);

    await this.postInitiativeChat({
      actor,
      initiative,
      approach: statLabel,
      statTotal,
      risk: Boolean(risk),
      d10Values,
      coolTriggered,
      coolResult,
      noAction,
      dodgeParryAllowed,
      optionalBonus
    });

    return {
      ok: true,
      combatant,
      actor,
      initiative,
      approach: resolvedApproach,
      statTotal,
      risk: Boolean(risk),
      coolTriggered,
      coolResult,
      noAction,
      dodgeParryAllowed,
      optionalBonus
    };
  }

  static async rollActorQuick({
    actor,
    token = null,
    approach = "dex",
    risk = false
  } = {}) {
    const resolvedActor = this.resolveActor(actor);
    if (!resolvedActor) {
      ui.notifications.warn("Escalation initiative: actor not found.");
      return { ok: false, reason: "no-actor" };
    }

    const combat = this.getActiveCombat();
    const combatant = this.findCombatant(combat, resolvedActor, token);
    if (combat && combatant) {
      return this.rollForCombatant({
        combat,
        combatant,
        approach,
        risk
      });
    }

    const resolvedApproach = this.normalizeApproach(approach);
    const statLabel = this.getApproachLabel(resolvedApproach);
    const statTotal = this.getActorStatTotal(resolvedActor, resolvedApproach);
    const formula = risk
      ? `2D10kh + @stats.${resolvedApproach}.total`
      : `1D10 + @stats.${resolvedApproach}.total`;

    const roll = await new Roll(formula, resolvedActor.getRollData?.() ?? resolvedActor.system).evaluate();
    if (game.modules.get("dice-so-nice")?.active && game.dice3d) {
      game.dice3d.showForRoll(roll, game.user, true, null, false);
    }

    const d10Values = this.getD10Results(roll);
    const coolTriggered = Boolean(risk) && d10Values.some((value) => value === 1);
    let coolResult = null;
    let noAction = false;
    let dodgeParryAllowed = true;

    if (coolTriggered) {
      coolResult = await SLAMentalSystem.coolCheck({
        actor: resolvedActor,
        reason: "Escalation initiative risk trigger"
      });
      const coolLevel = Number(coolResult?.resultLevel ?? 1);
      if (coolLevel <= 1) noAction = true;
      if (coolLevel === 0) dodgeParryAllowed = false;
    }

    const optionalBonus = (coolTriggered && Number(coolResult?.resultLevel ?? 0) >= 2)
      ? this.getOptionalDifferentiationBonus(resolvedApproach)
      : { enabled: false, type: "", label: "" };
    const initiative = Number(roll.total ?? 0);

    await this.postInitiativeChat({
      actor: resolvedActor,
      initiative,
      approach: statLabel,
      statTotal,
      risk: Boolean(risk),
      d10Values,
      coolTriggered,
      coolResult,
      noAction,
      dodgeParryAllowed,
      optionalBonus
    });

    ui.notifications.info(
      `${resolvedActor.name}: ${statLabel} ${risk ? "risk" : "normal"} initiative ${initiative}.`
    );

    return {
      ok: true,
      actor: resolvedActor,
      initiative,
      approach: resolvedApproach,
      statTotal,
      risk: Boolean(risk),
      coolTriggered,
      coolResult,
      noAction,
      dodgeParryAllowed,
      optionalBonus
    };
  }

  static async postInitiativeChat({
    actor,
    initiative,
    approach,
    statTotal,
    risk,
    d10Values = [],
    coolTriggered = false,
    coolResult = null,
    noAction = false,
    dodgeParryAllowed = true,
    optionalBonus = { enabled: false, label: "" }
  } = {}) {
    if (!actor) return;
    let outcomeText = "";
    let outcomeClass = "roll-succ";
    if (coolTriggered) {
      if (noAction) {
        if (dodgeParryAllowed) {
          outcomeText = "Outcome: Frozen (no action this round; may Dodge/Parry).";
          outcomeClass = "roll-fail";
        } else {
          outcomeText = "Outcome: Catastrophic overcommit (no action; cannot Dodge/Parry until initiative passes).";
          outcomeClass = "roll-fumb";
        }
      } else {
        outcomeText = "Outcome: Act normally.";
        outcomeClass = "roll-succ";
      }
    }

    const templateData = {
      actorName: String(actor.name ?? game.i18n.localize("BRP.character")),
      actorImg: String(actor.img ?? "icons/svg/mystery-man.svg"),
      approach: String(approach ?? "DEX"),
      statTotal: Number(statTotal ?? 0),
      mode: risk ? "Risk" : "Normal",
      d10Text: d10Values.length ? d10Values.join(", ") : "-",
      initiative: Number(initiative ?? 0),
      risk: Boolean(risk),
      coolTriggered: Boolean(coolTriggered),
      coolResultLabel: String(coolResult?.resultLabel ?? "Failure"),
      outcomeClass,
      outcomeText,
      optionalBonusLabel: (optionalBonus?.enabled && optionalBonus?.label) ? String(optionalBonus.label) : ""
    };

    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/sla-industries-brp/templates/chat/roll-initiative.html",
      templateData
    );

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
}
