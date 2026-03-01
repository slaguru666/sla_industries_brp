export class SLADialog {
  static _asElement(source) {
    if (!source) return null;
    if (source instanceof HTMLElement) return source;
    if (Array.isArray(source) && source[0] instanceof HTMLElement) return source[0];
    if (source?.[0] instanceof HTMLElement) return source[0];
    if (typeof source?.get === "function") {
      const fromGet = source.get(0);
      if (fromGet instanceof HTMLElement) return fromGet;
    }
    return null;
  }

  static _extractRoot(source) {
    if (!source) return null;
    const direct = this._asElement(source);
    if (direct) return direct;

    const candidates = [
      source?.element,
      source?.window?.content,
      source?.content,
      source?.window,
      source?.root,
      source?.parent?.element
    ];

    for (const candidate of candidates) {
      const element = this._asElement(candidate);
      if (element) return element;
    }

    if (typeof source?.querySelector === "function") return source;
    return null;
  }

  static _findForm(source, selector = "form") {
    const root = this._extractRoot(source);
    if (root && typeof root.querySelector === "function") {
      const fromRoot = root.querySelector(selector) ?? (selector !== "form" ? root.querySelector("form") : null);
      if (fromRoot) return fromRoot;
    }

    // Final fallback for DialogV2 wrapper edge-cases: search latest open dialog.
    if (typeof document !== "undefined") {
      const exact = document.querySelector(selector);
      if (exact) return exact;
      const openDialogs = Array.from(document.querySelectorAll(".app.window-app.dialog, .application.dialog"));
      for (let i = openDialogs.length - 1; i >= 0; i -= 1) {
        const dlg = openDialogs[i];
        const candidate = dlg.querySelector(selector) ?? (selector !== "form" ? dlg.querySelector("form") : null);
        if (candidate) return candidate;
      }
    }

    return null;
  }

  static async waitForm({
    title = "Dialog",
    content = "",
    formSelector = "form",
    submitLabel = "Proceed",
    cancelLabel = "Cancel",
    onSubmit = null,
    onRender = null,
    cancelValue = false
  } = {}) {
    const useV2 = Boolean(foundry?.applications?.api?.DialogV2?.wait);

    if (useV2) {
      try {
        const result = await foundry.applications.api.DialogV2.wait({
          window: { title },
          content,
          buttons: [
            {
              action: "submit",
              label: submitLabel,
              default: true,
              callback: async (_event, _button, dialog) => {
                const form = this._findForm(dialog, formSelector);
                if (!form) {
                  ui.notifications.error("Dialog form not found.");
                  return cancelValue;
                }
                const fd = new FormData(form);
                if (typeof onSubmit === "function") {
                  return onSubmit(fd, form, dialog);
                }
                return fd;
              }
            },
            {
              action: "cancel",
              label: cancelLabel,
              callback: () => cancelValue
            }
          ],
          render: (_event, dialog) => {
            if (typeof onRender === "function") {
              onRender(dialog?.element ?? null, dialog);
            }
          },
          close: () => cancelValue
        });
        return typeof result === "undefined" ? cancelValue : result;
      } catch (err) {
        console.warn("sla-industries-brp | DialogV2.wait failed, falling back to V1 Dialog", err);
      }
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const dlg = new Dialog({
        title,
        content,
        buttons: {
          submit: {
            label: submitLabel,
            callback: async (html) => {
              const form = html?.[0]?.querySelector?.(formSelector)
                ?? (typeof $ !== "undefined" ? $(html).find(formSelector)[0] : null);
              if (!form) {
                ui.notifications.error("Dialog form not found.");
                return finish(cancelValue);
              }
              const fd = new FormData(form);
              if (typeof onSubmit === "function") {
                return finish(await onSubmit(fd, form, html));
              }
              return finish(fd);
            }
          },
          cancel: {
            label: cancelLabel,
            callback: () => finish(cancelValue)
          }
        },
        default: "submit",
        render: (html) => {
          if (typeof onRender === "function") {
            onRender(html?.[0] ?? null, html);
          }
        },
        close: () => finish(cancelValue)
      });
      dlg.render(true);
    });
  }

  static async choose({
    title = "Choose",
    content = "",
    choices = {},
    defaultChoice = "",
    cancelValue = null
  } = {}) {
    const entries = Object.entries(choices);
    if (!entries.length) return cancelValue;

    const useV2 = Boolean(foundry?.applications?.api?.DialogV2?.wait);
    if (useV2) {
      try {
        const buttons = entries.map(([key, value]) => ({
          action: key,
          label: String(value?.label ?? key),
          default: key === defaultChoice,
          callback: () => (typeof value?.value === "undefined" ? key : value.value)
        }));

        const result = await foundry.applications.api.DialogV2.wait({
          window: { title },
          content,
          buttons,
          close: () => cancelValue
        });
        return typeof result === "undefined" ? cancelValue : result;
      } catch (err) {
        console.warn("sla-industries-brp | DialogV2 choose failed, falling back to V1 Dialog", err);
      }
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const buttons = {};
      for (const [key, value] of entries) {
        buttons[key] = {
          label: String(value?.label ?? key),
          callback: () => finish(typeof value?.value === "undefined" ? key : value.value)
        };
      }

      const dlg = new Dialog({
        title,
        content,
        buttons,
        default: defaultChoice || entries[0][0],
        close: () => finish(cancelValue)
      });
      dlg.render(true);
    });
  }
}
