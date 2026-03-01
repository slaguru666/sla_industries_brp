import { BRPSelectLists } from "../../apps/select-lists.mjs";
import { addBRPIDSheetHeaderButton } from '../../brpid/brpid-button.mjs'
import { SLAEbbSystem } from "../../apps/sla-ebb-system.mjs";

export class BRPPsychicSheet extends foundry.appv1.sheets.ItemSheet {
  constructor(...args) {
    super(...args)
    this._sheetTab = 'items'
  }

  //Turn off App V1 deprecation warnings
  //TODO - move to V2
  static _warnedAppV1 = true

  //Add BRPID buttons to sheet
  _getHeaderButtons() {
    const headerButtons = super._getHeaderButtons()
    addBRPIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['brp', 'sheet', 'item'],
      template: 'systems/sla-industries-brp/templates/item/psychic.html',
      width: 520,
      height: 570,
      scrollY: ['.tab.description'],
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'details' }]
    })
  }

  async getData() {
    const sheetData = super.getData()
    const itemData = sheetData.item
    sheetData.hasOwner = this.item.isEmbedded === true
    sheetData.pcOwner = false
    if (sheetData.hasOwner) {
      if (this.item.parent.type === 'character') {
        sheetData.pcOwner = true
      }
    }
    sheetData.isGM = game.user.isGM
    sheetData.powerName = game.settings.get('sla-industries-brp', this.item.type + 'Label')
    if (sheetData.powerName === "") {
      sheetData.powerName = game.i18n.localize("BRP." + this.item.type)
    }
    //Get drop down options from select-lists.mjs
    sheetData.catOptions = await BRPSelectLists.getSpellCatOptions();
    sheetData.skillCatOptions = await BRPSelectLists.getCategoryOptions();
    sheetData.catName = game.i18n.localize("BRP." + this.item.system.impact);
    sheetData.skillCatName = "";
    const categoryRef = String(this.item.system?.category ?? "").trim();
    if (categoryRef && categoryRef !== "none") {
      // Some legacy/custom psychic items store plain text instead of BRPID.
      if (/^i\.[a-z0-9_.-]+$/i.test(categoryRef)) {
        try {
          const skillCat = (await game.system.api.brpid.fromBRPIDBest({ brpid: categoryRef }))[0];
          sheetData.skillCatName = String(skillCat?.name ?? "");
        } catch (err) {
          console.warn("sla-industries-brp | Psychic sheet category BRPID resolution failed", {
            item: this.item?.name,
            categoryRef,
            err
          });
          sheetData.skillCatName = categoryRef;
        }
      } else {
        sheetData.skillCatName = categoryRef;
      }
    }
    const abilityMeta = SLAEbbSystem.getAbilityMeta(this.item);
    const linkedSkill = sheetData.hasOwner ? SLAEbbSystem.resolveDisciplineSkill(this.item.parent, this.item, abilityMeta) : null;
    sheetData.ebbFormulationSkill = String(linkedSkill?.name ?? abilityMeta?.skillRef ?? SLAEbbSystem.DEFAULT_CORE_SKILL);
    itemData.system.total =
      Number(itemData.system.base ?? 0) +
      Number(itemData.system.xp ?? 0) +
      Number(itemData.system.effects ?? 0) +
      Number(itemData.system.personality ?? 0) +
      Number(itemData.system.profession ?? 0) +
      Number(itemData.system.personal ?? 0) +
      Number(itemData.system.culture ?? 0);

    sheetData.enrichedDescriptionValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      sheetData.data.system.description,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    sheetData.enrichedGMDescriptionValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      sheetData.data.system.gmDescription,
      {
        async: true,
        secrets: sheetData.editable
      }
    )

    return sheetData
  }

  //Activate event listeners using the prepared sheet HTML
  activateListeners(html) {
    super.activateListeners(html)
    if (!this.options.editable) return
    html.find('.item-toggle').click(this.onItemToggle.bind(this));
  }

  //Handle toggle states
  async onItemToggle(event) {
    event.preventDefault();
    const prop = event.currentTarget.closest('.item-toggle').dataset.property;
    let checkProp = {};
    if (['improve'].includes(prop)) {
      checkProp = { [`system.${prop}`]: !this.object.system[prop] }
    } else { return }

    const item = await this.object.update(checkProp);
    return item;
  }


  _updateObject(event, formData) {
    super._updateObject(event, formData)
  }

}
