---
title: "Retrieval Is Not Delivery"
publication: "Srijan Saket"
date: 2026-08-02
teaser: "An agent can find the right evidence and still lose the detail that matters before the final answer. Measuring the whole path instead of the last step."
dek: "An agent can find the right evidence and still lose the detail that matters before the final answer. So we kept scoring the answer and started measuring the path to it."
excerpt: "At baseline, the research agent in a two-agent question-answering workflow passed its writer only 22% of the expected excerpts it had actually read. The biggest leak was the handoff. Over a baseline and eight revisions on 45 fixed questions, here is what it took to measure the whole path instead of the last step, and what a structured handoff recovered."
coauthors: ["Susnato Dhar"]
tags: [retrieval, agents, evaluation]
series: "Evidence-carrying systems"
seriesOrder: 1
thumbnail: "/writing/retrieval-is-not-delivery/plate.svg"
socialImage: "/writing/retrieval-is-not-delivery/card.png"
featured: true
draft: false
---

The trace looked successful. A research agent opened the right internal document and found that retry events had to be excluded before a daily metric was computed. Its summary said only: *aggregate eligible records by day.* The final answer sounded plausible. It had dropped the one condition that changed the number.

This is an easy failure to misdiagnose. The search worked. The model read the evidence. Nothing crashed, nothing threw, no tool returned an error. If you only score the final answer, the obvious response is to tune retrieval again, or swap in a stronger model.

The traces showed something else. The system had found the answer and then compressed away the detail that made it useful. Retrieval succeeded. Delivery failed.

<div class="claim">In an agent system, evidence is only useful if it survives every boundary between the source and the answer.</div>

That example is illustrative, with details changed, but the pattern came from real traces. Susnato Dhar and I found it while working on a two-stage question-answering workflow. One agent searched engineering documentation, a set of indexed document collections, and live data. A second agent used the returned evidence to write the answer. We tested a baseline and eight revisions of that workflow against the same 45 questions, usually one run per question per version, and inspected, by hand, where the expected evidence disappeared.

## What we measured

Before any of the improvement work, reviewers wrote a reference answer for each question and tagged its hard requirements. An LLM judge then broke each answer into the facts it needed and located supporting passages in the corpus, and we spot-checked its output by hand. Recall is strict: if a question needed four facts and only two reached a given checkpoint (a measurement point along the path, not a saved state), recall there was 50%. At the reading checkpoint we counted facts; at the handoff we counted the supporting excerpts behind them. The two units can diverge either way: at baseline a fact often survived as gist while its supporting detail did not.

The handoff figures were averaged over repeated judging passes, because automated evaluators drift between passes (the fact-level 36% → 46% below comes from a single pass). Repeated passes measure the judge, though, not the run: each version ran once per question. [Your Eval Has a Noise Floor](/writing/your-eval-has-a-noise-floor/), the third post in this series, measures both kinds of movement on a different benchmark.

These are **not answer-accuracy scores**, and the writer's own answer was not scored at all: every number here describes the research agent's work, up to and including the message it handed to the writer. A question could receive a useful answer and still lose points for omitting one required condition, source, or exception.

<div class="metric-grid">
  <div><span class="metric-value">22% &rarr; 60%</span><span class="metric-label">read excerpts passed on to the writer</span><span class="metric-context">excerpts the agent had read</span></div>
  <div><span class="metric-value">23% &rarr; 52%</span><span class="metric-label">expected excerpts delivered to the writer</span><span class="metric-context">all expected excerpts, same message</span></div>
  <div><span class="metric-value">69% &rarr; 82%</span><span class="metric-label">expected facts fully found while reading</span><span class="metric-context">same scorer at both ends</span></div>
  <div><span class="metric-value">0 &rarr; 14/45</span><span class="metric-label">questions checked against live data</span><span class="metric-context">live check</span></div>
</div>
<p class="metric-note">Fixed 45-question internal evaluation, reference-document evidence. The first two figures describe the same research-to-writer message with different denominators, so they do not chain; the second also credits the few excerpts that reached the handoff without a full read, and averages per question, so at baseline it sits slightly above the first. Baseline versus final version; changes were cumulative.</p>

The percentages look low because the test asks how much of the expected evidence survives a long workflow, not whether an answer sounds reasonable. That strictness is the point: it converts a vague complaint into a coordinate.

## An answer has a supply chain

A production agent rarely moves in one step from a source to an answer. It searches, opens documents, takes notes, delegates, compresses intermediate results, verifies selected facts, and finally writes. Every step is a boundary where information can be dropped, rounded, or reinterpreted.

