# Still True?

A knowledge base about the Claude API that keeps itself honest, shown two ways.

Developer facts go stale. A model ID gets a new form, a parameter is deprecated, a
default changes, the old advice keeps ranking in search long after it stopped
working. Still True is one structured-content system that answers the question a
keyword search cannot: not "what does a source say" but "which claim is current, and
where do sources disagree".

Live:

- Board: https://still-true.vercel.app
- Grounded agent: https://still-true.vercel.app/ask
- Sanity project: `mx12urdz`, public dataset `production`

## The idea

Content lives in Sanity as three document types:

- `source` with a publisher, an authority level and a date.
- `claim`, a single factual assertion tied to its primary source.
- `claimEdge`, a typed relationship between two claims: `supports`, `contradicts` or
  `supersedes`, carrying the reason and a confidence.

That last type is the point. A reason for why two claims relate is something a
keyword search can never infer. It is what lets the system mark a fact as superseded
or flag two sources as contradictory.

## Path One: an agent that will not give you a stale answer

`/ask` is an agent that answers only from a Sanity Context Knowledge Base. The
Knowledge Base is built from real source documents that Sanity Context distils into
cited entries. When two sources assert the same fact incompatibly, Context raises a
conflict rather than guessing.

The agent reads the base through three tools over the Sanity Context client:
`list_knowledge` for the outline, `read_entries` for the cited bodies and
`list_conflicts` for the open conflicts. Its system prompt keeps it grounded, makes
it cite the entry paths it used and forces it to surface both sides when a fact is
contested. Ask it how to configure extended thinking on Opus 5 and it gives the
adaptive-thinking answer, warns that `budget_tokens` now returns a 400 and cites the
entry. Ask about `max_tokens` and it surfaces the official and community claims side
by side instead of picking one.

## Path Two: a board that shows what is settled and what is contested

`/` reads the same claim graph over GROQ and lays it out by topic. Current claims sit
above superseded ones and superseded claims are dimmed and tagged. Every
`contradicts` or `supersedes` edge is rendered as a callout with its reason. The
Studio in `studio/` models the editorial process as data with
`sanity-plugin-workflow`: a claim moves through `unverified`, `sourced` and
`confirmed`. Only an administrator can confirm it.

## Layout

| Path | What |
| --- | --- |
| `web/` | Next.js app: the board (`/`), the agent chat (`/ask`) and the agent API (`/api/ask`) |
| `agent/` | The same agent as a standalone CLI |
| `studio/` | Sanity Studio: the schema and the workflow |
| `kb-sources/` | Source documents the Knowledge Base is built from |
| `seed/` | The dataset seed (claims, sources, edges) |

## Run it

```bash
# Studio
cd studio && npm install && npm run dev

# Board + agent
cd web && npm install
cp .env.local.example .env.local   # fill in LLM + Sanity Context creds
npm run dev

# Agent on the command line
cd agent && npm install
cp .env.example .env               # fill in the same creds
npm run ask "How do I turn on extended thinking for Claude Opus 5?"
```

The agent talks to any OpenAI-compatible chat-completions gateway
(`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`) and reads the Knowledge Base with a
Sanity token that has Context read access (`SANITY_ORGANIZATION_TOKEN`).

## AI disclosure

This project was built with AI assistance (Claude, Anthropic). The design, the
verification and the decisions were the author's. The agent's answers are generated
by the configured model but grounded in the Sanity Knowledge Base. The build was
verified live: the board and the agent both run at the URLs above.

## Licence

Source-available, no derivatives. See `LICENSE`.
