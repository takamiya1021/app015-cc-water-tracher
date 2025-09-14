'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WaterIntake, DrinkType, PRESET_AMOUNTS } from '@/types';
import { WaterTrackerStorage } from '@/lib/storage';
import { DataAggregator, ProgressHelper } from '@/lib/calculations';

// メインページコンポーネント
export default function HomePage() {
  const [todayIntakes, setTodayIntakes] = useState<WaterIntake[]>([]);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [goalAmount, setGoalAmount] = useState(2000);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType>('water');
  const [isLoading, setIsLoading] = useState(true);

  // 今日の日付文字列を取得
  const today = WaterTrackerStorage.getTodayString();

  // 初期データの読み込み
  useEffect(() => {
    const loadData = () => {
      try {
        // データマイグレーション実行
        WaterTrackerStorage.migrateData();

        // 設定を読み込み
        const settings = WaterTrackerStorage.getSettings();
        setGoalAmount(settings.dailyGoal.goalAmount);

        // 今日の摂取記録を読み込み
        const intakes = WaterTrackerStorage.getIntakesByDate(today);
        setTodayIntakes(intakes);

        // 今日の合計摂取量を計算
        const total = DataAggregator.getDailyTotal(intakes);
        setCurrentAmount(total);

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [today]);

  // 摂取記録を追加
  const addIntake = (amount: number, drinkType: DrinkType) => {
    try {
      const newIntake: WaterIntake = {
        id: WaterTrackerStorage.generateId(),
        timestamp: Date.now(),
        amount,
        drinkType,
        date: today
      };

      WaterTrackerStorage.saveIntake(newIntake);

      // 状態を更新
      const updatedIntakes = [...todayIntakes, newIntake];
      setTodayIntakes(updatedIntakes);

      const newTotal = DataAggregator.getDailyTotal(updatedIntakes);
      setCurrentAmount(newTotal);

      // カスタム入力をクリア
      setCustomAmount('');
    } catch (error) {
      console.error('Error adding intake:', error);
    }
  };

  // プリセット量の記録
  const handlePresetClick = (amount: number) => {
    addIntake(amount, selectedDrinkType);
  };

  // カスタム量の記録
  const handleCustomSubmit = () => {
    const amount = parseInt(customAmount);
    if (amount && amount > 0 && amount <= 9999) {
      addIntake(amount, selectedDrinkType);
    }
  };

  // 進捗率を計算
  const achievementRate = ProgressHelper.getProgressWidth(currentAmount, goalAmount);
  const progressColor = ProgressHelper.getProgressColor(achievementRate);
  const congratulationMessage = ProgressHelper.getCongratulationMessage(achievementRate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            💧 水分摂取トラッカー
          </h1>
          <Link
            href="/history"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            📊 履歴
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 今日の進捗表示 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">今日の摂取量</h2>
            <div className="text-3xl font-bold text-primary-600">
              {currentAmount.toLocaleString()}ml
            </div>
            <div className="text-sm text-gray-500">
              目標: {goalAmount.toLocaleString()}ml
            </div>
          </div>

          {/* 進捗バー */}
          <div className="progress-bar mb-4">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(achievementRate, 100)}%`,
                backgroundColor: achievementRate >= 100 ? '#10b981' :
                                 achievementRate >= 67 ? '#3b82f6' :
                                 achievementRate >= 34 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>0ml</span>
            <span className="font-medium">{achievementRate.toFixed(0)}%</span>
            <span>{goalAmount.toLocaleString()}ml</span>
          </div>

          {/* お祝いメッセージ */}
          {congratulationMessage && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-green-700 text-center font-medium">
                {congratulationMessage}
              </p>
            </div>
          )}

          {/* 残り必要量 */}
          {currentAmount < goalAmount && (
            <div className="mt-4 text-center">
              <p className="text-gray-600">
                あと <span className="font-bold text-primary-600">
                  {(goalAmount - currentAmount).toLocaleString()}ml
                </span> です！
              </p>
            </div>
          )}
        </div>

        {/* 飲み物種類選択 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">飲み物の種類</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedDrinkType('water')}
              className={`p-3 rounded-lg font-medium transition-colors ${
                selectedDrinkType === 'water'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💧 水
            </button>
            <button
              onClick={() => setSelectedDrinkType('other')}
              className={`p-3 rounded-lg font-medium transition-colors ${
                selectedDrinkType === 'other'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🥤 その他
            </button>
          </div>
        </div>

        {/* プリセット摂取量 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">よく飲む量</h3>
          <div className="grid grid-cols-2 gap-3">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset.amount}
                onClick={() => handlePresetClick(preset.amount)}
                className="btn-secondary text-center p-4"
              >
                <div className="font-bold text-lg">{preset.amount}ml</div>
                <div className="text-sm text-gray-500">{preset.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* カスタム摂取量 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">自由入力</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="量を入力 (ml)"
                min="1"
                max="9999"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleCustomSubmit}
              disabled={!customAmount || parseInt(customAmount) <= 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6"
            >
              追加
            </button>
          </div>
        </div>

        {/* 今日の記録履歴 */}
        {todayIntakes.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">今日の記録</h3>
            <div className="space-y-2">
              {todayIntakes
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((intake) => (
                  <div
                    key={intake.id}
                    className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>{intake.drinkType === 'water' ? '💧' : '🥤'}</span>
                      <span className="font-medium">{intake.amount}ml</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(intake.timestamp).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}