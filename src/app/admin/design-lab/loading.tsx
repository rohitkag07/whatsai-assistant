import { SystemState } from "@/components/system/SystemState";
export default function Loading() {
  return (
    <div data-foundation="command" className="x-lab-route">
      <p className="x-synthetic-badge">Synthetic design lab</p>
      <SystemState kind="loading" />
    </div>
  );
}
