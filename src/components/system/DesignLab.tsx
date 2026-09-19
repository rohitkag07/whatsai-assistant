"use client";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Layers3,
  MessageSquare,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "./PageHeader";
import { StatusPill, type StatusKind } from "./StatusPill";
import { SystemState } from "./SystemState";
import { SYNTHETIC_FIXTURE as fixture } from "./design-lab-fixtures";
import type { SystemStateKind } from "@/lib/shell-state";
const stateOptions: ("populated" | SystemStateKind)[] = [
  "populated",
  "loading",
  "empty",
  "error",
  "disconnected",
  "permission",
  "unknown",
  "partial",
];
export function DesignLab() {
  const [theme, setTheme] = useState<"control" | "command">("control");
  const [state, setState] =
    useState<(typeof stateOptions)[number]>("populated");
  const [name, setName] = useState("Sample enquiry");
  const [notice, setNotice] = useState("");
  return (
    <div className="x-design-lab">
      <div className="x-synthetic-banner">
        <span className="x-synthetic-badge">Synthetic</span>
        <p>
          Design preview only. No customer data, live metrics or external
          actions.
        </p>
        <span className="x-mono">FOUNDATION / 01</span>
      </div>
      <PageHeader
        eyebrow="Precision Operations"
        title="Clarity at every step."
        description="One shared foundation for the people running the work and the people responsible for the system."
        action={
          <span className="x-lab-version">
            <Layers3 size={16} aria-hidden="true" />
            Design lab · v1
          </span>
        }
      />
      <div className="x-lab-toolbar">
        <fieldset>
          <legend className="sr-only">Preview theme</legend>
          <div className="x-segmented">
            <button
              aria-pressed={theme === "control"}
              onClick={() => setTheme("control")}
            >
              Control · Light
            </button>
            <button
              aria-pressed={theme === "command"}
              onClick={() => setTheme("command")}
            >
              Command · Dark
            </button>
          </div>
        </fieldset>
        <label className="x-state-select">
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span>Preview state</span>
          <select
            value={state}
            onChange={(event) => {
              setState(event.target.value as typeof state);
              setNotice("");
            }}
          >
            {stateOptions.map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section
        data-foundation={theme}
        className="x-preview"
        aria-label="Synthetic workspace preview"
      >
        <div className="x-preview-heading">
          <div>
            <p className="x-eyebrow">{fixture.business}</p>
            <h2>Enquiry → accountable next action</h2>
          </div>
          <span className="x-synthetic-badge">Synthetic</span>
        </div>
        {state !== "populated" ? (
          <SystemState
            kind={state}
            onRetry={() => {
              setNotice(
                "Synthetic retry preview. No data source was contacted.",
              );
            }}
          />
        ) : (
          <div className="x-preview-grid">
            <section className="x-conversation-preview">
              <div className="x-section-title">
                <MessageSquare size={17} aria-hidden="true" />
                <h3>Conversation context</h3>
                <span className="x-meta">Example 01</span>
              </div>
              <div className="x-message">
                <span className="x-eyebrow">Customer · Synthetic</span>
                <p>{fixture.enquiry}</p>
              </div>
              <div className="x-message x-message-assistant">
                <span className="x-eyebrow">
                  Business assistant · Synthetic
                </span>
                <p>{fixture.reply}</p>
              </div>
              <div className="x-evidence-note">
                <Check size={16} aria-hidden="true" />
                <div>
                  <strong>Grounded in a business rule</strong>
                  <p>{fixture.source}</p>
                </div>
              </div>
              <div className="x-next-action">
                <span className="x-eyebrow">Next action</span>
                <strong>Confirm the missing requirements</strong>
                <p>An enquiry is not a confirmed appointment.</p>
              </div>
            </section>
            <section className="x-trace-preview">
              <div className="x-section-title">
                <h3>Accountability trail</h3>
                <span className="x-meta">4 example steps</span>
              </div>
              <ol>
                {fixture.steps.map((step, index) => (
                  <li key={step.label}>
                    <div className="x-trace-number">0{index + 1}</div>
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.detail}</p>
                      <StatusPill status={step.state} />
                    </div>
                    {index < 3 && (
                      <ArrowDown
                        className="x-trace-arrow"
                        size={12}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                ))}
              </ol>
              <div className="x-owner-row">
                <span className="x-avatar" aria-hidden="true">
                  SC
                </span>
                <div>
                  <strong>{fixture.owner}</strong>
                  <p>Acceptance pending · Synthetic</p>
                </div>
                <ArrowUpRight size={16} aria-hidden="true" />
              </div>
            </section>
          </div>
        )}
        {notice && (
          <p className="x-preview-notice" role="status">
            {notice}
          </p>
        )}
      </section>
      <div className="x-lab-bottom">
        <section className="x-lab-panel">
          <p className="x-eyebrow">01 / State language</p>
          <h2>Different states. Clear meaning.</h2>
          <p className="x-description">
            Text and icons carry meaning alongside colour.
          </p>
          <div className="x-status-collection">
            {(
              [
                "verified",
                "active",
                "customer",
                "human",
                "paused",
                "failed",
                "unknown",
              ] as StatusKind[]
            ).map((status) => (
              <StatusPill key={status} status={status} />
            ))}
          </div>
        </section>
        <section className="x-lab-panel">
          <p className="x-eyebrow">02 / Interaction</p>
          <h2>Useful in every condition.</h2>
          <label className="x-form-label" htmlFor="synthetic-enquiry">
            Example label <span>Synthetic</span>
          </label>
          <input
            id="synthetic-enquiry"
            className="x-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            aria-describedby="synthetic-help"
          />
          <p id="synthetic-help" className="x-meta">
            Local preview only. No record is saved.
          </p>
          <div className="x-action-row">
            <button
              className="x-button"
              onClick={() =>
                setNotice(
                  "Synthetic preview acknowledged. No action was executed.",
                )
              }
            >
              Preview acknowledgement
            </button>
            <button className="x-button x-button-secondary" disabled>
              Unavailable action
            </button>
          </div>
          <p className="x-bilingual" lang="hi">
            {fixture.note}
          </p>
        </section>
      </div>
      <section className="x-token-strip" aria-label="Semantic palette">
        <span className="x-eyebrow">One semantic system</span>
        {[
          "Canvas",
          "Surface",
          "Foreground",
          "Success",
          "Attention",
          "Danger",
        ].map((label) => (
          <span key={label}>
            <i data-token={label.toLowerCase()} aria-hidden="true" />
            {label}
          </span>
        ))}
      </section>
    </div>
  );
}
