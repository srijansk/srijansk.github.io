---
title: "Agent Context Is a Recommendation Problem"
publication: "Srijan Saket"
date: 2026-09-08
teaser: "Deciding what an agent sees, out of everything it could see, under a hard budget, with position effects and almost no feedback. Recommender systems have spent twenty years on a close cousin of this problem."
dek: "Deciding what an agent should see, out of everything it could see, under a hard budget, with position effects and almost no feedback. Query-driven retrieval assumes someone asks. Recommendation is the field that spent twenty years on the case where nobody does."
excerpt: "We built the knowledge system, registered the tools, wrote careful descriptions, and the agent never called them. Not once. The instinct was to write better descriptions. The better diagnosis was that we had built a catalogue and expected it to behave like a recommendation, and the difference between those two things is much of what recommender-systems research is about."
tags: [retrieval, agents, recsys, context-engineering]
series: "Context as a ranking problem"
seriesOrder: 1
thumbnail: "/writing/agent-context-is-a-recommendation-problem/plate.svg"
cover: "/writing/agent-context-is-a-recommendation-problem/figures/position-effect.svg"
socialImage: "/writing/agent-context-is-a-recommendation-problem/card.png"
featured: true
draft: false
---

We built the knowledge system. Typed claims, conflict detection, lineage back to source. We gave the agent explicit tools to query it (search, look up a definition, fetch known contradictions for an entity), registered in the tool schema with descriptions and worked examples.

The agent never called them. Not once.

So we added guidance to the prompt: *before writing SQL, check the knowledge base for known gotchas.* It still didn't call them. It kept doing what it already knew how to do: retrieve some text, skim it, query the warehouse directly, and answer. This was one task on one model, so read it as an existence proof, not a rate.

The instinct in the room was to write better tool descriptions. I think that instinct is wrong, for a reason anyone who has built a recommender will recognise.

<div class="claim">We had built a catalogue and expected it to behave like a recommendation. Those are different systems, and the difference is much of what recommender-systems research is about.</div>

## The problem is not retrieval-shaped

Nearly everyone working on agent context describes it as a retrieval problem, and the vocabulary follows: embeddings, chunking, top-k, reranking, RAG. That framing is not wrong so much as *too small*. It describes one component and assumes the rest of the system is trivial.

Look at what actually has to be decided each turn:

- Out of everything the organisation knows, what should this agent see **right now**?
- Under a budget that is hard, small relative to the corpus, and shared with the conversation, the tools, and the task?
- Where **position within the budget changes how much the item is actually used**?
- With almost no feedback: no rating, and not even a click?
- Optimising several objectives at once: coverage, token cost, latency, and not drowning the signal you did surface?

That is choosing a small, ordered slate under a budget, with position effects, weak implicit feedback and several objectives. That is a recommender system: not the textbook rating-prediction version, but the industrial one.

The framing matters because it decides where the effort goes. The retrieval framing spends it on similarity; the recommendation framing says similarity is rarely the whole problem. [Measuring an agent pipeline end to end](/writing/retrieval-is-not-delivery/) made that concrete for me: where search did find the evidence, the largest losses came after it.

## The mapping

<figure class="wide">
  <iframe src="/writing/agent-context-is-a-recommendation-problem/figures/two-views.html" title="Interactive diagram: the same two-stage pipeline labelled in recommender-systems vocabulary and in agent-context vocabulary" loading="lazy" class="fig-two-views"></iframe>
  <figcaption><b>FIG. 01</b> — One pipeline, two vocabularies. Switch the labels and the agent-context stack becomes a recommender whose ranking stage is missing or reduced to query relevance. Select a stage to see what each field calls it.</figcaption>
</figure>

Concretely:

<div class="table-scroll">

| Recommender systems | Agent context | What transfers |
|---|---|---|
| Candidate generation | Retrieval / vector search | Optimise for recall, cheaply, over a huge corpus. Precision is not this stage's job |
| Ranking | *A relevance reranker, if anything* | A second, feature-rich pass over a few hundred candidates that scores them against the task, not the query: recency, authority, contradiction history, entity overlap, redundancy with the slate. A cross-encoder is a better similarity function, not this stage |
| Slate construction | Prompt assembly | The set is not the sum of its items: redundancy and ordering matter |
| Position bias | Lost in the middle | How much an item is used depends on where it sits, not just whether it is present |
| Cold start | A new repo, tenant, or codebase | You must serve well before you have any interaction history |
| Multi-objective optimisation | Coverage vs. tokens vs. latency | One aggregate score hides the trade you are actually making |
| Proactive (zero-query) recommendation | Surfacing the gotcha nobody asked for | The highest-value item is often one no query would have matched, so it must be selected from the task, not retrieved by the query |
| Exposure bias | The system only learns about what it chose to show | Your logs are a record of your own past ranking decisions |

