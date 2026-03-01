import { BRPUtilities } from "./utilities.mjs";
import { BRPactorItemDrop } from "../actor/actor-itemDrop.mjs";
import { SLASeedImporter } from "./sla-seed-importer.mjs";
import { SLASkillPoints } from "./sla-skill-points.mjs";

const STAT_KEYS = ["str", "con", "siz", "int", "pow", "dex", "cha", "edu"];

export class SLACharacterGenerator {
  static async createCharacter({
    name = "New Operative",
    species = "Human",
    packageName = null,
    rollCharacteristics = true,
    assignLoadout = true,
    pulpSla = null
  } = {}) {
    await this.applyPulpRuleChoice(pulpSla);

    const actor = await Actor.create({
      name,
      type: "character"
    });
    await SLASkillPoints.initializeForActor({
      actor,
      trainingPackage: null,
      resetAllocations: false,
      creationMode: true
    });

    const applied = await this.applyTemplate({
      actor,
      species,
      packageName,
      rollCharacteristics,
      assignLoadout
    });

    ui.notifications.info(
      `SLA character generated: ${actor.name} (${applied.species ?? "Unknown"} / ${applied.trainingPackage ?? "No package"})`
    );
    return { actor, ...applied };
  }

  static async applyPulpRuleChoice(pulpSla = null) {
    if (pulpSla === null || pulpSla === undefined) return;
    if (!game.user?.isGM) return;
    const enabled = Boolean(pulpSla);
    const current = Boolean(game.settings.get("sla-industries-brp", "pulpSla"));
    if (current === enabled) return;
    await game.settings.set("sla-industries-brp", "pulpSla", enabled);
  }

  static async applyTemplate({
    actor,
    species,
    packageName = null,
    rollCharacteristics = true,
    assignLoadout = true,
    overwrite = true
  } = {}) {
    const actorDoc = this.resolveActor(actor);
    if (!actorDoc) {
      throw new Error("SLACharacterGenerator.applyTemplate requires a valid actor.");
    }

    const speciesDoc = await this.resolveSeedItem({
      type: "culture",
      ref: species,
      folderName: "SLA Species"
    });
    if (!speciesDoc) {
      throw new Error(`Unable to find SLA species: ${species}`);
    }

    const speciesResult = await this.applySpecies({
      actor: actorDoc,
      species: speciesDoc,
      rollCharacteristics,
      overwrite
    });

    const trainingPackageDoc = await this.resolveStarterPackage(speciesDoc, packageName);
    let packageResult = { applied: false, trainingPackage: null };
    if (trainingPackageDoc) {
      packageResult = await this.applyTrainingPackage({
        actor: actorDoc,
        trainingPackage: trainingPackageDoc,
        assignLoadout,
        overwrite
      });
    } else {
      ui.notifications.warn("No SLA training package found for starter assignment.");
    }

    return {
      species: speciesResult.species,
      rolls: speciesResult.rolls,
      trainingPackage: packageResult.trainingPackage,
      skills: packageResult.skills,
      loadout: packageResult.loadout
    };
  }

