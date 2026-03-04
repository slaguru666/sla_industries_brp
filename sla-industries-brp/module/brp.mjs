
import { BRPCharacterSheet } from "./actor/sheets/character.mjs";
import { BRPHooks } from './hooks/index.mjs'
import { BRPSystemSocket } from "./apps/socket.mjs"
import { BRPUtilities } from "./apps/utilities.mjs"
import { BRPMenu } from "./setup/menu.mjs"
import * as Chat from "./apps/chat.mjs";
import Init from './hooks/init.mjs';
import renderSceneControls from "./hooks/render-scene-controls.mjs"
import RenderRegionConfig from './hooks/render-region-config.mjs'
import { SLAMigrations } from "./migrations/sla-migrations.mjs"

Hooks.once('init', Init);

//Turn sockets on
Hooks.on('ready', async () => {
  game.socket.on('system.sla-industries-brp', async data => {
    BRPSystemSocket.callSocket(data)
  });
});



// Ready Hook
Hooks.once("ready", async function () {
  // Compatibility fallback: ensure new SLA API classes are available on cached clients.
  if (!game.brp?.SLAAmmoCatalog) {
    try {
      const { SLAAmmoCatalog } = await import("./apps/sla-ammo-catalog.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLAAmmoCatalog = SLAAmmoCatalog;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLAAmmoCatalog to game.brp", err);
    }
  }
  if (game.brp?.SLASeedImporter && !game.brp.SLASeedImporter.seedAmmoGear) {
    try {
      const { SLAAmmoCatalog } = await import("./apps/sla-ammo-catalog.mjs");
      game.brp.SLASeedImporter.seedAmmoGear = (options = {}) => SLAAmmoCatalog.seedWorldAmmoGear(options);
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach seedAmmoGear helper", err);
    }
  }
  if (!game.brp?.SLADrugSystem) {
    try {
      const { SLADrugSystem } = await import("./apps/sla-drug-system.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLADrugSystem = SLADrugSystem;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLADrugSystem to game.brp", err);
    }
  }
  if (!game.brp?.SLAEbbSystem) {
    try {
      const { SLAEbbSystem } = await import("./apps/sla-ebb-system.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLAEbbSystem = SLAEbbSystem;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLAEbbSystem to game.brp", err);
    }
  }
  if (!game.brp?.SLAMentalSystem) {
    try {
      const { SLAMentalSystem } = await import("./apps/sla-mental-system.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLAMentalSystem = SLAMentalSystem;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLAMentalSystem to game.brp", err);
    }
  }
  if (!game.brp?.SLASkillPoints) {
    try {
      const { SLASkillPoints } = await import("./apps/sla-skill-points.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLASkillPoints = SLASkillPoints;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLASkillPoints to game.brp", err);
    }
  }
  if (!game.brp?.SLAEscalationInitiative) {
    try {
      const { SLAEscalationInitiative } = await import("./combat/sla-escalation-initiative.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLAEscalationInitiative = SLAEscalationInitiative;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLAEscalationInitiative to game.brp", err);
    }
  }
  if (!game.brp?.SLADialog) {
    try {
      const { SLADialog } = await import("./apps/sla-dialog.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLADialog = SLADialog;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLADialog to game.brp", err);
    }
  }
  if (!game.brp?.SLARollPipeline) {
    try {
      const { SLARollPipeline } = await import("./apps/sla-roll-pipeline.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLARollPipeline = SLARollPipeline;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLARollPipeline to game.brp", err);
    }
  }
  if (!game.brp?.SLAQAHarness) {
    try {
      const { SLAQAHarness } = await import("./apps/sla-qa-harness.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLAQAHarness = SLAQAHarness;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLAQAHarness to game.brp", err);
    }
  }
  if (!game.brp?.SLARulesConsole) {
    try {
      const { SLARulesConsole } = await import("./apps/sla-rules-console.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLARulesConsole = SLARulesConsole;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLARulesConsole to game.brp", err);
    }
  }
  if (!game.brp?.SLATraitDefinitions) {
    try {
      const { SLATraitDefinitions } = await import("./traits/trait-definitions.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLATraitDefinitions = SLATraitDefinitions;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLATraitDefinitions to game.brp", err);
    }
  }
  if (!game.brp?.SLATraitEngine) {
    try {
      const { SLATraitEngine } = await import("./traits/trait-engine.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLATraitEngine = SLATraitEngine;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLATraitEngine to game.brp", err);
    }
  }
  if (!game.brp?.SLATraitValidator) {
    try {
      const { SLATraitValidator } = await import("./traits/trait-validator.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLATraitValidator = SLATraitValidator;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLATraitValidator to game.brp", err);
    }
  }
  if (!game.brp?.SLATraitUI) {
    try {
      const { SLATraitUI } = await import("./traits/trait-ui.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLATraitUI = SLATraitUI;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLATraitUI to game.brp", err);
    }
  }
  if (!game.brp?.SLAMigrations) {
    game.brp = game.brp ?? {};
    game.brp.SLAMigrations = SLAMigrations;
  }
  if (!game.brp?.SLABPNToolkit) {
    try {
      const { SLABPNToolkit } = await import("./apps/sla-bpn-toolkit.mjs");
      game.brp = game.brp ?? {};
      game.brp.SLABPNToolkit = SLABPNToolkit;
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach SLABPNToolkit to game.brp", err);
    }
  }
  if (game.user?.isGM && game.brp?.SLABPNToolkit?.ensureRulebookJournal) {
    try {
      await game.brp.SLABPNToolkit.ensureRulebookJournal({ notify: false, syncPages: true });
    } catch (err) {
      console.warn("sla-industries-brp | Unable to ensure SLA Rulebook journal on ready", err);
    }
  }
  if (game.user?.isGM && game.brp?.SLABPNToolkit?.ensureVehicleChaseJournal) {
    try {
      await game.brp.SLABPNToolkit.ensureVehicleChaseJournal({ notify: false, syncPages: true });
    } catch (err) {
      console.warn("sla-industries-brp | Unable to ensure SLA Vehicles & Chases journal on ready", err);
    }
  }
  if (game.user?.isGM && game.brp?.SLABPNToolkit?.ensureNpcAdversaryJournal) {
    try {
      await game.brp.SLABPNToolkit.ensureNpcAdversaryJournal({ notify: false, syncPages: true });
    } catch (err) {
      console.warn("sla-industries-brp | Unable to ensure SLA NPC/Adversary journal on ready", err);
    }
  }
  if (game.user?.isGM && game.brp?.SLASeedImporter?.ensureSLA2Traits) {
    try {
      const traitSeed = await game.brp.SLASeedImporter.ensureSLA2Traits({ overwrite: false, notify: false });
      if (Number(traitSeed?.created ?? 0) > 0 || Number(traitSeed?.updated ?? 0) > 0) {
        ui.notifications.info(
          `SLA Traits synced: +${Number(traitSeed.created ?? 0)} created, ${Number(traitSeed.updated ?? 0)} updated.`
        );
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA Traits seed on ready", err);
    }
  }
  // Ensure core SLA world content folders/items exist (important for fresh remote worlds).
  if (game.user?.isGM && game.brp?.SLASeedImporter) {
    try {
      const hasItemFolder = (name) => game.folders.some((f) => f.type === "Item" && f.name === name && !f.folder);
      const itemFolderItemCount = (name) => {
        const folder = game.folders.find((f) => f.type === "Item" && f.name === name && !f.folder);
        if (!folder) return 0;
        return game.items.filter((item) => item.folder?.id === folder.id).length;
      };
      const shouldSeed = (name) => !hasItemFolder(name) || itemFolderItemCount(name) === 0;

      if (shouldSeed("SLA Ebb Abilities") && game.brp.SLASeedImporter.importEbbAbilities) {
        await game.brp.SLASeedImporter.importEbbAbilities({ overwrite: false });
      }
      if (
        (shouldSeed("SLA Weapons") || shouldSeed("SLA Armour")) &&
        game.brp.SLASeedImporter.importEquipment
      ) {
        await game.brp.SLASeedImporter.importEquipment({ overwrite: false });
      }
      if (shouldSeed("SLA Species") && game.brp.SLASeedImporter.importSpecies) {
        await game.brp.SLASeedImporter.importSpecies({ overwrite: false });
      }
      if (shouldSeed("SLA Training Packages") && game.brp.SLASeedImporter.importTrainingPackages) {
        await game.brp.SLASeedImporter.importTrainingPackages({ overwrite: false });
      }
      if (shouldSeed("SLA Ammo") && game.brp.SLASeedImporter.seedAmmoGear) {
        await game.brp.SLASeedImporter.seedAmmoGear({ overwrite: false });
      }
      if (shouldSeed("SLA Drugs") && game.brp.SLASeedImporter.seedDrugs) {
        await game.brp.SLASeedImporter.seedDrugs({ overwrite: false });
      }
      if (shouldSeed("SLA General Equipment") && game.brp.SLABPNToolkit?.seedWorldGeneralEquipment) {
        await game.brp.SLABPNToolkit.seedWorldGeneralEquipment({ overwrite: false, notify: false });
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA world content completeness pass", err);
    }
  }
  if (game.brp?.SLASeedImporter && !game.brp.SLASeedImporter.seedDrugs) {
    try {
      const { SLADrugSystem } = await import("./apps/sla-drug-system.mjs");
      game.brp.SLASeedImporter.seedDrugs = (options = {}) => SLADrugSystem.seedWorldDrugGear(options);
    } catch (err) {
      console.warn("sla-industries-brp | Unable to attach seedDrugs helper", err);
    }
  }
  if (game.user?.isGM) {
    try {
      await SLAMigrations.run();
    } catch (err) {
      console.warn("sla-industries-brp | World migration pass failed", err);
    }
  }

  let initForm = game.settings.get('sla-industries-brp', 'initStat')
  let initMod = game.settings.get('sla-industries-brp', 'initMod')
  let initiative = "@stats." + initForm + ".total"
  if (initForm === 'fixed') { initiative = "" }
  if (!["+", "*", "/"].includes(initMod.charAt(0))) {
    initMod = "+" + initMod
  }
  initiative = initiative + initMod

  if (!Roll.validate(initiative)) {
    ui.notifications.error(game.i18n.format('BRP.initError', { formula: initiative }))
    initiative = "@stats.dex.total+0"
  }
  CONFIG.Combat.initiative = {
    formula: initiative,
    decimals: 0
  };

  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (game.user) {
      return BRPUtilities.createMacro(bar, data, slot);
    }
  });

  // Ensure seeded SLA skills exist in world Items before roster sync.
  if (game.user?.isGM && game.brp?.SLASeedImporter?.importSkills) {
    try {
      const seededSkills = await game.brp.SLASeedImporter.importSkills({ overwrite: false });
      if (Number(seededSkills?.created ?? 0) > 0 || Number(seededSkills?.updated ?? 0) > 0) {
        ui.notifications.info(
          `SLA skill seed sync: +${Number(seededSkills.created ?? 0)} created, ${Number(seededSkills.updated ?? 0)} updated.`
        );
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA skill seed sync on ready", err);
    }
  }

  // Hard backfill: ensure Stealth exists in SLA Skills even if prior seeds missed it.
  if (game.user?.isGM && game.brp?.SLASeedImporter) {
    try {
      const seeder = game.brp.SLASeedImporter;
      const folder = await seeder.ensureFolder("SLA Skills", "#47657a");
      const stealthBrpid = "i.skill.sla-stealth";
      const existingStealth = game.items.find((item) => {
        if (item.type !== "skill") return false;
        const byName = String(item.name ?? "").trim().toLowerCase() === "stealth";
        const byBrpid =
          String(item.flags?.[game.system.id]?.brpidFlag?.id ?? item.flags?.brp?.brpidFlag?.id ?? "").trim().toLowerCase() === stealthBrpid;
        return byName || byBrpid;
      });

      let category = await seeder.resolveSkillCategoryBrpid("Physical");
      if (!category || category === "none") category = await seeder.resolveSkillCategoryBrpid("Combat");
      if (!category || category === "none") category = await seeder.resolveSkillCategoryBrpid("Mental");

      const stealthIcon = await seeder.getSkillIconPath("Stealth");
      const stealthSystem = {
        base: 10,
        category: category || "none",
        noXP: false,
        specialism: false,
        variable: false,
        combat: false,
        description: ""
      };

      if (!existingStealth) {
        const payload = {
          name: "Stealth",
          type: "skill",
          folder: folder.id,
          system: stealthSystem,
          flags: seeder.buildFlags(stealthBrpid, {
            [game.system.id]: { slaSkill: { source: "fallback", categoryRef: "Physical" } },
            brp: { slaSkill: { source: "fallback", categoryRef: "Physical" } }
          })
        };
        if (stealthIcon) payload.img = stealthIcon;
        await Item.create(payload);
        console.log("sla-industries-brp | Backfilled missing Stealth skill into SLA Skills");
      } else {
        const updates = { _id: existingStealth.id };
        let changed = false;
        if (existingStealth.folder?.id !== folder.id) {
          updates.folder = folder.id;
          changed = true;
        }
        const existingBrpid = String(existingStealth.flags?.[game.system.id]?.brpidFlag?.id ?? existingStealth.flags?.brp?.brpidFlag?.id ?? "").trim();
        if (!existingBrpid || existingBrpid !== stealthBrpid) {
          updates.flags = seeder.buildFlags(stealthBrpid, {
            [game.system.id]: { slaSkill: { source: "fallback", categoryRef: "Physical" } },
            brp: { slaSkill: { source: "fallback", categoryRef: "Physical" } }
          });
          changed = true;
        }
        if (Number(existingStealth.system?.base ?? 0) !== 10) {
          updates["system.base"] = 10;
          changed = true;
        }
        if (category && existingStealth.system?.category !== category) {
          updates["system.category"] = category;
          changed = true;
        }
        if (stealthIcon && existingStealth.img !== stealthIcon) {
          updates.img = stealthIcon;
          changed = true;
        }
        if (changed) {
          await existingStealth.update(updates);
          console.log("sla-industries-brp | Repaired Stealth skill metadata");
        }
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed Stealth skill backfill on ready", err);
    }
  }

  // Keep all existing characters aligned to SLA skill roster rules.
  if (game.user?.isGM && game.brp?.BRPActor?.syncAllCharacterSkillRosters) {
    try {
      const sync = await game.brp.BRPActor.syncAllCharacterSkillRosters({ notify: false });
      if (Number(sync?.created ?? 0) > 0 || Number(sync?.removed ?? 0) > 0) {
        ui.notifications.info(
          `SLA skills synced on load: +${Number(sync.created ?? 0)} / -${Number(sync.removed ?? 0)}.`
        );
      }
      if ((sync?.missing ?? []).length > 0) {
        console.warn("sla-industries-brp | SLA skill sync unresolved skill refs", sync.missing);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA roster sync on ready", err);
    }
  }

  // Backfill skill artwork for existing world/compendium skills.
  if (game.user?.isGM && game.brp?.SLASeedImporter?.syncSkillIcons) {
    try {
      const iconSync = await game.brp.SLASeedImporter.syncSkillIcons({ includeCompendium: true, notify: false });
      if (Number(iconSync?.worldUpdated ?? 0) > 0 || Number(iconSync?.compendiumUpdated ?? 0) > 0) {
        ui.notifications.info(
          `SLA skill icons synced: world ${Number(iconSync.worldUpdated ?? 0)}, compendium ${Number(iconSync.compendiumUpdated ?? 0)}.`
        );
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA skill icon sync on ready", err);
    }
  }

  // Backfill weapon artwork for existing world/actor/compendium weapons.
  if (game.user?.isGM && game.brp?.SLASeedImporter?.syncWeaponIcons) {
    try {
      const weaponIconSync = await game.brp.SLASeedImporter.syncWeaponIcons({
        includeCompendium: true,
        includeActors: true,
        notify: false
      });
      if (
        Number(weaponIconSync?.worldUpdated ?? 0) > 0 ||
        Number(weaponIconSync?.actorUpdated ?? 0) > 0 ||
        Number(weaponIconSync?.compendiumUpdated ?? 0) > 0
      ) {
        ui.notifications.info(
          `SLA weapon icons synced: world ${Number(weaponIconSync.worldUpdated ?? 0)}, actors ${Number(weaponIconSync.actorUpdated ?? 0)}, compendium ${Number(weaponIconSync.compendiumUpdated ?? 0)}.`
        );
      }
      if ((weaponIconSync?.unmatched ?? []).length > 0) {
        console.warn("sla-industries-brp | Unmatched SLA weapon icons", weaponIconSync.unmatched);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA weapon icon sync on ready", err);
    }
  }

  // Backfill Ebb ability artwork for existing world/actor/compendium items.
  if (game.user?.isGM && game.brp?.SLASeedImporter?.syncEbbIcons) {
    try {
      const ebbIconSync = await game.brp.SLASeedImporter.syncEbbIcons({
        includeCompendium: true,
        includeActors: true,
        notify: false
      });
      if (
        Number(ebbIconSync?.worldUpdated ?? 0) > 0 ||
        Number(ebbIconSync?.actorUpdated ?? 0) > 0 ||
        Number(ebbIconSync?.compendiumUpdated ?? 0) > 0
      ) {
        ui.notifications.info(
          `SLA Ebb icons synced: world ${Number(ebbIconSync.worldUpdated ?? 0)}, actors ${Number(ebbIconSync.actorUpdated ?? 0)}, compendium ${Number(ebbIconSync.compendiumUpdated ?? 0)}.`
        );
      }
      if ((ebbIconSync?.unmatched ?? []).length > 0) {
        console.warn("sla-industries-brp | Unmatched SLA Ebb icons", ebbIconSync.unmatched);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA Ebb icon sync on ready", err);
    }
  }

  // Backfill species artwork for existing world/actor/compendium items.
  if (game.user?.isGM && game.brp?.SLASeedImporter?.syncSpeciesIcons) {
    try {
      const speciesIconSync = await game.brp.SLASeedImporter.syncSpeciesIcons({
        includeCompendium: true,
        includeActors: true,
        notify: false
      });
      if (
        Number(speciesIconSync?.worldUpdated ?? 0) > 0 ||
        Number(speciesIconSync?.actorUpdated ?? 0) > 0 ||
        Number(speciesIconSync?.compendiumUpdated ?? 0) > 0
      ) {
        ui.notifications.info(
          `SLA species icons synced: world ${Number(speciesIconSync.worldUpdated ?? 0)}, actors ${Number(speciesIconSync.actorUpdated ?? 0)}, compendium ${Number(speciesIconSync.compendiumUpdated ?? 0)}.`
        );
      }
      if ((speciesIconSync?.unmatched ?? []).length > 0) {
        console.warn("sla-industries-brp | Unmatched SLA species icons", speciesIconSync.unmatched);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA species icon sync on ready", err);
    }
  }

  // Backfill training package artwork for existing world/actor/compendium items.
  if (game.user?.isGM && game.brp?.SLASeedImporter?.syncTrainingPackageIcons) {
    try {
      const trainingIconSync = await game.brp.SLASeedImporter.syncTrainingPackageIcons({
        includeCompendium: true,
        includeActors: true,
        notify: false
      });
      if (
        Number(trainingIconSync?.worldUpdated ?? 0) > 0 ||
        Number(trainingIconSync?.actorUpdated ?? 0) > 0 ||
        Number(trainingIconSync?.compendiumUpdated ?? 0) > 0
      ) {
        ui.notifications.info(
          `SLA training icons synced: world ${Number(trainingIconSync.worldUpdated ?? 0)}, actors ${Number(trainingIconSync.actorUpdated ?? 0)}, compendium ${Number(trainingIconSync.compendiumUpdated ?? 0)}.`
        );
      }
      if ((trainingIconSync?.unmatched ?? []).length > 0) {
        console.warn("sla-industries-brp | Unmatched SLA training package icons", trainingIconSync.unmatched);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA training icon sync on ready", err);
    }
  }

  // Backfill ammo artwork for existing world/actor/compendium ammo items.
  if (game.user?.isGM && game.brp?.SLASeedImporter?.syncAmmoIcons) {
    try {
      const ammoIconSync = await game.brp.SLASeedImporter.syncAmmoIcons({
        includeCompendium: true,
        includeActors: true,
        notify: false
      });
      if (
        Number(ammoIconSync?.worldUpdated ?? 0) > 0 ||
        Number(ammoIconSync?.actorUpdated ?? 0) > 0 ||
        Number(ammoIconSync?.compendiumUpdated ?? 0) > 0
      ) {
        ui.notifications.info(
          `SLA ammo icons synced: world ${Number(ammoIconSync.worldUpdated ?? 0)}, actors ${Number(ammoIconSync.actorUpdated ?? 0)}, compendium ${Number(ammoIconSync.compendiumUpdated ?? 0)}.`
        );
      }
      if ((ammoIconSync?.unmatched ?? []).length > 0) {
        console.warn("sla-industries-brp | Unmatched SLA ammo icons", ammoIconSync.unmatched);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA ammo icon sync on ready", err);
    }
  }

  // Backfill drug artwork for existing world/actor/compendium drug items.
  if (game.user?.isGM && game.brp?.SLADrugSystem?.syncDrugIcons) {
    try {
      const drugIconSync = await game.brp.SLADrugSystem.syncDrugIcons({
        includeActors: true,
        includeCompendium: true,
        notify: false
      });
      if (
        Number(drugIconSync?.worldUpdated ?? 0) > 0 ||
        Number(drugIconSync?.actorUpdated ?? 0) > 0 ||
        Number(drugIconSync?.compendiumUpdated ?? 0) > 0
      ) {
        ui.notifications.info(
          `SLA drug icons synced: world ${Number(drugIconSync.worldUpdated ?? 0)}, actors ${Number(drugIconSync.actorUpdated ?? 0)}, compendium ${Number(drugIconSync.compendiumUpdated ?? 0)}.`
        );
      }
      if ((drugIconSync?.unmatched ?? []).length > 0) {
        console.warn("sla-industries-brp | Unmatched SLA drug icons", drugIconSync.unmatched);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA drug icon sync on ready", err);
    }
  }

  // Backfill general equipment artwork (supports gear icon subfolders).
  if (game.user?.isGM && game.brp?.SLABPNToolkit?.syncGeneralEquipmentIcons) {
    try {
      const gearIconSync = await game.brp.SLABPNToolkit.syncGeneralEquipmentIcons({
        includeActors: true,
        includeCompendium: true,
        folderName: "SLA General Equipment",
        notify: false
      });
      if (
        Number(gearIconSync?.worldUpdated ?? 0) > 0 ||
        Number(gearIconSync?.actorUpdated ?? 0) > 0 ||
        Number(gearIconSync?.compendiumUpdated ?? 0) > 0
      ) {
        ui.notifications.info(
          `SLA gear icons synced: world ${Number(gearIconSync.worldUpdated ?? 0)}, actors ${Number(gearIconSync.actorUpdated ?? 0)}, compendium ${Number(gearIconSync.compendiumUpdated ?? 0)}.`
        );
      }
      if ((gearIconSync?.unmatched ?? []).length > 0) {
        console.warn("sla-industries-brp | Unmatched SLA general equipment icons", gearIconSync.unmatched);
      }
    } catch (err) {
      console.warn("sla-industries-brp | Failed SLA gear icon sync on ready", err);
    }
  }
});

BRPHooks.listen()

//Add Chat Log Hooks
Hooks.on('getSceneControlButtons', BRPMenu.getButtons)
Hooks.on('renderSceneControls', renderSceneControls)
Hooks.on('renderActorSheet', BRPCharacterSheet.renderSheet)
Hooks.on('renderRegionConfig', RenderRegionConfig)
