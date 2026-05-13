export interface MarkdownExample {
  slug: string
  title: string
  description: string
  markdown: string
}

export const EXAMPLES: MarkdownExample[] = [
  {
    slug: "resume",
    title: "Resume",
    description: "A clean one-page developer resume in Markdown.",
    markdown: `# Jane Doe

Full-Stack Developer · jane@example.com · github.com/janedoe

## Summary

Seven years building scalable web applications in TypeScript and Go. Comfortable owning a feature from design through production. Bias toward simple, well-tested code.

## Experience

### Senior Engineer, Acme Corp · 2022–present
- Led the rewrite of the billing pipeline (4× throughput, half the bugs).
- Mentored two junior engineers.

### Engineer, Beta Inc · 2018–2022
- Built the analytics dashboard used by 50+ customers.
- Owned the on-call rotation for the data ingestion service.

## Skills

TypeScript · React · Go · PostgreSQL · Docker · AWS

## Education

BSc Computer Science, State University · 2018
`,
  },
  {
    slug: "readme",
    title: "Project README",
    description: "A typical open-source project README with installation, usage, and license sections.",
    markdown: `# Project Name

> A short, punchy description of what this project does.

## Installation

\`\`\`bash
npm install project-name
\`\`\`

## Usage

\`\`\`ts
import { doTheThing } from 'project-name'

doTheThing('hello')
\`\`\`

## Features

- Zero configuration
- Tiny bundle (3 KB gzipped)
- Strict TypeScript types

## Contributing

Pull requests welcome. For major changes, open an issue first to discuss what you'd like to change.

## License

MIT
`,
  },
  {
    slug: "spec",
    title: "Technical Spec",
    description: "A short engineering design doc template.",
    markdown: `# Project Phoenix: Migrate auth to OAuth2

## Goal

Replace our legacy session-cookie auth with OAuth2 to support third-party integrations and improve security posture.

## Non-goals

- Rewriting the user-facing login UI
- Migrating existing sessions (we'll let them expire naturally)

## Approach

1. Stand up an OAuth2 provider (Hydra) in staging
2. Add a parallel /oauth/authorize flow next to the existing /login
3. Migrate API clients one at a time
4. Sunset /login after 90 days

## Risks

- **Token leakage** — mitigated by short-lived access tokens + rotating refresh tokens
- **Latency** — adds one network hop; benchmarked at ~30ms p95

## Timeline

| Week | Milestone |
|------|-----------|
| 1    | Hydra deployed to staging |
| 2    | /oauth/authorize live behind feature flag |
| 3–6  | Migrate clients |
| 10   | Sunset /login |
`,
  },
  {
    slug: "notes",
    title: "Meeting Notes",
    description: "A simple meeting notes template with attendees, decisions, and action items.",
    markdown: `# Weekly Sync — 2026-05-13

**Attendees:** Alice, Bob, Carol, Dave

## Updates

- **Alice** finished the migration script; ready for review.
- **Bob** is blocked on a permissions issue with the staging cluster.
- **Carol** demoed the new dashboard — sign-off pending.

## Decisions

- We'll ship the migration on Friday instead of Wednesday to give QA more time.
- The dashboard goes to GA in two weeks.

## Action Items

- [ ] **Alice** — open a PR for the migration script (today)
- [ ] **Bob** — file a ticket with infra (today)
- [ ] **Carol** — collect sign-off from product (by EOW)
- [ ] **Dave** — schedule the GA launch announcement (next sync)

## Next Meeting

2026-05-20, same time.
`,
  },
]

export function getExampleBySlug(slug: string): MarkdownExample | null {
  return EXAMPLES.find((e) => e.slug === slug) ?? null
}
