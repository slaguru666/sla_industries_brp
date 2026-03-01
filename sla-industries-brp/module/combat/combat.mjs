import { SLAEscalationInitiative } from "./sla-escalation-initiative.mjs";

export class BRPCombat extends Combat {
  setupTurns() {
    const turns = super.setupTurns();
    if (game.settings.get("sla-industries-brp", "initiativeMode") !== "escalation") {
      return turns;
    }
    if (!Array.isArray(this.turns) || !this.turns.length) {
      return turns;
    }

    const currentId = this.combatant?.id ?? null;
    this.turns.sort((a, b) => SLAEscalationInitiative.compareCombatants(a, b));
    if (currentId) {
      const currentIndex = this.turns.findIndex((turn) => turn.id === currentId);
      this.turn = Math.max(currentIndex, 0);
    }
    return this.turns;
  }

  async rollInitiative(ids, options = {}) {
    if (game.settings.get("sla-industries-brp", "initiativeMode") !== "escalation") {
      return super.rollInitiative(ids, options);
    }

    const combatantIds = typeof ids === "string"
      ? [ids]
      : Array.from(ids ?? []);
    if (!combatantIds.length) return this;

    const combatants = combatantIds
      .map((id) => this.combatants.get(id))
      .filter((combatant) => Boolean(combatant?.actor));
    if (!combatants.length) return this;

    const explicitApproach = String(options?.sla?.approach ?? "").trim().toLowerCase();
    const hasExplicitApproach = ["dex", "int"].includes(explicitApproach);
    const hasExplicitRisk = options?.sla?.risk !== undefined;
    const isBulk = combatants.length > 1;
    let rolled = 0;

    for (const combatant of combatants) {
      let approach = hasExplicitApproach ? explicitApproach : "dex";
      let risk = hasExplicitRisk ? Boolean(options?.sla?.risk) : false;

      if (!isBulk && !hasExplicitApproach && !hasExplicitRisk) {
        const choice = await SLAEscalationInitiative.promptInitiativeChoice({
          actor: combatant.actor,
          defaultApproach: "dex",
          defaultRisk: false
        });
        if (!choice) continue;
        approach = choice.approach;
        risk = choice.risk;
      }

      const result = await SLAEscalationInitiative.rollForCombatant({
        combat: this,
        combatant,
        approach,
        risk
      });
      if (result?.ok) rolled++;
    }

    if (isBulk && !hasExplicitApproach && !hasExplicitRisk && rolled > 0) {
      ui.notifications.info("Escalation initiative bulk roll used DEX normal rolls.");
    }

    if (rolled > 0) {
      this.setupTurns();
      this.render();
    }
    return this;
  }

  async nextRound() {
    if (game.settings.get('sla-industries-brp', 'initRound') !== 'no') {
      await this.resetAll();
    }
    if (game.settings.get('sla-industries-brp', 'initRound') === 'auto') {
      await this.rollAll();
      await this.setupTurns();
    }
    super.nextRound()
  }

}
