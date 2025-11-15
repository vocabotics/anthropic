import React from 'react';
import { useAuthStore } from '../stores/auth';
import { FolderKanban, Code, Zap, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { name: 'Active Projects', value: '0', icon: FolderKanban, color: 'bg-blue-500' },
    { name: 'Generated Artifacts', value: '0', icon: Code, color: 'bg-green-500' },
    { name: 'AI Calls This Month', value: '0', icon: Zap, color: 'bg-yellow-500' },
    { name: 'Total Cost', value: '$0.00', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's an overview of your AI-powered development activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Getting Started
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Connect your GitHub account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Enable automatic repository creation and commits for your projects
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Add your OpenRouter API key (optional)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Bring your own key for full control over AI model access
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Create your first project
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Start with a vision and let AI orchestrate the entire development process
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
