export function listen() {
  Hooks.on("renderJournalDirectory", (app, html) => {
    injectJournalTools(app, html);
  });

  Hooks.on("renderSidebarTab", (app, html) => {
    const isJournalTab = app?.tabName === "journal" || app?.options?.id === "journal";
    if (!isJournalTab) return;
    injectJournalTools(app, html);
  });
}

function injectJournalTools(_app, html) {
  const root = $(html);
  injectRulebookButton(root);
  injectNpcGuideButton(root);
  injectVehicleChaseButton(root);
  injectChaseHelperButton(root);
  injectWoundHelperButton(root);

  const canCreate = Boolean(game.user?.isGM || game.user?.can?.("JOURNAL_CREATE"));
  if (!canCreate) return;

  if (!root.find(".sla-open-bpn-toolkit").length) {
    const bpnButton = $(`
      <button type="button" class="sla-open-bpn-toolkit">
        <i class="fas fa-file-contract"></i> BPN Toolkit
      </button>
    `);
    bpnButton.on("click", async () => {
      const toolkit = game.brp?.SLABPNToolkit;
      if (!toolkit?.openToolkit) {
        ui.notifications.warn("BPN Toolkit API is not available.");
        return;
      }
      await toolkit.openToolkit();
    });
    placeButton(root, bpnButton);
  }

  if (!root.find(".sla-quick-random-bpn").length) {
    const randomBpnButton = $(`
      <button type="button" class="sla-quick-random-bpn">
        <i class="fas fa-dice"></i> Quick Random BPN
      </button>
    `);
    randomBpnButton.on("click", async () => {
      const toolkit = game.brp?.SLABPNToolkit;
      if (!toolkit?.createQuickRandomBpn) {
        ui.notifications.warn("Quick Random BPN API is not available.");
        return;
      }
      await toolkit.createQuickRandomBpn();
    });
    placeButton(root, randomBpnButton);
  }

  if (!root.find(".sla-quick-random-npc").length) {
    const randomNpcButton = $(`
      <button type="button" class="sla-quick-random-npc">
        <i class="fas fa-user-secret"></i> Quick Random NPC
      </button>
    `);
    randomNpcButton.on("click", async () => {
      const toolkit = game.brp?.SLABPNToolkit;
      if (!toolkit?.createQuickRandomNpcAdversary) {
        ui.notifications.warn("Quick Random NPC API is not available.");
        return;
      }
      await toolkit.createQuickRandomNpcAdversary({ notify: true, postToChat: true });
    });
    placeButton(root, randomNpcButton);
  }

  if (!root.find(".sla-open-adversary-generator").length) {
    const adversaryButton = $(`
      <button type="button" class="sla-open-adversary-generator">
        <i class="fas fa-biohazard"></i> Adversary Generator
      </button>
    `);
    adversaryButton.on("click", async () => {
      const toolkit = game.brp?.SLABPNToolkit;
      if (!toolkit?.promptAdversaryGenerator) {
        ui.notifications.warn("Adversary generator API is not available.");
        return;
      }
      await toolkit.promptAdversaryGenerator();
    });
    placeButton(root, adversaryButton);
  }

  if (!root.find(".sla-open-equipment-catalogue").length) {
    const gearButton = $(`
      <button type="button" class="sla-open-equipment-catalogue">
        <i class="fas fa-toolbox"></i> Equipment
      </button>
    `);
    gearButton.on("click", async () => {
      const toolkit = game.brp?.SLABPNToolkit;
      if (!toolkit?.openEquipmentCatalogue) {
        ui.notifications.warn("Equipment catalogue API is not available.");
        return;
      }
      await toolkit.openEquipmentCatalogue({ ensure: true, notify: false });
    });
    placeButton(root, gearButton);
  }
}

function injectRulebookButton(root) {
  if (root.find(".sla-open-rulebook").length) return;

  const rulebookButton = $(`
    <button type="button" class="sla-open-rulebook">
      <i class="fas fa-book"></i> Rulebook
    </button>
  `);

  rulebookButton.on("click", async () => {
    const toolkit = game.brp?.SLABPNToolkit;
    if (!toolkit?.openRulebook) {
      ui.notifications.warn("Rulebook API is not available.");
      return;
    }
    await toolkit.openRulebook({ ensure: true, notify: false });
  });

  placeButton(root, rulebookButton);
}

