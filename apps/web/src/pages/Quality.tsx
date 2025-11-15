import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  TestTube,
  Code,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';

interface QualityMetrics {
  overallScore: number;
  testCoverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
    overallScore: number;
  };
  codeQuality: {
    totalFiles: number;
    totalLines: number;
    vocaboticsTagsCount: number;
    vocaboticsTagsCoverage: number;
    qualityScore: number;
  };
  requirementCoverage: {
    totalRequirements: number;
    implementedRequirements: number;
    testedRequirements: number;
    coveragePercentage: number;
    missingRequirements: string[];
  };
  security: {
    securityScore: number;
    vulnerabilitiesCount: number;
  };
  timestamp: string;
}

export default function QualityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, [id]);

  const loadMetrics = async () => {
    try {
      const response = await api.get(`/quality/${id}/metrics`);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Failed to load quality metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await api.post(`/quality/${id}/calculate`);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error('Failed to calculate metrics:', error);
      alert('Failed to calculate metrics. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Quality Metrics Yet</h2>
          <p className="text-gray-600 mb-6">
            Calculate quality metrics to see test coverage, code quality, and more.
          </p>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {calculating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Calculate Metrics
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="text-purple-600 hover:text-purple-700 mb-4"
        >
          ← Back to Project
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quality Metrics</h1>
            <p className="text-gray-600">
              Last updated: {new Date(metrics.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {calculating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Recalculate
                </>
              )}
            </button>

            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Overall Quality Score</h2>
            <p className="text-gray-600">Weighted average across all metrics</p>
          </div>

          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(metrics.overallScore)}`}>
              {metrics.overallScore}
            </div>
            <div className="text-gray-600 mt-2">out of 100</div>
          </div>
        </div>

        <div className="mt-6 w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${getScoreBgColor(metrics.overallScore)}`}
            style={{ width: `${metrics.overallScore}%` }}
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Test Coverage */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TestTube className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Test Coverage</h3>
              <p className="text-sm text-gray-600">Code covered by tests</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Lines', value: metrics.testCoverage.lines },
              { label: 'Statements', value: metrics.testCoverage.statements },
              { label: 'Functions', value: metrics.testCoverage.functions },
              { label: 'Branches', value: metrics.testCoverage.branches },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-sm font-semibold ${getScoreColor(item.value)}`}>
                    {item.value.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getScoreBgColor(item.value)}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Overall Coverage</span>
              <span className={`text-xl font-bold ${getScoreColor(metrics.testCoverage.overallScore)}`}>
                {metrics.testCoverage.overallScore.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Code Quality */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Code className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Code Quality</h3>
              <p className="text-sm text-gray-600">Organization and traceability</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Files</span>
              <span className="font-semibold text-gray-900">
                {metrics.codeQuality.totalFiles}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Lines</span>
              <span className="font-semibold text-gray-900">
                {metrics.codeQuality.totalLines.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Files with Vocabotics Tags</span>
              <span className="font-semibold text-gray-900">
                {metrics.codeQuality.vocaboticsTagsCount}
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Tag Coverage</span>
                <span className={`font-semibold ${getScoreColor(metrics.codeQuality.vocaboticsTagsCoverage)}`}>
                  {metrics.codeQuality.vocaboticsTagsCoverage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(metrics.codeQuality.vocaboticsTagsCoverage)}`}
                  style={{ width: `${metrics.codeQuality.vocaboticsTagsCoverage}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Quality Score</span>
                <span className={`text-xl font-bold ${getScoreColor(metrics.codeQuality.qualityScore)}`}>
                  {metrics.codeQuality.qualityScore.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Requirement Coverage */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Requirement Coverage</h3>
              <p className="text-sm text-gray-600">Requirements implementation status</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Requirements</span>
              <span className="font-semibold text-gray-900">
                {metrics.requirementCoverage.totalRequirements}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Implemented</span>
              <span className="font-semibold text-green-600">
                {metrics.requirementCoverage.implementedRequirements}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tested</span>
              <span className="font-semibold text-blue-600">
                {metrics.requirementCoverage.testedRequirements}
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Coverage</span>
                <span className={`font-semibold ${getScoreColor(metrics.requirementCoverage.coveragePercentage)}`}>
                  {metrics.requirementCoverage.coveragePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(metrics.requirementCoverage.coveragePercentage)}`}
                  style={{ width: `${metrics.requirementCoverage.coveragePercentage}%` }}
                />
              </div>
            </div>

            {metrics.requirementCoverage.missingRequirements.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-yellow-600 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold text-sm">
                    {metrics.requirementCoverage.missingRequirements.length} Missing
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  <ul className="text-sm text-gray-600 space-y-1">
                    {metrics.requirementCoverage.missingRequirements.slice(0, 5).map((req) => (
                      <li key={req}>• {req}</li>
                    ))}
                    {metrics.requirementCoverage.missingRequirements.length > 5 && (
                      <li className="text-gray-500">
                        +{metrics.requirementCoverage.missingRequirements.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Security</h3>
              <p className="text-sm text-gray-600">Vulnerability assessment</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Vulnerabilities</span>
              <span className={`font-semibold ${metrics.security.vulnerabilitiesCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.security.vulnerabilitiesCount}
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600">Security Score</span>
                <span className={`font-semibold ${getScoreColor(metrics.security.securityScore)}`}>
                  {metrics.security.securityScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(metrics.security.securityScore)}`}
                  style={{ width: `${metrics.security.securityScore}%` }}
                />
              </div>
            </div>

            {metrics.security.vulnerabilitiesCount === 0 ? (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">No vulnerabilities detected</span>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Action required</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Review and fix security vulnerabilities
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Improvement Recommendations
        </h3>

        <ul className="space-y-2 text-sm text-blue-800">
          {metrics.testCoverage.overallScore < 80 && (
            <li>• Increase test coverage to at least 80% for production readiness</li>
          )}
          {metrics.codeQuality.vocaboticsTagsCoverage < 90 && (
            <li>• Add Vocabotics tags to more components for better traceability</li>
          )}
          {metrics.requirementCoverage.coveragePercentage < 100 && (
            <li>• Implement missing requirements to achieve 100% coverage</li>
          )}
          {metrics.security.vulnerabilitiesCount > 0 && (
            <li>• Address security vulnerabilities immediately</li>
          )}
          {metrics.overallScore >= 90 && (
            <li className="text-green-700">✓ Excellent quality! Project is production-ready</li>
          )}
        </ul>
      </div>
    </div>
  );
}
