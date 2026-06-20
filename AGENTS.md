# Repository Guidelines

## Project Structure & Module Organization

Konbato is a Next.js App Router project. Route files live in `app/`, with tool pages under `app/tools/*/page.tsx` and web workers in `app/workers/`. Shared components live in `components/`; shadcn primitives are in `components/ui/`, while homepage sections are in `components/sections/`. Shared utilities and hooks live in `lib/`. Static assets live in `public/`. Playwright tests and fixtures live in `tests/`.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies.
- `pnpm dev` starts the Next.js dev server with webpack at `http://localhost:3000`.
- `pnpm build` creates a production build.
- `pnpm start` serves the production build.
- `pnpm lint` runs ESLint with Next.js and TypeScript rules.
- `pnpm exec playwright test` runs Playwright; the config starts the dev server automatically.

## Coding Style & Naming Conventions

Write TypeScript and React function components. Use PascalCase for component exports, camelCase for functions and variables, and kebab-case for route directories such as `app/tools/pdf-merge`. Prefer existing Tailwind/shadcn patterns and the `cn` helper from `lib/utils.ts`. Keep client-only browser APIs inside client components or hooks. When generating UI, ensure it is responsive across mobile and desktop viewports.

## Testing Guidelines

End-to-end tests use Playwright and live in `tests/*.spec.ts`. Name specs after the behavior or tool, for example `image-tools.spec.ts`. Keep fixtures in `tests/files/` or `tests/images/`. Run `pnpm exec playwright test` before merging tool changes; inspect `playwright-report/` for failures.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit-style subjects, for example `feat(tools): add more image and PDF utility tools` and `test: add Playwright tool coverage`. Keep subjects imperative and scoped when useful: `feat(pdf-tools): ...`, `fix(image-tools): ...`, `chore: ...`.

Pull requests should include a short summary, testing performed, linked issues when applicable, and screenshots or recordings for visible UI changes. Mention worker, dependency, or fixture changes that affect browser behavior.

## Agent-Specific Instructions

Use the relevant local skill before specialized work: `next-best-practices` for Next.js routing, metadata, server/client boundaries, async APIs, and route handlers; `vercel-react-best-practices` for React performance, data fetching, bundle size, and rerenders; `frontend-design` when creating or reshaping visual direction; `shadcn` when adding, updating, debugging, or composing shadcn components; and `playwright-best-practices` when writing, debugging, or refactoring Playwright tests, including responsive and flaky-test work. For shadcn work, check installed components and docs first.

## Security & Configuration Tips

Do not commit build output, reports, or secrets. Keep browser-heavy processing in workers where practical, and treat uploaded files as untrusted input.
