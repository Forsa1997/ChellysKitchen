// Rating Entity
export interface Rating {
  id: string;
  userId: string;
  recipeId: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRatingInput {
  userId: string;
  recipeId: string;
  stars: number;
}

export interface UpdateRatingInput {
  stars: number;
}
