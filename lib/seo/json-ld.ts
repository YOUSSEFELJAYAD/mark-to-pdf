/**
 * Serialize JSON-LD data for safe inclusion as text content
 * inside a <script type="application/ld+json"> element.
 *
 * Replaces every "<" with the JSON escape "<" so that:
 *  - React won't try to escape the angle bracket when rendering as text
 *    (it would break JSON-LD parsing)
 *  - Any "</script>" sequence in the stringified data becomes inert
 *    (a script tag cannot be terminated by an escaped < sequence)
 *
 * This is the recommended pattern (Mozilla, OWASP) for inline JSON
 * blocks and is more secure than React's standard HTML-injection prop.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
