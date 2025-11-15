import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import {
  stateMachine,
  ProjectState,
  TransitionTrigger,
  StateMachineContext,
} from '../lib/state-machine';
import { aiService } from './ai.service';
import { githubService } from './github.service';
import { WebSocket } from 'ws';

export interface WorkflowEvent {
  type: 'state_change' | 'progress' | 'error' | 'artifact_generated';
  projectId: string;
  data: any;
  timestamp: Date;
}

/**
 * Workflow Coordinator
 * Orchestrates the entire project lifecycle from vision to deployment
 */
export class WorkflowService {
  private eventListeners: Map<string, Set<(event: WorkflowEvent) => void>> = new Map();
  private wsConnections: Map<string, Set<WebSocket>> = new Map();

  /**
   * Initialize a new project workflow
   */
  async initializeProject(
    userId: string,
    input: {
      name: string;
      vision: string;
      description?: string;
      technologyStack?: any;
      targetAudience?: string;
      keyFeatures?: string[];
      constraints?: string[];
    }
  ): Promise<string> {
    try {
      // Create project
      const project = await prisma.project.create({
        data: {
          ownerId: userId,
          name: input.name,
          vision: input.vision,
          description: input.description,
          currentPhase: ProjectState.VISION_INPUT,
          technologyStack: input.technologyStack || {
            frontend: ['react', 'typescript', 'vite'],
            backend: ['express', 'typescript', 'prisma'],
            database: ['postgresql'],
          },
          totalAICalls: 0,
          totalAICostUsd: 0,
        },
      });

      logger.info('Project initialized', {
        projectId: project.id,
        userId,
        name: input.name,
      });

      // Emit event
      this.emitEvent({
        type: 'state_change',
        projectId: project.id,
        data: {
          state: ProjectState.VISION_INPUT,
          phase: 'Vision & Requirements',
          progress: 0,
        },
        timestamp: new Date(),
      });

      // Auto-start PRD generation
      await this.startPRDGeneration(project.id, userId, {
        vision: input.vision,
        targetAudience: input.targetAudience,
        keyFeatures: input.keyFeatures,
        constraints: input.constraints,
      });

      return project.id;
    } catch (error) {
      logger.error('Failed to initialize project', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Start PRD generation
   */
  async startPRDGeneration(
    projectId: string,
    userId: string,
    input: {
      vision: string;
      targetAudience?: string;
      keyFeatures?: string[];
      constraints?: string[];
    }
  ): Promise<void> {
    try {
      // Transition to PRD generation state
      await this.transitionState(
        projectId,
        TransitionTrigger.USER_SUBMIT,
        userId
      );

      // Emit progress event
      this.emitEvent({
        type: 'progress',
        projectId,
        data: {
          phase: 'PRD Generation',
          message: 'Generating Product Requirements Document...',
          progress: 5,
        },
        timestamp: new Date(),
      });

      // Generate PRD using AI
      const { content, metadata } = await aiService.generatePRD(input, {
        userId,
        projectId,
        useUserKey: true,
      });

      // Save PRD artifact
      const artifact = await prisma.artifact.create({
        data: {
          projectId,
          type: 'prd',
          phase: 'prd_generation',
          version: 1,
          content,
          metadata: {
            model: metadata.model,
            tokens: metadata.usage.totalTokens,
            cost: metadata.costUsd,
            duration: metadata.durationMs,
          },
          qualityScore: null,
        },
      });

      logger.info('PRD generated', {
        projectId,
        artifactId: artifact.id,
        tokens: metadata.usage.totalTokens,
        cost: metadata.costUsd,
      });

      // Emit artifact generated event
      this.emitEvent({
        type: 'artifact_generated',
        projectId,
        data: {
          artifactId: artifact.id,
          type: 'prd',
          version: 1,
        },
        timestamp: new Date(),
      });

      // Transition to PRD review
      await this.transitionState(
        projectId,
        TransitionTrigger.AI_COMPLETE,
        'system'
      );

      // Emit progress event
      this.emitEvent({
        type: 'progress',
        projectId,
        data: {
          phase: 'PRD Review',
          message: 'PRD generated successfully. Ready for review.',
          progress: 10,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('PRD generation failed', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Transition to error state
      await this.transitionState(
        projectId,
        TransitionTrigger.AI_ERROR,
        'system'
      );

      this.emitEvent({
        type: 'error',
        projectId,
        data: {
          message: 'PRD generation failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Start architecture generation
   */
  async startArchitectureGeneration(
    projectId: string,
    userId: string
  ): Promise<void> {
    try {
      // Get PRD artifact
      const prdArtifact = await prisma.artifact.findFirst({
        where: {
          projectId,
          type: 'prd',
        },
        orderBy: {
          version: 'desc',
        },
      });

      if (!prdArtifact) {
        throw new Error('PRD not found');
      }

      // Get project for tech stack
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Transition state
      await this.transitionState(
        projectId,
        TransitionTrigger.USER_APPROVE,
        userId
      );

      this.emitEvent({
        type: 'progress',
        projectId,
        data: {
          phase: 'Architecture Design',
          message: 'Generating architecture document...',
          progress: 20,
        },
        timestamp: new Date(),
      });

      // Generate architecture
      const { content, metadata } = await aiService.generateArchitecture(
        {
          prdContent: prdArtifact.content,
          technologyStack: project.technologyStack as any,
        },
        {
          userId,
          projectId,
          useUserKey: true,
        }
      );

      // Save architecture artifact
      const artifact = await prisma.artifact.create({
        data: {
          projectId,
          type: 'architecture',
          phase: 'architecture_design',
          version: 1,
          content,
          metadata: {
            model: metadata.model,
            tokens: metadata.usage.totalTokens,
            cost: metadata.costUsd,
            duration: metadata.durationMs,
          },
        },
      });

      logger.info('Architecture generated', {
        projectId,
        artifactId: artifact.id,
      });

      this.emitEvent({
        type: 'artifact_generated',
        projectId,
        data: {
          artifactId: artifact.id,
          type: 'architecture',
          version: 1,
        },
        timestamp: new Date(),
      });

      // Transition to architecture review
      await this.transitionState(
        projectId,
        TransitionTrigger.AI_COMPLETE,
        'system'
      );

      this.emitEvent({
        type: 'progress',
        projectId,
        data: {
          phase: 'Architecture Review',
          message: 'Architecture generated successfully. Ready for review.',
          progress: 25,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Architecture generation failed', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      await this.transitionState(
        projectId,
        TransitionTrigger.AI_ERROR,
        'system'
      );

      this.emitEvent({
        type: 'error',
        projectId,
        data: {
          message: 'Architecture generation failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Start code generation
   */
  async startCodeGeneration(
    projectId: string,
    userId: string,
    componentType: 'frontend' | 'backend' | 'database'
  ): Promise<void> {
    try {
      // Get architecture artifact
      const architectureArtifact = await prisma.artifact.findFirst({
        where: {
          projectId,
          type: 'architecture',
        },
        orderBy: {
          version: 'desc',
        },
      });

      if (!architectureArtifact) {
        throw new Error('Architecture not found');
      }

      this.emitEvent({
        type: 'progress',
        projectId,
        data: {
          phase: 'Code Generation',
          message: `Generating ${componentType} code...`,
          progress: 50,
        },
        timestamp: new Date(),
      });

      // Generate code
      const { content, metadata } = await aiService.generateCode(
        {
          architectureContent: architectureArtifact.content,
          componentType,
          specifications: {}, // Will be enhanced later
        },
        {
          userId,
          projectId,
          useUserKey: true,
        }
      );

      // Save code artifact
      const artifact = await prisma.artifact.create({
        data: {
          projectId,
          type: `code_${componentType}`,
          phase: 'implementation',
          version: 1,
          content: { code: content, componentType },
          metadata: {
            model: metadata.model,
            tokens: metadata.usage.totalTokens,
            cost: metadata.costUsd,
            duration: metadata.durationMs,
          },
        },
      });

      logger.info('Code generated', {
        projectId,
        artifactId: artifact.id,
        componentType,
      });

      this.emitEvent({
        type: 'artifact_generated',
        projectId,
        data: {
          artifactId: artifact.id,
          type: `code_${componentType}`,
          version: 1,
        },
        timestamp: new Date(),
      });

      // Commit to GitHub if enabled
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (project?.githubRepoName) {
        const [owner, repo] = project.githubRepoName.split('/');
        await githubService.createCommit(userId, projectId, {
          owner,
          repo,
          branch: 'main',
          message: `feat(${componentType}): Generate ${componentType} code\n\nGenerated by Vocabotics AI`,
          files: [
            {
              path: `${componentType}/generated.ts`,
              content,
            },
          ],
        });

        this.emitEvent({
          type: 'progress',
          projectId,
          data: {
            message: `Code committed to GitHub`,
          },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Code generation failed', {
        projectId,
        componentType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.emitEvent({
        type: 'error',
        projectId,
        data: {
          message: `${componentType} code generation failed`,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Transition project state
   */
  private async transitionState(
    projectId: string,
    trigger: TransitionTrigger,
    triggeredBy: string
  ): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const context: StateMachineContext = {
      projectId,
      currentState: project.currentPhase as ProjectState,
      metadata: {},
      history: [],
    };

    const nextState = await stateMachine.transition(context, trigger, triggeredBy);

    // Update project state in database
    await prisma.project.update({
      where: { id: projectId },
      data: {
        currentPhase: nextState,
      },
    });

    // Record state transition
    await prisma.stateTransition.create({
      data: {
        projectId,
        fromState: project.currentPhase,
        toState: nextState,
        triggeredBy,
        metadata: {},
      },
    });

    // Emit state change event
    this.emitEvent({
      type: 'state_change',
      projectId,
      data: {
        from: project.currentPhase,
        to: nextState,
        phase: stateMachine.getPhase(nextState),
        progress: stateMachine.getProgress(nextState),
      },
      timestamp: new Date(),
    });
  }

  /**
   * Get project workflow status
   */
  async getWorkflowStatus(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        artifacts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        stateTransitions: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const currentState = project.currentPhase as ProjectState;

    return {
      projectId,
      currentState,
      phase: stateMachine.getPhase(currentState),
      progress: stateMachine.getProgress(currentState),
      possibleActions: stateMachine.getPossibleTransitions(currentState),
      artifacts: project.artifacts,
      recentTransitions: project.stateTransitions,
      stats: {
        totalAICalls: project.totalAICalls,
        totalCost: project.totalAICostUsd.toNumber(),
        artifactsGenerated: project.artifacts.length,
      },
    };
  }

  /**
   * Event system
   */
  addEventListener(
    projectId: string,
    listener: (event: WorkflowEvent) => void
  ): void {
    if (!this.eventListeners.has(projectId)) {
      this.eventListeners.set(projectId, new Set());
    }
    this.eventListeners.get(projectId)!.add(listener);
  }

  removeEventListener(
    projectId: string,
    listener: (event: WorkflowEvent) => void
  ): void {
    this.eventListeners.get(projectId)?.delete(listener);
  }

  private emitEvent(event: WorkflowEvent): void {
    // Emit to event listeners
    const listeners = this.eventListeners.get(event.projectId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          logger.error('Event listener error', {
            projectId: event.projectId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
    }

    // Emit to WebSocket connections
    const wsConnections = this.wsConnections.get(event.projectId);
    if (wsConnections) {
      const message = JSON.stringify(event);
      wsConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  /**
   * WebSocket connection management
   */
  addWebSocketConnection(projectId: string, ws: WebSocket): void {
    if (!this.wsConnections.has(projectId)) {
      this.wsConnections.set(projectId, new Set());
    }
    this.wsConnections.get(projectId)!.add(ws);

    logger.info('WebSocket connected to project', { projectId });
  }

  removeWebSocketConnection(projectId: string, ws: WebSocket): void {
    this.wsConnections.get(projectId)?.delete(ws);
    logger.info('WebSocket disconnected from project', { projectId });
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
