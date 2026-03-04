import { BRPUtilities } from "./utilities.mjs";
import { SLAAmmoCatalog } from "./sla-ammo-catalog.mjs";
import { SLADrugSystem } from "./sla-drug-system.mjs";

export class SLASeedImporter {
  static _skillNameCache = null;
  static _skillIconMapCache = null;
  static _weaponIconMapCache = null;
  static _armourIconMapCache = null;
  static _ebbIconMapCache = null;
  static _speciesIconMapCache = null;
  static _trainingIconMapCache = null;
  static SKILL_ICON_PATH = "systems/sla-industries-brp/assets/SLA_Assets/Skills";
  static WEAPON_ICON_PATH = "systems/sla-industries-brp/assets/SLA_Assets/Weapons";
  static ARMOUR_ICON_PATH = "systems/sla-industries-brp/assets/SLA_Assets/Armor";
  static EBB_ICON_PATH = "systems/sla-industries-brp/assets/SLA_Assets/Ebb";
  static SPECIES_ICON_PATH = "systems/sla-industries-brp/assets/SLA_Assets/Species";
  static TRAINING_ICON_PATH = "systems/sla-industries-brp/assets/SLA_Assets/Ebb/Training";
  static TRAIT_ICON_PATH = "systems/sla-industries-brp/assets/SLA_Assets/Traits";
  static AMMO_ICON_TAGS = new Set(["STD", "AP", "HE", "HEAP"]);
  static SLA2_TRAIT_ROWS = [
    { name: "Illness", rank: 3, traitType: "disadvantage", xpCost: -1 },
    { name: "Chicken", rank: 1, traitType: "disadvantage", xpCost: -3 },
    { name: "Phobia", rank: 3, traitType: "disadvantage", xpCost: -1 },
    { name: "Depression", rank: 3, traitType: "disadvantage", xpCost: -1 },
    { name: "Drug Addict", rank: 3, traitType: "disadvantage", xpCost: -1 },
    { name: "Exceedingly Cool", rank: 1, traitType: "advantage", xpCost: 2 },
    { name: "Pacifist", rank: 1, traitType: "disadvantage", xpCost: -3 },
    { name: "Enemy", rank: 4, traitType: "disadvantage", xpCost: -1 },
    { name: "Savings", rank: 3, traitType: "advantage", xpCost: 1 },
    { name: "Addiction/Compulsion", rank: 3, traitType: "disadvantage", xpCost: -1 },
    { name: "Unattractive", rank: 2, traitType: "disadvantage", xpCost: -1 },
    { name: "Natural Aptitude: Stat", rank: 1, traitType: "advantage", xpCost: 3 },
    { name: "Poor Hearing", rank: 2, traitType: "disadvantage", xpCost: -1 },
    { name: "Poor Vision", rank: 2, traitType: "disadvantage", xpCost: -1 },
    { name: "Ambidextrous", rank: 1, traitType: "advantage", xpCost: 2 },
    { name: "Contact", rank: 4, traitType: "advantage", xpCost: 1 },
    { name: "Anger", rank: 1, traitType: "disadvantage", xpCost: -2 },
    { name: "Good Hearing", rank: 2, traitType: "advantage", xpCost: 1 },
    { name: "Allergy", rank: 3, traitType: "disadvantage", xpCost: -1 },
    { name: "Debt", rank: 3, traitType: "disadvantage", xpCost: -1 },
    { name: "Poor Housing", rank: 2, traitType: "disadvantage", xpCost: -1 },
    { name: "Psychosis", rank: 3, traitType: "disadvantage", xpCost: -2 },
    { name: "Arrogant", rank: 1, traitType: "disadvantage", xpCost: -1 },
    { name: "Attractive", rank: 2, traitType: "advantage", xpCost: 1 },
    { name: "Sterile", rank: 1, traitType: "disadvantage", xpCost: -1 },
    { name: "Good Housing", rank: 2, traitType: "advantage", xpCost: 1 },
    { name: "Good Vision", rank: 2, traitType: "advantage", xpCost: 1 },
    { name: "Natural Aptitude: Skill", rank: 3, traitType: "advantage", xpCost: 1 },
    { name: "Anxiety", rank: 3, traitType: "disadvantage", xpCost: -1 }
  ];
  static SLA_RESTRICTED_TYPES = new Set([
    "skill",
    "weapon",
    "armour",
    "gear",
    "psychic",
    "profession",
    "culture"
  ]);
  static SLA_META_KEYS = [
    "slaSkill",
    "slaSpecies",
    "slaTraining",
    "slaEquipment",
    "slaArmour",
    "slaAmmo",
    "slaDrug",
    "slaEbb"
  ];

  static _getScopeData(documentLike, scope) {
    if (!documentLike) return {};
    return documentLike.flags?.[scope] ?? {};
  }

  static getDocumentBRPID(documentLike) {
    const fromSystem = this._getScopeData(documentLike, game.system.id)?.brpidFlag?.id;
    const fromLegacy = this._getScopeData(documentLike, "brp")?.brpidFlag?.id;
    return String(fromSystem ?? fromLegacy ?? "").trim();
  }

