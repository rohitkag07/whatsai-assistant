"use client";
import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  LockKeyhole,
  Save,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/system/PageHeader";
import {
  type Configuration,
  type DraftScope,
  type FieldPath,
  type OnboardingDraft,
  type TemplateId,
  actionLabels,
  clinicQuestions,
  goalLabels,
  questionCatalog,
  steps,
} from "@/lib/onboarding/model";
import { fieldsFor, type FieldDefinition } from "@/lib/onboarding/fields";
import { templates, createDraft } from "@/lib/onboarding/templates";
import {
  activationRequirements,
  fieldValue,
  lifecycle,
  validateDraft,
  withField,
} from "@/lib/onboarding/validation";
import {
  browserDraftAdapter,
  DraftError,
  type DraftAdapter,
} from "@/lib/onboarding/draft-adapter";
import { OnboardingPreview } from "./OnboardingPreview";
import "./onboarding.css";

type SaveState =
  | "idle"
  | "saving"
  | "saved"
  | "error"
  | "permission"
  | "disconnected"
  | "conflict";
type PublishState = "idle" | "saving" | "saved" | "approved" | "published" | "error";
export function OnboardingWorkspace({ scope, initialDraft, resume = false, commandsEnabled = true, onComplete, onExit }: {
  scope: DraftScope; initialDraft?: OnboardingDraft | null; resume?: boolean;
  commandsEnabled?: boolean; onComplete?: (draft: OnboardingDraft) => void; onExit?: () => void;
}) {
  const [drafts, setDrafts] = useState<OnboardingDraft[]>([]);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [notice, setNotice] = useState("");
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [configurationHash, setConfigurationHash] = useState<string | null>(null);
  const [publishNotice, setPublishNotice] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const adapter = useRef<DraftAdapter | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const busy = useRef(false);
  const currentSection = steps[step].id;
  const issues = draft ? validateDraft(draft) : [];
  const stepIssues = issues.filter((issue) => issue.section === currentSection);
  const savedError = [
    "error",
    "permission",
    "disconnected",
    "conflict",
  ].includes(saveState);
  function fail(error: unknown) {
    setSaveState(
      error instanceof DraftError &&
        ["permission", "disconnected", "conflict"].includes(error.kind)
        ? (error.kind as SaveState)
        : "error",
    );
    setNotice(
      error instanceof DraftError
        ? error.message
        : "Local drafts could not be opened. No data was changed.",
    );
  }
  function load() {
    try {
      adapter.current = browserDraftAdapter(scope);
      const existing = adapter.current.list();
      setDrafts(existing);
      if (resume) open([...existing].sort((a,b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''))[0] ?? initialDraft ?? null);
      setSaveState("idle");
      setNotice("");
    } catch (error) {
      fail(error);
    } finally {
      setLoaded(true);
    }
  }
  useEffect(() => {
    // The route remounts on actor/tenant changes. Never reuse a previous scope's draft.
    load();
    // Scope is immutable for this mounted server-owned workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key?.startsWith("xerowa:onboarding:v1:")) {
        try {
          setDrafts(adapter.current?.list() ?? []);
        } catch (error) {
          fail(error);
        }
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  function guard(action: () => void, trigger?: HTMLElement) {
    if (busy.current) return;
    if (dirty) {
      returnFocus.current = trigger ?? (document.activeElement as HTMLElement);
      setPending(() => action);
    } else action();
  }
  function open(next: OnboardingDraft | null) {
    setDraft(next);
    setStep(0);
    setDirty(Boolean(next && next.revision === 0));
    setSaveState("idle");
    setNotice("");
    setShowErrors(false);
    setConfigurationHash(null); setPublishState("idle"); setPublishNotice("");
  }
  function start(templateId: TemplateId) {
    guard(() => open(createDraft(templateId, scope, crypto.randomUUID())));
  }
  function change(path: FieldPath, value: unknown) {
    if (!draft || busy.current) return;
    setDraft(withField(draft, path, value));
    setConfigurationHash(null); setPublishState("idle"); setPublishNotice("");
    setDirty(true);
    setSaveState("idle");
    setNotice("");
  }
  async function save() {
    if (!draft || busy.current) return;
    busy.current = true;
    setSaveState("saving");
    setNotice("Saving in this browser…");
    try {
      if (!adapter.current) adapter.current = browserDraftAdapter(scope);
      const saved = await adapter.current.save(draft, draft.revision);
      setDraft(saved);
      setDrafts(adapter.current.list());
      setDirty(false);
      setSaveState("saved");
      setNotice(
        `Saved locally · revision ${saved.revision}. Not published or activated.`,
      );
    } catch (error) {
      fail(error);
    } finally {
      busy.current = false;
    }
  }
  async function sendConfigurationCommand(
    operation: "save_configuration" | "approve_configuration" | "publish_configuration",
  ) {
    if (!commandsEnabled || !draft || busy.current || !scope.tenantContext) return;
    busy.current = true;
    setPublishState("saving");
    setPublishNotice("Recording an authenticated staging command…");
    const issuedAt = new Date();
    const commandExpiresAt = new Date(
      issuedAt.getTime() + (operation === "publish_configuration" ? 86_400_000 : 300_000),
    );
    const approvalExpiresAt = new Date(issuedAt.getTime() + 86_400_000);
    const payload =
      operation === "save_configuration"
        ? { template_id: draft.templateId, configuration: draft.config }
        : {
            configuration_hash: configurationHash,
            ...(operation === "approve_configuration"
              ? { approval_expires_at: approvalExpiresAt.toISOString() }
              : {}),
          };
    try {
      const response = await fetch("/api/control/commands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operation,
          resourceId: draft.id,
          idempotencyKey: crypto.randomUUID(),
          payload,
          expectedVersion:
            operation === "save_configuration"
              ? draft.revision
              : operation === "publish_configuration"
                ? 0
                : null,
          reason:
            operation === "save_configuration"
              ? "Save reviewed onboarding configuration"
              : operation === "approve_configuration"
                ? "Owner approval for reviewed configuration"
                : "Publish approved configuration version",
          evidenceReference: `onboarding:${draft.id}:revision:${draft.revision}`,
          issuedAt: issuedAt.toISOString(),
          expiresAt: commandExpiresAt.toISOString(),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== "object")
        throw new Error("Command rejected");
      const receipt = "receipt" in result ? result.receipt : null;
      const body = receipt && typeof receipt === "object" && "result" in receipt ? receipt.result : null;
      const hash = body && typeof body === "object" && "configuration_hash" in body
        ? body.configuration_hash
        : null;
      if (operation === "save_configuration") {
        if (typeof hash !== "string") throw new Error("Missing configuration receipt");
        setConfigurationHash(hash);
        setPublishState("saved");
        setPublishNotice("Immutable staging version saved. Owner approval is still required.");
      } else if (operation === "approve_configuration") {
        setPublishState("approved");
        setPublishNotice("Hash-bound owner approval recorded for 24 hours.");
      } else {
        setPublishState("published");
        setPublishNotice("Configuration published to staging. Messaging and business activation remain off.");
      }
    } catch {
      setPublishState("error");
      setPublishNotice("The staging command was not completed. No activation or message was sent.");
    } finally {
      busy.current = false;
    }
  }
  function go(index: number) {
    setStep(index);
    setShowErrors(false);
    requestAnimationFrame(() => {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }
  function next() {
    if (stepIssues.length) {
      setShowErrors(true);
      heading.current?.focus();
    } else go(Math.min(9, step + 1));
  }
  function field(definition: FieldDefinition) {
    if (!draft) return null;
    const value = fieldValue(draft.config, definition.path);
    const error =
      showErrors && stepIssues.find((issue) => issue.path === definition.path);
    const id = "ob-" + definition.path.replace(".", "-");
    const props = {
      id,
      value:
        typeof value === "string" || typeof value === "number" ? value : "",
      disabled: saveState === "saving",
      "aria-required": definition.required || undefined,
      "aria-invalid": Boolean(error),
      "aria-describedby": `${id}-hint${error ? ` ${id}-error` : ""}`,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) =>
        change(
          definition.path,
          definition.type === "number"
            ? Number(event.target.value)
            : event.target.value,
        ),
    };
    return (
      <div
        className={`ob-field ${definition.multiline ? "ob-field-wide" : ""}`}
        key={definition.path}
      >
        <label htmlFor={id}>
          {definition.label}
          {definition.required && <span className="ob-required">Required</span>}
        </label>
        {definition.multiline ? (
          <textarea
            {...props}
            maxLength={4000}
            rows={3}
            placeholder={definition.placeholder}
          />
        ) : (
          <input
            {...props}
            type={definition.type ?? "text"}
            maxLength={4000}
            min={definition.min}
            max={
              definition.type === "date"
                ? new Date().toISOString().slice(0, 10)
                : definition.max
            }
            placeholder={definition.placeholder}
          />
        )}
        <p className="ob-hint" id={`${id}-hint`}>
          {definition.hint ??
            (definition.required
              ? "An owner-entered proposal; review before live use."
              : "Optional. Leave blank if unknown.")}
        </p>
        {error && (
          <p className="ob-field-error" id={`${id}-error`}>
            {error.message}
          </p>
        )}
      </div>
    );
  }
  const visibleFields = fieldsFor(currentSection).filter(
    () => currentSection !== "followup" || draft?.config.followup.enabled,
  );
  return (
    <div data-foundation="control" data-onboarding className="ob-root">
      <PageHeader
        eyebrow="Setup workspace"
        title="Business onboarding"
        description="One product. A configuration that fits each business."
        action={
          <span className="ob-state">
            <LockKeyhole size={14} aria-hidden="true" />
            Not activated
          </span>
        }
      />
      {onExit && <button className="x-button x-button-secondary" onClick={(event) => guard(onExit, event.currentTarget)}>Back to readiness</button>}
      <div className="ob-storage-note">
        <ShieldCheck size={18} aria-hidden="true" />
        <div>
          <strong>Local drafts · This browser only</strong>
          <p>
            Nothing here changes a live assistant. Keep customer records,
            patient details and credentials out of drafts.
          </p>
        </div>
        <span className="ob-disconnected">Live connection: Not connected</span>
      </div>
      {notice && (
        <div
          className={`ob-notice ${savedError ? "ob-notice-error" : ""}`}
          role={savedError ? "alert" : "status"}
        >
          <p>{notice}</p>
          {saveState !== "saving" && savedError && (
            <button
              className="x-button x-button-secondary"
              onClick={() => (draft ? void save() : load())}
            >
              Try again
            </button>
          )}
          {saveState === "conflict" && (
            <button
              className="x-button x-button-secondary"
              onClick={() =>
                guard(() => {
                  try {
                    const latest = adapter.current
                      ?.list()
                      .find((item) => item.id === draft?.id);
                    if (latest) open(latest);
                    else load();
                  } catch (error) {
                    fail(error);
                  }
                })
              }
            >
              Reload saved draft
            </button>
          )}
        </div>
      )}
      {!loaded ? (
        <section className="ob-empty" aria-busy="true">
          <ClipboardList aria-hidden="true" />
          <h2>Opening local drafts</h2>
          <p>
            Checking this browser’s storage. The draft count is not known yet.
          </p>
        </section>
      ) : !draft ? (
        <>
          <section
            className="ob-portfolio"
            aria-label="Business setup progress"
          >
            <div className="ob-row">
              <div>
                <h2>Your business drafts</h2>
                <p className="ob-muted">
                  {savedError
                    ? "Draft count unknown — storage is unavailable."
                    : `${drafts.length} of 10 local draft slots used. No business has been activated.`}
                </p>
              </div>
              <span className="ob-kicker">01 / CONFIGURE</span>
            </div>
            {!savedError && !drafts.length && (
              <div className="ob-empty">
                <ClipboardList size={24} aria-hidden="true" />
                <h3>Start with your first business</h3>
                <p>
                  Choose a starting template below, then replace its defaults
                  with approved business information.
                </p>
              </div>
            )}
            {drafts.length > 0 && (
              <div className="ob-draft-grid">
                {[...drafts].reverse().map((item) => {
                  const completed = steps.filter(
                    (s) =>
                      !validateDraft(item).some(
                        (issue) => issue.section === s.id,
                      ),
                  ).length;
                  return (
                    <button
                      className="ob-draft-card"
                      key={item.id}
                      onClick={() => guard(() => open(item))}
                    >
                      <div className="ob-row">
                        <strong>
                          {item.config.identity.name.trim() ||
                            "Unnamed business draft"}
                        </strong>
                        <ChevronRight size={18} aria-hidden="true" />
                      </div>
                      <span>
                        {templates.find((t) => t.id === item.templateId)?.name}{" "}
                        · {lifecycle(item, false)}
                      </span>
                      <progress
                        aria-label={`${item.config.identity.name || "Unnamed draft"} setup progress`}
                        value={completed}
                        max={10}
                      />
                      <span>
                        {completed}/10 sections complete · revision{" "}
                        {item.revision}
                      </span>
                      <span>Not activated</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
          <section aria-labelledby="ob-template-heading">
            <div className="ob-section-heading">
              <h2 id="ob-template-heading">Choose a starting point</h2>
              <p className="ob-muted">
                Six templates, one shared model. Every default can be reviewed
                before testing; choosing a template grants no permissions.
              </p>
            </div>
            <div className="ob-template-grid">
              {templates.map((template, index) => (
                <button
                  key={template.id}
                  className="ob-template-card"
                  disabled={savedError || drafts.length >= 10}
                  onClick={() => start(template.id)}
                >
                  <span className="ob-template-number">0{index + 1}</span>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <span className="ob-template-action">
                    Configure business{" "}
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </section>
          <TemplateComparison />
        </>
      ) : (
        <>
          <div className="ob-draft-heading">
            <button
              className="x-button x-button-secondary"
              disabled={saveState === "saving"}
              onClick={(event) => guard(() => open(null), event.currentTarget)}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              All drafts
            </button>
            <div>
              <h2>
                {draft.config.identity.name.trim() || "New business draft"}
              </h2>
              <p>
                {templates.find((t) => t.id === draft.templateId)?.name} ·
                template v{draft.templateVersion} ·{" "}
                {draft.revision
                  ? `saved revision ${draft.revision}`
                  : "not saved yet"}
              </p>
            </div>
            <span className="ob-state">{lifecycle(draft, dirty)}</span>
            <span className="ob-dirty">
              {dirty ? "Unsaved changes" : "Saved locally"}
            </span>
          </div>
          <div className="ob-journey">
            <nav className="ob-steps" aria-label="Onboarding steps">
              {steps.map((item, index) => {
                const complete = !issues.some(
                  (issue) => issue.section === item.id,
                );
                return (
                  <button
                    key={item.id}
                    disabled={saveState === "saving"}
                    aria-current={step === index ? "step" : undefined}
                    onClick={() => go(index)}
                  >
                    <span className="ob-step-number">
                      {complete ? (
                        <Check size={14} aria-hidden="true" />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </span>
                    <span>
                      {item.title}
                      <small>{complete ? "Complete" : "Incomplete"}</small>
                    </span>
                    {step === index && (
                      <ChevronRight size={14} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </nav>
            <section className="ob-form-panel" aria-labelledby="ob-step-title">
              <div className="ob-form-heading">
                <p className="ob-kicker">
                  STEP {String(step + 1).padStart(2, "0")} / 10
                </p>
                <h2 ref={heading} tabIndex={-1} id="ob-step-title">
                  {steps[step].title}
                </h2>
                <p className="ob-muted">{steps[step].description}</p>
              </div>
              {showErrors && stepIssues.length > 0 && (
                <div className="ob-notice ob-notice-error" role="alert">
                  <strong>
                    Complete these details, or keep this step as a draft.
                  </strong>
                  <ul>
                    {stepIssues.map((issue) => (
                      <li key={issue.path}>{issue.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {draft.templateId === "clinic" && (
                <div className="ob-clinic-note">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <p>
                    Appointment operations only. Do not enter diagnoses,
                    symptoms, medical history, patient records or medical
                    advice. Clinical questions go to a qualified clinician.
                  </p>
                </div>
              )}
              {currentSection === "objective" && (
                <fieldset className="ob-options">
                  <legend>
                    What should this business configuration support?
                  </legend>
                  {Object.entries(goalLabels).map(([key, label]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={draft.config.objective.goals.includes(
                          key as Configuration["objective"]["goals"][number],
                        )}
                        onChange={(event) =>
                          change(
                            "objective.goals",
                            event.target.checked
                              ? [...draft.config.objective.goals, key]
                              : draft.config.objective.goals.filter(
                                  (goal) => goal !== key,
                                ),
                          )
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              {currentSection === "qualification" && (
                <fieldset className="ob-questions">
                  <legend>Questions to ask</legend>
                  <p className="ob-muted">
                    Choose operational questions, then mark which answers are
                    required.
                  </p>
                  {Object.entries(questionCatalog)
                    .filter(
                      ([key]) =>
                        draft.templateId !== "clinic" ||
                        clinicQuestions.includes(
                          key as (typeof clinicQuestions)[number],
                        ),
                    )
                    .map(([key, label]) => {
                      const question =
                        draft.config.qualification.questions.find(
                          (item) => item.key === key,
                        );
                      return (
                        <div key={key} className="ob-question-row">
                          <label>
                            <input
                              type="checkbox"
                              checked={Boolean(question)}
                              onChange={(event) =>
                                change(
                                  "qualification.questions",
                                  event.target.checked
                                    ? [
                                        ...draft.config.qualification.questions,
                                        { key, required: true },
                                      ]
                                    : draft.config.qualification.questions.filter(
                                        (item) => item.key !== key,
                                      ),
                                )
                              }
                            />
                            <span>{label}</span>
                          </label>
                          <label className="ob-question-required">
                            <span className="sr-only">
                              Answer requirement: {label}
                            </span>
                            <select
                              disabled={!question}
                              value={
                                question?.required ? "required" : "optional"
                              }
                              onChange={(event) =>
                                change(
                                  "qualification.questions",
                                  draft.config.qualification.questions.map(
                                    (item) =>
                                      item.key === key
                                        ? {
                                            ...item,
                                            required:
                                              event.target.value === "required",
                                          }
                                        : item,
                                  ),
                                )
                              }
                            >
                              <option value="required">Required</option>
                              <option value="optional">Optional</option>
                            </select>
                          </label>
                        </div>
                      );
                    })}
                </fieldset>
              )}
              {currentSection === "handoff" && (
                <label className="ob-check">
                  <input
                    type="checkbox"
                    checked={draft.config.handoff.acknowledgement}
                    onChange={(event) =>
                      change("handoff.acknowledgement", event.target.checked)
                    }
                  />
                  <span>
                    Require human acknowledgement before treating a handoff as
                    accepted
                  </span>
                </label>
              )}
              {currentSection === "nextAction" && (
                <>
                  <label className="ob-field">
                    <span>Next action type</span>
                    <select
                      value={draft.config.nextAction.kind}
                      onChange={(event) =>
                        change("nextAction.kind", event.target.value)
                      }
                    >
                      {Object.entries(actionLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="ob-truth-line">
                    <span>Requested</span>
                    <ArrowRight size={16} aria-hidden="true" />
                    <span>Awaiting confirmation evidence</span>
                    <LockKeyhole size={16} aria-hidden="true" />
                    <span>Confirmed only by authority</span>
                  </div>
                </>
              )}
              {currentSection === "followup" && (
                <>
                  <label className="ob-check">
                    <input
                      type="checkbox"
                      checked={draft.config.followup.enabled}
                      onChange={(event) =>
                        change("followup.enabled", event.target.checked)
                      }
                    />
                    <span>Include a follow-up policy in this draft</span>
                  </label>
                  <p className="ob-muted">
                    {draft.config.followup.enabled
                      ? "Policy configuration only. No sequence is started."
                      : "Follow-ups are disabled in this draft. Nothing will be scheduled."}
                  </p>
                  {draft.config.followup.enabled && (
                    <label className="ob-check">
                      <input
                        type="checkbox"
                        checked={draft.config.followup.humanApproval}
                        onChange={(event) =>
                          change("followup.humanApproval", event.target.checked)
                        }
                      />
                      <span>
                        Require human approval before follow-up execution
                      </span>
                    </label>
                  )}
                </>
              )}
              <div className="ob-fields">
                {visibleFields.filter((item) => !item.advanced).map(field)}
              </div>
              {visibleFields.some((item) => item.advanced) && (
                <details
                  className="ob-advanced"
                  open={
                    (showErrors &&
                      stepIssues.some((issue) =>
                        visibleFields.some(
                          (item) => item.advanced && item.path === issue.path,
                        ),
                      )) ||
                    undefined
                  }
                >
                  <summary>
                    Review detailed boundaries and exception handling
                  </summary>
                  <div className="ob-fields">
                    {visibleFields.filter((item) => item.advanced).map(field)}
                  </div>
                </details>
              )}
              {currentSection === "behavior" && (
                <OnboardingPreview key={draft.id} draft={draft} />
              )}
              {currentSection === "review" && (
                <>
                  <section className="ob-readiness">
                    <div className="ob-row">
                      <h3>Configuration summary</h3>
                      <span className="ob-state">
                        {lifecycle(draft, dirty)}
                      </span>
                    </div>
                    <p className="ob-muted">
                      Complete configuration enables a local test only. Business
                      facts, permissions and external connections still need
                      verification.
                    </p>
                    {steps.slice(0, 9).map((item, index) => {
                      const missing = issues.filter(
                        (issue) => issue.section === item.id,
                      );
                      return (
                        <div className="ob-review-row" key={item.id}>
                          {missing.length ? (
                            <Circle size={17} aria-hidden="true" />
                          ) : (
                            <CheckCircle2 size={17} aria-hidden="true" />
                          )}
                          <div>
                            <strong>{item.title}</strong>
                            <p>
                              {missing.length
                                ? `${missing.length} incomplete requirement${missing.length === 1 ? "" : "s"}`
                                : "Configured · owner-entered proposal"}
                            </p>
                          </div>
                          <button
                            className="x-button x-button-secondary"
                            onClick={() => go(index)}
                          >
                            Review<span className="sr-only"> {item.title}</span>
                          </button>
                        </div>
                      );
                    })}
                    <dl className="ob-facts">
                      <div>
                        <dt>Business</dt>
                        <dd>{draft.config.identity.name || "Incomplete"}</dd>
                      </div>
                      <div>
                        <dt>Language / timezone</dt>
                        <dd>
                          {draft.config.identity.primaryLanguage || "Unknown"} /{" "}
                          {draft.config.identity.timezone || "Unknown"}
                        </dd>
                      </div>
                      <div>
                        <dt>Owner / team</dt>
                        <dd>{draft.config.handoff.owner || "Unknown owner"}</dd>
                      </div>
                      <div>
                        <dt>Pricing</dt>
                        <dd>{draft.config.offerings.pricing || "Unknown"}</dd>
                      </div>
                      <div>
                        <dt>Next action</dt>
                        <dd>
                          {actionLabels[draft.config.nextAction.kind]} · not
                          confirmed
                        </dd>
                      </div>
                      <div>
                        <dt>Measurable outcome definition</dt>
                        <dd>
                          {draft.config.objective.outcome || "Incomplete"}
                        </dd>
                      </div>
                    </dl>
                    <details className="ob-advanced">
                      <summary>Inspect every configuration field</summary>
                      <dl className="ob-full-summary">
                        {steps
                          .slice(0, 9)
                          .flatMap((s) => fieldsFor(s.id))
                          .map((item) => (
                            <div key={item.path}>
                              <dt>{item.label}</dt>
                              <dd>
                                {String(
                                  fieldValue(draft.config, item.path) ||
                                    "Unknown",
                                )}
                              </dd>
                            </div>
                          ))}
                        <div>
                          <dt>Objectives</dt>
                          <dd>
                            {draft.config.objective.goals
                              .map((goal) => goalLabels[goal])
                              .join("; ") || "Incomplete"}
                          </dd>
                        </div>
                        <div>
                          <dt>Handoff acknowledgement</dt>
                          <dd>
                            {draft.config.handoff.acknowledgement
                              ? "Required"
                              : "Not required — incomplete for pilot testing"}
                          </dd>
                        </div>
                        <div>
                          <dt>Follow-up policy</dt>
                          <dd>
                            {draft.config.followup.enabled
                              ? "Included in draft only — not running"
                              : "Disabled"}
                          </dd>
                        </div>
                        <div>
                          <dt>Follow-up human approval</dt>
                          <dd>
                            {draft.config.followup.humanApproval
                              ? "Required"
                              : "Not required — incomplete if follow-up is enabled"}
                          </dd>
                        </div>
                        <div>
                          <dt>Template provenance</dt>
                          <dd>
                            {draft.templateId} / v{draft.templateVersion} ·
                            defaults with owner overrides
                          </dd>
                        </div>
                        <div>
                          <dt>Local configuration review</dt>
                          <dd>
                            {draft.config.review.acknowledged
                              ? "Acknowledged for local test only"
                              : "Incomplete"}
                          </dd>
                        </div>
                        <div>
                          <dt>Qualification questions</dt>
                          <dd>
                            {draft.config.qualification.questions
                              .map(
                                (q) =>
                                  `${questionCatalog[q.key]} (${q.required ? "required" : "optional"})`,
                              )
                              .join("; ") || "Incomplete"}
                          </dd>
                        </div>
                      </dl>
                    </details>
                    <label className="ob-check">
                      <input
                        type="checkbox"
                        checked={draft.config.review.acknowledged}
                        disabled={issues.some(
                          (issue) => issue.section !== "review",
                        )}
                        onChange={(event) =>
                          change("review.acknowledged", event.target.checked)
                        }
                      />
                      <span>
                        I reviewed this proposal for a local Synthetic test.
                        This does not certify consent, live facts or activation.
                      </span>
                    </label>
                    <p className="ob-muted">
                      {issues.some((issue) => issue.section !== "review")
                        ? "Complete the missing requirements above before acknowledging review."
                        : dirty
                          ? "Save this revision to record local test readiness."
                          : "Any edit resets this review acknowledgement."}
                    </p>
                  </section>
                  <OnboardingPreview key={draft.id} draft={draft} />
                  {commandsEnabled && <section className="ob-readiness">
                    <div className="ob-row">
                      <h3>Activation checklist</h3>
                      <span className="ob-state">
                        <LockKeyhole size={14} aria-hidden="true" />
                        Not activated
                      </span>
                    </div>
                    {activationRequirements.map((item) => (
                      <div className="ob-activation-row" key={item.title}>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.detail}</p>
                        </div>
                        <span>{item.state}</span>
                      </div>
                    ))}
                    <div className="ob-review-row">
                      <div>
                        <strong>Secure configuration publication</strong>
                        <p>
                          Save an immutable version, bind owner approval to its hash,
                          then publish the approved pointer. This never sends a message.
                        </p>
                      </div>
                      <div className="ob-publish-actions">
                        <button
                          className="x-button x-button-secondary"
                          disabled={dirty || !draft.config.review.acknowledged || publishState === "saving" || publishState !== "idle"}
                          onClick={() => void sendConfigurationCommand("save_configuration")}
                        >
                          Save secure version
                        </button>
                        <button
                          className="x-button x-button-secondary"
                          disabled={publishState !== "saved"}
                          onClick={() => void sendConfigurationCommand("approve_configuration")}
                        >
                          Approve version
                        </button>
                        <button
                          className="x-button"
                          disabled={publishState !== "approved"}
                          onClick={() => void sendConfigurationCommand("publish_configuration")}
                        >
                          Publish to staging
                        </button>
                      </div>
                    </div>
                    {publishNotice && (
                      <p className="ob-muted" role={publishState === "error" ? "alert" : "status"}>
                        {publishNotice}
                      </p>
                    )}
                    <button
                      className="x-button"
                      disabled
                      aria-describedby="ob-activation-note"
                    >
                      Activate business
                    </button>
                    <p id="ob-activation-note" className="ob-muted">
                      Active means published configuration plus required
                      connection, consent and verification evidence. Activation
                      is unavailable in this local slice.
                    </p>
                  </section>}
                </>
              )}
              <div className="ob-form-actions">
                <div>
                  <button
                    className="x-button x-button-secondary"
                    disabled={step === 0 || saveState === "saving"}
                    onClick={() => go(step - 1)}
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back
                  </button>
                  {step < 9 && (
                    <button
                      className="ob-text-button"
                      disabled={saveState === "saving"}
                      onClick={() => go(step + 1)}
                    >
                      Skip for now
                    </button>
                  )}
                </div>
                <div>
                  <button
                    className="x-button x-button-secondary"
                    disabled={saveState === "saving" || !dirty}
                    onClick={() => void save()}
                  >
                    <Save size={16} aria-hidden="true" />
                    {saveState === "saving" ? "Saving…" : "Save draft"}
                  </button>
                  {onComplete && step === 9 && <button className="x-button" disabled={dirty || issues.length > 0 || saveState === "saving"} onClick={() => onComplete(draft)}>Continue to Synthetic test</button>}
                  {step < 9 && (
                    <button
                      className="x-button"
                      disabled={saveState === "saving"}
                      onClick={next}
                    >
                      Continue
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </>
      )}
      <Dialog.Root
        open={Boolean(pending)}
        onOpenChange={(value) => {
          if (!value) setPending(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="x-overlay" />
          <Dialog.Content
            data-foundation="control"
            className="x-palette ob-discard"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocus.current?.focus();
            }}
          >
            <Dialog.Title>Keep your unsaved changes?</Dialog.Title>
            <Dialog.Description>
              Leaving this draft discards only the unsaved edits. Its last saved
              revision remains in this browser.
            </Dialog.Description>
            <div className="ob-row">
              <Dialog.Close className="x-button x-button-secondary">
                Keep editing
              </Dialog.Close>
              <button
                className="x-button"
                onClick={() => {
                  const action = pending;
                  setPending(null);
                  action?.();
                }}
              >
                Discard edits and continue
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
function TemplateComparison() {
  return (
    <details className="ob-comparison">
      <summary>Compare the six templates and their shared model</summary>
      <p>
        Each template creates the same ten configuration sections. Only initial
        objectives, question selection, next action and boundaries differ. No
        template creates a database, application, verified fact or permission.
      </p>
      <div className="ob-comparison-grid">
        {templates.map((template) => (
          <article key={template.id}>
            <h3>{template.name}</h3>
            <dl>
              <dt>Starting objectives</dt>
              <dd>
                {template.objective.map((goal) => goalLabels[goal]).join(" · ")}
              </dd>
              <dt>Qualification</dt>
              <dd>
                {template.questions
                  .map((key) => questionCatalog[key])
                  .join(" ")}
              </dd>
              <dt>Next action</dt>
              <dd>{actionLabels[template.nextAction]}</dd>
              <dt>Boundary</dt>
              <dd>{template.boundary}</dd>
            </dl>
          </article>
        ))}
      </div>
      <div className="ob-shared-model">
        <strong>One configuration model</strong>
        <p>
          Identity → Offerings → Objective → Qualification → Handoff → Next
          action → Follow-up → Knowledge → Behavior → Review
        </p>
        <p>
          One draft adapter. One validation path. One versioned policy proposal.
          Zero activation shortcuts.
        </p>
      </div>
    </details>
  );
}
