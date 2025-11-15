import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api';

interface TestResult {
  id: string;
  testType: 'unit' | 'integration' | 'e2e' | 'visual';
  status: 'passed' | 'failed' | 'running' | 'pending';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  executedAt: string;
}

interface VisualTest {
  id: string;
  screenshotUrl: string;
  baselineUrl?: string;
  diffUrl?: string;
  status: 'passed' | 'failed' | 'new';
  viewport: string;
  element: string;
  mismatchPercentage?: number;
  executedAt: string;
}

interface FailedTest {
  name: string;
  error: string;
  stackTrace?: string;
  duration: number;
}

interface TestingData {
  results: TestResult[];
  visualTests: VisualTest[];
  failedTests: FailedTest[];
  overallCoverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
  trends: {
    date: string;
    passRate: number;
    coverage: number;
  }[];
}

export default function Testing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<TestingData | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [selectedVisual, setSelectedVisual] = useState<VisualTest | null>(null);

  useEffect(() => {
    loadTestingData();
  }, [id]);

  const loadTestingData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/projects/${id}/testing`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load testing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTests = async (testType?: string) => {
    setRunning(true);
    try {
      await api.post(`/projects/${id}/tests/run`, { testType });
      // Refresh data after running tests
      setTimeout(loadTestingData, 2000);
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'new':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTestTypeLabel = (type: string) => {
    switch (type) {
      case 'unit':
        return 'Unit Tests';
      case 'integration':
        return 'Integration Tests';
      case 'e2e':
        return 'End-to-End Tests';
      case 'visual':
        return 'Visual Tests';
      default:
        return type;
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return 'text-green-600';
    if (coverage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No testing data available</p>
          <button
            onClick={() => handleRunTests()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run Tests
          </button>
        </div>
      </div>
    );
  }

  const passRate =
    data.results.length > 0
      ? (data.results.filter((r) => r.status === 'passed').length / data.results.length) * 100
      : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testing Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor test execution, coverage, and visual regression
          </p>
        </div>
        <button
          onClick={() => handleRunTests()}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              Run All Tests
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pass Rate</p>
              <p className={`text-3xl font-bold mt-1 ${getCoverageColor(passRate)}`}>
                {passRate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Line Coverage</p>
              <p
                className={`text-3xl font-bold mt-1 ${getCoverageColor(
                  data.overallCoverage.lines
                )}`}
              >
                {data.overallCoverage.lines.toFixed(1)}%
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tests</p>
              <p className="text-3xl font-bold mt-1 text-gray-900">
                {data.results.reduce((acc, r) => acc + r.totalTests, 0)}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Visual Tests</p>
              <p className="text-3xl font-bold mt-1 text-purple-600">
                {data.visualTests.length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Test Execution Results */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Test Execution</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.results.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No test results yet</p>
              ) : (
                data.results.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => setSelectedTest(result)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {getTestTypeLabel(result.testType)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(result.executedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          result.status
                        )}`}
                      >
                        {result.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="font-medium text-gray-900">{result.totalTests}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Passed</p>
                        <p className="font-medium text-green-600">{result.passedTests}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Failed</p>
                        <p className="font-medium text-red-600">{result.failedTests}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium text-gray-900">
                          {formatDuration(result.duration)}
                        </p>
                      </div>
                    </div>
                    {result.coverage && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Lines</p>
                            <p className={`font-medium ${getCoverageColor(result.coverage.lines)}`}>
                              {result.coverage.lines.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Statements</p>
                            <p
                              className={`font-medium ${getCoverageColor(
                                result.coverage.statements
                              )}`}
                            >
                              {result.coverage.statements.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Functions</p>
                            <p
                              className={`font-medium ${getCoverageColor(
                                result.coverage.functions
                              )}`}
                            >
                              {result.coverage.functions.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Branches</p>
                            <p
                              className={`font-medium ${getCoverageColor(result.coverage.branches)}`}
                            >
                              {result.coverage.branches.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Failed Tests */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Failed Tests</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {data.failedTests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-500">All tests passing!</p>
                </div>
              ) : (
                data.failedTests.map((test, index) => (
                  <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 mb-1">{test.name}</p>
                        <p className="text-sm text-red-700 mb-2">{test.error}</p>
                        {test.stackTrace && (
                          <details className="text-xs text-gray-600">
                            <summary className="cursor-pointer hover:text-gray-900">
                              Stack trace
                            </summary>
                            <pre className="mt-2 p-2 bg-white rounded border border-gray-200 overflow-x-auto">
                              {test.stackTrace}
                            </pre>
                          </details>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Duration: {formatDuration(test.duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Regression Tests */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Visual Regression Tests</h2>
        </div>
        <div className="p-6">
          {data.visualTests.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No visual tests yet</p>
              <button
                onClick={() => handleRunTests('visual')}
                disabled={running}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Run Visual Tests
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.visualTests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => setSelectedVisual(test)}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 relative">
                    {test.screenshotUrl ? (
                      <img
                        src={test.screenshotUrl}
                        alt={test.element}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        test.status
                      )}`}
                    >
                      {test.status}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-gray-900 mb-1">{test.element}</p>
                    <p className="text-sm text-gray-600 mb-2">{test.viewport}</p>
                    {test.mismatchPercentage !== undefined && (
                      <p className="text-xs text-gray-500">
                        Mismatch: {test.mismatchPercentage.toFixed(2)}%
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(test.executedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Test Modal */}
      {selectedVisual && (
        <div
          onClick={() => setSelectedVisual(null)}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedVisual.element}</h3>
                <p className="text-sm text-gray-600">{selectedVisual.viewport}</p>
              </div>
              <button
                onClick={() => setSelectedVisual(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedVisual.baselineUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Baseline</p>
                    <img
                      src={selectedVisual.baselineUrl}
                      alt="Baseline"
                      className="w-full border border-gray-200 rounded"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Current</p>
                  <img
                    src={selectedVisual.screenshotUrl}
                    alt="Current"
                    className="w-full border border-gray-200 rounded"
                  />
                </div>
                {selectedVisual.diffUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Difference</p>
                    <img
                      src={selectedVisual.diffUrl}
                      alt="Diff"
                      className="w-full border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>
              {selectedVisual.mismatchPercentage !== undefined && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Mismatch Percentage:</span>{' '}
                    {selectedVisual.mismatchPercentage.toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
