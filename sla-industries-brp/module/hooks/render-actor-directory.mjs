export function listen() {
  Hooks.on("renderActorDirectory", (app, html) => {
    injectSLAActorCreateButton(app, html);
    injectNpcSeedButton(app, html);
  });

  Hooks.on("renderSidebarTab", (app, html) => {
    const isActorsTab = app?.tabName === "actors" || app?.options?.id === "actors";
    if (!isActorsTab) return;
    injectSLAActorCreateButton(app, html);
    injectNpcSeedButton(app, html);
  });
}

function injectSLAActorCreateButton(_app, html) {
  const root = $(html);
  if (root.find(".sla-create-operative").length) return;

  const createBtn = findCreateActorButton(root);
  if (!createBtn?.length) return;

  const button = $(`
    <button type="button" class="sla-create-operative">
      <i class="fas fa-user-astronaut"></i> Create SLA Operative
    </button>
  `);

  button.on("click", async () => {
    await openSLAActorCreateDialog();
  });

  createBtn.after(button);
}

function injectNpcSeedButton(_app, html) {
  const canManage = Boolean(game.user?.isGM);
  if (!canManage) return;

  const root = $(html);
  if (root.find(".sla-seed-npc-adversaries").length) return;

  const createBtn = findCreateActorButton(root);
  if (!createBtn?.length) return;

  const button = $(`
    <button type="button" class="sla-seed-npc-adversaries">
      <i class="fas fa-skull-crossbones"></i> Seed NPC Adversaries
    </button>
  `);

  button.on("click", async () => {
    const toolkit = game.brp?.SLABPNToolkit;
    if (!toolkit?.seedWorldNpcAdversaries) {
      ui.notifications.warn("NPC seeding API is not available.");
      return;
    }
    await toolkit.ensureCoreJournals({ notify: false });
    await toolkit.seedWorldNpcAdversaries({ overwrite: false, notify: true });
  });

  createBtn.after(button);
}

function findCreateActorButton(root) {
  const byClass = root.find("button.create-document, a.create-document");
  if (byClass.length) return byClass.first();

  const byAction = root.find("button[data-action='createDocument'], a[data-action='createDocument']");
  if (byAction.length) return byAction.first();

  const allButtons = root.find("button, a");
  const match = allButtons.filter((_, el) => {
    const txt = String(el.textContent ?? "").toLowerCase();
    return txt.includes("create actor");
  });
  if (match.length) return match.first();

  return null;
}

