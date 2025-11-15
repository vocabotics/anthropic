import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight,
  Users,
  Target,
  Shield,
} from 'lucide-react';
import { api } from '../lib/api';

interface PRDDocument {
  title: string;
  version: string;
  vision: string;
  executiveSummary: string;
  targetAudience: {
    primary: string[];
    secondary: string[];
  };
  functionalRequirements: Requirement[];
  nonFunctionalRequirements: Requirement[];
  userStories: UserStory[];
  successMetrics: {
    metric: string;
    target: string;
    measurement: string;
  }[];
  constraints: {
    technical: string[];
    business: string[];
    legal: string[];
  };
  risks: {
    risk: string;
    probability: string;
    impact: string;
    mitigation: string;
  }[];
  complianceStandards: string[];
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

interface UserStory {
  id: string;
  as: string;
  want: string;
  so: string;
  acceptanceCriteria: string[];
  priority: 'high' | 'medium' | 'low';
}

export default function PRDReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prd, setPrd] = useState<PRDDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['vision', 'functionalRequirements'])
  );

  useEffect(() => {
    loadPRD();
  }, [id]);

  const loadPRD = async () => {
    try {
      const response = await api.get(`/projects/${id}/artifacts`);
      const prdArtifact = response.data.artifacts.find((a: any) => a.type === 'prd');

      if (prdArtifact && prdArtifact.content) {
        setPrd(prdArtifact.content as PRDDocument);
      }
    } catch (error) {
      console.error('Failed to load PRD:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!prd) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No PRD Available</h2>
          <p className="text-gray-600">
            The Product Requirements Document has not been generated yet.
          </p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-8 h-8 text-purple-600" />
              Product Requirements Document
            </h1>
            <p className="text-gray-600">
              {prd.title} - Version {prd.version}
            </p>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export PDF
            </button>

            <button
              onClick={() => navigate(`/projects/${id}/workflow`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Approve & Continue
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Standards */}
      {prd.complianceStandards.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-900 mb-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Compliance Standards</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {prd.complianceStandards.map((standard) => (
              <span
                key={standard}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-300"
              >
                {standard}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vision & Executive Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('vision')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            Vision & Overview
          </h2>
          {expandedSections.has('vision') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('vision') && (
          <div className="px-6 pb-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Vision</h3>
              <p className="text-gray-700 leading-relaxed">{prd.vision}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Executive Summary</h3>
              <p className="text-gray-700 leading-relaxed">{prd.executiveSummary}</p>
            </div>
          </div>
        )}
      </div>

      {/* Target Audience */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('audience')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Target Audience
          </h2>
          {expandedSections.has('audience') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('audience') && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Primary Audience</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {prd.targetAudience.primary.map((audience, i) => (
                  <li key={i}>{audience}</li>
                ))}
              </ul>
            </div>

            {prd.targetAudience.secondary.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Secondary Audience</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {prd.targetAudience.secondary.map((audience, i) => (
                    <li key={i}>{audience}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Functional Requirements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('functionalRequirements')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900">
            Functional Requirements ({prd.functionalRequirements.length})
          </h2>
          {expandedSections.has('functionalRequirements') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('functionalRequirements') && (
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {prd.functionalRequirements.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-sm text-purple-600">{req.id}</span>
                      <h3 className="font-semibold text-gray-900 mt-1">{req.title}</h3>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                        req.priority
                      )}`}
                    >
                      {req.priority}
                    </span>
                  </div>
                  <p className="text-gray-700">{req.description}</p>
                  {req.category && (
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300">
                        {req.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Non-Functional Requirements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('nonFunctionalRequirements')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900">
            Non-Functional Requirements ({prd.nonFunctionalRequirements.length})
          </h2>
          {expandedSections.has('nonFunctionalRequirements') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('nonFunctionalRequirements') && (
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {prd.nonFunctionalRequirements.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-sm text-purple-600">{req.id}</span>
                      <h3 className="font-semibold text-gray-900 mt-1">{req.title}</h3>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                        req.priority
                      )}`}
                    >
                      {req.priority}
                    </span>
                  </div>
                  <p className="text-gray-700">{req.description}</p>
                  {req.category && (
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-300">
                        {req.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Stories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('userStories')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900">
            User Stories ({prd.userStories.length})
          </h2>
          {expandedSections.has('userStories') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('userStories') && (
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {prd.userStories.map((story) => (
                <div
                  key={story.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-sm text-purple-600">{story.id}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                        story.priority
                      )}`}
                    >
                      {story.priority}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-3">
                    As <strong>{story.as}</strong>, I want <strong>{story.want}</strong>,
                    so that <strong>{story.so}</strong>.
                  </p>
                  {story.acceptanceCriteria.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-2">
                        Acceptance Criteria:
                      </h4>
                      <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                        {story.acceptanceCriteria.map((criteria, i) => (
                          <li key={i}>{criteria}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Metrics */}
      {prd.successMetrics.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <button
            onClick={() => toggleSection('metrics')}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              Success Metrics ({prd.successMetrics.length})
            </h2>
            {expandedSections.has('metrics') ? (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            ) : (
              <ChevronRight className="w-6 h-6 text-gray-400" />
            )}
          </button>

          {expandedSections.has('metrics') && (
            <div className="px-6 pb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900">
                        Metric
                      </th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900">
                        Target
                      </th>
                      <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900">
                        Measurement
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prd.successMetrics.map((metric, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">{metric.metric}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{metric.target}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {metric.measurement}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risks */}
      {prd.risks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <button
            onClick={() => toggleSection('risks')}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              Risks & Mitigations ({prd.risks.length})
            </h2>
            {expandedSections.has('risks') ? (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            ) : (
              <ChevronRight className="w-6 h-6 text-gray-400" />
            )}
          </button>

          {expandedSections.has('risks') && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {prd.risks.map((risk, i) => (
                  <div key={i} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-yellow-700 mb-1">Probability</div>
                        <div className="font-semibold text-yellow-900">{risk.probability}</div>
                      </div>
                      <div>
                        <div className="text-xs text-yellow-700 mb-1">Impact</div>
                        <div className="font-semibold text-yellow-900">{risk.impact}</div>
                      </div>
                    </div>
                    <p className="text-gray-900 mb-2">
                      <strong>Risk:</strong> {risk.risk}
                    </p>
                    <p className="text-gray-700">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
