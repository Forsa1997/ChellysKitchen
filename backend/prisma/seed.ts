import { PrismaClient, UserRole, RecipeDifficulty, RecipeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chellyskitchen.com' },
    update: {},
    create: {
      email: 'admin@chellyskitchen.com',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create test users
  const memberPassword = await bcrypt.hash('member123', 10);
  const member = await prisma.user.upsert({
    where: { email: 'member@chellyskitchen.com' },
    update: {},
    create: {
      email: 'member@chellyskitchen.com',
      name: 'Member User',
      password: memberPassword,
      role: UserRole.MEMBER,
    },
  });
  console.log('Created member user:', member.email);

  // Create categories
  const categories = [
    { name: 'Frühstück', slug: 'fruehstueck', description: 'Morgendliche Köstlichkeiten', icon: 'breakfast_dining' },
    { name: 'Mittagessen', slug: 'mittagessen', description: 'Hauptgerichte für den Tag', icon: 'lunch_dining' },
    { name: 'Abendessen', slug: 'abendessen', description: 'Abendliche Mahlzeiten', icon: 'dinner_dining' },
    { name: 'Dessert', slug: 'dessert', description: 'Süße Nachspeisen', icon: 'cake' },
    { name: 'Snacks', slug: 'snacks', description: 'Kleine Zwischenmahlzeiten', icon: 'cookie' },
    { name: 'Getränke', slug: 'getraenke', description: 'Erfrischende Drinks', icon: 'local_cafe' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('Created categories');

  // Create sample recipes
  const recipes = [
    {
      slug: 'pasta-carbonara',
      title: 'Pasta Carbonara',
      shortDescription: 'Klassische italienische Carbonara mit Speck und Ei',
      description: 'Ein authentisches italienisches Rezept für Pasta Carbonara. Einfach, aber köstlich!',
      difficulty: RecipeDifficulty.EINFACH,
      servings: 4,
      preparationTime: 15,
      cookingTime: 20,
      category: 'Mittagessen',
      status: RecipeStatus.PUBLISHED,
      ingredients: [
        { name: 'Spaghetti', amount: 400, unit: 'g' },
        { name: 'Speck', amount: 150, unit: 'g' },
        { name: 'Eier', amount: 4, unit: 'Stk' },
        { name: 'Parmesan', amount: 100, unit: 'g' },
        { name: 'Pfeffer', amount: 1, unit: 'TL' },
      ],
      steps: [
        { stepNumber: 1, instruction: 'Spaghetti in kochendem Salzwasser al dente kochen.' },
        { stepNumber: 2, instruction: 'Speck in Würfel schneiden und knusprig anbraten.' },
        { stepNumber: 3, instruction: 'Eier mit Parmesan und Pfeffer verrühren.' },
        { stepNumber: 4, instruction: 'Nudeln abgießen, aber etwas Nudelwasser behalten.' },
        { stepNumber: 5, instruction: 'Speck zu den Nudeln geben und kurz erhitzen.' },
        { stepNumber: 6, instruction: 'Ei-Mischung unter Rühren hinzufügen.' },
        { stepNumber: 7, instruction: 'Mit etwas Nudelwasser cremig rühren und servieren.' },
      ],
      nutritionalValues: { calories: 650, protein: 25, carbohydrates: 70, fat: 30 },
    },
    {
      slug: 'chicken-curry',
      title: 'Hühnchen-Curry',
      shortDescription: 'Würziges Hühnchen-Curry mit Kokosmilch',
      description: 'Ein aromatisches Curry mit Hühnchen, Gemüse und Kokosmilch.',
      difficulty: RecipeDifficulty.MITTEL,
      servings: 4,
      preparationTime: 20,
      cookingTime: 30,
      category: 'Mittagessen',
      status: RecipeStatus.PUBLISHED,
      ingredients: [
        { name: 'Hühnchenbrust', amount: 500, unit: 'g' },
        { name: 'Kokosmilch', amount: 400, unit: 'ml' },
        { name: 'Currypaste', amount: 2, unit: 'EL' },
        { name: 'Zwiebeln', amount: 2, unit: 'Stk' },
        { name: 'Paprika', amount: 1, unit: 'Stk' },
      ],
      steps: [
        { stepNumber: 1, instruction: 'Hühnchen in Würfel schneiden.' },
        { stepNumber: 2, instruction: 'Zwiebeln und Paprika würfeln.' },
        { stepNumber: 3, instruction: 'Currypaste in Öl anbraten.' },
        { stepNumber: 4, instruction: 'Hühnchen hinzufügen und anbraten.' },
        { stepNumber: 5, instruction: 'Gemüse dazugeben und kurz mitbraten.' },
        { stepNumber: 6, instruction: 'Kokosmilch hinzufügen und 20 Min köcheln lassen.' },
      ],
      nutritionalValues: { calories: 450, protein: 35, carbohydrates: 15, fat: 25 },
    },
  ];

  for (const recipe of recipes) {
    await prisma.recipe.upsert({
      where: { slug: recipe.slug },
      update: {},
      create: {
        ...recipe,
        createdById: admin.id,
        publishedAt: new Date(),
        publishedBy: admin.id,
      },
    });
  }
  console.log('Created sample recipes');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
