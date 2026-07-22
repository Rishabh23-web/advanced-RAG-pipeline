/**
 * Output Guardrails
 * Strips out sensitive backend information before sending to the client.
 */
export function checkOutputGuardrails(responseString) {
  let sanitized = responseString;

  // Example: Remove any accidental internal IDs or system prompts that leaked
  sanitized = sanitized.replace(/id3rs_[\w\d]+/g, '[REDACTED_INTERNAL_ID]');
  
  // Example: General safety check (e.g., if the model started spewing harmful content)
  const blocklist = ['classified_internal_secret'];
  for (const word of blocklist) {
    if (sanitized.toLowerCase().includes(word)) {
      return "This response was blocked by output security policies.";
    }
  }

  return sanitized;
}
