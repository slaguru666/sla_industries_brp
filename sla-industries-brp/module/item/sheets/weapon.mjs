import { BRPActiveEffectSheet } from "../../sheets/brp-active-effect-sheet.mjs";
import { BRPSelectLists } from "../../apps/select-lists.mjs";
import { addBRPIDSheetHeaderButton } from '../../brpid/brpid-button.mjs'
import { SLAAmmoCatalog } from "../../apps/sla-ammo-catalog.mjs";
import { SLAAmmoTracker } from "../../apps/sla-ammo-tracker.mjs";

export class BRPWeaponSheet extends foundry.appv1.sheets.ItemSheet {
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
      template: 'systems/sla-industries-brp/templates/item/weapon.html',
      width: 600,
      height: 640,
      scrollY: ['.tab.description'],
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'details' }]
    })
  }

  async getData() {
    const sheetData = super.getData();
    const itemData = sheetData.item;
    sheetData.hasOwner = this.item.isEmbedded === true;
    sheetData.npcOwner = false
    if (sheetData.hasOwner) {
      if (this.item.parent.type === 'npc') {
        sheetData.npcOwner = true
      }
    }
    //const actor = this.item.parent;
    let skillSelect = "";
    sheetData.isGM = game.user.isGM;
    //Get drop down options from select-lists.mjs
    sheetData.weaponOptions = await BRPSelectLists.getWpnCategoryOptions();
    sheetData.priceOptions = await BRPSelectLists.getPriceOptions();
    sheetData.damOptions = await BRPSelectLists.getDamBonusOptions();
    sheetData.specialOptions = await BRPSelectLists.getSpecialOptions();
    sheetData.handedOptions = await BRPSelectLists.getHandedOptions();
    sheetData.equippedOptions = await BRPSelectLists.getEquippedOptions(this.item.type);
    sheetData.wpnSkillOptions1 = await BRPSelectLists.getWeaponSkillOptions("1");
    sheetData.wpnSkillOptions2 = await BRPSelectLists.getWeaponSkillOptions(this.item.system.skill1);
    sheetData.weaponCatName = game.i18n.localize("BRP." + this.item.system.weaponType);
    sheetData.priceName = game.i18n.localize("BRP." + this.item.system.price);
    sheetData.damName = game.i18n.localize("BRP." + this.item.system.db);
    sheetData.handedName = game.i18n.localize("BRP." + this.item.system.hands);
    sheetData.specName = game.i18n.localize("BRP." + this.item.system.special);
    sheetData.equippedName = game.i18n.localize("BRP." + this.item.system.equipStatus);
    sheetData.ammoTagOptions = {
      STD: "STD",
      AP: "AP",
      HE: "HE",
      HEAP: "HEAP"
    };
    sheetData.ammoCalibreOptions = SLAAmmoCatalog.BASE_CALIBRES.map((calibre) => calibre.label);
    const resolvedCalibre =
      SLAAmmoCatalog.resolveCalibre(sheetData.item.system.ammoCalibre ?? "") ??
      SLAAmmoCatalog.resolveCalibre(sheetData.item.system.ammoType ?? "") ??
      SLAAmmoCatalog.deriveWeaponCalibre(this.item);
    if (resolvedCalibre) {
      if (!String(sheetData.item.system.ammoCalibre ?? "").trim()) {
        sheetData.item.system.ammoCalibre = resolvedCalibre.label;
      }
      if (Number(sheetData.item.system.ammoBaseCost ?? 0) <= 0) {
        sheetData.item.system.ammoBaseCost = Number(resolvedCalibre.cost ?? 0);
      }
    }
    sheetData.ammoRoundCost = SLAAmmoCatalog.getCostPerRound(
      sheetData.item.system.ammoCalibre ?? resolvedCalibre?.label ?? "",
      sheetData.item.system.ammoLoadedType ?? "STD"
    );
    sheetData.item.system.ammoAllowStd = typeof sheetData.item.system.ammoAllowStd === "boolean" ? sheetData.item.system.ammoAllowStd : true;
    sheetData.item.system.ammoAllowAp = typeof sheetData.item.system.ammoAllowAp === "boolean" ? sheetData.item.system.ammoAllowAp : true;
    sheetData.item.system.ammoAllowHe = typeof sheetData.item.system.ammoAllowHe === "boolean" ? sheetData.item.system.ammoAllowHe : true;
    sheetData.item.system.ammoAllowHeap = typeof sheetData.item.system.ammoAllowHeap === "boolean" ? sheetData.item.system.ammoAllowHeap : true;
    const normalizedLoadedType = SLAAmmoCatalog.normalizeTag(sheetData.item.system.ammoLoadedType ?? "STD");
    sheetData.item.system.ammoLoadedType = SLAAmmoCatalog.getWeaponAllowedTags(sheetData.item).includes(normalizedLoadedType)
      ? normalizedLoadedType
      : "STD";
    sheetData.allowedAmmoTags = SLAAmmoCatalog.getWeaponAllowedTags(sheetData.item).join("/");
    sheetData.isAmmo = false;
    if (this.item.system.weaponType === 'firearm' || this.item.system.weaponType === 'energy' || this.item.system.weaponType === 'artillery' || this.item.system.weaponType === 'missile' || this.item.system.weaponType === 'heavy' || Number(this.item.system.ammo ?? 0) > 0) {
      sheetData.isAmmo = true;
    }
    if (sheetData.isAmmo && this.item.parent?.documentName === "Actor") {
      SLAAmmoTracker.applyDisplayReserves(this.item.parent, sheetData.item);
    }

    if (this.item.system.skill1 === 'none') {
      sheetData.skill1Name = game.i18n.localize("BRP.none")
    } else {
      skillSelect = (await game.system.api.brpid.fromBRPIDBest({ brpid: this.item.system.skill1 }))[0]
      sheetData.skill1Name = skillSelect ? skillSelect.name : "";
    }

    if (this.item.system.skill2 === 'none') {
      sheetData.skill2Name = game.i18n.localize("BRP.none")
    } else {
      skillSelect = (await game.system.api.brpid.fromBRPIDBest({ brpid: this.item.system.skill2 }))[0]
      sheetData.skill2Name = skillSelect ? skillSelect.name : "";
    }

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

    sheetData.effects = BRPActiveEffectSheet.getItemEffectsFromSheet(sheetData)
    const changesActiveEffects = BRPActiveEffectSheet.getEffectChangesFromSheet(this.document)
    sheetData.effectKeys = changesActiveEffects.effectKeys
    sheetData.effectChanges = changesActiveEffects.effectChanges

    return sheetData
  }

  /* -------------------------------------------- */

  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners(html) {
    super.activateListeners(html)
    html.find('.item-toggle').click(this.onItemToggle.bind(this));
    BRPActiveEffectSheet.activateListeners(this, html)
  }

  //Handle toggle states
  async onItemToggle(event) {
    event.preventDefault();
    const prop = event.currentTarget.closest('.item-toggle').dataset.property;
    let checkProp = {};
    if (prop === 'parry' || prop === 'burst' || prop === 'stun' || prop === 'choke' || prop === 'entangle' || prop === 'fire' || prop === 'pierce' || prop === 'sonic' || prop === 'poison' || prop === 'explosive' || prop === 'emp') {
      checkProp = { [`system.${prop}`]: !this.object.system[prop] }
    } else { return }

    const item = await this.object.update(checkProp);
    return item;
  }

  _updateObject(event, formData) {
    const rawCalibre = String(formData["system.ammoCalibre"] ?? this.item.system?.ammoCalibre ?? "").trim();
    const resolvedCalibre =
      SLAAmmoCatalog.resolveCalibre(rawCalibre) ??
      SLAAmmoCatalog.resolveCalibre(this.item.system?.ammoType ?? "") ??
      SLAAmmoCatalog.deriveWeaponCalibre(this.item);
    if (resolvedCalibre) {
      formData["system.ammoCalibre"] = resolvedCalibre.label;
      const baseCost = Number(formData["system.ammoBaseCost"] ?? this.item.system?.ammoBaseCost ?? 0);
      if (!Number.isFinite(baseCost) || baseCost <= 0) {
        formData["system.ammoBaseCost"] = Number(resolvedCalibre.cost ?? 0);
      }
    }
    const allowStd = formData["system.ammoAllowStd"] === true || formData["system.ammoAllowStd"] === "true";
    const allowAp = formData["system.ammoAllowAp"] === true || formData["system.ammoAllowAp"] === "true";
    const allowHe = formData["system.ammoAllowHe"] === true || formData["system.ammoAllowHe"] === "true";
    const allowHeap = formData["system.ammoAllowHeap"] === true || formData["system.ammoAllowHeap"] === "true";
    formData["system.ammoAllowStd"] = allowStd;
    formData["system.ammoAllowAp"] = allowAp;
    formData["system.ammoAllowHe"] = allowHe;
    formData["system.ammoAllowHeap"] = allowHeap;
    if (!allowStd && !allowAp && !allowHe && !allowHeap) {
      formData["system.ammoAllowStd"] = true;
    }

    const allowedTags = [];
    if (formData["system.ammoAllowStd"]) allowedTags.push("STD");
    if (formData["system.ammoAllowAp"]) allowedTags.push("AP");
    if (formData["system.ammoAllowHe"]) allowedTags.push("HE");
    if (formData["system.ammoAllowHeap"]) allowedTags.push("HEAP");
    const normalizedLoadedType = SLAAmmoCatalog.normalizeTag(formData["system.ammoLoadedType"] ?? this.item.system?.ammoLoadedType ?? "STD");
    formData["system.ammoLoadedType"] = allowedTags.includes(normalizedLoadedType) ? normalizedLoadedType : (allowedTags[0] ?? "STD");
    super._updateObject(event, formData)
  }

}
