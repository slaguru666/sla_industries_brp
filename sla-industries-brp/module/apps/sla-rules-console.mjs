import { SLADialog } from "./sla-dialog.mjs";

export class SLARulesConsole {
  static SETTINGS = [
    { key: "initiativeMode", type: "string", default: "escalation" },
    { key: "pulpSla", type: "boolean", default: false },
    { key: "showManipulationSkills", type: "boolean", default: false },
    { key: "showSocialSkills", type: "boolean", default: false },
    { key: "showSupernaturalSkills", type: "boolean", default: false },
    { key: "combatTargetingMode", type: "string", default: "prefer-selected" },
    { key: "ammoDeficitMode", type: "string", default: "warn" },
    { key: "debugRollOverlay", type: "boolean", default: false }
  ];

  static _value(key, fallback = null) {
    try {
      return game.settings.get("sla-industries-brp", key);
    } catch (_err) {
      return fallback;
    }
  }

  static async open() {
    if (!game.user?.isGM) {
      ui.notifications.warn("Only a GM can open the SLA Rules Console.");
      return { ok: false, reason: "not-gm" };
    }

    const values = {
      initiativeMode: String(this._value("initiativeMode", "escalation")),
      pulpSla: Boolean(this._value("pulpSla", false)),
      showManipulationSkills: Boolean(this._value("showManipulationSkills", false)),
      showSocialSkills: Boolean(this._value("showSocialSkills", false)),
      showSupernaturalSkills: Boolean(this._value("showSupernaturalSkills", false)),
      combatTargetingMode: String(this._value("combatTargetingMode", "prefer-selected")),
      ammoDeficitMode: String(this._value("ammoDeficitMode", "warn")),
      debugRollOverlay: Boolean(this._value("debugRollOverlay", false))
    };

    const content = `
      <form id="sla-rules-console-form" class="brp">
        <div class="form-group"><label>Initiative Mode</label>
          <select name="initiativeMode">
            <option value="classic" ${values.initiativeMode === "classic" ? "selected" : ""}>Classic (Formula)</option>
            <option value="escalation" ${values.initiativeMode === "escalation" ? "selected" : ""}>SLA Escalation</option>
          </select>
        </div>
        <div class="form-group"><label>PULP-SLA (Double HP)</label><input type="checkbox" name="pulpSla" ${values.pulpSla ? "checked" : ""}></div>
        <hr />
        <div class="form-group"><label>Show Manipulation Skills</label><input type="checkbox" name="showManipulationSkills" ${values.showManipulationSkills ? "checked" : ""}></div>
        <div class="form-group"><label>Show Social Skills</label><input type="checkbox" name="showSocialSkills" ${values.showSocialSkills ? "checked" : ""}></div>
        <div class="form-group"><label>Show Supernatural Skills</label><input type="checkbox" name="showSupernaturalSkills" ${values.showSupernaturalSkills ? "checked" : ""}></div>
        <hr />
        <div class="form-group"><label>Combat Targeting Mode</label>
          <select name="combatTargetingMode">
            <option value="prefer-selected" ${values.combatTargetingMode === "prefer-selected" ? "selected" : ""}>Prefer selected target, fallback card/dummy</option>
            <option value="selected-only" ${values.combatTargetingMode === "selected-only" ? "selected" : ""}>Selected target only (else dummy)</option>
            <option value="card-then-selected" ${values.combatTargetingMode === "card-then-selected" ? "selected" : ""}>Prefer card target, fallback selected/dummy</option>
            <option value="dummy-only" ${values.combatTargetingMode === "dummy-only" ? "selected" : ""}>Always dummy target</option>
          </select>
        </div>
        <div class="form-group"><label>Ammo Deficit Policy</label>
          <select name="ammoDeficitMode">
            <option value="allow" ${values.ammoDeficitMode === "allow" ? "selected" : ""}>Allow deficit</option>
            <option value="warn" ${values.ammoDeficitMode === "warn" ? "selected" : ""}>Allow + warning</option>
            <option value="block" ${values.ammoDeficitMode === "block" ? "selected" : ""}>Block when insufficient CRD</option>
          </select>
        </div>
        <div class="form-group"><label>GM Roll Debug Overlay</label><input type="checkbox" name="debugRollOverlay" ${values.debugRollOverlay ? "checked" : ""}></div>
      </form>
    `;

    const formData = await SLADialog.waitForm({
      title: "SLA Rules Console",
      content,
      formSelector: "#sla-rules-console-form",
      submitLabel: "Apply Rules",
      cancelLabel: "Cancel",
      cancelValue: false
    });
    if (!formData) return { ok: false, reason: "cancelled" };

    const updates = {
      initiativeMode: String(formData.get("initiativeMode") ?? "escalation"),
      pulpSla: formData.get("pulpSla") !== null,
      showManipulationSkills: formData.get("showManipulationSkills") !== null,
      showSocialSkills: formData.get("showSocialSkills") !== null,
      showSupernaturalSkills: formData.get("showSupernaturalSkills") !== null,
      combatTargetingMode: String(formData.get("combatTargetingMode") ?? "prefer-selected"),
      ammoDeficitMode: String(formData.get("ammoDeficitMode") ?? "warn"),
      debugRollOverlay: formData.get("debugRollOverlay") !== null
    };

    for (const def of this.SETTINGS) {
      if (!(def.key in updates)) continue;
      await game.settings.set("sla-industries-brp", def.key, updates[def.key]);
    }

    ui.notifications.info("SLA rules updated.");
    return { ok: true, updates };
  }
}
