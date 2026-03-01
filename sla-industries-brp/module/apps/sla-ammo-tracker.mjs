import { SLAAmmoCatalog } from "./sla-ammo-catalog.mjs";

export class SLAAmmoTracker {
  static DEFAULTS = {
    ammoTracking: true,
    ammoAutoSpend: true,
    ammoNotify: true,
    ammoDeficitMode: "warn"
  };

  static AMMO_TAGS = ["STD", "AP", "HE", "HEAP"];

  static isTrackingEnabled() {
    return game.settings.get("sla-industries-brp", "ammoTracking") ?? this.DEFAULTS.ammoTracking;
  }

  static isAutoSpendEnabled() {
    return game.settings.get("sla-industries-brp", "ammoAutoSpend") ?? this.DEFAULTS.ammoAutoSpend;
  }

  static shouldNotify() {
    return game.settings.get("sla-industries-brp", "ammoNotify") ?? this.DEFAULTS.ammoNotify;
  }

  static deficitMode() {
    const mode = String(game.settings.get("sla-industries-brp", "ammoDeficitMode") ?? this.DEFAULTS.ammoDeficitMode);
    if (["allow", "warn", "block"].includes(mode)) return mode;
    return this.DEFAULTS.ammoDeficitMode;
  }

  static resolveWeapon(actor, itemId) {
    if (!actor || !itemId) return null;
    const weapon = actor.items.get(itemId);
    if (!weapon || weapon.type !== "weapon") return null;
    return weapon;
  }

  static usesAmmo(weapon) {
    if (!weapon) return false;
    const cap = Number(weapon.system.ammo ?? 0);
    return cap > 0;
  }

  static normalizeAmmoTag(tag = "") {
    const normal = String(tag ?? "").trim().toUpperCase();
    if (this.AMMO_TAGS.includes(normal)) return normal;
    return "STD";
  }

  static getLoadedAmmoTag(weapon) {
    return this.normalizeAmmoTag(weapon?.system?.ammoLoadedType ?? weapon?.system?.ammoTag ?? "STD");
  }

  static getWeaponActor(weapon, explicitActor = null) {
    if (explicitActor?.documentName === "Actor") return explicitActor;
    const parent = weapon?.parent ?? null;
    if (parent?.documentName === "Actor") return parent;
    return null;
  }

  static resolveWeaponCalibre(weapon) {
    return SLAAmmoCatalog.resolveCalibre(weapon?.system?.ammoCalibre ?? "") ?? SLAAmmoCatalog.deriveWeaponCalibre(weapon);
  }

  static getWeaponAllowedTags(weapon) {
    return SLAAmmoCatalog.getWeaponAllowedTags(weapon);
  }

  static normalizeAllowedAmmoTag(weapon, tag) {
    const normal = this.normalizeAmmoTag(tag);
    const allowed = this.getWeaponAllowedTags(weapon);
    if (allowed.includes(normal)) return normal;
    return allowed[0] ?? "STD";
  }

  static getWeaponAmmoProfile(weapon) {
    const calibre = this.resolveWeaponCalibre(weapon);
    const calibreLabel = calibre?.label ?? String(weapon?.system?.ammoCalibre ?? "").trim();
    const baseCost = SLAAmmoCatalog.getBaseRoundCost(calibreLabel || calibre?.key || "", weapon?.system?.ammoBaseCost ?? 0);
    const allowed = this.getWeaponAllowedTags(weapon);
    const selected = this.normalizeAllowedAmmoTag(weapon, weapon?.system?.ammoLoadedType ?? "STD");
    return {
      calibre,
      calibreLabel,
      baseCost,
      allowed,
      selected
    };
  }

  static getAmmoDialogData(actor, weapon, fireMode = "single") {
    const profile = this.getWeaponAmmoProfile(weapon);
    const rounds = this.getSpendCost(weapon, fireMode);
    const options = {};
    for (const tag of profile.allowed) {
      const perRound = SLAAmmoCatalog.getCostPerRound(profile.calibreLabel || profile.calibre?.key || "", tag);
      const surcharge = Math.max(0, Math.round((perRound - profile.baseCost) * 100) / 100);
      const totalSurcharge = Math.round((surcharge * rounds) * 100) / 100;
      const surchargeLabel = totalSurcharge > 0 ? ` (extra ${totalSurcharge} CRD)` : "";
      options[tag] = `${tag} (${perRound} CRD/rd${surchargeLabel})`;
    }

    const credits = this.getActorCreditsState(actor);
    return {
      ammoTagOptions: options,
      ammoTagSelected: profile.selected,
      ammoCalibreLabel: profile.calibreLabel || "-",
      ammoBaseCost: profile.baseCost,
      ammoRoundsSpent: rounds,
      actorCredits: credits.value,
      hasCredits: credits.path !== ""
    };
  }

