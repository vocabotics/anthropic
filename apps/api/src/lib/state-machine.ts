import { logger } from '../utils/logger';

/**
 * Vocabotics Project State Machine
 * Orchestrates the workflow from vision → production
 */

export enum ProjectState {
  // Phase 1: Vision & Requirements
  VISION_INPUT = 'vision_input',
  PRD_GENERATION = 'prd_generation',
  PRD_REVIEW = 'prd_review',

  // Phase 2: Architecture & Design
  ARCHITECTURE_DESIGN = 'architecture_design',
  ARCHITECTURE_REVIEW = 'architecture_review',
  SCHEMA_GENERATION = 'schema_generation',
  API_SPECIFICATION = 'api_specification',

  // Phase 3: Implementation
  CODE_GENERATION = 'code_generation',
  CODE_REVIEW = 'code_review',
  TEST_GENERATION = 'test_generation',

  // Phase 4: Testing & Quality
  INTEGRATION_TESTING = 'integration_testing',
  VISUAL_TESTING = 'visual_testing',
  QUALITY_REVIEW = 'quality_review',

  // Phase 5: Deployment
  DEPLOYMENT_PREP = 'deployment_prep',
  DEPLOYMENT = 'deployment',
  DEPLOYED = 'deployed',

  // Error states
  ERROR = 'error',
  PAUSED = 'paused',
}

export enum TransitionTrigger {
  // User actions
  USER_SUBMIT = 'user_submit',
  USER_APPROVE = 'user_approve',
  USER_REJECT = 'user_reject',
  USER_PAUSE = 'user_pause',
  USER_RESUME = 'user_resume',

  // System actions
  AI_COMPLETE = 'ai_complete',
  AI_ERROR = 'ai_error',
  TEST_PASS = 'test_pass',
  TEST_FAIL = 'test_fail',
  VALIDATION_PASS = 'validation_pass',
  VALIDATION_FAIL = 'validation_fail',

  // Integration actions
  GITHUB_COMMIT = 'github_commit',
  DEPLOYMENT_SUCCESS = 'deployment_success',
  DEPLOYMENT_FAILURE = 'deployment_failure',
}

export interface StateTransition {
  from: ProjectState;
  to: ProjectState;
  trigger: TransitionTrigger;
  condition?: (context: any) => boolean;
  action?: (context: any) => Promise<void>;
}

export interface StateMachineContext {
  projectId: string;
  currentState: ProjectState;
  metadata: Record<string, any>;
  history: {
    state: ProjectState;
    timestamp: Date;
    triggeredBy: string;
  }[];
}

