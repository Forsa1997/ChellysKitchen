export const recipes = [
  {
    id: 'r1',
    img: '/recipe-images/pasta-spinat-lachs.svg',
    tag: 'Kochen',
    title: 'Cremige Pasta mit Spinat und Lachs',
    shortDescription:
      'Cremige Pasta mit frischem Spinat und zartem Lachs in einer leichten Weißweinsauce',
    preparationTime: 15,
    cookingTime: 20,
    difficulty: 'Mittel',
    servings: 4,
    ingredients: [
      { name: 'Tagliatelle', amount: 500, unit: 'g' },
      { name: 'Lachs', amount: 400, unit: 'g' },
      { name: 'Spinat', amount: 200, unit: 'g' },
      { name: 'Sahne', amount: 200, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Pasta in Salzwasser nach Packungsanweisung kochen.' },
      { stepNumber: 2, instruction: 'Lachs in Würfel schneiden und in Olivenöl anbraten.' },
      { stepNumber: 3, instruction: 'Sahne dazugeben, Spinat unterheben und alles vermengen.' }
    ],
    nutritionalValues: { calories: 650, protein: 35, carbohydrates: 70, fat: 25 },
    authors: [{ name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }],
    category: 'Cooking',
    creationDate: '2026-04-20T00:00:00.000Z'
  },
  {
    id: 'r2',
    img: '/recipe-images/karottentorte.svg',
    tag: 'Backen',
    title: 'Saftige Karottentorte',
    shortDescription: 'Klassische Karottentorte mit cremigem Frischkäse-Frosting',
    preparationTime: 30,
    cookingTime: 45,
    difficulty: 'Mittel',
    servings: 12,
    ingredients: [
      { name: 'Karotten', amount: 300, unit: 'g' },
      { name: 'Mehl', amount: 250, unit: 'g' },
      { name: 'Frischkäse', amount: 300, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Karotten reiben und Teig vorbereiten.' },
      { stepNumber: 2, instruction: 'Bei 180°C für 45 Minuten backen.' },
      { stepNumber: 3, instruction: 'Frosting auf den ausgekühlten Kuchen verteilen.' }
    ],
    nutritionalValues: { calories: 385, protein: 6, carbohydrates: 45, fat: 22 },
    authors: [{ name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }],
    category: 'Baking',
    creationDate: '2026-04-18T00:00:00.000Z'
  },
  {
    id: 'r3',
    img: '/recipe-images/bbq-rippchen.svg',
    tag: 'Grillen',
    title: 'BBQ Rippchen mit Honig-Glasur',
    shortDescription: 'Zarte Rippchen mit süß-würziger Honig-BBQ-Glasur',
    preparationTime: 30,
    cookingTime: 180,
    difficulty: 'Schwer',
    servings: 4,
    ingredients: [
      { name: 'Spareribs', amount: 2, unit: 'kg' },
      { name: 'BBQ Sauce', amount: 400, unit: 'ml' },
      { name: 'Honig', amount: 100, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Rippchen vorbereiten und mit Rub einreiben.' },
      { stepNumber: 2, instruction: 'Bei niedriger Hitze langsam grillen.' },
      { stepNumber: 3, instruction: 'Mit Honig-BBQ-Sauce glasieren und karamellisieren lassen.' }
    ],
    nutritionalValues: { calories: 850, protein: 45, carbohydrates: 35, fat: 60 },
    authors: [{ name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' }],
    category: 'Barbeque',
    creationDate: '2026-04-15T00:00:00.000Z'
  },
  {
    id: 'r4',
    slug: 'zitronen-haehnchen-vom-blech',
    img: '/recipe-images/zitronen-haehnchen-blech.svg',
    tag: 'Kochen',
    title: 'Zitronen-Haehnchen vom Blech',
    shortDescription: 'Saftiges Haehnchen mit Kartoffeln, Zitrone und Kraeutern aus dem Ofen',
    description: 'Ein unkompliziertes Ofengericht fuer die ganze Familie, das wenig Abwasch macht und trotzdem frisch schmeckt.',
    preparationTime: 20,
    cookingTime: 45,
    difficulty: 'Einfach',
    servings: 4,
    ingredients: [
      { name: 'Haehnchenschenkel', amount: 4, unit: 'Stk' },
      { name: 'Kartoffeln', amount: 800, unit: 'g' },
      { name: 'Bio-Zitronen', amount: 2, unit: 'Stk' },
      { name: 'Rosmarin', amount: 3, unit: 'Zweige' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Kartoffeln halbieren und mit Oel, Salz und Rosmarin mischen.' },
      { stepNumber: 2, instruction: 'Haehnchen wuerzen und mit Zitronenscheiben auf dem Blech verteilen.' },
      { stepNumber: 3, instruction: 'Bei 200 Grad backen, bis das Haehnchen goldbraun ist.' }
    ],
    nutritionalValues: { calories: 620, protein: 42, carbohydrates: 48, fat: 28 },
    authors: [{ name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }],
    createdBy: { id: 'demo-author', name: 'Michelle Zboron' },
    category: 'Cooking',
    status: 'PUBLISHED',
    creationDate: '2026-05-10T00:00:00.000Z'
  },
  {
    id: 'r5',
    slug: 'linsen-kokos-suppe',
    img: '/recipe-images/linsen-kokos-suppe.svg',
    tag: 'Suppe',
    title: 'Linsen-Kokos-Suppe',
    shortDescription: 'Cremige rote Linsensuppe mit Kokosmilch, Ingwer und Limette',
    description: 'Waermend, schnell gekocht und ideal zum Vorkochen fuer mehrere Tage.',
    preparationTime: 15,
    cookingTime: 25,
    difficulty: 'Einfach',
    servings: 4,
    ingredients: [
      { name: 'Rote Linsen', amount: 250, unit: 'g' },
      { name: 'Kokosmilch', amount: 400, unit: 'ml' },
      { name: 'Gemuesebruehe', amount: 700, unit: 'ml' },
      { name: 'Ingwer', amount: 20, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Zwiebel, Knoblauch und Ingwer fein hacken und anbraten.' },
      { stepNumber: 2, instruction: 'Linsen, Bruehe und Kokosmilch dazugeben und weich kochen.' },
      { stepNumber: 3, instruction: 'Puerieren und mit Limettensaft abschmecken.' }
    ],
    nutritionalValues: { calories: 410, protein: 18, carbohydrates: 42, fat: 18 },
    authors: [{ name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }],
    createdBy: { id: 'demo-author', name: 'Michelle Zboron' },
    category: 'Soups',
    status: 'PUBLISHED',
    creationDate: '2026-05-09T00:00:00.000Z'
  },
  {
    id: 'r6',
    slug: 'sommerlicher-couscous-salat',
    img: '/recipe-images/couscous-salat.svg',
    tag: 'Salat',
    title: 'Sommerlicher Couscous-Salat',
    shortDescription: 'Frischer Couscous-Salat mit Gurke, Tomate, Feta und Minze',
    description: 'Ein leichter Salat fuer Grillabende, Lunchboxen oder schnelle Abendessen.',
    preparationTime: 20,
    cookingTime: 5,
    difficulty: 'Einfach',
    servings: 4,
    ingredients: [
      { name: 'Couscous', amount: 250, unit: 'g' },
      { name: 'Gurke', amount: 1, unit: 'Stk' },
      { name: 'Tomaten', amount: 300, unit: 'g' },
      { name: 'Feta', amount: 180, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Couscous mit heisser Bruehe uebergiessen und quellen lassen.' },
      { stepNumber: 2, instruction: 'Gemuese und Feta wuerfeln.' },
      { stepNumber: 3, instruction: 'Alles mit Zitronensaft, Oel und Minze vermengen.' }
    ],
    nutritionalValues: { calories: 390, protein: 15, carbohydrates: 52, fat: 14 },
    authors: [{ name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' }],
    createdBy: { id: 'demo-author', name: 'Christoph Ruhe' },
    category: 'Salads',
    status: 'PUBLISHED',
    creationDate: '2026-05-08T00:00:00.000Z'
  },
  {
    id: 'r7',
    slug: 'schoko-himbeer-brownies',
    img: '/recipe-images/schoko-himbeer-brownies.svg',
    tag: 'Backen',
    title: 'Schoko-Himbeer-Brownies',
    shortDescription: 'Fudgy Brownies mit dunkler Schokolade und fruchtigen Himbeeren',
    description: 'Intensiv schokoladig, leicht saeuerlich und perfekt fuer Dessert oder Kaffeetafel.',
    preparationTime: 20,
    cookingTime: 28,
    difficulty: 'Mittel',
    servings: 12,
    ingredients: [
      { name: 'Zartbitterschokolade', amount: 250, unit: 'g' },
      { name: 'Butter', amount: 180, unit: 'g' },
      { name: 'Eier', amount: 4, unit: 'Stk' },
      { name: 'Himbeeren', amount: 180, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Schokolade und Butter schmelzen.' },
      { stepNumber: 2, instruction: 'Eier und Zucker schaumig schlagen, Schokolade unterziehen.' },
      { stepNumber: 3, instruction: 'Mehl einarbeiten, Himbeeren verteilen und backen.' }
    ],
    nutritionalValues: { calories: 360, protein: 5, carbohydrates: 38, fat: 22 },
    authors: [{ name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }],
    createdBy: { id: 'demo-author', name: 'Michelle Zboron' },
    category: 'Baking',
    status: 'PUBLISHED',
    creationDate: '2026-05-07T00:00:00.000Z'
  },
  {
    id: 'r8',
    slug: 'mediterrane-gemuese-lasagne',
    img: '/recipe-images/gemuese-lasagne.svg',
    tag: 'Vegetarisch',
    title: 'Mediterrane Gemuese-Lasagne',
    shortDescription: 'Ofenlasagne mit Zucchini, Aubergine, Tomaten und cremiger Bechamel',
    description: 'Ein vegetarischer Klassiker mit viel Gemuese und kraeftiger Tomatensauce.',
    preparationTime: 35,
    cookingTime: 45,
    difficulty: 'Mittel',
    servings: 6,
    ingredients: [
      { name: 'Lasagneplatten', amount: 12, unit: 'Stk' },
      { name: 'Zucchini', amount: 2, unit: 'Stk' },
      { name: 'Aubergine', amount: 1, unit: 'Stk' },
      { name: 'Passierte Tomaten', amount: 700, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Gemuese wuerfeln und kraeftig anbraten.' },
      { stepNumber: 2, instruction: 'Tomatensauce und Bechamel vorbereiten.' },
      { stepNumber: 3, instruction: 'Alles schichten und goldbraun backen.' }
    ],
    nutritionalValues: { calories: 520, protein: 19, carbohydrates: 64, fat: 20 },
    authors: [{ name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }],
    createdBy: { id: 'demo-author', name: 'Michelle Zboron' },
    category: 'Cooking',
    status: 'PUBLISHED',
    creationDate: '2026-05-06T00:00:00.000Z'
  },
  {
    id: 'r9',
    slug: 'asia-nudelpfanne-mit-erdnusssauce',
    img: '/recipe-images/asia-nudelpfanne.svg',
    tag: 'Schnell',
    title: 'Asia-Nudelpfanne mit Erdnusssauce',
    shortDescription: 'Schnelle Nudelpfanne mit knackigem Gemuese und cremiger Erdnusssauce',
    description: 'Ein Feierabendgericht, das in unter 30 Minuten auf dem Tisch steht.',
    preparationTime: 15,
    cookingTime: 12,
    difficulty: 'Einfach',
    servings: 3,
    ingredients: [
      { name: 'Mie-Nudeln', amount: 250, unit: 'g' },
      { name: 'Brokkoli', amount: 300, unit: 'g' },
      { name: 'Karotten', amount: 2, unit: 'Stk' },
      { name: 'Erdnussmus', amount: 3, unit: 'EL' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Nudeln garen und Gemuese in Streifen schneiden.' },
      { stepNumber: 2, instruction: 'Gemuese kurz anbraten.' },
      { stepNumber: 3, instruction: 'Sauce anruehren, mit Nudeln mischen und servieren.' }
    ],
    nutritionalValues: { calories: 540, protein: 18, carbohydrates: 72, fat: 20 },
    authors: [{ name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' }],
    createdBy: { id: 'demo-author', name: 'Christoph Ruhe' },
    category: 'Cooking',
    status: 'PUBLISHED',
    creationDate: '2026-05-05T00:00:00.000Z'
  },
  {
    id: 'r10',
    slug: 'apfel-zimt-porridge',
    img: '/recipe-images/apfel-zimt-porridge.svg',
    tag: 'Fruehstueck',
    title: 'Apfel-Zimt-Porridge',
    shortDescription: 'Cremiges Porridge mit Apfel, Zimt und geroesteten Nuessen',
    description: 'Ein warmes Fruehstueck, das schnell geht und lange satt macht.',
    preparationTime: 8,
    cookingTime: 10,
    difficulty: 'Einfach',
    servings: 2,
    ingredients: [
      { name: 'Haferflocken', amount: 120, unit: 'g' },
      { name: 'Milch', amount: 400, unit: 'ml' },
      { name: 'Apfel', amount: 1, unit: 'Stk' },
      { name: 'Zimt', amount: 1, unit: 'TL' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Haferflocken mit Milch und Zimt aufkochen.' },
      { stepNumber: 2, instruction: 'Apfel wuerfeln und kurz mitkochen.' },
      { stepNumber: 3, instruction: 'Mit Nuessen und etwas Honig servieren.' }
    ],
    nutritionalValues: { calories: 430, protein: 14, carbohydrates: 62, fat: 14 },
    authors: [{ name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }],
    createdBy: { id: 'demo-author', name: 'Michelle Zboron' },
    category: 'Cooking',
    status: 'PUBLISHED',
    creationDate: '2026-05-04T00:00:00.000Z'
  },
  {
    id: 'r11',
    slug: 'rauchige-bbq-burger',
    img: '/recipe-images/bbq-burger.svg',
    tag: 'Grillen',
    title: 'Rauchige BBQ-Burger',
    shortDescription: 'Saftige Burger mit rauchiger Sauce, Cheddar und karamellisierten Zwiebeln',
    description: 'Ein Grillabend-Favorit mit kraeftiger Sauce und weichen Buns.',
    preparationTime: 25,
    cookingTime: 20,
    difficulty: 'Mittel',
    servings: 4,
    ingredients: [
      { name: 'Rinderhack', amount: 600, unit: 'g' },
      { name: 'Burger Buns', amount: 4, unit: 'Stk' },
      { name: 'Cheddar', amount: 4, unit: 'Scheiben' },
      { name: 'BBQ Sauce', amount: 120, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Patties formen und kalt stellen.' },
      { stepNumber: 2, instruction: 'Zwiebeln langsam karamellisieren.' },
      { stepNumber: 3, instruction: 'Patties grillen, mit Cheddar belegen und Burger bauen.' }
    ],
    nutritionalValues: { calories: 780, protein: 42, carbohydrates: 48, fat: 46 },
    authors: [{ name: 'Christoph Ruhe', avatar: '/static/images/avatar/1.jpg' }],
    createdBy: { id: 'demo-author', name: 'Christoph Ruhe' },
    category: 'Barbeque',
    status: 'PUBLISHED',
    creationDate: '2026-05-03T00:00:00.000Z'
  },
  {
    id: 'r12',
    slug: 'vanille-panna-cotta-mit-beeren',
    img: '/recipe-images/panna-cotta-beeren.svg',
    tag: 'Dessert',
    title: 'Vanille-Panna-Cotta mit Beeren',
    shortDescription: 'Seidige Panna Cotta mit Vanille und frischem Beerenkompott',
    description: 'Ein elegantes Dessert, das sich gut vorbereiten laesst.',
    preparationTime: 20,
    cookingTime: 10,
    difficulty: 'Mittel',
    servings: 6,
    ingredients: [
      { name: 'Sahne', amount: 600, unit: 'ml' },
      { name: 'Vanilleschote', amount: 1, unit: 'Stk' },
      { name: 'Gelatine', amount: 4, unit: 'Blatt' },
      { name: 'Beeren', amount: 300, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'Sahne mit Vanille und Zucker erhitzen.' },
      { stepNumber: 2, instruction: 'Gelatine einweichen, einruehren und in Foermchen fuellen.' },
      { stepNumber: 3, instruction: 'Kalt stellen und mit Beerenkompott servieren.' }
    ],
    nutritionalValues: { calories: 390, protein: 5, carbohydrates: 24, fat: 30 },
    authors: [{ name: 'Michelle Zboron', avatar: '/static/images/avatar/1.jpg' }],
    createdBy: { id: 'demo-author', name: 'Michelle Zboron' },
    category: 'Desserts',
    status: 'PUBLISHED',
    creationDate: '2026-05-02T00:00:00.000Z'
  }
];