  static async applySpecies({
    actor,
    species,
    rollCharacteristics = true,
    overwrite = true
  } = {}) {
    const actorDoc = this.resolveActor(actor);
    const speciesDoc = await this.resolveSeedItem({
      type: "culture",
      ref: species,
      folderName: "SLA Species"
    });

    if (!actorDoc || !speciesDoc) {
      throw new Error("applySpecies requires a valid actor and species.");
    }

    if (overwrite) {
      await this.clearActorCulture(actorDoc);
    }

    const speciesBrpid = this.getBRPID(speciesDoc);
    const hasSpecies = actorDoc.items.some(
      (item) => item.type === "culture" && this.getBRPID(item) === speciesBrpid
    );
    if (!hasSpecies) {
      await actorDoc.createEmbeddedDocuments("Item", [this.toEmbeddedData(speciesDoc)]);
    }

    const speciesMeta = this.getScopeFlag(speciesDoc, "slaSpecies") ?? {};
    const updates = {
      "system.culture": speciesDoc.name,
      "system.move": Number(speciesDoc.system?.move ?? actorDoc.system.move ?? 0)
    };

    if (Number.isFinite(Number(speciesMeta.startingScl))) {
      updates["system.sla.scl"] = Number(speciesMeta.startingScl);
    }

    const rolls = {};
    for (const key of STAT_KEYS) {
      const stat = speciesDoc.system?.stats?.[key];
      if (!stat) continue;

      const formula = String(stat.formula ?? "").trim();
      updates[`system.stats.${key}.formula`] = formula;
      updates[`system.stats.${key}.culture`] = Number(stat.mod ?? 0);

      if (rollCharacteristics && formula) {
        const rolled = await this.rollFormula(formula);
        if (rolled !== null) {
          updates[`system.stats.${key}.base`] = rolled;
          rolls[key] = rolled;
        }
      }
    }

    await actorDoc.update(updates);

    // Keep SLA skill roster aligned with species for both manual and auto template flows.
    if (game.brp?.BRPActor?.ensureSLASkillRoster) {
      const includeEbb = game.brp?.SLAEbbSystem?.isEbbSpecies?.(actorDoc) ?? false;
      await game.brp.BRPActor.ensureSLASkillRoster(actorDoc, {
        includeEbb,
        pruneEbbForNonEligible: true
      });
    }

    const skillBonuses = Array.isArray(speciesMeta.skillBonuses) ? speciesMeta.skillBonuses : [];
    const skillBonusResult = await this.applySpeciesSkillBonuses(actorDoc, skillBonuses);
    const choiceBonuses = Array.isArray(speciesMeta.choiceBonuses) ? speciesMeta.choiceBonuses : [];
    if (choiceBonuses.length) {
      await actorDoc.setFlag(game.system.id, "slaPendingSkillChoices", choiceBonuses);
      const totalChoices = choiceBonuses.reduce(
        (acc, row) => acc + Math.max(0, Number(row?.count ?? 0)),
        0
      );
      if (totalChoices > 0) {
        ui.notifications.info(
          `${actorDoc.name}: ${speciesDoc.name} has ${totalChoices} unassigned species skill choice bonus(es).`
        );
      }
    } else {
      await actorDoc.unsetFlag(game.system.id, "slaPendingSkillChoices");
    }

    return {
      applied: true,
      species: speciesDoc.name,
      rolls,
      skillBonuses: skillBonusResult,
      pendingChoices: choiceBonuses
    };
  }

  static async applySpeciesSkillBonuses(actor, bonusRows = []) {
    const normalized = [];
    for (const row of bonusRows ?? []) {
      const skillRef = String(row?.skillRef ?? row?.ref ?? "").trim();
      const bonus = Number(row?.bonus ?? 0);
      if (!skillRef || !Number.isFinite(bonus) || bonus === 0) continue;
      normalized.push({ skillRef, bonus });
    }
    if (!normalized.length) {
      return { created: 0, updated: 0, missing: [], applied: [] };
    }

    const aggregate = new Map();
    const missing = [];
    for (const row of normalized) {
      const brpid = await SLASeedImporter.resolveSkillBrpid(row.skillRef);
      if (!brpid || brpid === "none") {
        missing.push(row.skillRef);
        continue;
      }
      aggregate.set(brpid, Number(aggregate.get(brpid) ?? 0) + row.bonus);
    }

    const ensured = await this.ensureSkills(actor, [...aggregate.keys()], "culture");
    const updates = [];
    const applied = [];
    for (const item of actor.items.filter((i) => i.type === "skill")) {
      const brpid = this.getBRPID(item);
      if (!brpid || !aggregate.has(brpid)) continue;
      const delta = Number(aggregate.get(brpid) ?? 0);
      const next = Number(item.system?.culture ?? 0) + delta;
      updates.push({
        _id: item.id,
        "system.cultural": true,
        "system.culture": next
      });
      applied.push({ name: item.name, bonus: delta });
    }
    if (updates.length) {
      await Item.updateDocuments(updates, { parent: actor });
    }

    return {
      created: ensured.created,
      updated: ensured.updated + updates.length,
      missing: [...new Set([...(ensured.missing ?? []), ...missing])],
      applied
    };
  }

