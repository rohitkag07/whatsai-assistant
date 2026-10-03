# Pilot evidence storage structure

Copy `_template` to a private, access-controlled location using a pseudonymous pilot ID such as `pilot-001`. This Git repository contains only structure and blank templates. Do not commit customer names, phone numbers, message bodies, credentials, signatures, provider IDs, tenant IDs or raw exports.

```text
pilot-001/
  00-governance/       signed private agreements and approval references
  01-baseline/         baseline contract, aggregate exports and query manifest
  02-weekly-reviews/   dated weekly review and change records
  03-security/         private test matrix, findings and retest references
  04-final-results/    frozen aggregate result and sign-off
  05-public-approved/  separately approved anonymized artifacts only
  EVIDENCE_MANIFEST.md
```

Rules:

- Use a private store with least-privilege access; Git paths are not the evidence system of record.
- Store hashes/references in the manifest instead of copying sensitive artifacts into reports.
- Record artifact owner, environment, collection time, retention class and publication approval.
- Strip metadata and perform privacy review before placing anything in `05-public-approved`.
- An empty folder or blank template is not evidence that a control passed or a pilot occurred.
