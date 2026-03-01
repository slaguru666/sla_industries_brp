import { SLATraitDefinitions } from "./trait-definitions.mjs";
import { SLATraitEngine } from "./trait-engine.mjs";

export class SLATraitValidator {
  static validateTraitRows(traits = []) {
    const report = {
      ok: true,
      errors: [],
      warnings: [],
      duplicates: [],
      invalidRanks: [],
      conflicts: []
    };

    const byKey = new Map();
    for (const trait of traits) {
      const key = String(trait?.key ?? "").trim();
      if (!key) continue;
      byKey.set(key, (byKey.get(key) ?? 0) + 1);

      const maxRank = Math.max(1, Number(trait?.maxRank ?? SLATraitDefinitions.maxRankFor(key) ?? 1));
      const rank = Number(trait?.rank ?? 1);
      if (!Number.isFinite(rank) || rank < 1 || rank > maxRank) {
        report.invalidRanks.push({ key, rank, maxRank, trait: trait?.name ?? key });
      }
    }

    for (const [key, count] of byKey.entries()) {
      if (count > 1) {
        report.duplicates.push({ key, count });
      }
    }

    for (const [left, right] of SLATraitDefinitions.MUTUALLY_EXCLUSIVE) {
      if (byKey.has(left) && byKey.has(right)) {
        report.conflicts.push({ left, right });
      }
    }

    if (report.invalidRanks.length > 0) {
      report.errors.push(`Invalid trait ranks: ${report.invalidRanks.map((r) => `${r.trait} (${r.rank}/${r.maxRank})`).join(", ")}`);
    }
    if (report.conflicts.length > 0) {
      report.errors.push(`Mutually exclusive traits detected: ${report.conflicts.map((c) => `${c.left} vs ${c.right}`).join(", ")}`);
    }
    if (report.duplicates.length > 0) {
      report.warnings.push(`Duplicate trait entries detected: ${report.duplicates.map((d) => `${d.key} x${d.count}`).join(", ")}`);
    }

    report.ok = report.errors.length === 0;
    return report;
  }

  static coolCapValidation(actor, traits = []) {
    const pow = Math.max(0, Number(actor?.system?.stats?.pow?.total ?? 0));
    const baseCool = Math.max(1, Number(actor?.system?.res5?.max ?? 0) || (pow * 2));

    let percentDelta = 0;
    if (traits.some((t) => t.key === "chicken")) percentDelta -= 10;
    if (traits.some((t) => t.key === "exceedingly-cool")) percentDelta += 10;

    const adjusted = Math.max(1, Math.round(baseCool * (1 + (percentDelta / 100))));
    return {
      baseCool,
      percentDelta,
      adjusted,
      withinBounds: adjusted >= 1 && adjusted <= 99
    };
  }

  static rankBalanceValidation(traits = []) {
    let advantageRanks = 0;
    let disadvantageRanks = 0;
    let neutralRanks = 0;

    for (const trait of traits) {
      const rank = Math.max(1, Number(trait?.rank ?? 1));
      const type = String(trait?.type ?? trait?.definition?.type ?? "neutral").trim().toLowerCase();
      if (type === "advantage") {
        advantageRanks += rank;
      } else if (type === "disadvantage") {
        disadvantageRanks += rank;
      } else {
        neutralRanks += rank;
      }
    }

    const net = advantageRanks - disadvantageRanks;
    return {
      advantageRanks,
      disadvantageRanks,
      neutralRanks,
      net,
      balanced: net === 0
    };
  }

  static async validateActor(actorRef, { includeRollPreview = true } = {}) {
    const actor = SLATraitEngine.resolveActor(actorRef);
    if (!actor) {
      return {
        ok: false,
        errors: ["Actor not found."],
        warnings: []
      };
    }

    const traits = SLATraitEngine.getActorTraits(actor);
    const baseReport = this.validateTraitRows(traits);
    const coolCap = this.coolCapValidation(actor, traits);
    const rankBalance = this.rankBalanceValidation(traits);

    const report = {
      ok: baseReport.ok,
      actor: actor.name,
      traitCount: traits.length,
      errors: [...baseReport.errors],
      warnings: [...baseReport.warnings],
      duplicates: baseReport.duplicates,
      invalidRanks: baseReport.invalidRanks,
      conflicts: baseReport.conflicts,
      coolCap,
      rankBalance,
      rollPreview: null
    };

    if (!coolCap.withinBounds) {
      report.errors.push(`COOL cap out of bounds after trait modifiers (${coolCap.adjusted}).`);
      report.ok = false;
    }

    if (!rankBalance.balanced) {
      report.errors.push(
        `Trait rank balance mismatch: advantages ${rankBalance.advantageRanks} vs disadvantages ${rankBalance.disadvantageRanks} (net ${rankBalance.net >= 0 ? "+" : ""}${rankBalance.net}).`
      );
      report.ok = false;
    }

    if (includeRollPreview) {
      const preview = await SLATraitEngine.getCheckContext(actor, {
        rollType: "SK",
        cardType: "NO",
        label: "Bureaucracy",
        reason: "trait validator preview"
      }, { preview: true });

      report.rollPreview = {
        traitFlatMod: Number(preview.flatMod ?? 0),
        withinCap: Math.abs(Number(preview.flatMod ?? 0)) <= Number(SLATraitDefinitions.TRAIT_MOD_CAP ?? 40),
        summary: String(preview.summary ?? "")
      };

      if (!report.rollPreview.withinCap) {
        report.errors.push(`Trait modifier exceeded cap: ${report.rollPreview.traitFlatMod}%`);
        report.ok = false;
      }
    }

    return report;
  }
}
