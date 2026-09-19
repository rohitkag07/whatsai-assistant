"use client";
import { SystemState } from "@/components/system/SystemState";
export default function ErrorBoundary({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div data-foundation="command" className="x-lab-route">
      <p className="x-synthetic-badge">Synthetic design lab</p>
      <SystemState kind="error" onRetry={retry} />
    </div>
  );
}
