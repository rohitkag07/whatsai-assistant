import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReadinessSnapshot } from "@/lib/first-run/model";
import "./first-run.css";
export function ReadinessCard({ snapshot }: { snapshot: ReadinessSnapshot }) {
  return (
    <section
      data-foundation="control"
      className="fr-card"
      aria-label="Workflow readiness"
    >
      <div>
        <p className="fr-eyebrow">WORKFLOW READINESS / {snapshot.source}</p>
        <h2>
          {snapshot.version
            ? "Review your configured workflow"
            : "Prepare your first workflow"}
        </h2>
        <p>
          Proposal, owner approval, staging publication and connection remain
          separate. Not activated.
        </p>
      </div>
      <Link className="x-button x-button-secondary" href="/setup">
        Open readiness <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
