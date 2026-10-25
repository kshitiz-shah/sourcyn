"""Node 6: Decision Explanation Node."""

import uuid
from typing import Any, Dict, List
from app.agents.explanation_agent import DecisionExplanationAgent
from app.graphs.state import ProcurementEvaluationState
from app.schemas.compliance import ComplianceResult
from app.schemas.explanation import DecisionExplanationInput
from app.schemas.risk import RiskAssessmentResult
from app.schemas.scoring import EvaluationScorecard, ScoringPolicyConfig


def _to_uuid(val: Any) -> uuid.UUID:
    if isinstance(val, uuid.UUID):
        return val
    s = str(val or "")
    try:
        return uuid.UUID(s)
    except (ValueError, AttributeError):
        return uuid.uuid5(uuid.NAMESPACE_DNS, s if s else "default-uuid")


def explanation_node(state: ProcurementEvaluationState) -> Dict[str, Any]:
    """Execute Agent 8 to synthesize an anti-hallucination narrative justification for the decision."""
    eval_id = _to_uuid(state.get("evaluation_id"))
    scorecard_dict = state.get("scorecard", {})
    scorecard = EvaluationScorecard(**scorecard_dict)
    
    policy_dict = state.get("scoring_policy", {})
    policy = ScoringPolicyConfig(**policy_dict)

    compliance_results = [ComplianceResult(**cr) for cr in state.get("compliance_results", [])]
    risk_results = [RiskAssessmentResult(**rr) for rr in state.get("risk_results", [])]

    curr = state.get("procurement_spec", {}).get("currency") or state.get("raw_input", {}).get("currency") or "INR"
    explanation_input = DecisionExplanationInput(
        evaluation_id=eval_id,
        scorecard=scorecard,
        compliance_results=compliance_results,
        risk_results=risk_results,
        policy_config=policy,
        currency=curr,
    )

    explanation = DecisionExplanationAgent.explain(explanation_input)

    return {
        "status": "AWAITING_APPROVAL",
        "approval_status": "PENDING",
        "decision_explanation": explanation.model_dump(mode="json"),
    }