</div>

The row I want to dwell on is ranking.

**In the agent-context stacks I have seen, the ranking stage is missing or reduced to a reranker.** The careful ones retrieve a few hundred candidates and rescore them with a cross-encoder before taking the top *k*. That is a real improvement, and it is still a relevance function: a more expensive answer to the same question, *how well does this passage match this query?* A recommender's ranking stage answers a different one: *given this task, this moment and what is already on the slate, what should be shown, and where?* It scores against the task rather than the query string, with features no query–passage model sees (recency, source authority, contradiction history, overlap with the entities this task touches, redundancy with what is already in the prompt), and it is tuned on the downstream outcome rather than on relevance labels. And when the agent never issues the query, as in the story I opened with, a reranker has nothing to rerank. In recommender terms, those stacks ship a better candidate generator and call it a ranker.

Production recommenders settled the two-stage question long enough ago that YouTube's 2016 architecture paper could describe its split into candidate generation and ranking as [the classic two-stage information retrieval dichotomy](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/). The reason is not fashion: a cheap stage over a huge corpus and an expensive stage over a short list want different features, different objectives, and different cost profiles, and collapsing them into one similarity score gives you neither.

## What the field already knows

Three results that agent builders are rediscovering, at cost. Most of this machinery was born in web search; recommendation is where it was pushed furthest from the query.

