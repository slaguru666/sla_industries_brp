export class SLASkillPoints {
  static DEFAULTS = {
    professionalTotal: 300,
    generalTotal: 120,
    professionalPerSkillMax: 45,
    generalPerSkillMax: 25,
    creationCap: 75,
    professionalSeedPerSkill: 20
  };

  static resolveActor(actor) {
    if (!actor) return null;
    if (actor instanceof Actor) return actor;
    if (typeof actor === "string") {
      return game.actors.get(actor) ?? game.actors.getName(actor) ?? null;
    }
    if (actor.id) return game.actors.get(actor.id) ?? null;
    return null;
  }

  static getBrpid(document) {
    if (!document) return "";
    return String(
      document.flags?.[game.system.id]?.brpidFlag?.id
      ?? document.flags?.brp?.brpidFlag?.id
      ?? ""
    );
  }

  static normalizeText(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static resolveTrainingPackageDoc(ref = null, actor = null) {
    if (ref && ref.type === "profession") return ref;

    const candidates = game.items.filter((item) => item.type === "profession");
    if (!candidates.length) return null;

    if (!ref && actor) {
      const existing = actor.items.find((item) => item.type === "profession");
      if (existing) return existing;
    }

    if (typeof ref !== "string" || !ref.trim()) return null;
    const lookup = ref.trim();
    const norm = this.normalizeText(lookup);
    const byBrpid = candidates.find((item) => this.getBrpid(item) === lookup);
    if (byBrpid) return byBrpid;
    return candidates.find((item) => this.normalizeText(item.name) === norm) ?? null;
  }

  static getTrainingMeta(actor, packageDoc = null) {
    const resolvedPackage = packageDoc ?? this.resolveTrainingPackageDoc(null, actor);
    const meta = foundry.utils.deepClone(
      resolvedPackage?.flags?.[game.system.id]?.slaTraining
      ?? resolvedPackage?.flags?.brp?.slaTraining
      ?? {}
    );

    const fromActor = actor?.system?.skillPools ?? {};
    const professionalTotal = Number(
      meta.professionalSkillPool
      ?? fromActor?.professional?.total
      ?? this.DEFAULTS.professionalTotal
    );
    const generalTotal = Number(
      meta.generalSkillPool
      ?? fromActor?.general?.total
      ?? this.DEFAULTS.generalTotal
    );
    const professionalPerSkillMax = Number(
      meta.professionalSkillMax
      ?? fromActor?.professional?.perSkillMax
      ?? this.DEFAULTS.professionalPerSkillMax
    );
    const generalPerSkillMax = Number(
      meta.generalSkillMax
      ?? fromActor?.general?.perSkillMax
      ?? this.DEFAULTS.generalPerSkillMax
    );
    const creationCap = Number(
      meta.creationSkillCap
      ?? fromActor?.creationCap
      ?? this.DEFAULTS.creationCap
    );
    const professionalSeedPerSkill = Number(
      meta.professionalSeedPerSkill
      ?? fromActor?.professional?.seedPerSkill
      ?? this.DEFAULTS.professionalSeedPerSkill
    );

    const skillBrpids = Array.isArray(meta.skillBrpids) ? meta.skillBrpids.filter(Boolean) : [];
    return {
      packageDoc: resolvedPackage ?? null,
      professionalTotal: Number.isFinite(professionalTotal) ? professionalTotal : this.DEFAULTS.professionalTotal,
      generalTotal: Number.isFinite(generalTotal) ? generalTotal : this.DEFAULTS.generalTotal,
      professionalPerSkillMax: Number.isFinite(professionalPerSkillMax) ? professionalPerSkillMax : this.DEFAULTS.professionalPerSkillMax,
      generalPerSkillMax: Number.isFinite(generalPerSkillMax) ? generalPerSkillMax : this.DEFAULTS.generalPerSkillMax,
      creationCap: Number.isFinite(creationCap) ? creationCap : this.DEFAULTS.creationCap,
      professionalSeedPerSkill: Number.isFinite(professionalSeedPerSkill) ? professionalSeedPerSkill : this.DEFAULTS.professionalSeedPerSkill,
      skillBrpids,
      skillRefs: Array.isArray(meta.skillRefs) ? meta.skillRefs : []
    };
  }

  static getProfessionalSkillSet(actor, meta = null) {
    const set = new Set();
    const source = meta ?? this.getTrainingMeta(actor);
    for (const brpid of source.skillBrpids ?? []) {
      if (brpid) set.add(String(brpid));
    }

    if (!set.size && actor?.system?.trainingPackage?.professionalSkills?.length) {
      for (const brpid of actor.system.trainingPackage.professionalSkills) {
        if (brpid) set.add(String(brpid));
      }
    }

    if (!set.size && actor) {
      const profession = actor.items.find((item) => item.type === "profession");
      const rows = profession?.system?.skills ?? [];
      for (const row of rows) {
        if (row?.brpid) set.add(String(row.brpid));
      }
    }

    // Fallback and compatibility: any skill flagged as occupation/professional
    // is considered a professional package skill for pool restrictions + seeding.
    if (actor) {
      for (const skill of actor.items.filter((item) => item.type === "skill")) {
        if (!skill.system?.occupation) continue;
        const brpid = this.getBrpid(skill);
        if (brpid) set.add(String(brpid));
      }
    }
    return set;
  }

  static getCreationCapForActor(actor) {
    const actorDoc = this.resolveActor(actor) ?? actor;
    const cap = Number(actorDoc?.system?.skillPools?.creationCap);
    if (Number.isFinite(cap)) return cap;
    const meta = this.getTrainingMeta(actorDoc);
    return Number(meta.creationCap ?? this.DEFAULTS.creationCap);
  }

  static getSkillOutsidePoolBase(skill) {
    return Number(skill?.system?.base ?? 0)
      + Number(skill?.system?.culture ?? 0)
      + Number(skill?.system?.personality ?? 0)
      + Number(skill?.system?.effects ?? 0)
      + Number(skill?.system?.xp ?? 0);
  }

  static buildPoolState(actor, meta = null) {
    const actorDoc = this.resolveActor(actor) ?? actor;
    const trainingMeta = meta ?? this.getTrainingMeta(actorDoc);
    const professionalSet = this.getProfessionalSkillSet(actorDoc, trainingMeta);

    let spentProfessional = 0;
    let spentGeneral = 0;
    for (const skill of actorDoc?.items?.filter((item) => item.type === "skill") ?? []) {
      spentProfessional += Math.max(0, Number(skill.system?.profession ?? 0));
      spentGeneral += Math.max(0, Number(skill.system?.personal ?? 0));
    }

    const professionalTotal = Math.max(0, Number(trainingMeta.professionalTotal ?? this.DEFAULTS.professionalTotal));
    const generalTotal = Math.max(0, Number(trainingMeta.generalTotal ?? this.DEFAULTS.generalTotal));

    return {
      creationMode: Boolean(actorDoc?.system?.creationMode ?? true),
      creationCap: Math.max(1, Number(trainingMeta.creationCap ?? this.DEFAULTS.creationCap)),
      professional: {
        total: professionalTotal,
        spent: spentProfessional,
        remaining: Math.max(0, professionalTotal - spentProfessional),
        perSkillMax: Math.max(1, Number(trainingMeta.professionalPerSkillMax ?? this.DEFAULTS.professionalPerSkillMax)),
        seedPerSkill: Math.max(0, Number(trainingMeta.professionalSeedPerSkill ?? this.DEFAULTS.professionalSeedPerSkill))
      },
      general: {
        total: generalTotal,
        spent: spentGeneral,
        remaining: Math.max(0, generalTotal - spentGeneral),
        perSkillMax: Math.max(1, Number(trainingMeta.generalPerSkillMax ?? this.DEFAULTS.generalPerSkillMax))
      },
      packageName: trainingMeta.packageDoc?.name ?? String(actorDoc?.system?.trainingPackage?.name ?? ""),
      packageSkillBrpids: [...professionalSet]
    };
  }

  static async initializeForActor({
    actor,
    trainingPackage = null,
    resetAllocations = false,
    preserveGeneral = false,
    creationMode = true,
    seedPackageProfessional = false,
    professionalSeedPerSkill = null
  } = {}) {
    const actorDoc = this.resolveActor(actor);
    if (!actorDoc || actorDoc.type !== "character") return null;

    const packageDoc = this.resolveTrainingPackageDoc(trainingPackage, actorDoc);
    const meta = this.getTrainingMeta(actorDoc, packageDoc);
    const packageSkillSet = this.getProfessionalSkillSet(actorDoc, meta);

    if (resetAllocations) {
      const updates = [];
      for (const skill of actorDoc.items.filter((item) => item.type === "skill")) {
        const patch = { _id: skill.id };
        let changed = false;
        if (Number(skill.system?.profession ?? 0) !== 0) {
          patch["system.profession"] = 0;
          changed = true;
        }
        if (!preserveGeneral && Number(skill.system?.personal ?? 0) !== 0) {
          patch["system.personal"] = 0;
          changed = true;
        }
        if (changed) updates.push(patch);
      }
      if (updates.length) {
        await Item.updateDocuments(updates, { parent: actorDoc });
      }
    }

    if (seedPackageProfessional && packageSkillSet.size) {
      const allSkills = actorDoc.items.filter((item) => item.type === "skill");
      const seedValue = Math.max(
        0,
        Math.floor(
          Number(
            professionalSeedPerSkill
            ?? meta.professionalSeedPerSkill
            ?? this.DEFAULTS.professionalSeedPerSkill
          )
        )
      );
      const proPerSkillMax = Math.max(1, Number(meta.professionalPerSkillMax ?? this.DEFAULTS.professionalPerSkillMax));
      const creationCap = Math.max(1, Number(meta.creationCap ?? this.DEFAULTS.creationCap));
      let seedBudget = Math.max(0, Number(meta.professionalTotal ?? this.DEFAULTS.professionalTotal));
      const updates = [];

      for (const skill of allSkills) {
        const brpid = this.getBrpid(skill);
        const isPackageSkill = packageSkillSet.has(brpid);
        const currentPro = Math.max(0, Number(skill.system?.profession ?? 0));
        const currentGen = Math.max(0, Number(skill.system?.personal ?? 0));
        let targetPro = currentPro;

        if (isPackageSkill) {
          const outside = this.getSkillOutsidePoolBase(skill);
          const allocCap = Math.max(0, creationCap - outside);
          const allowedProByCap = Math.max(0, allocCap - currentGen);
          targetPro = Math.min(seedValue, proPerSkillMax, allowedProByCap);
          const growth = Math.max(0, targetPro - currentPro);
          if (growth > seedBudget) {
            targetPro = currentPro + seedBudget;
          }
          seedBudget = Math.max(0, seedBudget - Math.max(0, targetPro - currentPro));
        } else if (resetAllocations && currentPro !== 0) {
          targetPro = 0;
        }

        if (targetPro !== currentPro) {
          updates.push({
            _id: skill.id,
            "system.profession": targetPro
          });
        }
      }

      if (updates.length) {
        await Item.updateDocuments(updates, { parent: actorDoc });
      }
    }

    const state = this.buildPoolState(actorDoc, meta);
    await actorDoc.update({
      "system.creationMode": Boolean(creationMode),
      "system.trainingPackage.name": packageDoc?.name ?? "",
      "system.trainingPackage.professionalSkills": [...packageSkillSet],
      "system.skillPools.creationCap": state.creationCap,
      "system.skillPools.professional.total": state.professional.total,
      "system.skillPools.professional.spent": state.professional.spent,
      "system.skillPools.professional.remaining": state.professional.remaining,
      "system.skillPools.professional.perSkillMax": state.professional.perSkillMax,
      "system.skillPools.professional.seedPerSkill": state.professional.seedPerSkill,
      "system.skillPools.general.total": state.general.total,
      "system.skillPools.general.spent": state.general.spent,
      "system.skillPools.general.remaining": state.general.remaining,
      "system.skillPools.general.perSkillMax": state.general.perSkillMax
    });

    return state;
  }

  static async finalizeCreation(actor) {
    const actorDoc = this.resolveActor(actor);
    if (!actorDoc || actorDoc.type !== "character") return null;
    const synced = await this.syncActorSkillPools(actorDoc, { clamp: true });
    await actorDoc.update({ "system.creationMode": false });
    return synced;
  }

  static async syncActorSkillPools(actor, { clamp = true } = {}) {
    const actorDoc = this.resolveActor(actor);
    if (!actorDoc || actorDoc.type !== "character") return null;

    const meta = this.getTrainingMeta(actorDoc);
    const packageSkills = this.getProfessionalSkillSet(actorDoc, meta);
    const state = this.buildPoolState(actorDoc, meta);

    const updates = [];
    if (clamp && state.creationMode) {
      for (const skill of actorDoc.items.filter((item) => item.type === "skill")) {
        const brpid = this.getBrpid(skill);
        let pro = Math.max(0, Number(skill.system?.profession ?? 0));
        let gen = Math.max(0, Number(skill.system?.personal ?? 0));
        const outside = this.getSkillOutsidePoolBase(skill);
        const isPackageSkill = packageSkills.has(brpid);

        if (!isPackageSkill && pro > 0) pro = 0;

        pro = Math.min(pro, state.professional.perSkillMax);
        gen = Math.min(gen, state.general.perSkillMax);

        const allocCap = Math.max(0, state.creationCap - outside);
        if ((pro + gen) > allocCap) {
          let overflow = (pro + gen) - allocCap;
          const dropGen = Math.min(gen, overflow);
          gen -= dropGen;
          overflow -= dropGen;
          if (overflow > 0) {
            pro = Math.max(0, pro - overflow);
          }
        }

        if (
          pro !== Number(skill.system?.profession ?? 0)
          || gen !== Number(skill.system?.personal ?? 0)
        ) {
          updates.push({
            _id: skill.id,
            "system.profession": pro,
            "system.personal": gen
          });
        }
      }
    }

    if (updates.length) {
      await Item.updateDocuments(updates, { parent: actorDoc });
    }

    const finalState = this.buildPoolState(actorDoc, meta);
    await actorDoc.update({
      "system.skillPools.creationCap": finalState.creationCap,
      "system.skillPools.professional.total": finalState.professional.total,
      "system.skillPools.professional.spent": finalState.professional.spent,
      "system.skillPools.professional.remaining": finalState.professional.remaining,
      "system.skillPools.professional.perSkillMax": finalState.professional.perSkillMax,
      "system.skillPools.professional.seedPerSkill": finalState.professional.seedPerSkill,
      "system.skillPools.general.total": finalState.general.total,
      "system.skillPools.general.spent": finalState.general.spent,
      "system.skillPools.general.remaining": finalState.general.remaining,
      "system.skillPools.general.perSkillMax": finalState.general.perSkillMax,
      "system.trainingPackage.professionalSkills": finalState.packageSkillBrpids
    });

    return { ...finalState, updates: updates.length };
  }

  static async allocateSkillPoints({
    actor,
    skill,
    field,
    value
  } = {}) {
    const actorDoc = this.resolveActor(actor);
    if (!actorDoc || actorDoc.type !== "character") {
      return { ok: false, error: "Invalid actor." };
    }
    if (!actorDoc.system?.creationMode) {
      return { ok: false, error: "Skill point allocation is locked after character creation." };
    }

    const skillDoc = typeof skill === "string"
      ? actorDoc.items.get(skill)
      : skill;
    if (!skillDoc || skillDoc.type !== "skill") {
      return { ok: false, error: "Invalid skill." };
    }

    const normalizedField = String(field ?? "").toLowerCase();
    const isProfessional = normalizedField === "profession" || normalizedField === "professional";
    const isGeneral = normalizedField === "personal" || normalizedField === "general";
    if (!isProfessional && !isGeneral) {
      return { ok: false, error: "Unsupported allocation field." };
    }

    const state = this.buildPoolState(actorDoc);
    const brpid = this.getBrpid(skillDoc);
    const inPackage = state.packageSkillBrpids.includes(brpid);
    if (isProfessional && !inPackage) {
      return { ok: false, error: "Professional points can only be spent on package skills." };
    }

    const currentPro = Math.max(0, Number(skillDoc.system?.profession ?? 0));
    const currentGen = Math.max(0, Number(skillDoc.system?.personal ?? 0));
    const outside = this.getSkillOutsidePoolBase(skillDoc);

    const requested = Math.max(0, Math.floor(Number(value ?? 0)));
    const targetProUncapped = isProfessional ? requested : currentPro;
    const targetGenUncapped = isGeneral ? requested : currentGen;

    let targetPro = Math.min(targetProUncapped, state.professional.perSkillMax);
    let targetGen = Math.min(targetGenUncapped, state.general.perSkillMax);

    const allocCap = Math.max(0, state.creationCap - outside);
    if ((targetPro + targetGen) > allocCap) {
      if (isProfessional) {
        targetPro = Math.max(0, allocCap - targetGen);
      } else {
        targetGen = Math.max(0, allocCap - targetPro);
      }
    }

    const delta = isProfessional ? (targetPro - currentPro) : (targetGen - currentGen);
    const remaining = isProfessional ? state.professional.remaining : state.general.remaining;
    if (delta > remaining) {
      if (isProfessional) {
        targetPro = currentPro + remaining;
      } else {
        targetGen = currentGen + remaining;
      }
    }

    const finalPro = Math.max(0, Math.floor(targetPro));
    const finalGen = Math.max(0, Math.floor(targetGen));
    const changed = finalPro !== currentPro || finalGen !== currentGen;
    if (!changed) {
      const adjusted = requested !== (isProfessional ? finalPro : finalGen);
      return {
        ok: true,
        changed: false,
        adjusted,
        value: isProfessional ? finalPro : finalGen
      };
    }

    await skillDoc.update({
      "system.profession": finalPro,
      "system.personal": finalGen
    });

    const synced = await this.syncActorSkillPools(actorDoc, { clamp: true });
    return {
      ok: true,
      changed: true,
      adjusted: requested !== (isProfessional ? finalPro : finalGen),
      value: isProfessional ? finalPro : finalGen,
      state: synced
    };
  }

  static async autoAllocateForActor({
    actor,
    strategy = "balanced",
    finalize = false
  } = {}) {
    const actorDoc = this.resolveActor(actor);
    if (!actorDoc || actorDoc.type !== "character") {
      return { ok: false, error: "Invalid actor." };
    }

    const syncedState = await this.syncActorSkillPools(actorDoc, { clamp: true });
    if (!syncedState?.creationMode) {
      return { ok: false, error: "Skill point allocation is locked after character creation." };
    }

    const allSkills = actorDoc.items.filter((item) => item.type === "skill");
    const byBrpid = new Map(
      allSkills.map((item) => [this.getBrpid(item), item])
    );
    const packageSkills = (syncedState.packageSkillBrpids ?? [])
      .map((brpid) => byBrpid.get(brpid))
      .filter(Boolean);

    const proMap = new Map(allSkills.map((item) => [item.id, Math.max(0, Number(item.system?.profession ?? 0))]));
    const genMap = new Map(allSkills.map((item) => [item.id, Math.max(0, Number(item.system?.personal ?? 0))]));

    const canAddPoint = (skill, field) => {
      const currentPro = proMap.get(skill.id) ?? 0;
      const currentGen = genMap.get(skill.id) ?? 0;
      const outside = this.getSkillOutsidePoolBase(skill);
      if ((outside + currentPro + currentGen) >= syncedState.creationCap) return false;
      if (field === "professional") {
        return currentPro < syncedState.professional.perSkillMax;
      }
      return currentGen < syncedState.general.perSkillMax;
    };

    const distribute = (skills, field, points) => {
      if (!skills.length || points <= 0) return points;
      let remaining = Math.max(0, Math.floor(points));
      let cursor = 0;
      let noProgress = 0;
      const limit = Math.max(1, skills.length);

      while (remaining > 0 && noProgress < limit) {
        const skill = skills[cursor % skills.length];
        cursor += 1;

        if (!canAddPoint(skill, field)) {
          noProgress += 1;
          continue;
        }

        if (field === "professional") {
          proMap.set(skill.id, (proMap.get(skill.id) ?? 0) + 1);
        } else {
          genMap.set(skill.id, (genMap.get(skill.id) ?? 0) + 1);
        }
        remaining -= 1;
        noProgress = 0;
      }

      return remaining;
    };

    const proUnspent = distribute(
      packageSkills,
      "professional",
      syncedState.professional.remaining
    );

    let generalTargets = [...allSkills].sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
    if (strategy === "package-first" && packageSkills.length) {
      const packageIds = new Set(packageSkills.map((item) => item.id));
      generalTargets = [
        ...packageSkills,
        ...generalTargets.filter((item) => !packageIds.has(item.id))
      ];
    }
    const genUnspent = distribute(
      generalTargets,
      "general",
      syncedState.general.remaining
    );

    const updates = [];
    for (const skill of allSkills) {
      const nextPro = proMap.get(skill.id) ?? 0;
      const nextGen = genMap.get(skill.id) ?? 0;
      const currentPro = Math.max(0, Number(skill.system?.profession ?? 0));
      const currentGen = Math.max(0, Number(skill.system?.personal ?? 0));
      if (nextPro !== currentPro || nextGen !== currentGen) {
        updates.push({
          _id: skill.id,
          "system.profession": nextPro,
          "system.personal": nextGen
        });
      }
    }

    if (updates.length) {
      await Item.updateDocuments(updates, { parent: actorDoc });
    }

    const stateAfter = await this.syncActorSkillPools(actorDoc, { clamp: true });
    if (finalize) {
      await this.finalizeCreation(actorDoc);
    }

    return {
      ok: true,
      strategy,
      updatedSkills: updates.length,
      unspent: {
        professional: proUnspent,
        general: genUnspent
      },
      state: stateAfter
    };
  }
}
