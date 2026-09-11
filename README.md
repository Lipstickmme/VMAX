# VMAX Machine Ltd

Website and API server for **VMAX Machine Ltd**, a heavy machinery dealer: new and
certified used plant, parts, field service, hire and finance. A dependency-light
Node/Express backend serves a multi-page frontend and a small JSON API that powers the
content, plus a working live-chat endpoint.

The site ships **without photography on purpose**. Every image slot names the file it
wants (`vmax1`, `vmaxhero1`, `vmaxlogo`, ...) and draws a labelled plate until that file
is dropped into `public/assets/`, so adding pictures is an upload, not an edit. See
[Images](#images).

## Stack

- **Backend:** Node.js + Express (single production dependency)
- **Frontend:** hand-written HTML / CSS / vanilla JS, assembled from shared
  partials by a tiny build step (no framework)
- **Data:** flat JSON files for content, with `src/data/machines.json` generated from `scripts/generate-machines.js`; enquiries, chat and inbound mail persisted to
  Supabase (Postgres) in production, or `data/` locally
- **Auth:** Supabase anonymous sign-in for visitors, password sign-in for staff, with
  row level security deciding what each can see
- **Notifications:** enquiries and chat messages routed to an inbox via Resend email
  and/or a webhook (Slack, Discord, help desk)
- **Inbound mail:** a signed Resend webhook archives and forwards mail sent to your domain

## Pages

| URL              | Page                                                    |
| ---------------- | ------------------------------------------------------- |
| `/`              | Landing: hero, machine classes, the range, why VMAX, services, quote form |
| `/machines`      | Sales inventory, filterable by class and by brand       |
| `/machines/:id`  | One page per machine, built at build time: specs, features, stock facts |
| `/services`      | The eight departments, each linking to its own page     |
| `/services/:id`  | One department: what it covers, what you get, which machines |
| `/careers`       | Open roles in the workshop, field service, parts and transport |
| `/apply`         | Recruitment form, with the role prefilled from the careers page |
| `/contact`       | Quote request: contact details, form and live chat      |
| `/admin`         | Sales desk: enquiries, applications, live chat and mail (staff sign-in) |
| `404`            | Styled not-found page                                   |

A live-chat widget is available on every page except the sales desk.

## The landing page

Six plates, alternating black, white and yellow, read down the page like a spec
sheet rather than a brochure. A rail on the right marks where you are and takes its
colour from the plate it is over. Reveals inside a section arrive in sequence rather
than together, and all of it stops under `prefers-reduced-motion`.

| # | Section | Carries |
| - | ------- | ------- |
| 1 | Hero | Slideshow, the two calls to action, and the yard readout |
| 2 | Categories | Every machine class, each linking to a filtered list |
| 3 | The range | Eight machine cards, built from `src/data/machines.json` |
| 4 | Why VMAX | The support case, plus counters for the numbers behind it |
| 5 | Services | The eight departments, each linking to its own page |
| 6 | Contact | The quote form itself, not a link to one |

Listings are rendered at **build time** rather than fetched, so the range, the
inventory and every spec row are in the HTML and the site reads with JavaScript
switched off. The filters on `/machines` then hide and show what is already
there, a batch at a time.

Every machine also has its **own built page** under `public/machines/<id>.html`,
served at `/machines/<id>`: indexable, instant, and readable without JavaScript.

The form in section 6 is the same component as the one on `/contact`: both post to
`/api/contact`, so both land in `enquiries` and appear on the sales desk.

## Careers and applications

The apply link on `/careers` opens `/apply` with the role already selected, and the
form posts to `/api/applications`. Applications land in the `applications` table and
appear on the sales desk under their own tab, with the same triage states as an
enquiry. A speculative application, with no role chosen, is accepted the same way; a
role that has since closed is refused with a message rather than silently accepted.

## Contact details

The studio address, email, telephone and opening hours live in
`src/data/site.json`, so the pages are built with the right values and are
correct with no JavaScript at all. The studio desk can then change them under
**Settings**, which writes to `site_settings`, and every page picks the change
up on its next load through `/api/site`. No rebuild, no deploy. Anything
carrying `data-site="email"` and friends is hydrated, including the `mailto:`
and `tel:` hrefs, and a database with no `site_settings` table simply keeps the
values the site was built with.

## Live chat

Two halves of one conversation:

- **Visitor.** The widget signs in anonymously and writes its own rows, so row level
  security grants each visitor their own thread and nothing else. Where Supabase is
  not configured or anonymous sign-ins are off, it falls back to `POST /api/chat/message`,
  where the server holds the service role. Either way the conversation persists.
- **Studio.** `/admin` lists every conversation and replies into it. The first human
  reply sets `handled_by_agent`, which takes the thread off the automatic responder so
  the canned answer never talks over a person.

## Project structure

```
.
├── server.js                 # local HTTP server + graceful shutdown
├── vercel.json               # Vercel build, clean URLs, rewrites
├── api/
│   └── [...path].js          # Vercel serverless entry (whole API in one function)
├── scripts/
│   └── build-pages.js        # assembles public/*.html from shared partials
├── docs/
│   └── DEPLOYMENT.md         # fork -> images -> Vercel -> database -> desk -> inbox
├── test/
│   ├── mock-supabase.js      # strict stand-in: PostgREST + GoTrue + the RLS rules
│   ├── api.test.js           # chat, enquiries and the schema probe (no dependencies)
│   ├── browser.test.js       # visitor and staff, end to end in Chromium
│   └── fallback.test.js      # chat with anonymous sign-ins off, and with no database
├── RECIPE.md                 # how to rebuild this stack on another site
├── supabase/
│   ├── migrations/           # 0001_init.sql, 0002_email.sql
│   └── grant-admin.sql       # one-off: make yourself an admin
├── src/
│   ├── app.js                # local Express app: pages + API + static
│   ├── api-app.js            # API-only Express app (used on Vercel)
│   ├── routes/               # API routers, mounted under /api
│   ├── controllers/          # machines, services, careers, contact, chat
│   ├── middleware/           # error handling + in-memory rate limiter
│   ├── utils/
│   │   ├── config.js         # env resolution + own-address / loop detection
│   │   ├── supabase.js       # Supabase (PostgREST) client over fetch
│   │   ├── paths.js          # where local file storage writes
│   │   ├── storage.js        # contact-enquiry persistence
│   │   ├── chatStore.js      # per-session chat persistence
│   │   ├── notify.js         # email (Resend) + webhook notifications
│   │   └── webhookSignature.js # Svix-style signature verification
│   ├── data/                 # machines / services / careers / images
│   └── site/                 # build-time page source (layout, pages, images, icons, media)
├── public/                   # served frontend (HTML generated by the build)
│   ├── css/                  # styles.css (site) + admin.css (sales desk)
│   ├── js/                   # main, icons + media (generated), chat, admin, per-page
│   └── assets/               # img/ and brand/: empty, with a README naming every file
└── data/                     # local runtime storage (git-ignored)
```

## API

| Method | Route                     | Description                                   |
| ------ | ------------------------- | --------------------------------------------- |
| GET    | `/api/health`             | Which config the server sees, plus warnings   |
| GET    | `/api/health?probe=1`     | The same, plus one read of every column the server uses |
| GET    | `/api/public-config`      | Supabase URL + anon key for the browser       |
| GET    | `/api/services`           | List departments                              |
| GET    | `/api/machines?category=&condition=` | Machine listing, optional filters  |
| GET    | `/api/machines/:id`       | Single machine + the next machine             |
| GET    | `/api/careers?team=`      | Open roles, optional team filter              |
| POST   | `/api/contact`            | Submit an enquiry (validated + rate-limited)  |
| GET    | `/api/site`               | The company contact details, editable from the desk |
| POST   | `/api/applications`       | Submit a job application (validated + rate-limited) |
| POST   | `/api/chat/message`       | Send a chat message, get an auto-reply (fallback path) |
| POST   | `/api/chat/notify`        | Flag a browser-written message and post the holding reply |
| GET    | `/api/chat/:sessionId`    | Fetch a chat conversation                     |
| POST   | `/api/inbound/resend`     | Signed inbound-email webhook (archive + forward) |

`POST /api/contact` accepts `{ name, email, company?, service?, message, website? }`
(`website` is a honeypot); it returns `201`, `422` with a `fields` map, or `429`.

`POST /api/chat/message` accepts `{ sessionId, text }`, stores the message and a reply,
and returns both. `POST /api/chat/notify` is its companion for conversations the browser
writes itself: the message is already in the database, so it only raises the flag by
email and posts the holding reply. The responder in `src/controllers/chatController.js`
is rule-based and stands down the moment a person answers from `/admin`; it is the seam
where a third-party desk would take over instead.

## Getting started

```bash
npm install
cp .env.example .env   # optional: adjust PORT, rate limits, notify email
npm run gen:machines   # rebuild src/data/machines.json from the class templates
npm run gen:favicon    # redraw the V favicon in every size
npm run build          # generate public/*.html from src/site (also runs on start)
npm start              # http://localhost:3000
npm run dev            # build + watch mode
npm test               # API, chat and schema checks against a mock Supabase
```

`npm test` needs nothing beyond Node: `test/mock-supabase.js` stands in for PostgREST,
GoTrue and the row level security rules, and rejects a column that is not in the
schema, so code and migrations cannot drift apart unnoticed.

The end-to-end suites drive a real browser and need Playwright's Chromium:

```bash
npm install --no-save playwright-core   # plus a Chromium build
npm run test:browser                    # CHROME_PATH=... if it is not on the default path
```

## Frontend notes

- Pages share one layout (`src/site/layout.js`) rendered to static HTML at build
  time, so the nav, footer and chat widget stay consistent with no client-side flash.
- **Three colours and nothing else:** safety yellow, black and white. Sections are
  flat plates rather than cards floating over photography, edges are square, and
  type is set large and heavy (Archivo for headings, Barlow for text, IBM Plex Mono
  for spec labels and readouts).
- **Every card is a rectangle.** On a desktop grid a machine card stands up, with
  the photograph on top and four spec rows beneath it; on a phone it lies down,
  picture to the left and the specs in a two-up block.
- **Two icon sets ship, and CSS picks one.** `src/site/icons.js` draws each icon
  twice: a fine line version for tablet width and up, and a heavier, simpler,
  filled version for phones, where a 1.4px hairline is not really there. Both are
  in the markup, so switching between them costs no request and no layout shift.
- The icon set and the image placeholder are written out to `public/js/icons.js`
  and `public/js/media.js` by the build, so a card drawn in the browser is
  identical to one drawn at build time and the two cannot drift.
- The home hero runs a photographic slideshow with clickable indicators; motion
  drops under `prefers-reduced-motion`.
- Headings reveal with transform and opacity, never a `clip-path` wipe: clipping a
  heading to nothing leaves it with no rendered area, and IntersectionObserver then
  never reports it visible, so the reveal never fires. A browser test asserts every
  `[data-reveal]` on the landing page ends up visible.

## Deploying

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for the full walkthrough: replacing the
placeholder imagery, forking, deploying to Vercel, connecting a free Supabase database,
and routing enquiries and chat to your inbox.

The repo is Vercel-ready: `vercel.json` builds the static pages into `public/` and
`api/[...path].js` runs the Express API as a single serverless function.

## Notifications

Contact enquiries and live-chat messages are both routed to a human inbox by
`src/utils/notify.js`. Two independent channels, each a no-op until configured:

- **Email** via [Resend](https://resend.com): set `RESEND_API_KEY`, `FORM_TO` and `FORM_FROM`.
  Enquiry mail sets `reply_to` to the sender so replies reach the client directly.
- **Webhook** for a desk provider: set `NOTIFY_WEBHOOK_URL` (Slack, Discord, Zapier, help desk).

Inbound mail is handled by `POST /api/inbound/resend`. Requests must carry a valid
Svix-style signature (`RESEND_WEBHOOK_SECRET`); unsigned, tampered or replayed requests
get a `401`. Verified mail addressed to `MAILBOX_ADDRESS` is filed onto a thread in
`email_threads` / `email_messages` and forwarded to `FORWARD_TO`, unless that address
(or the sender) is one of this site's own, which would loop mail back into the webhook.

Delivery is best effort and is awaited before responding, so a serverless invocation
never exits early. A notification failure is logged and never fails the visitor's
request. Set `CHAT_NOTIFY=off` to silence chat notifications while keeping enquiries.

## Storage

**Supabase** when `SUPABASE_URL` (or `VITE_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`)
and `SUPABASE_SERVICE_ROLE_KEY` are set; **local JSON files** under `DATA_DIR`
otherwise, so development works offline with no setup.

Tables are `admins`, `enquiries`, `applications`, `chat_sessions`, `chat_messages`
and, optionally, `email_threads` / `email_messages`. Create them by running
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) (and
[`0002_email.sql`](supabase/migrations/0002_email.sql)) in the Supabase SQL Editor.
Both are guarded, so re-running one after an edit updates what changed.

Row level security is on everywhere. `enquiries` has no anon policy at all: writes
arrive through `POST /api/contact` using the `service_role` key. Chat is the one thing
the browser writes directly, under the visitor's anonymous `auth.uid()`, and staff read
and answer under their own login checked against `admins`. Keep the `service_role` key
server side and never behind a `VITE_` or `NEXT_PUBLIC_` prefix, which are inlined into
browser bundles; the `anon` key is meant to be public.

`GET /api/health?probe=1` reads one row of every column the server uses and names
anything missing, which is the quickest way to catch tables built from an older copy of
a migration.

Vercel is serverless with a read-only filesystem, so production needs the database:
without it, writes go to `/tmp` and do not survive between requests.

## Images

No artwork ships with this repository. Adding it is a file drop, not a code change.

Put files in `public/assets/img/` (logos in `public/assets/brand/`) using the names
below. Any of `.webp`, `.avif`, `.jpg`, `.jpeg`, `.png` works, names are matched
without regard to case, and `.webp` wins when both a PNG and a WebP of the same name
are present, so adding an optimised copy beside a heavy original is enough to serve it.

| Files | Where they appear |
| ----- | ----------------- |
| `vmax-<brand>-<model>` | One per machine, e.g. `vmax-caterpillar-320-gc` |
| `vmax-<class>` | The class fallback, e.g. `vmax-excavators`, used until a machine has its own |
| `vmaxhero1` ... `vmaxhero3` | The home hero slideshow |
| `vmaxfleet`, `vmaxyard`, `vmaxworkshop`, `vmaxparts`, `vmaxcontact` | Section artwork |
| `vmaxmachines`, `vmaxcareers` | Page headers |
| `vmaxlogo` (light), `vmaxlogo-black` (dark) | Wordmark, in `public/assets/brand/` |
| `favicon.svg`, `favicon.png`, `favicon.ico`, `apple-touch-icon.png` | Drawn by `npm run gen:favicon`: the V mark. Replace only if you want a different icon. |

Until a file is there the page draws a **labelled plate** carrying the name it wants,
hazard-striped and holding the exact box the photograph will occupy, so an outstanding
upload reads as outstanding rather than as a broken page, and nothing reflows when the
picture lands. The wordmark is the same idea: typeset until `vmaxlogo` exists.

`src/data/images.json` holds the mapping, `src/site/images.js` resolves it, and the
build prints both what it picked up and what it is still waiting for:

```
[build] awaiting 12 image(s) in public/assets: vmaxlogo, vmaxlogo-black, vmaxfleet, ...
```

`public/assets/img/README.txt` lists the same names beside the machine each one belongs
to, so the folder explains itself to whoever is doing the uploading.

## Configuration

| Variable                | Default | Purpose                                     |
| ----------------------- | ------- | ------------------------------------------- |
| `PORT`                  | `3000`  | HTTP port                                   |
| `NODE_ENV`              | none    | `production` tightens error output          |
| `CONTACT_NOTIFY_EMAIL`  | none    | Integration point for enquiry notifications |
| `RATE_LIMIT_WINDOW_MS`  | `60000` | Rate-limit window                           |
| `RATE_LIMIT_MAX`        | `30`    | Max requests per window per IP              |
| `SUPABASE_URL`          | none    | Supabase project URL                        |
| `SUPABASE_ANON_KEY`     | none    | Public key handed to the browser for chat and `/admin` |
| `SUPABASE_SERVICE_ROLE_KEY` | none | Secret key, server side only                |
