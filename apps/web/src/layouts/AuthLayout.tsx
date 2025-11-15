import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Vocabotics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Orchestration {'>'} Iteration
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
