# 0.7.5 (18-10-2026)
## Fixes
- Browsers now always get the right JavaScript bundle

# 0.7.4 (18-10-2026)
## Fixes
- Going back from an event reliably scrolls to it again, also for events in the Ongoing section
- Going back to a venue, tag or collection page returns to where you were on it

# 0.7.3 (18-10-2026)
## Improvements
- Faster home page: events load 50 at a time as you scroll, instead of all upcoming events at once
- The calendar only loads the dates of the months on screen
- Going back from an event returns to the same calendar day or month and scrolls to the event
- New `light=true` option for `/api/events`, returning only event ids and dates

# 0.7.2 (18-10-2026)
## Fixes
- Much faster event, tag, place and collection pages: they no longer load the full list of upcoming events

## Improvements
- RSS and ICS feeds are cached for 30 seconds

# 0.7.1 (18-10-2026)
## Fixes
- Federation requests to unresponsive servers time out after 15 seconds instead of hanging
- SQL queries are no longer all written to the log, which slowed down every request

## Improvements
- The log warns about server stalls and database queries taking longer than 1 second

# 0.7.0 (24-08-2026)
## Improvements
- Multi-day events (exhibitions, festivals) that have already started move to a collapsible `Ongoing` section and show
  when they end (`Until Sunday, Aug 31`) instead of a start time in the past. Also on venue and collection pages.
  Events lasting 48 hours or more count as multi-day

## Fixes
- Venue pages no longer list ongoing events under `Past events`
- Multi-venue events no longer show a timezone suffix, and RSS/ICS say `Multiple Locations` instead of `online`

# 0.6.13 (10-07-2026)
## Fixes
- Fixed intermittent 502 errors and slow responses under load

# 0.6.12 (05-05-2026)
## Fixes
- Fixed missing background on dialogs and menus

# 0.6.11 (04-05-2026)
## Changes
- `Online` events are now called `Multiple locations` events (display only, stored data is unchanged)

# 0.6.10 (28-04-2026)
## Fixes
- Fixed server-side API calls going through nginx instead of straight to the app

# 0.6.9 (27-04-2026)
## Improvements
- Better accessibility (labels, default color contrast)

# 0.6.8 (26-04-2026)
## Fixes
- Fix memory leaks
  - `express.static()` was instantiated on every request for logo, favicon, fallback image and header image
  - `rateLimit()` was called inside the request handler creating a new instance per API call -- rate limiting was also 
    effectively broken as each request started with a fresh counter
- Fix `express-rate-limit` errors
  - set `trust proxy` to `1` instead of `true` -- `true` trusts all `X-Forwarded-For` headers, letting any client spoof
    their IP and bypass rate limiting
  - eagerly load server middleware at startup so rate limiters initialise outside request context

## Changes
- Align with Gancio `1.28.2`
[1.28.1](https://framagit.org/les/gancio/compare/v1.28.0...v1.28.1)
[1.28.2](https://framagit.org/les/gancio/compare/v1.28.1...v1.28.2)

# 0.6.7 (19-07-2025)
## Improvement
- Restore scroll position when going back to home page [#17](https://github.com/tboye/offbeat.amsterdam/pull/17)

# 0.6.6 (17-07-2025)
## Fix
- Fix hydration issue breaking info/ticket panel [#16](https://github.com/tboye/offbeat.amsterdam/pull/16)

# 0.6.5 (14-07-2025)
## Fix
- Fix structured event data is inconsistent between event page and event cards [#15](https://github.com/tboye/offbeat.amsterdam/pull/15)

# 0.6.4 (13-07-2025)
## Fix
- Fix non-JSON-LD event entry is still present

# 0.6.3 (13-07-2025)
## Improvements
- Use JSON-LD for structured event data, increase field coverage [#14](https://github.com/tboye/offbeat.amsterdam/pull/14)
- Bump number of tags displayed on the home page to 10 [#14](https://github.com/tboye/offbeat.amsterdam/pull/14)

# 0.6.2 (16-06-2025)
## Changes
- Use 'agenda' in place page title

# 0.6.1 (10-06-2025)
## New Features
- Include external footer links into sitemap [#13](https://github.com/tboye/offbeat.amsterdam/pull/13)

# 0.6.0 (06-06-2025)
## Changes
- Removed footer, rearranged navbar, squeezed title on mobile [#11](https://github.com/tboye/offbeat.amsterdam/pull/11)
- `events` API method doesn't require admin rights anymore [#12](https://github.com/tboye/offbeat.amsterdam/pull/12)
- Places are included in the sitemap [#12](https://github.com/tboye/offbeat.amsterdam/pull/12)

## Fix
- Fix sitemap not generating due to stale status, set sitemap cache time to 10 minutes

# 0.5.0 (05-06-2025)
## Improvements
- Align look of custom pages and About page [#9](https://github.com/tboye/offbeat.amsterdam/pull/9)
- Adjust page titles [#10](https://github.com/tboye/offbeat.amsterdam/pull/10)

# 0.4.0 (25-05-2025)
## Fix
- Fix word break style in title

## Changes
- Align with Gancio `1.26.1`
[1.25.1](https://framagit.org/les/gancio/compare/v1.25.0...v1.25.1)
[1.26.0](https://framagit.org/les/gancio/compare/v1.25.1...v1.26.0)
[1.26.1](https://framagit.org/les/gancio/compare/v1.26.0...v1.26.1)

# 0.3.2 (23-04-2025)
## Fix
- Style title via CSS rather than text to prevent SEO issues

# 0.3.1 (22-03-2025)
## Changes
- Show link to source in footer as `vX.X.X`

# 0.3.0 (22-03-2025)
- Align with Gancio `1.25.0`
[1.24.4](https://framagit.org/les/gancio/compare/v1.24.3...v1.24.4)
[1.25.0](https://framagit.org/les/gancio/compare/v1.24.4...v1.25.0)

# 0.2.0 (10-03-2025)
- Align with Gancio `1.24.3`
[1.24.0](https://framagit.org/les/gancio/compare/v1.23.1...v1.24.0)
[1.24.1](https://framagit.org/les/gancio/compare/v1.24.0...v1.24.1)
[1.24.2](https://framagit.org/les/gancio/compare/v1.24.1...v1.24.2)
[1.24.3](https://framagit.org/les/gancio/compare/v1.24.2...v1.24.3)

# 0.1.2 (14-02-2025)
## Fixes
- Fix sitemap: show all events (with weekly freq) and last mod date, root page as daily + exclude unwanted routes
[#8](https://github.com/tboye/offbeat.amsterdam/pull/8)

# 0.1.1 (10-02-2025)
## Improvements
- Improve text display on About page (larger text size and better alignment)
- Set Monday as first day of the week in the calendar
- Beautify header gradients

# 0.1.0 (08-02-2025)
## Initial version
- Based off [Gancio 1.23.1](https://framagit.org/les/gancio/compare/v1.23.0...v1.23.1) 

## Fixes
- Fix `dialectOptions` are not respected [#4](https://github.com/tboye/offbeat.amsterdam/pull/4)

## Changes
- API rate limits won't be applied to admins [#5](https://github.com/tboye/offbeat.amsterdam/pull/5)
- Refine core visual elements [#6](https://github.com/tboye/offbeat.amsterdam/pull/6)

## Internal
- Add minimalistic pipeline to build and publish on GitHub release [#7](https://github.com/tboye/offbeat.amsterdam/pull/7)
