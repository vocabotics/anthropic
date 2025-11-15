import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface ProjectVision {
  name: string;
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  techStack?: {
    frontend: string;
    backend: string;
    database: string;
  };
}

const STEPS = [
  { id: 'vision', title: 'Project Vision', description: 'Tell us about your project' },
  { id: 'features', title: 'Key Features', description: 'What should it do?' },
  { id: 'tech', title: 'Tech Stack', description: 'Choose your technology' },
  { id: 'review', title: 'Review', description: 'Confirm and create' },
];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [vision, setVision] = useState<ProjectVision>({
    name: '',
    description: '',
    targetAudience: '',
    keyFeatures: [''],
    techStack: {
      frontend: 'react',
      backend: 'express',
      database: 'postgresql',
    },
  });

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Vision
        return vision.name.trim() && vision.description.trim() && vision.targetAudience.trim();
      case 1: // Features
        return vision.keyFeatures.filter(f => f.trim()).length > 0;
      case 2: // Tech stack
        return true; // Always valid with defaults
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      // Create project and auto-start PRD generation
      const response = await api.post('/workflow/projects', {
        name: vision.name,
        description: vision.description,
        targetAudience: vision.targetAudience,
        keyFeatures: vision.keyFeatures.filter(f => f.trim()),
        techStack: vision.techStack,
      });

      const projectId = response.data.project.id;

      // Navigate to project detail page with workflow
      navigate(`/projects/${projectId}/workflow`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    setVision({ ...vision, keyFeatures: [...vision.keyFeatures, ''] });
  };

  const removeFeature = (index: number) => {
    setVision({
      ...vision,
      keyFeatures: vision.keyFeatures.filter((_, i) => i !== index),
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...vision.keyFeatures];
    newFeatures[index] = value;
    setVision({ ...vision, keyFeatures: newFeatures });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          Create New Project
        </h1>
        <p className="text-gray-600 mt-2">
          Let's bring your vision to life with AI-powered development
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col items-center relative"
              style={{ width: `${100 / STEPS.length}%` }}
            >
              {/* Line */}
              {index > 0 && (
                <div
                  className={`absolute top-5 right-1/2 w-full h-0.5 -z-10 ${
                    index <= currentStep ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                />
              )}

              {/* Step circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  index <= currentStep
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>

              {/* Step title */}
              <div className="mt-2 text-center">
                <div className="font-medium text-sm">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        {/* Step 0: Vision */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={vision.name}
                onChange={(e) => setVision({ ...vision, name: e.target.value })}
                placeholder="e.g., Task Management App"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                value={vision.description}
                onChange={(e) => setVision({ ...vision, description: e.target.value })}
                placeholder="Describe your project vision in detail. What problem does it solve? What makes it unique?"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Be detailed! This helps our AI generate better requirements.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience *
              </label>
              <input
                type="text"
                value={vision.targetAudience}
                onChange={(e) => setVision({ ...vision, targetAudience: e.target.value })}
                placeholder="e.g., Small businesses, developers, students"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 1: Features */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Features *
              </label>
              <p className="text-sm text-gray-600 mb-4">
                List the main features you want in your application
              </p>

              <div className="space-y-3">
                {vision.keyFeatures.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder={`Feature ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                    {vision.keyFeatures.length > 1 && (
                      <button
                        onClick={() => removeFeature(index)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addFeature}
                className="mt-4 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium"
              >
                + Add Feature
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Tech Stack */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frontend Framework
              </label>
              <select
                value={vision.techStack?.frontend}
                onChange={(e) =>
                  setVision({
                    ...vision,
                    techStack: { ...vision.techStack!, frontend: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="react">React + TypeScript + Vite</option>
                <option value="vue">Vue 3 + TypeScript</option>
                <option value="nextjs">Next.js 14 + TypeScript</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backend Framework
              </label>
              <select
                value={vision.techStack?.backend}
                onChange={(e) =>
                  setVision({
                    ...vision,
                    techStack: { ...vision.techStack!, backend: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="express">Express + TypeScript</option>
                <option value="fastify">Fastify + TypeScript</option>
                <option value="nestjs">NestJS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Database
              </label>
              <select
                value={vision.techStack?.database}
                onChange={(e) =>
                  setVision({
                    ...vision,
                    techStack: { ...vision.techStack!, database: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="postgresql">PostgreSQL + Prisma</option>
                <option value="mysql">MySQL + Prisma</option>
                <option value="mongodb">MongoDB + Mongoose</option>
              </select>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>Recommended Stack:</strong> React + Express + PostgreSQL
                <br />
                This is the same stack Vocabotics itself uses (dogfooding principle)
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Project Name</h3>
                <p className="text-gray-700">{vision.name}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                <p className="text-gray-700">{vision.description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Target Audience</h3>
                <p className="text-gray-700">{vision.targetAudience}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Key Features</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {vision.keyFeatures.filter(f => f.trim()).map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Tech Stack</h3>
                <div className="text-gray-700">
                  <p><strong>Frontend:</strong> {vision.techStack?.frontend}</p>
                  <p><strong>Backend:</strong> {vision.techStack?.backend}</p>
                  <p><strong>Database:</strong> {vision.techStack?.database}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>AI generates comprehensive Product Requirements Document (PRD)</li>
                <li>Architecture design follows ISO 9001 and ISO 12207 standards</li>
                <li>Complete database schema with migrations</li>
                <li>API specification (OpenAPI 3.0)</li>
                <li>Frontend and backend code with Vocabotics traceability</li>
                <li>Automated tests and visual validation</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={loading || !isStepValid()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Project
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
