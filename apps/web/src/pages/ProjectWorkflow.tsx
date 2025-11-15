import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Database,
  Code,
  TestTube,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Download,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api';

interface WorkflowState {
  currentState: string;
  progress: number;
  phase: string;
  artifacts: {
    prd?: boolean;
    architecture?: boolean;
    schema?: boolean;
    api?: boolean;
    frontend?: boolean;
    backend?: boolean;
    tests?: boolean;
  };
  events: WorkflowEvent[];
}

interface WorkflowEvent {
  type: string;
  state: string;
  message: string;
  timestamp: string;
  error?: string;
}

const WORKFLOW_PHASES = [
  {
    id: 'requirements',
    title: 'Requirements',
    states: ['vision_input', 'prd_generation', 'prd_review'],
    icon: FileText,
  },
  {
    id: 'architecture',
    title: 'Architecture',
    states: ['architecture_generation', 'architecture_review'],
    icon: Database,
  },
  {
    id: 'code',
    title: 'Code Generation',
    states: ['code_generation_frontend', 'code_generation_backend', 'code_review'],
    icon: Code,
  },
  {
    id: 'testing',
    title: 'Testing',
    states: ['test_generation', 'test_execution', 'test_review'],
    icon: TestTube,
  },
];

export default function ProjectWorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    loadWorkflow();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const [projectRes, workflowRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/workflow/projects/${id}`),
      ]);

      setProject(projectRes.data.project);
      setWorkflow({
        currentState: workflowRes.data.state,
        progress: workflowRes.data.progress,
        phase: workflowRes.data.phase,
        artifacts: workflowRes.data.artifacts || {},
        events: [],
      });
    } catch (error) {
      console.error('Failed to load workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(JSON.stringify({ type: 'subscribe', projectId: id }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'workflow_event') {
        setWorkflow((prev) => {
          if (!prev) return null;

          return {
            ...prev,
            currentState: data.state,
            progress: data.progress || prev.progress,
            phase: data.phase || prev.phase,
            events: [...prev.events, data].slice(-20), // Keep last 20 events
          };
        });
      } else if (data.type === 'artifact_generated') {
        setWorkflow((prev) => {
          if (!prev) return null;

          return {
            ...prev,
            artifacts: {
              ...prev.artifacts,
              [data.artifactType]: true,
            },
          };
        });
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    setWs(socket);
  };

  const getPhaseStatus = (phase: typeof WORKFLOW_PHASES[0]) => {
    if (!workflow) return 'pending';

    const currentPhaseIndex = WORKFLOW_PHASES.findIndex(
      (p) => p.states.includes(workflow.currentState)
    );
    const phaseIndex = WORKFLOW_PHASES.findIndex((p) => p.id === phase.id);

    if (phaseIndex < currentPhaseIndex) return 'completed';
    if (phaseIndex === currentPhaseIndex) return 'in-progress';
    return 'pending';
  };

  const handleApprove = async (type: 'prd' | 'architecture' | 'code') => {
    try {
      await api.post(`/workflow/projects/${id}/approve-${type}`);
      await loadWorkflow();
    } catch (error) {
      console.error(`Failed to approve ${type}:`, error);
      alert(`Failed to approve ${type}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load workflow</p>
      </div>
    );
  }

  const needsApproval = workflow.currentState.includes('review');

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-1"
        >
          ← Back to Projects
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {project?.name || 'Project Workflow'}
        </h1>
        <p className="text-gray-600">
          Real-time progress of AI-powered development
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-purple-600">{workflow.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${workflow.progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Phase: <span className="font-medium">{workflow.phase}</span>
        </p>
      </div>

      {/* Workflow Phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {WORKFLOW_PHASES.map((phase) => {
          const status = getPhaseStatus(phase);
          const Icon = phase.icon;

          return (
            <div
              key={phase.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                status === 'completed'
                  ? 'border-green-500'
                  : status === 'in-progress'
                  ? 'border-purple-600'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon
                  className={`w-8 h-8 ${
                    status === 'completed'
                      ? 'text-green-500'
                      : status === 'in-progress'
                      ? 'text-purple-600'
                      : 'text-gray-400'
                  }`}
                />
                {status === 'completed' && (
                  <Check className="w-6 h-6 text-green-500" />
                )}
                {status === 'in-progress' && (
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">{phase.title}</h3>
              <p className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</p>
            </div>
          );
        })}
      </div>

      {/* Artifacts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Generated Artifacts</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'prd', label: 'Product Requirements Document', icon: FileText },
            { key: 'architecture', label: 'Architecture Document', icon: Database },
            { key: 'schema', label: 'Database Schema', icon: Database },
            { key: 'api', label: 'API Specification', icon: Code },
            { key: 'frontend', label: 'Frontend Code', icon: Code },
            { key: 'backend', label: 'Backend Code', icon: Code },
            { key: 'tests', label: 'Test Suite', icon: TestTube },
          ].map((artifact) => {
            const Icon = artifact.icon;
            const exists = workflow.artifacts[artifact.key as keyof typeof workflow.artifacts];

            return (
              <div
                key={artifact.key}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  exists
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${exists ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={exists ? 'text-green-900' : 'text-gray-600'}>
                    {artifact.label}
                  </span>
                </div>

                {exists && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/projects/${id}/artifacts/${artifact.key}`)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:bg-green-100 rounded">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval Actions */}
      {needsApproval && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Approval Required
          </h3>
          <p className="text-yellow-800 mb-4">
            Please review the generated {workflow.currentState.replace('_review', '')} and approve to continue.
          </p>

          <div className="flex gap-3">
            {workflow.currentState === 'prd_review' && (
              <>
                <button
                  onClick={() => navigate(`/projects/${id}/artifacts/prd`)}
                  className="px-4 py-2 bg-white border border-yellow-300 text-yellow-900 rounded-lg font-medium hover:bg-yellow-50"
                >
                  Review PRD
                </button>
                <button
                  onClick={() => handleApprove('prd')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Approve & Continue
                </button>
              </>
            )}

            {workflow.currentState === 'architecture_review' && (
              <>
                <button
                  onClick={() => navigate(`/projects/${id}/artifacts/architecture`)}
                  className="px-4 py-2 bg-white border border-yellow-300 text-yellow-900 rounded-lg font-medium hover:bg-yellow-50"
                >
                  Review Architecture
                </button>
                <button
                  onClick={() => handleApprove('architecture')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Approve & Continue
                </button>
              </>
            )}

            {workflow.currentState === 'code_review' && (
              <>
                <button
                  onClick={() => navigate(`/projects/${id}/code`)}
                  className="px-4 py-2 bg-white border border-yellow-300 text-yellow-900 rounded-lg font-medium hover:bg-yellow-50"
                >
                  Review Code
                </button>
                <button
                  onClick={() => handleApprove('code')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Approve & Deploy
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Event Log */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Log</h2>

        {workflow.events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {workflow.events.slice().reverse().map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{event.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                  {event.error && (
                    <p className="text-xs text-red-600 mt-1">{event.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