  static async browseData(path = "") {
    const pickerImpl = foundry?.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
    if (!pickerImpl?.browse) {
      throw new Error("FilePicker implementation not available");
    }
    const cleanPath = String(path ?? "").trim();
    const attempts = [];
    const pushAttempt = (value = "") => {
      const v = String(value ?? "").trim().replace(/^\/+/, "");
      if (!v || attempts.includes(v)) return;
      attempts.push(v);
    };
    pushAttempt(cleanPath);
    const marker = "/SLA_Assets/";
    const markerIndex = cleanPath.toLowerCase().indexOf(marker.toLowerCase());
    if (markerIndex >= 0) {
      const suffix = cleanPath.slice(markerIndex + 1);
      pushAttempt(`systems/sla-industries-brp/${suffix}`);
      pushAttempt(`modules/sla-industries-compendium/${suffix}`);
      pushAttempt(suffix);
    } else if (cleanPath.startsWith("assets/SLA_Assets/")) {
      pushAttempt(`systems/sla-industries-brp/${cleanPath}`);
      pushAttempt(`modules/sla-industries-compendium/${cleanPath}`);
    }
    let lastErr = null;
    for (const attempt of attempts) {
      try {
        return await pickerImpl.browse("data", attempt);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr ?? new Error(`Failed browsing data path: ${cleanPath}`);
  }

  static isSLABrpid(brpid = "") {
    return /\.sla-/.test(String(brpid ?? "").toLowerCase());
  }

  static hasSLAMetaFlag(documentLike) {
    const checkScope = (scope) => {
      const data = this._getScopeData(documentLike, scope);
      return this.SLA_META_KEYS.some((key) => data?.[key] !== undefined);
    };
    return checkScope(game.system.id) || checkScope("brp");
  }

  static isSLAItem(documentLike, { restrictedOnly = false } = {}) {
    if (!documentLike) return false;
    const type = String(documentLike.type ?? "");
    if (restrictedOnly && !this.SLA_RESTRICTED_TYPES.has(type)) return true;

    const brpid = this.getDocumentBRPID(documentLike);
    if (this.isSLABrpid(brpid)) return true;
    if (this.hasSLAMetaFlag(documentLike)) return true;

    // Gear can still be SLA if detected by ammo/drug metadata.
    if (type === "gear") {
      if (SLAAmmoCatalog.getAmmoMetaFromItem(documentLike)) return true;
      if (SLADrugSystem.getDrugMetaFromItem(documentLike)) return true;
      if (/^\s*ammo\s*:/i.test(String(documentLike.name ?? ""))) return true;
      if (/^\s*drug\s*:/i.test(String(documentLike.name ?? ""))) return true;
    }

    const folderName = String(documentLike.folder?.name ?? "");
    if (/^\s*SLA\b/i.test(folderName)) return true;

    return false;
  }

  static traitIconSlug(name = "") {
    return String(name ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  static getTraitIconPath(name = "") {
    const slug = this.traitIconSlug(name);
    if (!slug) return "icons/svg/regen.svg";
    return `${this.TRAIT_ICON_PATH}/${slug}.png`;
  }

  static async seedAmmoGear(options = {}) {
    const seeded = await SLAAmmoCatalog.seedWorldAmmoGear(options);
    const iconSync = await this.syncAmmoIcons({
      includeCompendium: false,
      includeActors: true,
      notify: false
    });
    return { ...seeded, iconSync };
  }

  static async seedDrugs(options = {}) {
    return SLADrugSystem.seedWorldDrugGear(options);
  }

  static async importAll({ overwrite = false } = {}) {
    const skills = await this.importSkills({ overwrite });
    const species = await this.importSpecies({ overwrite });
    const packages = await this.importTrainingPackages({ overwrite });
    const summary = { skills, species, packages };
    console.log("sla-industries-brp | Seed import summary", summary);
    ui.notifications.info(
      `SLA import complete: skills created ${skills.created}, updated ${skills.updated}; species created ${species.created}, updated ${species.updated}; packages created ${packages.created}, updated ${packages.updated}.`
    );
    return summary;
  }

  static async buildDraft2({ overwrite = false, syncCompendia = true } = {}) {
    const base = await this.importAll({ overwrite });
    const ebb = await this.importEbbAbilities({ overwrite });
    const equipment = await this.importEquipment({ overwrite });
    const drugs = await this.seedDrugs({ overwrite });
    const linked = await this.linkTrainingPackages({ overwrite: true });
    const synced = syncCompendia ? await this.syncAllToCompendia({ overwrite }) : { skipped: true };

    const summary = { base, ebb, equipment, drugs, linked, synced };
    console.log("sla-industries-brp | Draft2 build summary", summary);
    ui.notifications.info("SLA Draft2 build complete.");
    return summary;
  }

  static async enforceSLAOnlyContent({
    overwrite = true,
    syncCompendia = true,
    pruneCompendia = true,
    purgeWorld = true,
    purgeActors = true
  } = {}) {
    const seeded = await this.buildDraft2({ overwrite, syncCompendia: false });
    const ammo = await this.seedAmmoGear({ overwrite });
    const normalizedAmmo = await SLAAmmoCatalog.normalizeAllActorAmmoGear();
    const weaponAmmoProfiles = await SLAAmmoCatalog.backfillWeaponAmmoProfiles({ overwrite: true });
    const worldCleanup = purgeWorld ? await this.purgeNonSLAWorldItems({ dryRun: false }) : { skipped: true };
    const actorCleanup = purgeActors ? await this.purgeNonSLAActorItems({ dryRun: false }) : { skipped: true };
    const synced = syncCompendia
      ? await this.syncAllToCompendia({ overwrite: true, prune: pruneCompendia })
      : { skipped: true };
    const audit = await this.auditSLAConnections();

    const summary = {
      seeded,
      ammo,
      normalizedAmmo,
      weaponAmmoProfiles,
      worldCleanup,
      actorCleanup,
      synced,
      audit
    };
    console.log("sla-industries-brp | Enforced SLA-only content", summary);
    ui.notifications.info("SLA-only content mode enforced.");
    return summary;
  }

  static async runFullSLAInstaller({
    overwrite = true,
    pruneCompendia = true,
    notify = true
  } = {}) {
    if (!game.user?.isGM) {
      return { ok: false, reason: "not-gm" };
    }

    const seeded = await this.buildDraft2({ overwrite, syncCompendia: false });
    const traits = await this.ensureSLA2Traits({ overwrite, notify: false });
    const ammo = await this.seedAmmoGear({ overwrite });
    const drugs = await this.seedDrugs({ overwrite });
    const linked = await this.linkTrainingPackages({ overwrite: true });
    const generalEquipment = await game.brp?.SLABPNToolkit?.seedWorldGeneralEquipment?.({
      overwrite,
      notify: false
    });
    const synced = await this.syncAllToCompendia({ overwrite: true, prune: pruneCompendia });

    // Normalize old /assets/SLA_Assets paths before applying icon matching.
    const migrated = await this.migrateLegacySLAAssetPaths({
      includeActors: true,
      includeCompendium: true,
      notify: false
    });

    const icons = {
      skills: await this.syncSkillIcons({ includeCompendium: true, notify: false }),
      weapons: await this.syncWeaponIcons({ includeCompendium: true, includeActors: true, notify: false }),
      armour: await this.syncArmourIcons({ includeCompendium: true, includeActors: true, notify: false }),
      ebb: await this.syncEbbIcons({ includeCompendium: true, includeActors: true, notify: false }),
      species: await this.syncSpeciesIcons({ includeCompendium: true, includeActors: true, notify: false }),
      training: await this.syncTrainingPackageIcons({ includeCompendium: true, includeActors: true, notify: false }),
      ammo: await this.syncAmmoIcons({ includeCompendium: true, includeActors: true, notify: false }),
      drugs: await game.brp?.SLADrugSystem?.syncDrugIcons?.({
        includeActors: true,
        includeCompendium: true,
        notify: false
      }),
      traits: await this.syncTraitIcons({ includeCompendium: true, includeActors: true, notify: false }),
      gear: await game.brp?.SLABPNToolkit?.syncGeneralEquipmentIcons?.({
        includeActors: true,
        includeCompendium: true,
        folderName: "SLA General Equipment",
        notify: false
      })
    };

    const audit = await this.auditSLAConnections();
    const summary = {
      ok: true,
      seeded,
      traits,
      ammo,
      drugs,
      linked,
      generalEquipment: generalEquipment ?? { skipped: true },
      synced,
      migrated,
      icons,
      audit
    };

    if (notify) {
      const missing = Number(audit?.world?.missingSkills?.length ?? 0) +
        Number(audit?.world?.missingSpecies?.length ?? 0) +
        Number(audit?.world?.missingPackages?.length ?? 0) +
        Number(audit?.world?.missingWeapons?.length ?? 0) +
        Number(audit?.world?.missingArmour?.length ?? 0) +
        Number(audit?.world?.missingEbbAbilities?.length ?? 0) +
        Number(audit?.world?.missingDrugGear?.length ?? 0) +
        Number(audit?.world?.missingAmmoGear?.length ?? 0);
      if (missing > 0 || audit?.hasMissing) {
        ui.notifications.warn(`SLA Full Install finished with ${missing} remaining gap(s). Check console audit output.`);
      } else {
        ui.notifications.info("SLA Full Install complete: content + compendia + icons synchronized.");
      }
    }
    console.log("sla-industries-brp | SLA Full Install summary", summary);
    return summary;
  }

  static async purgeNonSLAWorldItems({
    types = Array.from(this.SLA_RESTRICTED_TYPES),
    dryRun = false
  } = {}) {
    const typeSet = new Set(types);
    const remove = game.items.filter((item) => typeSet.has(item.type) && !this.isSLAItem(item, { restrictedOnly: true }));
    const ids = remove.map((item) => item.id);
    if (ids.length && !dryRun) {
      await Item.deleteDocuments(ids);
    }
    return {
      dryRun,
      removed: ids.length,
      items: remove.map((item) => ({ type: item.type, name: item.name }))
    };
  }

  static async purgeNonSLAActorItems({
    types = Array.from(this.SLA_RESTRICTED_TYPES),
    dryRun = false
  } = {}) {
    const typeSet = new Set(types);
    const results = [];
    let removed = 0;

    for (const actor of game.actors ?? []) {
      const dropIds = actor.items
        .filter((item) => typeSet.has(item.type) && !this.isSLAItem(item, { restrictedOnly: true }))
        .map((item) => item.id);

      if (!dropIds.length) continue;
      if (!dryRun) {
        await actor.deleteEmbeddedDocuments("Item", dropIds);
      }
      removed += dropIds.length;
      results.push({
        actor: actor.name,
        removed: dropIds.length
      });
    }

    return { dryRun, removed, actors: results };
  }

  static async importSkills({ overwrite = false } = {}) {
    const data = await this.loadSeed("skills.json");
    const folder = await this.ensureFolder("SLA Skills", "#47657a");
    const existing = this.indexItemsByName(
      game.items.filter((i) => i.type === "skill" && i.folder?.id === folder.id)
    );

    let created = 0;
    let updated = 0;

    for (const skill of data.skills ?? []) {
      const slug = BRPUtilities.toKebabCase(skill.name);
      const brpid = `i.skill.sla-${slug}`;
      let category = await this.resolveSkillCategoryBrpid(skill.categoryRef ?? "Mental");
      if (!category || category === "none") {
        category = await this.resolveSkillCategoryBrpid("Mental");
      }
      if (!category || category === "none") {
        category = await this.resolveSkillCategoryBrpid("Combat");
      }

      const payload = {
        name: skill.name,
        type: "skill",
        folder: folder.id,
        system: {
          base: this.parseNumber(skill.base, 0),
          category: category || "none",
          noXP: Boolean(skill.noXP ?? false),
          specialism: Boolean(skill.specialism ?? false),
          variable: Boolean(skill.variable ?? false),
          combat: Boolean(skill.combat ?? false),
          description: this.notesToHtml(skill.notes ?? [])
        },
        flags: this.buildFlags(brpid, {
          [game.system.id]: {
            slaSkill: {
              source: "skills.json",
              categoryRef: String(skill.categoryRef ?? "")
            }
          },
          brp: {
            slaSkill: {
              source: "skills.json",
              categoryRef: String(skill.categoryRef ?? "")
            }
          }
        })
      };
      const skillIcon = await this.getSkillIconPath(skill.name);
      if (skillIcon) {
        payload.img = skillIcon;
      }

      const key = skill.name.toLowerCase().trim();
      const current = existing.get(key);
      if (!current) {
        await Item.create(payload);
        created++;
      } else if (overwrite) {
        await current.update(payload);
        updated++;
      } else if (skillIcon && current.img !== skillIcon) {
        await current.update({ img: skillIcon });
        updated++;
      }
    }

    // Force cache refresh so package linking resolves the newly-seeded skills.
    this._skillNameCache = null;
    return { created, updated };
  }

  static async importSpecies({ overwrite = false } = {}) {
    const data = await this.loadSeed("species.json");
    const folder = await this.ensureFolder("SLA Species", "#4f5b66");
    const existing = this.indexItemsByName(
      game.items.filter((i) => i.type === "culture" && i.folder?.id === folder.id)
    );

    let created = 0;
    let updated = 0;

    for (const species of data.species ?? []) {
      const slug = BRPUtilities.toKebabCase(species.name);
      const brpid = `i.culture.sla-${slug}`;
      const move = this.extractMove(species.notes ?? []);
      const speciesFlags = {
        startingScl: species.startingScl ?? 10,
        starterPackage: species.starterPackage ?? "",
        source: "species.json",
        skillBonuses: Array.isArray(species.skillBonuses) ? species.skillBonuses : [],
        choiceBonuses: Array.isArray(species.choiceBonuses) ? species.choiceBonuses : []
      };

      const payload = {
        name: species.name,
        type: "culture",
        folder: folder.id,
        system: {
          move,
          skills: await this.toSkillBonusRows(species.skillBonuses ?? []),
          groups: [],
          stats: {
            str: { formula: this.toFormula(species.characteristics?.str), mod: 0 },
            con: { formula: this.toFormula(species.characteristics?.con), mod: 0 },
            siz: { formula: this.toFormula(species.characteristics?.siz), mod: 0 },
            int: { formula: this.toFormula(species.characteristics?.int), mod: 0 },
            pow: { formula: this.toFormula(species.characteristics?.pow), mod: 0 },
            dex: { formula: this.toFormula(species.characteristics?.dex), mod: 0 },
            cha: { formula: this.toFormula(species.characteristics?.cha), mod: 0 },
            edu: { formula: "2d6+6", mod: 0 }
          },
          description: this.notesToHtml(species.notes ?? [])
        },
        flags: this.buildFlags(brpid, {
          [game.system.id]: {
            slaSpecies: speciesFlags
          },
          brp: {
            slaSpecies: speciesFlags
          }
        })
      };
      const speciesIcon = await this.getSpeciesIconPath(species.name);
      if (speciesIcon) {
        payload.img = speciesIcon;
      }

      const key = species.name.toLowerCase().trim();
      const current = existing.get(key);
      if (!current) {
        await Item.create(payload);
        created++;
      } else if (overwrite) {
        await current.update(payload);
        updated++;
      } else if (speciesIcon && current.img !== speciesIcon) {
        await current.update({ img: speciesIcon });
        updated++;
      }
    }

    return { created, updated };
  }

  static async importTrainingPackages({ overwrite = false } = {}) {
    const data = await this.loadSeed("training-packages.json");
    const folder = await this.ensureFolder("SLA Training Packages", "#556b2f");
    const existing = this.indexItemsByName(
      game.items.filter((i) => i.type === "profession" && i.folder?.id === folder.id)
    );

    let created = 0;
    let updated = 0;

    for (const pkg of data.packages ?? []) {
      const slug = BRPUtilities.toKebabCase(pkg.name);
      const brpid = `i.profession.sla-${slug}`;
      const trainingMeta = {
        startingCredits: data.startingCredits ?? 1500,
        skillPoints: data.defaultSkillPoints ?? data.professionalSkillPool ?? 300,
        professionalSkillPool: data.professionalSkillPool ?? 300,
        generalSkillPool: data.generalSkillPool ?? 120,
        professionalSkillMax: data.professionalSkillMax ?? 45,
        generalSkillMax: data.generalSkillMax ?? 25,
        creationSkillCap: data.creationSkillCap ?? 75,
        skillRefs: pkg.skills ?? []
      };
      const payload = {
        name: pkg.name,
        type: "profession",
        folder: folder.id,
        system: {
          description: this.packageToHtml(pkg, data),
          skills: [],
          groups: [],
          powers: []
        },
        flags: this.buildFlags(brpid, {
          [game.system.id]: { slaTraining: trainingMeta },
          brp: { slaTraining: trainingMeta }
        })
      };
      const trainingIcon = await this.getTrainingPackageIconPath(pkg.name);
      if (trainingIcon) {
        payload.img = trainingIcon;
      }

      const key = pkg.name.toLowerCase().trim();
      const current = existing.get(key);
      if (!current) {
        await Item.create(payload);
        created++;
      } else if (overwrite) {
        await current.update(payload);
        updated++;
      } else if (trainingIcon && current.img !== trainingIcon) {
        await current.update({ img: trainingIcon });
        updated++;
      }
    }

    return { created, updated };
  }

  static async importEbbAbilities({ overwrite = false } = {}) {
    const data = await this.loadSeed("ebb-abilities.json");
    const folder = await this.ensureFolder("SLA Ebb Abilities", "#6b4f7f");
    const existing = this.indexItemsByName(
      game.items.filter((i) => i.type === "psychic" && i.folder?.id === folder.id)
    );

    let created = 0;
    let updated = 0;

    for (const ebb of data.abilities ?? []) {
      const slug = BRPUtilities.toKebabCase(ebb.name);
      const brpid = `i.psychic.sla-${slug}`;
      let category = await this.resolveSkillCategoryBrpid(ebb.skillCategoryRef ?? "Mental");
      if (!category || category === "none") {
        category = await this.resolveSkillCategoryBrpid("Mental");
      }
      const disciplineId = BRPUtilities.toKebabCase(ebb.id ?? ebb.name);
      const disciplineSkillBrpid = await this.resolveSkillBrpid(ebb.skillRef ?? "");
      const coreSkillBrpid = await this.resolveSkillBrpid(ebb.coreSkillRef ?? "Ebb (Core)");
      const tiers = Array.isArray(ebb.tiers)
        ? ebb.tiers.map((tier, index) => ({
            id: String(tier.id ?? ["basic", "strong", "extreme"][index] ?? `tier-${index + 1}`),
            label: String(tier.label ?? tier.id ?? `Tier ${index + 1}`),
            cost: this.parseNumber(tier.cost, this.parseNumber(ebb.pppl, 1)),
            damage: String(tier.damage ?? ""),
            healing: String(tier.healing ?? ""),
            duration: tier.duration ?? ebb.duration ?? "",
            range: String(tier.range ?? ebb.range ?? ""),
            ignoreArmour: this.parseNumber(tier.ignoreArmour, 0),
            rollMods: tier.rollMods ?? {},
            avBonus: this.parseNumber(tier.avBonus, 0),
            protectType: String(tier.protectType ?? ""),
            effect: String(tier.effect ?? "")
          }))
        : [];
      const primaryTier = tiers[0] ?? null;
      const tierNotes = tiers.map((tier) => {
        const bits = [`${tier.label}: ${tier.cost} EBB`];
        if (tier.damage) bits.push(`damage ${tier.damage}`);
        if (tier.healing) bits.push(`healing ${tier.healing}`);
        if (tier.ignoreArmour) bits.push(`ignore armour ${tier.ignoreArmour}`);
        if (tier.avBonus) bits.push(`+${tier.avBonus} AV`);
        return bits.join(", ");
      });
      const descriptionNotes = [
        ebb.effect ? `Effect: ${ebb.effect}` : "",
        ...tierNotes,
        ...(ebb.notes ?? [])
      ].filter(Boolean);
      const ebbMeta = {
        source: "ebb-abilities.json",
        id: disciplineId,
        skillRef: String(ebb.skillRef ?? ""),
        skillBrpid: disciplineSkillBrpid !== "none" ? disciplineSkillBrpid : "",
        coreSkillRef: String(ebb.coreSkillRef ?? "Ebb (Core)"),
        coreSkillBrpid: coreSkillBrpid !== "none" ? coreSkillBrpid : "",
        attack: Boolean(ebb.attack ?? false),
        rangeFormula: String(ebb.rangeFormula ?? ""),
        special: ebb.special ?? {},
        tiers
      };
      const payload = {
        name: ebb.name,
        type: "psychic",
        folder: folder.id,
        system: {
          base: this.parseNumber(ebb.base, 0),
          category,
          impact: ebb.impact ?? "other",
          range: ebb.range ?? "",
          duration: ebb.duration ?? "",
          pppl: String(this.parseNumber(primaryTier?.cost ?? ebb.pppl, 1)),
          damage: primaryTier?.damage ?? ebb.effect ?? "",
          description: this.notesToHtml(descriptionNotes)
        },
        flags: this.buildFlags(brpid, {
          [game.system.id]: {
            slaEbb: ebbMeta
          },
          brp: {
            slaEbb: ebbMeta
          }
        })
      };
      const ebbIcon = await this.getEbbIconPath(ebb.name);
      if (ebbIcon) {
        payload.img = ebbIcon;
      }

      const key = ebb.name.toLowerCase().trim();
      const current = existing.get(key);
      if (!current) {
        await Item.create(payload);
        created++;
      } else if (overwrite) {
        await current.update(payload);
        updated++;
      } else if (ebbIcon && current.img !== ebbIcon) {
        await current.update({ img: ebbIcon });
        updated++;
      }
    }

    return { created, updated };
  }

  static async ensureSLA2Traits({ overwrite = false, folderName = "SLA Traits", notify = false } = {}) {
    if (!game.user?.isGM) {
      return { created: 0, updated: 0, total: this.SLA2_TRAIT_ROWS.length, folderName };
    }

    const folder = await this.ensureFolder(folderName, "#624454");
    const existingByName = this.indexItemsByName(
      game.items.filter((i) => i.type === "persTrait" && i.folder?.id === folder.id)
    );

    let created = 0;
    let updated = 0;

    for (const row of this.SLA2_TRAIT_ROWS) {
      const name = String(row.name ?? "").trim();
      if (!name) continue;
      const slug = BRPUtilities.toKebabCase(name);
      const brpid = `i.persTrait.sla2-${slug}`;
      const rank = this.parseNumber(row.rank, 0);
      const traitType = String(row.traitType ?? "neutral").trim();
      const xpCost = this.parseNumber(row.xpCost, 0);
      const traitIcon = this.getTraitIconPath(name);

      const payload = {
        name,
        type: "persTrait",
        folder: folder.id,
        img: traitIcon,
        system: {
          base: rank,
          oppName: "",
          improve: false,
          oppimprove: false,
          xp: 0,
          basic: true,
          description: `<p><strong>SLA 2e Trait</strong></p><p>Type: ${traitType} | Rank: ${rank} | XP Cost: ${xpCost}</p>`
        },
        flags: this.buildFlags(brpid, {
          [game.system.id]: {
            slaTrait: {
              source: "sla-industries-2e",
              rank,
              type: traitType,
              xpCost
            }
          },
          brp: {
            slaTrait: {
              source: "sla-industries-2e",
              rank,
              type: traitType,
              xpCost
            }
          }
        })
      };

      const key = name.toLowerCase();
      const current = existingByName.get(key);
      if (!current) {
        await Item.create(payload);
        created++;
      } else if (overwrite) {
        await current.update(payload);
        updated++;
      } else if (current.img !== traitIcon || current.folder?.id !== folder.id) {
        await current.update({
          img: traitIcon,
          folder: folder.id
        });
        updated++;
      }
    }

    if (notify) {
      ui.notifications.info(`SLA Traits seeded: ${created} created, ${updated} updated.`);
    }
    return { created, updated, total: this.SLA2_TRAIT_ROWS.length, folderName };
  }

  static async importEquipment({ overwrite = false } = {}) {
    const data = await this.loadSeed("equipment.json");
    const weaponsFolder = await this.ensureFolder("SLA Weapons", "#7f4f4f");
    const armourFolder = await this.ensureFolder("SLA Armour", "#4f647f");

    const existingWeapons = this.indexItemsByName(
      game.items.filter((i) => i.type === "weapon" && i.folder?.id === weaponsFolder.id)
    );
    const existingArmour = this.indexItemsByName(
      game.items.filter((i) => i.type === "armour" && i.folder?.id === armourFolder.id)
    );

    let weaponsCreated = 0;
    let weaponsUpdated = 0;
    let armourCreated = 0;
    let armourUpdated = 0;

    for (const weapon of data.weapons ?? []) {
      const slug = BRPUtilities.toKebabCase(weapon.name);
      const brpid = `i.weapon.sla-${slug}`;
      const skill1 = await this.resolveSkillBrpid(weapon.skillRef ?? "none");
      const skill2 = await this.resolveSkillBrpid(weapon.skillRefAlt ?? "none");
      const ammo = this.parseNumber(weapon.ammo, 0);
      const rof = this.parseNumber(weapon.rof, 0);
      const hp = this.parseNumber(weapon.hp, 0);
      const minStr = this.parseNumber(weapon.minStr, 0);
      const minDex = this.parseNumber(weapon.minDex, 0);
      const isAmmoTracking = ammo > 0;
      const ammoReserve = this.parseNumber(
        weapon.ammoReserve ?? weapon.reserve,
        isAmmoTracking ? ammo * this.parseNumber(weapon.reserveMags, 3) : 0
      );
      const ammoTag = this.deriveAmmoTag(weapon);
      const ammoLoadedType = this.normalizeAmmoTag(weapon.ammoLoadedType ?? ammoTag);
      const ammoPerShot = this.parseNumber(weapon.ammoPerShot, 1);
      const ammoPerBurst = this.parseNumber(
        weapon.ammoPerBurst,
        (weapon.special === "burst" || weapon.special === "auto") ? 3 : ammoPerShot
      );
      const ammoPerAuto = this.parseNumber(
        weapon.ammoPerAuto,
        Math.max(ammoPerBurst, rof > 0 ? rof : 5)
      );
      const reloadAmount = this.parseNumber(weapon.reloadAmount, ammo > 0 ? ammo : 0);
      const ammoCalibre = SLAAmmoCatalog.resolveCalibre(weapon.ammoCalibre ?? "") ??
        SLAAmmoCatalog.resolveCalibre(weapon.ammoType ?? "") ??
        SLAAmmoCatalog.deriveWeaponCalibre({
          name: weapon.name,
          ammoType: weapon.ammoType,
          notes: weapon.notes ?? []
        });
      const ammoBaseCost = Number(ammoCalibre?.cost ?? 0);
      const payload = {
        name: weapon.name,
        type: "weapon",
        folder: weaponsFolder.id,
        system: {
          weaponType: weapon.weaponType ?? "firearm",
          skill1,
          skill2,
          dmg1: weapon.damage ?? "0",
          dmg2: weapon.damage2 ?? "",
          dmg3: weapon.damage3 ?? "",
          db: this.normalizeDamageBonusMode(weapon.db, weapon.weaponType ?? "firearm"),
          range1: weapon.range ?? "",
          range2: weapon.range2 ?? "",
          range3: weapon.range3 ?? "",
          rof,
          ammo,
          ammoCurr: ammo,
          ammoTracking: isAmmoTracking,
          ammoReserve,
          ammoReserveStd: 0,
          ammoReserveAp: 0,
          ammoReserveHe: 0,
          ammoReserveHeap: 0,
          ammoPerShot,
          ammoPerBurst,
          ammoPerAuto,
          reloadAmount,
          ammoCalibre: ammoCalibre?.label ?? "",
          ammoBaseCost,
          ammoTag,
          ammoLoadedType,
          ammoAllowStd: true,
          ammoAllowAp: true,
          ammoAllowHe: true,
          ammoAllowHeap: true,
          ammoType: weapon.ammoType ?? this.deriveAmmoType(weapon),
          mal: this.parseMalf(weapon.malf),
          special: weapon.special ?? weapon.damageType ?? "none",
          hands: weapon.hands ?? "1H",
          hp,
          hpCurr: hp,
          str: minStr,
          dex: minDex,
          price: weapon.price ?? "average",
          enc: Number(weapon.enc ?? 0),
          quantity: 1,
          equipStatus: "carried",
          description: this.weaponToHtml(weapon)
        },
        flags: this.buildFlags(brpid, {
          [game.system.id]: {
            slaEquipment: {
              source: "equipment.json",
              role: "weapon"
            }
          },
          brp: {
            slaEquipment: {
              source: "equipment.json",
              role: "weapon"
            }
          }
        })
      };
      const weaponIcon = await this.getWeaponIconPath(weapon.name);
      if (weaponIcon) {
        payload.img = weaponIcon;
      }

      const key = weapon.name.toLowerCase().trim();
      const current = existingWeapons.get(key);
      if (!current) {
        await Item.create(payload);
        weaponsCreated++;
      } else if (overwrite) {
        await current.update(payload);
        weaponsUpdated++;
      } else if (weaponIcon && current.img !== weaponIcon) {
        await current.update({ img: weaponIcon });
        weaponsUpdated++;
      }
    }

    for (const armour of data.armour ?? []) {
      const slug = BRPUtilities.toKebabCase(armour.name);
      const brpid = `i.armour.sla-${slug}`;
      const av1 = Number(armour.av1 ?? 0);
      const av2 = Number(armour.av2 ?? 0);
      const burden = this.normalizeArmourBurden(
        armour.burden,
        this.deriveArmourBurden(Number(armour.enc ?? 0))
      );
      const price = this.normalizePrice(armour.price, "average");
      const mnplmod = this.parseNumber(
        armour.mnplmod ?? armour.modifiers?.manipulation,
        0
      );
      const percmod = this.parseNumber(
        armour.percmod ?? armour.modifiers?.perception,
        0
      );
      const physmod = this.parseNumber(
        armour.physmod ?? armour.modifiers?.physical,
        0
      );
      const stealthmod = this.parseNumber(
        armour.stealthmod ?? armour.modifiers?.stealth,
        0
      );
      const movMod = this.parseNumber(
        armour.movMod ?? armour.modifiers?.move,
        0
      );
      const poweredEnc = this.parseNumber(
        armour.poweredEnc ?? armour.modifiers?.poweredEnc,
        0
      );
      const strSkillMod = this.parseNumber(
        armour.strSkillMod ?? armour.modifiers?.strSkill,
        0
      );
      const movBonus = this.parseNumber(
        armour.movBonus ?? armour.modifiers?.movBonus,
        0
      );
      const slaArmourMeta = {
        source: "equipment.json",
        role: "armour",
        locationAV: armour.locationAV ?? {},
        helmetAV: this.parseNumber(armour.helmetAV, 0),
        kineticAV: this.parseNumber(armour.kineticAV, 0),
        energyAV: this.parseNumber(armour.energyAV, 0),
        movMod,
        poweredEnc,
        strSkillMod,
        movBonus,
        specialRules: armour.specialRules ?? []
      };
      const payload = {
        name: armour.name,
        type: "armour",
        folder: armourFolder.id,
        system: {
          av1,
          av2,
          armBal: av2 > 0,
          burden,
          enc: Number(armour.enc ?? 0),
          price,
          mnplmod,
          percmod,
          physmod,
          stealthmod,
          quantity: 1,
          equipStatus: "carried",
          coverage: armour.coverage ?? "",
          description: this.armourToHtml(armour)
        },
        flags: this.buildFlags(brpid, {
          [game.system.id]: {
            slaEquipment: slaArmourMeta,
            slaArmour: slaArmourMeta
          },
          brp: {
            slaEquipment: slaArmourMeta,
            slaArmour: slaArmourMeta
          }
        })
      };
      const armourIcon = await this.getArmourIconPath(armour.name);
      if (armourIcon) {
        payload.img = armourIcon;
      }

      const key = armour.name.toLowerCase().trim();
      const current = existingArmour.get(key);
      if (!current) {
        await Item.create(payload);
        armourCreated++;
      } else if (overwrite) {
        await current.update(payload);
        armourUpdated++;
      } else if (armourIcon && current.img !== armourIcon) {
        await current.update({ img: armourIcon });
        armourUpdated++;
      }
    }

    return {
      weapons: { created: weaponsCreated, updated: weaponsUpdated },
      armour: { created: armourCreated, updated: armourUpdated }
    };
  }

  static async linkTrainingPackages({ overwrite = true } = {}) {
    const trainingData = await this.loadSeed("training-packages.json");
    const equipmentData = await this.loadSeed("equipment.json");

    const packageFolder = await this.ensureFolder("SLA Training Packages", "#556b2f");
    const weaponsFolder = await this.ensureFolder("SLA Weapons", "#7f4f4f");
    const armourFolder = await this.ensureFolder("SLA Armour", "#4f647f");

    const packages = game.items.filter((i) => i.type === "profession" && i.folder?.id === packageFolder.id);
    const packageByName = this.indexItemsByName(packages);
    const weaponByName = this.indexItemsByName(
      game.items.filter((i) => i.type === "weapon" && i.folder?.id === weaponsFolder.id)
    );
    const armourByName = this.indexItemsByName(
      game.items.filter((i) => i.type === "armour" && i.folder?.id === armourFolder.id)
    );

    let linked = 0;

    for (const pkg of trainingData.packages ?? []) {
      const item = packageByName.get(pkg.name.toLowerCase().trim());
      if (!item) continue;

      const existingTraining = item.flags?.[game.system.id]?.slaTraining ?? item.flags?.brp?.slaTraining;
      if (existingTraining && !overwrite) continue;

      const skillBrpids = [];
      for (const skillRef of pkg.skills ?? []) {
        const brpid = await this.resolveSkillBrpid(skillRef);
        if (brpid !== "none" && !skillBrpids.includes(brpid)) {
          skillBrpids.push(brpid);
        }
      }

      const professionSkills = [];
      for (const brpid of skillBrpids) {
        const doc = (await game.system.api.brpid.fromBRPIDBest({ brpid }))[0];
        if (doc) {
          professionSkills.push({ uuid: doc.uuid, brpid });
        }
      }

      const loadout = equipmentData.packageLoadouts?.[pkg.name] ?? { weapons: [], armour: [] };
      const weaponBrpids = [];
      for (const weaponName of loadout.weapons ?? []) {
        const weapon = weaponByName.get(weaponName.toLowerCase().trim());
        const brpid = this.getBRPIDFlag(weapon)?.id;
        if (brpid) weaponBrpids.push(brpid);
      }

      const armourBrpids = [];
      for (const armourName of loadout.armour ?? []) {
        const armour = armourByName.get(armourName.toLowerCase().trim());
        const brpid = this.getBRPIDFlag(armour)?.id;
        if (brpid) armourBrpids.push(brpid);
      }

      const trainingMeta = {
        startingCredits: trainingData.startingCredits ?? 1500,
        skillPoints: trainingData.defaultSkillPoints ?? trainingData.professionalSkillPool ?? 300,
        professionalSkillPool: trainingData.professionalSkillPool ?? 300,
        generalSkillPool: trainingData.generalSkillPool ?? 120,
        professionalSkillMax: trainingData.professionalSkillMax ?? 45,
        generalSkillMax: trainingData.generalSkillMax ?? 25,
        creationSkillCap: trainingData.creationSkillCap ?? 75,
        skillRefs: pkg.skills ?? [],
        skillBrpids,
        weaponBrpids,
        armourBrpids
      };

      await item.update({
        "system.skills": professionSkills,
        "system.groups": [],
        "system.description": this.packageToHtml(pkg, trainingData, {
          weapons: loadout.weapons ?? [],
          armour: loadout.armour ?? []
        }),
        [`flags.${game.system.id}.slaTraining`]: trainingMeta
      });
      linked++;
    }

    return { linked };
  }

  static async syncAllToCompendia({ overwrite = false, prune = false } = {}) {
    const maps = [
      {
        folderName: "SLA Skills",
        itemType: "skill",
        packId: "sla-industries-compendium.skills"
      },
      {
        folderName: "SLA Species",
        itemType: "culture",
        packId: "sla-industries-compendium.professions"
      },
      {
        folderName: "SLA Training Packages",
        itemType: "profession",
        packId: "sla-industries-compendium.professions"
      },
      {
        folderName: "SLA Ebb Abilities",
        itemType: "psychic",
        packId: "sla-industries-compendium.psychic-abilities"
      },
      {
        folderName: "SLA Weapons",
        itemType: "weapon",
        packId: "sla-industries-compendium.weapons"
      },
      {
        folderName: "SLA Armour",
        itemType: "armour",
        packId: "sla-industries-compendium.armour"
      },
      {
        folderName: "SLA Traits",
        itemType: "persTrait",
        packId: "sla-industries-compendium.traits"
      }
    ];

    const results = {};
    for (const map of maps) {
      results[map.folderName] = await this.syncWorldFolderToPack({
        folderName: map.folderName,
        itemType: map.itemType,
        packId: map.packId,
        overwrite,
        prune
      });
    }
    return results;
  }

  static async syncWorldFolderToPack({ folderName, itemType, packId, overwrite = false, prune = false } = {}) {
    const folder = game.folders.find((f) => f.type === "Item" && f.name === folderName && !f.folder);
    if (!folder) {
      return { created: 0, updated: 0, skipped: 0, missingFolder: true };
    }

    const sourceItems = game.items.filter((i) => i.type === itemType && i.folder?.id === folder.id);
    const pack = game.packs.get(packId);
    if (!pack) {
      ui.notifications.warn(`Missing pack: ${packId}`);
      return { created: 0, updated: 0, skipped: sourceItems.length, missingPack: true };
    }

    await this.ensurePackWritable(pack);

    let docs = await pack.getDocuments();
    if (prune) {
      const packRef = pack.collection ?? `${pack.metadata.packageName}.${pack.metadata.name}`;
      const staleIds = docs
        .filter((doc) => doc.type === itemType && !this.isSLAItem(doc, { restrictedOnly: true }))
        .map((doc) => doc.id);
      if (staleIds.length) {
        await Item.deleteDocuments(staleIds, { pack: packRef });
        docs = await pack.getDocuments();
      }
    }

    const byBrpid = new Map();
    for (const doc of docs) {
      const brpid = this.getBRPIDFlag(doc)?.id;
      if (brpid) byBrpid.set(brpid, doc);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of sourceItems) {
      const brpid = this.getBRPIDFlag(item)?.id;
      if (!brpid) {
        skipped++;
        continue;
      }

      const existing = byBrpid.get(brpid);
      if (existing) {
        if (!overwrite) {
          skipped++;
          continue;
        }
        const updateData = this.toPackData(item);
        await existing.update(updateData);
        updated++;
        continue;
      }

      const createData = this.toPackData(item);
      const packRef = pack.collection ?? `${pack.metadata.packageName}.${pack.metadata.name}`;
      await Item.create(createData, { pack: packRef });
      created++;
    }

    return { created, updated, skipped };
  }

  static async auditSLAConnections() {
    const [skillsData, speciesData, trainingData, equipmentData, ebbData] = await Promise.all([
      this.loadSeed("skills.json"),
      this.loadSeed("species.json"),
      this.loadSeed("training-packages.json"),
      this.loadSeed("equipment.json"),
      this.loadSeed("ebb-abilities.json")
    ]);

    const skillNames = new Set((skillsData.skills ?? []).map((row) => String(row.name ?? "").trim()).filter(Boolean));
    const packageNames = new Set((trainingData.packages ?? []).map((row) => String(row.name ?? "").trim()).filter(Boolean));
    const weaponNames = new Set((equipmentData.weapons ?? []).map((row) => String(row.name ?? "").trim()).filter(Boolean));
    const armourNames = new Set((equipmentData.armour ?? []).map((row) => String(row.name ?? "").trim()).filter(Boolean));
    const ebbNames = new Set((ebbData.abilities ?? []).map((row) => String(row.name ?? "").trim()).filter(Boolean));
    const drugNames = new Set(Object.values(SLADrugSystem.DRUG_DEFINITIONS ?? {}).map((row) => String(row.name ?? "").trim()).filter(Boolean));

    const worldByFolder = (folderName, itemType) => {
      const folder = game.folders.find((f) => f.type === "Item" && f.name === folderName && !f.folder);
      if (!folder) return { folder: false, names: new Set(), items: [] };
      const items = game.items.filter((i) => i.type === itemType && i.folder?.id === folder.id);
      return { folder: true, names: new Set(items.map((i) => i.name)), items };
    };

    const worldSkills = worldByFolder("SLA Skills", "skill");
    const worldSpecies = worldByFolder("SLA Species", "culture");
    const worldPackages = worldByFolder("SLA Training Packages", "profession");
    const worldWeapons = worldByFolder("SLA Weapons", "weapon");
    const worldArmour = worldByFolder("SLA Armour", "armour");
    const worldEbb = worldByFolder("SLA Ebb Abilities", "psychic");
    const worldAmmo = worldByFolder("SLA Ammo", "gear");
    const worldDrugs = worldByFolder("SLA Drugs", "gear");
    const nonSLAWorldItems = game.items
      .filter((item) => this.SLA_RESTRICTED_TYPES.has(item.type) && !this.isSLAItem(item, { restrictedOnly: true }))
      .map((item) => ({ type: item.type, name: item.name }));

    const missingWorldSkills = [...skillNames].filter((name) => !worldSkills.names.has(name));
    const missingWorldSpecies = [...new Set((speciesData.species ?? []).map((row) => row.name))].filter((name) => !worldSpecies.names.has(name));
    const missingWorldPackages = [...packageNames].filter((name) => !worldPackages.names.has(name));
    const missingWorldWeapons = [...weaponNames].filter((name) => !worldWeapons.names.has(name));
    const missingWorldArmour = [...armourNames].filter((name) => !worldArmour.names.has(name));
    const missingWorldEbb = [...ebbNames].filter((name) => !worldEbb.names.has(name));
    const missingWorldDrugs = [...drugNames]
      .map((name) => `Drug: ${name}`)
      .filter((name) => !worldDrugs.names.has(name));

    const packageSkillLinksMissing = [];
    for (const pkg of trainingData.packages ?? []) {
      for (const skillRef of pkg.skills ?? []) {
        const brpid = await this.resolveSkillBrpid(skillRef);
        if (brpid === "none") {
          packageSkillLinksMissing.push({ package: pkg.name, skillRef });
        }
      }
    }

    const speciesStarterPackagesMissing = [];
    const speciesSkillLinksMissing = [];
    for (const species of speciesData.species ?? []) {
      if (species.starterPackage && !packageNames.has(species.starterPackage)) {
        speciesStarterPackagesMissing.push({ species: species.name, starterPackage: species.starterPackage });
      }
      for (const bonus of species.skillBonuses ?? []) {
        const brpid = await this.resolveSkillBrpid(bonus.skillRef);
        if (brpid === "none") {
          speciesSkillLinksMissing.push({
            species: species.name,
            skillRef: bonus.skillRef,
            bonus: bonus.bonus
          });
        }
      }
    }

    const loadoutLinksMissing = [];
    for (const [packageName, loadout] of Object.entries(equipmentData.packageLoadouts ?? {})) {
      if (!packageNames.has(packageName)) {
        loadoutLinksMissing.push({ package: packageName, type: "package", missing: packageName });
      }
      for (const weapon of loadout.weapons ?? []) {
        if (!weaponNames.has(weapon)) {
          loadoutLinksMissing.push({ package: packageName, type: "weapon", missing: weapon });
        }
      }
      for (const armour of loadout.armour ?? []) {
        if (!armourNames.has(armour)) {
          loadoutLinksMissing.push({ package: packageName, type: "armour", missing: armour });
        }
      }
    }

    const weaponSkillLinksMissing = [];
    const weaponCalibreMissing = [];
    for (const weapon of equipmentData.weapons ?? []) {
      const primary = await this.resolveSkillBrpid(weapon.skillRef ?? "none");
      if (primary === "none") {
        weaponSkillLinksMissing.push({ weapon: weapon.name, field: "skillRef", value: weapon.skillRef });
      }
      if (weapon.skillRefAlt) {
        const secondary = await this.resolveSkillBrpid(weapon.skillRefAlt);
        if (secondary === "none") {
          weaponSkillLinksMissing.push({ weapon: weapon.name, field: "skillRefAlt", value: weapon.skillRefAlt });
        }
      }

      const calibre =
        SLAAmmoCatalog.resolveCalibre(weapon.ammoCalibre ?? "") ??
        SLAAmmoCatalog.resolveCalibre(weapon.ammoType ?? "") ??
        SLAAmmoCatalog.deriveWeaponCalibre({
          name: weapon.name,
          ammoType: weapon.ammoType,
          ammoText: weapon.ammoText,
          notes: weapon.notes ?? []
        });
      if (Number(weapon.ammo ?? 0) > 0 && !calibre) {
        weaponCalibreMissing.push(weapon.name);
      }
    }

    const expectedAmmoCalibreKeys = new Set(SLAAmmoCatalog.BASE_CALIBRES.map((row) => row.key));
    const presentAmmoCalibreKeys = new Set();
    for (const item of worldAmmo.items) {
      const meta = SLAAmmoCatalog.getAmmoMetaFromItem(item);
      if (meta?.calibreKey) presentAmmoCalibreKeys.add(meta.calibreKey);
    }
    const missingAmmoGear = [...expectedAmmoCalibreKeys]
      .filter((key) => !presentAmmoCalibreKeys.has(key))
      .map((key) => SLAAmmoCatalog.resolveCalibre(key)?.label ?? key);

    const hasMissing = Boolean(
      missingWorldSkills.length ||
      missingWorldSpecies.length ||
      missingWorldPackages.length ||
      missingWorldWeapons.length ||
      missingWorldArmour.length ||
      missingWorldEbb.length ||
      missingWorldDrugs.length ||
      nonSLAWorldItems.length ||
      packageSkillLinksMissing.length ||
      speciesStarterPackagesMissing.length ||
      speciesSkillLinksMissing.length ||
      loadoutLinksMissing.length ||
      weaponSkillLinksMissing.length ||
      weaponCalibreMissing.length ||
      missingAmmoGear.length
    );

    const report = {
      hasMissing,
      world: {
        missingSkills: missingWorldSkills,
        missingSpecies: missingWorldSpecies,
        missingPackages: missingWorldPackages,
        missingWeapons: missingWorldWeapons,
        missingArmour: missingWorldArmour,
        missingEbbAbilities: missingWorldEbb,
        missingDrugGear: missingWorldDrugs,
        missingAmmoGear,
        nonSLAWorldItems
      },
      links: {
        packageSkillLinksMissing,
        speciesStarterPackagesMissing,
        speciesSkillLinksMissing,
        loadoutLinksMissing,
        weaponSkillLinksMissing,
        weaponCalibreMissing
      }
    };

    if (hasMissing) {
      ui.notifications.warn("SLA audit found missing links/content. Check console report.");
    } else {
      ui.notifications.info("SLA audit passed: all configured links/content are present.");
    }
    console.log("sla-industries-brp | SLA content audit", report);
    return report;
  }

  static async ensurePackWritable(pack) {
    if (!pack.locked) return;
    try {
      await pack.configure({ locked: false });
    } catch (err) {
      ui.notifications.warn(`Pack is locked and could not be unlocked: ${pack.collection}`);
      throw err;
    }
  }

  static toPackData(item) {
    const data = item.toObject();
    delete data._id;
    delete data.folder;
    delete data.sort;
    delete data.ownership;

    const brpid = this.getBRPIDFlag(item)?.id;
    if (brpid) {
      data.flags = this.buildFlags(brpid, data.flags ?? {});
    }

    return data;
  }

  static getBRPIDFlag(document) {
    if (!document) return undefined;
    return document.flags?.[game.system.id]?.brpidFlag ?? document.flags?.brp?.brpidFlag;
  }

  static buildFlags(brpid, extraFlags = {}) {
    const brpidFlag = {
      brpidFlag: {
        id: brpid,
        lang: game.i18n.lang,
        priority: 0
      }
    };

    const flags = {
      [game.system.id]: {
        ...brpidFlag,
        ...(extraFlags[game.system.id] ?? {})
      },
      brp: {
        ...brpidFlag,
        ...(extraFlags.brp ?? {})
      }
    };

    for (const [scope, values] of Object.entries(extraFlags)) {
      if (scope === game.system.id || scope === "brp") continue;
      flags[scope] = values;
    }

    return flags;
  }

  static async loadSeed(fileName) {
    const url = `modules/sla-industries-compendium/sla-data/${fileName}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Unable to load seed file: ${url}`);
    }
    return response.json();
  }

  static async ensureFolder(name, color = "#4f5b66") {
    let folder = game.folders.find(
      (f) => f.type === "Item" && f.name === name && !f.folder
    );
    if (!folder) {
      folder = await Folder.create({
        name,
        type: "Item",
        color
      });
    }
    return folder;
  }

  static indexItemsByName(items) {
    const map = new Map();
    for (const item of items) {
      map.set(item.name.toLowerCase().trim(), item);
    }
    return map;
  }

  static async toSkillBonusRows(skillBonuses = []) {
    const aggregate = new Map();
    for (const row of skillBonuses ?? []) {
      const skillRef = String(row?.skillRef ?? row?.ref ?? "").trim();
      const bonus = Number(row?.bonus ?? 0);
      if (!skillRef || !Number.isFinite(bonus) || bonus === 0) continue;
      const brpid = await this.resolveSkillBrpid(skillRef);
      if (!brpid || brpid === "none") continue;
      aggregate.set(brpid, Number(aggregate.get(brpid) ?? 0) + bonus);
    }
    return [...aggregate.entries()].map(([brpid, bonus]) => ({ brpid, bonus }));
  }

  static async resolveSkillBrpid(skillRef) {
    if (!skillRef) return "none";
    if (skillRef.startsWith("i.skill.")) return skillRef;

    await this.ensureSkillNameCache();

    const candidates = this.expandSkillRefCandidates(skillRef);
    for (const candidate of candidates) {
      const brpid = this.resolveSkillFromCache(candidate);
      if (brpid !== "none") return brpid;
    }

    return this.resolveSkillAlias(skillRef);
  }

  static async resolveSkillCategoryBrpid(categoryRef) {
    if (!categoryRef) return "none";
    if (categoryRef.startsWith("i.skillcat.")) return categoryRef;

    const categories = await game.system.api.brpid.fromBRPIDRegexBest({
      brpidRegExp: /^i\.skillcat\./,
      type: "i"
    });
    const norm = this.normalizeText(categoryRef);

    const aliases = {
      info: "mental",
      professional: "mental",
      ebb: "mental",
      social: "communication",
      vehicle: "technical",
      technical: "technical",
      combat: "combat",
      perception: "perception",
      physical: "physical"
    };
    const aliasNorm = aliases[norm] ?? norm;

    for (const category of categories) {
      const categoryNorm = this.normalizeText(category.name);
      if (categoryNorm === aliasNorm || categoryNorm === norm) {
        return this.getBRPIDFlag(category)?.id ?? "none";
      }
    }
    for (const category of categories) {
      const categoryNorm = this.normalizeText(category.name);
      if (categoryNorm.includes(aliasNorm) || aliasNorm.includes(categoryNorm)) {
        return this.getBRPIDFlag(category)?.id ?? "none";
      }
    }
    return "none";
  }

  static normalizeText(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static parseNumber(value, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const match = value.match(/-?\d+/);
      if (match) return Number(match[0]);
    }
    return fallback;
  }

  static parseMalf(value) {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const match = value.match(/(\d{1,2})\s*[-/]\s*(\d{1,2})/);
      if (match) return Number(match[1]);
      const single = value.match(/\d{1,2}/);
      if (single) return Number(single[0]);
    }
    return 0;
  }

  static normalizeArmourBurden(value, fallback = "moderate") {
    const valid = new Set(["none", "light", "moderate", "cumbersome"]);
    const key = String(value ?? "").trim().toLowerCase();
    if (valid.has(key)) return key;
    return fallback;
  }

  static deriveArmourBurden(enc = 0) {
    if (enc <= 1) return "none";
    if (enc <= 3) return "light";
    if (enc <= 6) return "moderate";
    return "cumbersome";
  }

  static normalizePrice(value, fallback = "average") {
    const valid = new Set(["none", "cheap", "inexpensive", "average", "expensive", "priceless", "restricted"]);
    const key = String(value ?? "").trim().toLowerCase();
    if (valid.has(key)) return key;
    return fallback;
  }

  static normalizeAmmoTag(tag = "") {
    const normal = String(tag ?? "").trim().toUpperCase();
    if (["AP", "HE", "HEAP"].includes(normal)) return normal;
    return "STD";
  }

  static normalizeDamageBonusMode(db = "", weaponType = "") {
    const dbText = String(db ?? "").trim().toLowerCase();
    const type = String(weaponType ?? "").trim().toLowerCase();
    const isMelee = type === "melee" || type === "shield";
    if (["none", "half", "full", "oneh"].includes(dbText)) return dbText;
    if (dbText === "1h") return "oneh";
    if (dbText === "2h") return "full";
    const dbNumber = Number(db);
    if (Number.isFinite(dbNumber)) {
      if (dbNumber <= 0) return isMelee ? "full" : "none";
      return "full";
    }
    return isMelee ? "full" : "none";
  }

  static deriveAmmoTag(weapon = {}) {
    const explicitTag = this.normalizeAmmoTag(weapon.ammoTag);
    if (explicitTag !== "STD" || String(weapon.ammoTag ?? "").trim() !== "") {
      return explicitTag;
    }
    const text = `${weapon.name ?? ""} ${weapon.ammoText ?? ""} ${weapon.damageType ?? ""} ${weapon.notes?.join(" ") ?? ""}`.toLowerCase();
    if (text.includes("heap")) return "HEAP";
    if (text.includes("armour piercing") || text.includes("armor piercing") || /\bap\b/.test(text)) return "AP";
    if (text.includes("explosive") || text.includes("grenade") || text.includes("launcher") || text.includes("blast")) return "HE";
    return "STD";
  }

  static deriveAmmoType(weapon = {}) {
    const text = `${weapon.ammoType ?? ""} ${weapon.ammoText ?? ""} ${weapon.notes?.join(" ") ?? ""}`.toLowerCase();
    if (text.includes("belt")) return "belt";
    if (text.includes("drum")) return "drum";
    if (text.includes("tube") || text.includes("shell")) return "shell";
    if (text.includes("cylinder")) return "cylinder";
    if (text.includes("grenade")) return "grenade";
    if (text.includes("mag")) return "mag";
    return weapon.ammo > 0 ? "mag" : "";
  }

  static weaponToHtml(weapon) {
    const notes = [...(weapon.notes ?? [])];
    notes.push(`Default Ammo Type: ${this.deriveAmmoTag(weapon)}`);
    if (weapon.damageType) notes.unshift(`Damage Type: ${weapon.damageType}`);
    if (weapon.reach) notes.unshift(`Reach: ${weapon.reach}`);
    if (weapon.rofText) notes.push(`RoF: ${weapon.rofText}`);
    if (weapon.ammoText) notes.push(`Ammo: ${weapon.ammoText}`);
    if (weapon.malf) notes.push(`Malf: ${weapon.malf}`);
    if (weapon.minStr || weapon.minDex) {
      const mins = [];
      if (weapon.minStr) mins.push(`STR ${weapon.minStr}`);
      if (weapon.minDex) mins.push(`DEX ${weapon.minDex}`);
      notes.push(`Minimum: ${mins.join(", ")}`);
    }
    return this.notesToHtml(notes);
  }

  static armourToHtml(armour) {
    const notes = [...(armour.notes ?? [])];
    if (armour.locationAV && Object.keys(armour.locationAV).length) {
      const byLoc = Object.entries(armour.locationAV)
        .map(([loc, av]) => `${loc}: ${av}`)
        .join(", ");
      notes.unshift(`AV by location: ${byLoc}`);
    }
    if (armour.kineticAV || armour.energyAV) {
      const kinetic = this.parseNumber(armour.kineticAV, this.parseNumber(armour.av1, 0));
      const energy = this.parseNumber(armour.energyAV, 0);
      if (energy > 0) notes.unshift(`AV profile: kinetic ${kinetic}, energy ${energy}`);
    }
    if (armour.poweredEnc) {
      notes.push(`Powered ENC: count as ${armour.poweredEnc} for movement`);
    }
    if (armour.movMod) {
      notes.push(`Move modifier: ${armour.movMod > 0 ? "+" : ""}${armour.movMod}`);
    }
    if (armour.strSkillMod) {
      notes.push(`STR-based skills: ${armour.strSkillMod > 0 ? "+" : ""}${armour.strSkillMod}%`);
    }
    if (armour.movBonus) {
      notes.push(`Move bonus: +${armour.movBonus}`);
    }
    for (const special of armour.specialRules ?? []) {
      notes.push(`Special: ${special}`);
    }
    return this.notesToHtml(notes);
  }

  static async ensureSkillNameCache() {
    if (this._skillNameCache) return;
    const skills = await game.system.api.brpid.fromBRPIDRegexBest({
      brpidRegExp: /^i\.skill\./,
      type: "i"
    });
    this._skillNameCache = new Map();
    for (const skill of skills) {
      const brpid = this.getBRPIDFlag(skill)?.id;
      if (!brpid) continue;
      const key = this.normalizeText(skill.name);
      if (!this._skillNameCache.has(key) || brpid.startsWith("i.skill.sla-")) {
        this._skillNameCache.set(key, brpid);
      }
    }
  }

  static normalizeSkillIconKey(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static getSkillIconAliasCandidates(skillName = "") {
    const key = this.normalizeSkillIconKey(skillName);
    const aliases = {
      craftspecialty: ["Craft", "Craft Specialty"],
      firearmautosupport: ["Firearm Auto", "Firearm Support"],
      firearmrifleshotgun: ["Firearm Rifle Shotgun", "Firearm Rifle:shotgun"],
      meleeblade2h: ["Melee 2H Blade", "Melee Blade 2H"],
      techcomputersai: ["Tech Computers and AI", "Tech Computers AI"],
      ebbthermalblue: ["EBB Blue Thermal", "EBB Thermal Blue"],
      ebbthermalred: ["EBB Thermal Red"],
      ebbsenses: ["EBB Speciality", "EBB Awareness"],
      ebbprotect: ["EBB Speciality", "EBB Core"],
      ebbheal: ["EBB Speciality", "Medical"],
      athletics: ["Climb", "Swim"],
      brawl: ["Melee Club", "Melee Axe"],
      throw: ["THrow", "Throw"]
    };
    return aliases[key] ?? [];
  }

  static getSkillIconCandidates(skillName = "") {
    const clean = String(skillName ?? "").trim();
    if (!clean) return [];
    const candidates = [
      clean,
      clean.replace(/[()]/g, " "),
      clean.replace(/\(([^)]+)\)/g, " $1 "),
      clean.replace(/[\/:]/g, " "),
      clean.replace(/&/g, "and"),
      clean.replace(/\s+/g, " ").trim()
    ];
    const noParens = clean.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (noParens) candidates.push(noParens);
    candidates.push(...this.getSkillIconAliasCandidates(clean));

    const unique = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const norm = this.normalizeSkillIconKey(candidate);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      unique.push(candidate);
    }
    return unique;
  }

