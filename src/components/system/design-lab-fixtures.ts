// Synthetic examples only. Never merge with live reads or provider calls.
export const SYNTHETIC_FIXTURE = {
  provenance: "Synthetic" as const,
  business: "Northstar Studio · Synthetic",
  enquiry: "Can we discuss a renovation for our two-bedroom home next week?",
  reply:
    "We can arrange a consultation. Which area is the home in, and what time works for you?",
  note: "अगले हफ़्ते बात कर सकते हैं। Please confirm a convenient time.",
  owner: "Sample coordinator",
  source: "Example qualification policy · v1",
  steps: [
    {
      label: "Enquiry understood",
      detail: "Home renovation consultation",
      state: "verified" as const,
    },
    {
      label: "Qualification in progress",
      detail: "Location and preferred time still needed",
      state: "active" as const,
    },
    {
      label: "Human handoff",
      detail: "Owner acceptance not recorded",
      state: "human" as const,
    },
    {
      label: "Final outcome",
      detail: "No appointment confirmation or completion receipt",
      state: "unknown" as const,
    },
  ],
};
