# Claude Code Configuration - Hitori Talk

## Project Overview

**Hitori Talk** - AI-powered Japanese conversation practice app for IT professionals

### Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Design:** Pencil.dev MCP + Lunaris style (`pencil-lunaris.pen`)
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **AI:** OpenRouter API
- **Voice:** Web Speech API (browser STT/TTS)

### Key Features
- Unified conversation mode (AI vừa chat + sửa lỗi + dịch nghĩa)
- Voice input/output with Japanese support
- Gamification (XP, Streaks, Levels, Achievements)
- IT-focused conversation topics
- Learning analytics and progress tracking

## Development Guidelines

### Code Style

**TypeScript:**
- Use strict mode
- Explicit types for function parameters and return values
- Avoid `any` type - use `unknown` if necessary
- Prefer interfaces over types for object shapes

**React:**
- Functional components with hooks
- Server Components by default, mark `'use client'` only when needed
- Named exports for components
- Props destructuring in function signature

**Naming Conventions:**
- Components: PascalCase (`MessageBubble.tsx`)
- Utilities/hooks: camelCase (`useProfile.ts`, `calculateXP.ts`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_CONVERSATION_LENGTH`)
- Database tables: snake_case (`user_achievements`)

**File Organization:**
```
components/
  ui/              # shadcn/ui components
  conversation/    # Conversation-specific components
  dashboard/       # Dashboard components
  shared/          # Shared/reusable components
```

**Styling:**
- Use Tailwind CSS utility classes
- Use `cn()` utility for conditional classes
- Component accepts `className` prop for extensibility
- Follow mobile-first approach (sm:, md:, lg:)

**Comments:**
- Có thể viết bằng tiếng Việt hoặc tiếng Anh
- Comments cho business logic phức tạp
- JSDoc for public functions/types
- Avoid obvious comments

### Git Workflow

**Branch Strategy:**
- `main`: Production branch
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

**Commit Messages:**
- Có thể tiếng Việt hoặc tiếng Anh
- Format: `<type>: <description>`
- Types: feat, fix, docs, style, refactor, test, chore
- Examples:
  - `feat: Add conversation correction mode`
  - `fix: Sửa lỗi calculation XP khi streak > 7 ngày`
  - `docs: Update API documentation`

**Pre-commit Hooks:**
- Auto-run linting, type-check, tests
- Check for sensitive data (API keys)
- Located in `.claude/hooks/pre-commit.sh`

### Testing

**Test Strategy:**
- **Unit tests:** Utilities, helpers, calculations (Vitest)
- **Integration tests:** API routes, database queries (Vitest)
- **E2E tests:** Critical user flows (Playwright)

**Coverage Goals:**
- Utilities/lib: >80%
- API routes: >70%
- Components: >60%

**Commands:**
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
pnpm test:e2e          # E2E tests
```

**Critical paths to test:**
- User authentication flow
- Conversation start → message exchange → completion
- XP/Streak calculation
- AI prompt generation

### Database

**Supabase Best Practices:**
- Always use RLS policies
- Parameterized queries (prevent SQL injection)
- Use transactions for related operations
- Index frequently queried columns

**Migration Workflow:**
```bash
supabase migration new <name>
# Edit migration file
supabase db push
```

**Common Queries:**
- Use joins instead of multiple queries
- Use `.select()` with specific columns (avoid SELECT *)
- Use `.single()` when expecting one result

### AI Integration

**OpenRouter Guidelines:**
- Always handle streaming responses
- Implement fallback models
- Monitor token usage
- Sanitize user input before sending to AI
- Set reasonable `max_tokens` limits

**Prompt Templates:**
- Stored in `lib/ai/prompts.ts` and documented in `docs/api/AI_PROMPTS.md`
- Version control prompt changes
- Test prompts before deploying (use `/ai-prompt-test` skill)

## Preferences

### Communication
- **Language:** Tiếng Việt or English (both OK)
- **Explanations:** Explain complex code changes clearly
- **Questions:** Ask for clarification on ambiguous requirements

### Automation

**Auto-approve:**
- Code formatting (Prettier)
- Linting fixes (ESLint auto-fix)
- Type imports organization

**Confirm before:**
- Database schema changes (migrations)
- Deleting files or large refactoring
- Changing AI prompts in production
- Deploying to production
- Breaking API changes

### Code Generation

**Component Generation:**
- Follow template in `.claude/prompts/component-template.md`
- Include TypeScript types
- Add accessibility features (ARIA labels, semantic HTML)
- Mobile-responsive by default

**API Routes:**
- Include error handling (try-catch)
- Validate request body/params
- Return proper HTTP status codes
- Add request/response types

**Database Queries:**
- Type-safe with Supabase client
- Include error handling
- Use `.claude/skills/db-query` skill for complex queries

## Custom Skills

### Available Skills

**`/db-query [table] [operation]`**
- Generate Supabase queries with proper error handling
- Example: `/db-query profiles select`

**`/ai-prompt-test [mode] [level]`**
- Test AI prompts before deploying
- Example: `/ai-prompt-test correction N3`

**`/pencil-design [component-name]`**
- Generate React components from `pencil-lunaris.pen` design file
- Example: `/pencil-design MessageBubble`

See `docs/guides/CLAUDE_CODE_USAGE.md` for detailed usage.

## Documentation

**Primary Docs:**
- [Product Requirements (PRD)](./docs/planning/PRD.md)
- [Technical Specification](./docs/architecture/TECHNICAL_SPEC.md)
- [System Architecture](./docs/architecture/SYSTEM_ARCHITECTURE.md)
- [AI Prompts Guide](./docs/api/AI_PROMPTS.md)
- [Development Guide](./docs/guides/DEVELOPMENT_GUIDE.md)
- [Design System](./docs/guides/DESIGN_SYSTEM.md)
- [Recommendations](./docs/RECOMMENDATIONS.md)

**When making changes:**
- Update relevant documentation
- Keep docs in sync with code
- Add examples for complex features

## Security Considerations

**Never commit:**
- API keys, secrets
- `.env` files
- Database credentials
- User data (PII)

**Always:**
- Use environment variables for secrets
- Validate user input
- Sanitize before sending to AI
- Use RLS policies
- Implement rate limiting
- Use HTTPS in production

## Performance

**Optimization priorities:**
1. API response time (<3s for AI responses)
2. Page load speed (FCP <2s)
3. Database query performance (<100ms)
4. Bundle size (<200KB initial)

**Monitoring:**
- Vercel Analytics for web vitals
- OpenRouter usage/costs
- Supabase query performance
- Error tracking (Sentry when available)

## Notes

### Current Phase: **Initial Setup & Documentation** ✅

Documentation completed:
- ✅ PRD (Product Requirements)
- ✅ Technical Specification
- ✅ System Architecture
- ✅ AI Prompts Documentation
- ✅ Development Guide
- ✅ Claude Code Skills & Hooks
- ✅ Recommendations

### Next Steps:
1. **Setup Project:** Initialize Next.js, install dependencies
2. **Setup Supabase:** Create project, run migrations
3. **Setup OpenRouter:** Get API key, test integration
4. **Implement Core Features:**
   - Authentication (Supabase Auth)
   - Conversation flow
   - AI integration
   - Voice (STT/TTS)
   - Gamification
5. **Testing & Deployment**

### Known Constraints:
- **Budget:** Optimize AI costs (<$0.10 per conversation)
- **Free tier limits:** Supabase 500MB, Vercel 100GB bandwidth
- **Browser compatibility:** STT/TTS works best on Chrome/Edge

### Future Enhancements:
- See `docs/RECOMMENDATIONS.md` for detailed suggestions
- Priority: Mobile PWA, vocabulary tracking, multiple AI personas