  static async ensureSkillIconMap() {
    if (this._skillIconMapCache) return this._skillIconMapCache;
    const map = new Map();
    try {
      const listing = await this.browseData(this.SKILL_ICON_PATH);
      for (const file of listing?.files ?? []) {
        const decoded = decodeURIComponent(String(file ?? ""));
        const base = decoded.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
        const norm = this.normalizeSkillIconKey(base);
        if (!norm || map.has(norm)) continue;
        map.set(norm, decoded);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Could not read skill icon folder", err);
    }
    this._skillIconMapCache = map;
    return map;
  }

  static async getSkillIconPath(skillName = "") {
    const map = await this.ensureSkillIconMap();
    if (!map.size) return null;

    const candidates = this.getSkillIconCandidates(skillName);
    for (const candidate of candidates) {
      const norm = this.normalizeSkillIconKey(candidate);
      if (map.has(norm)) return map.get(norm);
    }

    const needle = this.normalizeSkillIconKey(skillName);
    if (!needle) return null;
    for (const [key, path] of map.entries()) {
      if (key.includes(needle) || needle.includes(key)) {
        return path;
      }
    }
    return null;
  }

  static normalizeWeaponIconKey(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static getWeaponIconAliasCandidates(weaponName = "") {
    const key = this.normalizeWeaponIconKey(weaponName);
    const aliases = {
      standardcombatknife: ["SLA Combat Knife Standard", "SLA Combat KNife Standard", "MAC Knife"],
      collapsiblebaton: ["Colapsable Baton", "Pacifier Baton", "GASH Pacifier Baton"],
      itbmutilatorsword: ["SLA Blade", "CAF Blade"],
      vibroblade: ["Vibro Sabre", "CAF Blade"],
      chainaxe: ["Chainaxe1"],
      chainsawimprovised: ["Chainsaw1"],
      shaktarclaws: ["Shacktar Claws"],
      fen603autopistol: ["FEN 603 Auto Pistol", "FEN 603"],
      fen209machinepistol: ["FEN 209 Machine PIstol", "FEN 209 Machine Pistol"],
      fen10streetsweeperautoshotgun: ["FEN10 Street Sweeper"],
      kpsmanglershotgun: ["KPS Mangler", "KPS Shotgun"],
      milagrenadelauncher: ["MILA Grenage Launcher"],
      fragmentationgrenade: ["Frag Grenade"],
      powerclaymore: ["Power ClayMOre"],
      fen701urbancarbine: ["FEN701 Urban Carbine"],
      fenarassaultrifle: ["FEN AR Assault Rifle", "FEN AR"],
      fenreaperlmg: ["FEN Reaper LMG", "SLA SUpport LMG"]
    };
    return aliases[key] ?? [];
  }

  static getWeaponIconCandidates(weaponName = "") {
    const clean = String(weaponName ?? "").trim();
    if (!clean) return [];
    const candidates = [
      clean,
      clean.replace(/[()]/g, " "),
      clean.replace(/\(([^)]+)\)/g, " $1 "),
      clean.replace(/[\/:]/g, " "),
      clean.replace(/&/g, "and"),
      clean.replace(/\s+/g, " ").trim()
    ];
    const noParens = clean.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (noParens) candidates.push(noParens);
    candidates.push(...this.getWeaponIconAliasCandidates(clean));

    const unique = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const norm = this.normalizeWeaponIconKey(candidate);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      unique.push(candidate);
    }
    return unique;
  }