  static async applyTrainingPackage({
    actor,
    trainingPackage,
    assignLoadout = true,
    overwrite = true
  } = {}) {
    const actorDoc = this.resolveActor(actor);
    const packageDoc = await this.resolveSeedItem({
      type: "profession",
      ref: trainingPackage,
      folderName: "SLA Training Packages"
    });

    if (!actorDoc || !packageDoc) {
      throw new Error("applyTrainingPackage requires a valid actor and profession package.");
    }

    if (overwrite) {
      await this.clearActorProfession(actorDoc);
    }

    const packageBrpid = this.getBRPID(packageDoc);
    const hasPackage = actorDoc.items.some(
      (item) => item.type === "profession" && this.getBRPID(item) === packageBrpid
    );
    if (!hasPackage) {
      await actorDoc.createEmbeddedDocuments("Item", [this.toEmbeddedData(packageDoc)]);
    }

    const trainingMeta = this.getScopeFlag(packageDoc, "slaTraining") ?? {};
    const skillBrpids = await this.resolveTrainingSkillBrpids(packageDoc, trainingMeta);

    const skills = await this.ensureSkills(actorDoc, skillBrpids, "profession");

    let weaponBrpids = [...(trainingMeta.weaponBrpids ?? [])];
    let armourBrpids = [...(trainingMeta.armourBrpids ?? [])];
    if (assignLoadout && (!weaponBrpids.length && !armourBrpids.length)) {
      const fallback = await this.resolveLoadoutFromSeedNames(packageDoc.name);
      weaponBrpids = fallback.weaponBrpids;
      armourBrpids = fallback.armourBrpids;
    }

    const loadout = assignLoadout
      ? await this.ensureEquipment(actorDoc, weaponBrpids, armourBrpids)
      : { createdWeapons: 0, createdArmour: 0, missing: [], skipped: true };

    const updates = {
      "system.professionName": packageDoc.name,
      "system.creationMode": true,
      "system.trainingPackage.name": packageDoc.name,
      "system.trainingPackage.professionalSkills": [...skillBrpids]
    };
    if (Number.isFinite(Number(trainingMeta.startingCredits))) {
      updates["system.wealthValue"] = Number(trainingMeta.startingCredits);
    }
    await actorDoc.update(updates);
    await SLASkillPoints.initializeForActor({
      actor: actorDoc,
      trainingPackage: packageDoc,
      resetAllocations: Boolean(overwrite),
      preserveGeneral: !overwrite,
      creationMode: true,
      seedPackageProfessional: true,
      professionalSeedPerSkill: 20
    });

    if (!skillBrpids.length) {
      ui.notifications.warn(`${actorDoc.name}: ${packageDoc.name} has no resolved professional skills. Check package seed/link data.`);
    }

    return {
      applied: true,
      trainingPackage: packageDoc.name,
      skills,
      loadout
    };
  }

  static async resolveTrainingSkillBrpids(packageDoc, trainingMeta = null) {
    const resolved = [];
    const add = (brpid) => {
      const value = String(brpid ?? "").trim();
      if (!value || value === "none" || resolved.includes(value)) return;
      resolved.push(value);
    };

    const meta = trainingMeta ?? this.getScopeFlag(packageDoc, "slaTraining") ?? {};
    for (const brpid of (meta.skillBrpids ?? [])) {
      add(brpid);
    }

    if (!resolved.length) {
      for (const ref of (meta.skillRefs ?? [])) {
        const brpid = await SLASeedImporter.resolveSkillBrpid(ref);
        add(brpid);
      }
    }

    if (!resolved.length) {
      for (const row of (packageDoc?.system?.skills ?? [])) {
        add(row?.brpid);
      }
    }

    if (!resolved.length) {
      const seed = await SLASeedImporter.loadSeed("training-packages.json").catch(() => null);
      const rows = Array.isArray(seed?.packages) ? seed.packages : [];
      const match = rows.find((row) =>
        String(row?.name ?? "").trim().toLowerCase() === String(packageDoc?.name ?? "").trim().toLowerCase()
      );
      if (match) {
        for (const ref of (match.skills ?? [])) {
          const brpid = await SLASeedImporter.resolveSkillBrpid(ref);
          add(brpid);
        }
      }
    }

    return resolved;
  }

  static async resolveStarterPackage(speciesDoc, packageName = null) {
    if (packageName) {
      return this.resolveSeedItem({
        type: "profession",
        ref: packageName,
        folderName: "SLA Training Packages"
      });
    }

    const speciesMeta = this.getScopeFlag(speciesDoc, "slaSpecies") ?? {};
    if (speciesMeta.starterPackage) {
      const fromSpecies = await this.resolveSeedItem({
        type: "profession",
        ref: speciesMeta.starterPackage,
        folderName: "SLA Training Packages"
      });
      if (fromSpecies) return fromSpecies;
    }

    const folder = this.findFolder("SLA Training Packages");
    const choices = game.items.filter(
      (item) => item.type === "profession" && (!folder || item.folder?.id === folder.id)
    );
    choices.sort((a, b) => a.name.localeCompare(b.name));
    return choices[0] ?? null;
  }