  static collectActorAmmoGear(actor) {
    if (!actor?.items) return [];
    const stacks = [];
    for (const item of actor.items) {
      if (item.type !== "gear") continue;
      const meta = SLAAmmoCatalog.getAmmoMetaFromItem(item);
      if (!meta) continue;
      const quantity = Math.max(0, Math.floor(Number(item.system?.quantity ?? 0)));
      stacks.push({ item, meta, quantity });
    }
    return stacks;
  }

  static getGearReserveData(actor, weapon) {
    if (!actor || !weapon) return null;
    const calibre = this.resolveWeaponCalibre(weapon);
    if (!calibre) return null;
    const allStacks = this.collectActorAmmoGear(actor);
    const stacks = allStacks.filter((entry) => entry.meta.calibreKey === calibre.key);
    if (!stacks.length) return null;
    const total = stacks.reduce((sum, entry) => sum + entry.quantity, 0);
    return {
      calibre,
      total,
      stacks
    };
  }

  static buildReserveUpdatesFromGear(gearData) {
    return {
      "system.ammoReserveStd": 0,
      "system.ammoReserveAp": 0,
      "system.ammoReserveHe": 0,
      "system.ammoReserveHeap": 0,
      "system.ammoReserve": Math.max(0, Number(gearData?.total ?? 0))
    };
  }

  static applyDisplayReserves(actor, weaponData) {
    if (!weaponData?.system) return;
    const derivedCalibre = this.resolveWeaponCalibre(weaponData);
    if (derivedCalibre) {
      if (!String(weaponData.system.ammoCalibre ?? "").trim()) {
        weaponData.system.ammoCalibre = derivedCalibre.label;
      }
      if (Number(weaponData.system.ammoBaseCost ?? 0) <= 0) {
        weaponData.system.ammoBaseCost = Number(derivedCalibre.cost ?? 0);
      }
    }

    weaponData.system.ammoLoadedType = this.normalizeAllowedAmmoTag(weaponData, weaponData.system.ammoLoadedType ?? "STD");
    weaponData.system.ammoAllowStd = typeof weaponData.system.ammoAllowStd === "boolean" ? weaponData.system.ammoAllowStd : true;
    weaponData.system.ammoAllowAp = typeof weaponData.system.ammoAllowAp === "boolean" ? weaponData.system.ammoAllowAp : true;
    weaponData.system.ammoAllowHe = typeof weaponData.system.ammoAllowHe === "boolean" ? weaponData.system.ammoAllowHe : true;
    weaponData.system.ammoAllowHeap = typeof weaponData.system.ammoAllowHeap === "boolean" ? weaponData.system.ammoAllowHeap : true;

    const gearData = this.getGearReserveData(actor, weaponData);
    Object.assign(weaponData.system, {
      ammoReserveStd: 0,
      ammoReserveAp: 0,
      ammoReserveHe: 0,
      ammoReserveHeap: 0,
      ammoReserve: Math.max(0, Number(gearData?.total ?? 0))
    });
  }

  static async consumeGearAmmo(actor, weapon, amount) {
    const required = Math.max(0, Number(amount ?? 0));
    if (!actor || !weapon || required <= 0) return { moved: 0, reserveBefore: 0, reserveAfter: 0 };
    const gearData = this.getGearReserveData(actor, weapon);
    if (!gearData) return { moved: 0, reserveBefore: 0, reserveAfter: 0 };
    const reserveBefore = Math.max(0, Number(gearData.total ?? 0));
    if (reserveBefore <= 0) return { moved: 0, reserveBefore, reserveAfter: reserveBefore };

    let remaining = Math.min(required, reserveBefore);
    const updates = [];
    for (const stack of gearData.stacks) {
      if (remaining <= 0) break;
      if (stack.quantity <= 0) continue;
      const taken = Math.min(stack.quantity, remaining);
      if (taken <= 0) continue;
      updates.push({
        _id: stack.item.id,
        "system.quantity": stack.quantity - taken
      });
      remaining -= taken;
    }

    if (updates.length) {
      await actor.updateEmbeddedDocuments("Item", updates);
    }

    const moved = Math.min(required, reserveBefore) - remaining;
    const reserveAfter = reserveBefore - moved;
    return { moved, reserveBefore, reserveAfter };
  }

