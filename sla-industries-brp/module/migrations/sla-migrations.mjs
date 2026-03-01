export class SLAMigrations {
  static CURRENT_SCHEMA = "13.2.0";

  static async run() {
    if (!game.user?.isGM) return { ok: true, skipped: true, reason: "not-gm" };
    const versionSetting = "worldSchemaVersion";
    const previous = String(game.settings.get("sla-industries-brp", versionSetting) ?? "0.0.0");
    const current = this.CURRENT_SCHEMA;

    if (!this._isOlder(previous, current)) {
      return { ok: true, skipped: true, previous, current };
    }

    const stats = {
      worldItemCultureFixes: 0,
      actorItemCultureFixes: 0,
      brpidFlagMirrors: 0,
      actorFlagMirrors: 0
    };

    await this._migrateWorldItems(stats);
    await this._migrateActorItems(stats);
    await this._migrateFlagMirrors(stats);

    await game.settings.set("sla-industries-brp", versionSetting, current);

    const touched = Object.values(stats).reduce((a, b) => a + Number(b ?? 0), 0);
    if (touched > 0) {
      ui.notifications.info(`SLA migration ${previous} -> ${current}: ${touched} updates.`);
    }

    return { ok: true, previous, current, stats };
  }

  static async _migrateWorldItems(stats) {
    const updates = [];
    for (const item of game.items ?? []) {
      const legacyCulture = item?.system?.cutlure;
      const currentCulture = item?.system?.culture;
      if (typeof legacyCulture !== "undefined" && typeof currentCulture === "undefined") {
        updates.push({ _id: item.id, "system.culture": legacyCulture, "system.-=cutlure": null });
      } else if (typeof legacyCulture !== "undefined") {
        updates.push({ _id: item.id, "system.-=cutlure": null });
      }
    }
    if (updates.length) {
      await Item.updateDocuments(updates);
      stats.worldItemCultureFixes += updates.length;
    }
  }

  static async _migrateActorItems(stats) {
    for (const actor of game.actors ?? []) {
      const updates = [];
      for (const item of actor.items ?? []) {
        const legacyCulture = item?.system?.cutlure;
        const currentCulture = item?.system?.culture;
        if (typeof legacyCulture !== "undefined" && typeof currentCulture === "undefined") {
          updates.push({ _id: item.id, "system.culture": legacyCulture, "system.-=cutlure": null });
        } else if (typeof legacyCulture !== "undefined") {
          updates.push({ _id: item.id, "system.-=cutlure": null });
        }
      }
      if (updates.length) {
        await actor.updateEmbeddedDocuments("Item", updates);
        stats.actorItemCultureFixes += updates.length;
      }
    }
  }

  static async _migrateFlagMirrors(stats) {
    const itemUpdates = [];
    for (const item of game.items ?? []) {
      const current = item.flags?.[game.system.id]?.brpidFlag;
      const legacy = item.flags?.brp?.brpidFlag;
      if (!current && legacy) {
        itemUpdates.push({ _id: item.id, [`flags.${game.system.id}.brpidFlag`]: legacy });
      }
    }
    if (itemUpdates.length) {
      await Item.updateDocuments(itemUpdates);
      stats.brpidFlagMirrors += itemUpdates.length;
    }

    const actorUpdates = [];
    for (const actor of game.actors ?? []) {
      const current = actor.flags?.[game.system.id]?.brpidFlag;
      const legacy = actor.flags?.brp?.brpidFlag;
      if (!current && legacy) {
        actorUpdates.push({ _id: actor.id, [`flags.${game.system.id}.brpidFlag`]: legacy });
      }
    }
    if (actorUpdates.length) {
      await Actor.updateDocuments(actorUpdates);
      stats.actorFlagMirrors += actorUpdates.length;
    }
  }

  static _isOlder(a, b) {
    const pa = String(a).split(".").map((v) => Number(v) || 0);
    const pb = String(b).split(".").map((v) => Number(v) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i += 1) {
      const av = pa[i] ?? 0;
      const bv = pb[i] ?? 0;
      if (av < bv) return true;
      if (av > bv) return false;
    }
    return false;
  }
}
