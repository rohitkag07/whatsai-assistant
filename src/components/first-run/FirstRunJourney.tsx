"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FlaskConical,
  LockKeyhole,
} from "lucide-react";
import type { DraftScope, OnboardingDraft } from "@/lib/onboarding/model";
import { browserDraftAdapter } from "@/lib/onboarding/draft-adapter";
import { validateDraft } from "@/lib/onboarding/validation";
import {
  nextSetupAction,
  readinessAt,
  readinessChecklist,
  type ReadinessSnapshot,
  type ReadinessState,
} from "@/lib/first-run/model";
import {
  sampleEnquiries,
  safeSample,
  syntheticTest,
} from "@/lib/first-run/demo";
import { OnboardingWorkspace } from "@/components/onboarding/OnboardingWorkspace";
import "./first-run.css";

type View = "checklist" | "configure" | "test" | "result";
const stateCopy: Record<ReadinessState, { title: string; detail: string }> = {
  ready: {
    title: "Review your workflow",
    detail:
      "Configuration evidence is available. It does not prove a live connection or activation.",
  },
  empty: {
    title: "Start with your business workflow",
    detail:
      "No configuration version was found in this permitted workspace. Choose a template and save a local proposal.",
  },
  partial: {
    title: "Some readiness evidence is missing",
    detail:
      "One or more sources could not be read. Missing evidence remains unknown; do not assume approval or publication.",
  },
  stale: {
    title: "Readiness evidence needs a refresh",
    detail:
      "This snapshot is stale. Refresh before relying on approval or publication.",
  },
  denied: {
    title: "Readiness access is restricted",
    detail:
      "The selected workspace or a child record failed the access check. Ask your workspace owner to review membership.",
  },
  disconnected: {
    title: "The channel is disconnected",
    detail:
      "You can review a local proposal and run a Synthetic test. No message will be sent.",
  },
  error: {
    title: "Readiness could not be verified",
    detail:
      "The provider returned an error or an invalid response. Retry; no missing value is counted as complete.",
  },
  unavailable: {
    title: "Verified readiness is unavailable",
    detail:
      "The approved read environment is not available. A local proposal is still separate from owner approval and publication.",
  },
};
export function FirstRunJourney({
  scope,
  snapshot,
  canEdit,
}: {
  scope: DraftScope;
  snapshot: ReadinessSnapshot;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("checklist");
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [sample, setSample] = useState(sampleEnquiries[0]);
  const [inputError, setInputError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof syntheticTest> | null>(
    null,
  );
  const [labState, setLabState] = useState<ReadinessState | "loading">(
    snapshot.state,
  );
  const [clock, setClock] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const reloadLocal = useCallback(() => {
    try {
      const local = browserDraftAdapter(scope)
        .list()
        .sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? ""));
      setDraft(local[0] ?? snapshot.version?.draft ?? null);
      setStorageError("");
    } catch {
      setDraft(null);
      setStorageError(
        "Local storage is unavailable or invalid. Nothing was overwritten. Reopen this browser with storage access; keep the existing draft for recovery.",
      );
    }
    setLoaded(true);
  }, [scope, snapshot]);
  useEffect(() => {
    reloadLocal();
  }, [reloadLocal]); // Server-owned scope; remount on workspace change.
  useEffect(() => {
    heading.current?.focus();
  }, [view]);
  useEffect(() => {
    setClock(Date.now());
    const timer = setInterval(() => setClock(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const synthetic = snapshot.source === "Synthetic";
  const observed = clock === null ? snapshot : readinessAt(snapshot, clock);
  const state = synthetic ? labState : observed.state;
  const effective: ReadinessSnapshot = !synthetic
    ? observed
    : state === "loading"
      ? snapshot
      : state === snapshot.state
        ? snapshot
        : {
            ...snapshot,
            state,
            version: state === "empty" ? null : snapshot.version,
            approval: [
              "partial",
              "stale",
              "error",
              "unavailable",
              "denied",
            ].includes(state)
              ? "Unknown"
              : snapshot.approval,
            publication: [
              "partial",
              "stale",
              "error",
              "unavailable",
              "denied",
            ].includes(state)
              ? "Unknown"
              : snapshot.publication,
            channel:
              state === "disconnected" ? "Disconnected" : snapshot.channel,
          };
  const activeDraft = state === "empty" ? null : draft;
  const tested = Boolean(
    result &&
      activeDraft &&
      result.binding === JSON.stringify(activeDraft.config),
  );
  const items = readinessChecklist(effective, activeDraft);
  const action = nextSetupAction(effective, activeDraft, false, tested);
  const blocked =
    state === "denied" || state === "loading" || Boolean(storageError);
  function go(next: View) {
    setView(next);
    setInputError("");
  }
  function finish(next: OnboardingDraft) {
    setDraft(next);
    setResult(null);
    go("test");
  }
  if (view === "configure" && canEdit && !blocked)
    return (
      <section data-foundation="control" className="fr-journey">
        <OnboardingWorkspace
          scope={scope}
          initialDraft={activeDraft}
          resume
          commandsEnabled={false}
          onComplete={finish}
          onExit={() => {
            reloadLocal();
            setResult(null);
            go("checklist");
          }}
        />
      </section>
    );
  return (
    <section
      data-foundation="control"
      className="fr-journey"
      aria-label="First-run workflow"
    >
      <header className="fr-heading">
        <div>
          <p className="fr-eyebrow">CONTROL / WORKFLOW SETUP</p>
          <h1 ref={heading} tabIndex={-1}>
            {view === "test"
              ? "Try an enquiry safely"
              : view === "result"
                ? "Your first workflow result"
                : "A clear path to your first result"}
          </h1>
          <p>
            Configure how enquiries move from a question to a human-owned next
            step.
          </p>
        </div>
        <Link className="x-button x-button-secondary" href="/dashboard">
          Continue to Control <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </header>
      <div className="fr-boundary">
        <FlaskConical size={18} aria-hidden="true" />
        <p>
          <strong>
            {synthetic
              ? "Synthetic design review"
              : "Research preview · Synthetic test only"}
          </strong>
          <br />
          {synthetic
            ? "All readiness evidence here is a Synthetic fixture."
            : "Readiness source: " +
              snapshot.source +
              ". The enquiry test remains Synthetic."}{" "}
          No sends, customer records or activation.
        </p>
        <span>
          <LockKeyhole size={14} aria-hidden="true" /> Not activated
        </span>
      </div>
      <nav className="fr-steps" aria-label="Setup journey">
        {(["checklist", "test", "result"] as const).map((item, index) => (
          <button
            key={item}
            aria-current={view === item ? "step" : undefined}
            onClick={() => go(item)}
          >
            <span>0{index + 1}</span>
            {item === "checklist"
              ? "Readiness"
              : item === "test"
                ? "Synthetic test"
                : "First result"}
          </button>
        ))}
      </nav>
      {synthetic && (
        <details className="fr-lab">
          <summary>Synthetic state examples</summary>
          <label>
            Readiness teaching state
            <select
              value={labState}
              onChange={(event) => {
                setLabState(event.target.value as ReadinessState | "loading");
                setResult(null);
              }}
            >
              {[
                "ready",
                "empty",
                "loading",
                "partial",
                "stale",
                "denied",
                "disconnected",
                "error",
                "unavailable",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <p>
            These examples do not change workspace authority or provider state.
          </p>
        </details>
      )}
      {storageError && (
        <div className="fr-error" role="alert">
          <p>{storageError}</p>
          <button className="x-button x-button-secondary" onClick={reloadLocal}>
            Retry local drafts
          </button>
        </div>
      )}
      {!loaded || state === "loading" ? (
        <div className="fr-panel" role="status" aria-busy="true">
          <h2>Checking readiness</h2>
          <p>Configuration, approval and channel status are not known yet.</p>
        </div>
      ) : (
        <>
          <section
            className="fr-state"
            role={state === "denied" || state === "error" ? "alert" : undefined}
          >
            <div>
              <p className="fr-eyebrow">
                {effective.businessName ??
                  "Selected workspace · identity unavailable"}
              </p>
              <h2>{stateCopy[state].title}</h2>
              <p>{stateCopy[state].detail}</p>
            </div>
            {!synthetic && (
              <button
                className="x-button x-button-secondary"
                onClick={() => router.refresh()}
              >
                Refresh evidence
              </button>
            )}
          </section>
          {view === "checklist" && (
            <div className="fr-grid">
              <section className="fr-panel">
                <h2>Your readiness checklist</h2>
                <p className="fr-muted">
                  Each item describes a proposal or verified record. Completion
                  is not live readiness.
                </p>
                <ul className="fr-checklist">
                  {items.map((item) => (
                    <li key={item.id}>
                      {item.status === "Configured proposal" ? (
                        <CheckCircle2 size={18} aria-hidden="true" />
                      ) : (
                        <Circle size={18} aria-hidden="true" />
                      )}
                      <div>
                        <h3>{item.title}</h3>
                        <strong>{item.status}</strong>
                        <p>{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <aside className="fr-panel fr-next">
                <p className="fr-eyebrow">YOUR NEXT STEP</p>
                <h2>
                  {canEdit ? action.label : "Review the workspace proposal"}
                </h2>
                <p>
                  {canEdit
                    ? action.detail
                    : "Only an active business owner can edit a local proposal. Your role can inspect available readiness evidence and try a Synthetic enquiry."}
                </p>
                <button
                  className="x-button"
                  disabled={blocked}
                  onClick={() =>
                    go(
                      canEdit ? action.target : activeDraft ? "test" : "result",
                    )
                  }
                >
                  {canEdit ? action.label : "Inspect the Synthetic test"}{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                {canEdit && activeDraft && (
                  <button
                    className="x-button x-button-secondary"
                    disabled={blocked}
                    onClick={() => go("configure")}
                  >
                    {activeDraft.savedAt
                      ? "Resume local proposal"
                      : "Review configuration"}
                  </button>
                )}
                <p className="fr-muted">
                  Local draft:{" "}
                  {activeDraft?.savedAt
                    ? "saved in this browser"
                    : activeDraft
                      ? "read-only version proposal; not saved locally"
                      : "not found"}
                  . Nothing here publishes a version.
                </p>
              </aside>
            </div>
          )}
          {view === "test" && (
            <div className="fr-grid">
              <section className="fr-panel">
                <p className="fr-eyebrow">SYNTHETIC / NO SEND</p>
                <h2>Choose an invented enquiry</h2>
                <p>
                  See the scripted response and routing boundaries. This is a
                  configuration review, not a live AI or WhatsApp test.
                </p>
                <label className="fr-field" htmlFor="fr-example">
                  Example enquiry
                </label>
                <select
                  id="fr-example"
                  className="fr-select"
                  value={sampleEnquiries.includes(sample) ? sample : ""}
                  onChange={(event) => {
                    setSample(event.target.value);
                    setResult(null);
                  }}
                >
                  <option value="" disabled>
                    Custom invented enquiry
                  </option>
                  {sampleEnquiries.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <label className="fr-field" htmlFor="fr-enquiry">
                  Synthetic enquiry
                </label>
                <textarea
                  id="fr-enquiry"
                  maxLength={400}
                  value={sample}
                  onChange={(event) => {
                    setSample(event.target.value);
                    setResult(null);
                  }}
                  aria-describedby="fr-input-note"
                />
                <p id="fr-input-note" className="fr-muted">
                  Invented text only, up to 400 characters. No contacts, phone
                  numbers, links or private information. Input is held in memory
                  and clears on reload.
                </p>
                {inputError && (
                  <p className="fr-error" role="alert">
                    {inputError}
                  </p>
                )}
                <button
                  className="x-button"
                  disabled={
                    blocked ||
                    !activeDraft ||
                    validateDraft(activeDraft).length > 0
                  }
                  onClick={() => {
                    if (!activeDraft) return;
                    if (!safeSample(sample)) {
                      setInputError(
                        "Use an invented enquiry without contact details or links.",
                      );
                      return;
                    }
                    setResult(syntheticTest(activeDraft, sample));
                    go("result");
                  }}
                >
                  Run Synthetic test <ArrowRight size={16} aria-hidden="true" />
                </button>
                {(!activeDraft || validateDraft(activeDraft).length > 0) && (
                  <p className="fr-muted">
                    Complete and review a configuration proposal before testing.
                  </p>
                )}
              </section>
              <aside className="fr-panel">
                <h2>What this test can tell you</h2>
                <ol className="fr-explainer">
                  <li>
                    <strong>Reply</strong>
                    <p>
                      Scripted against the enquiry category and current
                      configuration.
                    </p>
                  </li>
                  <li>
                    <strong>Qualification</strong>
                    <p>
                      Questions are configured. Answers and fit remain unknown.
                    </p>
                  </li>
                  <li>
                    <strong>Handoff</strong>
                    <p>
                      A proposed team role is visible. Acceptance is not
                      inferred.
                    </p>
                  </li>
                  <li>
                    <strong>Follow-up</strong>
                    <p>
                      Configuration is explained; no job or message is created.
                    </p>
                  </li>
                </ol>
              </aside>
            </div>
          )}
          {view === "result" && (
            <div className="fr-grid">
              <section className="fr-panel">
                <p className="fr-eyebrow">SYNTHETIC / FIRST RESULT</p>
                <h2>
                  {tested
                    ? "Your configured workflow, explained"
                    : "No Synthetic test result yet"}
                </h2>
                {tested && result ? (
                  <>
                    <div className="fr-conversation">
                      <p>
                        <strong>Synthetic enquiry</strong>
                        <br />
                        {result.customer}
                      </p>
                      <p>
                        <strong>Scripted reply</strong>
                        <br />
                        {result.assistant}
                      </p>
                    </div>
                    <dl className="fr-results">
                      {[
                        ["Qualification", result.qualification],
                        ["Handoff", result.handoff],
                        ["Follow-up", result.followup],
                        ["Evidence boundary", result.evidence],
                      ].map(([title, detail]) => (
                        <div key={title}>
                          <dt>{title}</dt>
                          <dd>{detail}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <p>
                    A test is valid only for the current configuration and
                    current page session. Editing or reloading clears it.
                  </p>
                )}
                <p className="fr-muted">
                  No real conversation, qualification answer, handoff,
                  appointment or follow-up was written.
                </p>
              </section>
              <aside className="fr-panel fr-next">
                <h2>Readiness is still separate</h2>
                <dl className="fr-results">
                  <div>
                    <dt>Configured proposal</dt>
                    <dd>
                      {activeDraft && validateDraft(activeDraft).length === 0
                        ? "Complete for a local test"
                        : "Incomplete"}
                    </dd>
                  </div>
                  <div>
                    <dt>Local review</dt>
                    <dd>
                      {activeDraft?.config.review.acknowledged
                        ? "Acknowledged for a Synthetic test"
                        : "Not acknowledged"}
                    </dd>
                  </div>
                  <div>
                    <dt>Owner approval / publication</dt>
                    <dd>{items.find((i) => i.id === "authority")?.status}</dd>
                  </div>
                  <div>
                    <dt>Channel</dt>
                    <dd>{effective.channel}</dd>
                  </div>
                  <div>
                    <dt>Activation</dt>
                    <dd>Not activated · security / pilot NO-GO</dd>
                  </div>
                </dl>
                <button
                  className="x-button"
                  disabled={blocked}
                  onClick={() =>
                    go(
                      action.target === "configure" && !canEdit
                        ? "checklist"
                        : action.target === "result"
                          ? "checklist"
                          : action.target,
                    )
                  }
                >
                  {action.label}
                </button>
                <p className="fr-muted">{action.detail}</p>
              </aside>
            </div>
          )}
        </>
      )}
      <footer className="fr-footer">
        {synthetic
          ? "Synthetic fixture evidence only."
          : "User-scoped readiness evidence; test results are Synthetic."}{" "}
        Configuration review does not establish customer outcomes.
      </footer>
    </section>
  );
}