  static async ensureWeaponIconMap() {
    if (this._weaponIconMapCache) return this._weaponIconMapCache;
    const map = new Map();
    try {
      const listing = await this.browseData(this.WEAPON_ICON_PATH);
      for (const file of listing?.files ?? []) {
        const decoded = decodeURIComponent(String(file ?? ""));
        const base = decoded.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
        const norm = this.normalizeWeaponIconKey(base);
        if (!norm || map.has(norm)) continue;
        map.set(norm, decoded);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Could not read weapon icon folder", err);
    }
    this._weaponIconMapCache = map;
    return map;
  }

  static async getWeaponIconPath(weaponName = "") {
    const map = await this.ensureWeaponIconMap();
    if (!map.size) return null;

    const candidates = this.getWeaponIconCandidates(weaponName);
    for (const candidate of candidates) {
      const norm = this.normalizeWeaponIconKey(candidate);
      if (map.has(norm)) return map.get(norm);
    }

    const needle = this.normalizeWeaponIconKey(weaponName);
    if (!needle) return null;
    for (const [key, path] of map.entries()) {
      if (key.includes(needle) || needle.includes(key)) {
        return path;
      }
    }
    return null;
  }

  static normalizeArmourIconKey(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static getArmourIconAliasCandidates(armourName = "") {
    const key = this.normalizeArmourIconKey(armourName);
    const aliases = {
      bodyblockerpp644: ["PP644 Body Blocker"],
      cafcompletearmourfabrication: ["CAF", "CAF Armour"],
      chippycivilianarmour: ["Chippy", "Street Cloths"],
      crackshotarmour: ["Crackshot"],
      dnpowerarmour: ["Dark Night Power", "Dark Night Power Armour"],
      dogeybonehardarmour: ["Dodgybone HARD Armour", "Dodgybone"],
      ebbdeathsuitebonbrainwaster: ["Ebb Dethsuit", "Ebb Deathsuit"],
      fullshiverarmour: ["Shiver", "SLA Patrol Armour"],
      heavythreshersuit: ["Heavy Thresher"],
      lightthreshersuit: ["Light Thresher"],
      slacombatarmour: ["SLA Combat Armor"],
      slacovertvest: ["SLA Covert Vest"],
      slaheavyassaultarmour: ["SLA Heavy Assult"],
      slareconmesh: ["SLA Recon Mesh"]
    };
    return aliases[key] ?? [];
  }

  static getArmourIconCandidates(armourName = "") {
    const clean = String(armourName ?? "").trim();
    if (!clean) return [];
    const candidates = [
      clean,
      clean.replace(/[()]/g, " "),
      clean.replace(/\(([^)]+)\)/g, " $1 "),
      clean.replace(/[\/:]/g, " "),
      clean.replace(/&/g, "and"),
      clean.replace(/\s+/g, " ").trim()
    ];
    const noParens = clean.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (noParens) candidates.push(noParens);
    candidates.push(...this.getArmourIconAliasCandidates(clean));

    const unique = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const norm = this.normalizeArmourIconKey(candidate);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      unique.push(candidate);
    }
    return unique;
  }

