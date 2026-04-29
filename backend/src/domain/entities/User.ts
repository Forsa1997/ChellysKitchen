// User Entity
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN';
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  role?: 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN';
}