  static async resolveSeedItem({ type, ref, folderName } = {}) {
    if (!ref) return null;
    if (ref.type === type) return ref;

    let byBrpid = null;
    if (typeof ref === "string" && ref.startsWith("i.")) {
      byBrpid = await this.resolveByBrpid(ref, type);
      if (byBrpid) return byBrpid;
    }

    const folder = this.findFolder(folderName);
    const pool = game.items.filter(
      (item) => item.type === type && (!folder || item.folder?.id === folder.id)
    );
    if (!pool.length) return byBrpid;

    const normRef = this.normalizeText(ref);
    const exact = pool.find((item) => this.normalizeText(item.name) === normRef);
    if (exact) return exact;

    const fuzzy = pool.find((item) => this.normalizeText(item.name).includes(normRef));
    if (fuzzy) return fuzzy;

    if (typeof ref === "string") {
      const slug = BRPUtilities.toKebabCase(ref);
      const expectedBrpid = `i.${type}.sla-${slug}`;
      byBrpid = await this.resolveByBrpid(expectedBrpid, type);
      if (byBrpid) return byBrpid;
    }

    return null;
  }

  static async resolveByBrpid(brpid, type = null) {
    const matches = await game.system.api.brpid.fromBRPIDBest({ brpid });
    if (!type) return matches[0] ?? null;
    return matches.find((doc) => doc.type === type) ?? null;
  }

  static async clearActorCulture(actor) {
    const updates = [];
    for (const item of actor.items) {
      if (["skill", "magic", "psychic"].includes(item.type)) {
        updates.push({
          _id: item.id,
          "system.cultural": false,
          "system.culture": 0
        });
      }
    }
    if (updates.length) {
      await Item.updateDocuments(updates, { parent: actor });
    }

    const cultures = actor.items.filter((item) => item.type === "culture").map((item) => item.id);
    if (cultures.length) {
      await actor.deleteEmbeddedDocuments("Item", cultures);
    }
  }

  static async clearActorProfession(actor) {
    const updates = [];
    for (const item of actor.items) {
      if (["skill", "magic", "psychic"].includes(item.type)) {
        updates.push({
          _id: item.id,
          "system.occupation": false,
          "system.profession": 0
        });
      }
    }
    if (updates.length) {
      await Item.updateDocuments(updates, { parent: actor });
    }

    const professions = actor.items.filter((item) => item.type === "profession").map((item) => item.id);
    if (professions.length) {
      await actor.deleteEmbeddedDocuments("Item", professions);
    }
  }

  static async ensureSkills(actor, skillBrpids = [], source = "profession") {
    const unique = [...new Set(skillBrpids.filter((id) => id && id !== "none"))];
    const existing = new Map();
    for (const item of actor.items.filter((i) => i.type === "skill")) {
      const id = this.getBRPID(item);
      if (id) existing.set(id, item);
    }

    const createData = [];
    const updateData = [];
    const missing = [];

    for (const brpid of unique) {
      const current = existing.get(brpid);
      if (current) {
        if (source === "profession") {
          updateData.push({ _id: current.id, "system.occupation": true });
        } else if (source === "culture") {
          updateData.push({ _id: current.id, "system.cultural": true });
        }
        continue;
      }

      const sourceDoc = await this.resolveByBrpid(brpid, "skill");
      if (!sourceDoc) {
        missing.push(brpid);
        continue;
      }

      const data = this.toEmbeddedData(sourceDoc);
      data.system = data.system ?? {};
      if (source === "profession") {
        data.system.occupation = true;
      } else if (source === "culture") {
        data.system.cultural = true;
      }
      data.system.base = await BRPactorItemDrop._calcBase(data, actor);
      createData.push(data);
    }

    if (createData.length) {
      await actor.createEmbeddedDocuments("Item", createData);
    }
    if (updateData.length) {
      await Item.updateDocuments(updateData, { parent: actor });
    }

    return {
      created: createData.length,
      updated: updateData.length,
      missing
    };
  }

