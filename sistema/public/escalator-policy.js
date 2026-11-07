export const PARAMETER_ONLY_POLICY='parameters-only-v1';
export const parametersOnly=c=>c?.confirmationPolicy===PARAMETER_ONLY_POLICY;
export const operationallyEnabled=c=>parametersOnly(c)||c?.capacityConfirmed===true;
