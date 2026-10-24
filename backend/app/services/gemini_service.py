import os
import json
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("aicms.gemini")

# Category mapping to standard AICTE Bureaus
BUREAU_MAPPING = {
    "Fee & Financial Grievance": "Finance & Fee Regulation Bureau",
    "Approvals & Affiliation": "Approvals & Affiliation Bureau",
    "Academic & Examinations": "Academic Standards & Curriculum Bureau",
    "Infrastructure & Faculty": "Academic Standards & Curriculum Bureau",
    "Campus Safety & Ragging": "Anti-Ragging & Campus Safety Bureau",
    "Admission & Capitation Malpractice": "Approvals & Affiliation Bureau",
    "Scholarship & Financial Aid Delay": "Finance & Fee Regulation Bureau",
    "Other Grievance": "Approvals & Affiliation Bureau"
}

def analyze_complaint_with_gemini(
    subject: str,
    description: str,
    category: str,
    institution_name: str
) -> Dict[str, Any]:
    """
    Leverages Gemini to:
    1. Assess grievance urgency & priority (low, medium, high, urgent)
    2. Determine the most accurate AICTE regulatory bureau
    3. Produce a concise, executive AI grievance summary for inquiry officers
    4. Provide recommended immediate regulatory action
    """
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    
    # Fallback heuristic if API key is not present or offline
    fallback_result = {
        "recommended_priority": "medium",
        "recommended_bureau": BUREAU_MAPPING.get(category, "Approvals & Affiliation Bureau"),
        "ai_summary": f"Complaint regarding {category} at {institution_name}. Issue raised: '{subject[:100]}'.",
        "key_concerns": [category, institution_name],
        "recommended_action": "Allocate to designated bureau review officer for 14-day SLA review."
    }

    if not api_key:
        logger.info("GEMINI_API_KEY not configured, utilizing deterministic fallback triage.")
        return fallback_result

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = f"""You are the AI Grievance Governance Engine for AICMS (AICTE Integrated Case Monitoring System).
Analyze this grievance filed against an educational institution:

Institution: {institution_name}
Subject: {subject}
Category: {category}
Description:
{description}

Respond ONLY with a valid JSON object with the following exact keys:
{{
  "recommended_priority": "low" | "medium" | "high" | "urgent",
  "recommended_bureau": "Finance & Fee Regulation Bureau" | "Approvals & Affiliation Bureau" | "Academic Standards & Curriculum Bureau" | "Anti-Ragging & Campus Safety Bureau",
  "ai_summary": "2-3 concise sentences summarizing the root complaint and complainant request",
  "key_concerns": ["concern 1", "concern 2", "concern 3"],
  "recommended_action": "Suggested next regulatory step for the inquiry officer"
}}

Note: If the complaint involves ragging, student harassment, or immediate safety hazards, prioritize as 'urgent' and assign to 'Anti-Ragging & Campus Safety Bureau'.
If it mentions capitation fees or caution deposit withholding, assign to 'Finance & Fee Regulation Bureau'.
"""

        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )

        if response and response.text:
            parsed = json.loads(response.text)
            logger.info("Successfully analyzed complaint with Gemini 2.5 Flash")
            return {
                "recommended_priority": parsed.get("recommended_priority", fallback_result["recommended_priority"]).lower(),
                "recommended_bureau": parsed.get("recommended_bureau", fallback_result["recommended_bureau"]),
                "ai_summary": parsed.get("ai_summary", fallback_result["ai_summary"]),
                "key_concerns": parsed.get("key_concerns", fallback_result["key_concerns"]),
                "recommended_action": parsed.get("recommended_action", fallback_result["recommended_action"]),
            }
    except Exception as e:
        logger.warning(f"Gemini AI analysis error: {e}. Falling back to default triage.")
        return fallback_result

    return fallback_result
