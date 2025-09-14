import {
  WaterIntake,
  DailyStats,
  WeeklyStats,
  MonthlyStats,
  ActivityLevel,
  ACTIVITY_BONUS
} from '@/types';

// データ集計と計算のユーティリティクラス
export class DataAggregator {
  // 日別の合計摂取量を計算
  static getDailyTotal(intakes: WaterIntake[]): number {
    return intakes.reduce((total, intake) => total + intake.amount, 0);
  }

  // 日別統計を生成
  static getDailyStats(intakes: WaterIntake[], goalAmount: number, date: string): DailyStats {
    const dayIntakes = intakes.filter(intake => intake.date === date);
    const totalAmount = this.getDailyTotal(dayIntakes);
    const achievementRate = goalAmount > 0 ? (totalAmount / goalAmount) * 100 : 0;

    return {
      date,
      totalAmount,
      goalAmount,
      achievementRate,
      intakeCount: dayIntakes.length
    };
  }

  // 週別統計を生成
  static getWeeklyStats(intakes: WaterIntake[], goalAmount: number, weekStart: string): WeeklyStats {
    const weekEnd = this.addDays(weekStart, 6);
    const weekIntakes = intakes.filter(intake =>
      intake.date >= weekStart && intake.date <= weekEnd
    );

    const dailyStats: DailyStats[] = [];
    let totalAmount = 0;
    let achievedDays = 0;

    for (let i = 0; i < 7; i++) {
      const currentDate = this.addDays(weekStart, i);
      const dayStats = this.getDailyStats(weekIntakes, goalAmount, currentDate);
      dailyStats.push(dayStats);
      totalAmount += dayStats.totalAmount;
      if (dayStats.achievementRate >= 100) achievedDays++;
    }

    return {
      weekStart,
      weekEnd,
      averageAmount: totalAmount / 7,
      totalAmount,
      achievedDays,
      dailyStats
    };
  }

  // 月別統計を生成
  static getMonthlyStats(intakes: WaterIntake[], goalAmount: number, year: number, month: number): MonthlyStats {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = this.getLastDayOfMonth(year, month);

    const monthIntakes = intakes.filter(intake =>
      intake.date >= startDate && intake.date <= endDate
    );

    const daysInMonth = new Date(year, month, 0).getDate();
    const weeks = this.getWeeksInMonth(year, month);

    let totalAmount = 0;
    let achievedDays = 0;
    let recordedDays = 0;

    const weeklyStats: WeeklyStats[] = weeks.map(weekStart =>
      this.getWeeklyStats(monthIntakes, goalAmount, weekStart)
    );

    // 月間統計を集計
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayIntakes = monthIntakes.filter(intake => intake.date === dateString);
      const dayTotal = this.getDailyTotal(dayIntakes);

      totalAmount += dayTotal;
      if (dayTotal > 0) recordedDays++;
      if (dayTotal >= goalAmount) achievedDays++;
    }

    return {
      year,
      month,
      averageAmount: recordedDays > 0 ? totalAmount / recordedDays : 0,
      totalAmount,
      achievedDays,
      totalDays: recordedDays,
      weeklyStats
    };
  }

  // 達成率を計算
  static calculateAchievementRate(total: number, goal: number): number {
    return goal > 0 ? Math.round((total / goal) * 100) : 0;
  }

  // 日付に日数を加算
  private static addDays(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  // 月の最終日を取得
  private static getLastDayOfMonth(year: number, month: number): string {
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
  }

  // 月の週の開始日一覧を取得
  private static getWeeksInMonth(year: number, month: number): string[] {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // 月の最初の週の開始日（月曜日）を求める
    const firstMonday = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    firstMonday.setDate(firstDay.getDate() + daysToMonday);

    const weeks: string[] = [];
    const currentWeek = new Date(firstMonday);

    while (currentWeek <= lastDay) {
      weeks.push(currentWeek.toISOString().split('T')[0]);
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    return weeks;
  }
}

// 目標計算のユーティリティクラス
export class GoalCalculator {
  // 体重と活動量に基づく推奨摂取量を計算
  static calculateRecommendedIntake(bodyWeight: number, activityLevel: ActivityLevel): number {
    const baseAmount = bodyWeight * 30; // 基本計算: 体重×30ml
    const activityBonus = ACTIVITY_BONUS[activityLevel];

    return Math.round(baseAmount + activityBonus);
  }

  // 1時間あたりの推奨摂取量を計算（16時間で分割）
  static getHourlyRecommendation(dailyGoal: number): number {
    return Math.round(dailyGoal / 16); // 起床時間を16時間と仮定
  }

  // 残り時間での必要摂取量を計算
  static getRemainingIntakeNeeded(currentAmount: number, goalAmount: number, hoursLeft: number): number {
    const remaining = goalAmount - currentAmount;
    return remaining > 0 ? Math.round(remaining / Math.max(hoursLeft, 1)) : 0;
  }
}

// 進捗色の計算
export class ProgressHelper {
  // 達成率に基づいて進捗色を取得
  static getProgressColor(achievementRate: number): string {
    if (achievementRate >= 100) return 'progress-complete';
    if (achievementRate >= 67) return 'progress-high';
    if (achievementRate >= 34) return 'progress-medium';
    return 'progress-low';
  }

  // 進捗バーの幅を計算
  static getProgressWidth(current: number, goal: number): number {
    if (goal === 0) return 0;
    const percentage = (current / goal) * 100;
    return Math.min(percentage, 100); // 100%でキャップ
  }

  // お祝いメッセージを生成
  static getCongratulationMessage(achievementRate: number): string | null {
    if (achievementRate >= 200) return '🎉 素晴らしい！目標の2倍達成！';
    if (achievementRate >= 150) return '🌟 すごい！目標の1.5倍達成！';
    if (achievementRate >= 100) return '✨ おめでとう！今日の目標達成！';
    return null;
  }
}