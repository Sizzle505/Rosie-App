export const STUDIO_PAGES = [
  { id: "qr-atelier", label: "QR Atelier" },
  { id: "haiku", label: "Haiku Zen Garden" },
  { id: "calculations", label: "Calculations" },
  { id: "resources", label: "Resources Hub" },
  { id: "recipes", label: "Recipes" },
  { id: "timekeeper", label: "Timekeepers" },
  { id: "reminders", label: "Reminders" },
  { id: "reviews", label: "Reviews" },
  { id: "randomizers", label: "Randomizers" },
  { id: "home", label: "Home" },
  { id: "captain", label: "Captain" },
  { id: "cheese", label: "Cheese" },
  { id: "fortune", label: "Fortune" },
  { id: "vault", label: "Card Vault" }
];

export const TARGETS = {
  haiku: [
    ["landscape", "Full-page garden background", ".haiku-page-landscape", "Scenery"],
    ["header", "Heading area", ".haiku-header", "Heading"],
    ["title", "Haiku Zen Garden title", ".haiku-heading h1", "Heading"],
    ["subtitle", "Page subtitle", ".haiku-heading p", "Heading"],
    ["back", "Back to RosieVerse", ".haiku-back", "Heading"],
    ["rosie", "Meditating Rosie", ".haiku-scene-rosie", "Rosie & garden"],
    ["scene-stage", "Rosie scene area", ".haiku-scene-image", "Rosie & garden"],
    ["scene-buttons", "Background button group", ".haiku-scene-selector", "Rosie & garden"],
    ["field", "Flower Field button", ".haiku-scene-selector button:nth-child(1)", "Rosie & garden"],
    ["zen-garden", "Zen Garden button", ".haiku-scene-selector button:nth-child(2)", "Rosie & garden"],
    ["temple", "Temple button", ".haiku-scene-selector button:nth-child(3)", "Rosie & garden"],
    ["scroll", "All scroll designs (linked)", ".haiku-scroll", "Poetry scroll"],
    ["scroll-sakura", "Sakura scroll only", ".haiku-scroll[data-scroll-style='sakura']", "Individual scroll designs"],
    ["scroll-imperial", "Imperial scroll only", ".haiku-scroll[data-scroll-style='imperial']", "Individual scroll designs"],
    ["scroll-grand", "Grand scroll only", ".haiku-scroll[data-scroll-style='grand']", "Individual scroll designs"],
    ["verse", "Three-line haiku group", ".haiku-verse", "Poetry scroll"],
    ["line-one", "First haiku line", ".haiku-verse p:nth-child(1)", "Poetry scroll"],
    ["line-two", "Second haiku line", ".haiku-verse p:nth-child(2)", "Poetry scroll"],
    ["line-three", "Third haiku line", ".haiku-verse p:nth-child(3)", "Poetry scroll"],
    ["signature", "Rosie's signature", ".haiku-scroll-signature", "Poetry scroll"],
    ["meter", "5 · 7 · 5", ".haiku-metre", "Poetry scroll"],
    ["poem-actions", "Save, Share & Postcard", ".haiku-verse-actions", "Poetry controls"],
    ["save", "Save poem button", ".haiku-verse-actions button:nth-child(1)", "Poetry controls"],
    ["share", "Share verse button", ".haiku-verse-actions button:nth-child(2)", "Poetry controls"],
    ["postcard", "Postcard button", ".haiku-verse-actions button:nth-child(3)", "Poetry controls"],
    ["studio", "Daily / Compose / Meditate panel", ".haiku-workbench", "Activities"],
    ["tabs", "Activity tabs", ".haiku-tabs", "Activities"],
    ["panel", "Active activity content", ".haiku-workbench .haiku-panel, .haiku-workbench .zen-panel", "Activities"],
    ["panel-title", "Active activity heading", ".haiku-workbench .haiku-panel h2, .haiku-workbench .zen-panel h2", "Activities"],
    ["meditation-programs", "Meditation program buttons", ".zen-program-grid", "Meditation"],
    ["meditation-duration", "Session length controls", ".zen-options:nth-of-type(1)", "Meditation"],
    ["meditation-sound", "Garden sound controls", ".zen-options:nth-of-type(2)", "Meditation"],
    ["meditation-start", "Begin meditation button", ".zen-begin", "Meditation"],
    ["wisdom", "The Way of the Shiba section", ".haiku-shell > .haiku-scene-quote", "Wisdom footer"],
    ["wisdom-kicker", "The Way of the Shiba label", ".haiku-shell > .haiku-scene-quote .haiku-scene-quote-kicker", "Wisdom footer"],
    ["wisdom-quote", "Wisdom main line", ".haiku-shell > .haiku-scene-quote strong", "Wisdom footer"],
    ["wisdom-aside", "Wisdom smaller line", ".haiku-shell > .haiku-scene-quote small", "Wisdom footer"]
  ],
  "qr-atelier": [
    ["hero", "Header", ".qa-hero"],
    ["title", "Title artwork", ".qa-title"],
    ["frame", "QR display frame", ".qa-preview-stage"],
    ["ring", "Frame ornament", ".qa-ring"],
    ["code", "QR code", ".qa-code-shell"],
    ["preview-actions", "Frame buttons", ".qa-preview-actions"],
    ["finishes", "Finishes row", ".qa-finish-strip"],
    ["palettes", "Style choices", ".qa-palettes"],
    ["panel", "Editor panel", ".qa-panel"],
    ["inputs", "Editor fields", ".qa-inputs"],
    ["controls", "Save controls", ".qa-finish-controls"],
    ["collection", "Saved collection", ".qa-collection"]
  ],
  calculations: [
    ["hero", "Main header artwork", ".rc-hero", "Heading & desk"],
    ["header-copy", "Header title", ".rc-desktop-hero-copy", "Heading & desk"],
    ["stage", "Calculator stage", ".rc-calculator-stage", "Heading & desk"],
    ["calculator", "Calculator itself", ".rac-frame", "Heading & desk"],
    ["workspace", "Pocket Toolkit workspace", ".rc-workspace", "Pocket Toolkit"],
    ["toolkit-heading", "The Pocket Toolkit heading", ".rc-tools-heading", "Pocket Toolkit"],
    ["tool-grid", "All seven function buttons", ".rc-tool-grid", "Pocket Toolkit"],
    ["tip", "Tip Calculator button", ".rc-tool-card--tip", "Individual buttons"],
    ["units", "Unit Conversions button", ".rc-tool-card--units", "Individual buttons"],
    ["date", "Date Calculator button", ".rc-tool-card--date", "Individual buttons"],
    ["split", "Split Bill button", ".rc-tool-card--split", "Individual buttons"],
    ["percent", "Percentages & Discounts button", ".rc-tool-card--percent", "Individual buttons"],
    ["loan", "Loan & Interest button", ".rc-tool-card--loan", "Individual buttons"],
    ["currency", "Currency Converter button", ".rc-tool-card--currency", "Individual buttons"],
    ["tool-overlay", "Open gold instrument", ".rc-active-tool-overlay", "Active instrument"],
    ["tool-panel", "Instrument panel", ".rc-tool-panel.rc-device", "Active instrument"],
    ["tool-close", "Close instrument button", ".rc-active-tool-close", "Active instrument"],
    ["footer", "Calculator footer text", ".rc-footer-note", "Pocket Toolkit"]
  ],
  resources: [
    ["header", "Resources header", ".rr-hub-header"],
    ["content", "Hub composition", ".rr-hub-content"],
    ["buttons", "Resource buttons", ".rr-hub-buttons"]
  ],
  recipes: [
    ["scene", "Kitchen scene", ".recipes-top-scene"],
    ["body", "Recipe content", ".recipes-body"],
    ["heading", "Page heading", ".recipes-heading"],
    ["crest", "Header crest", ".recipes-crest"],
    ["index", "Recipe index", ".recipes-index"],
    ["filters", "Meal filters", ".recipes-meal-filters"],
    ["grid", "Recipe cards", ".recipes-grid"]
  ],
  timekeeper: [
    ["scene", "Observatory scene", ".rtk-scene"],
    ["art", "Clock art stage", ".rtk-art-stage"],
    ["props", "Scene props", ".rtk-observatory-props"],
    ["gears", "Clock gears", ".rtk-exterior-gearwork"],
    ["clock", "Clock face", ".rtk-dial"],
    ["caption", "Clock caption", ".rtk-caption"],
    ["actions", "Clock action area", ".rtk-action-deck"],
    ["controls", "Clock controls", ".rtk-controls"],
    ["utility", "Timers and tools", ".rtk-utility"]
  ],
  reminders: [
    ["page", "Reminders content", ".rr-page"],
    ["hero", "Reminders heading", ".rr-hero"],
    ["calendar", "Calendar", ".rr-calendar"],
    ["list", "Reminders panel", ".rr-paper"]
  ],
  reviews: [
    ["page", "Reviews content", ".rosie-reviews"],
    ["header", "Review header", ".reviews-hero"],
    ["content", "Review workspace", ".reviews-content"],
    ["rail", "Review filters", ".reviews-rail"],
    ["grid", "Movie grid", ".reviews-film-grid"]
  ],
  randomizers: [
    ["page", "Randomizers scene", "[data-layout-target='randomizers-page']"],
    ["header", "Velvet header", "[data-layout-target='randomizers-header']"],
    ["quick", "Coin & dice area", "[data-layout-target='randomizers-quick']"],
    ["coin", "Coin display", "[data-layout-target='randomizers-coin']"],
    ["dice", "Dice display", "[data-layout-target='randomizers-dice']"],
    ["wheel", "Roulette salon", "[data-layout-target='randomizers-wheel']"],
    ["wheel-stage", "Wheel stage", "[data-layout-target='randomizers-wheel-stage']"],
    ["editor", "Wheel options", "[data-layout-target='randomizers-editor']"],
    ["santa", "Secret Santa", "[data-layout-target='randomizers-santa']"]
  ],
  home: [
    ["page", "Home scene", "[data-layout-target='home-page']"],
    ["header", "Home banner", "[data-layout-target='home-banner']"],
    ["hero", "Rosie landscape", "[data-layout-target='home-hero']"],
    ["destinations", "World buttons", "[data-layout-target='home-worlds']"]
  ],
  captain: [
    ["hero", "Captain heading", ".captain-hero"],
    ["banner", "Captain banner", ".captain-hero-banner"],
    ["game", "Yacht game", ".yacht-game-shell"],
    ["tunnel", "Tunnel game", ".ember-suite"],
    ["odyssey", "Cosmic Odyssey", "#cosmic-odyssey-arcade"]
  ],
  cheese: [
    ["header", "Exam header", ".cheese-exam-header"],
    ["board", "Cheese game board", ".cheese-game-frame"],
    ["left", "Left side panel", ".cheese-left-rail"],
    ["right", "Rosie examiner", ".cheese-examiner-rail"]
  ],
  fortune: [
    ["machine", "Fortune machine", ".fortune-console"],
    ["question", "Question form", ".question-card"],
    ["ticket", "Fortune ticket", ".fortune-ticket"]
  ],
  vault: [
    ["page", "Card Vault", ".vault-collector-page"],
    ["header", "Vault heading", ".vault-collector-header"],
    ["plaque", "Gold plaque", ".vault-collector-plaque"],
    ["gallery", "Card gallery", ".vault-collector-gallery"]
  ]
};