**Position bias is a measurement problem before it is a modelling problem.** In web search, the fact that top-ranked results draw more clicks than their relevance alone would earn, because users trust the ranking, was [measured with eye-tracking in 2005](https://www.cs.cornell.edu/people/tj/publications/joachims_etal_05a.pdf), and ranking research has been correcting for it since: first by randomising exposure, later with [inverse-propensity weighting](https://arxiv.org/abs/1608.04468) that turns biased clicks into unbiased training signal. The agent-context cousin arrived as [Lost in the Middle](https://arxiv.org/abs/2307.03172): models answer less accurately when the relevant passage sits in the middle of the input than at either end. It is not the same phenomenon (a ranked list's position bias is a bias in the feedback and decays from the top, while Lost in the Middle is an effect on how the consumer uses its input, U-shaped and model-specific), but it calls for the same discipline. The correct response is not *use a bigger context window*. It is to treat position as a variable you control and account for, order deliberately, and measure the effect rather than hoping it is small.

<figure class="wide">
  <a class="fig-zoom" href="/writing/zoom.html?f=/writing/agent-context-is-a-recommendation-problem/figures/position-effect.svg"><img src="/writing/agent-context-is-a-recommendation-problem/figures/position-effect.svg" alt="Schematic showing effective use of an item by its position in a long context: high at the start, dipping through the middle, recovering at the end." width="1000" height="420" loading="lazy" decoding="async" /></a>
  <figcaption><b>FIG. 02</b> — Position is a treatment, not an accident. A ranker that ignores where an item lands is optimising a metric it cannot deliver. Schematic, not data; the U-shape follows Liu et al. (2023). Position bias in ranked lists decays from the top instead of recovering.</figcaption>
</figure>

**Offline metrics and online behaviour diverge.** Most recommender teams learn that an offline gain in a ranking metric often fails to reproduce online, because the offline evaluation is computed over logs generated by the *current* policy. Agent-context work is at the stage of trusting a retrieval metric (recall@k over a fixed question set) and being surprised when the agent's end-to-end behaviour does not improve. The cause is related but not identical: a component metric standing in for an outcome. The treatment borrows from both fields. Label retrieval by its downstream effect rather than its topical relevance, and compare pipelines on paired end-to-end runs of the same tasks: an A/B, not an interleave, because interleaving needs reliable per-item feedback, and whether an agent used an item is not that. Once you log exposure with known propensities, off-policy estimators become available; until then, treat your offline number as directional at best.

**The catalogue-versus-recommendation distinction matters most.** It is the answer to the story I opened with. A tool in a schema is a catalogue entry: available, correctly described, and completely passive. It requires the agent to know that it wants something before it can find it. But an agent mid-task does not know what it does not know, which is what makes tribal knowledge tribal, so a passive catalogue can be perfectly built and still never fire.

What worked better for us was the recommendation posture: identify what the task touches, then put the relevant knowledge **in front of the agent** as context before it starts, or make a lookup mandatory before its first irreversible step. It is the difference between a reference library and a colleague who taps you on the shoulder and says *heads up, that table has a gotcha.* The information is the same; what changes is whether it gets used.

## What does not transfer

I want to be careful here, because a framing that explains everything explains nothing. Five places where the analogy breaks:

**The user can search.** A feed serves users who are not querying the catalogue. An agent queries constantly: it reformulates, re-queries, reads twenty candidates and keeps three, which makes it a capable reranker in its own right, and it does not read a list top-down. So the honest model is not a feed but mixed initiative: push what the agent cannot know to ask for, let it pull the rest, and remember that whatever you push gets used, stale or not.

**There is no reliable click.** Recommenders are built on abundant implicit feedback (impressions, clicks, dwell, skips) at a volume that supports learned rankers. An agent gives you two weaker signals: whether it used an item, which is not the same as the item helping, since an agent will happily use a wrong claim, and one delayed, expensive outcome per task. Partial answers exist: training the retriever on the reader's likelihood ([REPLUG](https://arxiv.org/abs/2301.12652)), labelling each document by its downstream effect ([eRAG](https://arxiv.org/abs/2404.13781)), and attributing an output to parts of its context by ablation ([ContextCite](https://arxiv.org/abs/2409.00729)). They need at least one extra model call per item and were built for single-response generation, not multi-step agent runs, and most of the learning-to-rank apparatus waits on that gap.

**The slate is small even when the window is not.** A feed can show fifty items and let the user scroll. A context window can hold far more than a handful of claims, but every claim you add competes for the attention the task needs. Small effective slates make redundancy far more costly and make the set-level optimisation matter much more than the item-level scores.

**There is one user, and it changes.** Recommenders model preferences that drift across a population of users. Here the single consumer is replaced wholesale every few months, with different context handling, different instruction-following, and different failure modes. A ranker tuned to one model's attention profile may be actively wrong for the next.

**Errors are asymmetric in a different direction.** A bad recommendation is an annoyance; the user scrolls past. A wrong claim injected confidently into an agent's context gets *used*, and propagates into an artifact someone acts on. That asymmetry argues for precision over coverage far more strongly than a feed does, and for making uncertainty legible rather than smoothing it away.

## What I would do with this

1. **Build the second stage.** If your context pipeline is a vector search and a `top_k`, with or without a cross-encoder in between, you have a candidate generator. Add a ranker over a few hundred candidates that scores them against the task, with features similarity cannot see: recency, source authority, how often this claim has been contradicted, whether it applies to the entities in *this* task.
2. **Treat prompt assembly as slate construction.** Deduplicate at the set level, order deliberately, and put the least-forgiving items where attention is highest. Measure whether ordering changed anything; you will be surprised at least once.
3. **Push, or gate.** If knowledge enters only when the agent thinks to ask, whether it enters depends on the model, the prompt and whatever else is lying around in the context. Identify the entities a task touches and inject before the first turn, or make a lookup mandatory before the first irreversible step.
4. **Instrument exposure, and randomise a little of it.** Log what you showed, in what position, and with what probability, alongside what was used. Exposure logs from a deterministic ranker still only describe your own past ranking; a small randomised slice (swap two positions, add one exploratory item) is what lets you estimate the value of what you did not show.
5. **Steal the evaluation discipline before the models.** Multi-objective reporting, held-out comparisons, and honest offline/online gap accounting are the transferable parts. The learned rankers can wait until you have a feedback signal worth learning from.

## What this does not prove

This is a framing argument, not an experimental result. I have not run the ablation that matters: a task-conditioned ranker against a strong cross-encoder reranker and against plain top-*k*, scored on end-to-end task success on a public agent benchmark. Rerank versus no rerank has been measured many times on question answering; that is not the comparison I mean. Until someone runs it, the claim that ranking is the missing stage is an informed bet rather than a finding. Somebody should run it. It is a well-shaped experiment and I would like to be wrong about the size of the effect, in either direction.

The opening story is one task on one model. In later work, agents called a knowledge tool in 37 of 43 tasks when it was live and prominent in their workspace, and pushing had its own failure: where a frozen copy of the knowledge was attached instead, the agents never called the live source, and in 12 of 17 tasks they read the stale copy. Push wins attention. It does not guarantee the attention goes to the right version.

I am also aware that the mapping flatters my own background. I spent seven years building production recommenders, scaling one from a million users to two hundred million, and then moved to retrieval quality in code search and now to knowledge systems for agents. A person with that history is exactly the person who would see recommendation everywhere. Discount accordingly, and check the five places I said it breaks.

But the failure I opened with is real: a well-built, correctly described, entirely unused knowledge system. A query-driven stack has no slot for it, because it assumes someone asks. Information retrieval named a related problem decades ago, when Belkin described the searcher's *anomalous state of knowledge*: someone who senses a gap usually cannot say precisely what would fill it. An agent that does not sense the gap cannot ask at all. Recommendation made the cure its default: decide what to show without waiting to be asked.

<div class="claim">Getting the right knowledge to the right agent at the right moment is a recommendation problem that happens to have a model as its user.</div>
