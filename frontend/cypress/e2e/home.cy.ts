describe('home page integration', () => {
  it('renders recipes from API and allows searching', () => {
    cy.intercept('GET', '**/api/recipes', {
      statusCode: 200,
      body: {
        data: [
          {
            id: '1',
            img: 'https://example.com/pasta.jpg',
            tag: 'Quick',
            title: 'Tomato Pasta',
            shortDescription: 'Fresh tomato sauce with basil',
            preparationTime: 10,
            cookingTime: 20,
            difficulty: 'Easy',
            servings: 2,
            ingredients: [{ name: 'Tomato', amount: 4, unit: 'pcs' }],
            steps: [{ stepNumber: 1, instruction: 'Cook pasta.' }],
            category: 'Cooking',
          },
          {
            id: '2',
            img: 'https://example.com/cake.jpg',
            tag: 'Sweet',
            title: 'Chocolate Cake',
            shortDescription: 'Fluffy cake with cocoa',
            preparationTime: 15,
            cookingTime: 35,
            difficulty: 'Medium',
            servings: 8,
            ingredients: [{ name: 'Flour', amount: 300, unit: 'g' }],
            steps: [{ stepNumber: 1, instruction: 'Mix ingredients.' }],
            category: 'Baking',
          },
        ],
      },
    }).as('recipes');

    cy.visit('/');
    cy.wait('@recipes');

    cy.contains('Tomato Pasta').should('be.visible');
    cy.contains('Chocolate Cake').should('be.visible');

    cy.get('input[placeholder=\"z. B. Pasta\"]').type('Chocolate');
    cy.contains('Chocolate Cake').should('be.visible');
    cy.contains('Tomato Pasta').should('not.exist');
  });
});
