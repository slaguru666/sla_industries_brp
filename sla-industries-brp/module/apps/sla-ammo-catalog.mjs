export class SLAAmmoCatalog {
  static AMMO_ICON_PATH = "modules/sla-industries-compendium/assets/SLA_Assets/Ammo";

  static BASE_CALIBRES = [
    { key: "3mm", label: "3mm", cost: 1, group: "Handgun", typical: "FEN 603, machine pistols" },
    { key: "5mm", label: "5mm", cost: 2, group: "Handgun", typical: "Compact pistols, light SMGs" },
    { key: "8mm", label: "8mm", cost: 4, group: "Handgun", typical: "Heavy pistols (GA 50 class)" },
    { key: "10mm-pistol", label: "10mm (pistol)", cost: 5, group: "Handgun", typical: "Heavy autos, SMG sidearms" },
    { key: "12mm", label: "12mm", cost: 8, group: "Handgun", typical: "Magnum pistols, hand cannons" },
    { key: "3mm-smg", label: "3mm SMG", cost: 1, group: "SMG / PDW", typical: "Micro-SMGs, machine pistols" },
    { key: "5mm-smg", label: "5mm SMG", cost: 2, group: "SMG / PDW", typical: "FEN 204 light loads" },
    { key: "10mm-smg", label: "10mm SMG", cost: 5, group: "SMG / PDW", typical: "Heavy SMGs" },
    { key: "5mm-rifle", label: "5mm rifle", cost: 3, group: "Rifle / Carbine", typical: "Light carbines, PDWs" },
    { key: "7mm-rifle", label: "7mm rifle", cost: 6, group: "Rifle / Carbine", typical: "FEN AR-class rifles" },
    { key: "8mm-rifle", label: "8mm rifle", cost: 8, group: "Rifle / Carbine", typical: "Battle rifles, DMRs, sniper" },
    { key: "10mm-rifle", label: "10mm rifle", cost: 12, group: "Rifle / Carbine", typical: "Heavy battle rifles" },
    { key: "12-gauge", label: "12-gauge", cost: 4, group: "Shotgun", typical: "Combat buck/slug shells" },
    { key: "10-gauge", label: "10-gauge", cost: 6, group: "Shotgun", typical: "Heavy buck/slug shells" },
    { key: "12-gauge-he", label: "12-gauge HE", cost: 10, group: "Shotgun", typical: "HE shotgun shells" },
    { key: "10-gauge-he", label: "10-gauge HE", cost: 14, group: "Shotgun", typical: "Heavy HE shells" },
    { key: "20mm-hedp", label: "20mm HEDP", cost: 60, group: "Heavy / Launcher", typical: "Autocannons, heavy rifles" },
    { key: "25mm-he", label: "25mm HE", cost: 80, group: "Heavy / Launcher", typical: "Autocannons, vehicle weapons" },
    { key: "30mm-heat", label: "30mm HEAT", cost: 120, group: "Heavy / Launcher", typical: "Vehicle armour-killer rounds" },
    { key: "40mm-he-grenade", label: "40mm HE grenade", cost: 40, group: "Heavy / Launcher", typical: "MILA / underslung HE" },
    { key: "40mm-smoke-gas", label: "40mm smoke / gas", cost: 25, group: "Heavy / Launcher", typical: "Obscurant and riot control" }
  ];

  static TAG_RULES = {
    STD: { label: "STD", multiplier: 1, flatAdd: 0, rule: "Standard ammunition" },
    AP: { label: "AP", multiplier: 2, flatAdd: 0, rule: "Armour piercing" },
    HE: { label: "HE", multiplier: 3, flatAdd: 0, rule: "High explosive" },
    HEAP: { label: "HEAP", multiplier: 4, flatAdd: 0, rule: "High explosive armour piercing" },
    SUB: { label: "Subsonic", multiplier: 1.5, flatAdd: 0, rule: "Subsonic ammunition" },
    TRACER: { label: "Tracer", multiplier: 1, flatAdd: 1, rule: "Tracer rounds" }
  };

  static MECHANICAL_TAGS = ["STD", "AP", "HE", "HEAP"];

  static _calibreIndex = null;
  static _aliasIndex = null;

  static normalizeText(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static normalizeTag(tag = "STD") {
    const key = String(tag ?? "").trim().toUpperCase();
    if (this.TAG_RULES[key]) return key;
    return "STD";
  }

  static getCalibreIndex() {
    if (this._calibreIndex) return this._calibreIndex;
    this._calibreIndex = new Map();
    for (const calibre of this.BASE_CALIBRES) {
      this._calibreIndex.set(calibre.key, calibre);
      this._calibreIndex.set(this.normalizeText(calibre.label), calibre);
    }
    return this._calibreIndex;
  }

  static getAliasIndex() {
    if (this._aliasIndex) return this._aliasIndex;
    this._aliasIndex = new Map([
      ["3mm", "3mm"],
      ["5mm", "5mm"],
      ["8mm", "8mm"],
      ["10mmpistol", "10mm-pistol"],
      ["12mm", "12mm"],
      ["3mmsmg", "3mm-smg"],
      ["5mmsmg", "5mm-smg"],
      ["10mmsmg", "10mm-smg"],
      ["5mmrifle", "5mm-rifle"],
      ["7mmrifle", "7mm-rifle"],
      ["8mmrifle", "8mm-rifle"],
      ["10mmrifle", "10mm-rifle"],
      ["12gauge", "12-gauge"],
      ["10gauge", "10-gauge"],
      ["12gaugehe", "12-gauge-he"],
      ["10gaugehe", "10-gauge-he"],
      ["20mmhedp", "20mm-hedp"],
      ["25mmhe", "25mm-he"],
      ["30mmheat", "30mm-heat"],
      ["40mmhegrenade", "40mm-he-grenade"],
      ["40mmsmokegas", "40mm-smoke-gas"]
    ]);
    return this._aliasIndex;
  }

  static resolveCalibre(value = "") {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const key = this.normalizeText(raw);
    const alias = this.getAliasIndex().get(key) ?? null;
    if (alias) return this.getCalibreIndex().get(alias) ?? null;
    return this.getCalibreIndex().get(key) ?? null;
  }

  static deriveWeaponCalibre(weapon) {
    const explicit = weapon?.system?.ammoCalibre ?? weapon?.ammoCalibre ?? "";
    const resolvedExplicit = this.resolveCalibre(explicit);
    if (resolvedExplicit) return resolvedExplicit;

    const fallback = weapon?.system?.ammoType ?? weapon?.ammoType ?? "";
    const resolvedFallback = this.resolveCalibre(fallback);
    if (resolvedFallback) return resolvedFallback;

    const text = `${weapon?.name ?? ""} ${weapon?.ammoText ?? ""} ${(weapon?.notes ?? []).join(" ")}`.toLowerCase();
    const rules = [
      [/fen\s*603\s*heavy|heavy pistol|ga\s*50|finisher/, "8mm"],
      [/fen\s*603|auto[\s-]*pistol/, "3mm"],
      [/shiver pistol|fen\s*401/, "5mm"],
      [/gunhead|fen\s*204/, "5mm-smg"],
      [/fen\s*209|machine pistol/, "3mm-smg"],
      [/fen\s*ar|assault rifle/, "7mm-rifle"],
      [/sniper|fen\s*981/, "8mm-rifle"],
      [/urban carbine|fen\s*701|carbine/, "5mm-rifle"],
      [/street sweeper|auto-shotgun|kps|mangler|shotgun/, "12-gauge"],
      [/reaper|lmg/, "7mm-rifle"],
      [/mila|40mm/, "40mm-he-grenade"]
    ];
    for (const [re, calibreKey] of rules) {
      if (re.test(text)) {
        return this.getCalibreIndex().get(calibreKey) ?? null;
      }
    }
    return null;
  }

  static collectSeededAmmoCalibreKeys() {
    const keys = new Set();
    for (const item of game.items ?? []) {
      if (item.type !== "gear") continue;
      const meta = this.getAmmoMetaFromItem(item);
      if (!meta?.calibreKey) continue;
      keys.add(meta.calibreKey);
    }
    return keys;
  }

  static getCostPerRound(calibreKeyOrLabel, ammoTag = "STD") {
    const calibre = this.resolveCalibre(calibreKeyOrLabel);
    if (!calibre) return 0;
    const tag = this.normalizeTag(ammoTag);
    const rule = this.TAG_RULES[tag] ?? this.TAG_RULES.STD;
    const value = calibre.cost * Number(rule.multiplier ?? 1) + Number(rule.flatAdd ?? 0);
    return Math.round(value * 100) / 100;
  }

  static getBaseRoundCost(calibreKeyOrLabel, fallback = 0) {
    const calibre = this.resolveCalibre(calibreKeyOrLabel);
    if (calibre) return Number(calibre.cost ?? 0);
    const parsed = Number(fallback ?? 0);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  static getExtraTagSurcharge(calibreKeyOrLabel, ammoTag = "STD", fallbackBase = 0) {
    const perRound = this.getCostPerRound(calibreKeyOrLabel, ammoTag);
    const base = this.getBaseRoundCost(calibreKeyOrLabel, fallbackBase);
    return Math.max(0, Math.round((perRound - base) * 100) / 100);
  }

  static buildAmmoIconPath(calibreKeyOrLabel, ammoTag = "STD") {
    const calibre = this.resolveCalibre(calibreKeyOrLabel);
    if (!calibre) return null;
    const tag = this.normalizeTag(ammoTag);
    return `${this.AMMO_ICON_PATH}/${calibre.key}__${tag}.png`;
  }

  static getAmmoMetaFromItem(item) {
    if (!item || item.type !== "gear") return null;
    const direct =
      item.flags?.[game.system.id]?.slaAmmo ??
      item.flags?.brp?.slaAmmo ??
      null;
    if (direct?.isAmmo) {
      const calibre = this.resolveCalibre(direct.calibreKey ?? direct.calibreLabel ?? "");
      if (!calibre) return null;
      return {
        calibreKey: calibre.key,
        calibreLabel: calibre.label,
        costPerRound: Number(this.getBaseRoundCost(calibre.key, calibre.cost))
      };
    }

    const name = String(item.name ?? "").trim();
    const cleanName = name
      .replace(/^\s*ammo[:\s-]*/i, "")
      .replace(/\[(STD|AP|HE|HEAP|SUB|TRACER)\]/ig, "")
      .trim();
    const calibre = this.resolveCalibre(cleanName);
    if (!calibre) return null;
    return {
      calibreKey: calibre.key,
      calibreLabel: calibre.label,
      costPerRound: Number(this.getBaseRoundCost(calibre.key, calibre.cost))
    };
  }

  static buildAmmoGearName(calibreLabel) {
    return `Ammo: ${calibreLabel}`;
  }

  static buildAmmoDescription(calibre, baseCost) {
    return `<p><strong>${calibre.group}</strong>: ${calibre.typical}</p><ul><li>Calibre: ${calibre.label}</li><li>Cost per round: ${baseCost} CRD</li><li>Use ammo type at attack time (STD/AP/HE/HEAP).</li></ul>`;
  }

  static buildAmmoGearData(calibre) {
    const baseCost = this.getBaseRoundCost(calibre.key, calibre.cost);
    const name = this.buildAmmoGearName(calibre.label);
    const description = this.buildAmmoDescription(calibre, baseCost);
    const brpid = `i.gear.sla-ammo-${calibre.key}`;
    const meta = {
      isAmmo: true,
      calibreKey: calibre.key,
      calibreLabel: calibre.label,
      baseCost: Number(baseCost)
    };
    return {
      name,
      type: "gear",
      img: this.buildAmmoIconPath(calibre.key, "STD"),
      system: {
        quantity: 0,
        enc: 0,
        crdEach: baseCost,
        crdTotal: 0,
        price: "average",
        equipStatus: "carried",
        description
      },
      flags: {
        [game.system.id]: {
          brpidFlag: {
            id: brpid,
            lang: game.i18n.lang,
            priority: 0
          },
          slaAmmo: meta
        },
        brp: {
          brpidFlag: {
            id: brpid,
            lang: game.i18n.lang,
            priority: 0
          }
        }
      }
    };
  }

  static async ensureAmmoFolder(folderName = "SLA Ammo") {
    let folder = game.folders.find((f) => f.type === "Item" && f.name === folderName && !f.folder);
    if (!folder) {
      folder = await Folder.create({
        name: folderName,
        type: "Item",
        color: "#6b4f2f"
      });
    }
    return folder;
  }

  static async seedWorldAmmoGear({ overwrite = false, folderName = "SLA Ammo" } = {}) {
    const folder = await this.ensureAmmoFolder(folderName);
    const existing = new Map(
      game.items
        .filter((item) => item.type === "gear" && item.folder?.id === folder.id)
        .map((item) => [item.name.toLowerCase().trim(), item])
    );

    let created = 0;
    let updated = 0;
    for (const calibre of this.BASE_CALIBRES) {
      const payload = this.buildAmmoGearData(calibre);
      payload.folder = folder.id;
      const key = payload.name.toLowerCase().trim();
      const current = existing.get(key);
      if (!current) {
        await Item.create(payload);
        created++;
      } else if (overwrite) {
        await current.update(payload);
        updated++;
      }
    }

    ui.notifications.info(`SLA ammo seeded: ${created} created, ${updated} updated.`);
    return { created, updated, folder: folder.name };
  }

  static async normalizeActorAmmoGear(actor) {
    if (!actor?.items) return { actor: actor?.name ?? "", updated: 0, deleted: 0 };
    const grouped = new Map();
    for (const item of actor.items) {
      if (item.type !== "gear") continue;
      const meta = this.getAmmoMetaFromItem(item);
      if (!meta) continue;
      if (!grouped.has(meta.calibreKey)) grouped.set(meta.calibreKey, []);
      grouped.get(meta.calibreKey).push({ item, meta });
    }

    let updated = 0;
    let deleted = 0;
    for (const [calibreKey, rows] of grouped.entries()) {
      const calibre = this.resolveCalibre(calibreKey);
      if (!calibre || !rows.length) continue;
      const totalQty = rows.reduce((sum, row) => sum + Math.max(0, Number(row.item.system?.quantity ?? 0)), 0);
      const baseCost = this.getBaseRoundCost(calibre.key, calibre.cost);
      const canonicalName = this.buildAmmoGearName(calibre.label);
      const keeper = rows.find((row) => String(row.item.name ?? "").trim().toLowerCase() === canonicalName.toLowerCase())?.item ?? rows[0].item;
      const canonical = this.buildAmmoGearData(calibre);
      const updateData = {
        name: canonicalName,
        "system.quantity": totalQty,
        "system.crdEach": baseCost,
        "system.crdTotal": Math.round(totalQty * baseCost * 100) / 100,
        [`flags.${game.system.id}.slaAmmo`]: canonical.flags?.[game.system.id]?.slaAmmo ?? null,
        [`flags.${game.system.id}.brpidFlag`]: canonical.flags?.[game.system.id]?.brpidFlag ?? null,
        "flags.brp.brpidFlag": canonical.flags?.brp?.brpidFlag ?? null
      };
      await keeper.update(updateData);
      updated += 1;

      const extra = rows.map((row) => row.item).filter((item) => item.id !== keeper.id);
      if (extra.length) {
        await actor.deleteEmbeddedDocuments("Item", extra.map((item) => item.id));
        deleted += extra.length;
      }
    }
    return { actor: actor.name, updated, deleted };
  }

  static async normalizeAllActorAmmoGear() {
    let updated = 0;
    let deleted = 0;
    const perActor = [];
    for (const actor of game.actors ?? []) {
      const result = await this.normalizeActorAmmoGear(actor);
      updated += result.updated;
      deleted += result.deleted;
      if (result.updated > 0 || result.deleted > 0) {
        perActor.push(result);
      }
    }
    ui.notifications.info(`SLA ammo normalized on actors: ${updated} stacks updated, ${deleted} stacks merged.`);
    return { updated, deleted, perActor };
  }

  static getWeaponAllowedTags(weapon) {
    const sys = weapon?.system ?? {};
    const defaults = {
      STD: true,
      AP: true,
      HE: true,
      HEAP: true
    };

    const flags = {
      STD: typeof sys.ammoAllowStd === "boolean" ? sys.ammoAllowStd : defaults.STD,
      AP: typeof sys.ammoAllowAp === "boolean" ? sys.ammoAllowAp : defaults.AP,
      HE: typeof sys.ammoAllowHe === "boolean" ? sys.ammoAllowHe : defaults.HE,
      HEAP: typeof sys.ammoAllowHeap === "boolean" ? sys.ammoAllowHeap : defaults.HEAP
    };

    const allowed = this.MECHANICAL_TAGS.filter((tag) => flags[tag]);
    if (!allowed.length) return ["STD"];
    if (!allowed.includes("STD")) allowed.unshift("STD");
    return Array.from(new Set(allowed));
  }

  static async backfillWeaponAmmoProfiles({
    overwrite = false,
    includeWorldWeapons = true,
    includeActorWeapons = true
  } = {}) {
    let scanned = 0;
    let updated = 0;

    const processWeapon = async (weapon) => {
      if (!weapon || weapon.type !== "weapon") return;
      scanned += 1;
      const calibre =
        this.resolveCalibre(weapon.system?.ammoCalibre ?? "") ??
        this.resolveCalibre(weapon.system?.ammoType ?? "") ??
        this.deriveWeaponCalibre(weapon);
      if (!calibre) return;

      const currentCalibre = String(weapon.system?.ammoCalibre ?? "").trim();
      const currentBaseCost = Number(weapon.system?.ammoBaseCost ?? 0);
      const needsCalibre = overwrite || !currentCalibre;
      const needsBaseCost = overwrite || currentBaseCost <= 0;
      const needsAllowStd = overwrite || typeof weapon.system?.ammoAllowStd !== "boolean";
      const needsAllowAp = overwrite || typeof weapon.system?.ammoAllowAp !== "boolean";
      const needsAllowHe = overwrite || typeof weapon.system?.ammoAllowHe !== "boolean";
      const needsAllowHeap = overwrite || typeof weapon.system?.ammoAllowHeap !== "boolean";
      if (!needsCalibre && !needsBaseCost && !needsAllowStd && !needsAllowAp && !needsAllowHe && !needsAllowHeap) return;

      const updateData = {};
      if (needsCalibre) updateData["system.ammoCalibre"] = calibre.label;
      if (needsBaseCost) updateData["system.ammoBaseCost"] = Number(calibre.cost ?? 0);
      if (needsAllowStd) updateData["system.ammoAllowStd"] = true;
      if (needsAllowAp) updateData["system.ammoAllowAp"] = true;
      if (needsAllowHe) updateData["system.ammoAllowHe"] = true;
      if (needsAllowHeap) updateData["system.ammoAllowHeap"] = true;
      await weapon.update(updateData);
      updated += 1;
    };

    if (includeWorldWeapons) {
      const worldWeapons = game.items.filter((item) => item.type === "weapon" && !item.parent);
      for (const weapon of worldWeapons) {
        await processWeapon(weapon);
      }
    }

    if (includeActorWeapons) {
      for (const actor of game.actors ?? []) {
        for (const weapon of actor.items.filter((item) => item.type === "weapon")) {
          await processWeapon(weapon);
        }
      }
    }

    ui.notifications.info(`SLA weapon ammo profile backfill: ${updated}/${scanned} updated.`);
    return { scanned, updated };
  }

  static auditWeaponCalibres({
    includeWorldWeapons = true,
    includeActorWeapons = true
  } = {}) {
    const seededAmmo = this.collectSeededAmmoCalibreKeys();
    const rows = [];

    const pushWeapon = (weapon, owner = "World") => {
      if (!weapon || weapon.type !== "weapon") return;
      const explicit = this.resolveCalibre(weapon.system?.ammoCalibre ?? "");
      const derived = this.deriveWeaponCalibre(weapon);
      const resolved = explicit ?? derived;
      const calibreKey = resolved?.key ?? "";
      rows.push({
        owner,
        name: weapon.name,
        ammoCalibre: weapon.system?.ammoCalibre ?? "",
        resolvedCalibre: resolved?.label ?? "UNRESOLVED",
        ammoType: weapon.system?.ammoType ?? "",
        hasSeededAmmo: calibreKey ? seededAmmo.has(calibreKey) : false
      });
    };

    if (includeWorldWeapons) {
      for (const weapon of game.items.filter((item) => item.type === "weapon" && !item.parent)) {
        pushWeapon(weapon, "World");
      }
    }
    if (includeActorWeapons) {
      for (const actor of game.actors ?? []) {
        for (const weapon of actor.items.filter((item) => item.type === "weapon")) {
          pushWeapon(weapon, actor.name);
        }
      }
    }

    const unresolved = rows.filter((r) => r.resolvedCalibre === "UNRESOLVED");
    const missingAmmo = rows.filter((r) => r.resolvedCalibre !== "UNRESOLVED" && !r.hasSeededAmmo);
    const summary = {
      total: rows.length,
      unresolved: unresolved.length,
      missingAmmo: missingAmmo.length
    };
    console.table(rows);
    console.log("sla-industries-brp | Weapon calibre audit summary", summary, { unresolved, missingAmmo });
    return { summary, rows, unresolved, missingAmmo };
  }
}
