const MODULE_ID = "sla-industries-compendium";
const SYSTEM_ID = "sla-industries-brp";
const BUTTON_CLASS = "sla-companion-import-all";

function canUseCompanionImport() {
  return Boolean(game.user?.isGM && game.system?.id === SYSTEM_ID && game.brp?.SLASeedImporter?.buildDraft2);
}

function chooseImportMode() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    new Dialog({
      title: "SLA Companion Import",
      content: `
        <p>Import all SLA companion content into this world?</p>
        <p><strong>Merge</strong> keeps existing world items and only adds missing content.</p>
        <p><strong>Overwrite</strong> updates existing SLA content from companion seeds.</p>
      `,
      buttons: {
        merge: {
          label: "Merge",
          icon: '<i class="fas fa-plus-square"></i>',
          callback: () => finish(false)
        },
        overwrite: {
          label: "Overwrite",
          icon: '<i class="fas fa-sync"></i>',
          callback: () => finish(true)
        },
        cancel: {
          label: "Cancel",
          icon: '<i class="fas fa-times"></i>',
          callback: () => finish(null)
        }
      },
      default: "merge",
      close: () => finish(null)
    }).render(true);
  });
}

async function importAllSLACompanionContent() {
  if (!canUseCompanionImport()) {
    ui.notifications.warn("SLA companion import requires GM role and active sla-industries-brp system.");
    return;
  }

  const overwrite = await chooseImportMode();
  if (overwrite === null) return;

  ui.notifications.info("SLA companion import started.");
  try {
    const summary = await game.brp.SLASeedImporter.buildDraft2({
      overwrite,
      syncCompendia: true
    });
    console.log(`${MODULE_ID} | Companion import summary`, summary);
    ui.notifications.info("SLA companion import completed.");
  } catch (err) {
    console.error(`${MODULE_ID} | Companion import failed`, err);
    ui.notifications.error(`SLA companion import failed: ${err?.message ?? "Unknown error"}`);
  }
}

function addCompendiumHeaderButton(app, html) {
  if (!canUseCompanionImport()) return;
  const root = html?.[0];
  if (!root) return;

  const existing = root.querySelector(`.${BUTTON_CLASS}`);
  if (existing) return;

  const container =
    root.querySelector(".header-actions") ||
    root.querySelector(".directory-header .header-search") ||
    root.querySelector(".directory-header");
  if (!container) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon ${BUTTON_CLASS}`;
  button.title = "Import SLA Companion Content";
  button.innerHTML = '<i class="fas fa-download"></i>';
  button.addEventListener("click", () => {
    importAllSLACompanionContent();
  });
  container.appendChild(button);
}

Hooks.on("renderCompendiumDirectory", addCompendiumHeaderButton);

Hooks.on("getCompendiumDirectoryEntryContext", (html, options) => {
  options.push({
    name: "Import SLA Companion Content",
    icon: '<i class="fas fa-download"></i>',
    condition: (li) => {
      if (!canUseCompanionImport()) return false;
      const pack = game.packs?.get(li?.data("pack"));
      return pack?.metadata?.packageName === MODULE_ID;
    },
    callback: () => {
      importAllSLACompanionContent();
    }
  });
});
