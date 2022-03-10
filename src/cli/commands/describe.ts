import { MethodArgs } from '../args';
import { processCommandArgs } from './process-command-args';
import * as legacyError from '../../lib/errors/legacy-errors';
import { driftctl, parseDescribeFlags } from '../../lib/iac/drift';
import { getIacOrgSettings } from './test/iac-local-execution/org-settings/get-iac-org-settings';
import { UnsupportedEntitlementCommandError } from './test/iac-local-execution/assert-iac-options-flag';
import config from '../../lib/config';
import { findAndLoadPolicy } from '../../lib/policy';

export default async (...args: MethodArgs): Promise<any> => {
  const { options } = processCommandArgs(...args);

  // Ensure that this describe command can only be runned when using `snyk iac describe`
  // Avoid `snyk describe` direct usage
  if (options.iac != true) {
    return legacyError('describe');
  }

  // Ensure that we are allowed to run that command
  // by checking the entitlement
  const orgPublicId = options.org ?? config.org;
  const iacOrgSettings = await getIacOrgSettings(orgPublicId);
  if (!iacOrgSettings.entitlements?.iacDrift) {
    throw new UnsupportedEntitlementCommandError('drift', 'iacDrift');
  }

  // TODO make policy-path and ignore-policy flags work by inluding them in
  // DriftCtlOptions union.
  // TODO '.' probably isn't a cross-platform-friendly way to pass CWD. Really,
  // we should probably take the parent dir of --from, defaulting to CWD.
  const policy = await findAndLoadPolicy('.', 'iac', options);
  // TODO validate this doesn't crash with absent ignore block
  if (policy && 'SNYK-DRIFT' in policy.ignore) {
    options.ignore = driftignoreFromPolicy(policy.ignore['SNYK-DRIFT']);
  }

  try {
    const args = parseDescribeFlags(options);
    const ret = await driftctl(args);
    process.exit(ret);
  } catch (e) {
    const err = new Error('Error running `iac describe` ' + e);
    return Promise.reject(err);
  }
};

// TODO extract and test properly, this is a spike
function driftignoreFromPolicy(policyIgnorePaths: any[]): string[] {
  return policyIgnorePaths.filter((policyIgnorePath) => {
    // Why, you ask? For reasons I haven't figured out yet, a policy file with
    // this structure:
    //
    // ```yaml
    // ignore:
    //   SNYK-DRIFT:
    //     - '*'
    //     - '!aws_s3_bucket'
    // ```
    //
    // when calling policy.load, returns object whose
    // `policy.ignore['SNYK-DRIFT']` array that begins with the 2 expected
    // strings, then contains 13 additional elements, which are objects, each
    // with a single key, whose value is a letter from the string
    // "aws_s3_bucket", e.g:
    //
    // [
    //   "*",
    //   "!aws_s3_bucket",
    //   {1: "a"},
    //   {2: "w"},
    //   {3: "s"},
    //   ...
    // ]
    //
    // I will spend a bit of time trying to figure out why as this transitions
    // from spike to real code.

    return typeof policyIgnorePath === 'string';
  });
}
