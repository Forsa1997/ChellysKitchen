export const recipes = [
  {
    id: 'r1',
    img: 'https://picsum.photos/800/450?random=1',
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
    img: 'https://picsum.photos/800/450?random=2',
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
    img: 'https://picsum.photos/800/450?random=3',
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
  }
];
