"use client";
import { SystemState } from "@/components/system/SystemState";
export default function ErrorBoundary({
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <div data-foundation="control">
      <SystemState kind="error" onRetry={retry} />
    </div>
  );
}
