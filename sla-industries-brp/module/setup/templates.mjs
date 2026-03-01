export const preloadHandlebarsTemplates = async function () {
  return foundry.applications.handlebars.loadTemplates([

    // Actor partials.
    "systems/sla-industries-brp/templates/actor/parts/actor-skills.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-skillsDev.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-statistics.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-items.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-magic.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-magicDev.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-combat.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-background.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-mutations.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-psychics.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-psychicsDev.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-sorcery.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-super.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-social.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-pers.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-traits.html",
    "systems/sla-industries-brp/templates/actor/parts/actor-effects.html",
    "systems/sla-industries-brp/templates/global/parts/active-effects.html",
  ]);
};
