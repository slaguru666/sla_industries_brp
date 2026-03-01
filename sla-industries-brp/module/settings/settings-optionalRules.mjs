const SETTINGS = {

  useHPL: {
    name: 'BRP.Settings.useHPL',
    hint: 'BRP.Settings.useHPLHint',
    scope: 'world',
    config: false,
    type: Boolean,
    default: true,
  },

  pulpSla: {
    name: 'BRP.Settings.pulpSla',
    hint: 'BRP.Settings.pulpSlaHint',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  },

  useEDU: {
    name: 'BRP.Settings.useEDU',
    hint: 'BRP.Settings.useEDUHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },

  useSAN: {
    name: 'BRP.Settings.useSAN',
    hint: 'BRP.Settings.useSANHint',
    scope: 'world',
    config: false,
    default: true,
    type: Boolean
  },

  useFP: {
    name: 'BRP.Settings.useFP',
    hint: 'BRP.Settings.useFPHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },

  useRes5: {
    name: 'BRP.Settings.useRes5',
    hint: 'BRP.Settings.useRes5Hint',
    scope: 'world',
    config: false,
    default: true,
    type: Boolean
  },

  hpLabelLong: {
    name: 'BRP.Settings.hpLabelLong',
    hint: 'BRP.Settings.hpLabelLongHint',
    scope: 'world',
    config: false,
    default: "",
    type: String
  },

  hpLabelShort: {
    name: 'BRP.Settings.hpLabelShort',
    hint: 'BRP.Settings.hpLabelShortHint',
    scope: 'world',
    config: false,
    default: "",
    type: String
  },

  ppLabelLong: {
    name: 'BRP.Settings.ppLabelLong',
    hint: 'BRP.Settings.ppLabelLongHint',
    scope: 'world',
    config: false,
    default: "Flux",
    type: String
  },

  ppLabelShort: {
    name: 'BRP.Settings.ppLabelShort',
    hint: 'BRP.Settings.ppLabelShortHint',
    scope: 'world',
    config: false,
    default: "FLX",
    type: String
  },

  fpLabelLong: {
    name: 'BRP.Settings.fpLabelLong',
    hint: 'BRP.Settings.fpLabelLongHint',
    scope: 'world',
    config: false,
    default: "Fatigue",
    type: String
  },

  fpLabelShort: {
    name: 'BRP.Settings.fpLabelShort',
    hint: 'BRP.Settings.fpLabelShortHint',
    scope: 'world',
    config: false,
    default: "FP",
    type: String
  },

  res5LabelLong: {
    name: 'BRP.Settings.res5LabelLong',
    hint: 'BRP.Settings.res5LabelLongHint',
    scope: 'world',
    config: false,
    default: "COOL Rating",
    type: String
  },

  res5LabelShort: {
    name: 'BRP.Settings.res5LabelShort',
    hint: 'BRP.Settings.res5LabelShortHint',
    scope: 'world',
    config: false,
    default: "COOL",
    type: String
  },

  skillBonus: {
    name: "BRP.Settings.skillBonus",
    hint: "BRP.Settings.skillBonusHint",
    scope: "world",
    config: false,
    type: String,
    default: 1
  },

  useAVRand: {
    name: 'BRP.Settings.useAVRand',
    hint: 'BRP.Settings.useAVRandHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },

  useAlleg: {
    name: 'BRP.Settings.useAlleg',
    hint: 'BRP.Settings.useAllegHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },

  usePassion: {
    name: 'BRP.Settings.usePassion',
    hint: 'BRP.Settings.usePassionHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },

  useReputation: {
    name: 'BRP.Settings.useReputation',
    hint: 'BRP.Settings.useReputationHint',
    scope: 'world',
    config: false,
    default: 0,
    type: String
  },

  usePersTrait: {
    name: 'BRP.Settings.usePersTrait',
    hint: 'BRP.Settings.usePersTraitHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },

  showManipulationSkills: {
    name: 'BRP.Settings.showManipulationSkills',
    hint: 'BRP.Settings.showManipulationSkillsHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },

  showSocialSkills: {
    name: 'BRP.Settings.showSocialSkills',
    hint: 'BRP.Settings.showSocialSkillsHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  },

  showSupernaturalSkills: {
    name: 'BRP.Settings.showSupernaturalSkills',
    hint: 'BRP.Settings.showSupernaturalSkillsHint',
    scope: 'world',
    config: false,
    default: false,
    type: Boolean
  }
}

export class BRPOptionalRuleSettings extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: 'BRP.brpSettings',
      classes: ["brp", "rulesmenu"],
      id: 'optional-settings',
      template: 'systems/sla-industries-brp/templates/settings/optional-settings.html',
      width: 550,
      height: 'auto',
      closeOnSubmit: true
    })
  }

  getData() {
    const options = {}
    for (const [k, v] of Object.entries(SETTINGS)) {
      options[k] = {
        value: game.settings.get('sla-industries-brp', k),
        setting: v
      }
    }

    options.skillBonusList = {
      "0": game.i18n.localize('BRP.none'),
      "1": game.i18n.localize('BRP.simple'),
      "2": game.i18n.localize('BRP.advanced')
    }

    options.useRepList = {
      "0": game.i18n.localize('BRP.none'),
      "1": game.i18n.localize('BRP.single'),
      "2": game.i18n.localize('BRP.multiple'),
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
