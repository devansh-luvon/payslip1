<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

STACK
- Exact versions of every dependency
- Which library handles what (React Query for server state, Zustand for client state)
- What I explicitly don't use and why (no class components, no Redux, no inline styles, file naming conventations and super important stuff like global state management, api structuring and success / failure flows if stripe is needed )

CONVENTIONS
- Folder structure with examples
- Naming conventions: what's a service, a hook, a util
- Error handling pattern: always use the custom AppError class
- API response format for every endpoint

SECURITY (non-negotiable rules for every file)
- "Never store secrets in frontend code"
- "Every route requires auth middleware unless explicitly marked public"
- "Validate all inputs with Zod before any processing"
- "Never return raw DB objects — always select fields explicitly"

OUTPUT QUALITY
- "Always include error handling and edge cases"
- "Always include loading and error states"
- "Write tests for all service layer functions"
<!-- END:nextjs-agent-rules -->
