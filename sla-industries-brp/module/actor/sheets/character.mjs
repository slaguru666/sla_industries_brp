import { BRPContextMenu } from '../../setup/context-menu.mjs';
import * as contextMenu from "../actor-cm.mjs";
import { BRPactorItemDrop } from '../actor-itemDrop.mjs';
import { BRPDamage } from '../../combat/damage.mjs';
import { BRPUtilities } from '../../apps/utilities.mjs';
import { BRPRollType } from '../../apps/rollType.mjs';
import { addBRPIDSheetHeaderButton } from '../../brpid/brpid-button.mjs'
import { BRPSelectLists } from '../../apps/select-lists.mjs';
import { BRPActiveEffectSheet } from '../../sheets/brp-active-effect-sheet.mjs';
import { isCtrlKey } from '../../apps/helper.mjs';
import { SLAAmmoTracker } from '../../apps/sla-ammo-tracker.mjs';
import { SLAAmmoCatalog } from '../../apps/sla-ammo-catalog.mjs';
import { SLADrugSystem } from '../../apps/sla-drug-system.mjs';
import { SLAEbbSystem } from '../../apps/sla-ebb-system.mjs';
import { SLAMentalSystem } from '../../apps/sla-mental-system.mjs';
import { SLASeedImporter } from '../../apps/sla-seed-importer.mjs';
import { SLASkillPoints } from '../../apps/sla-skill-points.mjs';
import { SLAEscalationInitiative } from '../../combat/sla-escalation-initiative.mjs';
import { SLATraitDefinitions } from '../../traits/trait-definitions.mjs';
import { SLATraitEngine } from '../../traits/trait-engine.mjs';
import { SLATraitValidator } from '../../traits/trait-validator.mjs';

export class BRPCharacterSheet extends foundry.appv1.sheets.ActorSheet {

  //Turn off App V1 deprecation warnings
  //TODO - move to V2
  static _warnedAppV1 = true

  //Add BRPID buttons to sheet
  _getHeaderButtons() {
    const headerButtons = super._getHeaderButtons()
    addBRPIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  /** @override */
  static get defaultOptions() {


    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["brp", "sheet", "actor", "character"],
      template: "systems/sla-industries-brp/templates/actor/character-sheet.html",
      width: 865,
      height: 850,
      scrollY: ['.bottom-panel'],
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  static confirmItemDelete(actor, itemId) {
    let item = actor.items.get(itemId);
    item.delete();
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);

    context.system = actorData.system;
    context.flags = actorData.flags;
    context.logo = game.settings.get('sla-industries-brp', 'charSheetLogo');
    context.useWealth = game.settings.get('sla-industries-brp', 'useWealth');
    context.wealthLabel = game.settings.get('sla-industries-brp', 'wealthLabel');
    context.useEDU = game.settings.get('sla-industries-brp', 'useEDU');
    context.useFP = false;
    context.useSAN = game.settings.get('sla-industries-brp', 'useSAN');
    context.useRES5 = game.settings.get('sla-industries-brp', 'useRes5');
    context.useHPL = game.settings.get('sla-industries-brp', 'useHPL');
    context.useAlleg = game.settings.get('sla-industries-brp', 'useAlleg');
    context.usePassion = game.settings.get('sla-industries-brp', 'usePassion');
    context.usePersTrait = game.settings.get('sla-industries-brp', 'usePersTrait');
    context.useReputation = game.settings.get('sla-industries-brp', 'useReputation');
    context.wealthName = actorData.system.wealth
    context.wealthOptions = await BRPSelectLists.getWealthOptions(0, 4)
    if (actorData.system.wealth >= 0 && actorData.system.wealth <= 4 && actorData.system.wealth != "") {
      context.wealthName = game.i18n.localize('BRP.wealthLevel.' + actorData.system.wealth)
    }
    context.magicLabel = game.settings.get('sla-industries-brp', 'magicLabel') ?? game.i18n.localize('BRP.magic')
    context.mutationLabel = game.settings.get('sla-industries-brp', 'mutationLabel') ?? game.i18n.localize('BRP.mutation')
    context.psychicLabel = game.settings.get('sla-industries-brp', 'psychicLabel') ?? game.i18n.localize('BRP.psychic')
    context.sorceryLabel = game.settings.get('sla-industries-brp', 'sorceryLabel') ?? game.i18n.localize('BRP.sorcery')
    context.superLabel = game.settings.get('sla-industries-brp', 'superLabel') ?? game.i18n.localize('BRP.super')
    context.slaEbbEligible = SLAEbbSystem.isEbbSpecies(this.actor)
    context.slaSanityInfo = await SLAMentalSystem.getSanityThresholdInfo(this.actor)
    context.skillPools = SLASkillPoints.buildPoolState(this.actor)
    context.creationMode = Boolean(this.actor.system?.creationMode ?? true)
    const stats = actorData.system?.stats ?? {}
    const hasRolledBaseStats = Object.values(stats).some((stat) => Number(stat?.base ?? 0) > 0)
    const rolledOnce = Boolean(this.actor.getFlag('sla-industries-brp', 'characteristicsRolled'))
    context.canRollStats = !actorData.system.lock && !(rolledOnce || hasRolledBaseStats)
    context.isLocked = actorData.system.lock
    context.statLocked = true
    if (!actorData.system.lock && game.settings.get('sla-industries-brp', 'development')) { context.statLocked = false }
    context.useSocialTab = false;
    context.usePersTab = false;
    context.useTraitsTab = true;
    if (context.useAlleg || (context.useReputation > 0)) { context.useSocialTab = true }
    if (context.usePersTrait || context.usePassion) { context.usePersTab = true }
    context.useAVRand = game.settings.get('sla-industries-brp', 'useAVRand');
    context.background1 = game.settings.get('sla-industries-brp', 'background1');
    context.background2 = game.settings.get('sla-industries-brp', 'background2');
    context.background3 = game.settings.get('sla-industries-brp', 'background3');
    let resource = 2;
    if (game.settings.get('sla-industries-brp', 'useSAN')) { resource++ };
    if (game.settings.get('sla-industries-brp', 'useRes5')) { resource++ };
    context.resource = resource;
    context.magicLabel = game.i18n.localize('BRP.magic')
    if (game.settings.get('sla-industries-brp', 'magicLabel') != "") { context.magicLabel = game.settings.get('sla-industries-brp', 'magicLabel') }
    context.superLabel = game.i18n.localize('BRP.superAbbr')
    if (game.settings.get('sla-industries-brp', 'superLabel') != "") { context.superLabel = game.settings.get('sla-industries-brp', 'superLabel') }
    context.psychicLabel = game.i18n.localize('BRP.psychic')
    if (game.settings.get('sla-industries-brp', 'psychicLabel') != "") { context.psychicLabel = game.settings.get('sla-industries-brp', 'psychicLabel') }
    context.mutationLabel = game.i18n.localize('BRP.mutation')
    if (game.settings.get('sla-industries-brp', 'mutationLabel') != "") { context.mutationLabel = game.settings.get('sla-industries-brp', 'mutationLabel') }
    context.sorceryLabel = game.i18n.localize('BRP.sorcery')
    if (game.settings.get('sla-industries-brp', 'sorceryLabel') != "") { context.sorceryLabel = game.settings.get('sla-industries-brp', 'sorceryLabel') }

    //Set Culture, Personality & Profession labels
    context.culture = "";
    let tempCult = (await context.items.filter(itm => itm.type === 'culture'))[0]
    if (tempCult) {
      context.culture = tempCult.name
      context.cultureId = tempCult._id
      context.cultureUsed = true
    } else {
      context.culture = actorData.system.culture
      context.cultureUsed = false
    }

    context.personality = "";
    let tempPers = (await context.items.filter(itm => itm.type === 'personality'))[0]
    if (tempPers) {
      context.personality = tempPers.name
      context.personalityId = tempPers._id
      context.personalityUsed = true
    } else {
      context.personality = actorData.system.personalityName
      context.personalityUsed = false
    }

    context.profession = "";
    let tempProf = (await context.items.filter(itm => itm.type === 'profession'))[0]
    if (tempProf) {
      context.profession = tempProf.name
      context.professionId = tempProf._id
      context.professionUsed = true
    } else {
      context.profession = actorData.system.professionName
      context.professionUsed = false
    }

    // Prepare character data and items.
    this._prepareItems(context);
    await this._prepareTraitData(context);
    await this._prepareDrugData(context);
    this._applyDrugDisplayModifiers(context);
    await this._applyTraitDisplayModifiers(context);
    this._prepareCharacterData(context);


    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    context.enrichedBiographyValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      context.system.biography,
      {
        async: true,
        secrets: context.editable
      }
    )

    context.enrichedBackgroundValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      context.system.background,
      {
        async: true,
        context: context.editable
      }
    )

