import {
  WaterIntake,
  UserSettings,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DrinkType
} from '@/types';

// LocalStorage操作のラッパークラス
export class WaterTrackerStorage {
  // データバージョン管理
  private static readonly VERSION = '1.0.0';

  // 摂取記録の保存
  static saveIntake(intake: WaterIntake): void {
    try {
      const existingIntakes = this.getAllIntakes();
      existingIntakes.push(intake);
      localStorage.setItem(STORAGE_KEYS.INTAKES, JSON.stringify(existingIntakes));
    } catch (error) {
      console.error('Error saving intake:', error);
    }
  }

  // 全摂取記録の取得
  static getAllIntakes(): WaterIntake[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INTAKES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading intakes:', error);
      return [];
    }
  }

  // 指定日の摂取記録を取得
  static getIntakesByDate(date: string): WaterIntake[] {
    const allIntakes = this.getAllIntakes();
    return allIntakes.filter(intake => intake.date === date);
  }

  // 日付範囲での摂取記録を取得
  static getIntakesByDateRange(startDate: string, endDate: string): WaterIntake[] {
    const allIntakes = this.getAllIntakes();
    return allIntakes.filter(intake =>
      intake.date >= startDate && intake.date <= endDate
    );
  }

  // 摂取記録を削除
  static deleteIntake(id: string): void {
    try {
      const existingIntakes = this.getAllIntakes();
      const filteredIntakes = existingIntakes.filter(intake => intake.id !== id);
      localStorage.setItem(STORAGE_KEYS.INTAKES, JSON.stringify(filteredIntakes));
    } catch (error) {
      console.error('Error deleting intake:', error);
    }
  }

  // 設定の保存
  static saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // 設定の取得
  static getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const settings = JSON.parse(data);
        // デフォルト設定とマージ（新しいプロパティが追加された場合の対応）
        return { ...DEFAULT_SETTINGS, ...settings };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  // バージョン情報の取得・設定
  static getVersion(): string {
    return localStorage.getItem(STORAGE_KEYS.VERSION) || '0.0.0';
  }

  static setVersion(): void {
    localStorage.setItem(STORAGE_KEYS.VERSION, this.VERSION);
  }

  // データマイグレーション
  static migrateData(): void {
    const currentVersion = this.getVersion();

    if (currentVersion !== this.VERSION) {
      console.log(`Migrating data from ${currentVersion} to ${this.VERSION}`);

      // 将来のバージョンアップ時のマイグレーション処理をここに追加
      // switch (currentVersion) {
      //   case '0.0.0':
      //     // 初回インストール or 古いバージョンからの移行
      //     break;
      // }

      this.setVersion();
    }
  }

  // 全データのクリア
  static clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.INTAKES);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.VERSION);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  // データのエクスポート（将来拡張用）
  static exportData(): string {
    const intakes = this.getAllIntakes();
    const settings = this.getSettings();

    return JSON.stringify({
      version: this.VERSION,
      exportDate: new Date().toISOString(),
      intakes,
      settings
    }, null, 2);
  }

  // 今日の日付文字列を取得
  static getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // UUID生成（簡易版）
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}