export class ProjectStateMachine {
  private transitions: StateTransition[] = [
    // Phase 1: Vision → PRD
    {
      from: ProjectState.VISION_INPUT,
      to: ProjectState.PRD_GENERATION,
      trigger: TransitionTrigger.USER_SUBMIT,
    },
    {
      from: ProjectState.PRD_GENERATION,
      to: ProjectState.PRD_REVIEW,
      trigger: TransitionTrigger.AI_COMPLETE,
    },
    {
      from: ProjectState.PRD_GENERATION,
      to: ProjectState.ERROR,
      trigger: TransitionTrigger.AI_ERROR,
    },
    {
      from: ProjectState.PRD_REVIEW,
      to: ProjectState.ARCHITECTURE_DESIGN,
      trigger: TransitionTrigger.USER_APPROVE,
    },
    {
      from: ProjectState.PRD_REVIEW,
      to: ProjectState.PRD_GENERATION,
      trigger: TransitionTrigger.USER_REJECT,
    },

    // Phase 2: Architecture → Schema → API
    {
      from: ProjectState.ARCHITECTURE_DESIGN,
      to: ProjectState.ARCHITECTURE_REVIEW,
      trigger: TransitionTrigger.AI_COMPLETE,
    },
    {
      from: ProjectState.ARCHITECTURE_DESIGN,
      to: ProjectState.ERROR,
      trigger: TransitionTrigger.AI_ERROR,
    },
    {
      from: ProjectState.ARCHITECTURE_REVIEW,
      to: ProjectState.SCHEMA_GENERATION,
      trigger: TransitionTrigger.USER_APPROVE,
    },
    {
      from: ProjectState.ARCHITECTURE_REVIEW,
      to: ProjectState.ARCHITECTURE_DESIGN,
      trigger: TransitionTrigger.USER_REJECT,
    },
    {
      from: ProjectState.SCHEMA_GENERATION,
      to: ProjectState.API_SPECIFICATION,
      trigger: TransitionTrigger.AI_COMPLETE,
    },
    {
      from: ProjectState.API_SPECIFICATION,
      to: ProjectState.CODE_GENERATION,
      trigger: TransitionTrigger.AI_COMPLETE,
    },

    // Phase 3: Code Generation → Testing
    {
      from: ProjectState.CODE_GENERATION,
      to: ProjectState.CODE_REVIEW,
      trigger: TransitionTrigger.AI_COMPLETE,
    },
    {
      from: ProjectState.CODE_GENERATION,
      to: ProjectState.ERROR,
      trigger: TransitionTrigger.AI_ERROR,
    },
    {
      from: ProjectState.CODE_REVIEW,
      to: ProjectState.TEST_GENERATION,
      trigger: TransitionTrigger.USER_APPROVE,
    },
    {
      from: ProjectState.CODE_REVIEW,
      to: ProjectState.CODE_GENERATION,
      trigger: TransitionTrigger.USER_REJECT,
    },
    {
      from: ProjectState.TEST_GENERATION,
      to: ProjectState.INTEGRATION_TESTING,
      trigger: TransitionTrigger.AI_COMPLETE,
    },

    // Phase 4: Testing & Quality
    {
      from: ProjectState.INTEGRATION_TESTING,
      to: ProjectState.VISUAL_TESTING,
      trigger: TransitionTrigger.TEST_PASS,
    },
    {
      from: ProjectState.INTEGRATION_TESTING,
      to: ProjectState.CODE_GENERATION,
      trigger: TransitionTrigger.TEST_FAIL,
    },
    {
      from: ProjectState.VISUAL_TESTING,
      to: ProjectState.QUALITY_REVIEW,
      trigger: TransitionTrigger.TEST_PASS,
    },
    {
      from: ProjectState.VISUAL_TESTING,
      to: ProjectState.CODE_GENERATION,
      trigger: TransitionTrigger.TEST_FAIL,
    },
    {
      from: ProjectState.QUALITY_REVIEW,
      to: ProjectState.DEPLOYMENT_PREP,
      trigger: TransitionTrigger.USER_APPROVE,
    },
    {
      from: ProjectState.QUALITY_REVIEW,
      to: ProjectState.CODE_GENERATION,
      trigger: TransitionTrigger.USER_REJECT,
    },

    // Phase 5: Deployment
    {
      from: ProjectState.DEPLOYMENT_PREP,
      to: ProjectState.DEPLOYMENT,
      trigger: TransitionTrigger.VALIDATION_PASS,
    },
    {
      from: ProjectState.DEPLOYMENT,
      to: ProjectState.DEPLOYED,
      trigger: TransitionTrigger.DEPLOYMENT_SUCCESS,
    },
    {
      from: ProjectState.DEPLOYMENT,
      to: ProjectState.ERROR,
      trigger: TransitionTrigger.DEPLOYMENT_FAILURE,
    },

    // Pause/Resume from any state
    {
      from: ProjectState.PRD_GENERATION,
      to: ProjectState.PAUSED,
      trigger: TransitionTrigger.USER_PAUSE,
    },
    {
      from: ProjectState.ARCHITECTURE_DESIGN,
      to: ProjectState.PAUSED,
      trigger: TransitionTrigger.USER_PAUSE,
    },
    {
      from: ProjectState.CODE_GENERATION,
      to: ProjectState.PAUSED,
      trigger: TransitionTrigger.USER_PAUSE,
    },
  ];

  /**
   * Check if transition is valid
   */
  canTransition(
    from: ProjectState,
    trigger: TransitionTrigger,
    context?: any
  ): boolean {
    const transition = this.transitions.find(
      (t) => t.from === from && t.trigger === trigger
    );

    if (!transition) {
      return false;
    }

    if (transition.condition && context) {
      return transition.condition(context);
    }

    return true;
  }

  /**
   * Get next state for a given trigger
   */
  getNextState(
    from: ProjectState,
    trigger: TransitionTrigger
  ): ProjectState | null {
    const transition = this.transitions.find(
      (t) => t.from === from && t.trigger === trigger
    );

    return transition ? transition.to : null;
  }

