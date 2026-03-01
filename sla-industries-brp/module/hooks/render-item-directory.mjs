export function listen() {
  Hooks.on("renderItemDirectory", (app, html) => {
    injectEquipmentSeedButton(app, html);
  });

  Hooks.on("renderSidebarTab", (app, html) => {
    const isItemsTab = app?.tabName === "items" || app?.options?.id === "items";
    if (!isItemsTab) return;
    injectEquipmentSeedButton(app, html);
  });
}

function injectEquipmentSeedButton(_app, html) {
  const canManage = Boolean(game.user?.isGM || game.user?.can?.("ITEM_CREATE"));
  if (!canManage) return;

  const root = $(html);
  if (root.find(".sla-seed-equipment-items").length) return;

  const button = $(`
    <button type="button" class="sla-seed-equipment-items">
      <i class="fas fa-toolbox"></i> Seed SLA Equipment
    </button>
  `);

  button.on("click", async () => {
    const toolkit = game.brp?.SLABPNToolkit;
    if (!toolkit?.seedWorldGeneralEquipment) {
      ui.notifications.warn("Equipment seeding API is not available.");
      return;
    }
    await toolkit.ensureCoreJournals({ notify: false });
    await toolkit.seedWorldGeneralEquipment({ overwrite: false, notify: true });
  });

  const createBtn = findCreateItemButton(root);
  if (createBtn?.length) {
    createBtn.after(button);
    return;
  }

  const actionBar = findItemActionBar(root);
  if (actionBar?.length) {
    actionBar.append(button);
  }
}

function findCreateItemButton(root) {
  const byActionV13 = root.find("button[data-action='createItem'], a[data-action='createItem']");
  if (byActionV13.length) return byActionV13.first();

  const byClass = root.find("button.create-document, a.create-document");
  if (byClass.length) return byClass.first();

  const byAction = root.find("button[data-action='createDocument'], a[data-action='createDocument']");
  if (byAction.length) return byAction.first();

  const allButtons = root.find("button, a");
  const match = allButtons.filter((_, el) => {
    const text = String(el.textContent ?? "").toLowerCase();
    return text.includes("create item") || text.includes("create entry");
  });
  if (match.length) return match.first();

  return null;
}

function findItemActionBar(root) {
  const selectors = [
    ".directory-header .header-actions",
    ".directory-header .action-buttons",
    ".item-directory .header-actions",
    ".tab.item .header-actions",
    ".tab[data-tab='items'] .header-actions"
  ];
  for (const selector of selectors) {
    const found = root.find(selector);
    if (found.length) return found.first();
  }
  return null;
}
