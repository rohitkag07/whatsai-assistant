import { SystemState } from "@/components/system/SystemState";
export default function Loading() {
  return (
    <div data-foundation="control">
      <SystemState kind="loading" />
    </div>
  );
}
