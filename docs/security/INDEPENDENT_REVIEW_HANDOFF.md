# Independent Security Review Handoff

This document is a handoff template. Completion by the implementation author or an AI assistant does **not** satisfy the independent-review gate.

## Reviewer scope

- Validate `user_metadata` cannot grant `admin` or `dev`.
- Validate owner/operator/viewer permissions through both API routes and direct Supabase clients.
- Execute Business A → Business B read, insert, update, and delete denial tests.
- Exercise rate-limit concurrency and verify 429 plus fail-closed behavior.
- Replay the same signed webhook concurrently and verify one persisted inbound message.
- Preview and execute retention deletion only against a reviewer-created synthetic business; verify cascade and immutable receipt.
- Review secret storage, provider rotation timestamps, logging redaction, and migration ordering.

## Reviewer decision

- Reviewer name/organization:
- Independence/conflict statement:
- Commit SHA reviewed:
- Staging deployment ID:
- Production deployment ID:
- Critical findings open:
- High findings open:
- Decision: `GO` / `NO-GO`
- Signed date:
- Report location (private data room):

The signed report belongs in the private data room. Only a redacted decision summary may be linked from the public repository.
