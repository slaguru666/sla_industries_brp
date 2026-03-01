export class SLATraitDefinitions {
  static TRAIT_MOD_CAP = 40;

  static MUTUALLY_EXCLUSIVE = [
    ["chicken", "exceedingly-cool"]
  ];

  static DEFINITIONS = {
    "addiction-compulsion": {
      id: "addiction-compulsion",
      label: "Addiction / Compulsion",
      type: "disadvantage",
      maxRank: 3,
      aliases: ["addiction/compulsion", "addiction compulsion", "compulsion", "addiction"]
    },
    "allergy": {
      id: "allergy",
      label: "Allergy",
      type: "disadvantage",
      maxRank: 3,
      aliases: ["allergy"]
    },
    "anger": {
      id: "anger",
      label: "Anger",
      type: "disadvantage",
      maxRank: 1,
      aliases: ["anger"]
    },
    "anxiety": {
      id: "anxiety",
      label: "Anxiety",
      type: "disadvantage",
      maxRank: 3,
      aliases: ["anxiety"]
    },
    "arrogant": {
      id: "arrogant",
      label: "Arrogant",
      type: "disadvantage",
      maxRank: 1,
      aliases: ["arrogant"]
    },
    "chicken": {
      id: "chicken",
      label: "Chicken",
      type: "disadvantage",
      maxRank: 1,
      aliases: ["chicken"]
    },
    "debt": {
      id: "debt",
      label: "Debt",
      type: "disadvantage",
      maxRank: 3,
      aliases: ["debt"]
    },
    "depression": {
      id: "depression",
      label: "Depression",
      type: "disadvantage",
      maxRank: 3,
      aliases: ["depression"]
    },
    "drug-addict": {
      id: "drug-addict",
      label: "Drug Addict",
      type: "disadvantage",
      maxRank: 3,
      aliases: ["drug addict", "drug-addict"]
    },
    "enemy": {
      id: "enemy",
      label: "Enemy",
      type: "disadvantage",
      maxRank: 4,
      aliases: ["enemy"]
    },
    "illness": {
      id: "illness",
      label: "Illness",
      type: "disadvantage",
      maxRank: 3,
      aliases: ["illness"]
    },
    "pacifist": {
      id: "pacifist",
      label: "Pacifist",
      type: "disadvantage",
      maxRank: 1,
      aliases: ["pacifist"]
    },
    "phobia": {
      id: "phobia",
      label: "Phobia",
      type: "disadvantage",
      maxRank: 3,
      aliases: ["phobia"]
    },
    "poor-hearing": {
      id: "poor-hearing",
      label: "Poor Hearing",
      type: "disadvantage",
      maxRank: 2,
      aliases: ["poor hearing", "poor-hearing"]
    },
    "poor-vision": {
      id: "poor-vision",
      label: "Poor Vision",
      type: "disadvantage",
      maxRank: 2,
      aliases: ["poor vision", "poor-vision"]
    },
    "psychosis": {
      id: "psychosis",
      label: "Psychosis",
      type: "disadvantage",
      maxRank: 3,
      aliases: ["psychosis"]
    },
    "unattractive": {
      id: "unattractive",
      label: "Unattractive",
      type: "disadvantage",
      maxRank: 2,
      aliases: ["unattractive"]
    },
    "ambidextrous": {
      id: "ambidextrous",
      label: "Ambidextrous",
      type: "advantage",
      maxRank: 1,
      aliases: ["ambidextrous"]
    },
    "attractive": {
      id: "attractive",
      label: "Attractive",
      type: "advantage",
      maxRank: 2,
      aliases: ["attractive"]
    },
    "contact": {
      id: "contact",
      label: "Contact",
      type: "advantage",
      maxRank: 4,
      aliases: ["contact"]
    },
    "exceedingly-cool": {
      id: "exceedingly-cool",
      label: "Exceedingly Cool",
      type: "advantage",
      maxRank: 1,
      aliases: ["exceedingly cool", "exceedingly-cool"]
    },
    "good-hearing": {
      id: "good-hearing",
      label: "Good Hearing",
      type: "advantage",
      maxRank: 2,
      aliases: ["good hearing", "good-hearing"]
    },
    "good-vision": {
      id: "good-vision",
      label: "Good Vision",
      type: "advantage",
      maxRank: 2,
      aliases: ["good vision", "good-vision"]
    },
    "good-housing": {
      id: "good-housing",
      label: "Good Housing",
      type: "advantage",
      maxRank: 2,
      aliases: ["good housing", "good-housing"]
    },
    "natural-aptitude-skill": {
      id: "natural-aptitude-skill",
      label: "Natural Aptitude: Skill",
      type: "advantage",
      maxRank: 3,
      aliases: ["natural aptitude: skill", "natural aptitude skill", "natural-aptitude-skill"]
    },
    "natural-aptitude-stat": {
      id: "natural-aptitude-stat",
      label: "Natural Aptitude: Stat",
      type: "advantage",
      maxRank: 1,
      aliases: ["natural aptitude: stat", "natural aptitude stat", "natural-aptitude-stat"]
    },
    "savings": {
      id: "savings",
      label: "Savings",
      type: "advantage",
      maxRank: 3,
      aliases: ["savings"]
    },
    "poor-housing": {
      id: "poor-housing",
      label: "Poor Housing",
      type: "disadvantage",
      maxRank: 2,
      aliases: ["poor housing", "poor-housing"]
    },
    "sterile": {
      id: "sterile",
      label: "Sterile",
      type: "disadvantage",
      maxRank: 1,
      aliases: ["sterile"]
    }
  };

  static normalizeName(value = "") {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  static buildAliasMap() {
    const map = new Map();
    for (const [id, def] of Object.entries(this.DEFINITIONS)) {
      map.set(this.normalizeName(id), id);
      map.set(this.normalizeName(def.label ?? id), id);
      for (const alias of (def.aliases ?? [])) {
        map.set(this.normalizeName(alias), id);
      }
    }
    return map;
  }

  static get ALIAS_MAP() {
    if (!this._aliasMap) this._aliasMap = this.buildAliasMap();
    return this._aliasMap;
  }

  static toKey(name = "") {
    const slug = this.normalizeName(name);
    return this.ALIAS_MAP.get(slug) ?? slug;
  }

  static getByKey(key = "") {
    const k = this.toKey(key);
    return this.DEFINITIONS[k] ?? null;
  }

  static getByName(name = "") {
    const key = this.toKey(name);
    return this.getByKey(key);
  }

  static maxRankFor(nameOrKey = "") {
    const def = this.getByKey(nameOrKey);
    return Number(def?.maxRank ?? 1);
  }

  static all() {
    return Object.values(this.DEFINITIONS);
  }
}
