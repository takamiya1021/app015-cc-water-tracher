// 水分摂取記録の型定義
export interface WaterIntake {
  id: string;                    // 一意識別子 (UUID)
  timestamp: number;             // 記録日時 (Unix timestamp)
  amount: number;               // 摂取量 (ml)
  drinkType: DrinkType;         // 飲み物種類
  date: string;                 // 日付 (YYYY-MM-DD)
}

// 飲み物の種類
export type DrinkType = 'water' | 'tea' | 'coffee' | 'juice' | 'sports' | 'other';

// 飲み物種類の詳細情報
export interface DrinkTypeInfo {
  id: DrinkType;
  name: string;
  icon: string;
  category: 'hydrating' | 'caffeinated' | 'sugary' | 'other';
}

// 飲み物種類一覧
export const DRINK_TYPES: DrinkTypeInfo[] = [
  { id: 'water', name: '水', icon: '💧', category: 'hydrating' },
  { id: 'tea', name: 'お茶', icon: '🍵', category: 'hydrating' },
  { id: 'coffee', name: 'コーヒー', icon: '☕', category: 'caffeinated' },
  { id: 'juice', name: 'ジュース', icon: '🧃', category: 'sugary' },
  { id: 'sports', name: 'スポーツドリンク', icon: '🥤', category: 'hydrating' },
  { id: 'other', name: 'その他', icon: '🥛', category: 'other' }
];

// 活動量レベル
export type ActivityLevel = 'light' | 'moderate' | 'intense';

// 目標設定
export interface DailyGoal {
  goalAmount: number;           // 目標摂取量 (ml)
  isCustom: boolean;           // カスタム設定かどうか
  bodyWeight?: number;         // 体重 (kg) - 自動計算用
  activityLevel?: ActivityLevel; // 活動量
  updatedAt: number;           // 更新日時
}

// ユーザー設定
export interface UserSettings {
  dailyGoal: DailyGoal;
  presetAmounts: number[];     // プリセット量 [200, 350, 500, 1000]
  theme: 'light' | 'dark';     // テーマ設定
  notifications: boolean;       // 通知設定（将来拡張用）
}

// 統計データ
export interface DailyStats {
  date: string;                // 日付 (YYYY-MM-DD)
  totalAmount: number;         // 総摂取量
  goalAmount: number;          // 目標量
  achievementRate: number;     // 達成率 (0-100以上)
  intakeCount: number;         // 記録回数
}

export interface WeeklyStats {
  weekStart: string;           // 週の開始日 (YYYY-MM-DD)
  weekEnd: string;             // 週の終了日 (YYYY-MM-DD)
  averageAmount: number;       // 平均摂取量
  totalAmount: number;         // 週間総摂取量
  achievedDays: number;        // 目標達成日数
  dailyStats: DailyStats[];    // 日別統計
}

export interface MonthlyStats {
  year: number;                // 年
  month: number;               // 月 (1-12)
  averageAmount: number;       // 平均摂取量
  totalAmount: number;         // 月間総摂取量
  achievedDays: number;        // 目標達成日数
  totalDays: number;           // 記録日数
  weeklyStats: WeeklyStats[];  // 週別統計
}

// グラフ用データ
export interface ChartData {
  date: string;                // 日付
  amount: number;              // 摂取量
  goal: number;                // 目標量
  achievement: number;         // 達成率
}

// LocalStorage キー
export const STORAGE_KEYS = {
  INTAKES: 'water-tracker-intakes',
  SETTINGS: 'water-tracker-settings',
  VERSION: 'water-tracker-version'
} as const;

// デフォルト設定
export const DEFAULT_SETTINGS: UserSettings = {
  dailyGoal: {
    goalAmount: 2000,          // 2L
    isCustom: false,
    updatedAt: Date.now()
  },
  presetAmounts: [200, 350, 500, 1000],
  theme: 'light',
  notifications: false
};

// プリセット摂取量の定義
export const PRESET_AMOUNTS = [
  { amount: 200, label: 'コップ1杯' },
  { amount: 350, label: 'ペットボトル小' },
  { amount: 500, label: 'ペットボトル中' },
  { amount: 1000, label: 'ペットボトル大' }
];

// 活動量による追加水分量
export const ACTIVITY_BONUS = {
  light: 0,
  moderate: 200,
  intense: 500
} as const;