---
title: "Agent Context Is a Recommendation Problem"
publication: "Srijan Saket"
date: 2026-09-08
teaser: "Deciding what an agent sees, out of everything it could see, under a hard budget, with position effects and no explicit feedback. Recommender systems have been solving exactly this for twenty years."
dek: "Deciding what an agent should see, out of everything it could see, under a hard budget, with position effects and almost no explicit feedback. The field that has been solving that problem for twenty years is not retrieval. It is recommendation."
excerpt: "We built the retrieval system, registered the tools, wrote careful descriptions, and the agent never called them. Not once. The instinct was to write better descriptions. The correct diagnosis was that we had built a catalogue and expected it to behave like a recommendation — and the difference between those two things is most of what recommender systems research has been about since the mid-2000s."
tags: [retrieval, agents, recsys, context-engineering]
series: "Context as a ranking problem"
seriesOrder: 1
thumbnail: "/writing/agent-context-is-a-recommendation-problem/plate.svg"
socialImage: "/writing/agent-context-is-a-recommendation-problem/card.png"
featured: true
draft: true
---

We built the knowledge system. Typed claims, conflict detection, lineage back to source. We gave the agent explicit tools to query it — search, look up a definition, fetch known contradictions for an entity — registered in the tool schema with descriptions and worked examples.

The agent never called them. Not once.

So we added guidance to the prompt: *before writing SQL, check the knowledge base for known gotchas.* It still didn't call them. It kept doing what it already knew how to do — retrieve some text, skim it, query the warehouse directly, and answer.

The instinct in the room was to write better tool descriptions. That instinct is wrong, and it is wrong in an interesting way.

<div class="claim">We had built a catalogue and expected it to behave like a recommendation. Those are different systems, and the difference is most of what recommender systems research has been about since the mid-2000s.</div>

## The problem is not retrieval-shaped

Nearly everyone working on agent context describes it as a retrieval problem, and the vocabulary follows: embeddings, chunking, top-k, reranking, RAG. That framing is not wrong so much as *too small*. It describes one component and then quietly assumes the rest of the system is trivial.

Look at what actually has to be decided each turn:

- Out of everything the organisation knows, what should this agent see **right now**?
- Under a budget that is hard, small relative to the corpus, and shared with the conversation, the tools, and the task?
- Where **position within the budget changes how much the item is actually used**?
- With no explicit relevance signal, because nobody clicks anything?
- Optimising several objectives at once — coverage, token cost, latency, and not drowning the signal you did surface?

That is not a search box. That is a ranking-and-slate problem with a budget constraint, position effects, implicit feedback, and multiple objectives. Which is the standard formulation of a recommender system, taught in every survey of the field.

The reason this matters is not taxonomic. It is that the retrieval framing leads you to spend your effort on similarity, and the recommendation framing tells you that similarity was never the hard part.

## The mapping

<figure class="wide">
  <iframe src="/writing/agent-context-is-a-recommendation-problem/figures/two-views.html" title="Interactive diagram: the same two-stage pipeline labelled in recommender-systems vocabulary and in agent-context vocabulary" loading="lazy" class="fig-two-views"></iframe>
  <figcaption><b>FIG. 01</b> — One pipeline, two vocabularies. Switch the labels and the agent-context stack becomes a recommender with the ranking stage missing. Select a stage to see what each field calls it.</figcaption>
</figure>

Concretely:

<div class="table-scroll">

| Recommender systems | Agent context | What transfers |
|---|---|---|
| Candidate generation | Retrieval / vector search | Optimise for recall, cheaply, over a huge corpus. Precision is not this stage's job |
| Ranking | *Usually missing* | A second, expensive, feature-rich pass over ~hundreds of candidates. This is where recsys spends its intelligence |
| Slate construction | Prompt assembly | The set is not the sum of its items — redundancy and ordering matter |
| Position bias | Lost in the middle | Effective attention depends on where an item sits, not just whether it is present |
| Cold start | A new repo, tenant, or codebase | You must serve well before you have any interaction history |
| Multi-objective optimisation | Coverage vs. tokens vs. latency | One aggregate score hides the trade you are actually making |
| Exploration / serendipity | Surfacing the gotcha nobody asked for | The highest-value item is frequently the one the query would never have matched |
| Exposure bias | The agent only learns from what you showed it | Your logs are a record of your own past ranking decisions |

</div>

The row I want to dwell on is the empty one.

**Most agent-context systems have no ranking stage at all.** They have candidate generation — a similarity search — and then they take the top *k* and concatenate. In recommender terms, that is shipping the candidate generator straight to production and calling it a ranker. Nobody in recsys has done that since roughly 2010, because it is known to be substantially worse than a two-stage design: the cheap recall-oriented stage and the expensive precision-oriented stage want different features, different objectives, and different cost profiles, and collapsing them into one cosine distance gives you neither.

## What the field already knows

Three results that agent builders are currently rediscovering, at cost.

