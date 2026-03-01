export class SLARollPipeline {
  static formatSigned(value = 0) {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return "+0";
    return `${n >= 0 ? "+" : ""}${n}`;
  }

  static buildTargetBreakdown(config = {}) {
    const base = Number(config.targetBase ?? config.rawScore ?? 0);
    const manual = Number(config.flatMod ?? 0);
    const status = Number(config.systemFlatModTotal ?? 0);
    const fireModeBonus = Number(config.fireModeHitBonus ?? 0);
    const finalTarget = Number(config.targetScore ?? 0);
    const capApplied = Number(config.targetCapApplied ?? 0);

    const parts = [
      `Base ${base}%`,
      `Manual ${this.formatSigned(manual)}%`,
      `SLA Mods ${this.formatSigned(status)}%`
    ];

    if (fireModeBonus !== 0) {
      parts.push(`Fire Mode ${this.formatSigned(fireModeBonus)}%`);
    }
    parts.push(`Final ${finalTarget}%`);
    if (capApplied > 0) parts.push(`Cap -${capApplied}%`);
    return parts.join(" | ");
  }

  static debugPayload(config = {}) {
    return {
      rollType: String(config.rollType ?? ""),
      cardType: String(config.cardType ?? ""),
      edge: String(config.diff ?? "normal"),
      rawScore: Number(config.rawScore ?? 0),
      targetBase: Number(config.targetBase ?? 0),
      targetAfterManual: Number(config.targetAfterManual ?? 0),
      targetPreCap: Number(config.targetPreCap ?? 0),
      targetFinal: Number(config.targetScore ?? 0),
      targetCapApplied: Number(config.targetCapApplied ?? 0),
      manualFlat: Number(config.flatMod ?? 0),
      systemFlat: Number(config.systemFlatModTotal ?? 0),
      traitFlat: Number(config.traitFlatMod ?? 0),
      fireModeBonus: Number(config.fireModeHitBonus ?? 0),
      totalFlat: Number(config.totalFlatMod ?? 0),
      edgeText: String(config.edgeRollText ?? ""),
      diceRolled: String(config.diceRolled ?? ""),
      rollVal: Number(config.rollVal ?? 0),
      resultLevel: Number(config.resultLevel ?? -1)
    };
  }
}