  static getSpendCost(weapon, mode = "single") {
    const single = Math.max(1, Number(weapon.system.ammoPerShot ?? 1));
    const burst = Math.max(1, Number(weapon.system.ammoPerBurst ?? 3));
    const auto = Math.max(1, Number(weapon.system.ammoPerAuto ?? Math.max(10, Number(weapon.system.rof ?? 0))));
    switch (mode) {
      case "burst":
        return burst;
      case "auto":
        return auto;
      case "single":
      default:
        return single;
    }
  }

  static getFireModeOptions(weapon) {
    const options = { single: game.i18n.localize("BRP.single") };
    if (!weapon) return options;
    const single = Math.max(1, Number(weapon.system?.ammoPerShot ?? 1));
    const burst = Math.max(1, Number(weapon.system?.ammoPerBurst ?? 3));
    const auto = Math.max(1, Number(weapon.system?.ammoPerAuto ?? Math.max(10, Number(weapon.system?.rof ?? 0))));
    const special = String(weapon.system?.special ?? "").toLowerCase();
    const rof = Number(weapon.system?.rof ?? 0);
    const canBurst = burst > single || ["burst", "auto", "fullauto"].includes(special) || rof >= 3;
    const canAuto = auto > burst || ["auto", "fullauto"].includes(special) || rof >= 5;
    if (canBurst) options.burst = game.i18n.localize("BRP.burst");
    if (canAuto) options.auto = game.i18n.localize("BRP.automatic");
    return options;
  }

  static getReloadAmount(weapon) {
    const mag = Math.max(0, Number(weapon.system.ammo ?? 0));
    const fallback = Math.max(1, mag);
    return Math.max(1, Number(weapon.system.reloadAmount ?? fallback));
  }

  static currentAmmo(weapon) {
    return Math.max(0, Number(weapon.system.ammoCurr ?? 0));
  }

  static reserveAmmo(weapon) {
    return Math.max(0, Number(weapon.system.ammoReserve ?? 0));
  }

  static async spend(weapon, { mode = "single", amount = null, notify = true, autoReload = true } = {}) {
    if (!this.usesAmmo(weapon)) return { ok: true, skipped: true };
    const cost = amount ?? this.getSpendCost(weapon, mode);
    const cap = Math.max(0, Number(weapon.system.ammo ?? 0));
    const actor = this.getWeaponActor(weapon);
    let current = this.currentAmmo(weapon);
    let reloaded = false;

    if (cost > current && autoReload) {
      let guard = 0;
      while (cost > current && guard < 8) {
        const reloadResult = await this.reload(weapon, { notify: false });
        if (!reloadResult.ok || reloadResult.moved <= 0) break;
        current = reloadResult.after;
        reloaded = true;
        guard += 1;
      }
    }

    if (cost > current) {
      if (notify) {
        ui.notifications.warn(`${weapon.name}: out of ammo (${current}/${cap})`);
      }
      return { ok: false, reason: "insufficient-ammo", cost, current };
    }

    const next = Math.max(0, current - cost);
    await weapon.update({ "system.ammoCurr": next });
    if (notify && this.shouldNotify()) {
      const reloadLabel = reloaded ? ", auto-reload used" : "";
      ui.notifications.info(`${weapon.name}: ${current} -> ${next} ammo (${mode}${reloadLabel})`);
    }
    return { ok: true, before: current, after: next, cost, mode, reloaded, actor };
  }

