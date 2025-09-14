'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WaterIntake, DailyStats, ChartData, DRINK_TYPES } from '@/types';
import { WaterTrackerStorage } from '@/lib/storage';
import { DataAggregator } from '@/lib/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

type Period = 'week' | 'month' | 'all';

export default function HistoryPage() {
  const [intakes, setIntakes] = useState<WaterIntake[]>([]);
  const [period, setPeriod] = useState<Period>('week');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    achievedDays: 0,
    averageIntake: 0,
    maxIntake: 0,
    achievementRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // 期間に応じたデータを取得
  const getDateRange = (period: Period): { start: string; end: string } => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];

    let start: string;
    switch (period) {
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        start = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        start = monthAgo.toISOString().split('T')[0];
        break;
      case 'all':
      default:
        start = '2020-01-01'; // 十分に古い日付
        break;
    }

    return { start, end };
  };

  // データを読み込み・集計
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        const settings = WaterTrackerStorage.getSettings();
        const goalAmount = settings.dailyGoal.goalAmount;

        const { start, end } = getDateRange(period);
        const periodIntakes = WaterTrackerStorage.getIntakesByDateRange(start, end);

        setIntakes(periodIntakes);

        // 日別データを生成
        const dateMap = new Map<string, WaterIntake[]>();
        periodIntakes.forEach(intake => {
          if (!dateMap.has(intake.date)) {
            dateMap.set(intake.date, []);
          }
          dateMap.get(intake.date)!.push(intake);
        });

        // チャートデータを生成
        const chartDataArray: ChartData[] = [];
        const dates = Array.from(dateMap.keys()).sort();

        // 最近30日分のデータを表示（期間によって調整）
        const displayDays = period === 'week' ? 7 : period === 'month' ? 30 : Math.min(dates.length, 30);
        const recentDates = dates.slice(-displayDays);

        let totalIntake = 0;
        let achievedDays = 0;
        let maxIntake = 0;

        recentDates.forEach(date => {
          const dayIntakes = dateMap.get(date) || [];
          const dayTotal = DataAggregator.getDailyTotal(dayIntakes);
          const achievement = DataAggregator.calculateAchievementRate(dayTotal, goalAmount);

          chartDataArray.push({
            date: new Date(date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
            amount: dayTotal,
            goal: goalAmount,
            achievement
          });

          totalIntake += dayTotal;
          if (achievement >= 100) achievedDays++;
          if (dayTotal > maxIntake) maxIntake = dayTotal;
        });

        setChartData(chartDataArray);

        // 統計を計算
        const totalDays = recentDates.length;
        const averageIntake = totalDays > 0 ? Math.round(totalIntake / totalDays) : 0;
        const achievementRate = totalDays > 0 ? Math.round((achievedDays / totalDays) * 100) : 0;

        setStats({
          totalDays,
          achievedDays,
          averageIntake,
          maxIntake,
          achievementRate
        });

      } catch (error) {
        console.error('Error loading history data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [period]);

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-primary-500 hover:text-primary-600">
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            📊 履歴・統計
          </h1>
          <Link
            href="/settings"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            ⚙️ 設定
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 期間選択 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">期間選択</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'week' as Period, label: '1週間' },
              { key: 'month' as Period, label: '1ヶ月' },
              { key: 'all' as Period, label: '全期間' }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setPeriod(option.key)}
                className={`p-3 rounded-lg font-medium transition-colors ${
                  period === option.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-primary-600">
              {stats.totalDays}
            </div>
            <div className="text-sm text-gray-500">記録日数</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.achievedDays}
            </div>
            <div className="text-sm text-gray-500">目標達成日</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.averageIntake.toLocaleString()}ml
            </div>
            <div className="text-sm text-gray-500">平均摂取量</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.maxIntake.toLocaleString()}ml
            </div>
            <div className="text-sm text-gray-500">最高摂取量</div>
          </div>
        </div>

        {/* 達成率カード */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">目標達成率</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">
              {stats.achievementRate}%
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill bg-primary-500"
                style={{ width: `${Math.min(stats.achievementRate, 100)}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {stats.achievedDays} / {stats.totalDays} 日達成
            </div>
          </div>
        </div>

        {/* 摂取量グラフ */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">日別摂取量</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}ml`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()}ml`,
                      name === 'amount' ? '摂取量' : '目標'
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="goal" fill="#e5e7eb" name="目標" />
                  <Bar dataKey="amount" fill="#3b82f6" name="摂取量" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 達成率推移グラフ */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">達成率推移</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value) => [`${Math.round(Number(value))}%`, '達成率']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="achievement"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="達成率"
                  />
                  {/* 100%ライン */}
                  <Line
                    type="monotone"
                    dataKey={() => 100}
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    dot={false}
                    name="目標"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* データがない場合 */}
        {chartData.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-lg font-semibold text-gray-800 mb-2">
              データがありません
            </div>
            <div className="text-gray-500 mb-6">
              水分摂取を記録すると、ここに統計が表示されます
            </div>
            <Link href="/" className="btn-primary">
              記録を開始
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}