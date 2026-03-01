import { SLATraitEngine } from "./trait-engine.mjs";

export class SLATraitHooks {
  static registerHooks() {
    Hooks.once("ready", async () => {
      if (!game.user?.isGM) return;
      try {
        // Session abilities reset at world session start.
        await SLATraitEngine.resetAllSessionUsage({ includeNPC: false });
      } catch (err) {
        console.warn("sla-industries-brp | Trait session reset failed", err);
      }
    });
  }
}