  static async reload(weapon, { notify = true, full = false } = {}) {
    if (!this.usesAmmo(weapon)) return { ok: true, skipped: true };

    const cap = Math.max(0, Number(weapon.system.ammo ?? 0));
    const current = this.currentAmmo(weapon);
    const actor = this.getWeaponActor(weapon);
    const gearData = this.getGearReserveData(actor, weapon);
    const actorWeapon = Boolean(actor);
    const reserve = actorWeapon ? Math.max(0, Number(gearData?.total ?? 0)) : this.reserveAmmo(weapon);
    const reloadAmount = full ? cap : this.getReloadAmount(weapon);
    const calibreLabel = this.resolveWeaponCalibre(weapon)?.label ?? weapon.system?.ammoCalibre ?? "ammo";

    if (current >= cap) {
      if (notify && this.shouldNotify()) {
        ui.notifications.info(`${weapon.name}: magazine already full`);
      }
      return { ok: true, before: current, after: current, reserveBefore: reserve, reserveAfter: reserve, moved: 0 };
    }
    if (reserve <= 0) {
      if (notify) {
        if (actorWeapon) {
          ui.notifications.warn(`${weapon.name}: no reserve ${calibreLabel} ammo in gear`);
        } else {
          ui.notifications.warn(`${weapon.name}: no reserve ammo`);
        }
      }
      return { ok: false, reason: "no-reserve", before: current, reserveBefore: reserve, moved: 0 };
    }

    const missing = cap - current;
    let moved = Math.min(missing, reloadAmount, reserve);
    let nextAmmo = current + moved;
    let nextReserve = reserve - moved;

    const updates = {
      "system.ammoCurr": nextAmmo
    };
    if (actorWeapon) {
      const consumed = await this.consumeGearAmmo(actor, weapon, moved);
      moved = Math.max(0, Number(consumed.moved ?? 0));
      nextAmmo = current + moved;
      nextReserve = Math.max(0, Number(consumed.reserveAfter ?? reserve - moved));
      updates["system.ammoCurr"] = nextAmmo;
      const nextGearData = this.getGearReserveData(actor, weapon);
      Object.assign(updates, this.buildReserveUpdatesFromGear(nextGearData));
    } else {
      updates["system.ammoReserve"] = nextReserve;
      updates["system.ammoReserveStd"] = 0;
      updates["system.ammoReserveAp"] = 0;
      updates["system.ammoReserveHe"] = 0;
      updates["system.ammoReserveHeap"] = 0;
    }

    await weapon.update(updates);
    if (notify && this.shouldNotify()) {
      const reloadLabel = full ? "full reload" : `reloaded +${moved}`;
      ui.notifications.info(`${weapon.name}: ${reloadLabel} (${nextAmmo}/${cap})`);
    }
    return {
      ok: true,
      before: current,
      after: nextAmmo,
      reserveBefore: reserve,
      reserveAfter: nextReserve,
      moved
    };
  }

  static async cycleAmmoType(weapon, { notify = true } = {}) {
    if (!weapon) return { ok: false, reason: "no-weapon" };
    const current = this.getLoadedAmmoTag(weapon);
    const allowed = this.getWeaponAllowedTags(weapon);
    const index = allowed.indexOf(current);
    const next = allowed[(index + 1) % allowed.length] ?? "STD";
    await weapon.update({ "system.ammoLoadedType": next });
    if (notify && this.shouldNotify()) {
      ui.notifications.info(`${weapon.name}: ammo type ${current} -> ${next}`);
    }
    return { ok: true, before: current, after: next };
  }

  static getActorCreditsState(actor) {
    if (!actor) return { path: "", value: 0 };
    const slaCredits = Number(actor.system?.sla?.credits);
    if (Number.isFinite(slaCredits)) {
      return { path: "system.sla.credits", value: slaCredits };
    }
    const wealthValue = Number(actor.system?.wealthValue);
    if (Number.isFinite(wealthValue)) {
      return { path: "system.wealthValue", value: wealthValue };
    }
    return { path: "", value: 0 };
  }

  static async deductCredits(actor, amount) {
    const charge = Math.max(0, Math.round(Number(amount ?? 0) * 100) / 100);
    if (!actor || charge <= 0) return { ok: true, skipped: true, before: 0, after: 0, spent: 0 };
    const state = this.getActorCreditsState(actor);
    if (!state.path) return { ok: true, skipped: true, before: 0, after: 0, spent: 0 };
    const after = Math.round((state.value - charge) * 100) / 100;
    await actor.update({ [state.path]: after });
    return {
      ok: true,
      before: state.value,
      after,
      spent: charge,
      path: state.path,
      deficit: after < 0,
      deficitAmount: after < 0 ? Math.abs(after) : 0
    };
  }

  static calculateSurchargeForShot(weapon, ammoTag, rounds = 1) {
    const profile = this.getWeaponAmmoProfile(weapon);
    const tag = this.normalizeAllowedAmmoTag(weapon, ammoTag);
    const perRound = SLAAmmoCatalog.getCostPerRound(profile.calibreLabel || profile.calibre?.key || "", tag);
    const surchargePerRound = Math.max(0, Math.round((perRound - profile.baseCost) * 100) / 100);
    const totalSurcharge = Math.round((surchargePerRound * Math.max(1, Number(rounds ?? 1))) * 100) / 100;
    return {
      tag,
      perRound,
      surchargePerRound,
      totalSurcharge,
      baseCost: profile.baseCost,
      calibreLabel: profile.calibreLabel
    };
  }

