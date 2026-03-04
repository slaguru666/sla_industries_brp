import { SLADialog } from "./sla-dialog.mjs";

export class SLABPNToolkit {
  static async _browseData(path = "") {
    const pickerImpl = foundry?.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
    if (!pickerImpl?.browse) {
      throw new Error("FilePicker implementation not available");
    }
    const cleanPath = String(path ?? "").trim();
    const attempts = [];
    const pushAttempt = (value = "") => {
      const v = String(value ?? "").trim().replace(/^\/+/, "");
      if (!v || attempts.includes(v)) return;
      attempts.push(v);
    };
    pushAttempt(cleanPath);
    const marker = "/SLA_Assets/";
    const markerIndex = cleanPath.toLowerCase().indexOf(marker.toLowerCase());
    if (markerIndex >= 0) {
      const suffix = cleanPath.slice(markerIndex + 1);
      pushAttempt(`systems/sla-industries-brp/${suffix}`);
      pushAttempt(`modules/sla-industries-compendium/${suffix}`);
      pushAttempt(suffix);
    } else if (cleanPath.startsWith("assets/SLA_Assets/")) {
      pushAttempt(`systems/sla-industries-brp/${cleanPath}`);
      pushAttempt(`modules/sla-industries-compendium/${cleanPath}`);
    }
    let lastErr = null;
    for (const attempt of attempts) {
      try {
        return await pickerImpl.browse("data", attempt);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr ?? new Error(`Failed browsing data path: ${cleanPath}`);
  }

  static MAIN_COLOURS = [
    {
      key: "blue",
      label: "Blue",
      type: "Street Maintenance",
      summary: "Street maintenance and dirty clean-up contracts.",
      details: "Sewer clearances, vermin extermination, infrastructure support, and low-end evictions.",
      sclReq: "10 - 9",
      sclIncrease: "+0.1",
      sclRange: { min: 0.05, typical: 0.1, max: 0.2 },
      cbsPerOp: "50c - 150c",
      cbsPerSquad: "100c - 300c",
      cbsPerOpRange: { min: 50, max: 150 },
      cbsPerSquadRange: { min: 100, max: 300 },
      mediaCoverage: "Rare / None"
    },
    {
      key: "yellow",
      label: "Yellow",
      type: "Retrieval",
      summary: "Recover a person, item, data package, or specimen.",
      details: "Primary objective is always bring it back, often issued by Housing, Cloak, or Karma.",
      sclReq: "10 - 9",
      sclIncrease: "+0.1",
      sclRange: { min: 0.05, typical: 0.1, max: 0.2 },
      cbsPerOp: "100c - 200c",
      cbsPerSquad: "200c - 400c",
      cbsPerOpRange: { min: 100, max: 200 },
      cbsPerSquadRange: { min: 200, max: 400 },
      mediaCoverage: "Station Analysis / None"
    },
    {
      key: "green",
      label: "Green",
      type: "Cloak / Extermination",
      summary: "Combat-focused extermination and suppression assignments.",
      details: "Kill or capture designated threats before they escalate into full emergency response.",
      sclReq: "10 - 8",
      sclIncrease: "+0.1 to +0.2",
      sclRange: { min: 0.1, typical: 0.1, max: 0.3 },
      cbsPerOp: "100c - 250c",
      cbsPerSquad: "200c - 500c",
      cbsPerOpRange: { min: 100, max: 250 },
      cbsPerSquadRange: { min: 200, max: 500 },
      mediaCoverage: "Station Analysis / Third Eye"
    },
    {
      key: "white",
      label: "White",
      type: "Investigation",
      summary: "Detective and analytical assignments.",
      details: "Evidence-led cases with witness work, profiling, and pattern analysis.",
      sclReq: "10 - 7",
      sclIncrease: "+0.1 to +0.2",
      sclRange: { min: 0.1, typical: 0.1, max: 0.3 },
      cbsPerOp: "150c - 300c",
      cbsPerSquad: "250c - 500c",
      cbsPerOpRange: { min: 150, max: 300 },
      cbsPerSquadRange: { min: 250, max: 500 },
      mediaCoverage: "Third Eye / Station Analysis"
    },
    {
      key: "grey",
      label: "Grey",
      type: "Departmental Enforcement / Corporate",
      summary: "Department-issued internal enforcement and corporate work.",
      details: "Escort, asset protection, audit support, and politically sensitive departmental operations.",
      sclReq: "9 - 7",
      sclIncrease: "+0.2",
      sclRange: { min: 0.1, typical: 0.2, max: 0.3 },
      cbsPerOp: "200c - 400c",
      cbsPerSquad: "300c - 600c",
      cbsPerOpRange: { min: 200, max: 400 },
      cbsPerSquadRange: { min: 300, max: 600 },
      mediaCoverage: "Station Analysis"
    },
    {
      key: "silver",
      label: "Silver",
      type: "Diplomatic / Escort / PR",
      summary: "High-profile, social, and reputationally sensitive contracts.",
      details: "VIP escort, public appearances, negotiations, and camera-facing operations.",
      sclReq: "9 - 6",
      sclIncrease: "+0.1 to +0.3",
      sclRange: { min: 0.1, typical: 0.2, max: 0.4 },
      cbsPerOp: "200c - 500c",
      cbsPerSquad: "300c - 800c",
      cbsPerOpRange: { min: 200, max: 500 },
      cbsPerSquadRange: { min: 300, max: 800 },
      mediaCoverage: "Third Eye / GoreZone"
    },
    {
      key: "jade",
      label: "Jade",
      type: "Environmental / Biohazard",
      summary: "Containment and neutralisation of biological/chemical threats.",
      details: "Biohazard incidents, toxic leaks, mutations, and experimental containment failures.",
      sclReq: "9 - 6",
      sclIncrease: "+0.2 to +0.3",
      sclRange: { min: 0.1, typical: 0.2, max: 0.4 },
      cbsPerOp: "250c - 500c",
      cbsPerSquad: "400c - 800c",
      cbsPerOpRange: { min: 250, max: 500 },
      cbsPerSquadRange: { min: 400, max: 800 },
      mediaCoverage: "Third Eye / Contract Circuit"
    },
    {
      key: "red",
      label: "Red",
      type: "Emergency Response",
      summary: "Crisis-response and red-alert operations.",
      details: "Riots, terror incidents, major failures, and high-risk live-response deployments.",
      sclReq: "10 - 5",
      sclIncrease: "+0.1 to +0.3",
      sclRange: { min: 0.1, typical: 0.2, max: 0.5 },
      cbsPerOp: "200c - 500c",
      cbsPerSquad: "300c - 1000c",
      cbsPerOpRange: { min: 200, max: 500 },
      cbsPerSquadRange: { min: 300, max: 1000 },
      mediaCoverage: "Third Eye / GoreZone"
    },
    {
      key: "black",
      label: "Black",
      type: "Covert / Black Ops",
      summary: "Classified, deniable, and often off-record operations.",
      details: "Assassination, sabotage, deep infiltration, and disavowed clean-up actions.",
      sclReq: "7 - 4",
      sclIncrease: "+0.3 to +0.5",
      sclRange: { min: 0.2, typical: 0.4, max: 0.7 },
      cbsPerOp: "500c - 1000c",
      cbsPerSquad: "800c - 2000c",
      cbsPerOpRange: { min: 500, max: 1000 },
      cbsPerSquadRange: { min: 800, max: 2000 },
      mediaCoverage: "None (classified)"
    },
    {
      key: "platinum",
      label: "Platinum",
      type: "Head Office / Top Secret",
      summary: "Highest-level Head Office operations.",
      details: "World-shaping, metaplot-sensitive assignments for elite proven operatives.",
      sclReq: "5 - 1",
      sclIncrease: "+0.5 to +1.0",
      sclRange: { min: 0.3, typical: 0.5, max: 1.0 },
      cbsPerOp: "1000c+",
      cbsPerSquad: "1500c+",
      cbsPerOpRange: { min: 1000, max: null },
      cbsPerSquadRange: { min: 1500, max: null },
      mediaCoverage: "Classified / Special"
    }
  ];

  static OPTIONAL_COLOURS = [
    {
      key: "orange",
      label: "Orange",
      type: "Sh'ien / Cult / Occult",
      summary: "Cult and occult response introduced in later supplements.",
      details: "Extreme-risk anti-cult operations; L.A.D. often does not respond.",
      sclReq: "9 - 6",
      sclIncrease: "+0.2 to +0.4",
      sclRange: { min: 0.1, typical: 0.3, max: 0.5 },
      cbsPerOp: "500c - 1500c",
      cbsPerSquad: "1000c - 2500c",
      cbsPerOpRange: { min: 500, max: 1500 },
      cbsPerSquadRange: { min: 1000, max: 2500 },
      mediaCoverage: "None / Classified"
    }
  ];

  static MEDIA_OPTIONS = [
    "None",
    "Rare / None",
    "Station Analysis",
    "Third Eye",
    "Third Eye News",
    "GoreZone",
    "Contract Circuit Special",
    "Classified / Special"
  ];

  static MISSION_FOCUS = [
    "Eliminate a threat (kill on sight).",
    "Capture a target alive for interrogation.",
    "Protect or escort a person.",
    "Protect or escort cargo/asset.",
    "Retrieve an item or specimen.",
    "Retrieve data or recordings.",
    "Investigate a crime scene.",
    "Profile and locate a serial killer.",
    "Contain or quarantine (disease, Ebb event, infestation).",
    "Crowd control / riot suppression.",
    "Hunt a specific named NPC.",
    "Clean up an old SLA mess (lost squad, old experiment).",
    "Covert infiltration (no cameras, minimal witnesses).",
    "PR stunt / ratings event (scripted danger).",
    "Patrol and secure a designated area.",
    "Guard or secure a facility during an operation.",
    "Plant or recover surveillance equipment.",
    "Negotiate or mediate between factions.",
    "Sabotage or destroy a target (off the books).",
    "Escort a research team into hostile territory."
  ];

  static LOCATIONS = [
    "Downtown backstreets.",
    "Sewer network / sub-basements.",
    "Industrial sector (factories, power plants).",
    "Uptown commercial zone.",
    "Residential block / tenement.",
    "Transit system (monorail, maglev, stations).",
    "Cannibal Sector perimeter wall.",
    "Cannibal Sector incursion (short foray).",
    "Corporate facility / research lab.",
    "Shopping mall / entertainment complex.",
    "Slum market / black-market hub.",
    "Abandoned, partially condemned sector.",
    "BPN Hall / Shiver precinct.",
    "Nightclub / strip venue / entertainment den.",
    "Rooftops and skyways.",
    "Hospital / medical facility / Karma lab.",
    "Waterway / flood canal / drainage system.",
    "Construction site / demolition zone.",
    "Broadcast tower / media facility.",
    "Suburbia (deceptive calm)."
  ];

  static OPPOSITION = [
    "Street gang (small, poorly armed).",
    "Street gang (large, well-armed).",
    "Organised crime syndicate.",
    "Serial killer (lone wolf).",
    "Serial killer cell (2-4 working together).",
    "DarkNight agents.",
    "DarkNight strike team (heavy weapons).",
    "Thresher operatives (power armour).",
    "Carrien pack.",
    "Carrien alpha and pack.",
    "Carnivorous pigs.",
    "Rogue biogenetic asset (Stormer variant, lab creature).",
    "Manchine or Manchinette.",
    "Rival SLA squad or ex-Operatives.",
    "Sh'ien cult cell.",
    "Dream Entity manifestation.",
    "Scavs (Cannibal Sector).",
    "Conflict Alien cell (Krell, Grosh, or Momic).",
    "Corrupt Shivers / rogue law enforcement.",
    "Unknown anomaly."
  ];

  static COMPLICATIONS = [
    "Heavy rain, poor visibility, slick ground.",
    "Chemical smog reduces visibility to a few metres.",
    "Rolling blackouts and power failures across the area.",
    "Media saturation with Third Eye live-feeds everywhere.",
    "Severe time limit (bomb, hostage deadline, transport window).",
    "Extreme crowd density and collateral risk.",
    "Rival squad on scene (competition or sabotage).",
    "Internal SLA politics conflict with higher-up agendas.",
    "Critical NPC is lying, compromised, or hostile.",
    "Structurally unstable environment (collapses, fires, floods).",
    "Local Shivers are corrupt, incompetent, or hostile.",
    "L.A.D. will not respond in this area.",
    "Equipment glitch; random squad gear fails.",
    "Hidden metaplot element (The Truth, Karma secret, etc.).",
    "Civilians in line of fire who must not be harmed.",
    "A secondary unrelated threat wanders into the area.",
    "Communications are jammed or intercepted.",
    "Opposition has inside information on the squad.",
    "The BPN is a setup; the real target is the squad.",
    "Supernatural interference (Ebb disruption, Dream bleed)."
  ];

  static COLOUR_MISSION_IDEAS = {
    blue: [
      "Sewage surge has flooded a sub-sector; clear out Carrien and secure the pump station before repairs begin.",
      "A waste-processing plant is offline after equipment sabotage by locals; restore operations and identify the culprits.",
      "Vermin the size of dogs have infested a housing block; exterminate them and reassure residents for the cameras.",
      "A derelict subway spur is clogging with bio-waste; survey the tunnels and mark safe lanes for future clean-up crews.",
      "A low-level gang has turned a recycling depot into its base; evict them without damaging the valuable machinery.",
      "Strange fungal blooms are clogging storm drains; collect samples for Karma and clear the worst hotspots.",
      "A maintenance drone swarm has gone rogue; shut them down before they start dismantling the wrong infrastructure.",
      "Old SLA promo billboards must be taken down in a collapsing district; secure the area and prevent looting.",
      "A derelict tenement is scheduled for demolition, but movement has been detected inside; confirm the building is empty.",
      "Toxic runoff is seeping into a public park; cordon off the area, locate the leak, and neutralise any contaminated fauna.",
      "A cluster of shoddy aftermarket power lines is causing rolling blackouts; disconnect them and persuade the owners.",
      "Sewer sensors indicate something large and mobile beneath a food distribution centre; investigate and neutralise."
    ],
    white: [
      "A serial killer is targeting low-SCL Operatives; profile the killer and stop them before media ratings get out of control.",
      "A batch of SLA-manufactured ammo has been sabotaged; trace the faulty rounds back to the source.",
      "A Shiver lieutenant's squad has gone missing in a routine raid; retrace their steps and recover their camera feeds.",
      "Illegal Black Ebb recordings are circulating on the street; find the distributor and shut them down.",
      "A local sponsor complains their advert placements are being hacked mid-broadcast; track the signal hijacker.",
      "A Karma van transporting bio-samples vanished between checkpoints; reconstruct the route and find out who took it.",
      "Someone is forging low-tier BPNs to lure squads into ambushes; uncover who is issuing the fakes.",
      "Bodies are turning up with identical wounds but in different sectors; link the cases and identify the pattern.",
      "A neighbourhood's crime rate has inexplicably plummeted; investigate what actually changed.",
      "A corporate accountant flagged an impossible profit spike in a minor subsidiary; discover the real revenue source.",
      "A Shiver precinct commander is unusually successful; determine whether they are legitimately efficient or deeply corrupt.",
      "Evidence suggests a popular media personality is secretly connected to a cult; confirm or debunk it before the story breaks."
    ],
    red: [
      "A riot has erupted around a ration distribution point; secure the site and take control of the narrative.",
      "Explosive devices are believed to be planted in a school sector; sweep the buildings and neutralise all threats.",
      "A monorail has been hijacked; board in motion, rescue hostages, and keep collateral minimal on live television.",
      "A major storm is flooding low-lying districts; coordinate evacuations while suppressing looters and opportunists.",
      "A power plant fire is threatening to cascade; clear the area, assist emergency crews, and prevent catastrophic failure.",
      "A Conflict Alien strike team has been spotted; intercept before they hit their real objective.",
      "A massive Carrien surge has breached a storm drain into Downtown; plug the gap and thin the horde.",
      "A broadcast tower has been seized by extremists; retake it and ensure the last thing viewers see is SLA heroism.",
      "A lethal designer drug is causing mass psychosis; contain the outbreak and secure samples.",
      "A VIP motorcade has been ambushed; stabilise the situation and extract survivors under fire.",
      "Multiple fires are raging in a shopping arcology; rescue trapped civilians and find the arsonist's real target.",
      "A district's life-support systems are malfunctioning; defend the engineers while they carry out risky repairs."
    ],
    orange: [
      "Sh'ien graffiti patterns match those from an archived eradicated cell; investigate the copycat or surviving cult.",
      "A mass sleepwalking incident has led dozens to congregate at a specific derelict site; secure and analyse the location.",
      "An entire floor of a residential tower reports identical nightmares; identify the source before it escalates.",
      "A black-market dealer is selling Ebb-tainted relics; trace their supply chain and recover everything.",
      "A minor street preacher is suddenly attracting a dangerous following; determine if they are Sh'ien-linked.",
      "Medical scanners show inexplicable echoes in people who passed through one subway station; shut it down and investigate.",
      "A Shiver squad claims a suspect disappeared in front of them; confirm if it was a cult trick, Ebb power, or something worse.",
      "Rumours say a new audio track opens your eyes to reality; locate the studio and neutralise the meme.",
      "A cult has taken over a child-care facility; rescue the children and identify any corruption.",
      "Ever-shifting graffiti sigils appear faster than crews can paint over them; catch the artists in the act.",
      "A popular VR parlour is linked to sudden psychotic breaks; inspect the code and its origin.",
      "A derelict shrine in the Cannibal Sectors starts appearing in civilians' dreams; perform a recon and report."
    ],
    green: [
      "Routine patrol through a newly upgraded shopping sector; deter crime and look good for the cameras.",
      "Guard duty at a temporary outdoor concert; keep the crowd safe and the band scandal-free.",
      "Escort a convoy of Shiver reinforcements through a high-risk corridor.",
      "Provide visible presence in a district where rumours of monster sightings are bad for business.",
      "Guard a political rally for an approved figurehead; prevent any embarrassing incidents.",
      "Patrol the perimeter of a massive demolition site; stop scavengers and thrill-seekers from slipping inside.",
      "Offer security at a new sponsor's product launch; ensure rival brands do not sabotage the event.",
      "Perform weapon checks and licence verification at a series of random checkpoints.",
      "Sweep a high-end residential area after a spate of burglaries; catch the thieves or at least look competent on camera.",
      "Guard a temporary field hospital in a rough district.",
      "Provide security for a sensitive prisoner transfer.",
      "Ride-along with a Media team to show the life of Operatives while actually dealing with scripted trouble."
    ],
    yellow: [
      "Recover a stolen prototype before it is sold through the black-market chain.",
      "Locate a missing departmental courier and return all carried data drives intact.",
      "Retrieve a captured informant before rival factions can extract anything useful."
    ],
    grey: [
      "Escort a convoy of experimental cargo from Karma labs to a secure vault.",
      "Transport a high-value corporate witness to an off-world transport shuttle.",
      "Guard a new prototype vehicle during a test run through hostile streets.",
      "Provide security for a boardroom meeting between rival SLA subsidiaries.",
      "Assist a corporate audit team investigating missing shipments.",
      "Protect engineers installing new surveillance hardware in a tense district.",
      "Oversee the relocation of a sensitive research project between facilities.",
      "Guard a temporary data hub while permanent infrastructure is built.",
      "Provide muscle for a friendly acquisition of a smaller company.",
      "Protect an unpopular manager implementing cost-cutting measures.",
      "Escort an off-world visitor on a tour of Mort.",
      "Ensure a shipment of branded consumer goods arrives intact for a big promo."
    ],
    silver: [
      "Provide protection for a sponsor-backed public appearance while keeping media optics controlled.",
      "Escort a diplomatic envoy through hostile districts without provoking a public incident.",
      "Secure a high-profile interview venue against sabotage before the live segment begins."
    ],
    jade: [
      "Contain a biohazard leak in a mixed-use block and secure live samples for Karma.",
      "Neutralise a mutated creature outbreak without letting contamination spread to transport lines.",
      "Lock down a failed research ward and extract surviving technicians for debrief."
    ],
    black: [
      "Infiltrate a closed compound, remove a target quietly, and leave no public trace.",
      "Sabotage a rival operation and seed false evidence that redirects retaliation.",
      "Extract sensitive records from an internal vault while command denies the mission exists."
    ],
    platinum: [
      "Quietly extract a high-ranking SLA employee who knows too much but wants out.",
      "Investigate an off-limits sector where sensors keep going dark.",
      "Escort a covert research team studying a Dream Entity manifestation.",
      "Recover a lost prototype biogenetic asset before anyone realises it escaped.",
      "Infiltrate a hostile corporate facility posing as contractors and steal specific data.",
      "Escort a classified package through the Cannibal Sectors without drawing attention.",
      "Plant or remove evidence in a location that will change the narrative of a past disaster.",
      "Assist Threat Analysis in stress-testing a new Manchine under live conditions.",
      "Cover up a catastrophic SLA mistake before anyone connects the dots.",
      "Secure an artefact discovered in the No-Go Zone and erase all unofficial records of it.",
      "Quietly remove a popular Operative whose fame makes them inconvenient.",
      "Participate in a staged heroic failure designed to justify new policies."
    ]
  };

  static CONTACTS = [
    "Jaded Shiver sergeant who trusts no one.",
    "Bright-eyed SLA admin who idolises Operatives.",
    "Cynical corporate liaison who wants the BPN closed fast.",
    "Veteran Op squad leader stuck at a desk.",
    "Streetwise fixer with surveillance access.",
    "Nervous lab technician with high clearance.",
    "Ambitious Third Eye reporter desperate for footage.",
    "Department Financier (professional, by-the-book).",
    "Independent Financier (well connected, bigger cut).",
    "Freelance Financier (shady, access to rare BPNs).",
    "Burned-out medtech who secretly deals in organs.",
    "Darkfinder (Internal Affairs) running the squad as assets."
  ];

  static CIVILIAN_FACTIONS = [
    "Local Residents' Committee trying to keep their block safe.",
    "Black-market traders who know all the unofficial routes.",
    "Gang of kids who idolise Operatives and imitate them.",
    "Angry union of underpaid maintenance workers.",
    "Fan club for a specific Operative or squad.",
    "Neighbourhood watch militia with more enthusiasm than training.",
    "Displaced refugees from a devastated sector.",
    "A semi-legal street clinic with decent gear and shady ties.",
    "A corporate community outreach team doing PR.",
    "A quietly embedded cult cell masquerading as a self-help group."
  ];

  static OPPOSITION_ATTITUDES = [
    "Underestimate the squad and get cocky.",
    "Terrified of SLA but cornered and desperate.",
    "Consider the squad just another expendable obstacle.",
    "Fanatically devoted to their cause.",
    "Only in it for the money.",
    "Hoping to cut a deal or escape, not die.",
    "Using the squad as a distraction for something bigger.",
    "Personally hates one squad member (backstory tie-in)."
  ];

  static ATMOSPHERES = [
    "Oppressive rain, constant thunder, ankle-deep water in streets.",
    "Thick chemical smog and neon halos around every light.",
    "Flickering power, rolling blackouts, and generator hum.",
    "Ear-splitting industrial noise and constant machine vibration.",
    "Eerily quiet; most people stay inside and watch screens.",
    "Packed streets with festivals or sale events in progress.",
    "Curfew in effect with Shivers on every corner.",
    "Sirens and distant gunfire as constant background.",
    "Garbage piled high with swarms of vermin everywhere.",
    "Block party ambience with half-drunk, unpredictable locals.",
    "Buildings under partial construction/demolition with exposed steel and cranes.",
    "Heavy fog or steam making visibility very poor."
  ];

  static LOCAL_TWISTS = [
    "The area is regarded as cursed by locals and they avoid talking about it.",
    "A recent promo shoot left half-finished set pieces all over the place.",
    "A minor celeb is present, drawing attention and complicating operations.",
    "Surveillance coverage is patchy or outright disabled.",
    "A rival squad failed a BPN here recently; their graffiti and damage remain.",
    "The district mascot/logo is unintentionally creepy.",
    "Every surface is plastered with a specific advert campaign.",
    "A local rumour insists the squad is actually part of the problem.",
    "Widespread betting is taking place on the BPN outcome.",
    "Someone is live-streaming events independently of official Media."
  ];

  static EXTRA_OBJECTIVES = [
    "Capture at least one enemy alive for interrogation.",
    "Recover specific data intact (no EMP or overkill).",
    "Ensure a particular building remains undamaged.",
    "Plant a tracking or listening device unnoticed.",
    "Make a public statement on camera following the operation.",
    "Secure a specific piece of gear for a sponsor.",
    "Identify a leak within SLA forces on the scene.",
    "Escort a secondary asset without revealing their importance.",
    "Salvage usable tech from the opposition.",
    "Protect a secret route or entrance from discovery.",
    "Secure evidence that discredits a rival corporation.",
    "Ensure that no civilians witness a particular event."
  ];

  static ESCALATION_EVENTS = [
    "Reinforcements arrive for the opposition.",
    "The environment becomes more dangerous (fire spreads, flood rises, etc.).",
    "Media crews show up mid-operation.",
    "A key NPC flees, forcing a chase.",
    "A supposedly neutral faction chooses a side.",
    "Communications go down at a critical moment.",
    "A secondary threat wanders into the area.",
    "An unexpected evacuation alarm triggers mass panic.",
    "A building or structure begins to collapse.",
    "A hidden timer reaches zero: detonation, release, or awakening.",
    "An important ally is revealed as compromised.",
    "Something from the metaplot makes itself known."
  ];

  static COLOR_ROLL_TABLE = [
    { min: 1, max: 4, key: "blue" },
    { min: 5, max: 7, key: "yellow" },
    { min: 8, max: 9, key: "green" },
    { min: 10, max: 12, key: "white" },
    { min: 13, max: 13, key: "grey" },
    { min: 14, max: 14, key: "silver" },
    { min: 15, max: 15, key: "jade" },
    { min: 16, max: 17, key: "red" },
    { min: 18, max: 18, key: "orange" },
    { min: 19, max: 19, key: "black" },
    { min: 20, max: 20, key: "platinum" }
  ];

  static COLOUR_DESCRIPTIONS = {
    blue: "The lowest and dirtiest contracts: maintenance support, sewer work, vermin culls, and low-end evictions.",
    yellow: "Retrieval-first assignments where the goal is to locate and bring back a person, item, data package, or specimen.",
    green: "Cloak-style extermination and suppression contracts focused on kill/capture outcomes.",
    white: "Investigation-heavy BPNs covering forensic work, profiling, witness handling, and analytical case solving.",
    grey: "Departmental/corporate enforcement jobs with political strings, discretion requirements, and internal stakes.",
    silver: "Diplomatic, escort, and PR-sensitive operations where camera performance matters as much as combat efficiency.",
    jade: "Environmental and biohazard response with contamination, mutation, and specialist-equipment risk.",
    red: "Emergency response during active crises; high danger, high visibility, and immediate intervention mandates.",
    black: "Classified covert operations with deniable objectives, no public recognition, and severe consequences on failure.",
    platinum: "Head Office top-secret contracts tied to the highest-level SLA interests and metaplot sensitivity.",
    orange: "Supplement-era anti-cult/occult response; extremely high risk with limited or no L.A.D. safety net."
  };

  static CORE_JOURNAL_NAME = "BPN FORMAT & COLOUR CODES";
  static TEMPLATE_JOURNAL_NAME = "TEMPLATE – BPN";
  static EXTENDED_DATA_JOURNAL_NAME = "BPN RANDOM DATA – EXTENDED";
  static COMPLETE_JOURNAL_NAME = "BPN TOOLKIT – COMPLETE";
  static EQUIPMENT_JOURNAL_NAME = "SLA GENERAL EQUIPMENT CATALOGUE";
  static GEAR_ICON_PATH = "systems/sla-industries-brp/assets/SLA_Assets/Gear";
  static _GEAR_ICON_MAP = null;
  static RULEBOOK_JOURNAL_NAME = "SLA RULEBOOK – PLAYERS & GMS";
  static RULEBOOK_SOURCE_PATH = "systems/sla-industries-brp/SLA_RULEBOOK_FOUNDATION.md";
  static VEHICLE_CHASE_JOURNAL_NAME = "SLA VEHICLES & CHASES – PLAYERS & GMS";
  static VEHICLE_CHASE_SOURCE_PATH = "systems/sla-industries-brp/SLA_VEHICLES_AND_CHASES.md";
  static NPC_ADVERSARY_JOURNAL_NAME = "SLA NPCS & ADVERSARIES – PLAYERS & GMS";
  static NPC_ADVERSARY_SOURCE_PATH = "systems/sla-industries-brp/SLA_NPCS_AND_ADVERSARIES.md";
  static NON_COMBAT_ISSUES_SOURCE_PATH = "systems/sla-industries-brp/SLA_Operative_NonCombat_Issues.md";
  static _NON_COMBAT_ISSUES_CACHE = null;
  static CHASE_RANGE_BANDS = ["Engaged", "Close", "Far", "Lost"];
  static CHASE_APPROACHES = {
    aggressive: "Aggressive",
    neutral: "Neutral",
    evasive: "Evasive"
  };
  static WOUND_SERIOUS_INJURIES = [
    {
      roll: 1,
      title: "Close Call",
      effect: "No lasting physical injury. -10% SAN/COOL checks for the rest of this BPN."
    },
    {
      roll: 2,
      title: "Deep Flesh Wound",
      effect: "-10% to one physical skill until fully healed."
    },
    {
      roll: 3,
      title: "Fracture / Broken Limb",
      effect: "-20% to relevant actions until proper treatment."
    },
    {
      roll: 4,
      title: "Internal Bleeding / Organ Damage",
      effect: "Temporary max HP reduction (suggest -2) until proper medical care."
    },
    {
      roll: 5,
      title: "Disfigurement / Visible Scar",
      effect: "Contextual social penalty with some NPCs; possible intimidation upside."
    },
    {
      roll: 6,
      title: "Near-Death Trauma",
      effect: "Mental scar: situational -10% SAN/COOL until recovery support."
    }
  ];

  static NPC_ADVERSARY_TEMPLATES = [
    {
      id: "tier1-downtown-ganger",
      name: "Downtown Ganger",
      role: "Tier 1 Extra",
      tier: 1,
      attributes: { str: 10, con: 10, dex: 11, int: 9, pow: 9, cha: 9, siz: 10, edu: 8 },
      skills: [
        { name: "Streetwise", value: 35 },
        { name: "Stealth", value: 40 },
        { name: "Melee", value: 40 },
        { name: "Pistol", value: 35 }
      ],
      attacks: [
        { name: "Knife", pct: 40, damage: "1D6", weaponType: "melee", range: "S", att: 1, notes: "Close-in rush weapon." },
        { name: "10mm Pistol", pct: 35, damage: "1D8", weaponType: "firearm", range: "S/M", att: 1, notes: "Cheap sidearm with poor control under pressure." }
      ],
      armour: "Leather/cheap jacket AR 1",
      traits: [
        "Cowardly: if two allies drop or SLA overmatch appears, COOL test or break and run."
      ],
      gear: ["Cheap comms", "Cigarettes", "Street tokens"],
      bpnHooks: ["Blue", "White", "Red"]
    },
    {
      id: "tier1-basic-civilian",
      name: "Basic Civilian",
      role: "Tier 1 Extra",
      tier: 1,
      attributes: { str: 8, con: 9, dex: 9, int: 10, pow: 9, cha: 10, siz: 9, edu: 10 },
      skills: [
        { name: "Athletics", value: 30 },
        { name: "Hide", value: 25 },
        { name: "Persuade", value: 30 }
      ],
      attacks: [
        { name: "Improvised Weapon", pct: 25, damage: "1D4", weaponType: "melee", range: "S", att: 1, notes: "Desperation attack only." }
      ],
      armour: "None",
      traits: [
        "Panicky: SAN/COOL checks at Disadvantage under sustained gunfire."
      ],
      gear: ["Finance chip", "Civilian clothing"],
      bpnHooks: ["Blue", "White", "Silver"]
    },
    {
      id: "tier2-shiver-patrol",
      name: "Shiver Patrol Officer",
      role: "Tier 2 Standard Opposition",
      tier: 2,
      attributes: { str: 12, con: 12, dex: 11, int: 10, pow: 11, cha: 10, siz: 12, edu: 10 },
      skills: [
        { name: "Rifle", value: 55 },
        { name: "Baton", value: 50 },
        { name: "Athletics", value: 45 },
        { name: "Perception", value: 50 },
        { name: "Intimidate", value: 45 }
      ],
      attacks: [
        { name: "Gauss Rifle", pct: 55, damage: "2D8", weaponType: "firearm", range: "S/M/L", att: 1, notes: "Service longarm." },
        { name: "Baton", pct: 50, damage: "1D6+1", weaponType: "melee", range: "S", att: 1, notes: "Control and compliance strikes." }
      ],
      armour: "Blocker Armour AR 4",
      traits: [
        "Backup: rarely deployed alone; expected squad size 3-6.",
        "Procedure-Driven: calls escalation if contact exceeds remit."
      ],
      gear: ["Radio", "Cuffs", "Torch", "Basic med kit"],
      bpnHooks: ["Blue", "Red", "Grey", "Silver"]
    },
    {
      id: "tier2-darknight-cell",
      name: "DarkNight Cell Operative",
      role: "Tier 2 Standard Opposition",
      tier: 2,
      attributes: { str: 12, con: 12, dex: 13, int: 12, pow: 11, cha: 10, siz: 12, edu: 11 },
      skills: [
        { name: "Rifle", value: 60 },
        { name: "Stealth", value: 60 },
        { name: "Electronics", value: 50 },
        { name: "Tactics", value: 45 },
        { name: "Knife", value: 45 }
      ],
      attacks: [
        { name: "Assault Rifle", pct: 60, damage: "2D8", weaponType: "firearm", range: "S/M/L", att: 1, notes: "Burst-capable suppression fire." },
        { name: "Combat Knife", pct: 45, damage: "1D6", weaponType: "melee", range: "S", att: 1, notes: "Last-ditch close combat tool." }
      ],
      armour: "Medium armour AR 4-5",
      traits: [
        "Coordinated: +10% Tactics-led actions when operating in cell strength.",
        "Fanatic: +20% to resist intimidation/interrogation."
      ],
      gear: ["Fake IDs", "Encrypted comms", "Explosive package"],
      bpnHooks: ["Red", "Grey", "Black"]
    },
    {
      id: "tier3-dark-finder-agent",
      name: "Cloak Division Agent",
      role: "Tier 3 Elite Operative",
      tier: 3,
      attributes: { str: 14, con: 14, dex: 14, int: 13, pow: 14, cha: 12, siz: 14, edu: 13 },
      skills: [
        { name: "Pistol", value: 75 },
        { name: "Unarmed", value: 70 },
        { name: "Stealth", value: 70 },
        { name: "Insight", value: 75 },
        { name: "Intimidate", value: 80 },
        { name: "Investigation", value: 70 }
      ],
      attacks: [
        { name: "Concealed Service Pistol", pct: 75, damage: "1D10+2", weaponType: "firearm", range: "S/M", att: 1, notes: "High-grade sidearm with armour penetration profile." },
        { name: "Unarmed Strike", pct: 70, damage: "1D6+2", weaponType: "melee", range: "S", att: 1, notes: "Includes grappling control options." }
      ],
      armour: "Discrete Cloak armour AR 5-6",
      traits: [
        "Nuke Tendon Implants: once per scene, may act first regardless of initiative.",
        "Internal Authority: many NPCs must pass COOL to refuse direct orders."
      ],
      gear: ["Restraint kit", "Secure Observation link", "High-grade comms"],
      bpnHooks: ["Grey", "Platinum"]
    },
    {
      id: "tier3-thresher-pilot",
      name: "Thresher Powersuit Pilot",
      role: "Tier 3 Elite Operative",
      tier: 3,
      attributes: { str: 16, con: 15, dex: 13, int: 12, pow: 11, cha: 9, siz: 15, edu: 10 },
      skills: [
        { name: "Heavy Weapons", value: 70 },
        { name: "Tactics", value: 60 },
        { name: "Electronics", value: 50 }
      ],
      attacks: [
        { name: "Heavy Gauss Cannon", pct: 70, damage: "3D10", weaponType: "heavy", range: "M/L", att: 1, notes: "Suit-mounted anti-personnel and anti-vehicle cannon." },
        { name: "Power Fist", pct: 65, damage: "2D8", weaponType: "melee", range: "S", att: 1, notes: "High-impact suit strike; GM may add STR bonus." }
      ],
      armour: "Powersuit AR 8+",
      traits: [
        "Bulky: suffers penalties in cramped interiors and bad terrain.",
        "Shock & Awe: first reveal can force SAN/COOL checks on soft targets."
      ],
      gear: ["Sealed environment suit", "HUD suite", "Heavy support rig"],
      bpnHooks: ["Red", "Black", "Platinum"]
    },
    {
      id: "tier4-carrien-hunter",
      name: "Carrien Hunter",
      role: "Tier 4 Horror",
      tier: 4,
      attributes: { str: 15, con: 13, dex: 13, int: 6, pow: 8, cha: 0, siz: 15, edu: 0 },
      skills: [
        { name: "Claw", value: 65 },
        { name: "Athletics", value: 60 },
        { name: "Stealth", value: 60 }
      ],
      attacks: [
        { name: "Claws", pct: 65, damage: "1D8+2", weaponType: "melee", range: "S", att: 1, notes: "AP 1 tearing strike profile." },
        { name: "Bite", pct: 55, damage: "1D8", weaponType: "melee", range: "S", att: 1, notes: "Special: extra tearing damage on strong hit." }
      ],
      armour: "Mutant hide AR 2-3",
      traits: [
        "Night Hunter: Advantage on stealth/perception in darkness.",
        "Pack Tactics: +10% attack when multiple Carrien engage same target.",
        "Horror: first encounter can trigger SAN pressure."
      ],
      gear: ["None"],
      bpnHooks: ["Blue", "Green", "Black"]
    },
    {
      id: "tier4-manchine",
      name: "Manchine",
      role: "Tier 4 Set-Piece Horror",
      tier: 4,
      attributes: { str: 18, con: 18, dex: 14, int: 7, pow: 0, cha: 0, siz: 22, edu: 0 },
      skills: [
        { name: "Melee", value: 75 },
        { name: "Athletics", value: 60 }
      ],
      attacks: [
        { name: "Metal Claws", pct: 75, damage: "2D8+3", weaponType: "melee", range: "S", att: 2, notes: "AP 3, relentless close assault." }
      ],
      armour: "Heavy cybernetic chassis AR 6",
      traits: [
        "Relentless: immune to fear and most mental effects.",
        "Terror of Mort: SAN pressure on first visual contact.",
        "Engine of Murder: may make one extra melee attack per round at reduced accuracy."
      ],
      gear: ["Integrated weapons only"],
      bpnHooks: ["Green", "Black", "Platinum"]
    }
  ];

  static NPC_QUICK_TIER_TABLE = [
    { min: 1, max: 3, tier: 1 },
    { min: 4, max: 6, tier: 2 },
    { min: 7, max: 8, tier: 3 },
    { min: 9, max: 10, tier: 4 }
  ];

  static NON_COMBAT_PROBLEM_DOMAINS = [
    "Operational Logistics Failure",
    "Media Narrative Crisis",
    "Civilian Unrest Pressure",
    "Corporate Audit Exposure",
    "Infrastructure Breakdown",
    "Political Leverage Conflict",
    "Contamination / Quarantine Protocol",
    "Intel Integrity Breach",
    "Hostage Negotiation Window",
    "Financial / Credit Lockout"
  ];

  static NON_COMBAT_PROBLEM_STAKES = [
    "Mission authorisation is revoked if not resolved in time.",
    "Sponsor confidence drops and payout penalties trigger.",
    "Shiver support is withdrawn pending compliance.",
    "Public panic escalates into riot conditions.",
    "Core objective remains blocked until the bottleneck is cleared.",
    "Rival department gains leverage over the squad.",
    "Evidence chain-of-custody becomes legally compromised.",
    "Escalation to a RED-tier emergency becomes likely."
  ];

  static NON_COMBAT_PROBLEM_TWISTS = [
    "Primary witness is lying to protect a handler.",
    "A local official is broadcasting misinformation.",
    "System access keys are valid but silently blacklisted.",
    "Two valid command channels issue conflicting orders.",
    "The apparent fix creates a second hidden failure mode.",
    "An Internal Affairs observer is monitoring every decision.",
    "A sponsor demands camera-facing theatrics before cooperation.",
    "The true source is inside a friendly chain of command."
  ];

  static NON_COMBAT_SKILL_LANES = [
    ["Bureaucracy", "Persuade"],
    ["SLA Info", "Psychology"],
    ["Tech (Computers & AI)", "Tech (Electronics)"],
    ["Command", "Intimidate"],
    ["Streetwise", "Fast Talk"],
    ["Medical", "Forensics"],
    ["Tactics", "SLA Info"],
    ["Drive (Civilian)", "Navigate"],
    ["Craft", "Tech (Mechanical)"],
    ["Listen", "Spot Hidden"]
  ];

  static EQUIPMENT_CATEGORIES = [
    {
      key: "communications",
      title: "Communications Equipment",
      items: [
        {
          name: "Headset Communicator",
          cost: "20c",
          weight: "0.1kg",
          power: "48hrs continuous",
          description: "Standard SLA encrypted short-range comms with bone-conduction mic/speaker.",
          stats: ["Range: 5km urban / 15km open terrain", "Encryption: Listen at -40% to intercept"],
          brp: "Enables squad coordination. +10% to cooperative Tactics rolls."
        },
        {
          name: "Klippo Multi-Band Communicator",
          cost: "150c",
          weight: "0.3kg",
          power: "72hrs",
          description: "Handheld or belt-mounted boosted comm unit with recording.",
          stats: ["Range: 15km urban / 50km open terrain", "Encryption: Listen at -60% to intercept"],
          brp: "Can patch into Third Eye feeds, Shiver channels, or public bands."
        },
        {
          name: "Vid-Phone (Portable)",
          cost: "80c",
          weight: "0.5kg",
          power: "24hrs",
          description: "Visual comm device for public/private/SLA channels with video recording.",
          stats: ["Range: unlimited via network / 10km direct", "Storage: 2hrs video"],
          brp: "Useful for remote briefings and evidence transmission."
        },
        {
          name: "Oyster Card (ITB Card)",
          cost: "5c",
          weight: "0.01kg",
          power: "Passive RFID",
          description: "ID, travel, and banking card with SCL, credits, permits, and biometrics.",
          stats: ["Replacement fee after loss: 50c", "Loss can trigger immediate SCL audit"],
          brp: "Required for official SLA transactions. Electronics (Computer) at -30% to hack."
        },
        {
          name: "Operative Organiser",
          cost: "100c",
          weight: "0.4kg",
          power: "168hrs",
          description: "Rugged PDA with BPN storage, maps, contacts, and tactical software.",
          stats: ["Includes Downtown maps and transit schedules", "Includes basic forensic software"],
          brp: "+10% to Navigate (Urban) and Research when consulting stored data."
        },
        {
          name: "BOOPA (Audio)",
          cost: "250c",
          weight: "0.6kg",
          power: "96hrs",
          description: "Advanced tactical audio suite with threat detection and directional awareness.",
          stats: ["Range: 20km urban / 60km open terrain", "Active filtering for sonic/flash effects"],
          brp: "+20% Listen, negates surprise from audio cues, halves flashbang/sonic effects."
        }
      ]
    },
    {
      key: "surveillance",
      title: "Surveillance & Detection Equipment",
      items: [
        {
          name: "Environment Scanner (Standard)",
          cost: "300c",
          weight: "1.2kg",
          power: "48hrs",
          description: "Handheld multi-spectrum scanner for heat, chemicals, radiation, bio, and EM fields.",
          stats: ["Range: 50m radius", "Invisible/cloaked detection to 10m"],
          brp: "+30% Search for hidden targets/objects. Opposed Stealth for cloaked targets."
        },
        {
          name: "Environment Scanner (Advanced)",
          cost: "800c",
          weight: "1.5kg",
          power: "72hrs",
          description: "Military-grade scanner with composition analysis, motion tracking, and Ebb sensing.",
          stats: ["Range: 100m radius / 500m targeted scan", "Auto-detects Ebb use within 50m"],
          brp: "+40% Search. Can identify compounds/agents with no additional kit."
        },
        {
          name: "UV / Multi-Spectrum Torch",
          cost: "15c",
          weight: "0.3kg",
          power: "24hrs",
          description: "Compact weatherproof torch with white/UV/IR modes.",
          stats: ["Beam: 50m white / 20m UV or IR"],
          brp: "UV reveals bio traces with Forensics. IR halves darkness penalties."
        },
        {
          name: "Binoculars (Standard)",
          cost: "30c",
          weight: "0.4kg",
          power: "N/A",
          description: "8x optical binoculars with waterproof body.",
          stats: ["Effective observation to 500m"],
          brp: "Negates Spot range penalties up to 500m."
        },
        {
          name: "Binoculars (Tactical)",
          cost: "200c",
          weight: "0.8kg",
          power: "48hrs",
          description: "12x stabilized optics with IR/low-light, rangefinder, and laser designator.",
          stats: ["Effective to 2000m", "Exact distance output"],
          brp: "Negates Spot range penalties to 2000m. IR works in total darkness."
        },
        {
          name: "Motion Tracker",
          cost: "450c",
          weight: "1.0kg",
          power: "72hrs",
          description: "Vibration/thermal movement detector with direction and approximate distance.",
          stats: ["Range: 50m radius", "Poor through thick walls or vs stationary targets"],
          brp: "Auto-alerts movement in range. +20% to avoid ambush."
        },
        {
          name: "Forensic Kit",
          cost: "180c",
          weight: "2.5kg",
          power: "N/A",
          description: "Portable CSI suite with sample tools, reagents, bags, and analysis aids.",
          stats: ["20 consumable uses included"],
          brp: "Required for detailed Forensics; otherwise -30%."
        },
        {
          name: "Lockpick Set (Professional)",
          cost: "50c",
          weight: "0.2kg",
          power: "N/A",
          description: "Professional mechanical picks, tension tools, and bypass hardware.",
          stats: ["Removes improvised lockpicking penalties"],
          brp: "Required for Locksmith rolls without penalty; improvised tools impose -20%."
        },
        {
          name: "Electronic Lockpick / Bypass Kit",
          cost: "300c",
          weight: "0.5kg",
          power: "24hrs",
          description: "Electronic lock override, keycard cloning, and cipher bypass suite.",
          stats: ["+10% Electronics (Security) for electronic lock defeat", "Military-grade SLA locks may still require specialist access"],
          brp: "Primary toolkit for electronic breach work."
        }
      ]
    },
    {
      key: "medical",
      title: "Medical Equipment",
      items: [
        {
          name: "BOOPA Medical Kit (Standard)",
          cost: "50c",
          weight: "1.5kg",
          power: "N/A",
          description: "Field first-aid set with bandages, antiseptics, coagulants, and hypo tools.",
          stats: ["Supplies for 10 treatments", "Includes KickStart and Splatter doses"],
          brp: "Required for First Aid without penalty. KickStart restores 1d3 HP."
        },
        {
          name: "BOOPA Medical Kit (Advanced)",
          cost: "250c",
          weight: "3.0kg",
          power: "48hrs diagnostics",
          description: "Enhanced trauma and surgical field kit with scanner/defib/monitoring tools.",
          stats: ["Supplies for 20 treatments", "Includes KickStart, Splatter, and Bosh doses"],
          brp: "Required for Medicine without penalty. +10% to First Aid and Medicine."
        },
        {
          name: "Medikit (Disposable Emergency)",
          cost: "10c",
          weight: "0.3kg",
          power: "N/A",
          description: "Single-use emergency pack with stimulant and coagulant patch.",
          stats: ["Single use"],
          brp: "Allows First Aid at -10%. Restores 1d3 HP."
        },
        {
          name: "Trauma Stabiliser",
          cost: "400c",
          weight: "5.0kg",
          power: "12hrs",
          description: "Portable life-support unit for critically injured casualties.",
          stats: ["Includes oxygen, IV, and vital monitors"],
          brp: "Auto-stabilises dying characters for 12 hours; Medicine roll to apply optimally."
        },
        {
          name: "Drug Hypo-Spray (Empty)",
          cost: "5c",
          weight: "0.1kg",
          power: "N/A",
          description: "Reusable painless delivery system for one drug dose.",
          stats: ["Holds 1 dose"],
          brp: "Administer one dose as a simple combat action."
        }
      ]
    },
    {
      key: "exploration",
      title: "Climbing & Exploration Gear",
      items: [
        {
          name: "Grapple Gun",
          cost: "120c",
          weight: "2.0kg",
          power: "24 shots",
          description: "Pneumatic launcher with 50m monofilament line and hook options.",
          stats: ["Line tensile strength: 500kg", "Setup time: 1 combat round"],
          brp: "+20% Climb with secured line. Line breaks on 10+ damage hit."
        },
        {
          name: "Climbing Harness & Gear",
          cost: "40c",
          weight: "1.5kg",
          power: "N/A",
          description: "Full harness kit with ascenders, descenders, gloves, and support hardware.",
          stats: ["Field climbing standard"],
          brp: "Required for serious climbing; without it Climb at -20%."
        },
        {
          name: "Rope (50m, High-Tensile)",
          cost: "20c",
          weight: "3.0kg",
          power: "N/A",
          description: "Military climbing rope, weatherproof and squad-capable.",
          stats: ["Tensile strength: 800kg"],
          brp: "+10% Climb with proper rope support."
        },
        {
          name: "Maghold Boots",
          cost: "80c",
          weight: "2.0kg",
          power: "48hrs battery / 8hrs continuous use",
          description: "Electromagnetic boots for ferrous walls and ceilings.",
          stats: ["Metal surfaces only", "Movement rate halved while active"],
          brp: "Auto-success Climb on metal surfaces."
        },
        {
          name: "Maghold Gloves",
          cost: "60c",
          weight: "0.5kg",
          power: "48hrs battery / 8hrs continuous use",
          description: "Electromagnetic palm pads for metallic climbing and gear anchoring.",
          stats: ["Attach up to 50kg to ferrous surfaces"],
          brp: "+30% Climb on metal surfaces."
        }
      ]
    },
    {
      key: "tools",
      title: "Tools & Utility Gear",
      items: [
        {
          name: "MAC Knife (Multi-Application Cutting Tool)",
          cost: "15c",
          weight: "0.3kg",
          power: "N/A",
          description: "Heavy-duty folding tool with ceramic blade, cutter, breaker, and pry attachments.",
          stats: ["Improvised damage: 1d4, AP 1"],
          brp: "Common requirement for Craft/Repair tasks in the field."
        },
        {
          name: "Entrenching Tool",
          cost: "12c",
          weight: "1.0kg",
          power: "N/A",
          description: "Folding shovel/pick combo for digging, rubble clearing, and breaching weak cover.",
          stats: ["Improvised damage: 1d6+db"],
          brp: "Supports fast fieldworks and emergency breaching."
        },
        {
          name: "Tool Kit (General)",
          cost: "60c",
          weight: "4.0kg",
          power: "N/A",
          description: "Comprehensive field repair kit for mechanical fixes.",
          stats: ["Assorted hand tools, fasteners, tapes, and adhesives"],
          brp: "Required for Craft (Mechanical)/Repair without penalty. Improvised tools: -30%."
        },
        {
          name: "Tool Kit (Electronics)",
          cost: "100c",
          weight: "2.0kg",
          power: "N/A",
          description: "Precision electronics tool set for diagnostics and component work.",
          stats: ["Includes multimeter, solder tools, testers, and parts"],
          brp: "Required for Electronics specialities without penalty."
        },
        {
          name: "Breaching Charge (Frame Charge)",
          cost: "80c per charge",
          weight: "1.5kg",
          power: "N/A",
          description: "Adhesive shaped charge with timer/remote detonation for entry operations.",
          stats: ["Blast: 6d6 in 3m radius", "Focused breach: 10d6 in 1m area"],
          brp: "Demolitions roll for placement. Standard doors/walls breach automatically."
        },
        {
          name: "Padlock (Heavy Duty)",
          cost: "8c",
          weight: "0.3kg",
          power: "N/A",
          description: "Hardened steel padlock resistant to cutting and routine bypass attempts.",
          stats: ["Locksmith at -20% to pick", "STR 25+ with tools to force"],
          brp: "Reliable low-cost field lock for temporary site security."
        },
        {
          name: "Duct Tape (Roll)",
          cost: "2c",
          weight: "0.2kg",
          power: "N/A",
          description: "High-strength adhesive tape, 50m roll.",
          stats: ["Improvised restraints: STR vs STR+10 to break"],
          brp: "Useful for temporary repairs, restraints, and improvised field solutions."
        },
        {
          name: "Cable Ties (Pack of 50)",
          cost: "5c",
          weight: "0.2kg",
          power: "N/A",
          description: "Heavy-duty non-metallic restraint ties.",
          stats: ["Break free: STR vs 15 (single attempt)"],
          brp: "Fast detainee handling and bundling utility."
        },
        {
          name: "Flares (Pack of 6)",
          cost: "10c",
          weight: "0.5kg",
          power: "N/A",
          description: "Weatherproof chemical flares for illumination, marking, and signalling.",
          stats: ["Burn time: 30 minutes", "Light radius: 50m"],
          brp: "Reliable light source and route marker in low-visibility operations."
        }
      ]
    },
    {
      key: "personal",
      title: "Personal Field Equipment",
      items: [
        {
          name: "Backpack (Operative Issue)",
          cost: "15c",
          weight: "0.5kg empty",
          power: "N/A",
          description: "Waterproof modular military pack.",
          stats: ["Capacity: 30kg"],
          brp: "Carries major load without extra encumbrance penalties up to capacity."
        },
        {
          name: "Webbing / Tactical Vest",
          cost: "25c",
          weight: "1.0kg empty",
          power: "N/A",
          description: "Load-bearing vest with utility pouches and mount points.",
          stats: ["Capacity: 10kg quick-access gear"],
          brp: "Reload actions take half time with properly arranged ammunition."
        },
        {
          name: "Sleeping Bag (Thermal)",
          cost: "20c",
          weight: "1.5kg",
          power: "N/A",
          description: "Insulated bag rated to -20C with waterproof shell.",
          stats: ["Cold-weather sustainment"],
          brp: "Prevents cold/wet rest penalties during field downtime."
        },
        {
          name: "Ration Pack (1 Week)",
          cost: "15c",
          weight: "3.0kg",
          power: "N/A",
          description: "High-calorie long shelf-life field food for one operative (7 days).",
          stats: ["Single-op weekly sustainment"],
          brp: "Prevents starvation. Morale impacts are GM discretion."
        },
        {
          name: "Water Purification Tablets (50)",
          cost: "5c",
          weight: "0.1kg",
          power: "N/A",
          description: "Chemical water purification tablets.",
          stats: ["1 tablet purifies 1 litre"],
          brp: "Prevents disease from dirty water; does not remove heavy toxins/radiological contamination."
        },
        {
          name: "Canteen (2 Litre)",
          cost: "3c",
          weight: "0.3kg empty / 2.3kg full",
          power: "N/A",
          description: "Durable water container with carry strap.",
          stats: ["2L volume"],
          brp: "Supports hydration: roughly 1 day normal use, half-day in extreme heat/exertion."
        }
      ]
    },
    {
      key: "specialist",
      title: "Specialist Equipment",
      items: [
        {
          name: "Ebb Damper",
          cost: "600c",
          weight: "0.8kg",
          power: "48hrs",
          description: "Localized Ebb suppression field generator.",
          stats: ["Radius: 5m", "Detectable by scanners at double range"],
          brp: "All Ebb rolls in radius at -30%, including the user's own Ebb rolls."
        },
        {
          name: "Power Cell (Standard)",
          cost: "10c",
          weight: "0.3kg",
          power: "24hrs typical load",
          description: "Rechargeable universal power cell.",
          stats: ["Hot-swappable in most field gear"],
          brp: "Baseline backup power source."
        },
        {
          name: "Power Cell (Extended)",
          cost: "25c",
          weight: "0.6kg",
          power: "72hrs typical load",
          description: "High-capacity universal power cell.",
          stats: ["Extended operation support"],
          brp: "Critical for long missions without resupply."
        },
        {
          name: "Recharge Station (Portable)",
          cost: "150c",
          weight: "2.0kg",
          power: "Mains or generator required",
          description: "Portable charging station for up to 4 cells at once.",
          stats: ["4 cells / 4 hours"],
          brp: "Field recharging hub when connected to stable power."
        },
        {
          name: "Portable Generator",
          cost: "300c",
          weight: "8.0kg",
          power: "48hrs on fuel",
          description: "Fuel-cell generator for charging and power distribution.",
          stats: ["Output: 2kW", "Hydrogen-1 fuel: 10c per 48hrs", "Audible to Listen +20% within 50m"],
          brp: "Mobile power backbone for remote operations."
        },
        {
          name: "Thermal Blanket (Emergency)",
          cost: "5c",
          weight: "0.2kg",
          power: "N/A",
          description: "Single-use reflective emergency blanket for heat retention.",
          stats: ["Weatherproof emergency shelter aid"],
          brp: "+20% Survival in cold exposure scenarios."
        },
        {
          name: "Chem-Light Sticks (Pack of 10)",
          cost: "5c",
          weight: "0.3kg",
          power: "N/A",
          description: "Snap-activated chemical light sticks in multiple colours.",
          stats: ["8-hour glow", "10m dim light radius", "No heat signature"],
          brp: "Silent route marking and low-profile signalling."
        },
        {
          name: "Mirror (Signal)",
          cost: "2c",
          weight: "0.1kg",
          power: "N/A",
          description: "Unbreakable signal mirror with sighting hole.",
          stats: ["Signal up to 10km in clear daylight with Survival roll"],
          brp: "Low-tech long-range signalling backup."
        },
        {
          name: "Compass (Magnetic)",
          cost: "5c",
          weight: "0.1kg",
          power: "N/A",
          description: "Liquid-filled compass for reliable bearing checks.",
          stats: ["Stable performance in Downtown sectors"],
          brp: "+10% Navigate in unfamiliar or low-visibility routes."
        }
      ]
    },
    {
      key: "lifestyle",
      title: "Lifestyle & Comfort Equipment",
      items: [
        {
          name: "Third Eye Viewer (Portable)",
          cost: "60c",
          weight: "0.4kg",
          power: "12hrs",
          description: "Handheld viewer for Third Eye and approved entertainment channels.",
          stats: ["Tracks media narrative exposure"],
          brp: "Can influence reputation and SCL perception."
        },
        {
          name: "Camera (Still/Video)",
          cost: "80c",
          weight: "0.6kg",
          power: "24hrs",
          description: "Weather-sealed camera with night mode and evidence-grade tagging.",
          stats: ["8hrs video or 5000 stills"],
          brp: "+10% Forensics when scenes are properly documented."
        },
        {
          name: "Audio Recorder",
          cost: "30c",
          weight: "0.2kg",
          power: "48hrs",
          description: "Covert recorder with long-form capture.",
          stats: ["24hrs recording capacity"],
          brp: "Conceal with Sleight of Hand; useful for intel evidence chains."
        },
        {
          name: "Holographic Projector (Personal)",
          cost: "120c",
          weight: "0.5kg",
          power: "12hrs",
          description: "Portable 3D projection for maps, briefs, and presentations.",
          stats: ["Projection up to 2m height"],
          brp: "+10% Tactics during planning sessions with active holo display."
        },
        {
          name: "Playing Cards / Entertainment Kit",
          cost: "5c",
          weight: "0.2kg",
          power: "N/A",
          description: "Compact downtime game set.",
          stats: ["Cards, dice, and micro game kit"],
          brp: "Supports morale and Gamble skill scenes."
        },
        {
          name: "Grooming Kit",
          cost: "8c",
          weight: "0.3kg",
          power: "N/A",
          description: "One-month hygiene and grooming supplies.",
          stats: ["Sponsor-facing appearance support"],
          brp: "Can matter for social/sponsor-facing checks at GM discretion."
        }
      ]
    },
    {
      key: "storage-maintenance",
      title: "Storage, Cybernetic, and Workshop Support",
      items: [
        {
          name: "Evidence Bags (Pack of 20)",
          cost: "5c",
          weight: "0.2kg",
          power: "N/A",
          description: "Tamper-resistant evidence storage bags.",
          stats: ["Multi-size chain-of-custody pack"],
          brp: "Required for full legal/corporate Forensics presentation quality."
        },
        {
          name: "Ammunition Box (Sealed)",
          cost: "8c",
          weight: "0.5kg empty",
          power: "N/A",
          description: "Weatherproof/shockproof ammo storage case.",
          stats: ["500 pistol rounds or 200 rifle rounds"],
          brp: "Prevents moisture and handling degradation."
        },
        {
          name: "Equipment Case (Ruggedised)",
          cost: "40c",
          weight: "2.0kg empty",
          power: "N/A",
          description: "Hard shell waterproof case for fragile equipment transport.",
          stats: ["Capacity: 20kg"],
          brp: "Protects scanners, med gear, and electronics from transport damage."
        },
        {
          name: "Cybernetic Maintenance Kit",
          cost: "200c",
          weight: "3.0kg",
          power: "N/A",
          description: "Field service kit for implant diagnostics, maintenance, and minor repairs.",
          stats: ["Includes tools, couplers, lubricants, and common replacement parts"],
          brp: "Required for Craft/Medicine (Cybernetics) without penalty; otherwise -40%."
        },
        {
          name: "Power Coupler (Cybernetic)",
          cost: "30c",
          weight: "0.2kg",
          power: "N/A",
          description: "Universal charging coupler for cybernetic power systems.",
          stats: ["Connects implants to standard field power sources"],
          brp: "Required for rapid recharge of internal cybernetic power cells."
        },
        {
          name: "Interface Cable (Cybernetic to Computer)",
          cost: "25c",
          weight: "0.1kg",
          power: "N/A",
          description: "Direct neural interface cable for high-speed data exchange.",
          stats: ["Direct system access support"],
          brp: "Direct interface can increase Electronics (Computer) task speed by x10."
        },
        {
          name: "Vehicle Repair Kit",
          cost: "150c",
          weight: "10kg",
          power: "N/A",
          description: "Field repair supplies and tools for emergency vehicle maintenance.",
          stats: ["Supports 5 major repairs or 20 minor fixes"],
          brp: "Required for vehicle Craft (Mechanical) without penalty."
        },
        {
          name: "Vehicle Toolkit (Advanced)",
          cost: "400c",
          weight: "20kg",
          power: "Requires external power",
          description: "Professional vehicle diagnostics, welding, and advanced repair suite.",
          stats: ["+20% Craft (Mechanical) on vehicle repairs/modifications"],
          brp: "Supports major field repairs and modification work."
        },
        {
          name: "Magna-Clamp (Vehicle Tracking)",
          cost: "80c",
          weight: "0.5kg",
          power: "168hrs",
          description: "Magnetic encrypted GPS vehicle tracking device.",
          stats: ["Tracking range: 50km", "Detectable by scanner at ~5m"],
          brp: "Attach via Sleight of Hand/Stealth for remote tracking."
        }
      ]
    },
    {
      key: "non-lethal",
      title: "Security & Defense (Non-Lethal)",
      items: [
        {
          name: "Flashbang Grenade",
          cost: "25c",
          weight: "0.3kg",
          power: "N/A",
          description: "Stun grenade with intense flash and sonic blast.",
          stats: ["3m radius", "CON roll or stunned 1d3 rounds and sensory disruption 1d6 rounds"],
          brp: "Breaching and crowd-control staple; minimal structural damage."
        },
        {
          name: "Smoke Grenade",
          cost: "15c",
          weight: "0.3kg",
          power: "N/A",
          description: "Dense smoke canister for LOS denial.",
          stats: ["10m cloud lasting 2d6 rounds"],
          brp: "Spot and ranged attacks through smoke at -50%; movement often halved."
        },
        {
          name: "Tear Gas Grenade",
          cost: "20c",
          weight: "0.3kg",
          power: "N/A",
          description: "Chemical irritant dispersal for riot and area denial control.",
          stats: ["5m cloud lasting 2d6 rounds", "CON roll or 1d4 damage and -30% actions while exposed"],
          brp: "Most SLA teams use filtration but unprotected targets are heavily impaired."
        },
        {
          name: "Restraint Cuffs (Heavy Duty)",
          cost: "15c",
          weight: "0.4kg",
          power: "N/A",
          description: "Hardened cuffs with biometric lock.",
          stats: ["STR vs 20 to break free (single attempt; failure causes 1d3 damage)", "Electronics (Security) at -30% to bypass lock"],
          brp: "Reliable detainee control tool for live-capture objectives."
        }
      ]
    }
  ];

  static EQUIPMENT_STARTING_PACKAGES = [
    {
      name: "Budget Operative (200c target)",
      items: [
        "Headset Communicator (20c)",
        "UV Torch (15c)",
        "MAC Knife (15c)",
        "BOOPA Medical Kit Standard (50c)",
        "Backpack (15c)",
        "Webbing (25c)",
        "Ration Pack 1 Week (15c)",
        "Canteen (3c)",
        "Tool Kit General (60c)"
      ],
      total: "218c",
      note: "Slightly over budget; remove one utility item or negotiate issue discount."
    },
    {
      name: "Standard Operative (500c target)",
      items: [
        "Klippo Communicator (150c)",
        "Operative Organiser (100c)",
        "Environment Scanner Standard (300c)",
        "UV Torch (15c)",
        "BOOPA Medical Kit Standard (50c)",
        "Backpack (15c)",
        "Webbing (25c)",
        "Grapple Gun (120c)",
        "Lockpick Set (50c)",
        "Tool Kit General (60c)"
      ],
      total: "885c",
      note: "Role-focused set; choose priorities for budget compliance."
    },
    {
      name: "Investigator (800c target)",
      items: [
        "BOOPA Audio (250c)",
        "Operative Organiser (100c)",
        "Environment Scanner Advanced (800c)",
        "Forensic Kit (180c)",
        "Camera (80c)",
        "Tactical Binoculars (200c)",
        "Electronic Lockpick (300c)",
        "BOOPA Medical Kit Standard (50c)"
      ],
      total: "1960c",
      note: "High-end investigation loadout; best for SCL-supported specialist teams."
    },
    {
      name: "Combat Operative (600c target)",
      items: [
        "BOOPA Audio (250c)",
        "Motion Tracker (450c)",
        "Grapple Gun (120c)",
        "BOOPA Medical Kit Advanced (250c)",
        "Webbing (25c)",
        "Breaching Charges x2 (160c)",
        "Flashbang Grenades x4 (100c)",
        "Tactical Binoculars (200c)"
      ],
      total: "1555c",
      note: "High-cost tactical package with breaching and close-action capability."
    }
  ];

  static _isGM() {
    return Boolean(game.user?.isGM);
  }

  static _escapeHtml(value = "") {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  static _journalHtml(content = "") {
    const htmlFormat = CONST?.JOURNAL_ENTRY_PAGE_FORMATS?.HTML ?? 1;
    return { format: htmlFormat, content };
  }

  static _allColours() {
    return [...this.MAIN_COLOURS, ...this.OPTIONAL_COLOURS];
  }

  static _colourByKey(key = "blue") {
    const normalized = String(key ?? "").trim().toLowerCase();
    return this._allColours().find((colour) => colour.key === normalized) ?? this.MAIN_COLOURS[0];
  }

  static _allColourMissionIdeas() {
    return Object.entries(this.COLOUR_MISSION_IDEAS).flatMap(([key, ideas]) => {
      const colour = this._colourByKey(key);
      return ideas.map((idea) => ({
        key,
        label: colour.label,
        value: idea
      }));
    });
  }

  static _rollDie(sides = 10) {
    return Math.max(1, Math.floor(Math.random() * Math.max(1, Number(sides))) + 1);
  }

  static _rollColourFromTable() {
    const roll = this._rollDie(20);
    const result = this.COLOR_ROLL_TABLE.find((entry) => roll >= entry.min && roll <= entry.max) ?? this.COLOR_ROLL_TABLE[0];
    return { roll, colour: this._colourByKey(result.key) };
  }

  static _rollFromArray(values = []) {
    if (!Array.isArray(values) || !values.length) return { roll: 1, value: "" };
    const roll = this._rollDie(values.length);
    return { roll, value: values[roll - 1] };
  }

  static _rollColourMissionIdea(colourKey = "blue") {
    const ideas = this.COLOUR_MISSION_IDEAS[String(colourKey ?? "").toLowerCase()] ?? [];
    if (ideas.length) return this._rollFromArray(ideas);
    return this._rollFromArray(this._allColourMissionIdeas().map((entry) => entry.value));
  }

  static _resolveSelection(value, rolledValue = "") {
    const chosen = String(value ?? "").trim();
    if (chosen && chosen !== "__RANDOM__") return chosen;
    return String(rolledValue ?? "");
  }

  static _wrapBpnDocument({ title = "", kicker = "SLA INDUSTRIES", body = "", gm = false } = {}) {
    const cls = gm ? "sla-bpn-dossier is-gm" : "sla-bpn-dossier";
    return `
      <article class="${cls}">
        <header class="sla-bpn-head">
          <div class="sla-bpn-kicker">${this._escapeHtml(kicker)}</div>
          ${title ? `<h1>${this._escapeHtml(title)}</h1>` : ""}
        </header>
        <div class="sla-bpn-body">${body}</div>
      </article>
    `;
  }

  static _mdInline(raw = "") {
    let text = this._escapeHtml(raw ?? "");
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    return text;
  }

  static _markdownBlockToHtml(markdown = "") {
    const lines = String(markdown ?? "").replace(/\r/g, "").split("\n");
    const html = [];
    let inUl = false;
    let inOl = false;
    let inCode = false;
    let codeLines = [];

    const closeLists = () => {
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
    };

    const closeCode = () => {
      if (!inCode) return;
      html.push(`<pre>${this._escapeHtml(codeLines.join("\n"))}</pre>`);
      inCode = false;
      codeLines = [];
    };

    for (const line of lines) {
      const raw = String(line ?? "");
      const trimmed = raw.trim();

      if (trimmed.startsWith("```")) {
        if (inCode) {
          closeCode();
        } else {
          closeLists();
          inCode = true;
          codeLines = [];
        }
        continue;
      }

      if (inCode) {
        codeLines.push(raw);
        continue;
      }

      if (!trimmed) {
        closeLists();
        continue;
      }

      if (/^###\s+/.test(trimmed)) {
        closeLists();
        html.push(`<h3>${this._mdInline(trimmed.replace(/^###\s+/, ""))}</h3>`);
        continue;
      }

      if (/^####\s+/.test(trimmed)) {
        closeLists();
        html.push(`<h4>${this._mdInline(trimmed.replace(/^####\s+/, ""))}</h4>`);
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        if (!inUl) {
          closeLists();
          html.push("<ul>");
          inUl = true;
        }
        html.push(`<li>${this._mdInline(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        if (!inOl) {
          closeLists();
          html.push("<ol>");
          inOl = true;
        }
        html.push(`<li>${this._mdInline(trimmed.replace(/^\d+\.\s+/, ""))}</li>`);
        continue;
      }

      if (/^\|.*\|$/.test(trimmed)) {
        closeLists();
        html.push(`<pre>${this._escapeHtml(trimmed)}</pre>`);
        continue;
      }

      closeLists();
      html.push(`<p>${this._mdInline(trimmed)}</p>`);
    }

    closeLists();
    closeCode();
    return html.join("");
  }

  static getRulebookFallbackMarkdown() {
    return [
      "# SLA Industries BRP Rulebook",
      "",
      "## Start Here",
      "If the full foundation file cannot be loaded, this fallback provides the essential rules.",
      "",
      "## Core Resolution",
      "Roll under target on d100. Lower is better.",
      "",
      "## Edge",
      "- Advantage: roll 1D100, reroll tens, keep best",
      "- Normal: 1D100",
      "- Disadvantage: roll 1D100, reroll tens, keep worst",
      "",
      "## Core Checks",
      "Apply tactical modifiers and resolve Critical, Special, Success, Failure, or Fumble.",
      "",
      "## SAN and COOL",
      "Mental checks use the same edge system and final target logic.",
      "",
      "## Combat",
      "Resolve combat checks through the same roll pipeline, then apply combat effects."
    ].join("\\n");
  }

  static _buildSectionedPagesFromMarkdown(markdown = "", {
    introPageName = "00 - Start Here",
    introTitleFallback = "Start Here",
    sectionNamePrefix = "",
    sectionTitleFallback = "Section",
    kicker = "SLA INDUSTRIES // DOSSIER"
  } = {}) {
    const normalized = String(markdown ?? "").replace(/\r/g, "").trim();
    if (!normalized) return [];

    const chunks = normalized.split(/\n##\s+/);
    const pages = [];

    const intro = chunks.shift() ?? "";
    const introLines = intro.split("\n");
    let introTitle = String(introTitleFallback || "Start Here");
    if (/^#\s+/.test(String(introLines[0] ?? "").trim())) {
      introTitle = String(introLines.shift() ?? "").trim().replace(/^#\s+/, "").trim();
    }
    const introBody = introLines.join("\n").trim();
    pages.push({
      name: introPageName,
      type: "text",
      text: this._journalHtml(this._wrapBpnDocument({
        title: introTitle || introTitleFallback,
        kicker,
        body: this._markdownBlockToHtml(introBody)
      }))
    });

    for (let i = 0; i < chunks.length; i += 1) {
      const section = chunks[i];
      const lines = section.split("\n");
      const heading = String(lines.shift() ?? `${sectionTitleFallback} ${i + 1}`).trim();
      const body = lines.join("\n").trim();
      const cleanHeading = heading || `${sectionTitleFallback} ${i + 1}`;
      const prefix = sectionNamePrefix ? `${sectionNamePrefix} ` : "";
      pages.push({
        name: `${String(i + 1).padStart(2, "0")} - ${prefix}${cleanHeading}`.trim(),
        type: "text",
        text: this._journalHtml(this._wrapBpnDocument({
          title: cleanHeading,
          kicker,
          body: this._markdownBlockToHtml(body)
        }))
      });
    }

    return pages;
  }

  static _buildRulebookPagesFromMarkdown(markdown = "") {
    return this._buildSectionedPagesFromMarkdown(markdown, {
      introPageName: "00 - Start Here",
      introTitleFallback: "SLA Rulebook",
      sectionTitleFallback: "Rulebook Section",
      kicker: "SLA INDUSTRIES // RULEBOOK"
    });
  }

  static _buildVehicleChasePagesFromMarkdown(markdown = "") {
    return this._buildSectionedPagesFromMarkdown(markdown, {
      introPageName: "00 - Start Here",
      introTitleFallback: "Vehicles & Chases",
      sectionTitleFallback: "Vehicles & Chases Section",
      kicker: "SLA INDUSTRIES // VEHICLES & CHASES"
    });
  }

  static _buildNpcAdversaryPagesFromMarkdown(markdown = "") {
    return this._buildSectionedPagesFromMarkdown(markdown, {
      introPageName: "00 - Start Here",
      introTitleFallback: "NPCs & Adversaries",
      sectionTitleFallback: "NPCs & Adversaries Section",
      kicker: "SLA INDUSTRIES // NPC DOSSIER"
    });
  }

  static async _loadRulebookMarkdown() {
    try {
      const response = await fetch(this.RULEBOOK_SOURCE_PATH, { cache: "no-store" });
      if (response?.ok) {
        const text = await response.text();
        if (String(text ?? "").trim()) return text;
      }
    } catch (err) {
      console.warn("sla-industries-brp | Unable to load SLA rulebook markdown source", err);
    }
    return this.getRulebookFallbackMarkdown();
  }

  static getVehicleChaseFallbackMarkdown() {
    return [
      "# Vehicles & Chases (BRP – SLA Industries)",
      "",
      "## Start Here",
      "If the full vehicles/chases chapter cannot be loaded, use this fallback quick reference.",
      "",
      "## Vehicle Core",
      "Track Handling, Armour, Hull, Speed Bands, Size, and Traits.",
      "",
      "## Chase Loop",
      "Set range band, choose approach, roll opposed Chase Tests with Edge, then shift one band.",
      "",
      "## Range Bands",
      "- Engaged",
      "- Close",
      "- Far",
      "- Lost",
      "",
      "## Collision Severity",
      "- Low (Crawl): 1d6",
      "- Medium (Street): 2d6-3d6",
      "- High (Highway): 4d6-6d6",
      "- Extreme (Pursuit): 8d6+",
      "",
      "## On-Foot Chases",
      "Use the same range band model with Mobility/Athletics/Stealth/Survival tests."
    ].join("\\n");
  }

  static async _loadVehicleChaseMarkdown() {
    try {
      const response = await fetch(this.VEHICLE_CHASE_SOURCE_PATH, { cache: "no-store" });
      if (response?.ok) {
        const text = await response.text();
        if (String(text ?? "").trim()) return text;
      }
    } catch (err) {
      console.warn("sla-industries-brp | Unable to load SLA vehicles/chases markdown source", err);
    }
    return this.getVehicleChaseFallbackMarkdown();
  }

  static getNpcAdversaryFallbackMarkdown() {
    return [
      "# NPCs & Adversaries (BRP – SLA Industries)",
      "",
      "## Start Here",
      "If the full NPC/adversary chapter cannot be loaded, use this fallback quick guide.",
      "",
      "## Tier Bands",
      "- Tier 1: Extras",
      "- Tier 2: Standard Opposition",
      "- Tier 3: Elite Operatives",
      "- Tier 4: Horrors/Set Pieces",
      "",
      "## Fast Build Block",
      "Name, Tier, STR/CON/DEX/INT/POW/CHA/SIZ, HP, key skills, attacks, armour, traits, gear, BPN hooks.",
      "",
      "## BPN Mapping",
      "Blue: gangers/carrien; White: investigators/killers; Red: cells/riot threats; Black/Platinum: elite or unique threats."
    ].join("\\n");
  }

  static async _loadNpcAdversaryMarkdown() {
    try {
      const response = await fetch(this.NPC_ADVERSARY_SOURCE_PATH, { cache: "no-store" });
      if (response?.ok) {
        const text = await response.text();
        if (String(text ?? "").trim()) return text;
      }
    } catch (err) {
      console.warn("sla-industries-brp | Unable to load SLA NPC/adversary markdown source", err);
    }
    return this.getNpcAdversaryFallbackMarkdown();
  }

  static getNonCombatIssuesFallbackMarkdown() {
    return [
      "# SLA Operative Group Non-Combat Issue Generator",
      "",
      "1. Communications blackout in assigned sector.",
      "2. Conflicting mission directives from two supervisors.",
      "3. Civilian protest blocking primary access route.",
      "4. Data corruption in mission brief files.",
      "5. Corporate audit team arrival mid-operation.",
      "6. Lost access credentials.",
      "7. Conflicting jurisdiction with local authorities.",
      "8. Hostile but non-violent civilian crowd.",
      "9. Surveillance drones offline unexpectedly.",
      "10. Regulatory warning tied to active operation permits."
    ].join("\\n");
  }

  static async _loadNonCombatIssuesMarkdown() {
    try {
      const response = await fetch(this.NON_COMBAT_ISSUES_SOURCE_PATH, { cache: "no-store" });
      if (response?.ok) {
        const text = await response.text();
        if (String(text ?? "").trim()) return text;
      }
    } catch (err) {
      console.warn("sla-industries-brp | Unable to load non-combat issue markdown source", err);
    }
    return this.getNonCombatIssuesFallbackMarkdown();
  }

  static _extractNumberedListEntries(markdown = "") {
    const entries = [];
    const lines = String(markdown ?? "").split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*\d+\.\s+(.*\S)\s*$/);
      if (!match) continue;
      entries.push(String(match[1] ?? "").trim());
    }
    return entries;
  }

  static async _getNonCombatIssuePool() {
    if (Array.isArray(this._NON_COMBAT_ISSUES_CACHE) && this._NON_COMBAT_ISSUES_CACHE.length) {
      return this._NON_COMBAT_ISSUES_CACHE;
    }
    const markdown = await this._loadNonCombatIssuesMarkdown();
    const parsed = this._extractNumberedListEntries(markdown)
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean);
    this._NON_COMBAT_ISSUES_CACHE = parsed.length
      ? parsed
      : [
        "Communications blackout in assigned sector.",
        "Conflicting mission directives from two supervisors.",
        "Civilian protest blocking primary access route."
      ];
    return this._NON_COMBAT_ISSUES_CACHE;
  }

  static _equipmentItemCard(item = {}) {
    const details = (item.stats ?? [])
      .map((row) => `<li>${this._escapeHtml(row)}</li>`)
      .join("");
    return `
      <article class="sla-gear-card">
        <h3>${this._escapeHtml(item.name ?? "Equipment")}</h3>
        <p class="sla-gear-meta">
          <span><strong>Cost:</strong> ${this._escapeHtml(item.cost ?? "-")}</span>
          <span><strong>Weight:</strong> ${this._escapeHtml(item.weight ?? "-")}</span>
          <span><strong>Power:</strong> ${this._escapeHtml(item.power ?? "N/A")}</span>
        </p>
        <p>${this._escapeHtml(item.description ?? "")}</p>
        ${details ? `<ul>${details}</ul>` : ""}
        ${item.brp ? `<p><strong>BRP Notes:</strong> ${this._escapeHtml(item.brp)}</p>` : ""}
      </article>
    `;
  }

  static _equipmentCategoryPageHtml(category = {}) {
    const cards = (category.items ?? []).map((item) => this._equipmentItemCard(item)).join("");
    return this._wrapBpnDocument({
      title: category.title ?? "Equipment",
      kicker: "SLA INDUSTRIES // GENERAL EQUIPMENT CATALOGUE",
      body: `<section class="sla-bpn-section sla-gear-grid">${cards}</section>`
    });
  }

  static getEquipmentOverviewPageHtml() {
    return this._wrapBpnDocument({
      title: "General Equipment Overview",
      kicker: "SLA INDUSTRIES // BRP EQUIPMENT SECTION",
      body: `
        <section class="sla-bpn-section">
          <p>This catalogue covers non-weapon, non-armour, non-drug equipment for SLA operatives.</p>
          <p>Prices are listed in credits and weight in kilograms. BRP notes are provided for direct table use.</p>
          <h2>Encumbrance</h2>
          <ul>
            <li>Light Load (up to STR kg): no penalty.</li>
            <li>Medium Load (STR to STRx2 kg): -10% physical skills, half movement.</li>
            <li>Heavy Load (STRx2 to STRx3 kg): -30% physical skills, quarter movement.</li>
            <li>Overloaded (above STRx3 kg): cannot move.</li>
          </ul>
          <h2>Equipment Condition</h2>
          <ul>
            <li>New: full functionality.</li>
            <li>Used: normal function, cosmetic wear.</li>
            <li>Worn: -10% equipment-based rolls, 10% failure chance.</li>
            <li>Damaged: -30% equipment-based rolls, 30% failure chance.</li>
            <li>Broken: non-functional until repaired.</li>
          </ul>
          <h2>Power & Battery Rules</h2>
          <ul>
            <li>Most devices use standard/extended universal power cells.</li>
            <li>Cold environments below -10C halve battery life.</li>
            <li>EMP hit: item rolls HP vs 2d6 or loses all stored power.</li>
          </ul>
        </section>
      `
    });
  }

  static getEquipmentLoadoutsPageHtml() {
    const packageCards = this.EQUIPMENT_STARTING_PACKAGES.map((pack) => `
      <article class="sla-gear-card">
        <h3>${this._escapeHtml(pack.name)}</h3>
        <ul>${(pack.items ?? []).map((entry) => `<li>${this._escapeHtml(entry)}</li>`).join("")}</ul>
        <p><strong>Total:</strong> ${this._escapeHtml(pack.total ?? "-")}</p>
        <p><strong>Note:</strong> ${this._escapeHtml(pack.note ?? "")}</p>
      </article>
    `).join("");

    return this._wrapBpnDocument({
      title: "Starting Equipment Packages",
      kicker: "SLA INDUSTRIES // LOADOUT PACKAGES",
      body: `<section class="sla-bpn-section sla-gear-grid">${packageCards}</section>`
    });
  }

  static getEquipmentAvailabilityPageHtml() {
    return this._wrapBpnDocument({
      title: "Availability, SCL Access, and Maintenance",
      kicker: "SLA INDUSTRIES // SUPPLY CONTROL",
      body: `
        <section class="sla-bpn-section">
          <h2>Availability by SCL</h2>
          <ul>
            <li>SCL 10-9: basic kit access. Restrictions on advanced scanners, Ebb dampers, and breaching charges.</li>
            <li>SCL 8-6: broad unrestricted access, typical 10% supplier discount.</li>
            <li>SCL 5-3: full access, typical 20% discount, priority model allocation.</li>
            <li>SCL 2-1: near-unlimited access, custom commission options, occasional company-expensed issue.</li>
          </ul>
          <h2>Maintenance Costs</h2>
          <ul>
            <li>Monthly upkeep: 5% of total equipment value.</li>
            <li>Neglect 1 month: -10% equipment-based rolls.</li>
            <li>Neglect 2 months: -20% equipment-based rolls, 10% failure chance.</li>
            <li>Neglect 3+ months: -40% equipment-based rolls, 30% failure chance.</li>
            <li>Minor repairs: 20% of original cost. Major repairs: 50% of original cost.</li>
          </ul>
          <h2>Foundry Usage</h2>
          <ul>
            <li>Create or update an item compendium named <strong>SLA General Equipment</strong>.</li>
            <li>Track cost, weight, power, and BRP effects in item data or notes.</li>
            <li>Use rollable shop stock tables by district (Downtown/Uptown/Cannibal).</li>
            <li>Track power cell swaps and condition degradation as ongoing resource pressure.</li>
          </ul>
        </section>
      `
    });
  }

  static _equipmentSlug(value = "") {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  static _firstNumber(value = "") {
    const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  static _parseCredits(costText = "") {
    const value = this._firstNumber(costText);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  static _parseWeightKg(weightText = "") {
    const value = this._firstNumber(weightText);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  static _parsePowerUnits(powerText = "") {
    const raw = String(powerText ?? "").toLowerCase();
    if (!raw || raw.includes("n/a") || raw.includes("passive")) return 0;
    const value = this._firstNumber(raw);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  static _equipmentDescriptionHtml(item, categoryTitle = "") {
    const statsHtml = (item.stats ?? [])
      .map((row) => `<li>${this._escapeHtml(row)}</li>`)
      .join("");
    return `
      <article class="sla-bpn-dossier">
        <header class="sla-bpn-head">
          <div class="sla-bpn-kicker">SLA INDUSTRIES // GENERAL EQUIPMENT</div>
          <h1>${this._escapeHtml(item.name ?? "Equipment")}</h1>
        </header>
        <div class="sla-bpn-body">
          <section class="sla-bpn-section">
            <p><strong>Category:</strong> ${this._escapeHtml(categoryTitle)}</p>
            <p><strong>Cost:</strong> ${this._escapeHtml(item.cost ?? "-")}</p>
            <p><strong>Weight:</strong> ${this._escapeHtml(item.weight ?? "-")}</p>
            <p><strong>Power:</strong> ${this._escapeHtml(item.power ?? "N/A")}</p>
            <p>${this._escapeHtml(item.description ?? "")}</p>
            ${statsHtml ? `<ul>${statsHtml}</ul>` : ""}
            ${item.brp ? `<p><strong>BRP Notes:</strong> ${this._escapeHtml(item.brp)}</p>` : ""}
          </section>
        </div>
      </article>
    `;
  }

  static _flattenEquipmentSeedRows() {
    return this.EQUIPMENT_CATEGORIES.flatMap((category) => {
      return (category.items ?? []).map((item) => ({
        categoryKey: category.key,
        categoryTitle: category.title,
        ...item
      }));
    });
  }

  static _buildEquipmentItemData(row, folderId) {
    const cost = this._parseCredits(row.cost);
    const weight = this._parseWeightKg(row.weight);
    const power = this._parsePowerUnits(row.power);
    const slug = this._equipmentSlug(`${row.categoryKey}-${row.name}`);
    const brpid = `i.gear.sla-equipment-${slug}`;
    return {
      name: String(row.name ?? "Equipment").trim(),
      type: "gear",
      folder: folderId,
      system: {
        quantity: 1,
        enc: Number(weight),
        crdEach: Number(cost),
        crdTotal: Number(cost),
        price: "average",
        equipStatus: "carried",
        pSCurr: Number(power),
        pSMax: Number(power),
        ammoCalibre: "",
        description: this._equipmentDescriptionHtml(row, row.categoryTitle)
      },
      flags: {
        [game.system.id]: {
          brpidFlag: {
            id: brpid,
            lang: game.i18n.lang,
            priority: 0
          },
          slaEquipment: {
            isGeneralEquipment: true,
            categoryKey: row.categoryKey,
            category: row.categoryTitle,
            source: "SLA_GENERAL_EQUIPMENT_CATALOGUE",
            costText: row.cost ?? "",
            weightText: row.weight ?? "",
            powerText: row.power ?? ""
          }
        },
        brp: {
          brpidFlag: {
            id: brpid,
            lang: game.i18n.lang,
            priority: 0
          }
        }
      }
    };
  }

  static async _ensureEquipmentFolders(rootName = "SLA General Equipment") {
    let root = game.folders.find((f) => f.type === "Item" && f.name === rootName && !f.folder);
    if (!root) {
      root = await Folder.create({
        name: rootName,
        type: "Item",
        color: "#1f6681"
      });
    }

    const categoryFolders = new Map();
    for (const category of this.EQUIPMENT_CATEGORIES) {
      let folder = game.folders.find((f) => f.type === "Item" && f.name === category.title && f.folder?.id === root.id);
      if (!folder) {
        folder = await Folder.create({
          name: category.title,
          type: "Item",
          folder: root.id,
          color: "#29536f"
        });
      }
      categoryFolders.set(category.key, folder);
    }
    return { root, categoryFolders };
  }

  static async seedWorldGeneralEquipment({ overwrite = false, folderName = "SLA General Equipment", notify = true } = {}) {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can seed equipment items.");
      return { ok: false, reason: "not-gm" };
    }

    const { root, categoryFolders } = await this._ensureEquipmentFolders(folderName);
    const rows = this._flattenEquipmentSeedRows();
    const byBrpid = new Map();
    const byName = new Map();
    for (const item of game.items ?? []) {
      if (item.type !== "gear") continue;
      const brpid = item.flags?.[game.system.id]?.brpidFlag?.id ?? item.flags?.brp?.brpidFlag?.id;
      if (brpid) byBrpid.set(String(brpid), item);
      const key = this._equipmentSlug(item.name ?? "");
      if (key && !byName.has(key)) byName.set(key, item);
    }

    const creates = [];
    const updates = [];
    for (const row of rows) {
      const folder = categoryFolders.get(row.categoryKey) ?? root;
      const payload = this._buildEquipmentItemData(row, folder?.id ?? null);
      const brpid = payload.flags?.[game.system.id]?.brpidFlag?.id;
      const existing = byBrpid.get(String(brpid)) ?? byName.get(this._equipmentSlug(payload.name));
      if (!existing) {
        creates.push(payload);
        continue;
      }
      if (!overwrite && byBrpid.get(String(brpid))) continue;
      updates.push({
        _id: existing.id,
        folder: folder?.id ?? existing.folder?.id ?? null,
        name: payload.name,
        "system.quantity": payload.system.quantity,
        "system.enc": payload.system.enc,
        "system.crdEach": payload.system.crdEach,
        "system.crdTotal": payload.system.crdTotal,
        "system.price": payload.system.price,
        "system.equipStatus": payload.system.equipStatus,
        "system.pSCurr": payload.system.pSCurr,
        "system.pSMax": payload.system.pSMax,
        "system.description": payload.system.description,
        [`flags.${game.system.id}.slaEquipment`]: payload.flags?.[game.system.id]?.slaEquipment ?? null,
        [`flags.${game.system.id}.brpidFlag`]: payload.flags?.[game.system.id]?.brpidFlag ?? null,
        "flags.brp.brpidFlag": payload.flags?.brp?.brpidFlag ?? null
      });
    }

    if (creates.length) {
      await Item.createDocuments(creates);
    }
    if (updates.length) {
      await Item.updateDocuments(updates);
    }

    const iconSync = await this.syncGeneralEquipmentIcons({
      includeActors: false,
      includeCompendium: false,
      folderName,
      notify: false
    });

    if (notify) {
      ui.notifications.info(
        `SLA general equipment seeded: +${creates.length} created${overwrite ? `, ${updates.length} updated` : ""}, ${Number(iconSync?.worldUpdated ?? 0)} icon(s) synced.`
      );
      if ((iconSync?.unmatched ?? []).length > 0) {
        console.warn("sla-industries-brp | Unmatched SLA general equipment icons", iconSync.unmatched);
      }
    }
    return {
      ok: true,
      rootFolder: root,
      created: creates.length,
      updated: updates.length,
      totalRows: rows.length,
      iconSync
    };
  }

  static _normalizeGearIconKey(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  static _gearIconAliasCandidates(name = "") {
    const key = this._normalizeGearIconKey(name);
    const aliases = {
      headsetcommunicator: ["Headset Comms"],
      klippomultibandcommunicator: ["Klippo MultiBand Comm"],
      vidphoneportable: ["Vid Phone Portable"],
      operativeorganiser: ["pprative organiser", "Operative Organiser"],
      boopaaudio: ["Boopa Audio"],
      environmentscanneradvanced: ["Environment Scanner"],
      uvmultispectrumtorch: ["UV Multi Spectrum Torch"],
      binocularsstandard: ["Standard Binoculars"],
      binocularstactical: ["binoculars Tacktical"],
      electroniclockpickbypasskit: ["Electric Lockpick"],
      boopamedicalkitadvanced: ["Boopa Medi Kit Advanced"],
      boopamedicalkitstandard: ["Boopa Medi Kit Advanced"],
      medikitdisposableemergency: ["Medikit Disposable"],
      drughyposprayempty: ["Klippo Spray Hypo"],
      climbingharnessgear: ["Climbing Harness"],
      breachingchargeframecharge: ["Breaching Frame Charge"],
      ducttaperoll: ["Duct Tape Roll"],
      cabletiespackof50: ["Cable Ties"],
      flarespackof6: ["Flares Pack of 6"],
      backpackoperativeissue: ["Backpack"],
      webbingtacticalvest: ["Webbing Tacktical Vest"],
      sleepingbagthermal: ["Sleeping Bag"],
      rationpack1week: ["MRE"],
      waterpurificationtablets50: ["Water Purify Tablets"],
      canteen2litre: ["Csnteen"],
      powercellstandard: ["Power SCell Standard"],
      rechargestationportable: ["Recharge Station Portable"],
      portablegenerator: ["Portable Genorator"],
      thermalblanketemergency: ["Thermal Blanket"],
      chemlightstickspackof10: ["Chem Light Sticks"],
      mirrorsignal: ["Mirros Signal"],
      compassmagnetic: ["Compass Magnetic"],
      thirdeyeviewerportable: ["Vid Phone Portable"],
      camerastillvideo: ["camera Still video"],
      audiorecorder: ["Audio recorder"],
      holographicprojectorpersonal: ["Holo Projector"],
      playingcardsentertainmentkit: ["Playng Cards"],
      evidencebagspackof20: ["Evidence Bags"],
      ammunitionboxsealed: ["Ammo Box Sealed"],
      equipmentcaseruggedised: ["Equipment Case Rugged"],
      interfacecablecybernetictocomputer: ["Interface Cabler"],
      magnaclampvehicletracking: ["Motion Tracker"]
    };
    return aliases[key] ?? [];
  }

  static _gearIconCandidates(name = "") {
    const clean = String(name ?? "").trim();
    if (!clean) return [];
    const candidates = [
      clean,
      clean.replace(/[()]/g, " "),
      clean.replace(/\(([^)]+)\)/g, " $1 "),
      clean.replace(/[\/:]/g, " "),
      clean.replace(/&/g, "and"),
      clean.replace(/\s+/g, " ").trim()
    ];
    const noParens = clean.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (noParens) candidates.push(noParens);
    candidates.push(...this._gearIconAliasCandidates(clean));

    const unique = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const norm = this._normalizeGearIconKey(candidate);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      unique.push(candidate);
    }
    return unique;
  }

  static async _browseDataFilesRecursive(rootPath = this.GEAR_ICON_PATH) {
    const queue = [rootPath];
    const seen = new Set();
    const files = [];

    while (queue.length) {
      const path = String(queue.shift() ?? "").trim();
      if (!path || seen.has(path)) continue;
      seen.add(path);
      try {
        const listing = await this._browseData(path);
        for (const file of listing?.files ?? []) {
          files.push(decodeURIComponent(String(file ?? "")));
        }
        for (const dir of listing?.dirs ?? []) {
          const next = decodeURIComponent(String(dir ?? ""));
          if (next && !seen.has(next)) queue.push(next);
        }
      } catch (err) {
        console.warn(`sla-industries-brp | Failed browsing gear icon path: ${path}`, err);
      }
    }
    return files;
  }

  static async _ensureGearIconMap() {
    if (this._GEAR_ICON_MAP) return this._GEAR_ICON_MAP;
    const map = new Map();
    const files = await this._browseDataFilesRecursive(this.GEAR_ICON_PATH);
    for (const file of files) {
      const base = String(file).split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
      const key = this._normalizeGearIconKey(base);
      if (!key || map.has(key)) continue;
      map.set(key, file);
    }
    this._GEAR_ICON_MAP = map;
    return map;
  }

  static async _getGearIconPath(name = "") {
    const map = await this._ensureGearIconMap();
    if (!map.size) return null;

    const candidates = this._gearIconCandidates(name);
    for (const candidate of candidates) {
      const key = this._normalizeGearIconKey(candidate);
      if (map.has(key)) return map.get(key);
    }

    const needle = this._normalizeGearIconKey(name);
    if (!needle) return null;
    for (const [key, path] of map.entries()) {
      if (key.includes(needle) || needle.includes(key)) return path;
    }
    return null;
  }

  static _isGeneralEquipmentBrpid(brpid = "") {
    return String(brpid ?? "").toLowerCase().startsWith("i.gear.sla-equipment-");
  }

  static _itemInFolderTree(item, rootFolderId = "") {
    if (!item || !rootFolderId) return false;
    let folderId = item.folder?.id ?? null;
    const visited = new Set();
    while (folderId && !visited.has(folderId)) {
      if (folderId === rootFolderId) return true;
      visited.add(folderId);
      const folder = game.folders?.get(folderId);
      folderId = folder?.folder?.id ?? null;
    }
    return false;
  }

  static _isGeneralEquipmentItem(item, rootFolderId = "") {
    if (!item || item.type !== "gear") return false;
    const brpid = item.flags?.[game.system.id]?.brpidFlag?.id ?? item.flags?.brp?.brpidFlag?.id ?? "";
    if (this._isGeneralEquipmentBrpid(brpid)) return true;
    if (item.flags?.[game.system.id]?.slaEquipment?.isGeneralEquipment) return true;
    if (rootFolderId && this._itemInFolderTree(item, rootFolderId)) return true;
    return false;
  }

  static async syncGeneralEquipmentIcons({
    includeActors = true,
    includeCompendium = true,
    folderName = "SLA General Equipment",
    notify = false
  } = {}) {
    if (!this._isGM()) {
      return { worldUpdated: 0, actorUpdated: 0, compendiumUpdated: 0, unmatched: [], packs: [] };
    }

    const root = game.folders.find((f) => f.type === "Item" && f.name === folderName && !f.folder);
    const rootId = root?.id ?? "";
    const unmatched = new Set();

    let worldUpdated = 0;
    const worldUpdates = [];
    for (const item of game.items ?? []) {
      if (!this._isGeneralEquipmentItem(item, rootId)) continue;
      const iconPath = await this._getGearIconPath(item.name);
      if (!iconPath) {
        unmatched.add(String(item.name ?? "").trim());
        continue;
      }
      if (item.img === iconPath) continue;
      worldUpdates.push({ _id: item.id, img: iconPath });
    }
    if (worldUpdates.length) {
      await Item.updateDocuments(worldUpdates);
      worldUpdated = worldUpdates.length;
    }

    let actorUpdated = 0;
    if (includeActors) {
      for (const actor of game.actors ?? []) {
        const updates = [];
        for (const item of actor.items ?? []) {
          if (item.type !== "gear") continue;
          const brpid = item.flags?.[game.system.id]?.brpidFlag?.id ?? item.flags?.brp?.brpidFlag?.id ?? "";
          const isGeneral = this._isGeneralEquipmentBrpid(brpid) || item.flags?.[game.system.id]?.slaEquipment?.isGeneralEquipment;
          if (!isGeneral) continue;
          const iconPath = await this._getGearIconPath(item.name);
          if (!iconPath) {
            unmatched.add(String(item.name ?? "").trim());
            continue;
          }
          if (item.img === iconPath) continue;
          updates.push({ _id: item.id, img: iconPath });
        }
        if (updates.length) {
          await actor.updateEmbeddedDocuments("Item", updates);
          actorUpdated += updates.length;
        }
      }
    }

    let compendiumUpdated = 0;
    const packs = [];
    if (includeCompendium) {
      const targetPacks = game.packs.filter((pack) => pack.documentName === "Item");
      for (const pack of targetPacks) {
        let packUpdated = 0;
        try {
          if (pack.locked) {
            await pack.configure({ locked: false });
          }
          const docs = await pack.getDocuments();
          const updates = [];
          for (const doc of docs) {
            const brpid = doc.flags?.[game.system.id]?.brpidFlag?.id ?? doc.flags?.brp?.brpidFlag?.id ?? "";
            if (doc.type !== "gear" || !this._isGeneralEquipmentBrpid(brpid)) continue;
            const iconPath = await this._getGearIconPath(doc.name);
            if (!iconPath) {
              unmatched.add(String(doc.name ?? "").trim());
              continue;
            }
            if (doc.img === iconPath) continue;
            updates.push({ _id: doc.id, img: iconPath });
          }
          if (updates.length) {
            await Item.updateDocuments(updates, { pack: pack.collection });
            packUpdated = updates.length;
            compendiumUpdated += updates.length;
          }
        } catch (err) {
          console.warn(`sla-industries-brp | Failed general equipment icon sync for pack ${pack.collection}`, err);
        }
        if (packUpdated > 0) packs.push({ pack: pack.collection, updated: packUpdated });
      }
    }

    const summary = {
      worldUpdated,
      actorUpdated,
      compendiumUpdated,
      unmatched: [...unmatched].filter(Boolean).sort(),
      packs
    };

    if (notify && (worldUpdated > 0 || actorUpdated > 0 || compendiumUpdated > 0)) {
      ui.notifications.info(
        `SLA gear icons synced: world ${worldUpdated}, actors ${actorUpdated}, compendium ${compendiumUpdated}.`
      );
    }
    if (notify && summary.unmatched.length > 0) {
      ui.notifications.warn(`SLA gear icon sync: ${summary.unmatched.length} item(s) unmatched. See console.`);
      console.warn("sla-industries-brp | Unmatched SLA general equipment icons", summary.unmatched);
    }
    return summary;
  }

  static _npcTierLabel(tier = 1) {
    const map = {
      1: "Tier 1 - Extras",
      2: "Tier 2 - Standard Opposition",
      3: "Tier 3 - Elite Operatives",
      4: "Tier 4 - Horrors & Set-Piece Threats"
    };
    return map[Number(tier)] ?? "Tier 2 - Standard Opposition";
  }

  static _npcTierFolderName(tier = 1) {
    return this._npcTierLabel(tier).replace("&", "and");
  }

  static _clampNumber(value, min = 0, max = 100) {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  static _randomSignedDelta(spread = 2) {
    const width = Math.max(1, Number(spread ?? 2));
    return this._rollDie(width * 2 + 1) - (width + 1);
  }

  static _rollNpcQuickTier() {
    const roll = this._rollDie(10);
    const row = this.NPC_QUICK_TIER_TABLE.find((entry) => roll >= Number(entry.min ?? 1) && roll <= Number(entry.max ?? 10))
      ?? this.NPC_QUICK_TIER_TABLE[0];
    const tier = Number(row?.tier ?? 2) || 2;
    return {
      roll,
      tier,
      label: this._npcTierLabel(tier)
    };
  }

  static _pickRandomNpcTemplateByTier(tier = 2) {
    const numericTier = Number(tier ?? 2) || 2;
    const pool = this.NPC_ADVERSARY_TEMPLATES.filter((entry) => (Number(entry.tier ?? 2) || 2) === numericTier);
    const fallbackPool = pool.length ? pool : this.NPC_ADVERSARY_TEMPLATES;
    if (!fallbackPool.length) {
      return { roll: 1, size: 0, template: null };
    }
    const roll = this._rollDie(fallbackPool.length);
    return {
      roll,
      size: fallbackPool.length,
      template: foundry.utils.deepClone(fallbackPool[roll - 1])
    };
  }

  static _buildRandomNpcTemplateVariant(baseTemplate = {}) {
    const template = foundry.utils.deepClone(baseTemplate ?? {});
    const attrs = template.attributes ?? {};
    const attrKeys = ["str", "con", "dex", "int", "pow", "cha", "siz", "edu"];
    for (const key of attrKeys) {
      if (attrs[key] === undefined || attrs[key] === null) continue;
      attrs[key] = this._clampNumber(Number(attrs[key]) + this._randomSignedDelta(2), 1, 30);
    }
    template.attributes = attrs;

    template.skills = (template.skills ?? []).map((skill) => ({
      ...skill,
      value: this._clampNumber(Number(skill.value ?? 0) + this._randomSignedDelta(10), 5, 99)
    }));

    template.attacks = (template.attacks ?? []).map((attack) => ({
      ...attack,
      pct: this._clampNumber(Number(attack.pct ?? 0) + this._randomSignedDelta(8), 5, 99)
    }));

    const role = String(template.role ?? "Adversary");
    template.role = `${role} (Quick Random)`;
    return template;
  }

  static _rollNpcGroupSize(tier = 2) {
    const t = Number(tier ?? 2) || 2;
    if (t <= 1) {
      const die = this._rollDie(4);
      return { roll: die, size: 3 + die }; // 4-7
    }
    if (t === 2) {
      const die = this._rollDie(4);
      return { roll: die, size: 2 + die }; // 3-6
    }
    if (t === 3) {
      const die = this._rollDie(3);
      return { roll: die, size: 1 + die }; // 2-4
    }
    const die = this._rollDie(2);
    return { roll: die, size: 1 + die }; // 2-3
  }

  static _normalizeAdversaryMode(mode = "single-combat") {
    const raw = String(mode ?? "").trim().toLowerCase();
    const allowed = new Set(["single-combat", "combat-group", "non-combat-problem"]);
    if (allowed.has(raw)) return raw;
    return "single-combat";
  }

  static async _createNpcActorFromTemplate(template = {}, folder = null) {
    const actorData = this._npcTemplateActorData(template, folder?.id ?? null);
    const actor = await Actor.create(actorData);
    const embedded = [
      ...this._npcTemplateSkillItems(template),
      ...this._npcTemplateWeaponItems(template),
      ...this._npcTemplateGearItems(template)
    ];
    if (embedded.length) {
      await actor.createEmbeddedDocuments("Item", embedded);
    }
    return actor;
  }

  static async _ensureGeneratedThreatJournalFolder(rootName = "SLA Generated Threats") {
    let root = game.folders.find((f) => f.type === "JournalEntry" && f.name === rootName && !f.folder);
    if (!root) {
      root = await Folder.create({
        name: rootName,
        type: "JournalEntry",
        color: "#2a3f66"
      });
    }
    return root;
  }

  static async _buildNonCombatProblem(seed = {}) {
    const issuePool = await this._getNonCombatIssuePool();
    const issueRoll = this._rollFromArray(issuePool);
    const domainRoll = this._rollFromArray(this.NON_COMBAT_PROBLEM_DOMAINS);
    const stakeRoll = this._rollFromArray(this.NON_COMBAT_PROBLEM_STAKES);
    const twistRoll = this._rollFromArray(this.NON_COMBAT_PROBLEM_TWISTS);
    const skillRoll = this._rollFromArray(this.NON_COMBAT_SKILL_LANES);
    const atmosphereRoll = this._rollFromArray(this.ATMOSPHERES);
    const contactRoll = this._rollFromArray(this.CONTACTS);

    const issue = String(issueRoll.value ?? "Operational disruption reported.");
    const domain = String(domainRoll.value ?? "Operational Pressure");
    const stake = String(stakeRoll.value ?? "Operational pressure escalates.");
    const twist = String(twistRoll.value ?? "Situation remains unstable.");
    const lane = Array.isArray(skillRoll.value) ? skillRoll.value : ["Command", "Tactics"];
    const atmosphere = String(atmosphereRoll.value ?? "Urban stress conditions.");
    const contact = String(contactRoll.value ?? "Duty officer");
    const serial = this._rollDie(999).toString().padStart(3, "0");
    const title = `${domain} ${serial}`;

    const brief = [
      `Head Office flags an immediate non-combat blocker: ${issue.toLowerCase()}`,
      `Classification lane: ${domain.toLowerCase()}.`,
      `Scene reports ${atmosphere.toLowerCase()}.`,
      `Primary point of contact: ${contact.toLowerCase()}.`,
      `Failure condition: ${stake.toLowerCase()}`
    ].join(" ");

    return {
      title,
      issue,
      domain,
      stake,
      twist,
      atmosphere,
      contact,
      skills: lane.slice(0, 2),
      brief,
      rolls: {
        issue: Number(issueRoll.roll ?? 1),
        issueDie: Number(issuePool.length || 1),
        domain: Number(domainRoll.roll ?? 1),
        stake: Number(stakeRoll.roll ?? 1),
        twist: Number(twistRoll.roll ?? 1),
        skills: Number(skillRoll.roll ?? 1),
        atmosphere: Number(atmosphereRoll.roll ?? 1),
        contact: Number(contactRoll.roll ?? 1)
      }
    };
  }

  static _buildNonCombatProblemHtml(problem = {}) {
    const e = this._escapeHtml.bind(this);
    return this._wrapBpnDocument({
      title: `NON-COMBAT PROBLEM - ${problem.title ?? "Generated Issue"}`,
      kicker: "SLA INDUSTRIES // ADVERSE CONDITIONS FEED",
      body: `
        <section class="sla-bpn-section">
          <h2>Problem Brief</h2>
          <p>${e(problem.brief ?? "")}</p>
        </section>
        <section class="sla-bpn-section">
          <h2>Resolution Lanes</h2>
          <p><strong>Issue Trigger:</strong> ${e(problem.issue ?? "")}</p>
          <p><strong>Problem Class:</strong> ${e(problem.domain ?? "")}</p>
          <p><strong>Primary Skills:</strong> ${e((problem.skills ?? []).join(" / "))}</p>
          <p><strong>Stake:</strong> ${e(problem.stake ?? "")}</p>
          <p><strong>Twist:</strong> ${e(problem.twist ?? "")}</p>
          <p><strong>Atmosphere:</strong> ${e(problem.atmosphere ?? "")}</p>
          <p><strong>Contact:</strong> ${e(problem.contact ?? "")}</p>
        </section>
      `
    });
  }

  static async createQuickRandomNpcGroup({ folderName = "SLA NPC Adversaries", groupSize = null, notify = true, postToChat = true } = {}) {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can generate random NPC groups.");
      return { ok: false, reason: "not-gm" };
    }

    const tierRoll = this._rollNpcQuickTier();
    const compositionRoll = this._rollDie(6);
    let composition = "Pack/Cell";
    let baseTier = tierRoll.tier;
    let leaderTier = tierRoll.tier;
    if (compositionRoll >= 4 && compositionRoll <= 5) {
      composition = "Leader + Crew";
      leaderTier = Math.min(4, tierRoll.tier + 1);
    } else if (compositionRoll === 6) {
      composition = "Elite Mixed Response";
      baseTier = Math.min(4, tierRoll.tier + 1);
      leaderTier = baseTier;
    }

    const rolledSize = this._rollNpcGroupSize(baseTier);
    const requestedSize = Number(groupSize ?? 0);
    const finalSize = Number.isFinite(requestedSize) && requestedSize > 1
      ? Math.max(2, Math.min(12, Math.floor(requestedSize)))
      : rolledSize.size;

    const { root, tierFolders } = await this._ensureNpcAdversaryFolders(folderName);
    const groupTag = `Cell-${this._rollDie(999).toString().padStart(3, "0")}`;
    const actors = [];
    const members = [];

    for (let i = 1; i <= finalSize; i += 1) {
      const memberTier = i === 1 ? leaderTier : baseTier;
      const pick = this._pickRandomNpcTemplateByTier(memberTier);
      if (!pick.template) continue;
      const baseTemplate = foundry.utils.deepClone(pick.template);
      const variant = this._buildRandomNpcTemplateVariant(baseTemplate);
      variant.name = `${groupTag} - ${baseTemplate.name} ${i.toString().padStart(2, "0")}`;
      variant.id = `${String(baseTemplate.id ?? "npc-template")}-group-${Date.now()}-${this._rollDie(9999)}-${i}`;
      variant.role = `${String(variant.role ?? "Adversary")} (${i === 1 ? "Leader" : "Member"})`;

      const folder = tierFolders.get(memberTier) ?? root;
      const actor = await this._createNpcActorFromTemplate(variant, folder);
      actors.push(actor);
      members.push({
        name: actor.name,
        tier: memberTier,
        baseTemplate: baseTemplate.name
      });
    }

    if (actors[0]?.sheet) {
      actors[0].sheet.render(true);
    }

    if (postToChat) {
      const memberLines = members
        .map((m) => `<li>${this._escapeHtml(m.name)} (${this._escapeHtml(this._npcTierLabel(m.tier))}; base ${this._escapeHtml(m.baseTemplate)})</li>`)
        .join("");
      const chatHtml = `
        <article class="sla-chat-card sla-roll-card brp">
          <h3>Quick Random NPC Group</h3>
          <p><strong>Group:</strong> ${this._escapeHtml(groupTag)} | <strong>Composition:</strong> ${this._escapeHtml(composition)}</p>
          <p><strong>Tier Roll (d10):</strong> ${tierRoll.roll} | <strong>Comp Roll (d6):</strong> ${compositionRoll} | <strong>Size:</strong> ${members.length}</p>
          <ul>${memberLines || "<li>No members generated.</li>"}</ul>
        </article>
      `;
      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ alias: "SLA NPC Generator" }),
        content: chatHtml
      });
    }

    if (notify) {
      ui.notifications.info(`Quick Random NPC group generated: ${groupTag} (${members.length} members).`);
    }

    return {
      ok: true,
      groupTag,
      members,
      actors,
      rolls: {
        tier: tierRoll.roll,
        composition: compositionRoll,
        size: rolledSize.roll
      }
    };
  }

  static async createQuickRandomNonCombatProblem({ folderName = "SLA Generated Threats", notify = true, postToChat = true, playerVisible = true } = {}) {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can generate non-combat problems.");
      return { ok: false, reason: "not-gm" };
    }

    const problem = await this._buildNonCombatProblem();
    const folder = await this._ensureGeneratedThreatJournalFolder(folderName);
    const entry = await JournalEntry.create({
      name: `NON-COMBAT PROBLEM - ${problem.title}`,
      folder: folder?.id ?? null,
      ownership: {
        default: playerVisible
          ? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
          : CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
      },
      pages: [
        {
          name: "Problem Brief",
          type: "text",
          text: this._journalHtml(this._buildNonCombatProblemHtml(problem))
        }
      ]
    }, { renderSheet: false });

    entry.sheet?.render(true);

    if (postToChat) {
      const chatHtml = `
        <article class="sla-chat-card sla-roll-card brp">
          <h3>Quick Non-Combat Problem</h3>
          <p><strong>${this._escapeHtml(problem.title)}</strong></p>
          <p><strong>Issue Trigger:</strong> ${this._escapeHtml(problem.issue ?? "")}</p>
          <p><strong>Issue Roll:</strong> d${Number(problem.rolls?.issueDie ?? 1)} = ${Number(problem.rolls?.issue ?? 1)}</p>
          <p><strong>Problem Class:</strong> ${this._escapeHtml(problem.domain ?? "")}</p>
          <p>${this._escapeHtml(problem.brief)}</p>
          <p><strong>Skill Lanes:</strong> ${this._escapeHtml((problem.skills ?? []).join(" / "))}</p>
          <p><strong>Stake:</strong> ${this._escapeHtml(problem.stake)}</p>
          <p><strong>Twist:</strong> ${this._escapeHtml(problem.twist)}</p>
          <p><strong>Journal:</strong> @UUID[${entry.uuid}]{Open Problem Brief}</p>
        </article>
      `;
      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ alias: "SLA Problem Generator" }),
        content: chatHtml
      });
    }

    if (notify) {
      ui.notifications.info(`Quick non-combat problem generated: ${problem.title}`);
    }

    return { ok: true, problem, entry };
  }

  static async generateAdversaryByType({
    mode = "single-combat",
    groupSize = null,
    notify = true,
    postToChat = true,
    playerVisible = true
  } = {}) {
    const normalized = this._normalizeAdversaryMode(mode);
    if (normalized === "combat-group") {
      return this.createQuickRandomNpcGroup({ groupSize, notify, postToChat });
    }
    if (normalized === "non-combat-problem") {
      return this.createQuickRandomNonCombatProblem({ notify, postToChat, playerVisible });
    }
    return this.createQuickRandomNpcAdversary({ notify, postToChat });
  }

  static async promptAdversaryGenerator() {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can use the adversary generator.");
      return { ok: false, reason: "not-gm" };
    }

    const content = `
      <form class="brp" id="sla-adversary-generator-form">
        <div class="flexcol">
          <div class="flexrow">
            <label>Adversary Type</label>
            <select name="mode">
              <option value="single-combat">Single Combat Adversary</option>
              <option value="combat-group">Combat Group</option>
              <option value="non-combat-problem">Non-Combat Problem</option>
            </select>
          </div>
          <div class="flexrow" data-row="groupSize">
            <label>Group Size</label>
            <input name="groupSize" type="number" min="2" max="12" placeholder="Random if blank" />
          </div>
          <div class="flexrow">
            <label>Post result to chat</label>
            <input name="postToChat" type="checkbox" checked />
          </div>
          <div class="flexrow" data-row="playerVisible">
            <label>Players can view non-combat brief</label>
            <input name="playerVisible" type="checkbox" checked />
          </div>
        </div>
      </form>
    `;

    const formData = await SLADialog.waitForm({
      title: "Adversary Generator",
      content,
      formSelector: "#sla-adversary-generator-form",
      submitLabel: "Generate",
      cancelLabel: "Cancel",
      cancelValue: false,
      onRender: (root) => {
        const form = root?.querySelector?.("#sla-adversary-generator-form");
        if (!form) return;
        const modeSelect = form.querySelector("select[name='mode']");
        const groupRow = form.querySelector("[data-row='groupSize']");
        const playerRow = form.querySelector("[data-row='playerVisible']");
        const sync = () => {
          const mode = String(modeSelect?.value ?? "single-combat");
          if (groupRow) groupRow.style.display = mode === "combat-group" ? "" : "none";
          if (playerRow) playerRow.style.display = mode === "non-combat-problem" ? "" : "none";
        };
        modeSelect?.addEventListener("change", sync);
        sync();
      }
    });
    if (!formData) return { ok: false, reason: "cancelled" };
    const mode = String(formData.get("mode") ?? "single-combat");
    const groupSizeRaw = String(formData.get("groupSize") ?? "").trim();
    const groupSize = groupSizeRaw ? Number(groupSizeRaw) : null;
    const result = await this.generateAdversaryByType({
      mode,
      groupSize,
      notify: true,
      postToChat: formData.get("postToChat") !== null,
      playerVisible: formData.get("playerVisible") !== null
    });
    return { ok: true, mode, result };
  }

  static _npcArmourValue(armourText = "") {
    const values = [...String(armourText ?? "").matchAll(/\d+/g)].map((match) => Number(match[0]));
    if (!values.length) return 0;
    return Math.max(...values);
  }

  static _npcTemplateNarrative(template = {}) {
    const attrs = template.attributes ?? {};
    const attrLine = `STR ${attrs.str ?? 0}, CON ${attrs.con ?? 0}, DEX ${attrs.dex ?? 0}, INT ${attrs.int ?? 0}, POW ${attrs.pow ?? 0}, CHA ${attrs.cha ?? 0}, SIZ ${attrs.siz ?? 0}`;
    const skillLine = (template.skills ?? [])
      .map((skill) => `${skill.name} ${skill.value}%`)
      .join(", ");
    const attackLine = (template.attacks ?? [])
      .map((atk) => `${atk.name} ${atk.pct}% (${atk.damage})`)
      .join("; ");
    const traitLine = (template.traits ?? []).join(" | ");
    const gearLine = (template.gear ?? []).join(", ");
    const hooksLine = (template.bpnHooks ?? []).join(", ");
    return [
      `${template.role ?? "NPC"} | ${this._npcTierLabel(template.tier ?? 2)}`,
      attrLine,
      template.armour ? `Armour: ${template.armour}` : "",
      skillLine ? `Key Skills: ${skillLine}` : "",
      attackLine ? `Attacks: ${attackLine}` : "",
      traitLine ? `Traits: ${traitLine}` : "",
      gearLine ? `Gear: ${gearLine}` : "",
      hooksLine ? `BPN Hooks: ${hooksLine}` : ""
    ].filter(Boolean).join("\n");
  }

  static _npcTemplateSkillItems(template = {}) {
    return (template.skills ?? []).map((skill) => ({
      name: String(skill.name ?? "Skill"),
      type: "skill",
      system: {
        base: Number(skill.value ?? 0) || 0,
        category: "cmmnmod",
        xp: 0,
        culture: 0,
        profession: 0,
        personality: 0,
        personal: 0,
        effects: 0,
        description: `Seeded NPC skill for ${template.name ?? "adversary"}.`
      },
      flags: {
        [game.system.id]: {
          slaNpcTemplateItem: {
            templateId: template.id ?? "",
            itemKind: "skill"
          }
        }
      }
    }));
  }

  static _npcSplitRange(range = "S") {
    const parts = String(range ?? "S").split("/").map((value) => value.trim()).filter(Boolean);
    return {
      range1: parts[0] ?? "S",
      range2: parts[1] ?? "",
      range3: parts[2] ?? ""
    };
  }

  static _npcTemplateWeaponItems(template = {}) {
    return (template.attacks ?? []).map((attack) => {
      const range = this._npcSplitRange(attack.range ?? "S");
      const weaponType = String(attack.weaponType ?? "melee").toLowerCase();
      const notes = String(attack.notes ?? "");
      return {
        name: String(attack.name ?? "Attack"),
        type: "weapon",
        system: {
          weaponType,
          dmg1: String(attack.damage ?? "1D6"),
          npcVal: Number(attack.pct ?? 0) || 0,
          range1: range.range1,
          range2: range.range2,
          range3: range.range3,
          att: Math.max(1, Number(attack.att ?? 1) || 1),
          special: "none",
          hands: weaponType === "heavy" ? "2H" : "1H",
          hp: 10,
          hpCurr: 10,
          ammo: weaponType === "firearm" || weaponType === "heavy" ? 30 : 0,
          ammoCurr: weaponType === "firearm" || weaponType === "heavy" ? 30 : 0,
          ammoTracking: weaponType === "firearm" || weaponType === "heavy",
          ammoPerShot: 1,
          ammoPerBurst: 3,
          ammoPerAuto: 5,
          description: notes
        },
        flags: {
          [game.system.id]: {
            slaNpcTemplateItem: {
              templateId: template.id ?? "",
              itemKind: "weapon"
            }
          }
        }
      };
    });
  }

  static _npcTemplateGearItems(template = {}) {
    return (template.gear ?? []).map((entry) => ({
      name: String(entry ?? "Gear"),
      type: "gear",
      system: {
        quantity: 1,
        enc: 0,
        crdEach: 0,
        crdTotal: 0,
        price: "average",
        equipStatus: "carried",
        description: `Template gear: ${String(entry ?? "")}`
      },
      flags: {
        [game.system.id]: {
          slaNpcTemplateItem: {
            templateId: template.id ?? "",
            itemKind: "gear"
          }
        }
      }
    }));
  }

  static _npcTemplateActorData(template = {}, folderId = null) {
    const attrs = template.attributes ?? {};
    const armour = this._npcArmourValue(template.armour ?? "");
    const con = Number(attrs.con ?? 10) || 10;
    const siz = Number(attrs.siz ?? con) || con;
    const expectedHp = Math.ceil((con + siz) * 0.5);
    const hpTarget = Number(template.hp ?? expectedHp) || expectedHp;
    const hpMod = hpTarget - expectedHp;
    const summary = this._npcTemplateNarrative(template);
    const role = String(template.role ?? "Adversary");
    const tier = Number(template.tier ?? 2) || 2;
    return {
      name: String(template.name ?? "NPC Adversary"),
      type: "npc",
      folder: folderId,
      system: {
        lock: true,
        viewTab: "1",
        description: `${role} (${this._npcTierLabel(tier)})`,
        extDesc: summary,
        ap: armour,
        bap: 0,
        health: {
          value: hpTarget,
          mod: hpMod
        },
        stats: {
          str: { base: Number(attrs.str ?? 10) || 10 },
          con: { base: con },
          dex: { base: Number(attrs.dex ?? 10) || 10 },
          int: { base: Number(attrs.int ?? 10) || 10 },
          pow: { base: Number(attrs.pow ?? 10) || 10 },
          cha: { base: Number(attrs.cha ?? 10) || 10 },
          siz: { base: siz },
          edu: { base: Number(attrs.edu ?? 10) || 10 }
        }
      },
      flags: {
        [game.system.id]: {
          slaNpcTemplate: {
            id: String(template.id ?? ""),
            tier,
            role,
            source: "SLA_NPCS_AND_ADVERSARIES"
          }
        }
      }
    };
  }

  static async _ensureNpcAdversaryFolders(rootName = "SLA NPC Adversaries") {
    let root = game.folders.find((f) => f.type === "Actor" && f.name === rootName && !f.folder);
    if (!root) {
      root = await Folder.create({
        name: rootName,
        type: "Actor",
        color: "#7a1010"
      });
    }

    const tierFolders = new Map();
    for (const template of this.NPC_ADVERSARY_TEMPLATES) {
      const tier = Number(template.tier ?? 2) || 2;
      const folderName = this._npcTierFolderName(tier);
      let folder = game.folders.find((f) => f.type === "Actor" && f.name === folderName && f.folder?.id === root.id);
      if (!folder) {
        folder = await Folder.create({
          name: folderName,
          type: "Actor",
          folder: root.id,
          color: "#4c1515"
        });
      }
      tierFolders.set(tier, folder);
    }
    return { root, tierFolders };
  }

  static _findExistingNpcTemplateActor(template = {}, rootFolderId = null) {
    const templateId = String(template.id ?? "");
    const actors = [...(game.actors ?? [])];
    return actors.find((actor) => {
      if (rootFolderId && actor.folder?.id !== rootFolderId && actor.folder?.folder?.id !== rootFolderId) return false;
      const flagId = actor.flags?.[game.system.id]?.slaNpcTemplate?.id;
      if (String(flagId ?? "") === templateId) return true;
      return String(actor.name ?? "").trim() === String(template.name ?? "").trim();
    }) ?? null;
  }

  static async seedWorldNpcAdversaries({ overwrite = false, folderName = "SLA NPC Adversaries", notify = true } = {}) {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can seed NPC adversaries.");
      return { ok: false, reason: "not-gm" };
    }

    const { root, tierFolders } = await this._ensureNpcAdversaryFolders(folderName);
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const template of this.NPC_ADVERSARY_TEMPLATES) {
      const tier = Number(template.tier ?? 2) || 2;
      const folder = tierFolders.get(tier) ?? root;
      const actorData = this._npcTemplateActorData(template, folder?.id ?? null);
      const existing = this._findExistingNpcTemplateActor(template, root.id);
      const skillItems = this._npcTemplateSkillItems(template);
      const weaponItems = this._npcTemplateWeaponItems(template);
      const gearItems = this._npcTemplateGearItems(template);
      const embedded = [...skillItems, ...weaponItems, ...gearItems];

      if (!existing) {
        const actor = await Actor.create(actorData);
        if (embedded.length) {
          await actor.createEmbeddedDocuments("Item", embedded);
        }
        created += 1;
        continue;
      }

      if (!overwrite) {
        skipped += 1;
        continue;
      }

      const updateData = foundry.utils.deepClone(actorData);
      delete updateData.type;
      await existing.update(updateData);

      const seededItems = (existing.items ?? []).filter((item) => {
        const marker = item.flags?.[game.system.id]?.slaNpcTemplateItem;
        return String(marker?.templateId ?? "") === String(template.id ?? "");
      });
      if (seededItems.length) {
        await existing.deleteEmbeddedDocuments("Item", seededItems.map((item) => item.id));
      }
      if (embedded.length) {
        await existing.createEmbeddedDocuments("Item", embedded);
      }
      updated += 1;
    }

    if (notify) {
      ui.notifications.info(`SLA NPC adversaries seeded: +${created} created${overwrite ? `, ${updated} updated` : ""}${skipped ? `, ${skipped} skipped` : ""}.`);
    }

    return {
      ok: true,
      rootFolder: root,
      created,
      updated,
      skipped,
      totalTemplates: this.NPC_ADVERSARY_TEMPLATES.length
    };
  }

  static async createQuickRandomNpcAdversary({ folderName = "SLA NPC Adversaries", notify = true, postToChat = true } = {}) {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can generate quick random NPC adversaries.");
      return { ok: false, reason: "not-gm" };
    }

    if (!Array.isArray(this.NPC_ADVERSARY_TEMPLATES) || !this.NPC_ADVERSARY_TEMPLATES.length) {
      ui.notifications.warn("No NPC adversary templates are configured.");
      return { ok: false, reason: "no-templates" };
    }

    const tierRoll = this._rollNpcQuickTier();
    const pick = this._pickRandomNpcTemplateByTier(tierRoll.tier);
    if (!pick.template) {
      ui.notifications.warn("Unable to select an NPC template.");
      return { ok: false, reason: "template-select-failed" };
    }

    const baseTemplate = foundry.utils.deepClone(pick.template);
    const variant = this._buildRandomNpcTemplateVariant(baseTemplate);
    const serial = this._rollDie(999).toString().padStart(3, "0");
    variant.name = `${String(baseTemplate.name ?? "NPC Adversary")} ${serial}`;
    variant.id = `${String(baseTemplate.id ?? "npc-template")}-quick-${Date.now()}-${this._rollDie(9999)}`;

    const { root, tierFolders } = await this._ensureNpcAdversaryFolders(folderName);
    const folder = tierFolders.get(tierRoll.tier) ?? root;
    const actorData = this._npcTemplateActorData(variant, folder?.id ?? null);
    actorData.flags = foundry.utils.mergeObject(actorData.flags ?? {}, {
      [game.system.id]: {
        slaNpcQuickRandom: {
          createdAt: Date.now(),
          tierRoll: Number(tierRoll.roll ?? 1),
          templateRoll: Number(pick.roll ?? 1),
          templatePool: Number(pick.size ?? 0),
          baseTemplateId: String(baseTemplate.id ?? ""),
          baseTemplateName: String(baseTemplate.name ?? "")
        }
      }
    }, { inplace: false });

    const actor = await Actor.create(actorData);
    const embedded = [
      ...this._npcTemplateSkillItems(variant),
      ...this._npcTemplateWeaponItems(variant),
      ...this._npcTemplateGearItems(variant)
    ];
    if (embedded.length) {
      await actor.createEmbeddedDocuments("Item", embedded);
    }

    actor.sheet?.render(true);

    if (postToChat) {
      const hooks = (baseTemplate.bpnHooks ?? []).join(", ") || "None";
      const chatHtml = `
        <article class="sla-chat-card sla-roll-card brp">
          <h3>Quick Random NPC</h3>
          <p><strong>${this._escapeHtml(actor.name)}</strong> | ${this._escapeHtml(this._npcTierLabel(tierRoll.tier))}</p>
          <p><strong>Template:</strong> ${this._escapeHtml(String(baseTemplate.name ?? "Unknown"))}</p>
          <p><strong>Tier Roll (d10):</strong> ${Number(tierRoll.roll ?? 1)} | <strong>Template Roll (d${Number(pick.size ?? 1)}):</strong> ${Number(pick.roll ?? 1)}</p>
          <p><strong>BPN Hooks:</strong> ${this._escapeHtml(hooks)}</p>
        </article>
      `;
      await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ alias: "SLA NPC Generator" }),
        content: chatHtml
      });
    }

    if (notify) {
      ui.notifications.info(`Quick Random NPC created: ${actor.name}`);
    }

    return {
      ok: true,
      actor,
      tierRoll,
      templateRoll: {
        roll: Number(pick.roll ?? 1),
        size: Number(pick.size ?? 0),
        baseTemplate: baseTemplate
      }
    };
  }

  static getPlayerTemplate() {
    return [
      "TITLE: [COLOUR] BPN - [SHORT TITLE]",
      "BPN ID: [SectorCode-Dept-Serial]",
      "Colour Code: [COLOUR] - [Type]",
      "Issuing Department: [Department]",
      "SCL Requirement: [Minimum SCL]",
      "Squad: [Squad Name / ID]",
      "Media Coverage: [Result from Table 10]",
      "SCL Increase: [Result from reward calculator]",
      "Consolidated Bonus Scheme: [Credits from reward calculator]",
      "Payment: [Per Operative / Per Squad]",
      "",
      "MISSION BRIEF",
      "[2-4 sentence in-character summary. Who, what, where, and why SLA cares.]",
      "",
      "OBJECTIVES",
      "1. Primary Objective - [From mission focus]",
      "2. Secondary Objective - [From extra objective, if used]",
      "3. Cleanup / Evidence / PR - [Colour-specific outcome requirements]",
      "",
      "LOCATION & CONDITIONS",
      "Primary Location: [From location table]",
      "Atmosphere: [From atmosphere table]",
      "Complications: [From complication table]",
      "",
      "OPPOSITION",
      "Expected Threats: [From opposition table]",
      "Escalation: [From escalation table]",
      "",
      "CONTACT",
      "Briefing NPC: [From contact table]",
      "",
      "RESOURCES AND CONSTRAINTS",
      "Authorised Support: [Shivers, Stormers, vehicles, drones, armour.]",
      "Restrictions: [Collateral limits, camera policy, secrecy requirements.]",
      "Time Limit: [Deadline / before dawn / fixed operational window.]",
      "",
      "DEBRIEFING NOTES (GM-ONLY)",
      "[True motives, hidden agendas, metaplot hooks, twists, what SLA is not saying.]",
      "",
      "SOLO ORACLE",
      "d6: 1-2 No/Bad, 3-4 Mixed, 5-6 Yes/Good"
    ].join("\n");
  }

  static getColourCodesPageHtml() {
    const tableRow = (colour) => `
      <tr>
        <td>${this._escapeHtml(colour.label)}</td>
        <td>${this._escapeHtml(colour.type ?? colour.summary ?? "")}</td>
        <td>${this._escapeHtml(colour.sclReq ?? "")}</td>
        <td>${this._escapeHtml(colour.sclIncrease ?? "")}</td>
        <td>${this._escapeHtml(colour.cbsPerOp ?? "")}</td>
        <td>${this._escapeHtml(colour.cbsPerSquad ?? "")}</td>
        <td>${this._escapeHtml(colour.mediaCoverage ?? "")}</td>
      </tr>
    `;
    const referenceRows = this.MAIN_COLOURS.map(tableRow).join("");
    const optionalRows = this.OPTIONAL_COLOURS.map(tableRow).join("");
    const descriptionRows = [...this.MAIN_COLOURS, ...this.OPTIONAL_COLOURS]
      .map((colour) => {
        const desc = this.COLOUR_DESCRIPTIONS[colour.key] ?? colour.details ?? colour.summary ?? "";
        return `<li><strong>${this._escapeHtml(colour.label)}</strong>: ${this._escapeHtml(desc)}</li>`;
      })
      .join("");
    const sclRows = [...this.MAIN_COLOURS, ...this.OPTIONAL_COLOURS]
      .map((colour) => `
        <tr>
          <td>${this._escapeHtml(colour.label)}</td>
          <td>${this._escapeHtml(this._formatScl(colour.sclRange?.min ?? 0))}</td>
          <td>${this._escapeHtml(this._formatScl(colour.sclRange?.typical ?? 0))}</td>
          <td>${this._escapeHtml(this._formatScl(colour.sclRange?.max ?? 0))}</td>
        </tr>
      `)
      .join("");
    const body = `
      <h1>SLA Industries 1st Edition - Complete BPN Colour Code Reference</h1>
      <h2>Colour Code Table</h2>
      <table>
        <thead>
          <tr>
            <th>Colour</th>
            <th>Type</th>
            <th>Typical SCL Req</th>
            <th>SCL Increase</th>
            <th>CBS (Per Op)</th>
            <th>CBS (Per Squad)</th>
            <th>Media Coverage</th>
          </tr>
        </thead>
        <tbody>${referenceRows}</tbody>
      </table>
      <h2>Additional Supplement Colour</h2>
      <table>
        <thead>
          <tr>
            <th>Colour</th>
            <th>Type</th>
            <th>Typical SCL Req</th>
            <th>SCL Increase</th>
            <th>CBS (Per Op)</th>
            <th>CBS (Per Squad)</th>
            <th>Media Coverage</th>
          </tr>
        </thead>
        <tbody>${optionalRows}</tbody>
      </table>
      <h2>Colour Descriptions</h2>
      <ul>${descriptionRows}</ul>
      <h2>SCL Increase Guidelines by Colour</h2>
      <table>
        <thead>
          <tr>
            <th>Colour</th>
            <th>Minimum</th>
            <th>Typical</th>
            <th>Maximum</th>
          </tr>
        </thead>
        <tbody>${sclRows}</tbody>
      </table>
      <h2>Payment Structure Notes</h2>
      <ul>
        <li>CBS is the Consolidated Bonus Scheme baseline payout.</li>
        <li>Payment type is either Per Operative or Per Squad and must be stated on each BPN.</li>
        <li>Financiers typically take 10-20 percent of CBS depending on contract arrangement.</li>
        <li>Kill bounties, recovered tech, and sponsor/media bonuses are additional income.</li>
        <li>SCL decrease on failure is possible (especially Grey, Black, and Platinum contracts).</li>
        <li>Compulsory BPNs may pay less or nothing and can remove payout on failure.</li>
        <li>Repeated BPNs often pay 150-200% of normal CBS due increased risk.</li>
        <li>Failure can withhold CBS and may apply SCL penalties on severe outcomes.</li>
      </ul>
    `;
    return this._wrapBpnDocument({
      title: "BPN Colour Code Reference",
      kicker: "SLA INDUSTRIES // OPERATIONS CONTROL",
      body
    });
  }

  static getTemplatePageHtml() {
    return this._wrapBpnDocument({
      title: "Player-Facing BPN Template",
      kicker: "SLA INDUSTRIES // FIELD FORMAT",
      body: `
        <p>Copy and fill this structure when issuing a new BPN.</p>
        <pre>${this._escapeHtml(this.getPlayerTemplate())}</pre>
      `
    });
  }

  static getSoloGenerationPageHtml() {
    return this._wrapBpnDocument({
      title: "Solo BPN Generation",
      kicker: "SLA INDUSTRIES // SOLO OPS",
      body: `
      <h2>Assembly Procedure</h2>
      <ol>
        <li>Table 1: BPN Colour (d20).</li>
        <li>Table 10: Reward Calculator (d6 payment type, d6 CBS tier, d6 SCL tier, d6 media).</li>
        <li>Table 2: Mission Focus (d20).</li>
        <li>Table 3: Location (d20).</li>
        <li>Table 4: Opposition (d20).</li>
        <li>Table 5: Complication (d20).</li>
        <li>Table 6: Contact NPC (d12).</li>
        <li>Table 7: Atmosphere (d12).</li>
        <li>Table 8: Escalation Event (d12).</li>
        <li>Table 9: Extra Objective (d12).</li>
      </ol>
      <h2>Table 1 - BPN Colour (d20)</h2>
      <p>1-4 Blue, 5-7 Yellow, 8-9 Green, 10-12 White, 13 Grey, 14 Silver, 15 Jade, 16-17 Red, 18 Orange, 19 Black, 20 Platinum.</p>
      <h2>Table 2 - Mission Focus (d20)</h2>
      <ol>${this.MISSION_FOCUS.map((v) => `<li>${this._escapeHtml(v)}</li>`).join("")}</ol>
      <h2>Table 3 - Location (d20)</h2>
      <ol>${this.LOCATIONS.map((v) => `<li>${this._escapeHtml(v)}</li>`).join("")}</ol>
      <h2>Table 4 - Opposition (d20)</h2>
      <ol>${this.OPPOSITION.map((v) => `<li>${this._escapeHtml(v)}</li>`).join("")}</ol>
      <h2>Table 5 - Complication (d20)</h2>
      <ol>${this.COMPLICATIONS.map((v) => `<li>${this._escapeHtml(v)}</li>`).join("")}</ol>
      <h2>Table 10 - Reward Calculator</h2>
      <ul>
        <li>d6 payment type: 1-3 Per Operative, 4-6 Per Squad.</li>
        <li>d6 CBS tier: 1-2 low, 3-4 mid, 5-6 high.</li>
        <li>d6 SCL tier: 1-2 minimum, 3-4 typical, 5-6 maximum.</li>
        <li>d6 media: 1 None, 2-3 Station Analysis, 4-5 Third Eye News, 6 GoreZone/Contract Circuit.</li>
      </ul>
      <h2>Solo Oracle</h2>
      <p>d6 oracle: 1-2 No/Bad, 3-4 Mixed, 5-6 Yes/Good.</p>
      <h2>Downtime (between BPNs)</h2>
      <ol>
        <li>Equipment maintenance cost (lose 10-50c).</li>
        <li>Sponsor approaches with an offer.</li>
        <li>Financier provides a tip on an upcoming BPN.</li>
        <li>Media interview request.</li>
        <li>Personal complication (debt/relationship/health).</li>
        <li>Quiet period: recover and refit.</li>
      </ol>
      <p>Extended narrative tables remain available in <strong>${this._escapeHtml(this.EXTENDED_DATA_JOURNAL_NAME)}</strong>.</p>
    `
    });
  }

  static _tableSectionHtml(title, entries = [], { ordered = true } = {}) {
    const tag = ordered ? "ol" : "ul";
    const body = (entries ?? []).map((entry) => `<li>${this._escapeHtml(entry)}</li>`).join("");
    return `<h2>${this._escapeHtml(title)}</h2><${tag}>${body}</${tag}>`;
  }

  static getExtendedUsagePageHtml() {
    return this._wrapBpnDocument({
      title: "BPN Assembly Procedure",
      kicker: "SLA INDUSTRIES // DISPATCH PROTOCOL",
      body: `
        <p>Use these tables in sequence to build complete 1st Edition style BPN briefs.</p>
        <ol>
          <li>Roll Table 1 (Colour, d20), then Table 10 (Reward Calculator d6s).</li>
          <li>Roll Tables 2-5 for focus, location, opposition, and complication.</li>
          <li>Roll Tables 6-9 for contact, atmosphere, escalation, and extra objective.</li>
          <li>Apply colour-specific payout/SCL ranges and finance cuts.</li>
          <li>Fill results into TEMPLATE - BPN and publish to players when ready.</li>
        </ol>
      `
    });
  }

  static getColourMissionIdeasPageHtml() {
    const sections = ["blue", "yellow", "green", "white", "grey", "silver", "jade", "red", "black", "orange", "platinum"]
      .map((key) => {
        const colour = this._colourByKey(key);
        const ideas = this.COLOUR_MISSION_IDEAS[key] ?? [];
        return this._tableSectionHtml(`${colour.label} BPN Ideas (d${ideas.length})`, ideas);
      })
      .join("");
    return this._wrapBpnDocument({
      title: "Colour-Themed Mission Ideas",
      kicker: "SLA INDUSTRIES // CONTRACT SEEDS",
      body: sections
    });
  }

  static getNpcMotivesPageHtml() {
    return this._wrapBpnDocument({
      title: "NPC Type and Motive Lists",
      kicker: "SLA INDUSTRIES // HUMAN FACTORS",
      body: `
        ${this._tableSectionHtml("Contacts (d12)", this.CONTACTS)}
        ${this._tableSectionHtml("Civilian Factions (d10)", this.CIVILIAN_FACTIONS)}
        ${this._tableSectionHtml("Opposition Attitudes (d8)", this.OPPOSITION_ATTITUDES)}
      `
    });
  }

  static getEnvironmentPageHtml() {
    return this._wrapBpnDocument({
      title: "Environmental Details",
      kicker: "SLA INDUSTRIES // THEATRE CONDITIONS",
      body: `
        ${this._tableSectionHtml("Atmosphere / Mood (d12)", this.ATMOSPHERES)}
        ${this._tableSectionHtml("Local Twists (d10)", this.LOCAL_TWISTS)}
      `
    });
  }

  static getObjectivesEscalationPageHtml() {
    return this._wrapBpnDocument({
      title: "Objectives and Complications",
      kicker: "SLA INDUSTRIES // RISK LAYERS",
      body: `
        ${this._tableSectionHtml("Extra Objectives (d12)", this.EXTRA_OBJECTIVES)}
        ${this._tableSectionHtml("Escalation Events (d12)", this.ESCALATION_EVENTS)}
      `
    });
  }

  static _rollableTablePageHtml(title, headers = [], rows = []) {
    const headerHtml = headers.map((header) => `<th>${this._escapeHtml(header)}</th>`).join("");
    const rowHtml = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${this._escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("");
    return this._wrapBpnDocument({
      title,
      kicker: "SLA INDUSTRIES // ROLL TABLE",
      body: `
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowHtml}</tbody>
        </table>
      `
    });
  }

  static getColourRollTablePageHtml() {
    const rows = this.COLOR_ROLL_TABLE.map((entry) => {
      const colour = this._colourByKey(entry.key);
      const rollRange = entry.min === entry.max ? `${entry.min}` : `${entry.min}-${entry.max}`;
      return [rollRange, colour.label, colour.type ?? colour.summary ?? ""];
    });
    return this._rollableTablePageHtml("TABLE 1 - BPN COLOUR (d20)", ["Roll", "Colour", "Type"], rows);
  }

  static getMissionFocusTablePageHtml() {
    const rows = this.MISSION_FOCUS.map((value, index) => [`${index + 1}`, value]);
    return this._rollableTablePageHtml("TABLE 2 - MISSION FOCUS (d20)", ["Roll", "Focus"], rows);
  }

  static getLocationTablePageHtml() {
    const rows = this.LOCATIONS.map((value, index) => [`${index + 1}`, value]);
    return this._rollableTablePageHtml("TABLE 3 - LOCATION (d20)", ["Roll", "Location"], rows);
  }

  static getOppositionTablePageHtml() {
    const rows = this.OPPOSITION.map((value, index) => [`${index + 1}`, value]);
    return this._rollableTablePageHtml("TABLE 4 - OPPOSITION TYPE (d20)", ["Roll", "Opposition"], rows);
  }

  static getComplicationTablePageHtml() {
    const rows = this.COMPLICATIONS.map((value, index) => [`${index + 1}`, value]);
    return this._rollableTablePageHtml("TABLE 5 - COMPLICATION (d20)", ["Roll", "Complication"], rows);
  }

  static getContactTablePageHtml() {
    const rows = this.CONTACTS.map((value, index) => [`${index + 1}`, value]);
    return this._rollableTablePageHtml("TABLE 6 - CONTACT / EMPLOYER NPC (d12)", ["Roll", "Contact"], rows);
  }

  static getAtmosphereTablePageHtml() {
    const rows = this.ATMOSPHERES.map((value, index) => [`${index + 1}`, value]);
    return this._rollableTablePageHtml("TABLE 7 - ATMOSPHERE / MOOD (d12)", ["Roll", "Atmosphere"], rows);
  }

  static getEscalationTablePageHtml() {
    const rows = this.ESCALATION_EVENTS.map((value, index) => [`${index + 1}`, value]);
    return this._rollableTablePageHtml("TABLE 8 - ESCALATION EVENT (d12)", ["Roll", "Escalation"], rows);
  }

  static getExtraObjectivesTablePageHtml() {
    const rows = this.EXTRA_OBJECTIVES.map((value, index) => [`${index + 1}`, value]);
    return this._rollableTablePageHtml("TABLE 9 - EXTRA OBJECTIVES (d12)", ["Roll", "Extra Objective"], rows);
  }

  static getRewardCalculatorPageHtml() {
    return this._wrapBpnDocument({
      title: "TABLE 10 - REWARD CALCULATOR",
      kicker: "SLA INDUSTRIES // FINANCE DESK",
      body: `
      <p>After determining colour from Table 1, resolve payout and advancement values.</p>
      <h2>Payment Type (d6)</h2>
      <ul>
        <li>1-3: Per Operative</li>
        <li>4-6: Per Squad</li>
      </ul>
      <h2>CBS Tier (d6)</h2>
      <ul>
        <li>1-2: Low end of colour range</li>
        <li>3-4: Mid range</li>
        <li>5-6: High end of colour range</li>
      </ul>
      <h2>SCL Increase Tier (d6)</h2>
      <ul>
        <li>1-2: Minimum increase</li>
        <li>3-4: Typical increase</li>
        <li>5-6: Maximum increase</li>
      </ul>
      <h2>Media Coverage (d6)</h2>
      <ul>
        <li>1: None</li>
        <li>2-3: Station Analysis</li>
        <li>4-5: Third Eye News</li>
        <li>6: GoreZone / Contract Circuit Special</li>
      </ul>
      <h2>Financier Cut Guide</h2>
      <ul>
        <li>Department Financier: 10-15% of CBS.</li>
        <li>Independent Financier: 15-20% of CBS.</li>
        <li>Freelance Financier: variable, usually higher.</li>
      </ul>
    `
    });
  }

  static getSoloPlayProcedurePageHtml() {
    return this._wrapBpnDocument({
      title: "Solo Play Procedure",
      kicker: "SLA INDUSTRIES // SOLO OPS SUPPORT",
      body: `
      <ol>
        <li>Roll Tables 1-10 and fill the BPN template.</li>
        <li>Use d6 oracle prompts for uncertain answers: 1-2 no/bad, 3-4 mixed, 5-6 yes/good.</li>
        <li>Stat opposition only when encountered to minimize prep.</li>
        <li>After BPN completion, apply final payout and SCL changes.</li>
        <li>Between BPNs, resolve downtime events and maintenance costs.</li>
      </ol>
      <h2>Downtime Events (d6)</h2>
      <ol>
        <li>Equipment maintenance costs (lose 10-50c).</li>
        <li>Sponsor approaches with an offer.</li>
        <li>Financier tip on an upcoming BPN.</li>
        <li>Media interview request.</li>
        <li>Personal complication (debt, relationship, health).</li>
        <li>Quiet period, recover and refit.</li>
      </ol>
    `
    });
  }

  static async _findJournalByName(name) {
    const target = String(name ?? "").trim();
    return game.journal?.find((entry) => String(entry?.name ?? "").trim() === target) ?? null;
  }

  static async _ensureJournalWithPages({
    name,
    pages,
    ownershipDefault = CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
    enforceOwnership = false,
    overwritePages = false
  }) {
    let entry = await this._findJournalByName(name);
    if (!entry) {
      entry = await JournalEntry.create({
        name,
        ownership: { default: ownershipDefault },
        pages
      }, { renderSheet: false });
      return entry;
    }

    if (enforceOwnership) {
      const currentDefault = Number(entry.ownership?.default ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE);
      if (currentDefault !== Number(ownershipDefault)) {
        await entry.update({
          ownership: {
            ...(entry.ownership ?? {}),
            default: ownershipDefault
          }
        });
      }
    }

    const existingNames = new Set((entry.pages ?? []).map((page) => String(page?.name ?? "")));
    const missing = pages.filter((page) => !existingNames.has(String(page.name ?? "")));
    if (missing.length) {
      await entry.createEmbeddedDocuments("JournalEntryPage", missing);
    }

    if (overwritePages) {
      const byName = new Map((entry.pages ?? []).map((page) => [String(page?.name ?? ""), page]));
      const updates = [];
      for (const page of pages) {
        const existing = byName.get(String(page.name ?? ""));
        if (!existing) continue;
        updates.push({
          _id: existing.id,
          type: page.type,
          text: page.text
        });
      }
      if (updates.length) {
        await entry.updateEmbeddedDocuments("JournalEntryPage", updates);
      }
    }
    return entry;
  }

  static async ensureRulebookJournal({ notify = false, syncPages = true } = {}) {
    if (!this._isGM()) {
      return { ok: false, reason: "not-gm" };
    }

    const markdown = await this._loadRulebookMarkdown();
    const pages = this._buildRulebookPagesFromMarkdown(markdown);
    const entry = await this._ensureJournalWithPages({
      name: this.RULEBOOK_JOURNAL_NAME,
      pages,
      ownershipDefault: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      enforceOwnership: true,
      overwritePages: Boolean(syncPages)
    });

    if (notify) {
      ui.notifications.info(`SLA rulebook ready with ${pages.length} searchable sections.`);
    }

    return { ok: true, entry, pages: pages.length };
  }

  static async ensureVehicleChaseJournal({ notify = false, syncPages = true } = {}) {
    if (!this._isGM()) {
      return { ok: false, reason: "not-gm" };
    }

    const markdown = await this._loadVehicleChaseMarkdown();
    const pages = this._buildVehicleChasePagesFromMarkdown(markdown);
    const entry = await this._ensureJournalWithPages({
      name: this.VEHICLE_CHASE_JOURNAL_NAME,
      pages,
      ownershipDefault: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      enforceOwnership: true,
      overwritePages: Boolean(syncPages)
    });

    if (notify) {
      ui.notifications.info(`SLA Vehicles & Chases guide ready with ${pages.length} searchable sections.`);
    }

    return { ok: true, entry, pages: pages.length };
  }

  static async ensureNpcAdversaryJournal({ notify = false, syncPages = true } = {}) {
    if (!this._isGM()) {
      return { ok: false, reason: "not-gm" };
    }

    const markdown = await this._loadNpcAdversaryMarkdown();
    const pages = this._buildNpcAdversaryPagesFromMarkdown(markdown);
    const entry = await this._ensureJournalWithPages({
      name: this.NPC_ADVERSARY_JOURNAL_NAME,
      pages,
      ownershipDefault: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
      enforceOwnership: true,
      overwritePages: Boolean(syncPages)
    });

    if (notify) {
      ui.notifications.info(`SLA NPC/adversary guide ready with ${pages.length} searchable sections.`);
    }

    return { ok: true, entry, pages: pages.length };
  }

  static async ensureCoreJournals({ notify = true } = {}) {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can create BPN journals.");
      return { ok: false, reason: "not-gm" };
    }

    const corePages = [
      { name: "BPN Colour Codes", type: "text", text: this._journalHtml(this.getColourCodesPageHtml()) },
      { name: "BPN Template", type: "text", text: this._journalHtml(this.getTemplatePageHtml()) },
      { name: "SOLO BPN GENERATION", type: "text", text: this._journalHtml(this.getSoloGenerationPageHtml()) }
    ];
    const templatePages = [
      { name: "BPN Template", type: "text", text: this._journalHtml(`<pre>${this._escapeHtml(this.getPlayerTemplate())}</pre>`) }
    ];
    const extendedPages = [
      { name: "HOW TO USE IN FOUNDRY", type: "text", text: this._journalHtml(this.getExtendedUsagePageHtml()) },
      { name: "COLOUR-THEMED MISSION IDEAS", type: "text", text: this._journalHtml(this.getColourMissionIdeasPageHtml()) },
      { name: "NPC TYPE & MOTIVE LISTS", type: "text", text: this._journalHtml(this.getNpcMotivesPageHtml()) },
      { name: "ENVIRONMENTAL DETAILS", type: "text", text: this._journalHtml(this.getEnvironmentPageHtml()) },
      { name: "OBJECTIVES & COMPLICATIONS", type: "text", text: this._journalHtml(this.getObjectivesEscalationPageHtml()) }
    ];
    const completePages = [
      { name: "Page 1 - Colour Code Reference", type: "text", text: this._journalHtml(this.getColourCodesPageHtml()) },
      { name: "Page 2 - BPN Template", type: "text", text: this._journalHtml(this.getTemplatePageHtml()) },
      { name: "Page 3 - TABLE 1 BPN COLOUR", type: "text", text: this._journalHtml(this.getColourRollTablePageHtml()) },
      { name: "Page 4 - TABLE 2 MISSION FOCUS", type: "text", text: this._journalHtml(this.getMissionFocusTablePageHtml()) },
      { name: "Page 5 - TABLE 3 LOCATION", type: "text", text: this._journalHtml(this.getLocationTablePageHtml()) },
      { name: "Page 6 - TABLE 4 OPPOSITION", type: "text", text: this._journalHtml(this.getOppositionTablePageHtml()) },
      { name: "Page 7 - TABLE 5 COMPLICATION", type: "text", text: this._journalHtml(this.getComplicationTablePageHtml()) },
      { name: "Page 8 - TABLE 6 CONTACT", type: "text", text: this._journalHtml(this.getContactTablePageHtml()) },
      { name: "Page 9 - TABLE 7 ATMOSPHERE", type: "text", text: this._journalHtml(this.getAtmosphereTablePageHtml()) },
      { name: "Page 10 - TABLE 8 ESCALATION", type: "text", text: this._journalHtml(this.getEscalationTablePageHtml()) },
      { name: "Page 11 - TABLE 9 EXTRA OBJECTIVES", type: "text", text: this._journalHtml(this.getExtraObjectivesTablePageHtml()) },
      { name: "Page 12 - TABLE 10 REWARD CALCULATOR", type: "text", text: this._journalHtml(this.getRewardCalculatorPageHtml()) },
      { name: "Page 13 - SOLO PLAY PROCEDURE", type: "text", text: this._journalHtml(this.getSoloPlayProcedurePageHtml()) }
    ];
    const equipmentPages = [
      { name: "00 - Overview", type: "text", text: this._journalHtml(this.getEquipmentOverviewPageHtml()) },
      ...this.EQUIPMENT_CATEGORIES.map((category, index) => ({
        name: `${String(index + 1).padStart(2, "0")} - ${category.title}`,
        type: "text",
        text: this._journalHtml(this._equipmentCategoryPageHtml(category))
      })),
      { name: "90 - Starting Packages", type: "text", text: this._journalHtml(this.getEquipmentLoadoutsPageHtml()) },
      { name: "91 - Availability & Maintenance", type: "text", text: this._journalHtml(this.getEquipmentAvailabilityPageHtml()) }
    ];

    const core = await this._ensureJournalWithPages({
      name: this.CORE_JOURNAL_NAME,
      pages: corePages,
      ownershipDefault: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
    });
    const template = await this._ensureJournalWithPages({
      name: this.TEMPLATE_JOURNAL_NAME,
      pages: templatePages,
      ownershipDefault: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
    });
    const extended = await this._ensureJournalWithPages({
      name: this.EXTENDED_DATA_JOURNAL_NAME,
      pages: extendedPages,
      ownershipDefault: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
    });
    const complete = await this._ensureJournalWithPages({
      name: this.COMPLETE_JOURNAL_NAME,
      pages: completePages,
      ownershipDefault: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
    });
    const equipment = await this._ensureJournalWithPages({
      name: this.EQUIPMENT_JOURNAL_NAME,
      pages: equipmentPages,
      ownershipDefault: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
    });
    const rulebook = await this.ensureRulebookJournal({ notify: false, syncPages: true });
    const vehicles = await this.ensureVehicleChaseJournal({ notify: false, syncPages: true });
    const npcs = await this.ensureNpcAdversaryJournal({ notify: false, syncPages: true });

    if (notify) {
      ui.notifications.info("SLA journals are ready: BPN toolkit, equipment catalogue, rulebook, vehicles/chases guide, and NPC dossier.");
    }
    return {
      ok: true,
      core,
      template,
      extended,
      complete,
      equipment,
      rulebook: rulebook?.entry ?? null,
      vehicles: vehicles?.entry ?? null,
      npcs: npcs?.entry ?? null
    };
  }

  static _objectiveFromFocus(focusText = "") {
    const text = String(focusText ?? "").toLowerCase();
    if (text.includes("eliminate")) return "Neutralise the designated threat and confirm status.";
    if (text.includes("escort") || text.includes("protect")) return "Ensure the protected asset reaches destination alive and intact.";
    if (text.includes("retrieve")) return "Recover the designated item/data/specimen and return chain of custody proof.";
    if (text.includes("investigate")) return "Identify culprit(s), secure evidence, and produce admissible corporate findings.";
    if (text.includes("contain") || text.includes("quarantine")) return "Lock down and contain spread before it crosses sector boundaries.";
    if (text.includes("crowd") || text.includes("riot")) return "Restore order and keep casualties/media fallout within acceptable thresholds.";
    if (text.includes("hunt")) return "Track, isolate, and capture or terminate the named target.";
    if (text.includes("clean up")) return "Recover all traces of the prior SLA incident before public disclosure.";
    if (text.includes("covert")) return "Complete operation with minimal witness and media signatures.";
    if (text.includes("pr")) return "Deliver mission success while maximizing approved live-feed value.";
    if (text.includes("patrol")) return "Maintain control of the designated zone and deter escalation.";
    if (text.includes("guard") || text.includes("secure a facility")) return "Hold the assigned site until command confirms operation complete.";
    if (text.includes("surveillance")) return "Plant or recover the surveillance package without exposure.";
    if (text.includes("negotiate") || text.includes("mediate")) return "Secure agreement terms while preserving SLA authority and image.";
    if (text.includes("sabotage") || text.includes("destroy")) return "Disable the target and remove traceable SLA linkage.";
    if (text.includes("research team")) return "Escort research personnel to objective point and extract them intact.";
    return "Complete assigned contract objective and report all outcomes.";
  }

  static _cleanupDirectiveFromColour(colourKey = "blue") {
    const key = String(colourKey ?? "blue").toLowerCase();
    if (key === "blue") return "Sanitise the area and restore basic street function before handoff.";
    if (key === "yellow") return "Recover target item/person intact and file complete chain-of-custody.";
    if (key === "white") return "Secure evidence, witness logs, and a coherent investigative report.";
    if (key === "silver") return "Deliver a controlled public statement and preserve sponsor-safe optics.";
    if (key === "jade") return "Contain contamination and submit sealed sample packets to Karma.";
    if (key === "red") return "Stabilise the zone and produce a camera-ready emergency narrative.";
    if (key === "black") return "Remove traces, minimize witnesses, and suppress all operational signatures.";
    if (key === "platinum") return "Preserve classification and return all mission records to Head Office only.";
    if (key === "orange") return "Purge cult indicators and isolate all occult evidence from public channels.";
    return "Recover evidence, suppress compromising exposure, and file command-ready debrief.";
  }

  static _formatScl(value = 0) {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number)) return "+0.0";
    const fixed = Math.abs(number) >= 1 ? number.toFixed(1) : number.toFixed(2);
    const trimmed = fixed.replace(/\.?0+$/, "");
    return `${number >= 0 ? "+" : ""}${trimmed}`;
  }

  static _creditsFromRange(range = { min: 0, max: 0 }, tier = "mid") {
    const min = Number(range?.min ?? 0);
    const max = range?.max === null || range?.max === undefined ? null : Number(range.max);
    if (!Number.isFinite(min)) return "0c";
    if (max === null || !Number.isFinite(max)) {
      if (tier === "low") return `${Math.round(min)}c`;
      return `${Math.round(min)}c+`;
    }
    if (tier === "low") return `${Math.round(min)}c`;
    if (tier === "high") return `${Math.round(max)}c`;
    return `${Math.round((min + max) / 2)}c`;
  }

  static _tierFromRoll(roll = 1) {
    const n = Number(roll ?? 1);
    if (n <= 2) return "low";
    if (n <= 4) return "mid";
    return "high";
  }

  static _mediaFromRewardRoll(roll = 1) {
    const n = Number(roll ?? 1);
    if (n <= 1) return "None";
    if (n <= 3) return "Station Analysis";
    if (n <= 5) return "Third Eye News";
    return "GoreZone / Contract Circuit Special";
  }

  static _rewardPackageForColour(colour, input = {}) {
    const paymentTypeRoll = this._rollDie(6);
    const cbsTierRoll = this._rollDie(6);
    const sclTierRoll = this._rollDie(6);
    const mediaRoll = this._rollDie(6);

    const paymentType = input.paymentType && input.paymentType !== "__RANDOM__"
      ? String(input.paymentType)
      : (paymentTypeRoll <= 3 ? "Per Operative" : "Per Squad");
    const cbsTier = this._tierFromRoll(cbsTierRoll);
    const sclTier = this._tierFromRoll(sclTierRoll);

    const cbsPerOp = this._creditsFromRange(colour.cbsPerOpRange, cbsTier);
    const cbsPerSquad = this._creditsFromRange(colour.cbsPerSquadRange, cbsTier);
    const cbsValue = paymentType === "Per Operative" ? cbsPerOp : cbsPerSquad;

    const sclByTier = {
      low: Number(colour.sclRange?.min ?? 0.1),
      mid: Number(colour.sclRange?.typical ?? colour.sclRange?.min ?? 0.1),
      high: Number(colour.sclRange?.max ?? colour.sclRange?.typical ?? 0.2)
    };
    const sclIncreaseValue = this._formatScl(sclByTier[sclTier] ?? sclByTier.mid);

    const rolledMedia = this._mediaFromRewardRoll(mediaRoll);
    const mediaCoverage = input.mediaCoverage && input.mediaCoverage !== "__RANDOM__"
      ? String(input.mediaCoverage)
      : rolledMedia;

    return {
      paymentType,
      cbsTier,
      sclTier,
      cbsPerOp,
      cbsPerSquad,
      cbsValue,
      sclIncreaseValue,
      mediaCoverage,
      notes: "Financier cut applies (usually 10-20%) before final squad payout.",
      rolls: {
        paymentType: paymentTypeRoll,
        cbsTier: cbsTierRoll,
        sclTier: sclTierRoll,
        media: mediaRoll
      }
    };
  }

  static _buildGeneratedSeed(input = {}) {
    const colourChoice = String(input.colour ?? "__RANDOM__");
    const colorFromRoll = this._rollColourFromTable();
    const colour = colourChoice === "__RANDOM__" ? colorFromRoll.colour : this._colourByKey(colourChoice);

    const missionRoll = this._rollFromArray(this.MISSION_FOCUS);
    const locationRoll = this._rollFromArray(this.LOCATIONS);
    const oppositionRoll = this._rollFromArray(this.OPPOSITION);
    const complicationRoll = this._rollFromArray(this.COMPLICATIONS);
    const colourMissionIdeaRoll = this._rollColourMissionIdea(colour.key);
    const contactRoll = this._rollFromArray(this.CONTACTS);
    const civilianFactionRoll = this._rollFromArray(this.CIVILIAN_FACTIONS);
    const oppositionAttitudeRoll = this._rollFromArray(this.OPPOSITION_ATTITUDES);
    const atmosphereRoll = this._rollFromArray(this.ATMOSPHERES);
    const localTwistRoll = this._rollFromArray(this.LOCAL_TWISTS);
    const extraObjectiveRoll = this._rollFromArray(this.EXTRA_OBJECTIVES);
    const escalationEventRoll = this._rollFromArray(this.ESCALATION_EVENTS);

    const missionFocus = this._resolveSelection(input.missionFocus, missionRoll.value);
    const location = this._resolveSelection(input.location, locationRoll.value);
    const opposition = this._resolveSelection(input.opposition, oppositionRoll.value);
    const complication = this._resolveSelection(input.complication, complicationRoll.value);
    const colourMissionIdea = this._resolveSelection(input.colourMissionIdea, colourMissionIdeaRoll.value);
    const contact = this._resolveSelection(input.contact, contactRoll.value);
    const civilianFaction = this._resolveSelection(input.civilianFaction, civilianFactionRoll.value);
    const oppositionAttitude = this._resolveSelection(input.oppositionAttitude, oppositionAttitudeRoll.value);
    const atmosphere = this._resolveSelection(input.atmosphere, atmosphereRoll.value);
    const localTwist = this._resolveSelection(input.localTwist, localTwistRoll.value);
    const extraObjective = this._resolveSelection(input.extraObjective, extraObjectiveRoll.value);
    const escalationEvent = this._resolveSelection(input.escalationEvent, escalationEventRoll.value);
    const reward = this._rewardPackageForColour(colour, input);
    const media = String(reward.mediaCoverage || this.MEDIA_OPTIONS[0]);
    const shortTitle = String(input.shortTitle || "Untitled Contract").trim();
    const bpnId = String(input.bpnId || "SEC-OPS-000").trim();
    const issuingDepartment = String(input.issuingDepartment || "Mort Department / Ops Control").trim();
    const sclRequirement = String(input.sclRequirement || colour.sclReq || "SCL 5").trim();
    const squad = String(input.squad || "Assigned Operative Squad").trim();
    const colourMissionIdeaDie = (this.COLOUR_MISSION_IDEAS[colour.key] ?? []).length || this._allColourMissionIdeas().length;

    const missionBrief = String(input.missionBrief || "").trim() || [
      `Operatives are assigned a ${colour.label.toUpperCase()} BPN (${(colour.type ?? colour.summary ?? "").toLowerCase()}) focused on ${missionFocus.toLowerCase()}`,
      `Command emphasis: ${colourMissionIdea.toLowerCase()}`,
      `Primary theatre is ${location.toLowerCase()}`,
      `Expected resistance includes ${opposition.toLowerCase()}`,
      `Operational atmosphere reports ${atmosphere.toLowerCase()}`,
      `Head Office requires actionable footage and a clean narrative outcome.`
    ].join(". ") + ".";

    return {
      shortTitle,
      bpnId,
      colour,
      media,
      issuingDepartment,
      sclRequirement,
      squad,
      missionFocus,
      location,
      opposition,
      complication,
      colourMissionIdea,
      contact,
      civilianFaction,
      oppositionAttitude,
      atmosphere,
      localTwist,
      extraObjective,
      escalationEvent,
      reward,
      colourMissionIdeaDie,
      missionBrief,
      rolls: {
        colour: colorFromRoll.roll,
        missionFocus: missionRoll.roll,
        location: locationRoll.roll,
        opposition: oppositionRoll.roll,
        complication: complicationRoll.roll,
        colourMissionIdea: colourMissionIdeaRoll.roll,
        contact: contactRoll.roll,
        civilianFaction: civilianFactionRoll.roll,
        oppositionAttitude: oppositionAttitudeRoll.roll,
        atmosphere: atmosphereRoll.roll,
        localTwist: localTwistRoll.roll,
        extraObjective: extraObjectiveRoll.roll,
        escalationEvent: escalationEventRoll.roll,
        paymentType: reward.rolls?.paymentType ?? 1,
        cbsTier: reward.rolls?.cbsTier ?? 1,
        sclTier: reward.rolls?.sclTier ?? 1,
        media: reward.rolls?.media ?? 1
      }
    };
  }

  static _buildPlayerBpnHtml(seed) {
    const e = this._escapeHtml.bind(this);
    const primaryObjective = this._objectiveFromFocus(seed.missionFocus);
    const cleanupDirective = this._cleanupDirectiveFromColour(seed.colour?.key);
    const body = `
      <section class="sla-bpn-section">
        <h2>Mission Briefing Packet</h2>
        <div class="sla-bpn-grid">
          <p><strong>BPN ID</strong><span>${e(seed.bpnId)}</span></p>
          <p><strong>Colour Code</strong><span>${e(seed.colour.label)} - ${e(seed.colour.type ?? seed.colour.summary ?? "")}</span></p>
          <p><strong>Issuing Department</strong><span>${e(seed.issuingDepartment)}</span></p>
          <p><strong>SCL Requirement</strong><span>${e(seed.sclRequirement)}</span></p>
          <p><strong>Squad</strong><span>${e(seed.squad)}</span></p>
          <p><strong>Media Coverage</strong><span>${e(seed.media)}</span></p>
          <p><strong>SCL Increase</strong><span>${e(seed.reward?.sclIncreaseValue ?? "n/a")}</span></p>
          <p><strong>CBS</strong><span>${e(seed.reward?.cbsValue ?? "n/a")} (${e(seed.reward?.paymentType ?? "Per Operative")})</span></p>
        </div>
      </section>
      <section class="sla-bpn-section">
        <h2>Mission Brief</h2>
        <p>${e(seed.missionBrief)}</p>
        <p><strong>Colour Mission Hook:</strong> ${e(seed.colourMissionIdea)}</p>
      </section>
      <section class="sla-bpn-section">
        <h2>Objectives</h2>
        <ol>
          <li><strong>Primary Objective:</strong> ${e(primaryObjective)}</li>
          <li><strong>Secondary Objective:</strong> ${e(seed.extraObjective)}</li>
          <li><strong>Cleanup / Evidence / PR:</strong> ${e(cleanupDirective)}</li>
        </ol>
      </section>
      <section class="sla-bpn-section">
        <h2>Location & Conditions</h2>
        <p><strong>Primary Location:</strong> ${e(seed.location)}</p>
        <p><strong>Local Conditions:</strong> ${e(seed.atmosphere)}</p>
        <p><strong>Complications:</strong> ${e(seed.complication)}</p>
        <p><strong>Local Twist:</strong> ${e(seed.localTwist)}</p>
        <p><strong>Civilian Faction:</strong> ${e(seed.civilianFaction)}</p>
      </section>
      <section class="sla-bpn-section">
        <h2>Opposition</h2>
        <p><strong>Expected Threats:</strong> ${e(seed.opposition)}</p>
        <p><strong>Opposition Attitude:</strong> ${e(seed.oppositionAttitude)}</p>
        <p><strong>Escalation:</strong> ${e(seed.escalationEvent)}</p>
        <p><strong>BRP Hooks:</strong> GM applies situational Spot/Listen/Stealth mods and armour tier changes by threat zone.</p>
      </section>
      <section class="sla-bpn-section">
        <h2>Contact</h2>
        <p><strong>On-Site Contact:</strong> ${e(seed.contact)}</p>
      </section>
      <section class="sla-bpn-section">
        <h2>Resources & Constraints</h2>
        <p><strong>Authorised Support:</strong> Shivers liaison, approved armoury draw, comms relay, and limited drone overwatch.</p>
        <p><strong>Restrictions:</strong> Minimise collateral, preserve approved media narrative, and avoid unsanctioned escalation.</p>
        <p><strong>Time Limit:</strong> Complete before command revokes operation window.</p>
      </section>
      <section class="sla-bpn-section">
        <h2>Payment</h2>
        <p><strong>CBS (Per Operative Range):</strong> ${e(seed.colour.cbsPerOp ?? "n/a")}</p>
        <p><strong>CBS (Per Squad Range):</strong> ${e(seed.colour.cbsPerSquad ?? "n/a")}</p>
        <p><strong>Calculated CBS:</strong> ${e(seed.reward?.cbsValue ?? "n/a")} (${e(seed.reward?.paymentType ?? "Per Operative")})</p>
        <p><strong>SCL Reward:</strong> ${e(seed.reward?.sclIncreaseValue ?? "n/a")}</p>
        <p><strong>Financier Note:</strong> ${e(seed.reward?.notes ?? "")}</p>
        <p><strong>Bonus:</strong> Performance bounties for high-value recoveries and sponsor-safe live-feed moments.</p>
      </section>
    `;
    return this._wrapBpnDocument({
      title: `${seed.colour.label.toUpperCase()} BPN - ${seed.shortTitle}`,
      kicker: "SLA INDUSTRIES // LIVE CONTRACT FEED",
      body
    });
  }

  static _buildGmDebriefHtml(seed, playerEntryUuid = "") {
    const e = this._escapeHtml.bind(this);
    const playerLink = playerEntryUuid ? `@UUID[${playerEntryUuid}]{Player BPN Journal}` : "Player BPN Journal";
    return this._wrapBpnDocument({
      title: "Debriefing Notes (GM-Only)",
      kicker: "SLA INDUSTRIES // RESTRICTED INTEL",
      gm: true,
      body: `
        <section class="sla-bpn-section">
          <p><strong>Linked Player Brief:</strong> ${playerLink}</p>
          <p><strong>True Motive:</strong> [Fill with hidden sponsor/department motive.]</p>
          <p><strong>Secret Agendas:</strong> [Add faction agendas, traitors, or rival squad manipulation.]</p>
          <p><strong>Metaplot Hooks:</strong> [Insert Truth/Karma/Dream entities hooks if needed.]</p>
          <p><strong>Operational Twist:</strong> [Define reveal timing and trigger conditions.]</p>
        </section>
        <section class="sla-bpn-section">
          <h2>Generated Seed</h2>
          <ul>
            <li><strong>Colour:</strong> ${e(seed.colour.label)} (d20: ${Number(seed.rolls?.colour ?? 0)})</li>
            <li><strong>Mission Focus:</strong> ${e(seed.missionFocus)} (d20: ${Number(seed.rolls?.missionFocus ?? 0)})</li>
            <li><strong>Colour Mission Hook:</strong> ${e(seed.colourMissionIdea)} (d${Number(seed.colourMissionIdeaDie ?? 12)}: ${Number(seed.rolls?.colourMissionIdea ?? 0)})</li>
            <li><strong>Location:</strong> ${e(seed.location)} (d20: ${Number(seed.rolls?.location ?? 0)})</li>
            <li><strong>Atmosphere:</strong> ${e(seed.atmosphere)} (d12: ${Number(seed.rolls?.atmosphere ?? 0)})</li>
            <li><strong>Local Twist:</strong> ${e(seed.localTwist)} (d10: ${Number(seed.rolls?.localTwist ?? 0)})</li>
            <li><strong>Opposition:</strong> ${e(seed.opposition)} (d20: ${Number(seed.rolls?.opposition ?? 0)})</li>
            <li><strong>Opposition Attitude:</strong> ${e(seed.oppositionAttitude)} (d8: ${Number(seed.rolls?.oppositionAttitude ?? 0)})</li>
            <li><strong>Contact:</strong> ${e(seed.contact)} (d12: ${Number(seed.rolls?.contact ?? 0)})</li>
            <li><strong>Civilian Faction:</strong> ${e(seed.civilianFaction)} (d10: ${Number(seed.rolls?.civilianFaction ?? 0)})</li>
            <li><strong>Extra Objective:</strong> ${e(seed.extraObjective)} (d12: ${Number(seed.rolls?.extraObjective ?? 0)})</li>
            <li><strong>Complication:</strong> ${e(seed.complication)} (d20: ${Number(seed.rolls?.complication ?? 0)})</li>
            <li><strong>Escalation Event:</strong> ${e(seed.escalationEvent)} (d12: ${Number(seed.rolls?.escalationEvent ?? 0)})</li>
            <li><strong>Payment Type:</strong> ${e(seed.reward?.paymentType ?? "")} (d6: ${Number(seed.rolls?.paymentType ?? 0)})</li>
            <li><strong>CBS Tier:</strong> ${e(seed.reward?.cbsTier ?? "")} (d6: ${Number(seed.rolls?.cbsTier ?? 0)})</li>
            <li><strong>SCL Tier:</strong> ${e(seed.reward?.sclTier ?? "")} (d6: ${Number(seed.rolls?.sclTier ?? 0)})</li>
            <li><strong>Media Roll:</strong> ${e(seed.reward?.mediaCoverage ?? "")} (d6: ${Number(seed.rolls?.media ?? 0)})</li>
          </ul>
        </section>
      `
    });
  }

  static async createBpnJournals(input = {}) {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can create BPN journals.");
      return { ok: false, reason: "not-gm" };
    }

    await this.ensureCoreJournals({ notify: false });

    const seed = this._buildGeneratedSeed(input);
    const playerVisible = Boolean(input.playerVisible ?? true);
    const playerName = `${seed.colour.label.toUpperCase()} BPN - ${seed.shortTitle}`;

    const playerEntry = await JournalEntry.create({
      name: playerName,
      ownership: {
        default: playerVisible
          ? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
          : CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
      },
      pages: [
        {
          name: "Mission Brief",
          type: "text",
          text: this._journalHtml(this._buildPlayerBpnHtml(seed))
        }
      ]
    }, { renderSheet: false });

    const gmEntry = await JournalEntry.create({
      name: `${playerName} - GM Debrief`,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
      pages: [
        {
          name: "GM Debriefing Notes",
          type: "text",
          text: this._journalHtml(this._buildGmDebriefHtml(seed, playerEntry?.uuid ?? ""))
        }
      ]
    }, { renderSheet: false });

    if (playerEntry?.sheet) {
      playerEntry.sheet.render(true);
    }

    ui.notifications.info(`Created BPN journals: "${playerName}" and GM debrief.`);
    return { ok: true, seed, playerEntry, gmEntry };
  }

  static async promptCreateBpn({ randomizeDefaults = true } = {}) {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can create BPN journals.");
      return { ok: false, reason: "not-gm" };
    }

    const colourOptions = [`<option value="__RANDOM__">Random (d20 table)</option>`]
      .concat(this._allColours().map((colour) => `<option value="${this._escapeHtml(colour.key)}">${this._escapeHtml(colour.label)} - ${this._escapeHtml(colour.summary)}</option>`))
      .join("");

    const missionOptions = [`<option value="__RANDOM__">Random (d20)</option>`]
      .concat(this.MISSION_FOCUS.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const locationOptions = [`<option value="__RANDOM__">Random (d20)</option>`]
      .concat(this.LOCATIONS.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const oppositionOptions = [`<option value="__RANDOM__">Random (d20)</option>`]
      .concat(this.OPPOSITION.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const complicationOptions = [`<option value="__RANDOM__">Random (d20)</option>`]
      .concat(this.COMPLICATIONS.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const colourMissionIdeaOptions = [`<option value="__RANDOM__">Random (match selected/rolled colour)</option>`]
      .concat(
        this._allColourMissionIdeas().map(
          (entry) => `<option value="${this._escapeHtml(entry.value)}">${this._escapeHtml(entry.label)}: ${this._escapeHtml(entry.value)}</option>`
        )
      )
      .join("");

    const contactOptions = [`<option value="__RANDOM__">Random (d12)</option>`]
      .concat(this.CONTACTS.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const civilianFactionOptions = [`<option value="__RANDOM__">Random (d10)</option>`]
      .concat(this.CIVILIAN_FACTIONS.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const oppositionAttitudeOptions = [`<option value="__RANDOM__">Random (d8)</option>`]
      .concat(this.OPPOSITION_ATTITUDES.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const atmosphereOptions = [`<option value="__RANDOM__">Random (d12)</option>`]
      .concat(this.ATMOSPHERES.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const localTwistOptions = [`<option value="__RANDOM__">Random (d10)</option>`]
      .concat(this.LOCAL_TWISTS.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const extraObjectiveOptions = [`<option value="__RANDOM__">Random (d12)</option>`]
      .concat(this.EXTRA_OBJECTIVES.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const escalationEventOptions = [`<option value="__RANDOM__">Random (d12)</option>`]
      .concat(this.ESCALATION_EVENTS.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");

    const mediaOptions = [`<option value="__RANDOM__">Random (reward d6 table)</option>`]
      .concat(this.MEDIA_OPTIONS.map((value) => `<option value="${this._escapeHtml(value)}">${this._escapeHtml(value)}</option>`))
      .join("");
    const paymentTypeOptions = [
      `<option value="__RANDOM__">Random (d6 table)</option>`,
      `<option value="Per Operative">Per Operative</option>`,
      `<option value="Per Squad">Per Squad</option>`
    ].join("");

    const content = `
      <form class="brp" id="sla-bpn-create-form">
        <div class="flexcol">
          <div class="flexrow"><label>Short Title</label><input name="shortTitle" type="text" value="Sector Sweep" /></div>
          <div class="flexrow"><label>BPN ID</label><input name="bpnId" type="text" value="SEC-OPS-001" /></div>
          <div class="flexrow"><label>Colour Code</label><select name="colour">${colourOptions}</select></div>
          <div class="flexrow"><label>Issuing Department</label><input name="issuingDepartment" type="text" value="Mort Department / Ops Control" /></div>
          <div class="flexrow"><label>SCL Requirement</label><input name="sclRequirement" type="text" value="" placeholder="Auto from colour if blank" /></div>
          <div class="flexrow"><label>Squad</label><input name="squad" type="text" value="Assigned Operative Squad" /></div>
          <div class="flexrow"><label>Media Coverage</label><select name="mediaCoverage">${mediaOptions}</select></div>
          <div class="flexrow"><label>Payment Type</label><select name="paymentType">${paymentTypeOptions}</select></div>
          <hr />
          <div class="flexrow"><label>Mission Focus</label><select name="missionFocus">${missionOptions}</select></div>
          <div class="flexrow"><label>Location</label><select name="location">${locationOptions}</select></div>
          <div class="flexrow"><label>Opposition</label><select name="opposition">${oppositionOptions}</select></div>
          <div class="flexrow"><label>Complication</label><select name="complication">${complicationOptions}</select></div>
          <div class="flexrow"><label>Colour Mission Hook</label><select name="colourMissionIdea">${colourMissionIdeaOptions}</select></div>
          <div class="flexrow"><label>Contact</label><select name="contact">${contactOptions}</select></div>
          <div class="flexrow"><label>Civilian Faction</label><select name="civilianFaction">${civilianFactionOptions}</select></div>
          <div class="flexrow"><label>Opposition Attitude</label><select name="oppositionAttitude">${oppositionAttitudeOptions}</select></div>
          <div class="flexrow"><label>Atmosphere</label><select name="atmosphere">${atmosphereOptions}</select></div>
          <div class="flexrow"><label>Local Twist</label><select name="localTwist">${localTwistOptions}</select></div>
          <div class="flexrow"><label>Extra Objective</label><select name="extraObjective">${extraObjectiveOptions}</select></div>
          <div class="flexrow"><label>Escalation Event</label><select name="escalationEvent">${escalationEventOptions}</select></div>
          <div class="flexrow"><label>Mission Brief (optional)</label><input name="missionBrief" type="text" value="" /></div>
          <div class="flexrow"><label>Players can view briefing</label><input name="playerVisible" type="checkbox" ${randomizeDefaults ? "checked" : ""} /></div>
        </div>
      </form>
    `;

    const formData = await SLADialog.waitForm({
      title: "Create BPN",
      content,
      formSelector: "#sla-bpn-create-form",
      submitLabel: "Create BPN",
      cancelLabel: "Cancel",
      cancelValue: false
    });
    if (!formData) return { ok: false, reason: "cancelled" };
    return this.createBpnJournals({
      shortTitle: String(formData.get("shortTitle") ?? ""),
      bpnId: String(formData.get("bpnId") ?? ""),
      colour: String(formData.get("colour") ?? "__RANDOM__"),
      issuingDepartment: String(formData.get("issuingDepartment") ?? ""),
      sclRequirement: String(formData.get("sclRequirement") ?? ""),
      squad: String(formData.get("squad") ?? ""),
      mediaCoverage: String(formData.get("mediaCoverage") ?? "None"),
      paymentType: String(formData.get("paymentType") ?? "__RANDOM__"),
      missionFocus: String(formData.get("missionFocus") ?? "__RANDOM__"),
      location: String(formData.get("location") ?? "__RANDOM__"),
      opposition: String(formData.get("opposition") ?? "__RANDOM__"),
      complication: String(formData.get("complication") ?? "__RANDOM__"),
      colourMissionIdea: String(formData.get("colourMissionIdea") ?? "__RANDOM__"),
      contact: String(formData.get("contact") ?? "__RANDOM__"),
      civilianFaction: String(formData.get("civilianFaction") ?? "__RANDOM__"),
      oppositionAttitude: String(formData.get("oppositionAttitude") ?? "__RANDOM__"),
      atmosphere: String(formData.get("atmosphere") ?? "__RANDOM__"),
      localTwist: String(formData.get("localTwist") ?? "__RANDOM__"),
      extraObjective: String(formData.get("extraObjective") ?? "__RANDOM__"),
      escalationEvent: String(formData.get("escalationEvent") ?? "__RANDOM__"),
      missionBrief: String(formData.get("missionBrief") ?? ""),
      playerVisible: formData.get("playerVisible") !== null
    });
  }

  static async createQuickRandomBpn() {
    return this.createBpnJournals({
      shortTitle: `Contract ${this._rollDie(999).toString().padStart(3, "0")}`,
      bpnId: `SEC-OPS-${this._rollDie(999).toString().padStart(3, "0")}`,
      colour: "__RANDOM__",
      missionFocus: "__RANDOM__",
      location: "__RANDOM__",
      opposition: "__RANDOM__",
      complication: "__RANDOM__",
      mediaCoverage: "__RANDOM__",
      paymentType: "__RANDOM__",
      playerVisible: true
    });
  }

  static async openEquipmentCatalogue({ ensure = true, notify = false } = {}) {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can open the equipment catalogue.");
      return { ok: false, reason: "not-gm" };
    }
    if (ensure) {
      await this.ensureCoreJournals({ notify });
    }
    const entry = await this._findJournalByName(this.EQUIPMENT_JOURNAL_NAME);
    if (!entry) {
      ui.notifications.warn("Equipment catalogue journal not found.");
      return { ok: false, reason: "not-found" };
    }
    entry.sheet?.render(true);
    return { ok: true, entry };
  }

  static async openRulebook({ ensure = true, notify = false } = {}) {
    let entry = await this._findJournalByName(this.RULEBOOK_JOURNAL_NAME);
    if (!entry && ensure && this._isGM()) {
      const result = await this.ensureRulebookJournal({ notify, syncPages: true });
      entry = result?.entry ?? null;
    }
    if (!entry) {
      ui.notifications.warn("SLA Rulebook journal is not available yet. A GM can create it from the toolkit.");
      return { ok: false, reason: "not-found" };
    }

    const canView = entry.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER);
    if (!canView) {
      ui.notifications.warn("You do not have permission to view the SLA Rulebook.");
      return { ok: false, reason: "not-permitted" };
    }

    entry.sheet?.render(true);
    return { ok: true, entry };
  }

  static async openVehicleChaseJournal({ ensure = true, notify = false } = {}) {
    let entry = await this._findJournalByName(this.VEHICLE_CHASE_JOURNAL_NAME);
    if (!entry && ensure && this._isGM()) {
      const result = await this.ensureVehicleChaseJournal({ notify, syncPages: true });
      entry = result?.entry ?? null;
    }
    if (!entry) {
      ui.notifications.warn("SLA Vehicles & Chases journal is not available yet. A GM can create it from the toolkit.");
      return { ok: false, reason: "not-found" };
    }

    const canView = entry.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER);
    if (!canView) {
      ui.notifications.warn("You do not have permission to view Vehicles & Chases.");
      return { ok: false, reason: "not-permitted" };
    }

    entry.sheet?.render(true);
    return { ok: true, entry };
  }

  static async openNpcAdversaryJournal({ ensure = true, notify = false } = {}) {
    let entry = await this._findJournalByName(this.NPC_ADVERSARY_JOURNAL_NAME);
    if (!entry && ensure && this._isGM()) {
      const result = await this.ensureNpcAdversaryJournal({ notify, syncPages: true });
      entry = result?.entry ?? null;
    }
    if (!entry) {
      ui.notifications.warn("SLA NPC/adversary journal is not available yet. A GM can create it from the toolkit.");
      return { ok: false, reason: "not-found" };
    }

    const canView = entry.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER);
    if (!canView) {
      ui.notifications.warn("You do not have permission to view the NPC/adversary journal.");
      return { ok: false, reason: "not-permitted" };
    }

    entry.sheet?.render(true);
    return { ok: true, entry };
  }

  static _normaliseRollEdge(edge = "normal") {
    const value = String(edge ?? "normal").trim().toLowerCase();
    if (["advantage", "adv", "easy"].includes(value)) return "advantage";
    if (["disadvantage", "dis", "difficult", "hard", "extreme", "impossible"].includes(value)) return "disadvantage";
    return "normal";
  }

  static _rollFormulaForEdge(edge = "normal") {
    const mode = this._normaliseRollEdge(edge);
    if (mode === "advantage") return "1D100";
    if (mode === "disadvantage") return "1D100";
    return "1D100";
  }

  static _edgeLabel(edge = "normal") {
    const mode = this._normaliseRollEdge(edge);
    if (mode === "advantage") return "Advantage";
    if (mode === "disadvantage") return "Disadvantage";
    return "Normal";
  }

  static _resultLevelFromRoll(targetScore = 50, rollVal = 100) {
    const target = Math.max(1, Math.min(100, Math.round(Number(targetScore ?? 50) || 50)));
    const roll = Math.max(1, Math.min(100, Math.round(Number(rollVal ?? 100) || 100)));
    const critChance = Math.ceil(0.05 * target);
    const specialChance = Math.round(0.2 * target);
    const successChance = Math.min(target, 95);
    const fumbleChance = Math.min(95 + critChance, 100);

    if (roll <= critChance) return 4;
    if (roll <= specialChance) return 3;
    if (roll <= successChance) return 2;
    if (roll >= fumbleChance) return 0;
    return 1;
  }

  static _resultLevelLabel(level = 1) {
    const labels = {
      0: "Fumble",
      1: "Failure",
      2: "Success",
      3: "Special",
      4: "Critical"
    };
    return labels[Number(level)] ?? "Failure";
  }

  static _clampPercent(value = 0) {
    const num = Number(value ?? 0);
    if (!Number.isFinite(num)) return 1;
    return Math.max(1, Math.min(100, Math.round(num)));
  }

  static _unitsDigitFromPercentile(rollVal = 100) {
    const value = Math.max(1, Math.min(100, Number(rollVal ?? 100) || 100));
    return value % 10;
  }

  static _tensDigitFromD10(rollVal = 10) {
    const value = Number(rollVal ?? 10);
    if (!Number.isFinite(value)) return 0;
    return ((value % 10) + 10) % 10;
  }

  static _percentileFromDigits(tensDigit = 0, unitsDigit = 0) {
    const tens = Math.max(0, Math.min(9, Number(tensDigit ?? 0) || 0));
    const units = Math.max(0, Math.min(9, Number(unitsDigit ?? 0) || 0));
    if (tens === 0 && units === 0) return 100;
    return (tens * 10) + units;
  }

  static async _rollChasePercent({ target = 50, edge = "normal" } = {}) {
    const resolvedTarget = this._clampPercent(target);
    const edgeMode = this._normaliseRollEdge(edge);
    const formula = this._rollFormulaForEdge(edgeMode);
    const baseRoll = await new Roll("1D100").evaluate();
    const base = this._clampPercent(baseRoll.total);
    const unitsDigit = this._unitsDigitFromPercentile(base);
    let tensRaw = null;
    let tensDigit = null;
    let candidate = base;
    if (edgeMode !== "normal") {
      const tensRoll = await new Roll("1D10").evaluate();
      tensRaw = Number(tensRoll.total ?? 10);
      tensDigit = this._tensDigitFromD10(tensRaw);
      candidate = this._percentileFromDigits(tensDigit, unitsDigit);
    }
    const kept = edgeMode === "advantage"
      ? Math.min(base, candidate)
      : edgeMode === "disadvantage"
        ? Math.max(base, candidate)
        : base;
    const resultLevel = this._resultLevelFromRoll(resolvedTarget, kept);
    const values = edgeMode === "normal" ? [base] : [base, candidate];
    const detail = edgeMode === "normal"
      ? `${kept}`
      : `${base} | d10:${tensRaw} => ${candidate} | keep ${kept}`;
    return {
      edgeMode,
      edgeLabel: this._edgeLabel(edgeMode),
      target: resolvedTarget,
      formula,
      roll: baseRoll,
      values,
      kept,
      detail,
      resultLevel,
      resultLabel: this._resultLevelLabel(resultLevel)
    };
  }

  static _rangeBandIndex(label = "Close") {
    const key = String(label ?? "").trim().toLowerCase();
    const index = this.CHASE_RANGE_BANDS.findIndex((entry) => entry.toLowerCase() === key);
    return index >= 0 ? index : 1;
  }

  static _shiftRangeBand(currentBand = "Close", direction = null, steps = 1) {
    const current = this._rangeBandIndex(currentBand);
    const delta = Math.max(0, Number(steps ?? 1) || 1);
    if (direction === "toward-engaged") {
      return this.CHASE_RANGE_BANDS[Math.max(0, current - delta)];
    }
    if (direction === "toward-lost") {
      return this.CHASE_RANGE_BANDS[Math.min(this.CHASE_RANGE_BANDS.length - 1, current + delta)];
    }
    return this.CHASE_RANGE_BANDS[current];
  }

  static _compareChaseRolls(pursuerResult, quarryResult) {
    const pLevel = Number(pursuerResult?.resultLevel ?? 1);
    const qLevel = Number(quarryResult?.resultLevel ?? 1);
    if (pLevel !== qLevel) {
      return pLevel > qLevel ? "pursuer" : "quarry";
    }
    const pRoll = Number(pursuerResult?.kept ?? 0);
    const qRoll = Number(quarryResult?.kept ?? 0);
    if (pRoll === qRoll) return "tie";
    return pRoll > qRoll ? "pursuer" : "quarry";
  }

  static _approachLabel(key = "neutral") {
    return this.CHASE_APPROACHES[String(key ?? "neutral").toLowerCase()] ?? "Neutral";
  }

  static _chaseResolutionDirection({ winner = "tie", pursuerApproach = "neutral", quarryApproach = "neutral" } = {}) {
    if (winner === "pursuer" && String(pursuerApproach ?? "").toLowerCase() === "aggressive") return "toward-engaged";
    if (winner === "quarry" && String(quarryApproach ?? "").toLowerCase() === "evasive") return "toward-lost";
    return null;
  }

  static async resolveChaseRound({
    sceneLabel = "",
    currentBand = "Close",
    pursuerName = "Pursuer",
    quarryName = "Quarry",
    pursuerApproach = "aggressive",
    quarryApproach = "evasive",
    pursuerBaseTarget = 50,
    pursuerModifier = 0,
    pursuerEdge = "normal",
    quarryBaseTarget = 50,
    quarryModifier = 0,
    quarryEdge = "normal",
    surgeOnHighTier = true,
    postToChat = true
  } = {}) {
    const pBase = this._clampPercent(pursuerBaseTarget);
    const qBase = this._clampPercent(quarryBaseTarget);
    const pMod = Number(pursuerModifier ?? 0) || 0;
    const qMod = Number(quarryModifier ?? 0) || 0;
    const pFinal = this._clampPercent(pBase + pMod);
    const qFinal = this._clampPercent(qBase + qMod);

    const pursuerRoll = await this._rollChasePercent({ target: pFinal, edge: pursuerEdge });
    const quarryRoll = await this._rollChasePercent({ target: qFinal, edge: quarryEdge });
    const winner = this._compareChaseRolls(pursuerRoll, quarryRoll);
    const direction = this._chaseResolutionDirection({ winner, pursuerApproach, quarryApproach });
    const winnerLevel = winner === "pursuer" ? pursuerRoll.resultLevel : winner === "quarry" ? quarryRoll.resultLevel : 1;
    const stepCount = direction && surgeOnHighTier && winnerLevel >= 3 ? 2 : 1;
    const newBand = this._shiftRangeBand(currentBand, direction, stepCount);

    const winnerName = winner === "pursuer"
      ? pursuerName
      : winner === "quarry"
        ? quarryName
        : "Tie";
    const directionLabel = direction === "toward-engaged"
      ? "toward Engaged"
      : direction === "toward-lost"
        ? "toward Lost"
        : "holds position";
    const surgeLabel = stepCount > 1 ? " (2-step surge)" : "";

    const safeSceneLabel = String(sceneLabel ?? "").trim();
    const chatHtml = this._journalHtml(this._wrapBpnDocument({
      title: "Chase Round Resolution",
      kicker: "SLA INDUSTRIES // CHASE CONTROL",
      body: `
        ${safeSceneLabel ? `<p><strong>Scene:</strong> ${this._escapeHtml(safeSceneLabel)}</p>` : ""}
        <p><strong>Band:</strong> ${this._escapeHtml(String(currentBand))} -> <strong>${this._escapeHtml(String(newBand))}</strong></p>
        <p><strong>Winner:</strong> ${this._escapeHtml(String(winnerName))} (${this._escapeHtml(directionLabel)}${this._escapeHtml(surgeLabel)})</p>
        <hr />
        <p><strong>${this._escapeHtml(String(pursuerName))}</strong> | Approach: ${this._escapeHtml(this._approachLabel(pursuerApproach))}</p>
        <p>Target ${this._escapeHtml(String(pBase))}% ${pMod >= 0 ? "+" : ""}${this._escapeHtml(String(pMod))} = <strong>${this._escapeHtml(String(pFinal))}%</strong> | Edge: ${this._escapeHtml(pursuerRoll.edgeLabel)}</p>
        <p>Roll: ${this._escapeHtml(pursuerRoll.detail)} -> <strong>${this._escapeHtml(pursuerRoll.resultLabel)}</strong></p>
        <p><strong>${this._escapeHtml(String(quarryName))}</strong> | Approach: ${this._escapeHtml(this._approachLabel(quarryApproach))}</p>
        <p>Target ${this._escapeHtml(String(qBase))}% ${qMod >= 0 ? "+" : ""}${this._escapeHtml(String(qMod))} = <strong>${this._escapeHtml(String(qFinal))}%</strong> | Edge: ${this._escapeHtml(quarryRoll.edgeLabel)}</p>
        <p>Roll: ${this._escapeHtml(quarryRoll.detail)} -> <strong>${this._escapeHtml(quarryRoll.resultLabel)}</strong></p>
      `
    }));

    if (postToChat) {
      await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ alias: "Chase Control" }),
        content: chatHtml
      });
    }

    return {
      ok: true,
      currentBand,
      newBand,
      direction,
      stepCount,
      winner,
      winnerName,
      pursuer: { name: pursuerName, approach: pursuerApproach, base: pBase, modifier: pMod, final: pFinal, ...pursuerRoll },
      quarry: { name: quarryName, approach: quarryApproach, base: qBase, modifier: qMod, final: qFinal, ...quarryRoll }
    };
  }

  static async openChaseRoundAssistant({
    currentBand = "Close",
    pursuerName = "Pursuer",
    quarryName = "Quarry"
  } = {}) {
    const bandOptions = this.CHASE_RANGE_BANDS
      .map((band) => `<option value="${band}" ${band === currentBand ? "selected" : ""}>${band}</option>`)
      .join("");
    const approachOptions = Object.entries(this.CHASE_APPROACHES)
      .map(([key, label]) => `<option value="${key}">${this._escapeHtml(label)}</option>`)
      .join("");

    const content = `
      <form id="sla-chase-round-form" class="brp">
        <div class="form-group"><label>Scene / Context</label><input type="text" name="sceneLabel" value="" placeholder="RED BPN skyway pursuit" /></div>
        <div class="form-group"><label>Current Range Band</label><select name="currentBand">${bandOptions}</select></div>
        <hr />
        <div class="form-group"><label>Pursuer Label</label><input type="text" name="pursuerName" value="${this._escapeHtml(String(pursuerName))}" /></div>
        <div class="form-group"><label>Pursuer Approach</label><select name="pursuerApproach">${approachOptions}</select></div>
        <div class="form-group"><label>Pursuer Base Target %</label><input type="number" name="pursuerBaseTarget" value="60" min="1" max="100" /></div>
        <div class="form-group"><label>Pursuer Modifier</label><input type="number" name="pursuerModifier" value="0" step="1" /></div>
        <div class="form-group"><label>Pursuer Edge</label>
          <select name="pursuerEdge">
            <option value="advantage">Advantage (1D100 + tens re-roll, keep best)</option>
            <option value="normal" selected>Normal (1D100)</option>
            <option value="disadvantage">Disadvantage (1D100 + tens re-roll, keep worst)</option>
          </select>
        </div>
        <hr />
        <div class="form-group"><label>Quarry Label</label><input type="text" name="quarryName" value="${this._escapeHtml(String(quarryName))}" /></div>
        <div class="form-group"><label>Quarry Approach</label><select name="quarryApproach">${approachOptions}</select></div>
        <div class="form-group"><label>Quarry Base Target %</label><input type="number" name="quarryBaseTarget" value="45" min="1" max="100" /></div>
        <div class="form-group"><label>Quarry Modifier</label><input type="number" name="quarryModifier" value="0" step="1" /></div>
        <div class="form-group"><label>Quarry Edge</label>
          <select name="quarryEdge">
            <option value="advantage">Advantage (1D100 + tens re-roll, keep best)</option>
            <option value="normal" selected>Normal (1D100)</option>
            <option value="disadvantage">Disadvantage (1D100 + tens re-roll, keep worst)</option>
          </select>
        </div>
        <hr />
        <div class="form-group"><label>Special/Critical Surge</label><input type="checkbox" name="surgeOnHighTier" checked /> Allow 2-step shift on Special/Critical winner</div>
      </form>
    `;

    const formData = await SLADialog.waitForm({
      title: "SLA Chase Round Assistant",
      content,
      formSelector: "#sla-chase-round-form",
      submitLabel: "Resolve Round",
      cancelLabel: "Cancel",
      cancelValue: false
    });
    if (!formData) return { ok: false, reason: "cancelled" };
    return this.resolveChaseRound({
      sceneLabel: String(formData.get("sceneLabel") ?? ""),
      currentBand: String(formData.get("currentBand") ?? "Close"),
      pursuerName: String(formData.get("pursuerName") ?? "Pursuer"),
      quarryName: String(formData.get("quarryName") ?? "Quarry"),
      pursuerApproach: String(formData.get("pursuerApproach") ?? "aggressive"),
      quarryApproach: String(formData.get("quarryApproach") ?? "evasive"),
      pursuerBaseTarget: Number(formData.get("pursuerBaseTarget") ?? 60),
      pursuerModifier: Number(formData.get("pursuerModifier") ?? 0),
      pursuerEdge: String(formData.get("pursuerEdge") ?? "normal"),
      quarryBaseTarget: Number(formData.get("quarryBaseTarget") ?? 45),
      quarryModifier: Number(formData.get("quarryModifier") ?? 0),
      quarryEdge: String(formData.get("quarryEdge") ?? "normal"),
      surgeOnHighTier: formData.get("surgeOnHighTier") !== null,
      postToChat: true
    });
  }

  static _actorsWithHealthForWoundTool() {
    const actors = [...(game.actors ?? [])];
    return actors.filter((actor) => {
      const canView = actor?.testUserPermission?.(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER);
      const maxHp = Number(actor?.system?.health?.max ?? 0);
      return Boolean(canView) && Number.isFinite(maxHp) && maxHp > 0;
    });
  }

  static _defaultWoundToolActor(candidates = []) {
    const list = Array.isArray(candidates) ? candidates : [];
    const preferred = game.user?.character;
    if (preferred && list.some((actor) => actor.id === preferred.id)) return preferred;
    const owned = list.find((actor) => actor?.isOwner);
    if (owned) return owned;
    return list[0] ?? null;
  }

  static _conProfileFromActor(actor) {
    const conTotalRaw = Number(actor?.system?.stats?.con?.total ?? 0);
    const conTotal = Number.isFinite(conTotalRaw) ? conTotalRaw : 0;
    const derivRaw = Number(actor?.system?.stats?.con?.deriv ?? 0);
    const deriv = Number.isFinite(derivRaw) ? derivRaw : 0;
    const candidate = deriv > 0 && deriv <= 100 ? deriv : (conTotal > 0 && conTotal <= 30 ? conTotal * 5 : conTotal);
    const conTarget = this._clampPercent(candidate || 50);
    return {
      conTotal: Math.max(1, Math.round(conTotal || Math.ceil(conTarget / 5))),
      conTarget
    };
  }

  static _recommendedFirstAidTarget(actor) {
    if (!actor) return 40;
    const skill = [...(actor.items ?? [])]
      .filter((item) => item.type === "skill")
      .find((item) => {
        const name = String(item?.name ?? "").toLowerCase();
        return name === "medical" || name.includes("first aid") || name.includes("firstaid");
      });
    if (!skill) return 40;
    const raw = Number(skill.system?.grandTotalDisplay ?? skill.system?.grandTotal ?? skill.system?.base ?? 40);
    return this._clampPercent(raw || 40);
  }

  static _woundStateFromHp(hp = 0, maxHp = 0) {
    const current = Number(hp ?? 0);
    const max = Math.max(1, Number(maxHp ?? 1));
    if (current <= 0) return "critical";
    if (current <= 1) return "severely-wounded";
    if (current <= Math.floor(max / 2)) return "wounded";
    return "healthy";
  }

  static _woundStateLabel(state = "healthy") {
    const labels = {
      healthy: "Healthy",
      wounded: "Wounded",
      "severely-wounded": "Severely Wounded",
      critical: "Critical"
    };
    return labels[String(state ?? "").toLowerCase()] ?? "Healthy";
  }

  static _physicalPenaltyFromWoundState(state = "healthy") {
    const key = String(state ?? "").toLowerCase();
    if (key === "wounded") return -10;
    if (key === "severely-wounded") return -20;
    return 0;
  }

  static _firstAidKitProfile(key = "standard") {
    const profiles = {
      none: { label: "None", bonus: 0, healFormula: "1D3" },
      standard: { label: "BOOPA Medical Kit (Standard)", bonus: 0, healFormula: "1D3" },
      advanced: { label: "BOOPA Medical Kit (Advanced)", bonus: 10, healFormula: "1D3+1" },
      medikit: { label: "Disposable Medikit", bonus: -10, healFormula: "1D3" },
      improvised: { label: "Improvised Supplies", bonus: -20, healFormula: "1D3" }
    };
    return profiles[String(key ?? "standard").toLowerCase()] ?? profiles.standard;
  }

  static async _rollSeriousInjury() {
    const roll = await new Roll("1D6").evaluate();
    const value = Number(roll.total ?? 1);
    const entry = this.WOUND_SERIOUS_INJURIES.find((row) => row.roll === value) ?? this.WOUND_SERIOUS_INJURIES[0];
    return {
      roll,
      value,
      title: entry?.title ?? "Injury",
      effect: entry?.effect ?? ""
    };
  }

  static _woundOutcomeFromConResult(resultLevel = 1) {
    if (Number(resultLevel) >= 2) return "down-alive";
    if (Number(resultLevel) <= 0) return "dead";
    return "dying";
  }

  static _woundOutcomeLabel(outcome = "down-alive") {
    const labels = {
      "down-alive": "Down but Alive",
      dying: "Dying",
      dead: "Dead"
    };
    return labels[String(outcome ?? "").toLowerCase()] ?? "Down but Alive";
  }

  static async _applyWoundCrisisActorUpdate(actor, {
    hpAfter = null,
    outcome = "down-alive",
    bleedRounds = 0,
    woundState = "critical",
    physicalPenalty = 0,
    seriousInjury = null,
    conSave = null
  } = {}) {
    if (!actor?.isOwner && !game.user?.isGM) {
      return { ok: false, reason: "not-owner" };
    }

    const update = {};
    if (hpAfter !== null && hpAfter !== undefined) {
      update["system.health.value"] = Number(hpAfter);
    }

    const hasUnconscious = foundry.utils.hasProperty(actor, "system.unconscious");
    const hasDead = foundry.utils.hasProperty(actor, "system.dead");
    const hasBleeding = foundry.utils.hasProperty(actor, "system.bleeding");
    const hasIncapacitated = foundry.utils.hasProperty(actor, "system.incapacitated");

    const key = String(outcome ?? "down-alive").toLowerCase();
    if (key === "dead") {
      if (hasDead) update["system.dead"] = true;
      if (hasUnconscious) update["system.unconscious"] = true;
      if (hasBleeding) update["system.bleeding"] = true;
      if (hasIncapacitated) update["system.incapacitated"] = true;
    } else if (key === "dying") {
      if (hasDead) update["system.dead"] = false;
      if (hasUnconscious) update["system.unconscious"] = true;
      if (hasBleeding) update["system.bleeding"] = true;
      if (hasIncapacitated) update["system.incapacitated"] = true;
    } else if (key === "down-alive") {
      if (hasDead) update["system.dead"] = false;
      if (hasUnconscious) update["system.unconscious"] = true;
      if (hasBleeding) update["system.bleeding"] = false;
      if (hasIncapacitated) update["system.incapacitated"] = true;
    } else {
      if (hasDead) update["system.dead"] = false;
      if (hasUnconscious) update["system.unconscious"] = false;
      if (hasBleeding) update["system.bleeding"] = false;
      if (hasIncapacitated) update["system.incapacitated"] = false;
    }

    update[`flags.${game.system.id}.woundCrisis`] = {
      updatedAt: new Date().toISOString(),
      outcome: key,
      bleedRounds: Math.max(0, Number(bleedRounds ?? 0) || 0),
      woundState: String(woundState ?? "critical"),
      physicalPenalty: Number(physicalPenalty ?? 0) || 0,
      seriousInjury: seriousInjury
        ? {
            roll: Number(seriousInjury.value ?? 0) || 0,
            title: String(seriousInjury.title ?? ""),
            effect: String(seriousInjury.effect ?? "")
          }
        : null,
      conSave: conSave
        ? {
            target: Number(conSave.target ?? 0) || 0,
            edge: String(conSave.edgeLabel ?? conSave.edgeMode ?? "Normal"),
            detail: String(conSave.detail ?? ""),
            result: String(conSave.resultLabel ?? "")
          }
        : null
    };

    await actor.update(update);
    return { ok: true, update };
  }

  static async resolveWoundCrisis({
    actorId = "",
    actor = null,
    preHp = null,
    incomingDamage = 0,
    hpAfter = null,
    maxHp = null,
    conScore = null,
    conTarget = null,
    conEdge = "normal",
    attemptFirstAid = false,
    firstAidTarget = 40,
    firstAidModifier = 0,
    firstAidEdge = "normal",
    firstAidKit = "standard",
    rollSeriousInjury = true,
    applyToActor = true,
    postToChat = true
  } = {}) {
    const resolvedActor = actor ?? game.actors?.get(String(actorId ?? "")) ?? null;
    const actorName = resolvedActor?.name ?? "Unknown Operative";
    const editable = Boolean(resolvedActor && (resolvedActor.isOwner || game.user?.isGM));

    const actorPreHp = Number(resolvedActor?.system?.health?.value ?? 0);
    const actorMaxHp = Number(resolvedActor?.system?.health?.max ?? 1);
    const profile = this._conProfileFromActor(resolvedActor);

    const startHp = Number.isFinite(Number(preHp)) ? Number(preHp) : actorPreHp;
    const damage = Number(incomingDamage ?? 0) || 0;
    let newHp = Number.isFinite(Number(hpAfter)) ? Number(hpAfter) : (startHp - damage);
    const hpMax = Math.max(1, Number.isFinite(Number(maxHp)) ? Number(maxHp) : actorMaxHp);

    const conScoreResolved = Math.max(1, Math.round(Number(conScore ?? profile.conTotal ?? 10) || 10));
    const conTargetResolved = this._clampPercent(Number(conTarget ?? profile.conTarget ?? 50) || 50);

    let woundState = this._woundStateFromHp(newHp, hpMax);
    let physicalPenalty = this._physicalPenaltyFromWoundState(woundState);
    let outcome = newHp <= 0 ? "down-alive" : "active";
    let bleedRounds = 0;
    let conSave = null;
    let firstAid = null;
    let seriousInjury = null;

    if (newHp <= 0) {
      conSave = await this._rollChasePercent({ target: conTargetResolved, edge: conEdge });
      outcome = this._woundOutcomeFromConResult(conSave.resultLevel);
      if (outcome === "dying") {
        bleedRounds = conScoreResolved;
      }

      if (attemptFirstAid && outcome === "dying") {
        const kit = this._firstAidKitProfile(firstAidKit);
        const aidTarget = this._clampPercent((Number(firstAidTarget ?? 40) || 40) + (Number(firstAidModifier ?? 0) || 0) + Number(kit.bonus ?? 0));
        const aidRoll = await this._rollChasePercent({ target: aidTarget, edge: firstAidEdge });
        firstAid = {
          target: aidTarget,
          modifier: Number(firstAidModifier ?? 0) || 0,
          kit,
          ...aidRoll
        };
        if (aidRoll.resultLevel >= 2) {
          let healed = 0;
          try {
            const healRoll = await new Roll(String(kit.healFormula ?? "1D3")).evaluate();
            healed = Number(healRoll.total ?? 0) || 0;
          } catch (_err) {
            healed = 0;
          }
          newHp += healed;
          bleedRounds = 0;
          outcome = "down-alive";
          firstAid.healed = healed;
        } else if (aidRoll.resultLevel <= 0) {
          bleedRounds = Math.max(0, bleedRounds - 1);
          newHp -= 1;
          firstAid.worsened = true;
        }
      }

      if (outcome !== "dead" && rollSeriousInjury) {
        seriousInjury = await this._rollSeriousInjury();
      }
    } else {
      outcome = "active";
    }

    woundState = this._woundStateFromHp(newHp, hpMax);
    physicalPenalty = this._physicalPenaltyFromWoundState(woundState);

    if (resolvedActor && applyToActor && editable) {
      await this._applyWoundCrisisActorUpdate(resolvedActor, {
        hpAfter: newHp,
        outcome,
        bleedRounds,
        woundState,
        physicalPenalty,
        seriousInjury,
        conSave
      });
    }

    const chatHtml = this._journalHtml(this._wrapBpnDocument({
      title: "Wound Crisis Resolution",
      kicker: "SLA INDUSTRIES // TRAUMA CONTROL",
      body: `
        <p><strong>Operative:</strong> ${this._escapeHtml(actorName)}</p>
        <p><strong>HP:</strong> ${this._escapeHtml(String(startHp))}${damage ? ` - ${this._escapeHtml(String(damage))}` : ""} = <strong>${this._escapeHtml(String(newHp))}</strong> / ${this._escapeHtml(String(hpMax))}</p>
        <p><strong>Status:</strong> ${this._escapeHtml(this._woundStateLabel(woundState))}${physicalPenalty ? ` (${physicalPenalty}% physical)` : ""}</p>
        ${newHp <= 0 ? `<p><strong>0-HP Outcome:</strong> ${this._escapeHtml(this._woundOutcomeLabel(outcome))}</p>` : ""}
        ${conSave ? `<p><strong>CON Save:</strong> ${this._escapeHtml(conSave.edgeLabel)} | Target ${this._escapeHtml(String(conTargetResolved))}% | Roll ${this._escapeHtml(conSave.detail)} -> <strong>${this._escapeHtml(conSave.resultLabel)}</strong></p>` : ""}
        ${bleedRounds > 0 ? `<p><strong>Bleed-Out Timer:</strong> ${this._escapeHtml(String(bleedRounds))} rounds remaining.</p>` : ""}
        ${firstAid ? `<p><strong>First Aid:</strong> ${this._escapeHtml(firstAid.kit.label)} | Target ${this._escapeHtml(String(firstAid.target))}% | Roll ${this._escapeHtml(firstAid.detail)} -> <strong>${this._escapeHtml(firstAid.resultLabel)}</strong>${Number(firstAid.healed ?? 0) > 0 ? ` | Healed ${this._escapeHtml(String(firstAid.healed))} HP` : ""}${firstAid.worsened ? " | Fumble: condition worsened" : ""}</p>` : ""}
        ${seriousInjury ? `<p><strong>Serious Injury (d6=${this._escapeHtml(String(seriousInjury.value))}):</strong> ${this._escapeHtml(seriousInjury.title)} - ${this._escapeHtml(seriousInjury.effect)}</p>` : ""}
      `
    }));

    if (postToChat) {
      await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ alias: "Trauma Control" }),
        content: chatHtml
      });
    }

    return {
      ok: true,
      actor: resolvedActor,
      actorName,
      preHp: startHp,
      incomingDamage: damage,
      hpAfter: newHp,
      maxHp: hpMax,
      woundState,
      woundStateLabel: this._woundStateLabel(woundState),
      physicalPenalty,
      outcome,
      outcomeLabel: this._woundOutcomeLabel(outcome),
      bleedRounds,
      conSave,
      firstAid,
      seriousInjury
    };
  }

  static async openWoundCrisisAssistant() {
    const candidates = this._actorsWithHealthForWoundTool();
    if (!candidates.length) {
      ui.notifications.warn("No actors with an HP track are available for wound resolution.");
      return { ok: false, reason: "no-actors" };
    }

    const selected = this._defaultWoundToolActor(candidates);
    const actorPayload = candidates.map((actor) => {
      const hp = Number(actor?.system?.health?.value ?? 0) || 0;
      const maxHp = Math.max(1, Number(actor?.system?.health?.max ?? 1) || 1);
      const conProfile = this._conProfileFromActor(actor);
      const firstAidTarget = this._recommendedFirstAidTarget(actor);
      return {
        id: actor.id,
        name: actor.name,
        hp,
        maxHp,
        conScore: conProfile.conTotal,
        conTarget: conProfile.conTarget,
        firstAidTarget
      };
    });
    const payloadById = new Map(actorPayload.map((row) => [row.id, row]));
    const selectedPayload = payloadById.get(selected?.id) ?? actorPayload[0];

    const actorOptions = actorPayload
      .map((row) => `<option value="${row.id}" ${row.id === selectedPayload.id ? "selected" : ""}>${this._escapeHtml(row.name)}</option>`)
      .join("");

    const content = `
      <form id="sla-wound-crisis-form" class="brp">
        <div class="form-group"><label>Actor</label><select name="actorId">${actorOptions}</select></div>
        <div class="form-group"><label>Current HP (before hit)</label><input type="number" name="preHp" value="${this._escapeHtml(String(selectedPayload.hp))}" step="1" /></div>
        <div class="form-group"><label>Incoming Damage</label><input type="number" name="incomingDamage" value="0" step="1" /></div>
        <div class="form-group"><label>Max HP</label><input type="number" name="maxHp" value="${this._escapeHtml(String(selectedPayload.maxHp))}" step="1" /></div>
        <hr />
        <div class="form-group"><label>CON Score (for bleed timer)</label><input type="number" name="conScore" value="${this._escapeHtml(String(selectedPayload.conScore))}" step="1" /></div>
        <div class="form-group"><label>CON Save Target %</label><input type="number" name="conTarget" value="${this._escapeHtml(String(selectedPayload.conTarget))}" min="1" max="100" /></div>
        <div class="form-group"><label>CON Save Edge</label>
          <select name="conEdge">
            <option value="advantage">Advantage (1D100 + tens re-roll, keep best)</option>
            <option value="normal" selected>Normal (1D100)</option>
            <option value="disadvantage">Disadvantage (1D100 + tens re-roll, keep worst)</option>
          </select>
        </div>
        <div class="form-group"><label>Roll Serious Injury on survival</label><input type="checkbox" name="rollSeriousInjury" checked /></div>
        <hr />
        <div class="form-group"><label>Attempt First Aid if Dying</label><input type="checkbox" name="attemptFirstAid" /></div>
        <div class="form-group"><label>First Aid Target %</label><input type="number" name="firstAidTarget" value="${this._escapeHtml(String(selectedPayload.firstAidTarget))}" min="1" max="100" /></div>
        <div class="form-group"><label>First Aid Flat Modifier</label><input type="number" name="firstAidModifier" value="0" step="1" /></div>
        <div class="form-group"><label>First Aid Edge</label>
          <select name="firstAidEdge">
            <option value="advantage">Advantage (1D100 + tens re-roll, keep best)</option>
            <option value="normal" selected>Normal (1D100)</option>
            <option value="disadvantage">Disadvantage (1D100 + tens re-roll, keep worst)</option>
          </select>
        </div>
        <div class="form-group"><label>Medical Gear</label>
          <select name="firstAidKit">
            <option value="standard">BOOPA Medical Kit (Standard)</option>
            <option value="advanced">BOOPA Medical Kit (Advanced)</option>
            <option value="medikit">Disposable Medikit</option>
            <option value="improvised">Improvised Supplies</option>
            <option value="none">None</option>
          </select>
        </div>
        <hr />
        <div class="form-group"><label>Apply result to selected actor</label><input type="checkbox" name="applyToActor" checked /></div>
        <div class="form-group"><label>Post result to chat</label><input type="checkbox" name="postToChat" checked /></div>
      </form>
    `;

    const formData = await SLADialog.waitForm({
      title: "SLA Wound Crisis Assistant",
      content,
      formSelector: "#sla-wound-crisis-form",
      submitLabel: "Resolve Wound Crisis",
      cancelLabel: "Cancel",
      cancelValue: false,
      onRender: (root) => {
        const form = root?.querySelector?.("#sla-wound-crisis-form");
        if (!form) return;
        const actorSelect = form.querySelector("select[name='actorId']");
        const sync = () => {
          const row = payloadById.get(String(actorSelect?.value ?? "")) ?? selectedPayload;
          if (!row) return;
          const preHpField = form.querySelector("input[name='preHp']");
          const maxHpField = form.querySelector("input[name='maxHp']");
          const conScoreField = form.querySelector("input[name='conScore']");
          const conTargetField = form.querySelector("input[name='conTarget']");
          const firstAidField = form.querySelector("input[name='firstAidTarget']");
          if (preHpField) preHpField.value = String(row.hp);
          if (maxHpField) maxHpField.value = String(row.maxHp);
          if (conScoreField) conScoreField.value = String(row.conScore);
          if (conTargetField) conTargetField.value = String(row.conTarget);
          if (firstAidField) firstAidField.value = String(row.firstAidTarget);
        };
        actorSelect?.addEventListener("change", sync);
      }
    });
    if (!formData) return { ok: false, reason: "cancelled" };
    const actorId = String(formData.get("actorId") ?? "");
    return this.resolveWoundCrisis({
      actorId,
      preHp: Number(formData.get("preHp") ?? 0),
      incomingDamage: Number(formData.get("incomingDamage") ?? 0),
      maxHp: Number(formData.get("maxHp") ?? 1),
      conScore: Number(formData.get("conScore") ?? 10),
      conTarget: Number(formData.get("conTarget") ?? 50),
      conEdge: String(formData.get("conEdge") ?? "normal"),
      attemptFirstAid: formData.get("attemptFirstAid") !== null,
      firstAidTarget: Number(formData.get("firstAidTarget") ?? 40),
      firstAidModifier: Number(formData.get("firstAidModifier") ?? 0),
      firstAidEdge: String(formData.get("firstAidEdge") ?? "normal"),
      firstAidKit: String(formData.get("firstAidKit") ?? "standard"),
      rollSeriousInjury: formData.get("rollSeriousInjury") !== null,
      applyToActor: formData.get("applyToActor") !== null,
      postToChat: formData.get("postToChat") !== null
    });
  }

  static async openToolkit() {
    if (!this._isGM()) {
      ui.notifications.warn("Only a GM can use the BPN toolkit.");
      return { ok: false, reason: "not-gm" };
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (payload) => {
        if (settled) return;
        settled = true;
        resolve(payload);
      };

      const runAction = async (action = "close") => {
        switch (String(action)) {
          case "full-install":
            if (typeof game.brp?.SLASeedImporter?.runFullSLAInstaller === "function") {
              return game.brp.SLASeedImporter.runFullSLAInstaller({
                overwrite: true,
                pruneCompendia: true,
                notify: true
              });
            }
            // Backward-compatible fallback for clients still on older cached scripts.
            if (!game.brp?.SLASeedImporter) {
              return { ok: false, reason: "full-installer-unavailable" };
            }
            await this.ensureCoreJournals({ notify: false });
            const fallbackSummary = {
              ok: true,
              mode: "compat-fallback",
              base: await game.brp.SLASeedImporter.buildDraft2?.({ overwrite: true, syncCompendia: false }),
              traits: await game.brp.SLASeedImporter.ensureSLA2Traits?.({ overwrite: true, notify: false }),
              equipment: await this.seedWorldGeneralEquipment({ overwrite: true, notify: false }),
              sync: await game.brp.SLASeedImporter.syncAllToCompendia?.({ overwrite: true, prune: true }),
              migrate: await game.brp.SLASeedImporter.migrateLegacySLAAssetPaths?.({
                includeActors: true,
                includeCompendium: true,
                notify: false
              })
            };
            ui.notifications.info("SLA Full Install complete (compat mode).");
            return fallbackSummary;
          case "setup":
            return this.ensureCoreJournals({ notify: true });
          case "rulebook":
            return this.openRulebook({ ensure: true, notify: false });
          case "npc-guide":
            return this.openNpcAdversaryJournal({ ensure: true, notify: false });
          case "vehicles":
            return this.openVehicleChaseJournal({ ensure: true, notify: false });
          case "chase-assistant":
            return this.openChaseRoundAssistant({});
          case "wound-assistant":
            return this.openWoundCrisisAssistant();
          case "rules-console":
            return game.brp?.SLARulesConsole?.open?.() ?? { ok: false, reason: "rules-console-unavailable" };
          case "qa-harness":
            return game.brp?.SLAQAHarness?.runQuick?.({ postToChat: true }) ?? { ok: false, reason: "qa-harness-unavailable" };
          case "create":
            return this.promptCreateBpn({ randomizeDefaults: true });
          case "equipment":
            return this.openEquipmentCatalogue({ ensure: true, notify: false });
          case "seed-equipment":
            await this.ensureCoreJournals({ notify: false });
            return this.seedWorldGeneralEquipment({ overwrite: false, notify: true });
          case "seed-npc":
            await this.ensureCoreJournals({ notify: false });
            return this.seedWorldNpcAdversaries({ overwrite: false, notify: true });
          case "adversary-generator":
            return this.promptAdversaryGenerator();
          case "random-npc":
            return this.createQuickRandomNpcAdversary({ notify: true, postToChat: true });
          case "random":
            return this.createQuickRandomBpn();
          default:
            return { ok: false, reason: "unknown-action" };
        }
      };

      const actionRows = [
        { key: "full-install", title: "Full SLA Install", note: "One-click installer: seeds all SLA content, syncs compendia, migrates legacy icon paths, and re-syncs artwork." },
        { key: "setup", title: "Setup Core Journals", note: "Creates/updates BPN journals plus the SLA general equipment catalogue." },
        { key: "rulebook", title: "Open Rulebook", note: "Opens the searchable SLA player/GM rulebook journal." },
        { key: "npc-guide", title: "Open NPC Guide", note: "Opens the searchable NPC/adversary chapter journal." },
        { key: "vehicles", title: "Open Vehicles & Chases", note: "Opens the searchable vehicle/chase chapter journal." },
        { key: "chase-assistant", title: "Chase Round Assistant", note: "Quick opposed chase resolver with chat output and band tracking." },
        { key: "wound-assistant", title: "Wound Crisis Assistant", note: "Resolves 0-HP CON saves, bleed timers, first aid, and serious injuries." },
        { key: "rules-console", title: "Rules Console", note: "Fast world-rule toggles for initiative, skill categories, targeting, and economy policy." },
        { key: "qa-harness", title: "Run QA Harness", note: "Runs structural SLA roll/ammo/ebb smoke tests and posts PASS/FAIL to chat." },
        { key: "equipment", title: "Open Equipment Catalogue", note: "Opens the full non-weapon equipment reference section." },
        { key: "seed-equipment", title: "Seed Equipment Items", note: "Creates all equipment as drag/drop Items in the Items sidebar." },
        { key: "seed-npc", title: "Seed NPC Adversaries", note: "Creates tiered SLA NPC archetype actors in the Actors sidebar." },
        { key: "adversary-generator", title: "Adversary Generator", note: "Choose Single, Group, or Non-Combat Problem and generate instantly." },
        { key: "random-npc", title: "Quick Random NPC", note: "One-click enemy/NPC generation from SLA tier templates." },
        { key: "create", title: "Create BPN", note: "Guided form with random-table support." },
        { key: "random", title: "Quick Random BPN", note: "One-click generation using table rolls." }
      ];

      const actionButtons = actionRows.map((row) => `
        <button type="button" data-sla-action="${this._escapeHtml(row.key)}" style="display:block;width:100%;text-align:left;margin-bottom:0.35rem;">
          <strong>${this._escapeHtml(row.title)}</strong><br />
          <span style="opacity:0.85;">${this._escapeHtml(row.note)}</span>
        </button>
      `).join("");

      const dialog = new Dialog({
        title: "SLA BPN Toolkit",
        content: `
          <form class="brp sla-bpn-toolkit-menu">
            <p>Create and manage SLA-style BPN journals directly in-world.</p>
            <div style="max-height:55vh; overflow-y:auto; padding-right:0.25rem;">
              ${actionButtons}
            </div>
          </form>
        `,
        buttons: {
          close: {
            label: "Close",
            callback: () => finish({ ok: true, action: "close" })
          }
        },
        default: "close",
        render: (html) => {
          const root = html[0];
          if (!root) return;
          root.querySelectorAll("[data-sla-action]").forEach((node) => {
            node.addEventListener("click", async (event) => {
              event.preventDefault();
              const action = event.currentTarget?.dataset?.slaAction ?? "";
              const result = await runAction(action);
              finish({ ok: true, action, result });
              dialog.close();
            });
          });
        },
        close: () => finish({ ok: true, action: "close" })
      });

      dialog.render(true);
    });
  }
}