That makes agent reliability an information-flow problem. The useful unit of measurement is not *was the document retrieved?* It is *did the exact evidence the final answer needed survive the whole path?*

<figure class="wide">
  <iframe src="/writing/retrieval-is-not-delivery/figures/evidence-path.html" title="Interactive diagram: the checkpoints between a source and an answer, each with what it measures, its before-and-after number where one was measured, and what a miss means" loading="lazy" class="fig-evidence-path"></iframe>
  <figcaption><b>FIG. 01</b> — Four measured checkpoints between a source and the writer, then the answer, which this evaluation did not score. Select one to see what it measures, its before-and-after number, and what a miss there means. Each number has its own denominator, so they do not chain.</figcaption>
</figure>

None of this is new in kind. Anthropic's account of its [multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) routes subagent output to a filesystem to minimise a game of telephone between stages, and Cognition [argues](https://cognition.com/blog/dont-build-multi-agents) for sharing full agent traces rather than individual messages. [RAGAS](https://arxiv.org/abs/2309.15217) and [ARES](https://arxiv.org/abs/2311.09476) already score retrieval separately from generation. The [MAST failure taxonomy](https://arxiv.org/abs/2503.13657) groups multi-agent failures into system design issues, inter-agent misalignment and task verification, and argues that failure is *"not merely a function of challenges in the underlying model."* And Anthropic's [context-engineering guide](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) recommends that sub-agents return *"a condensed, distilled summary"* of their work, which is the compression this post is about. What has been missing is a measurement of what that compression costs, and of what a structured record recovers.

## Failure 1: summaries are a lossy codec

The first version asked the research agent for a concise summary to pass to the answer writer. Concision sounded like efficiency. It was compression applied at exactly the point where fidelity mattered most.

A source might say that a rule applies only to eligible records, at a daily aggregation level, after excluding retries. A fluent summary returns *aggregate eligible records*. The gist survives. The daily grain, the exclusion and the source location do not, and the downstream agent cannot tell that anything is missing. A lossy summary and a complete one look identical on arrival.

<figure class="wide">
  <a class="fig-zoom" href="/writing/zoom.html?f=/writing/retrieval-is-not-delivery/figures/evidence-record.svg"><img src="/writing/retrieval-is-not-delivery/figures/evidence-record.svg" alt="Side-by-side comparison: a free-form summary preserving only the gist, versus a structured evidence record preserving verbatim excerpt, source, conditions, interpretation, and open gaps." width="1000" height="520" loading="lazy" decoding="async" /></a>
  <figcaption><b>FIG. 02</b> — A summary preserves the gist. A structured evidence record also preserves the exact wording, where it came from, the conditions attached to it, and what remains unresolved.</figcaption>
</figure>

We replaced the free-form summary with a structured evidence record. The handoff message had to carry the finding, a verbatim excerpt, the source and location, the conditions that applied, and any unresolved gap, each in its own field. The receiving agent could now distinguish what a source said from what the research agent concluded about it.

At baseline, 22% of the relevant excerpts the research agent had actually read reached the message it sent onward intact, and in one judging pass about half arrived with a qualifier or detail missing, which is the failure this section describes. After the structured record and the changes around it, 60% arrived intact. That gap is the distance between what one agent found and what the system could use. Counted end to end, across all expected excerpts whether read or not, the share in the handoff rose from 23% to 52%; counted by facts instead of excerpts, from 36% to 46%. At baseline, facts got through more often than the excerpts supporting them: the gist survived and the detail did not.

## Failure 2: more context is not more attention

The internal knowledge was organised as a long reference document: a system overview, operating rules, metric definitions, a glossary. Evidence for a single question was often spread across several of those sections. Reading one plausible-looking section produced a convincing feeling of completion.

