import {
  loadClientOneEvidence,
  type ClientOneEvidence,
} from '@/lib/evidence-metrics';

export interface ClientOneEvidenceProvider {
  load(): Promise<ClientOneEvidence>;
}
export type ClientOneEvidenceLoader = () => Promise<ClientOneEvidence>;

export function createClientOneEvidenceProvider(
  loader: ClientOneEvidenceLoader = loadClientOneEvidence,
): ClientOneEvidenceProvider {
  return Object.freeze({
    load: loader,
  });
}
