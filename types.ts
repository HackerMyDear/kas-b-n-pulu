
export enum Category {
  SPORTS = "İdman",
  HISTORY = "Tarix",
  POLITICS = "Siyasət",
  ARTS = "İncəsənət",
  GEOGRAPHY = "Coğrafiya",
  CULTURE = "Mədəniyyət",
  GENERAL = "Ümumi"
}

export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Question {
  id: string;
  category: Category;
  difficulty: number; // 1-12
  question_text: string;
  hint?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correct_option: OptionKey;
  explanation: string;
}

export interface QuizRun {
  id: string;
  user_id: string;
  display_name: string;
  started_at: Date;
  ended_at?: Date;
  final_earnings: number;
  correct_count: number;
  used_audience: boolean;
  used_expert: boolean;
  used_hint: boolean;
  used_second_chance: boolean;
  used_fifty_fifty: boolean;
  used_authority: boolean;
  category_mode: 'random' | 'chosen';
  initial_category?: Category;
}

export interface QuizStep {
  id?: string;
  event_type?: 'answer' | 'joker' | 'category_switch';
  created_at?: Date;
  run_id: string;
  question_number: number;
  question_id: string;
  category: Category;
  difficulty: number;
  selected_option?: OptionKey;
  is_correct?: boolean;
  earnings_after: number;
  used_joker?: 'expert' | 'hint' | 'second_chance' | 'fifty_fifty' | 'authority' | 'audience';
  audience_result?: Record<OptionKey, number>;
  category_switch_to?: Category;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  best_earnings: number;
  runs_count: number;
}

export interface AdminSummary {
  total_runs: number;
  total_players: number;
  avg_earnings: number;
  top_earnings: number;
  recent_runs: QuizRun[];
  recent_steps: QuizStep[];
  category_switches: QuizStep[];
}