  static async ensureArmourIconMap() {
    if (this._armourIconMapCache) return this._armourIconMapCache;
    const map = new Map();
    const files = await this._browseDataFilesRecursive(this.ARMOUR_ICON_PATH);
    for (const file of files) {
      const base = String(file).split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
      const norm = this.normalizeArmourIconKey(base);
      if (!norm || map.has(norm)) continue;
      map.set(norm, file);
    }
    this._armourIconMapCache = map;
    return map;
  }

  static async getArmourIconPath(armourName = "") {
    const map = await this.ensureArmourIconMap();
    if (!map.size) return null;

    const candidates = this.getArmourIconCandidates(armourName);
    for (const candidate of candidates) {
      const norm = this.normalizeArmourIconKey(candidate);
      if (map.has(norm)) return map.get(norm);
    }

    const needle = this.normalizeArmourIconKey(armourName);
    if (!needle) return null;
    for (const [key, path] of map.entries()) {
      if (key.includes(needle) || needle.includes(key)) {
        return path;
      }
    }
    return null;
  }

  static normalizeEbbIconKey(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static getEbbIconAliasCandidates(ebbName = "") {
    const key = this.normalizeEbbIconKey(ebbName);
    const aliases = {
      thermalred: ["Thermal Red"],
      thermalblue: ["Thermal Blue"],
      ebbheal: ["Heal", "Ebb Heal"],
      ebbprotect: ["Protect"],
      ebbsenses: ["Senses"],
      ebbcommunicate: ["Communicate"],
      ebbawareness: ["Awareness"],
      ebbblast: ["Blast"],
      ebbtelekinesis: ["Telekinesis"],
      ebbrealityfold: ["Reality Fold"]
    };
    return aliases[key] ?? [];
  }

  static getEbbIconCandidates(ebbName = "") {
    const clean = String(ebbName ?? "").trim();
    if (!clean) return [];
    const candidates = [
      clean,
      clean.replace(/[()]/g, " "),
      clean.replace(/\(([^)]+)\)/g, " $1 "),
      clean.replace(/[\/:]/g, " "),
      clean.replace(/&/g, "and"),
      clean.replace(/\s+/g, " ").trim()
    ];
    const noParens = clean.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (noParens) candidates.push(noParens);
    if (!/^ebb\b/i.test(clean)) candidates.push(`Ebb ${clean}`);
    candidates.push(...this.getEbbIconAliasCandidates(clean));

    const unique = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const norm = this.normalizeEbbIconKey(candidate);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      unique.push(candidate);
    }
    return unique;
  }

  static async ensureEbbIconMap() {
    if (this._ebbIconMapCache) return this._ebbIconMapCache;
    const map = new Map();
    try {
      const listing = await this.browseData(this.EBB_ICON_PATH);
      for (const file of listing?.files ?? []) {
        const decoded = decodeURIComponent(String(file ?? ""));
        const base = decoded.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
        const norm = this.normalizeEbbIconKey(base);
        if (!norm || map.has(norm)) continue;
        map.set(norm, decoded);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Could not read Ebb icon folder", err);
    }
    this._ebbIconMapCache = map;
    return map;
  }

  static async getEbbIconPath(ebbName = "") {
    const map = await this.ensureEbbIconMap();
    if (!map.size) return null;

    const candidates = this.getEbbIconCandidates(ebbName);
    for (const candidate of candidates) {
      const norm = this.normalizeEbbIconKey(candidate);
      if (map.has(norm)) return map.get(norm);
    }

    const needle = this.normalizeEbbIconKey(ebbName);
    if (!needle) return null;
    for (const [key, path] of map.entries()) {
      if (key.includes(needle) || needle.includes(key)) {
        return path;
      }
    }
    return null;
  }

  static normalizeSpeciesIconKey(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static getSpeciesIconAliasCandidates(speciesName = "") {
    const key = this.normalizeSpeciesIconKey(speciesName);
    const aliases = {
      advancedcarrien: ["Advanced Carrion"],
      stormer313malice: ["Stormer 313"],
      stormer711xeno: ["Stormer 711"]
    };
    return aliases[key] ?? [];
  }

  static getSpeciesIconCandidates(speciesName = "") {
    const clean = String(speciesName ?? "").trim();
    if (!clean) return [];
    const candidates = [
      clean,
      clean.replace(/[()]/g, " "),
      clean.replace(/\(([^)]+)\)/g, " $1 "),
      clean.replace(/[\/:]/g, " "),
      clean.replace(/&/g, "and"),
      clean.replace(/\s+/g, " ").trim()
    ];
    const noParens = clean.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (noParens) candidates.push(noParens);
    candidates.push(...this.getSpeciesIconAliasCandidates(clean));

    const unique = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const norm = this.normalizeSpeciesIconKey(candidate);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      unique.push(candidate);
    }
    return unique;
  }

  static async ensureSpeciesIconMap() {
    if (this._speciesIconMapCache) return this._speciesIconMapCache;
    const map = new Map();
    try {
      const listing = await this.browseData(this.SPECIES_ICON_PATH);
      for (const file of listing?.files ?? []) {
        const decoded = decodeURIComponent(String(file ?? ""));
        const base = decoded.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
        const norm = this.normalizeSpeciesIconKey(base);
        if (!norm || map.has(norm)) continue;
        map.set(norm, decoded);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Could not read species icon folder", err);
    }
    this._speciesIconMapCache = map;
    return map;
  }

  static async getSpeciesIconPath(speciesName = "") {
    const map = await this.ensureSpeciesIconMap();
    if (!map.size) return null;

    const candidates = this.getSpeciesIconCandidates(speciesName);
    for (const candidate of candidates) {
      const norm = this.normalizeSpeciesIconKey(candidate);
      if (map.has(norm)) return map.get(norm);
    }

    const needle = this.normalizeSpeciesIconKey(speciesName);
    if (!needle) return null;
    for (const [key, path] of map.entries()) {
      if (key.includes(needle) || needle.includes(key)) {
        return path;
      }
    }
    return null;
  }

  static normalizeTrainingIconKey(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static getTrainingIconAliasCandidates(trainingName = "") {
    const key = this.normalizeTrainingIconKey(trainingName);
    const aliases = {
      investigation: ["INvestigation"],
      media: ["media Elete"],
      pilot: ["pilot and Navigation"],
      techops: ["Mechanic Tech Ops"]
    };
    return aliases[key] ?? [];
  }

  static getTrainingIconCandidates(trainingName = "") {
    const clean = String(trainingName ?? "").trim();
    if (!clean) return [];
    const candidates = [
      clean,
      clean.replace(/[()]/g, " "),
      clean.replace(/\(([^)]+)\)/g, " $1 "),
      clean.replace(/[\/:]/g, " "),
      clean.replace(/&/g, "and"),
      clean.replace(/\s+/g, " ").trim()
    ];
    const noParens = clean.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (noParens) candidates.push(noParens);
    candidates.push(...this.getTrainingIconAliasCandidates(clean));

    const unique = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const norm = this.normalizeTrainingIconKey(candidate);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      unique.push(candidate);
    }
    return unique;
  }

  static async _browseDataFilesRecursive(rootPath = "") {
    const queue = [rootPath];
    const seen = new Set();
    const files = [];
    while (queue.length) {
      const path = String(queue.shift() ?? "").trim();
      if (!path || seen.has(path)) continue;
      seen.add(path);
      try {
        const listing = await this.browseData(path);
        for (const file of listing?.files ?? []) {
          files.push(decodeURIComponent(String(file ?? "")));
        }
        for (const dir of listing?.dirs ?? []) {
          const next = decodeURIComponent(String(dir ?? ""));
          if (next && !seen.has(next)) queue.push(next);
        }
      } catch (err) {
        console.warn(`sla-industries-brp | Failed browsing data path: ${path}`, err);
      }
    }
    return files;
  }

  static async ensureTrainingIconMap() {
    if (this._trainingIconMapCache) return this._trainingIconMapCache;
    const map = new Map();
    const files = await this._browseDataFilesRecursive(this.TRAINING_ICON_PATH);
    for (const file of files) {
      const base = String(file).split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
      const norm = this.normalizeTrainingIconKey(base);
      if (!norm || map.has(norm)) continue;
      map.set(norm, file);
    }
    this._trainingIconMapCache = map;
    return map;
  }

  static async getTrainingPackageIconPath(trainingName = "") {
    const map = await this.ensureTrainingIconMap();
    if (!map.size) return null;

    const candidates = this.getTrainingIconCandidates(trainingName);
    for (const candidate of candidates) {
      const norm = this.normalizeTrainingIconKey(candidate);
      if (map.has(norm)) return map.get(norm);
    }

    const needle = this.normalizeTrainingIconKey(trainingName);
    if (!needle) return null;
    for (const [key, path] of map.entries()) {
      if (key.includes(needle) || needle.includes(key)) {
        return path;
      }
    }
    return null;
  }

  static isSLATrainingPackage(documentLike) {
    if (!documentLike) return false;
    const brpid = this.getDocumentBRPID(documentLike);
    if (/^i\.profession\.sla-/.test(String(brpid ?? "").toLowerCase())) return true;
    return Boolean(
      documentLike.flags?.[game.system.id]?.slaTraining ||
      documentLike.flags?.brp?.slaTraining
    );
  }

  static isSLASpecies(documentLike) {
    if (!documentLike) return false;
    const brpid = this.getDocumentBRPID(documentLike);
    if (/^i\.culture\.sla-/.test(String(brpid ?? "").toLowerCase())) return true;
    return Boolean(
      documentLike.flags?.[game.system.id]?.slaSpecies ||
      documentLike.flags?.brp?.slaSpecies
    );
  }

  static isSLAEbbAbility(documentLike) {
    if (!documentLike) return false;
    const brpid = this.getDocumentBRPID(documentLike);
    if (/^i\.psychic\.sla-/.test(String(brpid ?? "").toLowerCase())) return true;
    return Boolean(
      documentLike.flags?.[game.system.id]?.slaEbb ||
      documentLike.flags?.brp?.slaEbb
    );
  }

  static isSLAArmour(documentLike) {
    if (!documentLike) return false;
    const brpid = this.getDocumentBRPID(documentLike);
    if (/^i\.armour\.sla-/.test(String(brpid ?? "").toLowerCase())) return true;
    return Boolean(
      documentLike.flags?.[game.system.id]?.slaArmour ||
      documentLike.flags?.[game.system.id]?.slaEquipment?.role === "armour" ||
      documentLike.flags?.brp?.slaArmour
    );
  }

  static isSLATrait(documentLike) {
    if (!documentLike) return false;
    const brpid = this.getDocumentBRPID(documentLike);
    if (/^i\.perstrait\.sla2-/.test(String(brpid ?? "").toLowerCase())) return true;
    return Boolean(
      documentLike.flags?.[game.system.id]?.slaTrait ||
      documentLike.flags?.brp?.slaTrait
    );
  }

  static _toBundledAssetPath(path = "") {
    const raw = decodeURIComponent(String(path ?? "").trim());
    if (!raw) return "";
    const normalized = raw.replace(/^\/+/, "");
    const marker = "/SLA_Assets/";
    const idx = normalized.toLowerCase().indexOf(marker.toLowerCase());
    if (idx < 0) return "";
    const suffix = normalized.slice(idx + 1);
    return `systems/sla-industries-brp/${suffix}`;
  }

  static async migrateLegacySLAAssetPaths({
    includeActors = true,
    includeCompendium = true,
    notify = false
  } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, packs: [] };
    }

    let worldUpdated = 0;
    const worldUpdates = [];
    for (const item of game.items ?? []) {
      const nextPath = this._toBundledAssetPath(item.img);
      if (!nextPath || nextPath === item.img) continue;
      worldUpdates.push({ _id: item.id, img: nextPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items ?? []) {
          const nextPath = this._toBundledAssetPath(item.img);
          if (!nextPath || nextPath === item.img) continue;
          updates.push({ _id: item.id, img: nextPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => pack.documentName === "Item");
      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          await this.ensurePackWritable(pack);
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            const nextPath = this._toBundledAssetPath(doc.img);
            if (!nextPath || nextPath === doc.img) continue;
            updates.push({ _id: doc.id, img: nextPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed legacy SLA asset path migration for pack ${pack.collection}`, err);
        }
        if (packUpdated > 0) packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    if (notify && (worldUpdated || actorUpdated || compendiumUpdated)) {
      ui.notifications.info(
        `SLA legacy icon paths migrated: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }
    return { worldUpdated, actorUpdated, compendiumUpdated, packs };
  }

  static async syncSkillIcons({ includeCompendium = true, notify = false } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, compendiumUpdated: 0, packs: [] };
    }

    let worldUpdated = 0;
    const worldUpdates = [];
    for (const item of game.items.filter((i) => i.type === "skill")) {
      const iconName = String(item.system?.mainName || item.name || "").trim();
      if (!iconName) continue;
      const iconPath = await this.getSkillIconPath(iconName);
      if (!iconPath || item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => {
        if (pack.documentName !== "Item") return false;
        const id = String(pack.collection ?? "").toLowerCase();
        return id === "sla-industries-compendium.skills" || id.endsWith(".skills");
      });

      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          await this.ensurePackWritable(pack);
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            if (doc.type !== "skill") continue;
            const iconName = String(doc.system?.mainName || doc.name || "").trim();
            if (!iconName) continue;
            const iconPath = await this.getSkillIconPath(iconName);
            if (!iconPath || doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed skill icon sync for pack ${pack.collection}`, err);
        }
        packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    const summary = { worldUpdated, compendiumUpdated, packs };
    if (notify && (worldUpdated > 0 || compendiumUpdated > 0)) {
      ui.notifications.info(`SLA skill icons synced: world ${worldUpdated}, compendium ${compendiumUpdated}.`);
    }
    return summary;
  }

  static async syncWeaponIcons({ includeCompendium = true, includeActors = true, notify = false } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, packs: [], unmatched: [] };
    }

    let worldUpdated = 0;
    const worldUpdates = [];
    const unmatched = new Set();
    for (const item of game.items.filter((i) => i.type === "weapon")) {
      const iconName = String(item.name ?? "").trim();
      if (!iconName) continue;
      const iconPath = await this.getWeaponIconPath(iconName);
      if (!iconPath) {
        unmatched.add(iconName);
        continue;
      }
      if (item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items.filter((i) => i.type === "weapon")) {
          const iconName = String(item.name ?? "").trim();
          if (!iconName) continue;
          const iconPath = await this.getWeaponIconPath(iconName);
          if (!iconPath) {
            unmatched.add(iconName);
            continue;
          }
          if (item.img === iconPath) continue;
          updates.push({ _id: item.id, img: iconPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => {
        if (pack.documentName !== "Item") return false;
        const id = String(pack.collection ?? "").toLowerCase();
        return id === "sla-industries-compendium.weapons" || id.endsWith(".weapons");
      });

      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          await this.ensurePackWritable(pack);
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            if (doc.type !== "weapon") continue;
            const iconName = String(doc.name ?? "").trim();
            if (!iconName) continue;
            const iconPath = await this.getWeaponIconPath(iconName);
            if (!iconPath) {
              unmatched.add(iconName);
              continue;
            }
            if (doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed weapon icon sync for pack ${pack.collection}`, err);
        }
        packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    const summary = { worldUpdated, actorUpdated, compendiumUpdated, packs, unmatched: [...unmatched].sort() };
    if (notify && (worldUpdated > 0 || actorUpdated > 0 || compendiumUpdated > 0)) {
      ui.notifications.info(
        `SLA weapon icons synced: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }
    if (notify && summary.unmatched.length > 0) {
      ui.notifications.warn(`SLA weapon icon sync: ${summary.unmatched.length} weapon(s) still unmatched. See console.`);
      console.warn("sla-industries-brp | Unmatched SLA weapon icons", summary.unmatched);
    }
    return summary;
  }

  static async syncArmourIcons({ includeCompendium = true, includeActors = true, notify = false } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, packs: [], unmatched: [] };
    }

    let worldUpdated = 0;
    const worldUpdates = [];
    const unmatched = new Set();
    for (const item of game.items.filter((i) => i.type === "armour")) {
      if (!this.isSLAArmour(item)) continue;
      const iconName = String(item.name ?? "").trim();
      if (!iconName) continue;
      const iconPath = await this.getArmourIconPath(iconName);
      if (!iconPath) {
        unmatched.add(iconName);
        continue;
      }
      if (item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items.filter((i) => i.type === "armour")) {
          if (!this.isSLAArmour(item)) continue;
          const iconName = String(item.name ?? "").trim();
          if (!iconName) continue;
          const iconPath = await this.getArmourIconPath(iconName);
          if (!iconPath) {
            unmatched.add(iconName);
            continue;
          }
          if (item.img === iconPath) continue;
          updates.push({ _id: item.id, img: iconPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => {
        if (pack.documentName !== "Item") return false;
        const id = String(pack.collection ?? "").toLowerCase();
        return id === "sla-industries-compendium.armour" || id.endsWith(".armour");
      });

      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          await this.ensurePackWritable(pack);
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            if (doc.type !== "armour" || !this.isSLAArmour(doc)) continue;
            const iconName = String(doc.name ?? "").trim();
            if (!iconName) continue;
            const iconPath = await this.getArmourIconPath(iconName);
            if (!iconPath) {
              unmatched.add(iconName);
              continue;
            }
            if (doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed armour icon sync for pack ${pack.collection}`, err);
        }
        packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    const summary = { worldUpdated, actorUpdated, compendiumUpdated, packs, unmatched: [...unmatched].sort() };
    if (notify && (worldUpdated > 0 || actorUpdated > 0 || compendiumUpdated > 0)) {
      ui.notifications.info(
        `SLA armour icons synced: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }
    if (notify && summary.unmatched.length > 0) {
      ui.notifications.warn(`SLA armour icon sync: ${summary.unmatched.length} armour item(s) still unmatched. See console.`);
      console.warn("sla-industries-brp | Unmatched SLA armour icons", summary.unmatched);
    }
    return summary;
  }

  static async syncTraitIcons({ includeCompendium = true, includeActors = true, notify = false } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, packs: [], unmatched: [] };
    }

    let worldUpdated = 0;
    const worldUpdates = [];
    const unmatched = new Set();
    for (const item of game.items.filter((i) => i.type === "persTrait")) {
      if (!this.isSLATrait(item)) continue;
      const iconName = String(item.name ?? "").trim();
      if (!iconName) continue;
      const iconPath = this.getTraitIconPath(iconName);
      if (!iconPath) {
        unmatched.add(iconName);
        continue;
      }
      if (item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items.filter((i) => i.type === "persTrait")) {
          if (!this.isSLATrait(item)) continue;
          const iconPath = this.getTraitIconPath(item.name);
          if (!iconPath) continue;
          if (item.img === iconPath) continue;
          updates.push({ _id: item.id, img: iconPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => {
        if (pack.documentName !== "Item") return false;
        const id = String(pack.collection ?? "").toLowerCase();
        return id === "sla-industries-compendium.traits" || id.endsWith(".traits");
      });

      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          await this.ensurePackWritable(pack);
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            if (doc.type !== "persTrait" || !this.isSLATrait(doc)) continue;
            const iconPath = this.getTraitIconPath(doc.name);
            if (!iconPath) continue;
            if (doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed trait icon sync for pack ${pack.collection}`, err);
        }
        packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    const summary = { worldUpdated, actorUpdated, compendiumUpdated, packs, unmatched: [...unmatched].sort() };
    if (notify && (worldUpdated > 0 || actorUpdated > 0 || compendiumUpdated > 0)) {
      ui.notifications.info(
        `SLA trait icons synced: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }
    return summary;
  }

  static async syncEbbIcons({ includeCompendium = true, includeActors = true, notify = false } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, packs: [], unmatched: [] };
    }

    let worldUpdated = 0;
    const worldUpdates = [];
    const unmatched = new Set();
    for (const item of game.items.filter((i) => i.type === "psychic")) {
      if (!this.isSLAEbbAbility(item)) continue;
      const iconName = String(item.name ?? "").trim();
      if (!iconName) continue;
      const iconPath = await this.getEbbIconPath(iconName);
      if (!iconPath) {
        unmatched.add(iconName);
        continue;
      }
      if (item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items.filter((i) => i.type === "psychic")) {
          if (!this.isSLAEbbAbility(item)) continue;
          const iconName = String(item.name ?? "").trim();
          if (!iconName) continue;
          const iconPath = await this.getEbbIconPath(iconName);
          if (!iconPath) {
            unmatched.add(iconName);
            continue;
          }
          if (item.img === iconPath) continue;
          updates.push({ _id: item.id, img: iconPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => {
        if (pack.documentName !== "Item") return false;
        const id = String(pack.collection ?? "").toLowerCase();
        return id === "sla-industries-compendium.psychic-abilities" || id.endsWith(".psychic-abilities");
      });

      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          await this.ensurePackWritable(pack);
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            if (doc.type !== "psychic" || !this.isSLAEbbAbility(doc)) continue;
            const iconName = String(doc.name ?? "").trim();
            if (!iconName) continue;
            const iconPath = await this.getEbbIconPath(iconName);
            if (!iconPath) {
              unmatched.add(iconName);
              continue;
            }
            if (doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed Ebb icon sync for pack ${pack.collection}`, err);
        }
        packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    const summary = { worldUpdated, actorUpdated, compendiumUpdated, packs, unmatched: [...unmatched].sort() };
    if (notify && (worldUpdated > 0 || actorUpdated > 0 || compendiumUpdated > 0)) {
      ui.notifications.info(
        `SLA Ebb icons synced: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }
    if (notify && summary.unmatched.length > 0) {
      ui.notifications.warn(`SLA Ebb icon sync: ${summary.unmatched.length} ability(ies) still unmatched. See console.`);
      console.warn("sla-industries-brp | Unmatched SLA Ebb icons", summary.unmatched);
    }
    return summary;
  }

  static async syncSpeciesIcons({ includeCompendium = true, includeActors = true, notify = false } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, packs: [], unmatched: [] };
    }

    let worldUpdated = 0;
    const worldUpdates = [];
    const unmatched = new Set();
    for (const item of game.items.filter((i) => i.type === "culture")) {
      if (!this.isSLASpecies(item)) continue;
      const iconName = String(item.name ?? "").trim();
      if (!iconName) continue;
      const iconPath = await this.getSpeciesIconPath(iconName);
      if (!iconPath) {
        unmatched.add(iconName);
        continue;
      }
      if (item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items.filter((i) => i.type === "culture")) {
          if (!this.isSLASpecies(item)) continue;
          const iconName = String(item.name ?? "").trim();
          if (!iconName) continue;
          const iconPath = await this.getSpeciesIconPath(iconName);
          if (!iconPath) {
            unmatched.add(iconName);
            continue;
          }
          if (item.img === iconPath) continue;
          updates.push({ _id: item.id, img: iconPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => {
        if (pack.documentName !== "Item") return false;
        const id = String(pack.collection ?? "").toLowerCase();
        return id === "sla-industries-compendium.professions" || id.endsWith(".professions") || id.endsWith(".species");
      });

      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          await this.ensurePackWritable(pack);
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            if (doc.type !== "culture" || !this.isSLASpecies(doc)) continue;
            const iconName = String(doc.name ?? "").trim();
            if (!iconName) continue;
            const iconPath = await this.getSpeciesIconPath(iconName);
            if (!iconPath) {
              unmatched.add(iconName);
              continue;
            }
            if (doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed species icon sync for pack ${pack.collection}`, err);
        }
        packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    const summary = { worldUpdated, actorUpdated, compendiumUpdated, packs, unmatched: [...unmatched].sort() };
    if (notify && (worldUpdated > 0 || actorUpdated > 0 || compendiumUpdated > 0)) {
      ui.notifications.info(
        `SLA species icons synced: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }
    if (notify && summary.unmatched.length > 0) {
      ui.notifications.warn(`SLA species icon sync: ${summary.unmatched.length} species still unmatched. See console.`);
      console.warn("sla-industries-brp | Unmatched SLA species icons", summary.unmatched);
    }
    return summary;
  }

  static async syncTrainingPackageIcons({ includeCompendium = true, includeActors = true, notify = false } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, packs: [], unmatched: [] };
    }

    let worldUpdated = 0;
    const worldUpdates = [];
    const unmatched = new Set();
    for (const item of game.items.filter((i) => i.type === "profession")) {
      if (!this.isSLATrainingPackage(item)) continue;
      const iconName = String(item.name ?? "").trim();
      if (!iconName) continue;
      const iconPath = await this.getTrainingPackageIconPath(iconName);
      if (!iconPath) {
        unmatched.add(iconName);
        continue;
      }
      if (item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items.filter((i) => i.type === "profession")) {
          if (!this.isSLATrainingPackage(item)) continue;
          const iconName = String(item.name ?? "").trim();
          if (!iconName) continue;
          const iconPath = await this.getTrainingPackageIconPath(iconName);
          if (!iconPath) {
            unmatched.add(iconName);
            continue;
          }
          if (item.img === iconPath) continue;
          updates.push({ _id: item.id, img: iconPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => {
        if (pack.documentName !== "Item") return false;
        const id = String(pack.collection ?? "").toLowerCase();
        return id === "sla-industries-compendium.professions" || id.endsWith(".professions");
      });

      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          await this.ensurePackWritable(pack);
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            if (doc.type !== "profession" || !this.isSLATrainingPackage(doc)) continue;
            const iconName = String(doc.name ?? "").trim();
            if (!iconName) continue;
            const iconPath = await this.getTrainingPackageIconPath(iconName);
            if (!iconPath) {
              unmatched.add(iconName);
              continue;
            }
            if (doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed training icon sync for pack ${pack.collection}`, err);
        }
        packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    const summary = { worldUpdated, actorUpdated, compendiumUpdated, packs, unmatched: [...unmatched].sort() };
    if (notify && (worldUpdated > 0 || actorUpdated > 0 || compendiumUpdated > 0)) {
      ui.notifications.info(
        `SLA training icons synced: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }
    if (notify && summary.unmatched.length > 0) {
      ui.notifications.warn(`SLA training icon sync: ${summary.unmatched.length} package(s) still unmatched. See console.`);
      console.warn("sla-industries-brp | Unmatched SLA training package icons", summary.unmatched);
    }
    return summary;
  }

  static isSLAAmmoItem(documentLike) {
    if (!documentLike || documentLike.type !== "gear") return false;
    const brpid = this.getDocumentBRPID(documentLike);
    if (/^i\.gear\.sla-ammo-/.test(String(brpid ?? "").toLowerCase())) return true;
    if (documentLike.flags?.[game.system.id]?.slaAmmo || documentLike.flags?.brp?.slaAmmo) return true;
    return Boolean(SLAAmmoCatalog.getAmmoMetaFromItem(documentLike));
  }

  static getAmmoTagFromItem(item) {
    const directTag =
      item?.flags?.[game.system.id]?.slaAmmo?.ammoTag ??
      item?.flags?.brp?.slaAmmo?.ammoTag ??
      "";
    let tag = SLAAmmoCatalog.normalizeTag(directTag || "STD");

    const name = String(item?.name ?? "");
    const match = name.match(/(?:\[|\b)(HEAP|HE|AP|STD|SUB|TRACER)(?:\]|\b)/i);
    if (match?.[1]) {
      tag = SLAAmmoCatalog.normalizeTag(match[1]);
    }

    if (!this.AMMO_ICON_TAGS.has(tag)) return "STD";
    return tag;
  }

  static getAmmoIconPath(item) {
    const meta = SLAAmmoCatalog.getAmmoMetaFromItem(item);
    if (!meta) return null;
    const tag = this.getAmmoTagFromItem(item);
    return SLAAmmoCatalog.buildAmmoIconPath(meta.calibreKey ?? meta.calibreLabel ?? "", tag);
  }

  static async syncAmmoIcons({ includeCompendium = true, includeActors = true, notify = false } = {}) {
    if (!game.user?.isGM) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, packs: [], unmatched: [] };
    }

    let worldUpdated = 0;
    const worldUpdates = [];
    const unmatched = new Set();
    for (const item of game.items.filter((i) => i.type === "gear")) {
      if (!this.isSLAAmmoItem(item)) continue;
      const iconPath = this.getAmmoIconPath(item);
      if (!iconPath) {
        unmatched.add(String(item.name ?? "").trim());
        continue;
      }
      if (item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items.filter((i) => i.type === "gear")) {
          if (!this.isSLAAmmoItem(item)) continue;
          const iconPath = this.getAmmoIconPath(item);
          if (!iconPath) {
            unmatched.add(String(item.name ?? "").trim());
            continue;
          }
          if (item.img === iconPath) continue;
          updates.push({ _id: item.id, img: iconPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => pack.documentName === "Item");
      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          await this.ensurePackWritable(pack);
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            if (doc.type !== "gear" || !this.isSLAAmmoItem(doc)) continue;
            const iconPath = this.getAmmoIconPath(doc);
            if (!iconPath) {
              unmatched.add(String(doc.name ?? "").trim());
              continue;
            }
            if (doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed ammo icon sync for pack ${pack.collection}`, err);
        }
        if (packUpdated > 0) packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    const summary = { worldUpdated, actorUpdated, compendiumUpdated, packs, unmatched: [...unmatched].sort() };
    if (notify && (worldUpdated > 0 || actorUpdated > 0 || compendiumUpdated > 0)) {
      ui.notifications.info(
        `SLA ammo icons synced: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }
    if (notify && summary.unmatched.length > 0) {
      ui.notifications.warn(`SLA ammo icon sync: ${summary.unmatched.length} item(s) unmatched. See console.`);
      console.warn("sla-industries-brp | Unmatched SLA ammo icons", summary.unmatched);
    }
    return summary;
  }

  static resolveSkillFromCache(skillRef) {
    const norm = this.normalizeText(skillRef);
    if (!norm || !this._skillNameCache) return "none";
    if (this._skillNameCache.has(norm)) return this._skillNameCache.get(norm);
    for (const [key, brpid] of this._skillNameCache.entries()) {
      if (key.includes(norm) || norm.includes(key)) return brpid;
    }
    return "none";
  }

  static expandSkillRefCandidates(skillRef) {
    const candidates = [skillRef];
    const clean = String(skillRef ?? "").trim();
    if (!clean) return [];
    for (const part of clean.split(/\s+or\s+|\/|,|;/i)) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (!candidates.includes(trimmed)) candidates.push(trimmed);
    }
    return candidates;
  }

  static resolveSkillAlias(skillRef) {
    const aliasMap = {
      brawl: ["Brawl"],
      meleeweaponany: ["Melee Blade 1H", "Melee Club", "Melee Axe", "Brawl"],
      meleeweaponknife: ["Melee Blade 1H", "Brawl"],
      meleeweaponclub: ["Melee Club", "Brawl"],
      meleeweaponsword: ["Melee Blade 1H", "Melee Blade 2H"],
      meleeweaponaxe: ["Melee Axe", "Brawl"],
      meleeweapon2hsword: ["Melee Blade 2H", "Melee Blade 1H"],
      shieldriot: ["Melee Club", "Brawl"],
      naturalweaponclaws: ["Brawl"],
      throw: ["Throw", "Athletics"],
      stealth: ["Athletics", "Streetwise"],
      firearmpistol: ["Firearm (Pistol)"],
      firearmsmg: ["Firearm (SMG)", "Firearm (Auto/Support)", "Firearm (Pistol)"],
      firearmrifle: ["Firearm (Rifle/Shotgun)"],
      firearmshotgun: ["Firearm (Rifle/Shotgun)"],
      firearmheavy: ["Firearm (Auto/Support)", "Firearm (Rifle/Shotgun)"],
      firearmautosupport: ["Firearm (Auto/Support)"],
      martialarts: ["Brawl", "Melee Blade 1H"],
      athleticsrunning: ["Athletics"],
      knowledge: ["SLA Info"],
      technicalcomputers: ["Tech (Computers & AI)", "Computer Systems"],
      technicalelectronics: ["Tech (Electronics)"],
      technicalmechanical: ["Tech (Mechanical)"],
      technicalmilitary: ["Tech (Military)"],
      medicine: ["Medical"],
      firstaid: ["Medical"],
      strategy: ["Tactics"],
      knowledgeslacorp: ["SLA Info"],
      knowledgerivals: ["SLA Info"],
      spot: ["Spot Hidden"],
      pilotmilitary: ["Pilot"],
      driveany: ["Drive (Civilian)", "Drive (Military)"],
      craftspecialty: ["Craft (Specialty)"],
      craft: ["Craft (Specialty)"]
    };

    const key = this.normalizeText(skillRef);
    const aliases = aliasMap[key] ?? [];
    for (const alias of aliases) {
      const brpid = this.resolveSkillFromCache(alias);
      if (brpid !== "none") return brpid;
    }
    return "none";
  }

  static toFormula(value) {
    if (!value || typeof value !== "string") return "3d6";
    return value.trim().toLowerCase();
  }

  static extractMove(notes) {
    for (const note of notes) {
      const match = /MOV\s+(\d+)/i.exec(note);
      if (match) return Number(match[1]);
    }
    return 10;
  }

  static notesToHtml(notes) {
    if (!notes.length) return "";
    return `<ul>${notes.map((n) => `<li>${n}</li>`).join("")}</ul>`;
  }

  static packageToHtml(pkg, meta, loadout = {}) {
    const wealth = pkg.wealth ? `<p><strong>Wealth:</strong> ${pkg.wealth}</p>` : "";
    const professionalPool = Number(meta.professionalSkillPool ?? meta.defaultSkillPoints ?? 300);
    const generalPool = Number(meta.generalSkillPool ?? 120);
    const perSkillPro = Number(meta.professionalSkillMax ?? 45);
    const perSkillGeneral = Number(meta.generalSkillMax ?? 25);
    const cap = Number(meta.creationSkillCap ?? 75);
    const points = professionalPool
      ? `<p><strong>Skill Pools:</strong> Professional ${professionalPool} (max ${perSkillPro}/skill), General ${generalPool} (max ${perSkillGeneral}/skill), Creation cap ${cap}%</p>`
      : "";
    const credits = meta.startingCredits
      ? `<p><strong>Starting Credits:</strong> ${meta.startingCredits}</p>`
      : "";
    const skills = `<ul>${(pkg.skills ?? []).map((s) => `<li>${s}</li>`).join("")}</ul>`;
    const weapons = (loadout.weapons ?? []).length
      ? `<p><strong>Default Weapons</strong></p><ul>${loadout.weapons.map((s) => `<li>${s}</li>`).join("")}</ul>`
      : "";
    const armour = (loadout.armour ?? []).length
      ? `<p><strong>Default Armour</strong></p><ul>${loadout.armour.map((s) => `<li>${s}</li>`).join("")}</ul>`
      : "";
    return `${wealth}${points}${credits}<p><strong>Core Skills</strong></p>${skills}${weapons}${armour}`;
  }
}
