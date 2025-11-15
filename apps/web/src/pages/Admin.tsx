import { useEffect, useState } from 'react';
import {
  Users,
  FolderGit2,
  DollarSign,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { api } from '../lib/api';

interface PlatformStats {
  totalUsers: number;
  totalProjects: number;
  totalAICalls: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalAICosts: number;
  thisMonth: {
    newProjects: number;
    newUsers: number;
  };
}

interface AIUsageData {
  byModel: Array<{
    model: string;
    _count: number;
    _sum: { costUsd: number };
  }>;
  byTaskType: Array<{
    taskType: string;
    _count: number;
    _sum: { costUsd: number };
  }>;
}

export default function AdminPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [aiUsage, setAIUsage] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, aiUsageRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/analytics/ai-usage?days=30'),
      ]);

      setStats(statsRes.data);
      setAIUsage(aiUsageRes.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Activity className="w-8 h-8 animate-pulse text-purple-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load admin statistics</p>
      </div>
    );
  }

  const profitMargin = stats.totalRevenue - stats.totalAICosts;
  const profitPercentage = stats.totalRevenue > 0
    ? ((profitMargin / stats.totalRevenue) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Platform statistics and analytics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              +{stats.thisMonth.newUsers}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {stats.totalUsers.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">Total Users</p>
        </div>

        {/* Total Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FolderGit2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              +{stats.thisMonth.newProjects}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {stats.totalProjects.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">Total Projects</p>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              {profitMargin >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              {profitPercentage}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ${stats.totalRevenue.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </div>

        {/* AI Calls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {stats.totalAICalls.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">AI Calls Made</p>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Overview</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">AI Costs</span>
              <span className="font-semibold text-red-600">
                -${stats.totalAICosts.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Active Subscriptions</span>
              <span className="font-semibold text-gray-900">
                {stats.activeSubscriptions}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-semibold text-gray-900">Profit Margin</span>
              <span
                className={`text-lg font-bold ${
                  profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${profitMargin.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">This Month</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">New Users</span>
                <span className="font-semibold text-gray-900">
                  +{stats.thisMonth.newUsers}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (stats.thisMonth.newUsers / stats.totalUsers) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">New Projects</span>
                <span className="font-semibold text-gray-900">
                  +{stats.thisMonth.newProjects}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (stats.thisMonth.newProjects / stats.totalProjects) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Growth rate:{' '}
                <span className="font-semibold text-green-600">
                  {((stats.thisMonth.newUsers / stats.totalUsers) * 100).toFixed(1)}% users
                </span>
                {', '}
                <span className="font-semibold text-green-600">
                  {((stats.thisMonth.newProjects / stats.totalProjects) * 100).toFixed(1)}% projects
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Usage Analytics */}
      {aiUsage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Model */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Usage by Model</h2>

            <div className="space-y-3">
              {aiUsage.byModel.map((item) => (
                <div key={item.model} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.model}</div>
                    <div className="text-sm text-gray-600">
                      {item._count.toLocaleString()} calls
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${item._sum.costUsd?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Task Type */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Usage by Task Type</h2>

            <div className="space-y-3">
              {aiUsage.byTaskType.map((item) => (
                <div key={item.taskType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 capitalize">
                      {item.taskType?.replace(/_/g, ' ') || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item._count.toLocaleString()} calls
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${item._sum.costUsd?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
