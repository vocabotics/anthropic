"""
Vocabotics Project State Machine
Orchestrates the workflow from vision → production
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from datetime import datetime
import json


class ProjectState(Enum):
    """Project workflow states"""
    # Phase 1: Vision & Requirements
    VISION_INPUT = "vision_input"
    PRD_GENERATION = "prd_generation"
    PRD_REVIEW = "prd_review"

    # Phase 2: Architecture & Design
    ARCHITECTURE_DESIGN = "architecture_design"
    ARCHITECTURE_REVIEW = "architecture_review"
    SCHEMA_GENERATION = "schema_generation"
    API_SPECIFICATION = "api_specification"

    # Phase 3: Implementation
    CODE_GENERATION = "code_generation"
    CODE_REVIEW = "code_review"
    TEST_GENERATION = "test_generation"

    # Phase 4: Testing & Quality
    INTEGRATION_TESTING = "integration_testing"
    VISUAL_TESTING = "visual_testing"
    QUALITY_REVIEW = "quality_review"

    # Phase 5: Deployment
    DEPLOYMENT_PREP = "deployment_prep"
    DEPLOYMENT = "deployment"
    DEPLOYED = "deployed"

    # Error states
    ERROR = "error"
    PAUSED = "paused"


class TransitionTrigger(Enum):
    """State transition triggers"""
    # User actions
    USER_SUBMIT = "user_submit"
    USER_APPROVE = "user_approve"
    USER_REJECT = "user_reject"
    USER_PAUSE = "user_pause"
    USER_RESUME = "user_resume"

    # System actions
    AI_COMPLETE = "ai_complete"
    AI_ERROR = "ai_error"
    TEST_PASS = "test_pass"
    TEST_FAIL = "test_fail"
    VALIDATION_PASS = "validation_pass"
    VALIDATION_FAIL = "validation_fail"

    # Integration actions
    GITHUB_COMMIT = "github_commit"
    DEPLOYMENT_SUCCESS = "deployment_success"
    DEPLOYMENT_FAILURE = "deployment_failure"


class StateTransition:
    """State transition definition"""
    def __init__(self, from_state: ProjectState, to_state: ProjectState,
                 trigger: TransitionTrigger):
        self.from_state = from_state
        self.to_state = to_state
        self.trigger = trigger


class StateMachineContext:
    """State machine context"""
    def __init__(self, project_id: str, current_state: ProjectState):
        self.project_id = project_id
        self.current_state = current_state
        self.metadata: Dict[str, Any] = {}
        self.history: List[Dict[str, Any]] = []

    def to_dict(self) -> Dict:
        """Serialize to dictionary"""
        return {
            "project_id": self.project_id,
            "current_state": self.current_state.value,
            "metadata": self.metadata,
            "history": self.history
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'StateMachineContext':
        """Deserialize from dictionary"""
        context = cls(
            data["project_id"],
            ProjectState(data["current_state"])
        )
        context.metadata = data.get("metadata", {})
        context.history = data.get("history", [])
        return context


class ProjectStateMachine:
    """State machine for project workflow"""

    def __init__(self):
        self.transitions = self._init_transitions()

    def _init_transitions(self) -> List[StateTransition]:
        """Initialize all valid transitions"""
        return [
            # Phase 1: Vision → PRD
            StateTransition(ProjectState.VISION_INPUT, ProjectState.PRD_GENERATION,
                          TransitionTrigger.USER_SUBMIT),
            StateTransition(ProjectState.PRD_GENERATION, ProjectState.PRD_REVIEW,
                          TransitionTrigger.AI_COMPLETE),
            StateTransition(ProjectState.PRD_GENERATION, ProjectState.ERROR,
                          TransitionTrigger.AI_ERROR),
            StateTransition(ProjectState.PRD_REVIEW, ProjectState.ARCHITECTURE_DESIGN,
                          TransitionTrigger.USER_APPROVE),
            StateTransition(ProjectState.PRD_REVIEW, ProjectState.PRD_GENERATION,
                          TransitionTrigger.USER_REJECT),

            # Phase 2: Architecture → Schema → API
            StateTransition(ProjectState.ARCHITECTURE_DESIGN, ProjectState.ARCHITECTURE_REVIEW,
                          TransitionTrigger.AI_COMPLETE),
            StateTransition(ProjectState.ARCHITECTURE_DESIGN, ProjectState.ERROR,
                          TransitionTrigger.AI_ERROR),
            StateTransition(ProjectState.ARCHITECTURE_REVIEW, ProjectState.SCHEMA_GENERATION,
                          TransitionTrigger.USER_APPROVE),
            StateTransition(ProjectState.ARCHITECTURE_REVIEW, ProjectState.ARCHITECTURE_DESIGN,
                          TransitionTrigger.USER_REJECT),
            StateTransition(ProjectState.SCHEMA_GENERATION, ProjectState.API_SPECIFICATION,
                          TransitionTrigger.AI_COMPLETE),
            StateTransition(ProjectState.API_SPECIFICATION, ProjectState.CODE_GENERATION,
                          TransitionTrigger.AI_COMPLETE),

            # Phase 3: Code Generation → Testing
            StateTransition(ProjectState.CODE_GENERATION, ProjectState.CODE_REVIEW,
                          TransitionTrigger.AI_COMPLETE),
            StateTransition(ProjectState.CODE_GENERATION, ProjectState.ERROR,
                          TransitionTrigger.AI_ERROR),
            StateTransition(ProjectState.CODE_REVIEW, ProjectState.TEST_GENERATION,
                          TransitionTrigger.USER_APPROVE),
            StateTransition(ProjectState.CODE_REVIEW, ProjectState.CODE_GENERATION,
                          TransitionTrigger.USER_REJECT),
            StateTransition(ProjectState.TEST_GENERATION, ProjectState.INTEGRATION_TESTING,
                          TransitionTrigger.AI_COMPLETE),

            # Phase 4: Testing & Quality
            StateTransition(ProjectState.INTEGRATION_TESTING, ProjectState.VISUAL_TESTING,
                          TransitionTrigger.TEST_PASS),
            StateTransition(ProjectState.INTEGRATION_TESTING, ProjectState.CODE_GENERATION,
                          TransitionTrigger.TEST_FAIL),
            StateTransition(ProjectState.VISUAL_TESTING, ProjectState.QUALITY_REVIEW,
                          TransitionTrigger.TEST_PASS),
            StateTransition(ProjectState.VISUAL_TESTING, ProjectState.CODE_GENERATION,
                          TransitionTrigger.TEST_FAIL),
            StateTransition(ProjectState.QUALITY_REVIEW, ProjectState.DEPLOYMENT_PREP,
                          TransitionTrigger.USER_APPROVE),
            StateTransition(ProjectState.QUALITY_REVIEW, ProjectState.CODE_GENERATION,
                          TransitionTrigger.USER_REJECT),

            # Phase 5: Deployment
            StateTransition(ProjectState.DEPLOYMENT_PREP, ProjectState.DEPLOYMENT,
                          TransitionTrigger.VALIDATION_PASS),
            StateTransition(ProjectState.DEPLOYMENT, ProjectState.DEPLOYED,
                          TransitionTrigger.DEPLOYMENT_SUCCESS),
            StateTransition(ProjectState.DEPLOYMENT, ProjectState.ERROR,
                          TransitionTrigger.DEPLOYMENT_FAILURE),
        ]

    def can_transition(self, from_state: ProjectState, trigger: TransitionTrigger) -> bool:
        """Check if transition is valid"""
        return any(
            t.from_state == from_state and t.trigger == trigger
            for t in self.transitions
        )

    def get_next_state(self, from_state: ProjectState,
                      trigger: TransitionTrigger) -> Optional[ProjectState]:
        """Get next state for a given trigger"""
        for t in self.transitions:
            if t.from_state == from_state and t.trigger == trigger:
                return t.to_state
        return None

    def transition(self, context: StateMachineContext,
                  trigger: TransitionTrigger, triggered_by: str) -> ProjectState:
        """Execute state transition"""
        current_state = context.current_state

        if not self.can_transition(current_state, trigger):
            raise ValueError(
                f"Invalid transition from {current_state.value} with trigger {trigger.value}"
            )

        next_state = self.get_next_state(current_state, trigger)
        if not next_state:
            raise ValueError("Transition not found")

        # Update context
        context.current_state = next_state
        context.history.append({
            "state": next_state.value,
            "timestamp": datetime.now().isoformat(),
            "triggered_by": triggered_by
        })

        return next_state

    def get_phase(self, state: ProjectState) -> str:
        """Get the phase name for a state"""
        phases = {
            "Vision & Requirements": [
                ProjectState.VISION_INPUT,
                ProjectState.PRD_GENERATION,
                ProjectState.PRD_REVIEW,
            ],
            "Architecture & Design": [
                ProjectState.ARCHITECTURE_DESIGN,
                ProjectState.ARCHITECTURE_REVIEW,
                ProjectState.SCHEMA_GENERATION,
                ProjectState.API_SPECIFICATION,
            ],
            "Implementation": [
                ProjectState.CODE_GENERATION,
                ProjectState.CODE_REVIEW,
                ProjectState.TEST_GENERATION,
            ],
            "Testing & Quality": [
                ProjectState.INTEGRATION_TESTING,
                ProjectState.VISUAL_TESTING,
                ProjectState.QUALITY_REVIEW,
            ],
            "Deployment": [
                ProjectState.DEPLOYMENT_PREP,
                ProjectState.DEPLOYMENT,
                ProjectState.DEPLOYED,
            ],
        }

        for phase, states in phases.items():
            if state in states:
                return phase
        return "Other"

    def get_progress(self, state: ProjectState) -> int:
        """Calculate progress percentage"""
        state_order = [
            ProjectState.VISION_INPUT,           # 0%
            ProjectState.PRD_GENERATION,         # 5%
            ProjectState.PRD_REVIEW,             # 10%
            ProjectState.ARCHITECTURE_DESIGN,    # 20%
            ProjectState.ARCHITECTURE_REVIEW,    # 25%
            ProjectState.SCHEMA_GENERATION,      # 30%
            ProjectState.API_SPECIFICATION,      # 35%
            ProjectState.CODE_GENERATION,        # 50%
            ProjectState.CODE_REVIEW,            # 60%
            ProjectState.TEST_GENERATION,        # 65%
            ProjectState.INTEGRATION_TESTING,    # 75%
            ProjectState.VISUAL_TESTING,         # 80%
            ProjectState.QUALITY_REVIEW,         # 85%
            ProjectState.DEPLOYMENT_PREP,        # 90%
            ProjectState.DEPLOYMENT,             # 95%
            ProjectState.DEPLOYED,               # 100%
        ]

        try:
            index = state_order.index(state)
            return round((index / (len(state_order) - 1)) * 100)
        except ValueError:
            return 0
