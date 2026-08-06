import { z } from 'zod';

const MetaWebhookSchema = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({
            metadata: z.object({
              phone_number_id: z.string().min(1),
            }),
            contacts: z.array(
              z.object({
                wa_id: z.string().min(1),
                profile: z.object({
                  name: z.string().min(1),
                }),
              }),
            ).min(1),
            messages: z.array(
              z.object({
                id: z.string().min(1),
                from: z.string().min(1),
                timestamp: z.string().min(1),
                type: z.literal('text'),
                text: z.object({
                  body: z.string().min(1),
                }),
              }),
            ).min(1),
          }),
        }),
      ).min(1),
    }),
  ).min(1),
});

export interface MetaTextMessage {
  readonly eventId: string;
  readonly phoneNumberId: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly body: string;
  readonly timestamp: string;
}
export class InvalidMetaWebhookError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid Meta webhook payload: ${issues.join('; ')}`);
    this.name = 'InvalidMetaWebhookError';
    this.issues = issues;
  }
}

export function parseMetaTextMessage(rawBody: string | Buffer): MetaTextMessage {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody.toString());
  } catch {
    throw new InvalidMetaWebhookError(['Payload is not valid JSON']);
  }

  const parsed = MetaWebhookSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new InvalidMetaWebhookError(
      parsed.error.issues.map((issue) => issue.message),
    );
  }

  const value = parsed.data.entry[0]!.changes[0]!.value;
  const contact = value.contacts[0]!;
  const message = value.messages[0]!;

  return Object.freeze({
    eventId: message.id,
    phoneNumberId: value.metadata.phone_number_id,
    contactName: contact.profile.name,
    contactPhone: message.from,
    body: message.text.body,
    timestamp: message.timestamp,
  });
}