async function openSLAActorCreateDialog() {
  const speciesOptions = await getSeededNames("culture", "SLA Species", [
    "Human",
    "Frother",
    "Ebon",
    "Brain Waster",
    "Wraith Raider",
    "Shaktar",
    "Stormer 313 Malice",
    "Stormer 711 Xeno",
    "Advanced Carrien"
  ]);
  const packageOptions = await getSeededNames("profession", "SLA Training Packages", []);
  const pulpSlaEnabled = Boolean(game.settings.get("sla-industries-brp", "pulpSla"));

  const speciesHtml = speciesOptions
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");
  const packageHtml = [`<option value="__AUTO__">Auto (Species Starter)</option>`]
    .concat(packageOptions.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`))
    .join("");

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const dlg = new Dialog({
      title: "Create SLA Operative",
      content: `
        <form>
          <div class="form-group">
            <label>Name</label>
            <input type="text" name="name" value="New Operative" />
          </div>
          <div class="form-group">
            <label>Automation Mode</label>
            <select name="mode">
              <option value="full">Full Auto (One Click)</option>
              <option value="guided">Guided (Step-by-Step)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Species</label>
            <select name="species">${speciesHtml}</select>
          </div>
          <div class="form-group">
            <label>Training Package</label>
            <select name="packageName">${packageHtml}</select>
          </div>
          <div class="form-group">
            <label>Roll Characteristics</label>
            <input type="checkbox" name="rollCharacteristics" checked />
          </div>
          <div class="form-group">
            <label>Assign Loadout</label>
            <input type="checkbox" name="assignLoadout" checked />
          </div>
          <div class="form-group">
            <label>PULP-SLA (Double Character HP)</label>
            <input type="checkbox" name="pulpSla" ${pulpSlaEnabled ? "checked" : ""} />
          </div>
        </form>
      `,
      buttons: {
        cancel: { label: "Cancel", callback: () => finish(null) },
        create: {
          label: "Create",
          callback: async (html) => {
            try {
              const name = String(html.find("[name='name']").val() ?? "").trim() || "New Operative";
              const mode = String(html.find("[name='mode']").val() ?? "full");
              const species = String(html.find("[name='species']").val() ?? "Human");
              const packageChoice = String(html.find("[name='packageName']").val() ?? "__AUTO__");
              const packageName = packageChoice === "__AUTO__" ? null : packageChoice;
              const rollCharacteristics = html.find("[name='rollCharacteristics']").is(":checked");
              const assignLoadout = html.find("[name='assignLoadout']").is(":checked");
              const pulpSla = html.find("[name='pulpSla']").is(":checked");

              const result = mode === "guided"
                ? await runGuidedSLACharacterCreation({
                  name,
                  speciesDefault: species,
                  packageDefault: packageChoice,
                  rollDefault: rollCharacteristics,
                  loadoutDefault: assignLoadout,
                  pulpSla,
                  speciesOptions,
                  packageOptions
                })
                : await game.brp.SLACharacterGenerator.createCharacter({
                  name,
                  species,
                  packageName,
                  rollCharacteristics,
                  assignLoadout,
                  pulpSla
                });

              if (result?.actor?.sheet) {
                result.actor.sheet.render(true);
              }
              finish(result ?? null);
            } catch (err) {
              console.error("sla-industries-brp | SLA Operative creation failed", err);
              ui.notifications.error("SLA Operative creation failed. Check console for details.");
              finish(null);
            }
          }
        }
      },
      default: "create",
      close: () => finish(null)
    });
    dlg.render(true);
  });
}

async function runGuidedSLACharacterCreation({
  name,
  speciesDefault = "Human",
  packageDefault = "__AUTO__",
  rollDefault = true,
  loadoutDefault = true,
  pulpSla = null,
  speciesOptions = [],
  packageOptions = []
} = {}) {
  const speciesStep = await promptGuidedSpeciesStep({
    speciesDefault,
    rollDefault,
    speciesOptions
  });
  if (!speciesStep) return null;

  const packageStep = await promptGuidedPackageStep({
    packageDefault,
    loadoutDefault,
    packageOptions
  });
  if (!packageStep) return null;

  const summary = await promptGuidedSummary({
    name,
    speciesStep,
    packageStep,
    pulpSla
  });
  if (!summary) return null;

  await syncPulpSlaSetting(pulpSla);

  const actor = await Actor.create({
    name,
    type: "character"
  });

  const result = {
    actor,
    species: null,
    rolls: {},
    trainingPackage: null,
    skills: null,
    loadout: null,
    skillAllocation: null
  };

  if (speciesStep.applySpecies && speciesStep.species !== "__NONE__") {
    const speciesResult = await game.brp.SLACharacterGenerator.applySpecies({
      actor,
      species: speciesStep.species,
      rollCharacteristics: speciesStep.rollCharacteristics,
      overwrite: true
    });
    result.species = speciesResult?.species ?? null;
    result.rolls = speciesResult?.rolls ?? {};
  }

  if (packageStep.applyPackage && packageStep.packageName !== "__NONE__") {
    let packageRef = packageStep.packageName;
    if (packageRef === "__AUTO__") {
      const speciesName = result.species ?? speciesStep.species;
      if (speciesName && speciesName !== "__NONE__") {
        const speciesDoc = await game.brp.SLACharacterGenerator.resolveSeedItem({
          type: "culture",
          ref: speciesName,
          folderName: "SLA Species"
        });
        const starter = speciesDoc
          ? await game.brp.SLACharacterGenerator.resolveStarterPackage(speciesDoc, null)
          : null;
        packageRef = starter?.name ?? "__NONE__";
      } else {
        packageRef = "__NONE__";
      }
    }

    if (packageRef !== "__NONE__") {
      const packageResult = await game.brp.SLACharacterGenerator.applyTrainingPackage({
        actor,
        trainingPackage: packageRef,
        assignLoadout: packageStep.assignLoadout,
        overwrite: true
      });
      result.trainingPackage = packageResult?.trainingPackage ?? null;
      result.skills = packageResult?.skills ?? null;
      result.loadout = packageResult?.loadout ?? null;
    }
  }

  const skillPointsApi = game.brp?.SLASkillPoints;
  const allocationStep = await promptGuidedSkillAllocationStep({
    actor,
    packageName: result.trainingPackage ?? null
  });
  if (!skillPointsApi) {
    console.warn("sla-industries-brp | SLASkillPoints API not found during guided allocation step");
  } else if (allocationStep?.mode === "auto") {
    result.skillAllocation = await skillPointsApi.autoAllocateForActor({
      actor,
      strategy: allocationStep.strategy,
      finalize: allocationStep.finalizeCreation
    });
  } else if (allocationStep?.finalizeCreation) {
    result.skillAllocation = await skillPointsApi.finalizeCreation(actor);
  } else {
    result.skillAllocation = await skillPointsApi.syncActorSkillPools(actor, { clamp: true });
  }

  ui.notifications.info(
    `SLA character generated (guided): ${actor.name} (${result.species ?? "Manual Species"} / ${result.trainingPackage ?? "Manual Package"})`
  );
  return result;
}

async function promptGuidedSpeciesStep({
  speciesDefault = "Human",
  rollDefault = true,
  speciesOptions = []
} = {}) {
  const options = ["__NONE__", ...(speciesOptions ?? [])];
  const speciesHtml = options
    .map((name) => {
      const label = name === "__NONE__" ? "None (Manual Later)" : name;
      const selected = name === speciesDefault ? "selected" : "";
      return `<option value="${escapeHtml(name)}" ${selected}>${escapeHtml(label)}</option>`;
    })
    .join("");

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const dlg = new Dialog({
      title: "SLA Guided Creation: Species",
      content: `
        <form>
          <div class="form-group">
            <label>Apply Species</label>
            <input type="checkbox" name="applySpecies" checked />
          </div>
          <div class="form-group">
            <label>Species</label>
            <select name="species">${speciesHtml}</select>
          </div>
          <div class="form-group">
            <label>Roll Characteristics Now</label>
            <input type="checkbox" name="rollCharacteristics" ${rollDefault ? "checked" : ""} />
          </div>
        </form>
      `,
      buttons: {
        cancel: { label: "Cancel", callback: () => finish(null) },
        next: {
          label: "Next",
          callback: (html) => finish({
            applySpecies: html.find("[name='applySpecies']").is(":checked"),
            species: String(html.find("[name='species']").val() ?? "__NONE__"),
            rollCharacteristics: html.find("[name='rollCharacteristics']").is(":checked")
          })
        }
      },
      default: "next",
      close: () => finish(null)
    });
    dlg.render(true);
  });
}

async function promptGuidedPackageStep({
  packageDefault = "__AUTO__",
  loadoutDefault = true,
  packageOptions = []
} = {}) {
  const options = ["__AUTO__", "__NONE__", ...(packageOptions ?? [])];
  const packageHtml = options
    .map((name) => {
      let label = name;
      if (name === "__AUTO__") label = "Auto (Species Starter)";
      if (name === "__NONE__") label = "None (Manual Later)";
      const selected = name === packageDefault ? "selected" : "";
      return `<option value="${escapeHtml(name)}" ${selected}>${escapeHtml(label)}</option>`;
    })
    .join("");

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const dlg = new Dialog({
      title: "SLA Guided Creation: Package & Loadout",
      content: `
        <form>
          <div class="form-group">
            <label>Apply Training Package</label>
            <input type="checkbox" name="applyPackage" checked />
          </div>
          <div class="form-group">
            <label>Training Package</label>
            <select name="packageName">${packageHtml}</select>
          </div>
          <div class="form-group">
            <label>Assign Loadout</label>
            <input type="checkbox" name="assignLoadout" ${loadoutDefault ? "checked" : ""} />
          </div>
        </form>
      `,
      buttons: {
        cancel: { label: "Cancel", callback: () => finish(null) },
        next: {
          label: "Next",
          callback: (html) => finish({
            applyPackage: html.find("[name='applyPackage']").is(":checked"),
            packageName: String(html.find("[name='packageName']").val() ?? "__AUTO__"),
            assignLoadout: html.find("[name='assignLoadout']").is(":checked")
          })
        }
      },
      default: "next",
      close: () => finish(null)
    });
    dlg.render(true);
  });
}

async function promptGuidedSummary({
  name,
  speciesStep,
  packageStep,
  pulpSla = null
} = {}) {
  const speciesLabel = speciesStep?.species === "__NONE__" ? "Manual" : String(speciesStep?.species ?? "Manual");
  const packageLabel = packageStep?.packageName === "__AUTO__"
    ? "Auto Starter"
    : (packageStep?.packageName === "__NONE__" ? "Manual" : String(packageStep?.packageName ?? "Manual"));
  const pulpLabel = pulpSla === null || pulpSla === undefined
    ? (Boolean(game.settings.get("sla-industries-brp", "pulpSla")) ? "Enabled" : "Disabled")
    : (Boolean(pulpSla) ? "Enabled" : "Disabled");

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const dlg = new Dialog({
      title: "SLA Guided Creation: Confirm",
      content: `
        <div>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Species:</strong> ${escapeHtml(speciesLabel)} (${speciesStep?.applySpecies ? "apply" : "skip"})</p>
          <p><strong>Roll Characteristics:</strong> ${speciesStep?.rollCharacteristics ? "Yes" : "No"}</p>
          <p><strong>Training Package:</strong> ${escapeHtml(packageLabel)} (${packageStep?.applyPackage ? "apply" : "skip"})</p>
          <p><strong>Assign Loadout:</strong> ${packageStep?.assignLoadout ? "Yes" : "No"}</p>
          <p><strong>PULP-SLA:</strong> ${escapeHtml(pulpLabel)} (double HP for character actors)</p>
        </div>
      `,
      buttons: {
        cancel: { label: "Cancel", callback: () => finish(false) },
        create: { label: "Create Character", callback: () => finish(true) }
      },
      default: "create",
      close: () => finish(false)
    });
    dlg.render(true);
  });
}

async function promptGuidedSkillAllocationStep({
  actor,
  packageName = null
} = {}) {
  const skillPointsApi = game.brp?.SLASkillPoints;
  if (!skillPointsApi) {
    return {
      mode: "manual",
      strategy: "balanced",
      finalizeCreation: false
    };
  }
  const state = await skillPointsApi.syncActorSkillPools(actor, { clamp: true });
  const packageLabel = packageName ?? state?.packageName ?? "None";
  const creationCap = Number(state?.creationCap ?? 75);
  const proLeft = Number(state?.professional?.remaining ?? 0);
  const genLeft = Number(state?.general?.remaining ?? 0);
  const modeDefault = (proLeft + genLeft) > 0 ? "auto" : "manual";

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const dlg = new Dialog({
      title: "SLA Guided Creation: Allocate Skill Points",
      content: `
        <form>
          <p><strong>Training Package:</strong> ${escapeHtml(packageLabel)}</p>
          <p><strong>Creation Cap:</strong> ${creationCap}%</p>
          <p><strong>Professional Remaining:</strong> ${proLeft}</p>
          <p><strong>General Remaining:</strong> ${genLeft}</p>
          <div class="form-group">
            <label>Allocation Mode</label>
            <select name="allocationMode">
              <option value="manual" ${modeDefault === "manual" ? "selected" : ""}>Manual (allocate in sheet)</option>
              <option value="auto" ${modeDefault === "auto" ? "selected" : ""}>Auto Allocate Now</option>
            </select>
          </div>
          <div class="form-group">
            <label>Auto Strategy</label>
            <select name="allocationStrategy">
              <option value="balanced">Balanced (all skills)</option>
              <option value="package-first">Package First, then all skills</option>
            </select>
          </div>
          <div class="form-group">
            <label>Finalize Creation (lock allocation)</label>
            <input type="checkbox" name="finalizeCreation" />
          </div>
        </form>
      `,
      buttons: {
        next: {
          label: "Next",
          callback: (html) => {
            const mode = String(html.find("[name='allocationMode']").val() ?? "manual");
            finish({
              mode,
              strategy: String(html.find("[name='allocationStrategy']").val() ?? "balanced"),
              finalizeCreation: html.find("[name='finalizeCreation']").is(":checked")
            });
          }
        }
      },
      default: "next",
      close: () => finish({
        mode: "manual",
        strategy: "balanced",
        finalizeCreation: false
      })
    });
    dlg.render(true);
  });
}

async function syncPulpSlaSetting(enabled = null) {
  if (enabled === null || enabled === undefined) return;
  if (!game.user?.isGM) return;
  const nextValue = Boolean(enabled);
  const current = Boolean(game.settings.get("sla-industries-brp", "pulpSla"));
  if (current === nextValue) return;
  await game.settings.set("sla-industries-brp", "pulpSla", nextValue);
}

async function getSeededNames(type, folderName, fallback = []) {
  const names = game.items
    .filter((item) => item.type === type && item.folder?.name === folderName)
    .map((item) => String(item.name ?? "").trim())
    .filter(Boolean);
  if (!names.length) return [...fallback];
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
