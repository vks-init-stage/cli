import {
  IacShareResultsFormat,
  PolicyMetadata,
} from '../../cli/commands/test/iac-local-execution/types';
import { ScanResult } from '../ecosystems/types';

export function convertIacResultToScanResult(
  iacResult: IacShareResultsFormat,
): ScanResult {
  return {
    identity: {
      type: iacResult.projectType,
      targetFile: iacResult.targetFile,
    },
    facts: [],
    findings: iacResult.violatedPolicies.map((policy: PolicyMetadata) => {
      return {
        data: { metadata: policy, docId: policy.docId },
        type: 'iacIssue',
      };
    }),
    name: iacResult.projectName,
    target: { name: iacResult.projectName },
  };
}