function injectNpcGuideButton(root) {
  if (root.find(".sla-open-npc-guide").length) return;

  const button = $(`
    <button type="button" class="sla-open-npc-guide">
      <i class="fas fa-users"></i> NPC Guide
    </button>
  `);

  button.on("click", async () => {
    const toolkit = game.brp?.SLABPNToolkit;
    if (!toolkit?.openNpcAdversaryJournal) {
      ui.notifications.warn("NPC guide API is not available.");
      return;
    }
    await toolkit.openNpcAdversaryJournal({ ensure: true, notify: false });
  });

  placeButton(root, button);
}

function injectVehicleChaseButton(root) {
  if (root.find(".sla-open-vehicles-chases").length) return;

  const button = $(`
    <button type="button" class="sla-open-vehicles-chases">
      <i class="fas fa-car-side"></i> Vehicles & Chases
    </button>
  `);

  button.on("click", async () => {
    const toolkit = game.brp?.SLABPNToolkit;
    if (!toolkit?.openVehicleChaseJournal) {
      ui.notifications.warn("Vehicles & Chases API is not available.");
      return;
    }
    await toolkit.openVehicleChaseJournal({ ensure: true, notify: false });
  });

  placeButton(root, button);
}

function injectChaseHelperButton(root) {
  if (root.find(".sla-open-chase-helper").length) return;

  const button = $(`
    <button type="button" class="sla-open-chase-helper">
      <i class="fas fa-route"></i> Chase Helper
    </button>
  `);

  button.on("click", async () => {
    const toolkit = game.brp?.SLABPNToolkit;
    if (!toolkit?.openChaseRoundAssistant) {
      ui.notifications.warn("Chase helper API is not available.");
      return;
    }
    await toolkit.openChaseRoundAssistant({});
  });

  placeButton(root, button);
}

function injectWoundHelperButton(root) {
  if (root.find(".sla-open-wound-helper").length) return;

  const button = $(`
    <button type="button" class="sla-open-wound-helper">
      <i class="fas fa-heart-pulse"></i> Wound Helper
    </button>
  `);

  button.on("click", async () => {
    const toolkit = game.brp?.SLABPNToolkit;
    if (!toolkit?.openWoundCrisisAssistant) {
      ui.notifications.warn("Wound helper API is not available.");
      return;
    }
    await toolkit.openWoundCrisisAssistant();
  });

  placeButton(root, button);
}

function placeButton(root, button) {
  const createBtn = findCreateJournalButton(root);
  if (createBtn?.length) {
    createBtn.after(button);
    return;
  }

  const actionBar = findJournalActionBar(root);
  if (actionBar?.length) {
    actionBar.append(button);
  }
}

function findCreateJournalButton(root) {
  const byActionV13 = root.find("button[data-action='createEntry'], a[data-action='createEntry']");
  if (byActionV13.length) return byActionV13.first();

  const byClass = root.find("button.create-document, a.create-document");
  if (byClass.length) return byClass.first();

  const byAction = root.find("button[data-action='createDocument'], a[data-action='createDocument']");
  if (byAction.length) return byAction.first();

  const allButtons = root.find("button, a");
  const match = allButtons.filter((_, el) => {
    const txt = String(el.textContent ?? "").toLowerCase();
    return txt.includes("create journal") || txt.includes("create entry");
  });
  if (match.length) return match.first();

  return null;
}

function findJournalActionBar(root) {
  const selectors = [
    ".directory-header .header-actions",
    ".directory-header .action-buttons",
    ".journal-directory .header-actions",
    ".tab.journal .header-actions",
    ".tab[data-tab='journal'] .header-actions"
  ];
  for (const selector of selectors) {
    const found = root.find(selector);
    if (found.length) return found.first();
  }
  return null;
}
