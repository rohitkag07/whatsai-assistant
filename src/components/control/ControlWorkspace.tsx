"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  CircleHelp,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import {
  ageLabel,
  appointmentStates,
  canShowRows,
  countLabel,
  followupStates,
  readStates,
  stages,
  timeLabel,
  views,
  type Case,
  type ControlReadModel,
  type ReadState,
  type Receipt,
  type View,
} from "@/lib/control/model";
import "./control.css";

const stateCopy: Record<ReadState, { title: string; detail: string }> = {
  ready: {
    title: "Snapshot available",
    detail: "Review the source and its timestamp before acting.",
  },
  empty: {
    title: "No records in this snapshot",
    detail: "This is a successful empty read. It is not a connection failure.",
  },
  partial: {
    title: "Partial information",
    detail:
      "Some records are missing. Counts are lower bounds; absence is not proof of no work.",
  },
  stale: {
    title: "This snapshot is stale",
    detail:
      "These are last-known records. Recheck the authoritative source before acting.",
  },
  loading: {
    title: "Loading workspace",
    detail: "Counts and records are unavailable while the read is pending.",
  },
  error: {
    title: "Workspace could not be read",
    detail:
      "No records were changed. Counts are unknown; a failed read is not zero.",
  },
  permission: {
    title: "Permission required",
    detail:
      "The current read does not grant access to these records. Ask your workspace owner.",
  },
  disconnected: {
    title: "Source not connected",
    detail:
      "No live channel or business source is connected in this review slice.",
  },
  unavailable: {
    title: "Operations data unavailable",
    detail:
      "A verified read adapter has not been enabled. No business activity or connection status has been established.",
  },
};
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="co-badge">{children}</span>;
}
function Evidence({ receipt }: { receipt: Receipt | null }) {
  return receipt ? (
    <details className="co-evidence">
      <summary>Inspect evidence</summary>
      <dl>
        <dt>Authority</dt>
        <dd>{receipt.actor || receipt.authority}</dd>
        <dt>Reference</dt>
        <dd>{receipt.reference}</dd>
        <dt>Recorded</dt>
        <dd>{timeLabel(receipt.at)}</dd>
        <dt>Basis</dt>
        <dd>{receipt.detail}</dd>
      </dl>
    </details>
  ) : (
    <span className="co-muted">
      Verification unavailable · no authoritative receipt
    </span>
  );
}
function CaseLink({ item }: { item: Case }) {
  return (
    <Link
      className="co-link"
      href={`/chats?case=${encodeURIComponent(item.id)}`}
    >
      {item.label}
      <ArrowRight aria-hidden="true" size={15} />
    </Link>
  );
}

