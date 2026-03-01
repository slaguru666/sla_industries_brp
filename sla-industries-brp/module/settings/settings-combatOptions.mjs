const SETTINGS = {

  initStat: {
    name: 'BRP.Settings.initStat',
    hint: 'BRP.Settings.initStatHint',
    scope: 'world',
    config: false,
    default: "dex",
    type: String,
  },

  initMod: {
    name: 'BRP.Settings.initMod',
    hint: 'BRP.Settings.initModHint',
    scope: 'world',
    config: false,
    default: "+0",
    type: String,
  },

  initRound: {
    name: "BRP.Settings.initRound",
    hint: "BRP.Settings.initRoundHint",
    scope: "world",
    config: false,
    type: String,
    default: "no",
  },

  initiativeMode: {
    name: "BRP.Settings.initiativeMode",
    hint: "BRP.Settings.initiativeModeHint",
    scope: "world",
    config: false,
    default: "escalation",
    type: String
  },

  escalationDifferentiation: {
    name: "BRP.Settings.escalationDifferentiation",
    hint: "BRP.Settings.escalationDifferentiationHint",
    scope: "world",
    config: false,
    default: false,
    type: Boolean
  },

  quickCombat: {
    name: "BRP.Settings.quickCombat",
    hint: "BRP.Settings.quickCombatHint",
    scope: "world",
    config: false,
    default: false,
    type: Boolean
  },

  ammoTracking: {
    name: "BRP.Settings.ammoTracking",
    hint: "BRP.Settings.ammoTrackingHint",
    scope: "world",
    config: false,
    default: true,
    type: Boolean
  },

  ammoAutoSpend: {
    name: "BRP.Settings.ammoAutoSpend",
    hint: "BRP.Settings.ammoAutoSpendHint",
    scope: "world",
    config: false,
    default: true,
    type: Boolean
  },

  ammoNotify: {
    name: "BRP.Settings.ammoNotify",
    hint: "BRP.Settings.ammoNotifyHint",
    scope: "world",
    config: false,
    default: true,
    type: Boolean
  },

  combatTargetingMode: {
    name: "BRP.Settings.combatTargetingMode",
    hint: "BRP.Settings.combatTargetingModeHint",
    scope: "world",
    config: false,
    default: "prefer-selected",
    type: String
  },

  ammoDeficitMode: {
    name: "BRP.Settings.ammoDeficitMode",
    hint: "BRP.Settings.ammoDeficitModeHint",
    scope: "world",
    config: false,
    default: "warn",
    type: String
  },

  debugRollOverlay: {
    name: "BRP.Settings.debugRollOverlay",
    hint: "BRP.Settings.debugRollOverlayHint",
    scope: "world",
    config: false,
    default: false,
    type: Boolean
  },

}

import { BRPSelectLists } from "../apps/select-lists.mjs";

export class BRPCombatRuleSettings extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: 'BRP.brpSettings',
      classes: ["brp", "rulesmenu"],
      id: 'combat-settings',
      template: 'systems/sla-industries-brp/templates/settings/combat-settings.html',
      width: 550,
      height: 'auto',
      closeOnSubmit: true
    })
  }

  async getData() {
    const options = {}
    for (const [k, v] of Object.entries(SETTINGS)) {
      options[k] = {
        value: game.settings.get('sla-industries-brp', k),
        setting: v
      }
    }

    options.initChoiceList = await BRPSelectLists.getStatOptions();

    options.initRoundList = {
      "no": game.i18n.localize('BRP.no'),
      "manual": game.i18n.localize('BRP.manual'),
      "auto": game.i18n.localize('BRP.automatic'),
    }

    options.initiativeModeList = {
      "classic": game.i18n.localize("BRP.Settings.initiativeModeClassic"),
      "escalation": game.i18n.localize("BRP.Settings.initiativeModeEscalation")
    }

    options.combatTargetingModeList = {
      "prefer-selected": game.i18n.localize("BRP.Settings.combatTargetingModePreferSelected"),
      "selected-only": game.i18n.localize("BRP.Settings.combatTargetingModeSelectedOnly"),
      "card-then-selected": game.i18n.localize("BRP.Settings.combatTargetingModeCardThenSelected"),
      "dummy-only": game.i18n.localize("BRP.Settings.combatTargetingModeDummyOnly")
    }

    options.ammoDeficitModeList = {
      "allow": game.i18n.localize("BRP.Settings.ammoDeficitModeAllow"),
      "warn": game.i18n.localize("BRP.Settings.ammoDeficitModeWarn"),
      "block": game.i18n.localize("BRP.Settings.ammoDeficitModeBlock")
    }

    return options
  }

  static registerSettings() {
    for (const [k, v] of Object.entries(SETTINGS)) {
      game.settings.register('sla-industries-brp', k, v)
    }
  }

  activateListeners(html) {
    super.activateListeners(html)
    html.find('button[name=reset]').on('click', event => this.onResetDefaults(event))
  }

  async onResetDefaults(event) {
    event.preventDefault()
    for await (const [k, v] of Object.entries(SETTINGS)) {
      await game.settings.set('sla-industries-brp', k, v?.default)
    }
    return this.render()
  }

  async _updateObject(event, data) {
    for await (const key of Object.keys(SETTINGS)) {
      game.settings.set('sla-industries-brp', key, data[key])
    }
  }

}
