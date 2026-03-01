import { BRPCheck } from "../apps/check.mjs"
import { isCtrlKey } from '../apps/helper.mjs'
import { BRPID } from '../brpid/brpid.mjs';

export class BRPItem extends Item {
  constructor(data, context) {
    if (typeof data.img === 'undefined') {
      if (data.type === 'powerMod') {
        data.img = 'systems/sla-industries-brp/assets/Icons/broken-shield.svg'
      } else if (data.type === 'failing') {
        data.img = 'systems/sla-industries-brp/assets/Icons/drama-masks.svg'
      } else if (data.type === 'hit-location') {
        data.img = 'systems/sla-industries-brp/assets/Icons/arm-bandage.svg'
      } else if (data.type === 'magic') {
        data.img = 'systems/sla-industries-brp/assets/Icons/scroll-unfurled.svg'
      } else if (data.type === 'mutation') {
        data.img = 'systems/sla-industries-brp/assets/Icons/dna1.svg'
      } else if (data.type === 'personality') {
        data.img = 'systems/sla-industries-brp/assets/Icons/inner-self.svg'
      } else if (data.type === 'power') {
        data.img = 'systems/sla-industries-brp/assets/Icons/lightning-helix.svg'
      } else if (data.type === 'profession') {
        data.img = 'systems/sla-industries-brp/assets/Icons/blacksmith.svg'
      } else if (data.type === 'psychic') {
        data.img = 'systems/sla-industries-brp/assets/Icons/suspicious.svg'
      } else if (data.type === 'skill') {
        data.img = 'systems/sla-industries-brp/assets/Icons/skills.svg'
      } else if (data.type === 'sorcery') {
        data.img = 'systems/sla-industries-brp/assets/Icons/bolt-spell-cast.svg'
      } else if (data.type === 'powerMod') {
        data.img = 'systems/sla-industries-brp/assets/Icons/broken-shield.svg'
      } else if (data.type === 'super') {
        data.img = 'systems/sla-industries-brp/assets/Icons/deadly-strike.svg'
      } else if (data.type === 'armour') {
        data.img = 'systems/sla-industries-brp/assets/Icons/lamellar.svg'
      } else if (data.type === 'gear') {
        data.img = 'systems/sla-industries-brp/assets/Icons/knapsack.svg'
      } else if (data.type === 'weapon') {
        data.img = 'systems/sla-industries-brp/assets/Icons/saber-and-pistol.svg'
      } else if (data.type === 'wound') {
        data.img = 'systems/sla-industries-brp/assets/Icons/drop.svg'
      } else if (data.type === 'allegiance') {
        data.img = 'systems/sla-industries-brp/assets/Icons/all-seeing-eye.svg'
      } else if (data.type === 'passion') {
        data.img = 'systems/sla-industries-brp/assets/Icons/shining-heart.svg'
      } else if (data.type === 'persTrait') {
        data.img = 'systems/sla-industries-brp/assets/Icons/scales.svg'
      } else if (data.type === 'reputation') {
        data.img = 'systems/sla-industries-brp/assets/Icons/throne-king.svg'
      } else if (data.type === 'skillcat') {
        data.img = 'systems/sla-industries-brp/assets/Icons/classical-knowledge.svg'
      } else if (data.type === 'culture') {
        data.img = 'systems/sla-industries-brp/assets/Icons/earth-africa-europe.svg'
      }
    }
    super(data, context)
  }


  prepareData() {
    super.prepareData();
  }

  prepareDerivedData() {
    const itemData = this;
    const systemData = itemData.system;

    //Set Resource Labels
    if (game.settings.get('sla-industries-brp', 'ppLabelLong')) {
      systemData.powerLabel = game.settings.get('sla-industries-brp', 'ppLabelLong')
    } else {
      systemData.powerLabel = game.i18n.localize('BRP.pp')
    }
    if (game.settings.get('sla-industries-brp', 'ppLabelShort')) {
      systemData.powerLabelAbbr = game.settings.get('sla-industries-brp', 'ppLabelShort')
    } else {
      systemData.powerLabelAbbr = game.i18n.localize('BRP.ppShort')
    }
    if (game.settings.get('sla-industries-brp', 'hpLabelShort')) {
      systemData.healthLabelAbbr = game.settings.get('sla-industries-brp', 'hpLabelShort')
    } else {
      systemData.healthLabelAbbr = game.i18n.localize('BRP.hp')
    }
  }