  /**
   * Execute transition with action
   */
  async transition(
    context: StateMachineContext,
    trigger: TransitionTrigger,
    triggeredBy: string
  ): Promise<ProjectState> {
    const { currentState } = context;

    if (!this.canTransition(currentState, trigger, context)) {
      logger.error('Invalid state transition', {
        projectId: context.projectId,
        from: currentState,
        trigger,
      });
      throw new Error(
        `Invalid transition from ${currentState} with trigger ${trigger}`
      );
    }

    const transition = this.transitions.find(
      (t) => t.from === currentState && t.trigger === trigger
    );

    if (!transition) {
      throw new Error('Transition not found');
    }

    const nextState = transition.to;

    // Execute transition action if defined
    if (transition.action) {
      try {
        await transition.action(context);
      } catch (error) {
        logger.error('Transition action failed', {
          projectId: context.projectId,
          from: currentState,
          to: nextState,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }

    // Update context
    context.currentState = nextState;
    context.history.push({
      state: nextState,
      timestamp: new Date(),
      triggeredBy,
    });

    logger.info('State transition executed', {
      projectId: context.projectId,
      from: currentState,
      to: nextState,
      trigger,
      triggeredBy,
    });

    return nextState;
  }

  /**
   * Get all possible transitions from current state
   */
  getPossibleTransitions(state: ProjectState): {
    trigger: TransitionTrigger;
    nextState: ProjectState;
  }[] {
    return this.transitions
      .filter((t) => t.from === state)
      .map((t) => ({
        trigger: t.trigger,
        nextState: t.to,
      }));
  }

  /**
   * Get state phase
   */
  getPhase(state: ProjectState): string {
    const phases: Record<string, ProjectState[]> = {
      'Vision & Requirements': [
        ProjectState.VISION_INPUT,
        ProjectState.PRD_GENERATION,
        ProjectState.PRD_REVIEW,
      ],
      'Architecture & Design': [
        ProjectState.ARCHITECTURE_DESIGN,
        ProjectState.ARCHITECTURE_REVIEW,
        ProjectState.SCHEMA_GENERATION,
        ProjectState.API_SPECIFICATION,
      ],
      Implementation: [
        ProjectState.CODE_GENERATION,
        ProjectState.CODE_REVIEW,
        ProjectState.TEST_GENERATION,
      ],
      'Testing & Quality': [
        ProjectState.INTEGRATION_TESTING,
        ProjectState.VISUAL_TESTING,
        ProjectState.QUALITY_REVIEW,
      ],
      Deployment: [
        ProjectState.DEPLOYMENT_PREP,
        ProjectState.DEPLOYMENT,
        ProjectState.DEPLOYED,
      ],
    };

    for (const [phase, states] of Object.entries(phases)) {
      if (states.includes(state)) {
        return phase;
      }
    }

    return 'Other';
  }

  /**
   * Calculate progress percentage
   */
  getProgress(state: ProjectState): number {
    const stateOrder = [
      ProjectState.VISION_INPUT, // 0%
      ProjectState.PRD_GENERATION, // 5%
      ProjectState.PRD_REVIEW, // 10%
      ProjectState.ARCHITECTURE_DESIGN, // 20%
      ProjectState.ARCHITECTURE_REVIEW, // 25%
      ProjectState.SCHEMA_GENERATION, // 30%
      ProjectState.API_SPECIFICATION, // 35%
      ProjectState.CODE_GENERATION, // 50%
      ProjectState.CODE_REVIEW, // 60%
      ProjectState.TEST_GENERATION, // 65%
      ProjectState.INTEGRATION_TESTING, // 75%
      ProjectState.VISUAL_TESTING, // 80%
      ProjectState.QUALITY_REVIEW, // 85%
      ProjectState.DEPLOYMENT_PREP, // 90%
      ProjectState.DEPLOYMENT, // 95%
      ProjectState.DEPLOYED, // 100%
    ];

    const index = stateOrder.indexOf(state);
    if (index === -1) return 0;

    return Math.round((index / (stateOrder.length - 1)) * 100);
  }
}

// Export singleton instance
export const stateMachine = new ProjectStateMachine();
