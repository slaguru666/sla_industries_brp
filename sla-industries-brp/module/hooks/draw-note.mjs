export function listen() {
  Hooks.on('drawNote', async (application) => {
    const hideBackground = application.document.flags?.[game.system.id]?.['hide-background']
      ?? application.document.flags?.brp?.['hide-background']
      ?? false
    if (hideBackground) {
      application.controlIcon.bg.clear()
    }
  })
}
