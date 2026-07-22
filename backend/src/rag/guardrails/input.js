/**
 * Simple Input Guardrails
 * Checks for obvious PII (emails, phone numbers) and blocked competitor names.
 * In a production system, this could be backed by a specialized LLM call or advanced regex library.
 */

const BLOCKED_TERMS = ['competitor_a', 'competitor_b', 'hack', 'ignore all previous instructions'];
const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.\w+/;
const PHONE_REGEX = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;

export function checkInputGuardrails(query) {
  const lowerQuery = query.toLowerCase();

  // 1. Policy & Competitor Check
  for (const term of BLOCKED_TERMS) {
    if (lowerQuery.includes(term)) {
      return { 
        isValid: false, 
        reason: `Query blocked due to policy violation or restricted terms.` 
      };
    }
  }

  // 2. PII Detection (Basic)
  if (EMAIL_REGEX.test(query) || PHONE_REGEX.test(query)) {
    return {
      isValid: false,
      reason: `Query blocked. Please do not include Personal Identifiable Information (PII) like emails or phone numbers.`
    };
  }

  return { isValid: true };
}