export function ControlWorkspace({
  initial,
  view,
}: {
  initial: ControlReadModel;
  view: View;
}) {
  const params = useSearchParams();
  const [status, setStatus] = useState<ReadState>(initial.status);
  const [filter, setFilter] = useState("All");
  const [owner, setOwner] = useState("All");
  const [search, setSearch] = useState("");
  const [board, setBoard] = useState(false);
  const [selected, setSelected] = useState(
    initial.cases.find((c) => c.id === params.get("case"))?.id ||
      initial.cases[0]?.id ||
      "",
  );
  const [pane, setPane] = useState<"queue" | "timeline" | "context">(
    params.get("case") && initial.cases.some((c) => c.id === params.get("case"))
      ? "timeline"
      : "queue",
  );
  const [takeover, setTakeover] = useState(false);
  const [simulation, setSimulation] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const timelineHeading = useRef<HTMLHeadingElement>(null);
  const contextHeading = useRef<HTMLHeadingElement>(null);
  const takeoverTrigger = useRef<HTMLButtonElement>(null);
  const returnToContext = useRef<HTMLButtonElement>(null);
  const show = canShowRows(status);
  const rows = show ? initial.cases : [];
  const filtered = rows.filter(
    (c) =>
      (filter === "All" || c.stage === filter) &&
      (owner === "All" ||
        (owner === "Unassigned" ? !c.owner : Boolean(c.owner))) &&
      `${c.label} ${c.intent}`.toLowerCase().includes(search.toLowerCase()),
  );
  const current = filtered.find((c) => c.id === selected) ?? filtered[0];
  const title = views.find((v) => v.id === view)!;
  function select(item: Case) {
    setSelected(item.id);
    setPane("timeline");
    requestAnimationFrame(() => timelineHeading.current?.focus());
  }
  function queue() {
    setPane("queue");
    requestAnimationFrame(() =>
      document.getElementById(`queue-${selected}`)?.focus(),
    );
  }
  function context() {
    setPane("context");
    requestAnimationFrame(() => contextHeading.current?.focus());
  }
  function back() {
    setPane("timeline");
    requestAnimationFrame(() => returnToContext.current?.focus());
  }
  const urgent = rows.filter((c) => c.handoff?.status === "open");
  const outcomes = rows.filter((c) => c.stage === "Won/completed" && c.receipt);
  const due = show ? initial.followups.filter((f) => f.state === "Due") : [];
  const failures = show
    ? initial.followups.filter(
        (f) => f.state === "Failed" || f.state === "Outcome unknown",
      )
    : [];
  const counts = [
    ["Enquiries in view", rows.length],
    ["Awaiting acknowledgement", urgent.length],
    ["Follow-ups due", due.length],
    ["Verified outcomes in sample", outcomes.length],
  ] as const;
  const emptyMessage =
    status === "empty"
      ? "No records returned. A verified zero in this Synthetic snapshot."
      : !show
        ? stateCopy[status].detail
        : "No records match these filters. Clear filters to see the full snapshot.";
  return (
    <section className="co-root" data-control data-view={view}>
      <div className="co-provenance" role="note">
        <ShieldCheck size={18} aria-hidden="true" />
        <div>
          <strong>
            {initial.source === "synthetic"
              ? "Synthetic · Operations review"
              : "Operations review · Data unavailable"}
          </strong>
          <p>
            {initial.source === "synthetic"
              ? "Every enquiry, operator, message and receipt below is an example. No live action can run here."
              : "Live operations are unavailable. No connection or readiness claim has been verified."}
          </p>
        </div>
        <span>Read only · Not activated</span>
      </div>
      <header className="co-heading">
        <div>
          <p className="co-eyebrow">XeroWA / Control</p>
          <h1>{title.title}</h1>
          <p>{title.description}</p>
        </div>
        <div className="co-stamp">
          <span>
            {initial.source === "synthetic"
              ? "Synthetic snapshot"
              : "Source snapshot"}
          </span>
          <strong>{timeLabel(initial.asOf)}</strong>
        </div>
      </header>
      <nav className="co-tabs" aria-label="Control workspaces">
        {views.map((v) => (
          <Link
            key={v.id}
            href={v.href}
            aria-current={v.id === view ? "page" : undefined}
          >
            {v.title}
          </Link>
        ))}
      </nav>
      <div className="co-source-row">
        <p>
          <span className="co-dot" aria-hidden="true" />
          {stateCopy[status].title}{" "}
          <span className="co-muted">· Live connection: Not connected</span>
        </p>
        {initial.source === "synthetic" && (
          <label>
            Review data state
            <select
              aria-label="Review data state"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ReadState);
                setSimulation(null);
                setNotice("");
                setPane("queue");
              }}
            >
              {readStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {status !== "ready" && (
        <div
          className="co-state"
          role={status === "error" ? "alert" : "status"}
          aria-busy={status === "loading"}
        >
          <CircleHelp size={20} aria-hidden="true" />
          <div>
            <h2>{stateCopy[status].title}</h2>
            <p>{stateCopy[status].detail}</p>
            {["partial", "stale"].includes(status) && (
              <p>Recorded snapshot: {timeLabel(initial.asOf)}</p>
            )}
          </div>
          {status === "error" && initial.source === "synthetic" && (
            <button
              className="x-button x-button-secondary"
              onClick={() => {
                setStatus(initial.status);
                setNotice(
                  "Synthetic snapshot reopened. No live source was contacted.",
                );
              }}
            >
              Reopen review snapshot
            </button>
          )}
        </div>
      )}
      {notice && (
        <p className="co-notice" role="status">
          {notice}
        </p>
      )}

      {view === "today" && (
        <>
          <div className="co-metrics" aria-label="Snapshot counts">
            {counts.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{countLabel(status, value)}</strong>
                <small>
                  {status === "ready" || status === "empty"
                    ? "Synthetic snapshot only"
                    : status === "partial"
                      ? "Incomplete source"
                      : status === "stale"
                        ? "Last known snapshot"
                        : "Count unavailable"}
                </small>
              </div>
            ))}
          </div>
          <section className="co-briefing">
            <div className="co-primary">
              <p className="co-eyebrow">First decision</p>
              <h2>
                {urgent.length
                  ? "Get an owner acknowledgement"
                  : show
                    ? "Review the next outstanding enquiry"
                    : "Establish a trustworthy read"}
              </h2>
              <p>
                {urgent.length
                  ? `${urgent[0].label} has an open handoff. Assignment alone is not acceptance.`
                  : show
                    ? "Inspect the enquiry, the recorded evidence and the next action before progressing it."
                    : stateCopy[status].detail}
              </p>
              {show && (
                <Link
                  className="x-button"
                  href={`/chats${urgent[0] ? `?case=${urgent[0].id}` : ""}`}
                >
                  Review in inbox <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
            <dl className="co-next-context">
              <dt>Decision owner</dt>
              <dd>{urgent[0]?.owner || "Unknown"}</dd>
              <dt>Source</dt>
              <dd>{urgent[0]?.handoff?.id || "Unavailable"}</dd>
              <dt>What counts as done</dt>
              <dd>
                An explicit acknowledgement by the responsible person, recorded
                with evidence.
              </dd>
            </dl>
          </section>
          <div className="co-section-title">
            <h2>Attention queue</h2>
            <span>Priority by unmet obligation</span>
          </div>
          <div className="co-attention">
            {!show || !rows.length ? (
              <p className="co-empty">{emptyMessage}</p>
            ) : (
              <>
                {urgent.map((c) => (
                  <article key={c.id}>
                    <Badge>Unacknowledged</Badge>
                    <div>
                      <CaseLink item={c} />
                      <p>
                        {c.handoff?.reason} · Owner: {c.owner || "Unassigned"}
                      </p>
                    </div>
                    <span>
                      {ageLabel(c.handoff!.created_at, initial.asOf)} waiting
                    </span>
                  </article>
                ))}
                {due.map((f) => (
                  <article key={f.id}>
                    <Badge>Follow-up due</Badge>
                    <div>
                      <Link className="co-link" href="/follow-ups">
                        Inspect {f.id} before any send
                      </Link>
                      <p>{f.eligibility}</p>
                    </div>
                    <span>{timeLabel(f.scheduledAt)}</span>
                  </article>
                ))}
                {failures.map((f) => (
                  <article key={f.id}>
                    <Badge>{f.state}</Badge>
                    <div>
                      <Link className="co-link" href="/follow-ups">
                        Review automation {f.id}
                      </Link>
                      <p>{f.reason}</p>
                    </div>
                    <span>Human review</span>
                  </article>
                ))}
                <article>
                  <Badge>Next actions</Badge>
                  <div>
                    <Link className="co-link" href="/calendar">
                      Review requests and confirmations
                    </Link>
                    <p>
                      Appointment requests do not guarantee availability or
                      attendance.
                    </p>
                  </div>
                  <span>
                    {countLabel(status, initial.appointments.length)} in
                    snapshot
                  </span>
                </article>
              </>
            )}
          </div>
          <section className="co-outcomes">
            <h2>Outcome evidence</h2>
            <p>
              A reply is activity. A business outcome needs an authoritative
              record.
            </p>
            {outcomes.map((c) => (
              <div key={c.id}>
                <CaseLink item={c} />
                <Badge>Verified in Synthetic sample</Badge>
                <Evidence receipt={c.receipt} />
              </div>
            ))}
            <p className="co-muted">
              {show
                ? `${rows.filter((c) => c.stage === "Outcome unknown").length} explicitly unknown outcome in this sample. Other open cases are not yet completed.`
                : "Outcomes unknown — source unavailable."}
            </p>
          </section>
        </>
      )}

      {(view === "pipeline" || view === "inbox") && (
        <div className="co-filters">
          <label>
            Find an enquiry
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enquiry ID or intent"
            />
          </label>
          <label>
            Stage
            <select
              aria-label="Stage"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>All</option>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Owner
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option>All</option>
              <option>Assigned</option>
              <option>Unassigned</option>
            </select>
          </label>
          <button
            className="x-button x-button-secondary"
            onClick={() => {
              setFilter("All");
              setOwner("All");
              setSearch("");
            }}
          >
            Clear filters
          </button>
          {view === "pipeline" && (
            <div className="co-view-toggle" aria-label="Pipeline view">
              <button
                className="x-button x-button-secondary"
                aria-pressed={!board}
                onClick={() => setBoard(false)}
              >
                List
              </button>
              <button
                className="x-button x-button-secondary"
                aria-pressed={board}
                onClick={() => setBoard(true)}
              >
                Board
              </button>
            </div>
          )}
        </div>
      )}

      {view === "inbox" && (
        <div className="co-inbox" data-pane={pane}>
          <section
            className="co-queue"
            aria-label="Conversation queue"
            tabIndex={0}
          >
            <div className="co-pane-title">
              <h2>Enquiries</h2>
              <span>{show ? filtered.length : "—"} in view</span>
            </div>
            {!filtered.length ? (
              <p className="co-empty">{emptyMessage}</p>
            ) : (
              filtered.map((c) => (
                <button
                  id={`queue-${c.id}`}
                  className="co-queue-item"
                  key={c.id}
                  aria-pressed={c.id === current?.id}
                  onClick={() => select(c)}
                >
                  <span>{c.label}</span>
                  <strong>{c.intent}</strong>
                  <small>
                    {c.owner || "Unassigned"} ·{" "}
                    {ageLabel(c.openedAt, initial.asOf)}
                  </small>
                  <Badge>{c.stage}</Badge>
                </button>
              ))
            )}
          </section>
          <section
            className="co-timeline"
            aria-label="Conversation timeline"
            tabIndex={0}
          >
            <div className="co-pane-title">
              <button
                className="co-mobile x-button x-button-secondary"
                onClick={queue}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back to queue
              </button>
              <h2 ref={timelineHeading} tabIndex={-1}>
                {current?.label || "Select an enquiry"}
              </h2>
              <button
                ref={returnToContext}
                className="co-mobile x-button x-button-secondary"
                onClick={context}
                disabled={!current}
              >
                View context <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
            {current ? (
              <>
                <p className="co-intent">
                  {current.intent}
                  <span>Summary · unverified interpretation</span>
                </p>
                <ol className="co-events">
                  {current.messages.map((m) => (
                    <li key={m.id} data-direction={m.direction}>
                      <div className="co-event-meta">
                        <strong>
                          {m.direction === "inbound"
                            ? "Synthetic customer"
                            : m.agent
                              ? "Synthetic assistant"
                              : "Synthetic operator"}
                        </strong>
                        <time>{timeLabel(m.created_at)}</time>
                      </div>
                      <p>{m.body || "Message content unavailable"}</p>
                      <small>
                        Source {m.id} · {m.status} · activity only
                      </small>
                    </li>
                  ))}
                  {current.handoff && (
                    <li className="co-event-system">
                      <CheckCheck size={17} aria-hidden="true" />
                      <div>
                        <strong>Human handoff recorded</strong>
                        <p>{current.handoff.reason}</p>
                        <small>
                          {current.handoff.id} · recorded status:{" "}
                          {current.handoff.status}
                        </small>
                        <p>
                          {current.stage === "Human acknowledged"
                            ? "Acknowledgement receipt available in the context rail."
                            : "Acceptance not verified. An assigned owner is not an acknowledgement."}
                        </p>
                      </div>
                    </li>
                  )}
                </ol>
                <div className="co-action-bar">
                  <span>
                    Human control:{" "}
                    {simulation === current.id
                      ? "Synthetic takeover simulated"
                      : current.mode === "manual"
                        ? "Manual mode recorded"
                        : "Not verified"}
                  </span>
                  <button
                    ref={takeoverTrigger}
                    className="x-button"
                    onClick={() => setTakeover(true)}
                    disabled={initial.source !== "synthetic"}
                  >
                    Preview human takeover
                  </button>
                  <p>
                    Sending is unavailable in this review. No composer or
                    outbound action is connected.
                  </p>
                </div>
              </>
            ) : (
              <p className="co-empty">{emptyMessage}</p>
            )}
          </section>
          <aside
            className="co-context"
            aria-label="Qualification and business context"
            tabIndex={0}
          >
            <div className="co-pane-title">
              <button
                className="co-mobile x-button x-button-secondary"
                onClick={back}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back to conversation
              </button>
              <h2 ref={contextHeading} tabIndex={-1}>
                Business context
              </h2>
            </div>
            {current && (
              <>
                <div className="co-context-block">
                  <h3>Accountable progression</h3>
                  <Badge>{current.stage}</Badge>
                  <Evidence receipt={current.receipt} />
                  <dl>
                    <dt>Owner</dt>
                    <dd>{current.owner || "Unassigned"}</dd>
                    <dt>Handoff acknowledgement</dt>
                    <dd>
                      {current.stage === "Human acknowledged" && current.receipt
                        ? "Verified in Synthetic receipt"
                        : "Unknown unless explicitly evidenced"}
                    </dd>
                    <dt>Outcome</dt>
                    <dd>
                      {["Won/completed", "Lost/not eligible"].includes(
                        current.stage,
                      )
                        ? `${current.stage} · Synthetic evidence`
                        : "Unknown / not established"}
                    </dd>
                  </dl>
                </div>
                <div className="co-context-block">
                  <h3>Qualification answers</h3>
                  {current.answers.length ? (
                    current.answers.map((a) => (
                      <dl key={a.id}>
                        <dt>{a.question_key.replaceAll("_", " ")}</dt>
                        <dd>{a.answer_value}</dd>
                        <dt>Source</dt>
                        <dd>
                          {a.id} · extraction at {timeLabel(a.extracted_at)}.{" "}
                          {a.confidence === null
                            ? "Confidence unknown."
                            : "Confidence is an extraction estimate."}
                        </dd>
                      </dl>
                    ))
                  ) : (
                    <p>Incomplete · no recorded answers</p>
                  )}
                  <p className="co-muted">
                    Answers alone do not prove qualification.
                  </p>
                </div>
                <div className="co-context-block">
                  <h3>Next action & follow-up</h3>
                  {initial.appointments
                    .filter((a) => a.threadId === current.id)
                    .map((a) => (
                      <div key={a.id}>
                        <Badge>{a.state}</Badge>
                        <p>
                          {a.title} · {timeLabel(a.scheduledAt)}
                        </p>
                        <Evidence receipt={a.receipt} />
                      </div>
                    ))}
                  {initial.followups
                    .filter((f) => f.threadId === current.id)
                    .map((f) => (
                      <p key={f.id}>
                        {f.id}: {f.state} · {f.eligibility}
                      </p>
                    ))}
                  <p className="co-muted">
                    Any unlisted next action or follow-up is unknown. No live
                    connection has been checked.
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {view === "pipeline" &&
        (board ? (
          <section className="co-board" aria-label="Pipeline board">
            {stages.map((stage) => (
              <section key={stage}>
                <h2>{stage}</h2>
                <span className="co-muted">
                  {countLabel(
                    status,
                    filtered.filter((c) => c.stage === stage).length,
                  )}{" "}
                  matching
                </span>
                {filtered
                  .filter((c) => c.stage === stage)
                  .map((c) => (
                    <article key={c.id}>
                      <CaseLink item={c} />
                      <p>{c.intent}</p>
                      <p>
                        {c.owner || "Unassigned"} ·{" "}
                        {ageLabel(c.openedAt, initial.asOf)}
                      </p>
                      <Evidence receipt={c.receipt} />
                    </article>
                  ))}
              </section>
            ))}
          </section>
        ) : (
          <section aria-label="Pipeline list" className="co-record-list">
            <div className="co-list-header">
              <span>Enquiry / intent</span>
              <span>Progression</span>
              <span>Owner / age</span>
              <span>Next action / evidence</span>
            </div>
            {!filtered.length ? (
              <p className="co-empty">{emptyMessage}</p>
            ) : (
              filtered.map((c) => (
                <article key={c.id} className="co-pipeline-row">
                  <div>
                    <CaseLink item={c} />
                    <p>{c.intent}</p>
                  </div>
                  <Badge>{c.stage}</Badge>
                  <div>
                    {c.owner || "Unassigned"}
                    <p>{ageLabel(c.openedAt, initial.asOf)} since enquiry</p>
                  </div>
                  <div>
                    <p>
                      {initial.appointments.find((a) => a.threadId === c.id)
                        ?.state || "Next action unknown"}
                    </p>
                    <Evidence receipt={c.receipt} />
                  </div>
                </article>
              ))
            )}
          </section>
        ))}

      {view === "followups" && (
        <>
          <div className="co-filters">
            <label>
              Follow-up status
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>All</option>
                {followupStates.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <p>No message can be sent from this queue.</p>
          </div>
          <section className="co-record-list" aria-label="Follow-up queue">
            {!show ||
            !initial.followups.filter(
              (f) => filter === "All" || f.state === filter,
            ).length ? (
              <p className="co-empty">{emptyMessage}</p>
            ) : (
              initial.followups
                .filter((f) => filter === "All" || f.state === filter)
                .map((f) => (
                  <article key={f.id} className="co-operation-row">
                    <div className="co-operation-heading">
                      <div>
                        <span className="co-id">Synthetic · {f.id}</span>
                        <h2>
                          {f.state === "Due"
                            ? "Review eligibility before follow-up"
                            : f.state === "Failed"
                              ? "Resolve delivery uncertainty"
                              : "Review follow-up obligation"}
                        </h2>
                        <Link
                          className="co-link"
                          href={`/chats?case=${f.threadId}`}
                        >
                          Open enquiry {f.threadId}
                        </Link>
                      </div>
                      <Badge>{f.state}</Badge>
                    </div>
                    <dl className="co-fact-grid">
                      <div>
                        <dt>Reason</dt>
                        <dd>{f.reason}</dd>
                      </div>
                      <div>
                        <dt>Eligibility</dt>
                        <dd>{f.eligibility}</dd>
                      </div>
                      <div>
                        <dt>Owner</dt>
                        <dd>{f.owner || "Unassigned"}</dd>
                      </div>
                      <div>
                        <dt>Scheduled</dt>
                        <dd>{timeLabel(f.scheduledAt)}</dd>
                      </div>
                      <div>
                        <dt>Attempt count</dt>
                        <dd>
                          {f.attempts === null
                            ? "Unknown — no attempt receipt"
                            : f.attempts}
                        </dd>
                      </div>
                      <div>
                        <dt>Approval</dt>
                        <dd>{f.approval}</dd>
                      </div>
                      <div>
                        <dt>Stop / pause reason</dt>
                        <dd>{f.stopReason}</dd>
                      </div>
                      <div>
                        <dt>Final receipt</dt>
                        <dd>
                          <Evidence receipt={f.receipt} />
                        </dd>
                      </div>
                    </dl>
                    <p className="co-muted">
                      Sending or receiving a message does not establish a
                      business outcome.
                    </p>
                  </article>
                ))
            )}
          </section>
        </>
      )}

      {view === "appointments" && (
        <>
          <div className="co-filters">
            <label>
              Appointment status
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>All</option>
                {appointmentStates.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <p>Confirmation and attendance each require their own evidence.</p>
          </div>
          <section
            className="co-record-list"
            aria-label="Appointment and outcome queue"
          >
            {!show ||
            !initial.appointments.filter(
              (a) => filter === "All" || a.state === filter,
            ).length ? (
              <p className="co-empty">{emptyMessage}</p>
            ) : (
              initial.appointments
                .filter((a) => filter === "All" || a.state === filter)
                .map((a) => (
                  <article key={a.id} className="co-operation-row">
                    <div className="co-operation-heading">
                      <div>
                        <span className="co-id">Synthetic · {a.id}</span>
                        <h2>{a.title}</h2>
                        <p>{timeLabel(a.scheduledAt)}</p>
                        <Link
                          className="co-link"
                          href={`/chats?case=${a.threadId}`}
                        >
                          Open enquiry {a.threadId}
                        </Link>
                      </div>
                      <Badge>{a.state}</Badge>
                    </div>
                    <Evidence receipt={a.receipt} />
                    <p className="co-muted">
                      {a.state === "Attended/completed"
                        ? "Attendance demonstrated by a Synthetic receipt. No actual business outcome occurred."
                        : a.state === "Confirmed"
                          ? "Confirmation is demonstrated in this sample; attendance and business outcome are still unknown."
                          : "This state does not establish a completed appointment or business outcome."}
                    </p>
                    <details className="co-evidence">
                      <summary>Source record</summary>
                      <p>
                        {a.id} · legacy status “{a.recordedStatus}”. A legacy
                        scheduling status alone cannot verify confirmation.
                      </p>
                    </details>
                  </article>
                ))
            )}
          </section>
        </>
      )}

      <footer className="co-footer">
        <Inbox size={16} aria-hidden="true" />
        <p>
          Understand → qualify → assign → acknowledge → follow up → next action
          → evidence-backed outcome. Unknown is a valid result.
        </p>
      </footer>
      <Dialog.Root open={takeover} onOpenChange={setTakeover}>
        <Dialog.Portal>
          <Dialog.Overlay className="x-overlay" />
          <Dialog.Content
            className="x-palette co-dialog"
            data-foundation="control"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              takeoverTrigger.current?.focus();
            }}
          >
            <Dialog.Title>Preview a human takeover</Dialog.Title>
            <Dialog.Description>
              This Synthetic simulation changes this preview session only. It
              does not assign a real owner, pause an assistant, send a message
              or create an acknowledgement receipt.
            </Dialog.Description>
            <p>
              Enquiry: {current?.label}. Responsible operator: Synthetic
              coordinator.
            </p>
            <div className="co-dialog-actions">
              <Dialog.Close className="x-button x-button-secondary">
                Cancel
              </Dialog.Close>
              <button
                className="x-button"
                onClick={() => {
                  setSimulation(current?.id || null);
                  setNotice(
                    "Synthetic takeover simulated. No live ownership or automation state was changed.",
                  );
                  setTakeover(false);
                }}
              >
                Simulate acknowledgement
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