  static async consumeForCheck(config, actor) {
    if (!this.isTrackingEnabled() || !this.isAutoSpendEnabled()) return { ok: true, skipped: true };
    if (!["CM", "QC"].includes(config.rollType)) return { ok: true, skipped: true };

    const weapon = this.resolveWeapon(actor, config.itemId);
    if (!weapon || !this.usesAmmo(weapon)) return { ok: true, skipped: true };

    const mode = config.fireMode ?? "single";
    const rounds = this.getSpendCost(weapon, mode);
    const surcharge = this.calculateSurchargeForShot(weapon, config.ammoTag ?? this.getLoadedAmmoTag(weapon), rounds);
    config.ammoTag = surcharge.tag;
    await weapon.update({ "system.ammoLoadedType": surcharge.tag });

    const creditState = this.getActorCreditsState(actor);
    const roundCostTotal = Math.round((Number(surcharge.perRound ?? 0) * Number(rounds ?? 0)) * 100) / 100;
    const deficitMode = this.deficitMode();

    config.ammoCreditsSpent = 0;
    config.ammoCreditsBefore = creditState.value;
    config.ammoCreditsAfter = creditState.value;
    config.ammoRoundCost = surcharge.perRound;
    config.ammoSurchargePerRound = surcharge.surchargePerRound;
    config.ammoCreditsDeficit = false;
    config.ammoCreditsDeficitAmount = 0;
    config.ammoCostTotal = roundCostTotal;
    config.fireMode = mode;

    if (
      actor?.type === "character" &&
      deficitMode === "block" &&
      Number(roundCostTotal ?? 0) > 0 &&
      Number(creditState.value ?? 0) < Number(roundCostTotal ?? 0)
    ) {
      ui.notifications.warn(`${weapon.name}: insufficient CRD (${creditState.value.toFixed(2)} available, ${roundCostTotal.toFixed(2)} required).`);
      return { ok: false, reason: "insufficient-credits", required: roundCostTotal, current: creditState.value };
    }

    const spendResult = await this.spend(weapon, { mode, amount: rounds, notify: false, autoReload: true });
    if (!spendResult.ok) return spendResult;

    if (Number(roundCostTotal ?? 0) > 0 && actor?.type === "character") {
      const charge = await this.deductCredits(actor, roundCostTotal);
      if (!charge.ok) {
        return { ok: false, reason: "credit-update-failed", required: roundCostTotal };
      }
      config.ammoCreditsSpent = Number(charge.spent ?? 0);
      config.ammoCreditsBefore = Number(charge.before ?? config.ammoCreditsBefore);
      config.ammoCreditsAfter = Number(charge.after ?? config.ammoCreditsAfter);
      config.ammoCreditsDeficit = Boolean(charge.deficit);
      config.ammoCreditsDeficitAmount = Number(charge.deficitAmount ?? 0);
      if (config.ammoCreditsDeficit && deficitMode === "warn") {
        ui.notifications.warn(`${weapon.name}: CRD deficit ${config.ammoCreditsDeficitAmount.toFixed(2)}.`);
      }
    }

    return {
      ok: true,
      rounds,
      mode,
      ammoTag: surcharge.tag,
      ammoRoundCost: surcharge.perRound,
      ammoSurchargePerRound: surcharge.surchargePerRound,
      ammoCostTotal: roundCostTotal,
      ammoCreditsSpent: config.ammoCreditsSpent,
      ammoCreditsBefore: config.ammoCreditsBefore,
      ammoCreditsAfter: config.ammoCreditsAfter,
      ammoCreditsDeficit: config.ammoCreditsDeficit,
      ammoCreditsDeficitAmount: config.ammoCreditsDeficitAmount
    };
  }

  static async handleSheetAction({ actor, itemId, action }) {
    const weapon = this.resolveWeapon(actor, itemId);
    if (!weapon) return { ok: false, reason: "no-weapon" };

    switch (action) {
      case "reload":
        return this.reload(weapon, { notify: true });
      case "reloadFull":
        return this.reload(weapon, { notify: true, full: true });
      case "cycleType":
        return this.cycleAmmoType(weapon, { notify: true });
      case "single":
      case "burst":
      case "auto":
        return this.spend(weapon, { mode: action, notify: true });
      default:
        return { ok: false, reason: "unknown-action" };
    }
  }
}