  static async ensureEquipment(actor, weaponBrpids = [], armourBrpids = []) {
    const existing = new Set();
    for (const item of actor.items.filter((i) => i.type === "weapon" || i.type === "armour")) {
      const brpid = this.getBRPID(item);
      if (brpid) existing.add(brpid);
    }

    const createData = [];
    const missing = [];
    let createdWeapons = 0;
    let createdArmour = 0;

    const ensureList = async (list, expectedType) => {
      for (const brpid of [...new Set((list ?? []).filter((id) => id && id !== "none"))]) {
        if (existing.has(brpid)) continue;
        const sourceDoc = await this.resolveByBrpid(brpid, expectedType);
        if (!sourceDoc) {
          missing.push(brpid);
          continue;
        }
        const data = this.toEmbeddedData(sourceDoc);
        data.system = data.system ?? {};
        data.system.equipStatus = "carried";
        if (expectedType === "weapon") {
          data.system.ammoCurr = Number(data.system.ammo ?? data.system.ammoCurr ?? 0);
          data.system.ammoLoadedType = String(data.system.ammoLoadedType ?? data.system.ammoTag ?? "STD").toUpperCase();
          createdWeapons++;
        } else {
          createdArmour++;
        }
        createData.push(data);
      }
    };

    await ensureList(weaponBrpids, "weapon");
    await ensureList(armourBrpids, "armour");

    if (createData.length) {
      await actor.createEmbeddedDocuments("Item", createData);
    }

    return {
      createdWeapons,
      createdArmour,
      missing
    };
  }

  static async resolveLoadoutFromSeedNames(packageName) {
    const out = {
      weaponBrpids: [],
      armourBrpids: []
    };

    const data = await SLASeedImporter.loadSeed("equipment.json").catch(() => null);
    if (!data) return out;

    const loadout = data.packageLoadouts?.[packageName];
    if (!loadout) return out;

    const weaponPool = game.items.filter((item) => item.type === "weapon");
    const armourPool = game.items.filter((item) => item.type === "armour");
    const weaponIndex = this.indexByName(weaponPool);
    const armourIndex = this.indexByName(armourPool);

    for (const name of loadout.weapons ?? []) {
      const item = weaponIndex.get(this.normalizeText(name));
      const brpid = this.getBRPID(item);
      if (brpid) out.weaponBrpids.push(brpid);
    }
    for (const name of loadout.armour ?? []) {
      const item = armourIndex.get(this.normalizeText(name));
      const brpid = this.getBRPID(item);
      if (brpid) out.armourBrpids.push(brpid);
    }

    return out;
  }

  static resolveActor(actor) {
    if (!actor) return null;
    if (actor instanceof Actor) return actor;
    if (typeof actor === "string") {
      return game.actors.get(actor) ?? game.actors.getName(actor) ?? null;
    }
    if (actor.id) {
      return game.actors.get(actor.id) ?? null;
    }
    return null;
  }

  static findFolder(name) {
    return game.folders.find(
      (folder) => folder.type === "Item" && folder.name === name && !folder.folder
    );
  }

  static toEmbeddedData(item) {
    const data = item.toObject();
    delete data._id;
    delete data.folder;
    delete data.sort;
    delete data.ownership;
    delete data.pack;

    const brpid = this.getBRPID(item);
    if (brpid) {
      data.flags = SLASeedImporter.buildFlags(brpid, data.flags ?? {});
    }
    return data;
  }

  static getBRPID(document) {
    if (!document) return null;
    return document.flags?.[game.system.id]?.brpidFlag?.id ?? document.flags?.brp?.brpidFlag?.id ?? null;
  }

  static getScopeFlag(document, key) {
    if (!document) return null;
    return document.flags?.[game.system.id]?.[key] ?? document.flags?.brp?.[key] ?? null;
  }

  static indexByName(items) {
    const map = new Map();
    for (const item of items) {
      map.set(this.normalizeText(item.name), item);
    }
    return map;
  }

  static normalizeText(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static async rollFormula(formula) {
    try {
      const roll = new Roll(formula);
      await roll.evaluate();
      return Number(roll.total ?? roll.result ?? 0);
    } catch (err) {
      console.warn("sla-industries-brp | Could not roll formula", { formula, err });
      return null;
    }
  }
}
