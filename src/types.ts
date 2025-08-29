export type Category = 'Laptops' | 'Desktops' | 'Accessories';

export interface Product {
  name: string;
  category: Category;
  description: string;
  price: number;
  images?: string[];
  stock?: number;
}

// Extend Express Request to include user from JWT
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}