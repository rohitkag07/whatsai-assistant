import { Suspense } from "react";
import { ForgotPasswordExperience } from "@/components/auth/ForgotPasswordExperience";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<p role="status">Opening account recovery…</p>}>
      <ForgotPasswordExperience />
    </Suspense>
  );
}
