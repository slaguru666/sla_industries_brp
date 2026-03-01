const RULE_KEYS = [
  "pulpSla",
  "useHPL",
  "useSAN",
  "useRes5",
  "initiativeMode",
  "quickCombat",
  "ammoTracking",
  "ammoAutoSpend",
  "damageTargetMode",
  "showManipulationSkills",
  "showSocialSkills",
  "showSupernaturalSkills",
  "debugRollOverlay",
  "economyDebtInterestEnabled",
  "economyDebtInterestRate",
  "economyFinancierCutEnabled",
  "economyFinancierCutPercent"
];

export class SLARulesPanelSettings extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: "SLA Rules Panel",
      classes: ["brp", "rulesmenu"],
      id: "sla-rules-panel",
      template: "systems/sla-industries-brp/templates/settings/sla-rules-panel.html",
      width: 620,
      height: "auto",
      closeOnSubmit: true
    });
  }

  getData() {
    const get = (key) => game.settings.get("sla-industries-brp", key);
    return {
      values: Object.fromEntries(RULE_KEYS.map((key) => [key, get(key)])),
      initiativeModeList: {
        classic: game.i18n.localize("BRP.Settings.initiativeModeClassic"),
        escalation: game.i18n.localize("BRP.Settings.initiativeModeEscalation")
      },
      targetModeList: {
        dummy: "Allow Dummy Target",
        strict: "Require Selected Target",
        prompt: "Prompt When Missing"
      }
    };
  }

  async _updateObject(_event, data) {
    for (const key of RULE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        await game.settings.set("sla-industries-brp", key, data[key]);
      }
    }
  }
}
