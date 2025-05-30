import { REFLECTION_PROMPTS, AFFIRMATION_PROMPTS } from '../constants/prompts';

export function generateWeeklyPrompt(): string {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - oneJan.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.ceil((days + oneJan.getDay() + 1) / 7);
  
  // Alternate between reflection and affirmation prompts every week
  const isReflectionWeek = week % 2 === 0;
  const prompts = isReflectionWeek ? REFLECTION_PROMPTS : AFFIRMATION_PROMPTS;
  const index = Math.floor(week / 2) % prompts.length;
  
  return prompts[index];
} 