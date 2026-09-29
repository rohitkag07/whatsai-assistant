import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  commandPayloadHash,
  commandRequestSchema,
  commandWindowIsValid,
} from "@/lib/control/commands";

type CommandRpc = {
  rpc(
    name: "execute_xerowa_control_command",
    args: {
      p_business_id: string;
      p_operation: string;
      p_resource_id: string;
      p_idempotency_key: string;
      p_payload: Record<string, unknown>;
      p_payload_hash: string;
      p_expected_version: number | null;
      p_reason: string;
      p_evidence_reference: string | null;
      p_issued_at: string;
      p_expires_at: string;
    },
  ): Promise<{
    data: Record<string, unknown> | null;
    error: { code?: string; message: string } | null;
  }>;
};

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.activeBusinessId)
    return NextResponse.json(
      { ok: false, error: "Active business membership required." },
      { status: 403 },
    );

  const parsed = commandRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, error: "Invalid command envelope." },
      { status: 400 },
    );
  if (!commandWindowIsValid(parsed.data))
    return NextResponse.json(
      { ok: false, error: "Command expired or has an invalid validity window." },
      { status: 409 },
    );

  const client = await createClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || auth.user?.id !== session.user.id)
    return NextResponse.json(
      { ok: false, error: "Authenticated session could not be verified." },
      { status: 401 },
    );

  const command = parsed.data;
  const { data, error } = await (client as unknown as CommandRpc).rpc("execute_xerowa_control_command", {
    p_business_id: session.activeBusinessId,
    p_operation: command.operation,
    p_resource_id: command.resourceId,
    p_idempotency_key: command.idempotencyKey,
    p_payload: command.payload,
    p_payload_hash: commandPayloadHash(command),
    p_expected_version: command.expectedVersion,
    p_reason: command.reason,
    p_evidence_reference: command.evidenceReference,
    p_issued_at: command.issuedAt,
    p_expires_at: command.expiresAt,
  });

  if (error) {
    const conflict = ["23505", "40001"].includes(error.code ?? "");
    const denied = error.code === "42501";
    return NextResponse.json(
      {
        ok: false,
        error: denied
          ? "This account is not authorized for that business action."
          : conflict
            ? "The command conflicts with newer state or a prior request."
            : "The command was not completed. Verify state before retrying.",
      },
      { status: denied ? 403 : conflict ? 409 : 502 },
    );
  }

  return NextResponse.json({ ok: true, receipt: data });
}
