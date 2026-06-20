# Telescope API → UI field mapping

This screen is the Telescope **request** watcher. Wire it to Telescope's own JSON API rather than inventing a backend.

## Endpoints (default Telescope routes)
- **List:** `GET /telescope/telescope-api/requests`
  - Body params Telescope accepts: `take` (page size), `before` (cursor — entry sequence/id to page back from), `tag` (filter by tag), `family_hash`.
  - Returns `{ entries: [...], status }`. Each `entry` has `id`, `sequence`, `created_at`, `type:"request"`, and a `content` object (the request payload).
- **Detail:** `GET /telescope/telescope-api/requests/{id}`
  - Returns the full entry plus `batch` siblings — used to pull the **queries**, **models**, **mail**, etc. recorded in the same request batch.
- **Clear all:** `DELETE /telescope/telescope-api/entries` (wire to the header trash button).

> Polling: stock Telescope polls the list endpoint every ~1s using the latest `sequence` as a cursor and prepends new entries. Reproduce this for **Live polling + Pause**.

## Row fields ← `entry.content`
| UI field | Source | Notes |
|---|---|---|
| Verb | `content.method` | GET/POST/PUT/PATCH/DELETE… |
| Path | `content.uri` | Strip host; show path (+ query). |
| Route / controller | `content.controller_action` | May be empty → render `—` (closure). |
| Status | `content.response_status` | Integer; class = `floor(status/100)+"xx"`. |
| Time | `content.duration` | Milliseconds (Telescope records ms). Format <1000→`{n}ms`, else `{s}s`. |
| SQL count | count of `query` entries in the batch | From the batch (`batch_id`) — see below. |
| Memory | `content.memory` | Telescope records MB. Render `"{n} MB"`. |
| User | `content.user` | Telescope's user resolver (id/name/email) when authenticated; else Guest. For token/service callers show the client name. |
| IP | `content.headers['x-forwarded-for']` or request IP | Telescope stores headers; fall back to remote addr. |
| When | `entry.created_at` | Render as relative time (`date-fns formatDistanceToNow`). |
| `id` | `entry.id` | Drives the detail slide-over + URL state. |

## Detail panel fields
| UI field | Source |
|---|---|
| Status / Duration / Memory | `content.response_status` / `content.duration` / `content.memory` |
| SQL queries (count) + DB time | aggregate of sibling `query` entries (count, summed `content.time`) |
| When | `entry.created_at` (absolute + relative) |
| User block | `content.user` (id, name, role); meta = Unauthenticated / Token auth / `user #{id} · {role}` |
| IP | as above |
| Request headers | `content.headers` (object → key/value rows). Filter noise as desired. |
| SQL queries list | sibling `query` entries: `content.connection` (conn name), `content.time` (ms), `content.sql` (statement, with bindings) |

### Getting the queries for a request
Telescope groups everything from one request under a shared `batch_id`. To list a request's queries:
- Use the **detail** endpoint (it returns batch siblings), **or**
- Query entries of type `query` where `batch_id = {request.batch_id}`.

Each `query` entry's `content`: `{ connection, bindings, sql, time, slow, file, line, hash }`. The panel shows `connection`, `time` (amber ≥80ms), and `sql`. You can also surface `slow` and `file:line` if useful.

## Derived values (compute client-side over the filtered set)
- **Avg** = mean of `duration`.
- **p95** = 95th percentile of sorted `duration`.
- **Errors** = count where `response_status >= 400`.
- **Per-status chip counts** = group filtered (or total) rows by status class.

## Filtering notes
The prototype filters client-side over the loaded page. For production, decide per-filter whether to filter client-side (fast, but only over loaded entries) or push to the API:
- Telescope's native filtering is limited (mainly `tag`). Free-text path/route search and status/verb/duration filters will likely be **client-side over the polled buffer**, or you extend the backend with a custom endpoint/query if you need to filter the full stored history.
- **Tags:** Telescope supports tags per entry — the search field's "tag" hint maps to `content`/entry `tags`; wire `tag=` to the list endpoint for server-side tag filtering.
