// Rating Service
export class RatingService {
  static calculateAverage(ratings: number[]): number {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }

  static isValidRating(stars: number): boolean {
    return stars >= 1 && stars <= 5 && Number.isInteger(stars);
  }
}