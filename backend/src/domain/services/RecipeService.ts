// Recipe Service
export class RecipeService {
  static calculateTotalTime(preparationTime: number, cookingTime: number): number {
    return preparationTime + cookingTime;
  }

  static formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }

  static validateIngredients(ingredients: Array<{ name: string; amount: number; unit: string }>): boolean {
    return ingredients.every(
      (ing) => ing.name.trim() !== '' && ing.amount > 0 && ing.unit.trim() !== ''
    );
  }

  static validateSteps(steps: Array<{ stepNumber: number; instruction: string }>): boolean {
    return steps.every((step) => step.stepNumber > 0 && step.instruction.trim() !== '');
  }
}