    context.enrichedBackstoryValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      context.system.backstory,
      {
        async: true,
        context: context.editable
      }
    )

    //Get a List of Active Effects for the Actor
    context.effects = await BRPActiveEffectSheet.getActorEffectsFromSheet(context)

    return context;
  }

  //
  _prepareCharacterData(context) {
  }

  async _prepareTraitData(context) {
    const sourceTraits = Array.isArray(context.persTraits) ? context.persTraits : [];
    const traitRows = sourceTraits.map((trait) => {
      const key = SLATraitDefinitions.toKey(trait.name ?? "");
      const def = SLATraitDefinitions.getByKey(key);
      const rank = Math.max(1, Number(trait?.system?.base ?? 1));
      const maxRank = Math.max(1, Number(def?.maxRank ?? rank));
      const type = String(def?.type ?? trait?.flags?.[game.system.id]?.slaTrait?.type ?? trait?.flags?.brp?.slaTrait?.type ?? "neutral");
      const status = SLATraitEngine.automationStatus(key);
      const effectSummary = SLATraitEngine.automationSummary(key, rank);
      return {
        ...trait,
        slaTrait: {
          key,
          rank,
          maxRank,
          type,
          status,
          effectSummary
        }
      };
    });

    traitRows.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
    context.persTraitsEnhanced = traitRows;
    context.traitCount = traitRows.length;

    const validation = await SLATraitValidator.validateActor(this.actor, { includeRollPreview: true });
    context.traitValidation = validation;
    const preview = await SLATraitEngine.getCheckContext(this.actor, {
      rollType: "SK",
      cardType: "NO",
      label: "Bureaucracy",
      reason: "sheet-preview"
    }, { preview: true });
    context.traitPreview = preview;
  }

  _isSLARestrictedType(type = "") {
    return SLASeedImporter.SLA_RESTRICTED_TYPES?.has(String(type ?? "")) ?? false;
  }

  _isSLAItemRecord(itemData) {
    try {
      return SLASeedImporter.isSLAItem(itemData, { restrictedOnly: true });
    } catch (err) {
      console.warn("sla-industries-brp | Unable to evaluate SLA item record", err);
      return true;
    }
  }

  _isAllowedDropItem(itemData) {
    const type = String(itemData?.type ?? "");
    if (!this._isSLARestrictedType(type)) return true;
    return this._isSLAItemRecord(itemData);
  }

  _isRangedWeapon(weapon) {
    const weaponType = String(weapon?.system?.weaponType ?? "").toLowerCase()
    if (['firearm', 'energy', 'artillery', 'heavy', 'missile', 'explosive'].includes(weaponType)) return true
    const weaponName = String(weapon?.name ?? "").toLowerCase()
    if (weaponName.includes("grenade")) return true
    return Number(weapon?.system?.ammo ?? 0) > 0
  }

  _getHiddenSkillCategoryConfig() {
    return {
      manipulation: !Boolean(game.settings.get('sla-industries-brp', 'showManipulationSkills')),
      social: !Boolean(game.settings.get('sla-industries-brp', 'showSocialSkills')),
      supernatural: !Boolean(game.settings.get('sla-industries-brp', 'showSupernaturalSkills'))
    }
  }

  _isSkillCategoryHidden(categoryBrpid = "", categoryName = "", hiddenConfig = null) {
    const hidden = hiddenConfig ?? this._getHiddenSkillCategoryConfig()
    const token = `${String(categoryBrpid ?? "")} ${String(categoryName ?? "")}`.toLowerCase()
    if (hidden.manipulation && token.includes("manipulation")) return true
    if (hidden.social && token.includes("social")) return true
    if (hidden.supernatural && token.includes("supernatural")) return true
    return false
  }

  //
  _prepareItems(context) {
    // Initialize containers.
    const gears = [];
    const drugs = [];
    const skills = [];
    const skillsDev = [];
    const skillsAlpha = [];
    const hitlocs = [];
    const magics = [];
    const mutations = [];
    const psychics = [];
    const sorceries = [];
    const superpowers = [];
    const failings = [];
    const armours = [];
    const weapons = [];
    const rangedWeapons = [];
    const meleeWeapons = [];
    const wounds = [];
    const allegiances = [];
    const passions = [];
    const persTraits = [];
    const reputations = [];

    // Iterate through items, allocating to containers
    let spentProfessional = 0
    let spentGeneral = 0
    let spentXP = 0
    const creationSkillCap = SLASkillPoints.getCreationCapForActor(this.actor)
    const hiddenSkillCategoryConfig = this._getHiddenSkillCategoryConfig()

    const skillCategoryNameByBrpid = new Map()
    for (const item of context.items) {
      if (item.type !== "skillcat") continue
      const categoryBrpid = item.flags?.[game.system.id]?.brpidFlag?.id ?? item.flags?.brp?.brpidFlag?.id ?? ""
      if (categoryBrpid) {
        skillCategoryNameByBrpid.set(String(categoryBrpid), String(item.name ?? ""))
      }
    }

    // Sort items by type and then name - saves sorting all containers by name separately and makes sure skills are processed before weapons
    context.items.sort(function (a, b) {
      let x = a.name;
      let y = b.name;
      let r = a.type;
      let s = b.type;
      if (r < s) { return -1 };
      if (s < r) { return 1 };
      if (x < y) { return -1 };
      if (x > y) { return 1 };
      return 0;
    });

    // Add items to containers.
    for (let itm of context.items) {
      itm.img = itm.img || DEFAULT_TOKEN;
      if (this._isSLARestrictedType(itm.type) && !this._isSLAItemRecord(itm)) {
        continue;
      }

      if (itm.type === 'gear') {
        itm.system.equippedName = game.i18n.localize('BRP.' + itm.system.equipStatus)
        const quantity = Math.max(0, Number(itm.system.quantity ?? 0));
        const ammoMeta = SLAAmmoCatalog.getAmmoMetaFromItem(itm);
        const drugMeta = SLADrugSystem.getDrugMetaFromItem(itm);
        if (ammoMeta) {
          itm.system.isAmmoGear = true;
          itm.system.ammoCalibre = ammoMeta.calibreLabel;
          itm.system.crdEach = Math.max(0, Number(ammoMeta.costPerRound ?? itm.system.crdEach ?? 0));
        } else {
          itm.system.isAmmoGear = false;
          itm.system.crdEach = Math.max(0, Number(itm.system.crdEach ?? 0));
        }
        itm.system.isDrugGear = Boolean(drugMeta);
        itm.system.drugId = String(drugMeta?.id ?? "");
        itm.system.drugName = String(drugMeta?.name ?? "");
        itm.system.crdTotal = Math.round((itm.system.crdEach * quantity) * 100) / 100;
        itm.system.crdDisplay = itm.system.crdEach > 0 ? `${itm.system.crdEach} / ${itm.system.crdTotal}` : "";
        if (itm.system.isDrugGear) {
          drugs.push(itm);
        } else {
          gears.push(itm);
        }
      } else if (itm.type === 'skill') {
        const skillCategoryId = String(itm.system.category ?? "")
        const skillCategoryName = skillCategoryNameByBrpid.get(skillCategoryId) ?? ""
        if (this._isSkillCategoryHidden(skillCategoryId, skillCategoryName, hiddenSkillCategoryConfig)) {
          continue
        }
        skillsDev.push(itm)
        const rawGrandTotal = Number(itm.system.total ?? 0) + Number(this.actor.system.skillcategory[itm.system.category] ?? 0)
        itm.system.grandTotal = this.actor.system?.creationMode ? Math.min(creationSkillCap, rawGrandTotal) : rawGrandTotal
        let tempName = itm.name.toLowerCase()
        if (itm.system.specialism) {
          tempName = itm.system.specName.toLowerCase()
        }
        itm.system.orderName = tempName
        skillsAlpha.push(itm);
        skills.push(itm);
        spentProfessional += Number(itm.system.profession ?? 0)
        spentGeneral += Number(itm.system.personal ?? 0)
        spentXP += Number(itm.system.xp ?? 0)
      } else if (itm.type === 'hit-location') {
        hitlocs.push(itm);
        if (context.useHPL) {
          itm.system.list = 0
          itm.system.count = 0
          itm.system.hitlocID = itm._id
          armours.push(itm)
        }
      } else if (itm.type === 'wound') {
        wounds.push(itm);
      } else if (itm.type === 'magic') {
        itm.system.grandTotal = itm.system.total + (this.actor.system.skillcategory[itm.system.category] ?? 0)
        magics.push(itm);
      } else if (itm.type === 'mutation') {
        mutations.push(itm);
      } else if (itm.type === 'psychic') {
        const ownCatBonus = Number(this.actor.system.skillcategory[itm.system.category] ?? 0);
        itm.system.grandTotal = Number(itm.system.total ?? 0) + ownCatBonus;
        itm.system.ebbCost = SLAEbbSystem.getAbilityCost(itm);
        itm.system.isEbbAbility = SLAEbbSystem.isEbbAbility(itm);
        itm.system.ebbSkillId = "";
        itm.system.ebbSkillName = "";
        itm.system.ebbGrandTotal = itm.system.grandTotal;
        const meta = SLAEbbSystem.getAbilityMeta(itm);
        itm.system.ebbFormulationSkill = String(meta?.skillRef ?? SLAEbbSystem.DEFAULT_CORE_SKILL);
        const linkedSkill = SLAEbbSystem.resolveDisciplineSkill(this.actor, itm, meta);
        if (linkedSkill) {
          const linkedBonus = Number(this.actor.system.skillcategory[linkedSkill.system.category] ?? 0);
          const linkedTotal = Number(linkedSkill.system.total ?? 0) + linkedBonus;
          itm.system.ebbSkillId = linkedSkill.id;
          itm.system.ebbSkillName = linkedSkill.name;
          itm.system.ebbGrandTotal = linkedTotal;
          itm.system.ebbFormulationSkill = linkedSkill.name;
          // In SLA mode, the EBB discipline % should track the linked EBB skill score.
          itm.system.grandTotal = linkedTotal;
        }
        psychics.push(itm);
      } else if (itm.type === 'sorcery') {
        itm.system.ppCost = itm.system.currLvl * itm.system.pppl
        if (itm.system.mem) {
          itm.system.ppCost = itm.system.memLvl * itm.system.pppl
        }
        sorceries.push(itm);
      } else if (itm.type === 'super') {
        superpowers.push(itm);
      } else if (itm.type === 'failing') {
        failings.push(itm);
      } else if (itm.type === 'armour') {
        itm.system.hide = false
        if (itm.system.hitlocID) {
          let hitLocTemp = this.actor.items.get(itm.system.hitlocID)
          if (hitLocTemp) {
            itm.system.hitlocName = hitLocTemp.system.displayName
            itm.system.lowRoll = hitLocTemp.system.lowRoll
            if (context.useHPL) {
              itm.system.hide = hitLocTemp.system.hide
            }
          }
        }
        itm.system.equippedName = game.i18n.localize('BRP.' + itm.system.equipStatus)
        itm.system.list = 1
        armours.push(itm);
      } else if (itm.type === 'weapon') {
        itm.system.ammoLoadedType = String(itm.system.ammoLoadedType ?? itm.system.ammoTag ?? "STD").toUpperCase()
        SLAAmmoTracker.applyDisplayReserves(this.actor, itm);
        if (itm.system.range3 != "") {
          itm.system.rangeName = itm.system.range1 + "/" + itm.system.range2 + "/" + itm.system.range3
        } else if (itm.system.range2 != "") {
          itm.system.rangeName = itm.system.range1 + "/" + itm.system.range2
        } else {
          itm.system.rangeName = itm.system.range1
        }

        if (itm.system.specialDmg) {
          itm.system.dmgName = game.i18n.localize('BRP.special')
        } else if (itm.system.dmg3 != "") {
          itm.system.dmgName = itm.system.dmg1 + "/" + itm.system.dmg2 + "/" + itm.system.dmg3
        } else if (itm.system.dmg2 != "") {
          itm.system.dmgName = itm.system.dmg1 + "/" + itm.system.dmg2
        } else {
          itm.system.dmgName = itm.system.dmg1
        }

        let skill1Select = "";
        let skill2Select = "";
        skill1Select = skills.filter((nitm) =>
          (nitm.flags?.[game.system.id]?.brpidFlag?.id ?? nitm.flags?.brp?.brpidFlag?.id) === itm.system.skill1
        )[0]
        skill2Select = skills.filter((nitm) =>
          (nitm.flags?.[game.system.id]?.brpidFlag?.id ?? nitm.flags?.brp?.brpidFlag?.id) === itm.system.skill2
        )[0]
        if (skill1Select && skill2Select) {
          if (itm.system.skill2 === 'none') {
            if (skill1Select) {
              itm.system.sourceID = skill1Select._id
            }
          } else {
            if (skill2Select.system.total >= skill1Select.system.total) {
              itm.system.sourceID = skill2Select._id
            } else {
              itm.system.sourceID = skill1Select._id
            }
          }
        } else if (skill1Select) {
          itm.system.sourceID = skill1Select._id
        } else if (skill2Select) {
          itm.system.sourceID = skill2Select._id
        }


        if (itm.system.sourceID) {
          const sourceSkill = this.actor.items.get(itm.system.sourceID)
          const rawSkillScore = Number(sourceSkill?.system?.total ?? 0) + Number(this.actor.system.skillcategory[sourceSkill?.system?.category] ?? 0)
          itm.system.skillScore = this.actor.system?.creationMode ? Math.min(creationSkillCap, rawSkillScore) : rawSkillScore
          itm.system.skillName = this.actor.items.get(itm.system.sourceID).name
        } else {
          itm.system.skillScore = 0
          itm.system.skillName = game.i18n.localize('BRP.noWpnSkill')
        }
        itm.system.equippedName = game.i18n.localize('BRP.' + itm.system.equipStatus)
        itm.system.isRanged = this._isRangedWeapon(itm)
        weapons.push(itm)
        if (itm.system.isRanged) {
          rangedWeapons.push(itm)
        } else {
          meleeWeapons.push(itm)
        }
      } else if (itm.type === 'allegiance') {
        if (itm.system.allegApoth) {
          itm.system.rank = game.i18n.localize('BRP.allegApoth')
        } else if (itm.system.allegAllied) {
          itm.system.rank = game.i18n.localize('BRP.allegAllied')
        }
        allegiances.push(itm);
      } else if (itm.type === 'passion') {
        passions.push(itm);
      } else if (itm.type === 'persTrait') {
        persTraits.push(itm);
      } else if (itm.type === 'reputation') {
        reputations.push(itm);
      } else if (itm.type === 'skillcat') {
        const categoryBrpid = itm.flags?.[game.system.id]?.brpidFlag?.id ?? itm.flags?.brp?.brpidFlag?.id ?? "none";
        if (this._isSkillCategoryHidden(categoryBrpid, itm.name, hiddenSkillCategoryConfig)) {
          continue
        }
        skills.push({
          name: itm.name, isType: true, count: skills.filter(itm => itm.isType).length,
          flags: { [game.system.id]: { brpidFlag: { id: categoryBrpid } } },
          system: { category: categoryBrpid, total: itm.system.total },
          _id: itm._id
        });
        skillsAlpha.push({
          name: itm.name, isType: true, count: skillsAlpha.filter(itm => itm.isType).length,
          flags: { [game.system.id]: { brpidFlag: { id: categoryBrpid } } },
          system: { category: categoryBrpid, total: itm.system.total },
          _id: itm._id
        });
      }
    }

    //Sort Skills by Category then Skill Name
    skills.sort(function (a, b) {
      let x = a.name.toLowerCase();
      let y = b.name.toLowerCase();
      let r = a.isType ? a.isType : false;
      let s = b.isType ? b.isType : false;
      let p = a.system.category;
      let q = b.system.category;
      if (p < q) { return -1 };
      if (p > q) { return 1 };
      if (r < s) { return 1 };
      if (s < r) { return -1 };
      if (x < y) { return -1 };
      if (x > y) { return 1 };
      return 0;
    });


    let previousSpec = "";
    for (let skill of skills) {
      skill.isSpecialisation = false
      if (skill.system.specialism && (previousSpec != skill.system.mainName)) {
        previousSpec = skill.system.mainName;
        skill.isSpecialisation = true;
      }
    }

    skillsAlpha.sort(function (a, b) {
      let x = a.system.orderName;
      let y = b.system.orderName;
      let r = a.isType ? a.isType : false;
      let s = b.isType ? b.isType : false;
      let p = a.system.category;
      let q = b.system.category;
      if (p < q) { return -1 };
      if (p > q) { return 1 };
      if (r < s) { return 1 };
      if (s < r) { return -1 };
      if (x < y) { return -1 };
      if (x > y) { return 1 };
      return 0;
    });

    let alphaPreviousSpec = "";
    for (let alphaskill of skillsAlpha) {
      alphaskill.isAlphaSpecialisation = false
      if (!alphaskill.system.specialism) {
        alphaPreviousSpec = ""
      }
      if (alphaskill.system.specialism && (alphaPreviousSpec != alphaskill.system.mainName)) {
        alphaPreviousSpec = alphaskill.system.mainName;
        alphaskill.isAlphaSpecialisation = true;
      }
    }

    //Sort Armours by HitLocation and List score
    armours.sort(function (a, b) {
      let x = a.system.lowRoll;
      let y = b.system.lowRoll;
      let p = a.system.list;
      let q = b.system.list;
      if (x < y) { return 1 };
      if (x > y) { return -1 };
      if (p < q) { return -1 };
      if (p > q) { return 1 };
      return 0;
    });

    // Sort Hit Locations
    hitlocs.sort(function (a, b) {
      let x = a.system.lowRoll;
      let y = b.system.lowRoll;
      if (x < y) { return 1 };
      if (x > y) { return -1 };
      return 0;
    });

    //If using HPL add number of items of armour per Hit Loc
    if (context.useHPL) {
      let locID = ""
      let newArmours = []
      for (let itm of armours) {
        if (itm.system.list === 0) {
          let armList = armours.filter(arm => arm.system.list === 1 && arm.system.hitlocID === itm._id)
          itm.system.length = armList.length
        } else {
          if (itm.system.hitlocID != locID) {
            itm.system.show = true
            locID = itm.system.hitlocID
          } else {
            itm.system.show = false
          }
        }
        newArmours.push(itm)
      }
      context.armours = newArmours;
    } else {
      context.armours = armours;
    }

    // Assign and return
    context.persTraits = persTraits;
    context.gears = gears;
    context.drugs = drugs;
    context.skills = skills;
    context.skillsDev = skillsDev;
    context.skillsAlpha = skillsAlpha;
    context.hitlocs = hitlocs;
    context.magics = magics;
    context.mutations = mutations;
    context.psychics = psychics;
    context.sorceries = sorceries;
    context.superpowers = superpowers;
    context.failings = failings;
    context.weapons = weapons;
    context.rangedWeapons = rangedWeapons;
    context.meleeWeapons = meleeWeapons;
    context.wounds = wounds;
    context.allegiances = allegiances;
    context.passions = passions;
    context.reputations = reputations;
    this.actor.system.totalProf = Number(context.skillPools?.professional?.spent ?? spentProfessional)
    this.actor.system.totalPers = Number(context.skillPools?.general?.spent ?? spentGeneral)
    this.actor.system.totalXP = Number(spentXP)

    return context
  }

  async _prepareDrugData(context) {
    context.drugAlerts = [];
    context.slaDrugModifierSnapshot = null;
    if (!this.actor || this.actor.type !== "character") return context;

    // Avoid mutating actor flags while the sheet is rendering.
    const overview = await SLADrugSystem.getActorOverview(this.actor, { resolveExpiry: false });
    context.drugAlerts = overview.alerts ?? [];
    context.slaDrugModifierSnapshot = await SLADrugSystem.getModifierSnapshot(this.actor, { resolveExpiry: false });

    for (const item of context.drugs ?? []) {
      const row = overview.itemStates?.[item._id] ?? null;
      const quantity = Math.max(0, Number(item.system?.quantity ?? 0));
      item.system.drugId = row?.drugId ?? "";
      item.system.drugState = row?.status ?? "inactive";
      item.system.drugStateLabel = row?.statusLabel ?? game.i18n.localize("BRP.drugReady");
      item.system.drugDuration = row?.duration ?? "";
      item.system.drugSummary = row?.summary ?? "";
      item.system.drugCanUse = Boolean(row?.canUse ?? true) && quantity > 0;
      item.system.drugCanClose = Boolean(row?.canClose ?? false);
    }

    const ebbOverview = await SLAEbbSystem.getActorOverview(this.actor, { resolveExpiry: false });
    for (const entry of ebbOverview.active ?? []) {
      context.drugAlerts.push({
        itemId: "",
        drugId: `ebb-${entry.id}`,
        name: `EBB: ${entry.name}`,
        state: "active",
        stateLabel: "Active",
        duration: entry.remaining ?? "",
        summary: entry.summary ?? "",
        canClose: false
      });
    }

    return context;
  }

  _classifySkillForDrugMod(skill) {
    const categoryKey = String(skill?.system?.category ?? "");
    const category = this.actor.items.find((i) =>
      i.type === "skillcat"
      && ((i.flags?.[game.system.id]?.brpidFlag?.id ?? i.flags?.brp?.brpidFlag?.id) === categoryKey)
    );
    const categoryName = String(category?.name ?? categoryKey).toLowerCase();
    const name = String(skill?.name ?? "").toLowerCase();
    const scan = `${name} ${categoryName} ${categoryKey}`.toLowerCase();

    const isCombat = /combat|weapon|firearm|rifle|pistol|smg|shotgun|heavy/.test(scan);
    const isMelee = /melee|brawl|axe|club|sword|knife|claw/.test(scan);
    const isPhysical = isCombat || /physical|dodge|climb|jump|swim|stealth|athlet/.test(scan);
    const isCommunication = /communication|persuade|command|telegen|perform|fasttalk/.test(scan);
    const isPerception = /perception|insight|listen|spot|research|awareness/.test(scan);
    const isInsight = /insight/.test(scan);
    return { isCombat, isMelee, isPhysical, isCommunication, isPerception, isInsight };
  }

  _applyDrugDisplayModifiers(context) {
    const snap = context.slaDrugModifierSnapshot ?? null;
    const creationSkillCap = SLASkillPoints.getCreationCapForActor(this.actor);
    if (!snap) {
      for (const [, stat] of Object.entries(context.system?.stats ?? {})) {
        stat.displayTotal = stat.total;
      }
      return;
    }

    // Characteristics shown in the top-right block
    const statKeys = ["str", "con", "siz", "int", "pow", "dex", "cha"];
    for (const key of statKeys) {
      const stat = context.system?.stats?.[key];
      if (!stat) continue;
      const delta = Number(snap.statMods?.[key] ?? 0);
      stat.drugDelta = delta;
      stat.displayTotal = Number(stat.total ?? 0) + delta;
    }

    // Skills shown in both skill tabs and used by combat skill percentages.
    const skillModById = new Map();
    const applySkillDisplay = (skill) => {
      if (!skill || skill.isType) return;
      const tags = this._classifySkillForDrugMod(skill);
      let mod = 0;
      mod += Number(snap.skillMods?.allSkills ?? 0);
      if (tags.isCombat) mod += Number(snap.skillMods?.combat ?? 0);
      if (tags.isPhysical) mod += Number(snap.skillMods?.physical ?? 0);
      if (tags.isCommunication) mod += Number(snap.skillMods?.communication ?? 0);
      if (tags.isPerception) mod += Number(snap.skillMods?.perception ?? 0);
      if (tags.isInsight) mod += Number(snap.skillMods?.insight ?? 0);
      if (tags.isMelee) mod += Number(snap.skillMods?.melee ?? 0);
      skill.system.drugMod = mod;
      const rawDisplay = Number(skill.system.grandTotal ?? 0) + mod;
      skill.system.grandTotalDisplay = this.actor.system?.creationMode
        ? Math.min(creationSkillCap, rawDisplay)
        : rawDisplay;
      skillModById.set(String(skill._id), mod);
    };

    for (const skill of (context.skills ?? [])) applySkillDisplay(skill);
    for (const skill of (context.skillsDev ?? [])) applySkillDisplay(skill);
    for (const skill of (context.skillsAlpha ?? [])) applySkillDisplay(skill);

    for (const weapon of (context.weapons ?? [])) {
      const sourceId = String(weapon.system?.sourceID ?? "");
      const sourceMod = Number(skillModById.get(sourceId) ?? 0);
      const rawDisplay = Number(weapon.system.skillScore ?? 0) + sourceMod;
      weapon.system.skillScoreDisplay = this.actor.system?.creationMode
        ? Math.min(creationSkillCap, rawDisplay)
        : rawDisplay;
    }
  }

  async _applyTraitDisplayModifiers(context) {
    if (!this.actor || this.actor.type !== "character") return;

    const seen = new Set();
    const collections = [context.skillsDev ?? [], context.skillsAlpha ?? [], context.skills ?? []];

    for (const list of collections) {
      for (const skill of list) {
        if (!skill || skill.isType) continue;
        const skillId = String(skill._id ?? "");
        if (!skillId || seen.has(skillId)) continue;
        seen.add(skillId);

        const preview = await SLATraitEngine.getCheckContext(this.actor, {
          rollType: "SK",
          cardType: "NO",
          skillId,
          label: String(skill.name ?? ""),
          reason: "sheet-preview"
        }, { preview: true });

        const traitMod = Number(preview?.flatMod ?? 0);
        const baseDisplay = Number(skill.system.grandTotalDisplay ?? skill.system.grandTotal ?? 0);
        skill.system.traitMod = traitMod;
        skill.system.traitEffects = Array.isArray(preview?.effects) ? preview.effects : [];
        skill.system.grandTotalDisplay = baseDisplay + traitMod;
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).closest(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    if (!this.isEditable) return;

    html.find(".inline-edit").change(this._onSkillEdit.bind(this));                           //Inline Skill Edit
    html.find(".actor-toggle").click(this._onActorToggle.bind(this));                         // Actor Toggle
    html.find(".item-toggle").click(this._onItemToggle.bind(this));                           // Item Toggle
    html.find(".armour-toggle").click(this._onArmourToggle.bind(this));                       // Armour Toggle
    html.find('.item-create').click(this._onItemCreate.bind(this));                           // Add Inventory Item
    html.find('.rollable.charac-name').click(BRPRollType._onStatRoll.bind(this));             // Rollable Characteristic
    html.find('.rollable.skill-name').click(BRPRollType._onSkillRoll.bind(this));             // Rollable Skill
    html.find('.rollable.ebb-roll').click(this._onEbbSkillRoll.bind(this));                   // Rollable EBB Skill
    html.find('.rollable.allegiance-name').click(BRPRollType._onAllegianceRoll.bind(this));   // Rollable Allegiance
    html.find('.rollable.passion-name').click(BRPRollType._onPassionRoll.bind(this));         // Rollable Passion
    html.find('.rollable.persTrait-name').click(BRPRollType._onPersTraitRoll.bind(this));     // Rollable Personality Trait
    html.find('.addDamage').click(this._addDamage.bind(this));                                // Add Damage
    html.find('.healWound').click(this._healWound.bind(this));                                // Heal Wound
    html.find('.rollable.damage-name').click(BRPRollType._onDamageRoll.bind(this));           // Damage Roll
    html.find('.rollable.weapon-name').click(BRPRollType._onWeaponRoll.bind(this));           // Weapon Skill Roll
    html.find('.ammo-action').click(this._onAmmoAction.bind(this));                           // Ammo controls
    html.find('.drug-action').click(this._onDrugAction.bind(this));                           // Drug controls
    html.find('.ebb-action').click(this._onEbbAction.bind(this));                             // EBB controls
    html.find('.mental-action').click(this._onMentalAction.bind(this));                       // SAN/COOL controls
    html.find('.initiative-action').click(this._onInitiativeAction.bind(this));               // Initiative quick roll controls
    html.find('.trait-state-edit').click(this._onTraitStateEdit.bind(this));                  // Trait condition state editor
    html.find('.trait-validate').click(this._onTraitValidate.bind(this));                     // Trait validation refresh
    html.find('.rollable.attribute').click(this._onAttribute.bind(this));                     // Attribute modifier
    html.find('.rollable.ap-name').click(BRPRollType._onArmour.bind(this));                   // Armour roll
    html.find('.rollable.reputation-name').click(BRPRollType._onReputationRoll.bind(this));   // Rollable Reputation
    html.find('.rollStats').click(this._onRollStats.bind(this));                              // Roll Character Stats
    html.find('.stat-arrow').click(this._onRedisttibuteStats.bind(this));                     // Redistriibute Character Stats
    html.find('.rollable.impact').click(BRPRollType._onImpactRoll.bind(this));                // Magic Spell Impact Roll

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).closest(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Drag events.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    //Context Menus

    new BRPContextMenu(
      html,
      ".stat-name.contextmenu",
      contextMenu.characteristicMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".profession.contextmenu",
      contextMenu.professionMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".personality.contextmenu",
      contextMenu.personalityMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".culture.contextmenu",
      contextMenu.cultureMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".skills-tab.contextmenu",
      contextMenu.skillstabMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".combat-tab.contextmenu",
      contextMenu.combatMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".skill-name.contextmenu",
      contextMenu.skillMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".skill-cell-name.contextmenu",
      contextMenu.skillMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".category-name.contextmenu",
      contextMenu.skillCategoryMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".hitloc-name.contextmenu",
      contextMenu.hitLocMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".power-name.contextmenu",
      contextMenu.powerMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".magic-name.contextmenu",
      contextMenu.magicMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".mutation-name.contextmenu",
      contextMenu.mutationMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".psychic-name.contextmenu",
      contextMenu.psychicMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".super-name.contextmenu",
      contextMenu.superMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".failing-name.contextmenu",
      contextMenu.failingMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".armour-name.contextmenu",
      contextMenu.armourMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".gear-name.contextmenu",
      contextMenu.gearMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".weapon-name.contextmenu",
      contextMenu.weaponMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".wound-name.contextmenu",
      contextMenu.woundMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".power.contextmenu",
      contextMenu.powerAttMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".allegiance-name.contextmenu",
      contextMenu.allegianceMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".passion-name.contextmenu",
      contextMenu.passionMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".persTrait-name.contextmenu",
      contextMenu.persTraitMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
    new BRPContextMenu(
      html,
      ".reputation-name.contextmenu",
      contextMenu.reputationMenuOptions(this.actor, this.token),
    {
      parentClassHooks: false,
      fixed: true,
    });
  }

  async _onTraitStateEdit(event) {
    event.preventDefault();
    if (!game.user?.isGM) {
      ui.notifications.warn("Only a GM can edit trait runtime conditions.");
      return;
    }
    await game.brp?.SLATraitUI?.openStateEditor?.(this.actor);
    this.render(false);
  }

  async _onTraitValidate(event) {
    event.preventDefault();
    const report = await SLATraitValidator.validateActor(this.actor, { includeRollPreview: true });
    if (!report?.ok) {
      const msg = report.errors?.length ? report.errors.join(" | ") : "Trait validation reported issues.";
      ui.notifications.warn(msg);
    } else {
      const balance = Number(report?.rankBalance?.net ?? 0);
      const summary = report.rollPreview
        ? `Trait validation OK. Balance ${balance >= 0 ? "+" : ""}${balance}; preview mod ${Number(report.rollPreview.traitFlatMod ?? 0)}%.`
        : "Trait validation OK.";
      ui.notifications.info(summary);
    }
    this.render(false);
  }

  // Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };

    if (type === 'wound') {
      let locId = header.dataset.itemId;
      itemData.name = game.i18n.localize('BRP.wound')
      itemData.system.locId = locId;
      itemData.system.value = 1
    }

    if (type === 'armour') {
      itemData.system.hitlocID = (await this.actor.items.filter(itm => itm.type === 'hit-location'))[0]._id
    }
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Create the item!
    const newItem = await Item.create(itemData, { parent: this.actor });
    let key = await game.system.api.brpid.guessId(newItem)
    if (this._isSLARestrictedType(newItem.type) && !SLASeedImporter.isSLABrpid(key)) {
      const slug = BRPUtilities.toKebabCase(newItem.name || `custom-${newItem.type}`);
      key = `i.${newItem.type}.sla-${slug}`;
    }
    await newItem.update({
      [`flags.${game.system.id}.brpidFlag.id`]: key,
      [`flags.${game.system.id}.brpidFlag.lang`]: game.i18n.lang,
      [`flags.${game.system.id}.brpidFlag.priority`]: 0,
      'flags.brp.brpidFlag.id': key,
      'flags.brp.brpidFlag.lang': game.i18n.lang,
      'flags.brp.brpidFlag.priority': 0
    })

    //And in certain circumstances render the new item sheet
    if (['gear', 'armour', 'weapon','sorcery','magic'].includes(itemData.type)) {
      newItem.sheet.render(true);
    }

  }

  // Handle clickable rolls.
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  // Update skills etc without opening the item sheet
  async _onSkillEdit(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const li = $(event.currentTarget).closest(".item");
    const item = this.actor.items.get(li.data("itemId"));
    const field = element.dataset.field;
    let newScore = Number(element.value);
    if (item?.type === "skill" && ["profession", "personal"].includes(String(field ?? "").toLowerCase())) {
      const result = await SLASkillPoints.allocateSkillPoints({
        actor: this.actor,
        skill: item,
        field,
        value: newScore
      });
      if (!result?.ok) {
        ui.notifications.warn(result?.error ?? "Unable to allocate skill points.");
      }
      this.actor.render(false);
      return;
    }

    const target = 'system.' + field;
    await item.update({ [target]: newScore });
    if (item?.type === "skill" && this.actor.system?.creationMode) {
      await SLASkillPoints.syncActorSkillPools(this.actor, { clamp: true });
    }
    this.actor.render(false);
    return;
  }

  //Toggle Actor
  async _onActorToggle(event) {
    const prop = event.currentTarget.dataset.property;
    let checkProp = {};

    if (prop === "lock") {
      const nextLock = !this.actor.system[prop]
      checkProp = { [`system.${prop}`]: nextLock }
      await this.actor.update(checkProp);
      if (nextLock) {
        await SLASkillPoints.finalizeCreation(this.actor);
      } else {
        await SLASkillPoints.initializeForActor({
          actor: this.actor,
          trainingPackage: null,
          resetAllocations: false,
          creationMode: true
        });
      }
      return
    } else if (prop === 'improve') {
      checkProp = { 'system.stats.pow.improve': !this.actor.system.stats.pow.improve }
    } else if (prop === 'minorWnd') {
      checkProp = {
        'system.minorWnd': !this.actor.system.minorWnd,
        'system.health.daily': 0
      }
    } else if (prop === 'majorWnd') {
      checkProp = {
        'system.majorWnd': !this.actor.system.majorWnd,
        'system.health.daily': 0
      }
    } else { return }

    await this.actor.update(checkProp);
    return
  }

  //Item Toggle
  async _onItemToggle(event) {
    const element = event.currentTarget;
    const li = $(event.currentTarget).closest(".item");
    const item = this.actor.items.get(li.data("itemId"));
    const prop = element.dataset.property;
    let checkProp = {};
    if (['hide', 'improve', 'oppimprove', 'mem', 'injured', 'bleeding', 'incapacitated', 'severed', 'dead', 'unconscious'].includes(prop)) {
      checkProp = { [`system.${prop}`]: !item.system[prop] }
    } else if (prop === 'equipStatus') {
      if (item.system.equipStatus === 'carried' && item.type === 'armour') {
        checkProp = { 'system.equipStatus': "worn" }
      } else if (item.system.equipStatus === 'carried' && item.type != 'armour') {
        checkProp = { 'system.equipStatus': "packed" }
      } else if (item.system.equipStatus === 'worn') {
        checkProp = { 'system.equipStatus': "packed" }
      } else if (item.system.equipStatus === 'packed') {
        checkProp = { 'system.equipStatus': "stored" }
      } else if (item.system.equipStatus === 'stored') {
        checkProp = { 'system.equipStatus': "carried" }
      }
    } else { return }

    await item.update(checkProp);
    this.actor.render(false);
    return;
  }

  async _onAmmoAction(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const itemId = element.dataset.itemId;
    const action = element.dataset.ammoAction;
    if (!itemId || !action) return;

    await SLAAmmoTracker.handleSheetAction({
      actor: this.actor,
      itemId,
      action
    });
    this.actor.render(false);
  }

  async _onDrugAction(event) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget;
    const itemId = String(element.dataset.itemId ?? "");
    const drugId = String(element.dataset.drugId ?? "");
    const action = String(element.dataset.drugAction ?? "").toLowerCase();
    if (!action || (!itemId && !drugId)) return;

    const item = itemId ? this.actor.items.get(itemId) : null;
    const drugRef = drugId || item?.name || "";
    if (!drugRef) return;

    let result = null;
    if (action === "use") {
      result = await SLADrugSystem.useDrug({
        actor: this.actor,
        itemId,
        drug: drugRef
      });
    } else if (action === "close") {
      result = await SLADrugSystem.closeDrug({
        actor: this.actor,
        itemId,
        drug: drugRef
      });
      if (!result?.ok || result?.skipped) {
        await SLADrugSystem.clearDrug({
          actor: this.actor,
          drug: drugRef
        });
        result = { ok: true, stage: "cleared-fallback" };
      }
    }

    this.actor.render(false);
  }

  async _onEbbAction(event) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget;
    const itemId = String(element.dataset.itemId ?? "");
    const action = String(element.dataset.ebbAction ?? "").toLowerCase();
    if (!itemId || !action) return;

    if (action === "use") {
      await SLAEbbSystem.useAbility({
        actor: this.actor,
        ability: itemId,
        spend: true,
        shiftKey: event.shiftKey
      });
    } else if (action === "recover") {
      await SLAEbbSystem.recover({
        actor: this.actor,
        amount: 1
      });
    }

    this.actor.render(false);
  }

  async _onMentalAction(event) {
    event.preventDefault();
    event.stopPropagation();
    const action = String(event.currentTarget?.dataset?.mentalAction ?? "").toLowerCase();
    if (!action) return;

    if (action === "san-check") {
      await SLAMentalSystem.promptSanityCheck({ actor: this.actor });
    } else if (action === "cool-check") {
      await SLAMentalSystem.promptCoolCheck({ actor: this.actor, reason: "Immediate threat response" });
    } else if (action === "clear-stress") {
      await SLAMentalSystem.clearStress(this.actor);
    }

    this.actor.render(false);
  }

  async _onInitiativeAction(event) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget;
    const approach = String(element?.dataset?.initApproach ?? "dex").toLowerCase();
    let risk = String(element?.dataset?.initRisk ?? "false").toLowerCase() === "true";
    if (event.shiftKey) risk = true;

    const result = await SLAEscalationInitiative.rollActorQuick({
      actor: this.actor,
      token: this.token,
      approach,
      risk
    });
    if (!result?.ok) return;

    this.actor.render(false);
  }

  async _onEbbSkillRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const itemId = String(element.dataset.itemId ?? element.closest(".item")?.dataset.itemId ?? "");
    const linkedSkillId = String(element.dataset.skillId ?? "");
    const rollSkillId = linkedSkillId || itemId;
    if (!rollSkillId) return;

    const ctrlKey = isCtrlKey(event ?? false);
    let cardType = "NO";
    if (ctrlKey) cardType = "OP";
    if (event.altKey) cardType = "GR";

    if (game.settings.get('sla-industries-brp', 'switchShift')) {
      event.shiftKey = !event.shiftKey;
    }

    game.system.api.check._trigger({
      rollType: "SK",
      cardType,
      skillId: rollSkillId,
      shiftKey: event.shiftKey,
      actor: this.actor,
      token: this.token
    });
  }

  //Dropping an actor on an actor
  async _onDropActor(event, data) {
    super._onDropActor(event, data)
  }

  // Change default on Drop Item Create routine for requirements (single items and folder drop)-----------------------------------------------------------------
  async _onDropItemCreate(itemData) {
    const newItemData = await BRPactorItemDrop._BRPonDropItemCreate(this.actor, itemData);
    const source = Array.isArray(newItemData) ? newItemData : [newItemData];
    const allowed = [];
    const blocked = [];
    for (const entry of source) {
      if (this._isAllowedDropItem(entry)) {
        allowed.push(entry);
      } else {
        blocked.push(`${entry?.type ?? "item"}: ${entry?.name ?? "Unknown"}`);
      }
    }

    if (blocked.length) {
      ui.notifications.warn(`SLA-only mode blocked non-SLA content: ${blocked.join(", ")}`);
    }
    if (!allowed.length) return [];
    return this.actor.createEmbeddedDocuments("Item", allowed);
  }

  //Add Damage
  async _addDamage(event) {
    await BRPDamage.addDamage(event, this.actor, this.token, 0)
  }

  //Heal a Wound
  async _healWound(event) {
    await BRPDamage.treatWound(event, this.actor)
  }

  //Start Attribute modify
  async _onAttribute(event) {
    let att = event.currentTarget.closest('.attribute').dataset.att
    let adj = event.currentTarget.closest('.attribute').dataset.adj
    let checkprop = ""
    let newVal = this.actor.system[att].value
    let newMax = this.actor.system[att].max
    if (adj === 'spend') {
      checkprop = { [`system.${att}.value`]: newVal - 1 }
    } else if (adj === 'recover' && newVal < newMax) {
      checkprop = { [`system.${att}.value`]: newVal + 1 }
    } else { return }

    this.actor.update(checkprop)
  }

  //Static Collapse/Expand Armour on all Hit Locs
  async _onArmourToggle(event) {

    if (!game.settings.get('sla-industries-brp', 'useHPL')) { return }
    let expand = event.shiftKey
    let changes = []

    let hitLocs = this.actor.items.filter(itm => itm.type === "hit-location").map(itm => {
      return { id: itm.id }
    })

    for (let hitLoc of hitLocs) {
      changes.push({
        _id: hitLoc.id,
        'system.hide': expand
      })
    }

    await Item.updateDocuments(changes, { parent: this.actor })

    return
  }


  //Roll Character Stats
  async _onRollStats(event) {
    if (this.actor.system.lock) {
      ui.notifications.warn("Unlock the character sheet before rolling characteristics.");
      return;
    }
    let results = []
    for (let [key, stat] of Object.entries(this.actor.system.stats)) {
      let checkProp = ""
      if (stat.formula === "") { continue }
      if (key === 'edu' && !game.settings.get('sla-industries-brp', 'useEDU')) { continue }
      let roll = new Roll(stat.formula)
      await roll.evaluate()
      let newVal = Math.round(Number(roll.total))
      checkProp = { [`system.stats.${key}.base`]: newVal }
      let diceRolled = ""
      for (let diceRoll of roll.dice) {
        for (let diceResult of diceRoll.results) {
          if (diceRolled === "") {
            diceRolled = diceResult.result
          } else {
            diceRolled = diceRolled + "," + diceResult.result
          }
        }
      }
      results.push({ label: stat.labelShort, result: newVal, formula: roll.formula, diceRolled: diceRolled })
      await this.actor.update(checkProp)
      if (game.modules.get('dice-so-nice')?.active) {
        game.dice3d.showForRoll(roll, game.user, true, null, false)  //Roll,user,sync,whispher,blind
      }
    }
    if (results.length > 0) {
      await this.actor.setFlag('sla-industries-brp', 'characteristicsRolled', true)
    }
    let messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor.name }),
      actrImage: this.actor.img,
      results: results
    }
    const messageTemplate = 'systems/sla-industries-brp/templates/chat/rollStats.html'
    let html = await foundry.applications.handlebars.renderTemplate(messageTemplate, messageData);

    let chatData = {};
    let chatType = ""
    if (!foundry.utils.isNewerVersion(game.version, '11')) {
      chatType = CONST.CHAT_MESSAGE_STYLES.OTHER
    } else {
      chatType = CONST.CHAT_MESSAGE_OTHER
    }
    chatData = {
      user: game.user.id,
      type: chatType,
      content: html,
      speaker: {
        actor: this.actor._id,
        alias: this.actor.name,
      },
    }
    let msg = await ChatMessage.create(chatData);
    return
  }

  //Toggle Skill Order
  static async skillOrder(tempActor) {
    await tempActor.update({ 'system.skillOrder': !tempActor.system.skillOrder })
  }

  //Redistribute Characteristics
  async _onRedisttibuteStats(event) {
    let key = event.currentTarget.dataset.stat
    let change = event.currentTarget.dataset.type
    let checkProp = ""
    if (change === 'decrease') {
      //If at maximum redistribute points
      if (this.actor.system.redistDec <= -3 && this.actor.system.stats[key].redist <= 0) { return }
      //Don't go below min stat values
      if ((this.actor.system.stats[key].base + this.actor.system.stats[key].redist) === 3) { return }
      if (['int', 'siz'].includes(key) && ((this.actor.system.stats[key].base + this.actor.system.stats[key].redist) === 8)) { return }
      checkProp = { [`system.stats.${key}.redist`]: this.actor.system.stats[key].redist - 1 }
    }

    if (change === 'increase') {
      //If at maximum redistribute points
      if (this.actor.system.redistInc >= 3 && this.actor.system.stats[key].redist >= 0) { return }
      //Don't exceed 21 stat value
      if ((this.actor.system.stats[key].base + this.actor.system.stats[key].redist) === 21) { return }
      checkProp = { [`system.stats.${key}.redist`]: this.actor.system.stats[key].redist + 1 }
    }
    await this.actor.update(checkProp)
  }

  //Implement Game Settings for Colours
  static renderSheet(sheet, html) {
    if (game.settings.get('sla-industries-brp', 'actorFontColour')) {
      sheet.element.css(
        '--actor-font-colour',
        game.settings.get('sla-industries-brp', 'actorFontColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorTitleColour')) {
      sheet.element.css(
        '--actor-title-colour',
        game.settings.get('sla-industries-brp', 'actorTitleColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'secBackColour')) {
      sheet.element.css(
        '--labelback',
        game.settings.get('sla-industries-brp', 'secBackColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorBackColour')) {
      sheet.element.css(
        '--actor-sheet-back',
        game.settings.get('sla-industries-brp', 'actorBackColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorTabNameColour')) {
      sheet.element.css(
        '--actor-tab-name-colour',
        game.settings.get('sla-industries-brp', 'actorTabNameColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorTabNameActiveColour')) {
      sheet.element.css(
        '--actor-tab-active-colour',
        game.settings.get('sla-industries-brp', 'actorTabNameActiveColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorTabNameHoverColour')) {
      sheet.element.css(
        '--actor-tab-name-hover-colour',
        game.settings.get('sla-industries-brp', 'actorTabNameHoverColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorTabNameShadowColour')) {
      sheet.element.css(
        '--actor-tab-name-hover-shadow',
        game.settings.get('sla-industries-brp', 'actorTabNameShadowColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorTabActiveShadowColour')) {
      sheet.element.css(
        '--actor-tab-name-active-shadow',
        game.settings.get('sla-industries-brp', 'actorTabActiveShadowColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorRollableColour')) {
      sheet.element.css(
        '--actor-rollable-colour',
        game.settings.get('sla-industries-brp', 'actorRollableColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorRollableShadowColour')) {
      sheet.element.css(
        '--actor-rollable-shadow',
        game.settings.get('sla-industries-brp', 'actorRollableShadowColour')
      )
    }
    if (game.settings.get('sla-industries-brp', 'actorSheetBackground')) {
      let imagePath = "url(/" + game.settings.get('sla-industries-brp', 'actorSheetBackground') + ")"
      sheet.element.css(
        '--actor-back-img',
        imagePath
      )
    }
    if (game.settings.get('sla-industries-brp', 'charSheetMainFont')) {
      let fontSource = "url(/" + game.settings.get('sla-industries-brp', 'charSheetMainFont') + ")"
      const customSheetFont = new FontFace(
        'customSheetFont',
        fontSource
      )
      customSheetFont
        .load()
        .then(function (loadedFace) {
          document.fonts.add(loadedFace)
        })
        .catch(function (error) {
          ui.notifications.error(error)
        })
      sheet.element.css(
        '--actor-main-font',
        'customSheetFont'
      )
    }
    if (game.settings.get('sla-industries-brp', 'charSheetTitleFont')) {
      let fontSource = "url(/" + game.settings.get('sla-industries-brp', 'charSheetTitleFont') + ")"
      const customSheetSecondaryFont = new FontFace(
        'customSheetSecondaryFont',
        fontSource
      )
      customSheetSecondaryFont
        .load()
        .then(function (loadedFace) {
          document.fonts.add(loadedFace)
        })
        .catch(function (error) {
          ui.notifications.error(error)
        })
      sheet.element.css(
        '--actor-title-font',
        'customSheetSecondaryFont'
      )
    }
    if (game.settings.get('sla-industries-brp', 'charSheetMainFontSize')) {
      let fontSize = game.settings.get('sla-industries-brp', 'charSheetMainFontSize') + "px"
      sheet.element.css(
        '--actor-main-font-size',
        fontSize
      )
    }
    if (game.settings.get('sla-industries-brp', 'charSheetTitleFontSize')) {
      let fontSize = game.settings.get('sla-industries-brp', 'charSheetTitleFontSize') + "px"
      sheet.element.css(
        '--actor-title-font-size',
        fontSize
      )
    }
  }

}
