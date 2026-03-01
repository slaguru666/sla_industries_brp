import { SLADialog } from "../apps/sla-dialog.mjs";
import { SLATraitEngine } from "./trait-engine.mjs";
import { SLATraitValidator } from "./trait-validator.mjs";

export class SLATraitUI {
  static async openStateEditor(actorRef) {
    const actor = SLATraitEngine.resolveActor(actorRef);
    if (!actor) {
      ui.notifications.warn("Trait editor: actor not found.");
      return { ok: false, reason: "no-actor" };
    }

    const state = await SLATraitEngine.getState(actor, { clean: true });
    const report = await SLATraitValidator.validateActor(actor, { includeRollPreview: false });

    const content = `
      <form id="sla-trait-state-editor" class="brp">
        <div class="diff-label">SLA Trait State Editor: ${actor.name}</div>
        <p style="margin:6px 0 10px 0;">Edit trait runtime conditions as JSON. These flags drive conditional trait modifiers.</p>
        <div class="flexrow" style="gap:8px;align-items:flex-start;">
          <label style="min-width:130px;">Conditions JSON</label>
          <textarea name="conditions" rows="14" style="width:100%;font-family:monospace;">${foundry.utils.escapeHTML(JSON.stringify(state.conditions ?? {}, null, 2))}</textarea>
        </div>
        <p style="margin-top:8px;"><strong>Validation:</strong> ${report.ok ? "OK" : "Issues detected"}</p>
      </form>
    `;

    const formData = await SLADialog.waitForm({
      title: "SLA Trait State",
      content,
      formSelector: "#sla-trait-state-editor",
      submitLabel: "Save Trait State",
      cancelLabel: "Cancel",
      cancelValue: false
    });

    if (!formData) return { ok: false, reason: "cancelled" };

    let parsed = {};
    try {
      parsed = JSON.parse(String(formData.get("conditions") ?? "{}"));
    } catch (err) {
      ui.notifications.error("Trait state JSON is invalid.");
      return { ok: false, reason: "invalid-json", error: err };
    }

    state.conditions = parsed && typeof parsed === "object" ? parsed : {};
    await SLATraitEngine.setState(actor, state);
    ui.notifications.info(`Trait state updated for ${actor.name}.`);
    return { ok: true };
  }
}