**Position bias is a measurement problem before it is a modelling problem.** In recommendation, the fact that top-of-list items get more engagement — regardless of quality — has been understood, measured, and corrected for since the mid-2000s, with inverse-propensity weighting and randomised exposure. The agent-context version arrived as [Lost in the Middle](https://arxiv.org/abs/2307.03172): relevant information placed in the middle of a long context receives less effective attention than the same information at either end. The correct response is not *use a bigger context window.* It is the response the recsys field already worked out: treat position as a variable you control and account for, order deliberately, and measure the effect rather than hoping it is small.

<figure>
  <img src="/writing/agent-context-is-a-recommendation-problem/figures/position-effect.svg" alt="Chart showing effective use of an item by its position in a long context: high at the start, dipping through the middle, recovering at the end — annotated with the recommender-systems analogue of position bias." width="920" height="420" loading="lazy" decoding="async" />
  <figcaption><b>FIG. 02</b> — Position is a treatment, not an accident. A ranker that ignores where an item lands is optimising a metric it cannot actually deliver.</figcaption>
</figure>

**Offline metrics and online behaviour diverge, and the gap is structural.** Every recsys team learns that an offline gain in a ranking metric routinely fails to reproduce as an online gain, because the offline evaluation is computed over logs generated by the *current* policy. Agent-context work is at the stage of trusting a retrieval metric — recall@k over a fixed question set — and being surprised when the agent's end-to-end behaviour does not improve. It is the same structural gap and it needs the same treatment: hold out an interleaved comparison, or accept that your offline number is directional at best.

**The catalogue-versus-recommendation distinction is the whole game.** This is the answer to the story I opened with. A tool in a schema is a catalogue entry: available, correctly described, and completely passive. It requires the agent to know that it wants something before it can find it. But an agent mid-task does not know what it does not know — that is the definition of tribal knowledge — so a passive catalogue can be perfectly built and still never fire.

What works is the recommendation posture: identify what the task touches, then put the relevant knowledge **in front of the agent** as context, before it starts, without waiting to be asked. The difference between a reference library and a colleague who taps you on the shoulder and says *heads up, that table has a gotcha.* Same information, entirely different hit rate, and the delta is not retrieval quality.

## What does not transfer

I want to be careful here, because a framing that explains everything explains nothing. Four places where the analogy genuinely breaks:

**There is no click.** Recsys is built on abundant implicit feedback — impressions, clicks, dwell, skips — at a volume that supports learned rankers. An agent produces one weak, delayed, expensive signal: did the task eventually succeed? Credit assignment back to a single injected claim is hard and often impossible. Most of the learning-to-rank apparatus does not apply until someone solves that, and I have not seen it solved.

**The slate is tiny and the budget is hard.** A feed can show fifty items and let the user scroll. A context window has room for a handful of claims before it starts crowding out the task itself. Small slates make redundancy far more costly and make the set-level optimisation matter much more than the item-level scores.

**There is one user, and it changes.** Personalisation assumes a stable population of users with stable preferences. Here the consumer is a model that gets replaced every few months, with different context handling, different instruction-following, and different failure modes. A ranker tuned to one model's attention profile may be actively wrong for the next.

**Errors are asymmetric in a different direction.** A bad recommendation is an annoyance; the user scrolls past. A wrong claim injected confidently into an agent's context gets *used*, and propagates into an artifact someone acts on. That asymmetry argues for precision over coverage far more strongly than a feed does, and for making uncertainty legible rather than smoothing it away.

## What I would do with this

1. **Build the second stage.** If your context pipeline is a vector search and a `top_k`, you have a candidate generator. Add a ranker over a few hundred candidates that can use features similarity cannot see: recency, source authority, how often this claim has been contradicted, whether it applies to the entities in *this* task.
2. **Treat prompt assembly as slate construction.** Deduplicate at the set level, order deliberately, and put the least-forgiving items where attention is highest. Measure whether ordering changed anything — you will be surprised at least once.
3. **Push, don't wait.** If knowledge only enters the context when the agent asks for it, it will mostly not enter. Identify the entities a task touches and inject before the first turn.
4. **Instrument exposure, not just relevance.** Log what you showed alongside what was used. Without the first, your logs teach you only about your own past ranking.
5. **Steal the evaluation discipline before the models.** Multi-objective reporting, held-out comparisons, and honest offline/online gap accounting are the transferable parts. The learned rankers can wait until you have a feedback signal worth learning from.

## What this does not prove

This is a framing argument, not an experimental result. I have not run an ablation showing that a two-stage ranker beats top-*k* concatenation on a public agent benchmark, and until someone does, the claim that ranking is the missing stage is an informed bet rather than a finding. Somebody should run it. It is a well-shaped experiment and I would like to be wrong about the size of the effect, in either direction.

I am also aware that the mapping flatters my own background. I spent about a decade building production recommenders — scaling one from a million users to two hundred million — and then moved to retrieval quality in code search and now to knowledge systems for agents. A person with that history is exactly the person who would see recommendation everywhere. Discount accordingly, and check the four places I said it breaks.

But the failure I opened with is real and it is common: a well-built, correctly-described, entirely unused knowledge system. The retrieval framing does not have a name for that failure. The recommendation framing has had one for twenty years, along with a body of work on what to do about it.

<div class="claim">Getting the right knowledge to the right agent at the right moment is not a search problem that happens to feed a model. It is a recommendation problem that happens to have a model as its user.</div>
