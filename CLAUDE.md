This file defines non-negotiable rules and working conventions for this project.\
All instructions here must be followed strictly.\
\
---\
\

## Project\

\
Always use Antigravity to edit code.
Always run npm run test after all edits are finished.
Nina \
Tech stack: Next.js (App Router) + Tailwind CSS\
\
---\
\

## Environment Assumptions (Important)\

\

- The local NPM / Node environment is already running.\
- Do NOT ask whether the dev server is running.\
- Do NOT suggest starting, installing, or re-running npm unless explicitly asked.\
- Assume dependencies are installed and the project builds successfully.\
  \
  ---\
  \

## Mandatory Workflow Rule\

\
**Before making any code changes or writing any implementation:**\
\

1. First respond with a clear **Implementation Plan**, including:\
   - What files will be touched\
   - What will change in each file\
   - Why each change is necessary\
2. Wait for explicit confirmation before proceeding.\
   \
   No code, diffs, or edits should be produced before approval.\
   \
   ---\
   \

## Non-negotiable Rules\

\

- Do NOT refactor unrelated components.\
- ONLY change files that are explicitly requested.\
- Do NOT remove UI elements unless explicitly asked.\
- Do NOT change section heights to fixed pixel values unless explicitly requested.\
- Always match Figma specs exactly:\
  - typography\
  - spacing\
  - alignment\
  - colors\
- Prefer minimal diffs.\
- Avoid redesigning, restructuring, or \'93improving\'94 unless explicitly requested.\
  \
  ---\
  \

### Max Width Containers\

\

- Use `max-w-[1440px]` where specified\
- Use `max-w-[1280px]` for content wrappers where specified\
  \
  ---\
  \

## Styling Conventions\

\

- Use Tailwind utility classes as the primary styling method.\
- Use `globals.css` ONLY for:\
  - Custom element styling\
  - Third-party embeds (e.g. Cloudflare Stream)\
- Do NOT move Tailwind styles into CSS unless explicitly asked.\
  \

## Video Background Pattern\

\

- Backgrounds must crop, not shrink.\
- Prefer Cloudflare Stream `<stream>` element when possible.\
- Background structure requirements:\
  - `position: absolute`\
  - `inset-0`\
  - `overflow-hidden`\
- Layer order:\
  1. Video\
  2. Overlay (above video)\
  3. Content (above overlay)\
     \
     ---\
     \

## Output Requirements\

\

- Always provide:\
  - Updated code snippets\
  - A list of files changed\
- Verify and consider responsiveness:\
  - Desktop\
  - Narrow / mobile viewport\
- Do NOT include speculative changes or optional enhancements unless asked.\
  \
  ***
