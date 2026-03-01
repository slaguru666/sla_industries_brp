import { BRPCheck } from "./check.mjs";
import { SLAAmmoTracker } from "./sla-ammo-tracker.mjs";
import { SLADrugSystem } from "./sla-drug-system.mjs";
import { SLAEbbSystem } from "./sla-ebb-system.mjs";

export class SLAQAHarness {
  static async runQuick({ postToChat = true } = {}) {
    const tests = [];
    const add = (name, pass, detail = "") => tests.push({ name, pass: Boolean(pass), detail: String(detail ?? "") });

    try {
      add("BRPCheck edge normalisation", BRPCheck.normaliseRollEdge("adv") === "advantage");
      add("BRPCheck burst hit bonus", BRPCheck.getFireModeHitBonus("burst") === 10);
      add("BRPCheck auto hit count crit", BRPCheck.getFireModeHitCount("auto", 4) === 6);

      const mockWeapon = { system: { ammoPerShot: 1, ammoPerBurst: 3, ammoPerAuto: 10, rof: 10, special: "auto" } };
      add("Ammo spend cost single", SLAAmmoTracker.getSpendCost(mockWeapon, "single") === 1);
      add("Ammo spend cost burst", SLAAmmoTracker.getSpendCost(mockWeapon, "burst") === 3);
      add("Ammo spend cost auto", SLAAmmoTracker.getSpendCost(mockWeapon, "auto") === 10);

      const drug = SLADrugSystem.resolveDrugDef("KickStart");
      add("Drug definition KickStart", Boolean(drug?.id), drug?.id ?? "missing");

      const ebbAbility = game.items?.find((i) => i.type === "psychic" && String(i.name ?? "").toLowerCase().includes("ebb"));
      if (ebbAbility) {
        const meta = SLAEbbSystem.getAbilityMeta(ebbAbility);
        add("EBB meta resolves", Boolean(meta?.id), meta?.id ?? "missing");
      } else {
        add("EBB meta resolves", true, "Skipped (no EBB item in world)");
      }

      const firstEbbActor = game.actors?.find((a) => a.type === "character" && SLAEbbSystem.isEbbSpecies(a));
      if (firstEbbActor) {
        const audit = SLAEbbSystem.auditActorDisciplineSkills(firstEbbActor);
        const missing = audit.filter((row) => !row.ok);
        add(
          "EBB discipline formulation skills resolve",
          missing.length === 0,
          `${firstEbbActor.name}: ${audit.length - missing.length}/${audit.length} linked`
        );
      } else {
        add("EBB discipline formulation skills resolve", true, "Skipped (no Ebon/Brain Waster actor)");
      }

      const isGM = Boolean(game.user?.isGM);
      add("User context available", Boolean(game.user?.id), game.user?.id ?? "none");
      add("GM context (expected for full QA)", isGM, isGM ? "GM" : "Player");

      const passCount = tests.filter((t) => t.pass).length;
      const failCount = tests.length - passCount;
      const summary = { ok: failCount === 0, tests, passCount, failCount };

      if (postToChat) {
        const rows = tests.map((t) => `<li><strong>${t.pass ? "PASS" : "FAIL"}</strong> - ${this._escape(t.name)}${t.detail ? ` <span style="opacity:.85">(${this._escape(t.detail)})</span>` : ""}</li>`).join("");
        await ChatMessage.create({
          user: game.user?.id,
          speaker: ChatMessage.getSpeaker({ alias: "SLA QA Harness" }),
          content: `
            <div class="brp gr-card">
              <div class="bold">SLA Quick QA Harness</div>
              <p>Pass: <strong>${passCount}</strong> | Fail: <strong>${failCount}</strong></p>
              <ol>${rows}</ol>
            </div>
          `
        });
      }

      if (failCount > 0) {
        ui.notifications.warn(`SLA QA Harness: ${failCount} check(s) failed.`);
      } else {
        ui.notifications.info(`SLA QA Harness: ${passCount} checks passed.`);
      }

      return summary;
    } catch (err) {
      console.error("sla-industries-brp | SLAQAHarness failed", err);
      ui.notifications.error("SLA QA Harness failed. See console for details.");
      return { ok: false, error: String(err?.message ?? err) };
    }
  }

  static _escape(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}
