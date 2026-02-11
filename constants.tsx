
import { Category } from './types';

export const REWARDS = [5, 10, 20, 30, 50, 75, 100, 150, 250, 400, 500, 650, 800, 900, 1000];
export const SAFETY_POINTS = [4, 9]; // Q5 (index 4) and Q10 (index 9)
export const GET_SAFETY_EARNINGS = (currentQuestionIndex: number) => {
  if (currentQuestionIndex >= 9) return 400;
  if (currentQuestionIndex >= 4) return 50;
  return 0;
};

export const CATEGORIES: Category[] = [
  Category.SPORTS,
  Category.HISTORY,
  Category.GEOGRAPHY,
  Category.CULTURE,
  Category.GENERAL,
];
