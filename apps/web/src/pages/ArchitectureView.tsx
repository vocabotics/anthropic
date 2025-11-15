import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Database,
  Server,
  Code,
  Shield,
  TrendingUp,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { api } from '../lib/api';

interface ArchitectureDocument {
  overview: {
    architectureStyle: string;
    designPrinciples: string[];
  };
  technologyStack: {
    frontend: string;
    backend: string;
    database: string;
    caching?: string;
    authentication?: string;
  };
  components: Component[];
  dataModels: DataModel[];
  security: {
    authentication: string;
    authorization: string;
    dataProtection: string[];
    vulnerabilityMitigation: string[];
  };
  scalability: {
    horizontalScaling: string;
    verticalScaling: string;
    caching: string;
    loadBalancing?: string;
  };
  deployment: {
    environment: string;
    cicd: string;
    monitoring: string;
  };
}

interface Component {
  id: string;
  name: string;
  type: string;
  description: string;
  responsibilities: string[];
  dependencies: string[];
}

interface DataModel {
  name: string;
  description: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  relationships: string[];
}

export default function ArchitectureViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [architecture, setArchitecture] = useState<ArchitectureDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'components'])
  );

  useEffect(() => {
    loadArchitecture();
  }, [id]);

  const loadArchitecture = async () => {
    try {
      const response = await api.get(`/projects/${id}/artifacts`);
      const archArtifact = response.data.artifacts.find((a: any) => a.type === 'architecture');

      if (archArtifact && archArtifact.content) {
        setArchitecture(archArtifact.content as ArchitectureDocument);
      }
    } catch (error) {
      console.error('Failed to load architecture:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!architecture) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <Box className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Architecture Available</h2>
          <p className="text-gray-600">
            The architecture document has not been generated yet.
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
              <Box className="w-8 h-8 text-purple-600" />
              Software Architecture
            </h1>
            <p className="text-gray-600">{architecture.overview.architectureStyle}</p>
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

      {/* Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('overview')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          {expandedSections.has('overview') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('overview') && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Architecture Style</h3>
              <p className="text-gray-700">{architecture.overview.architectureStyle}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Design Principles</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {architecture.overview.designPrinciples.map((principle, i) => (
                  <li key={i}>{principle}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Technology Stack */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('techStack')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="w-6 h-6 text-purple-600" />
            Technology Stack
          </h2>
          {expandedSections.has('techStack') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('techStack') && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(architecture.technologyStack).map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm font-semibold text-gray-600 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Components */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('components')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Code className="w-6 h-6 text-purple-600" />
            Components ({architecture.components.length})
          </h2>
          {expandedSections.has('components') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('components') && (
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {architecture.components.map((component) => (
                <div
                  key={component.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{component.name}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300 mt-1 inline-block">
                        {component.type}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{component.description}</p>

                  {component.responsibilities.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        Responsibilities:
                      </h4>
                      <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                        {component.responsibilities.map((resp, i) => (
                          <li key={i}>{resp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {component.dependencies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        Dependencies:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {component.dependencies.map((dep, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-300"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Models */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('dataModels')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-purple-600" />
            Data Models ({architecture.dataModels.length})
          </h2>
          {expandedSections.has('dataModels') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('dataModels') && (
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {architecture.dataModels.map((model, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">{model.name}</h3>
                  <p className="text-gray-700 mb-3">{model.description}</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-2 font-semibold text-gray-900">
                            Field
                          </th>
                          <th className="text-left py-2 px-2 font-semibold text-gray-900">
                            Type
                          </th>
                          <th className="text-left py-2 px-2 font-semibold text-gray-900">
                            Required
                          </th>
                          <th className="text-left py-2 px-2 font-semibold text-gray-900">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {model.fields.map((field, j) => (
                          <tr key={j} className="border-b border-gray-200">
                            <td className="py-2 px-2 font-mono text-xs text-gray-900">
                              {field.name}
                            </td>
                            <td className="py-2 px-2 text-gray-700">{field.type}</td>
                            <td className="py-2 px-2">
                              {field.required ? (
                                <span className="text-red-600">✓</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-gray-600">{field.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {model.relationships.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        Relationships:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {model.relationships.map((rel, j) => (
                          <span
                            key={j}
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 border border-green-300"
                          >
                            {rel}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('security')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Security
          </h2>
          {expandedSections.has('security') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('security') && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Authentication</h3>
              <p className="text-gray-700">{architecture.security.authentication}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Authorization</h3>
              <p className="text-gray-700">{architecture.security.authorization}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Data Protection</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {architecture.security.dataProtection.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Vulnerability Mitigation</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {architecture.security.vulnerabilityMitigation.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Scalability */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('scalability')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Scalability
          </h2>
          {expandedSections.has('scalability') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('scalability') && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Horizontal Scaling</h3>
              <p className="text-gray-700">{architecture.scalability.horizontalScaling}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Vertical Scaling</h3>
              <p className="text-gray-700">{architecture.scalability.verticalScaling}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Caching Strategy</h3>
              <p className="text-gray-700">{architecture.scalability.caching}</p>
            </div>

            {architecture.scalability.loadBalancing && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Load Balancing</h3>
                <p className="text-gray-700">{architecture.scalability.loadBalancing}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deployment */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => toggleSection('deployment')}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <h2 className="text-2xl font-bold text-gray-900">Deployment</h2>
          {expandedSections.has('deployment') ? (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400" />
          )}
        </button>

        {expandedSections.has('deployment') && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Environment</h3>
              <p className="text-gray-700">{architecture.deployment.environment}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">CI/CD</h3>
              <p className="text-gray-700">{architecture.deployment.cicd}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Monitoring</h3>
              <p className="text-gray-700">{architecture.deployment.monitoring}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
