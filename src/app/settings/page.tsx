'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserSettings, ActivityLevel } from '@/types';
import { WaterTrackerStorage } from '@/lib/storage';
import { GoalCalculator } from '@/lib/calculations';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // フォーム用の状態
  const [customGoal, setCustomGoal] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [bodyWeight, setBodyWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [calculatedGoal, setCalculatedGoal] = useState(0);

  // 設定を読み込み
  useEffect(() => {
    const loadSettings = () => {
      try {
        const currentSettings = WaterTrackerStorage.getSettings();
        setSettings(currentSettings);

        // フォームに現在の値を設定
        setCustomGoal(currentSettings.dailyGoal.goalAmount.toString());
        setIsCustomMode(currentSettings.dailyGoal.isCustom);
        setBodyWeight(currentSettings.dailyGoal.bodyWeight?.toString() || '');
        setActivityLevel(currentSettings.dailyGoal.activityLevel || 'moderate');

        // 自動計算目標を設定
        if (currentSettings.dailyGoal.bodyWeight) {
          const calculated = GoalCalculator.calculateRecommendedIntake(
            currentSettings.dailyGoal.bodyWeight,
            currentSettings.dailyGoal.activityLevel || 'moderate'
          );
          setCalculatedGoal(calculated);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 体重・活動量が変更されたときの自動計算
  useEffect(() => {
    const weight = parseFloat(bodyWeight);
    if (weight && weight > 0) {
      const calculated = GoalCalculator.calculateRecommendedIntake(weight, activityLevel);
      setCalculatedGoal(calculated);
    } else {
      setCalculatedGoal(0);
    }
  }, [bodyWeight, activityLevel]);

  // 設定を保存
  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);

    try {
      const goalAmount = isCustomMode
        ? parseInt(customGoal)
        : calculatedGoal > 0 ? calculatedGoal : 2000;

      const newSettings: UserSettings = {
        ...settings,
        dailyGoal: {
          goalAmount,
          isCustom: isCustomMode,
          bodyWeight: bodyWeight ? parseFloat(bodyWeight) : undefined,
          activityLevel,
          updatedAt: Date.now()
        }
      };

      WaterTrackerStorage.saveSettings(newSettings);
      setSettings(newSettings);

      // 成功メッセージ（簡易版）
      alert('設定を保存しました');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 設定をリセット
  const resetSettings = () => {
    if (confirm('設定をデフォルトにリセットしますか？')) {
      WaterTrackerStorage.clearAllData();
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800 mb-2">
            設定の読み込みに失敗しました
          </div>
          <Link href="/" className="btn-primary">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-primary-500 hover:text-primary-600">
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            ⚙️ 設定
          </h1>
          <div className="w-12"></div> {/* スペーサー */}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 目標設定方式選択 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">目標設定方式</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={!isCustomMode}
                onChange={() => setIsCustomMode(false)}
                className="w-4 h-4 text-primary-500"
              />
              <span className="font-medium">自動計算（推奨）</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={isCustomMode}
                onChange={() => setIsCustomMode(true)}
                className="w-4 h-4 text-primary-500"
              />
              <span className="font-medium">カスタム設定</span>
            </label>
          </div>
        </div>

        {/* 自動計算設定 */}
        {!isCustomMode && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">体重・活動量</h2>

            <div className="space-y-4">
              {/* 体重入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  体重 (kg)
                </label>
                <input
                  type="number"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder="例: 60"
                  min="30"
                  max="200"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* 活動量選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  活動量
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: 'light' as ActivityLevel, label: '軽い活動', desc: 'デスクワーク中心' },
                    { key: 'moderate' as ActivityLevel, label: '普通の活動', desc: '適度な運動・移動' },
                    { key: 'intense' as ActivityLevel, label: '激しい活動', desc: '運動・肉体労働' }
                  ].map((option) => (
                    <label
                      key={option.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        activityLevel === option.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={activityLevel === option.key}
                        onChange={() => setActivityLevel(option.key)}
                        className="w-4 h-4 text-primary-500"
                      />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 計算結果 */}
              {calculatedGoal > 0 && (
                <div className="bg-primary-50 p-4 rounded-lg">
                  <div className="text-sm text-primary-700 mb-1">推奨摂取量</div>
                  <div className="text-2xl font-bold text-primary-800">
                    {calculatedGoal.toLocaleString()}ml / 日
                  </div>
                  <div className="text-xs text-primary-600 mt-1">
                    計算式: 体重×30ml + 活動量補正
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* カスタム目標設定 */}
        {isCustomMode && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">カスタム目標</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1日の目標摂取量 (ml)
              </label>
              <input
                type="number"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="例: 2000"
                min="500"
                max="5000"
                step="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-1">
                500ml〜5000mlの範囲で設定してください
              </div>
            </div>
          </div>
        )}

        {/* 現在の設定 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">現在の設定</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">目標摂取量</span>
              <span className="font-medium">{settings.dailyGoal.goalAmount.toLocaleString()}ml</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">設定方式</span>
              <span className="font-medium">{settings.dailyGoal.isCustom ? 'カスタム' : '自動計算'}</span>
            </div>
            {settings.dailyGoal.bodyWeight && (
              <div className="flex justify-between">
                <span className="text-gray-600">体重</span>
                <span className="font-medium">{settings.dailyGoal.bodyWeight}kg</span>
              </div>
            )}
            {settings.dailyGoal.activityLevel && (
              <div className="flex justify-between">
                <span className="text-gray-600">活動量</span>
                <span className="font-medium">
                  {settings.dailyGoal.activityLevel === 'light' ? '軽い活動' :
                   settings.dailyGoal.activityLevel === 'moderate' ? '普通の活動' : '激しい活動'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 操作ボタン */}
        <div className="space-y-3">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </button>

          <button
            onClick={resetSettings}
            className="w-full px-4 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
          >
            設定をリセット
          </button>
        </div>
      </div>
    </div>
  );
}