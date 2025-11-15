import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Network,
  Search,
  Filter,
  Download,
  Loader2,
  ChevronRight,
  Code,
  Database,
  Server,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';

interface IntegrationElement {
  vocaboticsId: string;
  type: string;
  layer: 'frontend' | 'backend' | 'database';
  filePath: string;
  requirements: string[];
}

interface IntegrationRelationship {
  from: string;
  to: string;
  type: 'calls' | 'queries' | 'renders' | 'tests';
}

interface IntegrationMap {
  projectId: string;
  elements: IntegrationElement[];
  relationships: IntegrationRelationship[];
  coverage: {
    totalRequirements: number;
    implementedRequirements: number;
    coveragePercentage: number;
    missingRequirements: string[];
  };
}

export default function IntegrationMapPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [map, setMap] = useState<IntegrationMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [layerFilter, setLayerFilter] = useState<string>('all');
  const [selectedElement, setSelectedElement] = useState<IntegrationElement | null>(null);

  useEffect(() => {
    loadMap();
  }, [id]);

  const loadMap = async () => {
    try {
      const response = await api.get(`/integration-map/${id}`);
      setMap(response.data.integrationMap);
    } catch (error) {
      console.error('Failed to load integration map:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildMap = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/integration-map/${id}/build`);
      setMap(response.data.integrationMap);
    } catch (error) {
      console.error('Failed to build integration map:', error);
      alert('Failed to build integration map. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredElements = map?.elements.filter((el) => {
    const matchesSearch =
      el.vocaboticsId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.filePath.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLayer = layerFilter === 'all' || el.layer === layerFilter;
    return matchesSearch && matchesLayer;
  }) || [];

  const getLayerIcon = (layer: string) => {
    switch (layer) {
      case 'frontend':
        return <Code className="w-5 h-5 text-blue-600" />;
      case 'backend':
        return <Server className="w-5 h-5 text-green-600" />;
      case 'database':
        return <Database className="w-5 h-5 text-purple-600" />;
      default:
        return <Code className="w-5 h-5 text-gray-600" />;
    }
  };

  const getLayerColor = (layer: string) => {
    switch (layer) {
      case 'frontend':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'backend':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'database':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRelatedElements = (elementId: string) => {
    if (!map) return { outgoing: [], incoming: [] };

    const outgoing = map.relationships
      .filter((r) => r.from === elementId)
      .map((r) => ({
        ...map.elements.find((e) => e.vocaboticsId === r.to)!,
        relationType: r.type,
      }));

    const incoming = map.relationships
      .filter((r) => r.to === elementId)
      .map((r) => ({
        ...map.elements.find((e) => e.vocaboticsId === r.from)!,
        relationType: r.type,
      }));

    return { outgoing, incoming };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!map) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Integration Map Yet</h2>
          <p className="text-gray-600 mb-6">
            Build the integration map to see traceability between frontend, backend, and database.
          </p>
          <button
            onClick={buildMap}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 inline-flex items-center gap-2"
          >
            <Network className="w-5 h-5" />
            Build Integration Map
          </button>
        </div>
      </div>
    );
  }

  const related = selectedElement ? getRelatedElements(selectedElement.vocaboticsId) : null;

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
              <Network className="w-8 h-8 text-purple-600" />
              Integration Map
            </h1>
            <p className="text-gray-600">
              Frontend → Backend → Database traceability
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={buildMap}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              Rebuild Map
            </button>

            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Coverage Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Coverage Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Requirements</div>
            <div className="text-2xl font-bold text-gray-900">
              {map.coverage.totalRequirements}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Implemented</div>
            <div className="text-2xl font-bold text-green-600">
              {map.coverage.implementedRequirements}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Coverage</div>
            <div className="text-2xl font-bold text-purple-600">
              {map.coverage.coveragePercentage.toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Total Elements</div>
            <div className="text-2xl font-bold text-gray-900">
              {map.elements.length}
            </div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-purple-600 h-3 rounded-full transition-all"
            style={{ width: `${map.coverage.coveragePercentage}%` }}
          />
        </div>

        {map.coverage.missingRequirements.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">
                {map.coverage.missingRequirements.length} Missing Requirements
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto">
              <ul className="text-sm text-yellow-700 space-y-1">
                {map.coverage.missingRequirements.slice(0, 5).map((req) => (
                  <li key={req}>• {req}</li>
                ))}
                {map.coverage.missingRequirements.length > 5 && (
                  <li className="text-yellow-600">
                    +{map.coverage.missingRequirements.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID or file path..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={layerFilter}
              onChange={(e) => setLayerFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="all">All Layers</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="database">Database</option>
            </select>
          </div>
        </div>
      </div>

      {/* Element List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Elements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Elements ({filteredElements.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredElements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No elements found
              </div>
            ) : (
              filteredElements.map((element) => (
                <button
                  key={element.vocaboticsId}
                  onClick={() => setSelectedElement(element)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedElement?.vocaboticsId === element.vocaboticsId
                      ? 'bg-purple-50 border-l-4 border-purple-600'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getLayerIcon(element.layer)}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-purple-600 mb-1 truncate">
                        {element.vocaboticsId}
                      </div>
                      <div className="text-sm text-gray-600 mb-2 truncate">
                        {element.filePath}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`text-xs px-2 py-1 rounded border ${getLayerColor(
                            element.layer
                          )}`}
                        >
                          {element.layer}
                        </span>
                        <span className="text-xs px-2 py-1 rounded border bg-gray-100 text-gray-700 border-gray-300">
                          {element.type}
                        </span>
                        {element.requirements.length > 0 && (
                          <span className="text-xs px-2 py-1 rounded border bg-blue-100 text-blue-700 border-blue-300">
                            {element.requirements.length} req
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Element Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Element Details</h2>
          </div>

          {selectedElement ? (
            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-gray-600">Vocabotics ID</div>
                    <div className="font-mono text-sm text-purple-600">
                      {selectedElement.vocaboticsId}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">File Path</div>
                    <div className="text-sm text-gray-900">{selectedElement.filePath}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="text-sm text-gray-900">{selectedElement.type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Layer</div>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded border ${getLayerColor(
                        selectedElement.layer
                      )}`}
                    >
                      {selectedElement.layer}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {selectedElement.requirements.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedElement.requirements.map((req) => (
                      <span
                        key={req}
                        className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-800 border border-blue-300"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships */}
              {related && (
                <>
                  {related.outgoing.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Calls / Uses</h3>
                      <div className="space-y-2">
                        {related.outgoing.map((rel, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                          >
                            {getLayerIcon(rel.layer)}
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs text-purple-600 truncate">
                                {rel.vocaboticsId}
                              </div>
                              <div className="text-xs text-gray-600 capitalize">{rel.relationType}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {related.incoming.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Used By</h3>
                      <div className="space-y-2">
                        {related.incoming.map((rel, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                          >
                            {getLayerIcon(rel.layer)}
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs text-purple-600 truncate">
                                {rel.vocaboticsId}
                              </div>
                              <div className="text-xs text-gray-600 capitalize">{rel.relationType}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Select an element to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