We did not test loading the whole document into a larger prompt, and the literature gives little reason to expect it to help: [Lost in the Middle](https://arxiv.org/abs/2307.03172) showed that accuracy falls when the relevant passage sits in the middle of a long input rather than at its start or end. Anthropic's guide to [context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) makes the operational version of the point: context is a finite budget, and additional tokens dilute the high-signal evidence an agent actually needs.

The fix was to give the agent a map of the document. Before concluding, it checked which sections it had not read, and followed each important term across sections rather than stopping at the first definition. Over the revisions that added these, expected facts fully found rose from 69% to 82%, including several that had consistently been missed in the glossary.

## Failure 3: unavailable sources still cost you

The agent could search several prepared document collections, but not every collection existed for every team. The system exposed the full menu regardless. The agent spent real turns calling sources that could not return anything, interpreting empty responses, and deciding whether an empty result meant *nothing found* or *try again differently*.

In aggregate logs this looked like a search-quality problem. It was an interface problem. **A tool that cannot work should not be competing for the agent's attention.**

We added an inventory of what was actually searchable for each team, computed before the agent started. Missing and empty sources disappeared from the menu. Attempts to search unavailable sources fell from 75 to 0 across the evaluation, and the one search call in seven (14%) that had been returning nothing fell to zero as well.

## Failure 4: retrieved evidence can still be wrong

A well-cited answer can be confidently out of date. Documents describe intended behaviour; live systems show current state. They are not interchangeable.

So we made live verification an explicit stage rather than an emergent behaviour. In the final version, 14 of the 45 questions triggered checks against the live warehouse; live checks were reserved for time-sensitive and quantitative questions, so 14 is not a coverage rate. One check found that the field needed to join two tables did not exist. Another found that a table the documentation relied on had stopped receiving data, so it could not support a current number. In both cases the correct output was to state the gap plainly instead of constructing a confident answer over a broken assumption.

## Measure the path, not only the answer

A final-answer score is still necessary: it tells you whether the system helped, and not what to fix. So we followed each expected fact from the first search to the message the writer received.

<div class="table-scroll">

| Step | Question | What a miss usually means |
|---|---|---|
| Search | Did the agent open a source containing the expected fact? | The search missed the right source |
| Read | Did it capture the fact from that source? | Overlooked, or misread |
| Pass on | Did the complete evidence reach the answer writer? | The summary removed a detail that mattered |
| Check live | Was a time-sensitive fact verified against the live system? | The answer may rest on stale documentation |
| Answer (not scored here) | Did the final response include the required support? | Lost earlier, or dropped during writing |

</div>

The checkpoint view also stopped us from declaring victory early. The clearest regression: the rate at which indexed search returned the exact document the ground truth expected fell from 40% to 14% (the baseline figure comes from replaying the logged queries). The workflow got better at using evidence from the reference document while indexed search got worse at returning the specific documents the answers needed. Evidence from the indexed collections fared badly throughout: about 6% of it reached the handoff at baseline, and about 10% at the end. The headline figures cover the reference document only. That search regression was real, and it stayed unresolved.

Every improvement needs a paired measure of what might degrade. A broader search finds more relevant material while returning the exact target less often. A structured message preserves excerpts while still omitting an unexplored source. One aggregate number hides both trades.

## A checklist for agent builders

1. **Track each fact from source to answer.** Record what the agent opened, what it extracted, what it passed on, what it cited, and what it verified. Without this you are debugging by intuition.
2. **Structure the messages between agents.** Keep verbatim evidence, interpretation, source location, conditions, and open questions in separate fields. Prose merges them, and merged fields cannot be audited.
3. **Treat context as a budget.** Load high-signal evidence when it is needed, keep pointers to the rest, and record explicitly what has not been checked.
4. **Show the agent only tools that work.** Remove empty, unavailable, and unauthorised sources before the agent starts choosing.
5. **Prefer the most direct source.** Documents are good for policy and orientation. Live systems are better for current fields, counts, and state.
6. **Allow honest gaps.** *The sources disagree* and *these tables cannot be joined* are valid outputs. A system forced to always answer will eventually invent the bridge.
7. **Track what got worse.** Keep wrong-answer rate, exact-match rate, empty searches, cost, and latency beside your coverage number, so one gain cannot fund a loss somewhere else without anyone seeing it.

## What this does not prove

This was one internal system, evaluated on 45 questions drawn from five underlying tasks. Each version ran once per question; the repeated scoring passes re-judged the same outputs and say nothing about run-to-run variance, so by the standard of [the noise-floor post](/writing/your-eval-has-a-noise-floor/) these are single-run comparisons. The changes were cumulative and not ablated, so each before-and-after is baseline against final, not the effect of the fix described beside it. The handoff gains are large next to the run-to-run floor measured in that post, on a different benchmark; the reading gain is smaller and provisional. The ground truth was built by an LLM judge from human-written reference answers and checked by hand only in samples. We tracked latency only for the last two versions and cost not at all, though item 7 tells you to track both. The question mix, the available sources, and the workflow design all shaped these numbers, and I would not use them to predict what your pipeline will do.

The conclusion I would defend is narrower and, I think, more useful: **an answer has an evidence supply chain, and a final-answer score cannot see it.** Better retrieval is worth having, but it cannot recover a fact that gets compressed away three steps later. If the path between source and answer is invisible, a team will keep repairing the first component it happens to be able to see, which is usually search, and often not the whole problem.

<div class="claim">The model does not need to remember everything. The system needs to preserve the right things.</div>
