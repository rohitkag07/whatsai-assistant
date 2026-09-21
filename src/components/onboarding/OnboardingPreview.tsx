"use client";
import { useState } from "react";
import type { OnboardingDraft } from "@/lib/onboarding/model";
import {
  previewConversation,
  type PreviewScenario,
} from "@/lib/onboarding/preview";
export function OnboardingPreview({ draft }: { draft: OnboardingDraft }) {
  const [scenario, setScenario] = useState<PreviewScenario>("enquiry");
  const preview = previewConversation(draft, scenario);
  return (
    <section className="ob-preview" aria-label="Synthetic conversation preview">
      <div className="ob-row">
        <h3>Synthetic test conversation</h3>
        <span className="x-synthetic-badge">Synthetic</span>
      </div>
      <p className="ob-muted">
        Scripted policy examples, not an AI evaluation. No customer data, sender
        or mutation API is used.
      </p>
      <label className="ob-field">
        <span>Preview scenario</span>
        <select
          value={scenario}
          onChange={(event) =>
            setScenario(event.target.value as PreviewScenario)
          }
        >
          <option value="enquiry">New enquiry</option>
          <option value="request">Appointment or order request</option>
          <option value="missing">Missing knowledge</option>
          <option value="optout">Opt-out</option>
          {draft.templateId === "clinic" && (
            <option value="clinical">Clinical boundary</option>
          )}
        </select>
      </label>
      <div className="ob-message">
        <span>Customer · Synthetic</span>
        <p>{preview.customer}</p>
      </div>
      <div className="ob-message ob-message-answer">
        <span>Assistant · Synthetic</span>
        <p>{preview.assistant}</p>
      </div>
      <p className="ob-state">{preview.state}</p>
      <p className="ob-muted">{preview.evidence}</p>
      <p className="ob-muted">
        Real outcome: Unknown. No appointment, order, message, lead or opt-out
        record is created.
      </p>
    </section>
  );
}
