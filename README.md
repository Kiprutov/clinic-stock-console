# Clinic Stock Console

An internal console for a clinic's supplies team to search, filter and update stock counts against the product catalogue. It is designed for use on ward tablets where Wi-Fi can be unreliable, users switch between keyboard and touch. Team members often share links to specific items through chat.

Built using [DummyJSON](https://dummyjson.com/docs) as the product catalogue. The main focus was on building a practical, reliable workflow.

---

## 🚀 Quick Start

### Prerequisites & Tech Stack
- **Node.js**: `>= 22.18.0` (or `v20+`) & `npm`
- **Core Tech**: Vue 3, TypeScript, Vite, Tailwind CSS v3, Vitest, ESLint, Prettier

### Project Setup
```sh
npm install
```

### Development Server
```sh
npm run dev
```

### Testing, Quality Checks & Build
```sh
npm run test:unit    # Run unit tests with Vitest
npm run type-check   # Type-check Vue & TS files
npm run lint         # Run ESLint with auto-fix
npm run format       # Format code with Prettier
npm run format:check # Verify code formatting
npm run build        # Production build
```

---

## Section 1 — Design

### How the screen is divided

I divided the screen into two routes, each having its own shell built around a small number of focused components, both using a shared layer of composables. Below is a visual structure for intuition that I used. I work best with visual structures when designing, so I created a diagram to help me plan the application.

![Screen division diagram — Stock list and Item detail routes, both built on shared useAuth, useProductsCache and useFetch composables](./src/assets/screen-division.svg)

**`/` — Stock list**

| Component | Responsibility |
|---|---|
| `FiltersBar` | search · category · sort |
| `ProductTable` | rows on desktop, stacked cards at tablet width |
| `Pagination` | page state, synced to the URL |

**`/items/:id` — Item detail**

| Component | Responsibility |
|---|---|
| `ProductInfo` | name · category · price · thumbnail |
| `CorrectionForm` | stock count input · save |

**Shared composables** — used by both routes and shared between them. Each route relies on the shared composables to manage the state.

| Composable | Responsibility |
|---|---|
| `useAuth` | token storage, login/logout, refresh mutex |
| `useProductsCache` | single shared product cache |
| `useFetch` | AbortController + 401 retry wrapper |

I designed the stock list to show only what is relevant to a stock decision: thumbnail, title, category, current count. The other information such as brand, price, rating and description stays on the individual product detail page. This is mostly because of the requirement to support 360px-width constraint and to ensure that the stock list fits a tablet screen.

### Where state lives

There are three types of state in this app, each with its own place. I kept them separate to avoid a lot of common issues with state management in larger applications.

- **Server state** - products, categories and the logged-in user are handled by `useProductsCache` and `useAuth`. This data comes from an external source ( DummyJSON for now), can become stale and may be needed by multiple components.
- **URL state** - search term, category, sort and page are stored directly in the route's query string. They are not copied into component state. This is important because the url is the source of truth. If someone refreshes the page or opens a link shared by colleague they should be able to see the exact same view.
- **Local UI state** - Here lives the temporary things such as the text being currently typed in the search box or a "saving…" indicator that stays inside the component. This state does not need to survive a refresh and cannot be shared therefore no reason to put it in the URL or shared cache.

These three types of state interact in the search box. while the user is typing, the value is local state and once the user stops typing, it is written to the URL using a debounced `router.replace` rather than `push`. Using `push` would create a browser history entry as we type making the back button frustrating to use. The input box also needs to update when the URL changes from somewhere else like a colleague sharing a link or if the user hits the back button. Keeping this two way sync is important for a good user experience. Otherwise the search box can show one value while the app is actually searching for another.

### Fetching, caching, invalidation

I avoided Pinia and vue-query and used a few small composables instead. The shared state is simple enough and mainly contains an auth token, product cache and refresh state. Adding a larger state management library would add more complexity than value.

All API requests go through a single `useFetch` wrapper. It handles:

- **Request cancellation** - Uses `AbortController` to cancel an older request when a newer one from the same source starts.
- **Token refresh** - Handles 401 responses in a central point. A shared `refreshPromise` prevents multiple components from triggering separate refresh requests at the same time. After successful refresh, the original request is retried once. If the refresh token has also expired, the user is logged out instead of entering a retry loop.

`useProductsCache` holds the product list as a single shared ref. After a successful stock update, the returned value from the `PUT` response is applied directly to the cache instead of triggering another fetch. This keeps the UI up to date immediately and avoids unnecessary network requests.

### Layout and styling

I used Tailwindcss with utility classes directly than trying to create a custom design token layer. I felt it could be much effort in respect to the timelines given so I kept this implementation simple and fast. If the app grows I would consider introducing a small semantic palette such as `primary`, `danger` and `surface` to keep colors consistent across components.
The product table uses alternating row stripes based on the position of the rows currently being rendered. This is important because filtering and pagination change which rows are visible. If I used old or global index this can result in incorrect striping after the list changes.

### Accessibility

I focused on the accessibility requirements that are actually part of the tasks, such as full keyboard operability and readability at 360px. I skipped full screen reader support with ARIA live regions because it was not a requirement and could be a lot of work to implement properly within the timelines given.

**Keyboard:**
- All interactive elements including filters, sorting, save buttons and links work with Tab, Enter and Space keys.
- Every focusable element has a visible `focus-visible:ring-2` focus indicator.

**Other usability considerations**
- Important states such as "low stock" and "save failed" are shown with text not color alone. This caters for situations of low color vision and judgement.
- Font sizes use `rem`, and zooming is not restricted.
- Save and error feedback is communicated through visible text changes rather than color alone.

### Decision log

**1. URL as the source of truth**\
**Rejected:** Keeping search, filters, sorting and pagination in local component state.\
**Reasons:** The requirements state that a user should be able to share the exact same view with a colleague by pasting a link and still keep the view when refreshed. This would not be possible if the state was not stored in the URL.

**2. `router.replace` for query changes and `router.push` for navigation.**\
**Rejected:** Using `router.push` for every search, filter or sort change.\
**Reasons:** Every small change would create a browser history entry, so the back button would move through previous filter states instead of navigating back normally.

**3. App-wide request cancellation with `AbortController`**\
**Rejected:** Using request sequence numbers and which could lead to ignoring stale responses.\
**Reasons:** Sequence numbers prevent outdated results from being displayed but they do not stop the old request from running and completing. AbortController cancels the unnecessary work and can be reused across the app.

**4. Shared product cache patched after updates**\
**Rejected:** Keeping separate caches per view or invalidating and refetching the list after every stock correction.\
**Reasons:** A shared cache keeps the list and detail views consistent. Since the 'PUT' response already contains the updated value, patching the cache directly avoids unnecessary network requests and keeps the UI up to date immediately.

**5. Skip refetching on an exact query revisit**\
**Rejected:** Always refetching the list on mount.\
**Reasons:** Since DummyJSON doesn't persist `PUT` writes, always refetching meant a correction would silently revert the moment you navigated back to the list. Tracking the last-fetched query and skipping a redundant fetch when it matches fixes that without needing a real backend.

**6. Share button copies to clipboard only, doesn't use the native share sheet**\
**Rejected:** Using the Web Share API where available, falling back to clipboard copy elsewhere.\
**Reasons:** I wanted one predictable behaviour on every device rather than the button doing two different things depending on what's available.

---

## Section 2 — Build

In this app sign-in gates the app before any stock data loads. The stock list is paginated against `GET /products` and is wired to `FiltersBar` for category/sort/search. Item detail lives at `/items/:id` and the correction form calls `PUT /products/{id}` and on success, it patches `useProductsCache` directly rather than triggering a refetch. Item detail also has a share button that copies the URL to the clipboard, so staff can paste a link to a specific item into chat.

**Token expiry.** Login requests a 1-minute token on purpose, as what the assessment guidelines is testing, so expiry happens during normal use rather than only in theory. When any request gets a 401, `useFetch` refreshes the token silently through a shared in-flight promise so several requests expiring around the same moment don't each trigger their own refresh call, then retries the original request once. The user only sees an interruption if the refresh itself fails (e.g. the refresh token has also expired)  and  in that case a watcher on `isAuthenticated` in `App.vue` redirects to `/login`, preserving the page they were on so they land back there after signing in again.

**Verified against the stated tested requirements.** I went through all five manually against the real app: typing fast with `?delay=2000` never showed stale results, changing category/sort never stranded me on an empty page (and an out-of-range page in the URL self-corrects), reloading and opening a copied URL both restored the exact same search/filter/sort/page, `/http/500` triggered the error state with a working retry and the whole flow is usable keyboard-only and readable at 360px.

There are 19 real tests across three files : `useFetch.spec.ts` (the refresh mutex, request cancellation, retry cap, forced logout on refresh failure), `FiltersBar.spec.ts` (URL sync, debounce, the route-sync guard flag), and `CorrectionForm.spec.ts` (the save flow and error handling). No placeholder tests. I deliberately broke the code a couple of times while building these to confirm the tests actually fail when they should, not just pass by coincidence or luck.

### Project structure

Components are grouped by which route owns them, not by generic type. `FiltersBar` and `ProductTable` live under `stock-list/`, not in one flat `components/` folder, so it's obvious at a glance what belongs to which screen. Composables sit in their own top-level folder since they're deliberately shared and route-agnostic. Test specs are colocated next to the file they cover, rather than mirrored into a separate `tests/` tree. I did this so the app can grow without a later restructure and so a spec is never more than one click from what it tests.

```
clinic-stock-console/
├── .github/
│   └── workflows/
│       └── ci.yml                    # format · lint · commitlint · test-check on every PR
├── .husky/
│   └── commit-msg                    # commitlint hook, runs locally
├── public/
│   └── favicon.ico
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/
│   │   └── index.ts                  # route guard lives here
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── StockListView.vue         # /
│   │   └── ItemDetailView.vue        # /items/:id
│   ├── components/
│   │   ├── stock-list/
│   │   │   ├── FiltersBar.vue
│   │   │   ├── FiltersBar.spec.ts
│   │   │   ├── ProductTable.vue
│   │   │   ├── ProductCard.vue       # stacked-card row, < tablet breakpoint
│   │   │   └── Pagination.vue
│   │   ├── item-detail/
│   │   │   ├── ProductInfo.vue
│   │   │   ├── CorrectionForm.vue
│   │   │   └── CorrectionForm.spec.ts
│   │   └── shared/
│   │       ├── LoadingState.vue
│   │       ├── EmptyState.vue
│   │       └── ErrorState.vue        # includes the recovery action
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useProductsCache.ts
│   │   ├── useFetch.ts               # AbortController + refresh mutex live here
│   │   └── useFetch.spec.ts          # refresh-mutex + search-race-condition tests
│   ├── types/
│   │   └── product.ts
│   ├── utils/
│   │   └── lowStock.ts               # pulled this out once ProductTable and ProductCard both needed it
│   └── assets/
│       ├── main.css                  # Tailwind entry
│       └── screen-division.svg       # layout & state architecture diagram
├── .editorconfig
├── eslint.config.js
├── .prettierrc
├── commitlint.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc                    # tells Cloudflare this is static assets, not a Worker script
├── index.html
├── package.json
└── README.md
```

**A real limitation I hit while building:** DummyJSON's `PUT /products/{id}` does not actually persist the write server-side, it just echoes back what you sent. I confirmed this both against their docs and by watching it happen. I would save a correction, navigate back to the list, and it would revert. To work around it, the stock list now skips refetching if it's revisiting the exact same search/filter/sort/page it already has cached, so a correction survives normal navigation within a session. A hard reload still goes back to the seed data, since there is genuinely nothing else I can do about that without a real backend.

## Section 3 — Deployment & CI/CD

**Live URL:** https://clinic-stock-console.kiprutovictor.workers.dev

Deployed on Cloudflare Workers (their newer unified platform, static assets mode and not classic Pages, which is what I originally set out to use before finding out Cloudflare's moved on from it). Deployment is fully owned by Cloudflare's own git integration: push to `main` deploys to production and every branch/PR gets its own preview URL automatically. I deliberately kept this separate from GitHub Actions rather than having CI also try to deploy. I did not want two different things both thinking they are in charge of shipping the app.

GitHub Actions (`.github/workflows/ci.yml`) is purely a quality gate on `main` and every PR: format check, lint, commitlint, type-check and the test suite, in that order. Any failure blocks the PR. `wrangler.jsonc` at the repo root is what tells Cloudflare to serve `dist/` as static assets with SPA fallback routing (`not_found_handling: single-page-application`) and without it, refreshing on `/items/:id` directly would result in a 404.

**Note on GitHub Actions:** CI could not run on this account due to a billing/payment-method restriction outside my control (GitHub requires a physical card; I only have access to prepaid cards). The workflow itself is complete and correctly configured with format, lint, commitlint, type-check and the test suite. All checks pass cleanly when run locally with the exact same commands the workflow uses (`npm run format:check`, `npm run lint:check`, `npm run type-check`, `npm run test`). Deployment is unaffected, since it is handled entirely by Cloudflare's own git integration, not GitHub Actions so production deploys correctly on every push to `main`.

## Section 4 — AI Reflection

**1. What I used AI for**

For design I wrote my own first version of the architecture before bringing AI in, as I had my experience with building Transcend Eye Hospital HMIS and I had a pretty good idea of what I wanted to do. Things like URL as the source of truth, the three way state split, staying away from Pinia and vue query. I used AI mostly to pressure test those choices, asking about edge cases like back button behaviour or several requests expiring at the same time. The screen division diagram was also generated from a structure I described to it.

For the build I wrote most of the code myself with autocomplete helping along the way. I would start writing a few words or lines of code and auto-complete feature was helpful in code completions and adjusted it as I went. Tests were built the same way. I decided what was worth testing and worked through the assertions, then ran them myself to make sure they actually caught real bugs.

For deployment I leaned on AI to guide me. Cloudflare hadn't changed mid build, they had already moved to a newer way of setting things up and I just wasn't sure how it worked yet, so I used AI to help me align with their current setup and work through the wrangler config and a couple of real deploy errors.

This reflection is written by me, not generated.

**2. Tools and workflow**

No spec driven framework, nothing like Superpowers or GSD or Spec Kit. I used Claude for discussion and for building out tests. I used Antigravity IDE for the initial project scaffolding. I structured the work myself, one branch per feature, one pull request per branch, discuss then build then commit for each file.

**3. Where AI genuinely improved my work**

The token refresh mutex in `useAuth.ts`. I knew I needed to refresh the token on a 401 but hadn't thought through what happens when several requests expire around the same moment, which is a real case given the assessment 1 minute token. I asked for the tradeoffs between each request refreshing on its own versus sharing one in flight refresh. Seeing it laid out made the problem obvious in a way it had not been before and the shared promise pattern is what is in the code.

**4. Where AI output was wrong and how I caught it**

Most of the wrong output came from the initial scaffolding. Antigravity set up dependencies that conflicted, `oxlint` and `eslint-plugin-oxlint` versions that did not work together and caused an ERESOLVE error on `npm install`. It also generated duplicate ESLint and Prettier config files where I already had my own. I caught these by reading the actual errors in the terminal rather than assuming the scaffold was correct, removed the conflicting packages and the duplicate configs and kept one setup for each tool.

**5. Decisions I made without AI**

Writing the actual code was mine. AI helped discuss and generate pieces but typing and shaping the implementation by hand with autocomplete was my own work throughout. The folder structure was also my own decision, I decided how to group components by route and where composables should live before any of it was scaffolded.

**6. Where I would struggle to defend part of my codebase**

The GitHub Actions workflow file. I wrote and configured it but the billing restriction on my account meant I did not get to watch it actually run end to end on GitHub, only confirmed locally that each command it calls passes on its own.

Also parts of the Cloudflare setup, `wrangler.jsonc` specifically. Cloudflare had changed the way projects get set up since I last used it, so some of the fields and commands in there came from working through their current docs with AI rather than from things I already knew well.