  getRollData() {
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);
    return rollData;
  }

  async roll() {
    const item = this;
    const actor = this.actor;
    let altKey = event.altKey;
    let ctrlKey = isCtrlKey(event ?? false);
    let cardType = "NO";
    let rollType = ""
    let skillId = "";
    let itemId = "";
    let opp = 'false'
    let shiftKey = event.shiftKey;
    let fireMode = "single";
    if (altKey) fireMode = "burst";
    if (ctrlKey) fireMode = "auto";
    if (game.settings.get('sla-industries-brp', 'switchShift')) {
      shiftKey = !shiftKey
    }

    switch (item.type) {
      case 'skill':
        rollType = "SK"
        skillId = item._id
        if (ctrlKey) { cardType = 'OP' }
        if (altKey) { cardType = 'GR' }
        break
      case 'allegiance':
        rollType = "AL"
        skillId = item._id
        break
      case 'passion':
        rollType = "PA"
        if (ctrlKey) { cardType = 'OP' }
        skillId = item._id
        break
      case 'persTrait':
        rollType = "PT"
        if (ctrlKey) { cardType = 'OP' }
        if (altKey) { opp = 'true' }
        skillId = item._id
        break
      case 'weapon':
        rollType = "CM"
        itemId = item._id
        skillId = actor.items.get(itemId).system.sourceID
        break
      case 'reputation':
        rollType = "PA"
        if (ctrlKey) { cardType = 'OP' }
        if (altKey) { cardType = 'GR' }
        skillId = item._id
        break
      default:
        item.sheet.render(true);
        return
    }

    BRPCheck._trigger({
      rollType,
      cardType,
      skillId,
      itemId,
      fireMode,
      shiftKey,
      actor,
      opp,
    })
  }


  //Add BRPIDs to newly created items
  static async createDocuments(data = [], context = {}) {
    if (context.keepEmbeddedIds === undefined) context.keepEmbeddedIds = false;
    let created = await super.createDocuments(data, context);

    //Add BRPID based on item name if the game setting is flagged.
    for (let item of created) {
      if (game.settings.get('sla-industries-brp', "itemBRPID")) {
        let tempID = await BRPID.guessId(item)
        if (tempID) {
          await item.update({ 'flags.brp.brpidFlag.id': tempID })
          const html = $(item.sheet.element).find('header.window-header a.header-button.edit-brpid-warning,header.window-header a.header-button.edit-brpid-exisiting')
          if (html.length) {
            html.css({
              color: (tempID ? 'orange' : 'red')
            })
          }
          item.render()
        }
      }
    }
    return created
  }

  static async createDialog(data={}, createOptions={}, { types, ...options }={}) {
    // SLA-only creation list for world item side bar.
    const allowed = new Set([
      "gear",
      "skill",
      "psychic",
      "armour",
      "weapon",
      "profession",
      "culture",
      "hit-location",
      "skillcat"
    ]);
    if (!types) types = this.TYPES.filter(type => allowed.has(type));
    else types = types.filter(type => allowed.has(type));
    return super.createDialog(data, createOptions, { types, ...options });
  }

  async _preDelete(options, user) {
    if (this.parent) {
      const ids = this.parent.effects.filter(e => e.origin === this.uuid).map(e => e.id)
      if (ids.length) {
        await this.parent.deleteEmbeddedDocuments('ActiveEffect', ids)
      }
    }
    return super._preDelete(options, user);
  }

  /** @override */
  static async _onCreateOperation(documents, operation, user) {
    super._onCreateOperation(documents, operation, user)
    /* Copied from FoundryVTT v12 item.js replacing Actor with ActorDelta */
    if ( !(operation.parent instanceof ActorDelta) || !CONFIG.ActiveEffect.legacyTransferral || !user.isSelf ) return;
    const cls = getDocumentClass("ActiveEffect");

    // Create effect data
    const toCreate = [];
    for ( let item of documents ) {
      for ( let e of item.effects ) {
        if ( !e.transfer ) continue;
        const effectData = e.toJSON();
        effectData.origin = item.uuid;
        toCreate.push(effectData);
      }
    }

    // Asynchronously create transferred Active Effects
    operation = {...operation};
    delete operation.data;
    operation.renderSheet = false;
    // noinspection ES6MissingAwait
    cls.createDocuments(toCreate, operation);
  }
}
