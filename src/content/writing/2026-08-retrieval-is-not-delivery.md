---
title: "Retrieval Is Not Delivery"
publication: "Srijan Saket"
date: 2026-08-02
teaser: "An agent can find the right evidence and still lose the detail that matters before the final answer. Measuring the whole path instead of the last step."
dek: "An agent can find the right evidence and still lose the detail that matters before the final answer. So we stopped scoring the answer and started measuring the path."
excerpt: "At baseline, a two-agent question-answering workflow found 65% of the expected facts while reading — but only 22% of that evidence survived the handoff to the writer, and 23% reached the final answer. Retrieval was never the bottleneck. The handoff was. Eight versions and 45 fixed questions later, here is what it took to measure the whole path instead of the last step."
coauthors: ["Susnato Dhar"]
tags: [retrieval, agents, evaluation]
series: "Evidence-carrying systems"
seriesOrder: 1
thumbnail: "/writing/retrieval-is-not-delivery/plate.svg"
socialImage: "/writing/retrieval-is-not-delivery/card.png"
featured: true
draft: true
---

The trace looked successful. A research agent opened the right internal document and found that retry events had to be excluded before a daily metric was computed. Its summary said only: *aggregate eligible records by day.* The final answer sounded plausible. It had dropped the one condition that changed the number.

This is an easy failure to misdiagnose. The search worked. The model read the evidence. Nothing crashed, nothing threw, no tool returned an error. If you only score the final answer, the obvious response is to tune retrieval again, or swap in a stronger model.

The traces showed something else. The system had found the answer and then compressed away the detail that made it useful. Retrieval succeeded. Delivery failed.

<div class="claim">In an agent system, evidence is only useful if it survives every boundary between the source and the answer.</div>

That example is simplified, but the pattern came from real traces. I found it while working on a two-stage question-answering workflow with <b>Susnato Dhar</b>. One agent searched engineering documentation, a set of indexed document collections, and live data. A second agent used the returned evidence to write the answer. We tested eight versions of that workflow against the same 45 questions and inspected, by hand, where the expected evidence disappeared.

The product context was specific. The engineering lesson is not.

## What we measured

Before any of the improvement work, human annotators broke each question into the specific facts a complete answer needed, and identified evidence in the corpus that could support each one. If a question required four facts and only two reached a given checkpoint, recall at that checkpoint was 50%.

Every output was scored three times and averaged, because automated evaluators drift between scoring passes and a single pass will happily hand you a two-point difference that does not exist. How much that drift actually costs, and what it takes to measure it, is [the third post in this series](/writing/your-eval-has-a-noise-floor/).

These are **not answer-accuracy scores**. A question could receive a genuinely useful answer and still lose points for omitting one required condition, source, or exception.

<div class="metric-grid">
  <div><span class="metric-value">23% &rarr; 51%</span><span class="metric-label">expected evidence reaching the answer</span><span class="metric-context">final checkpoint</span></div>
  <div><span class="metric-value">22% &rarr; 60%</span><span class="metric-label">exact evidence preserved between agents</span><span class="metric-context">research-to-answer message</span></div>
  <div><span class="metric-value">65% &rarr; 82%</span><span class="metric-label">expected facts found while reading</span><span class="metric-context">reading checkpoint</span></div>
  <div><span class="metric-value">0 &rarr; 14/45</span><span class="metric-label">questions checked against live data</span><span class="metric-context">verification checkpoint</span></div>
</div>
<p class="metric-note">Fixed 45-question internal evaluation. Values are rounded from strict fact-level recall and averaged across three scoring passes.</p>

The percentages look low because the test asks how much of the expected evidence survives a long workflow, not whether an answer sounds reasonable. That strictness is the point: it converts a vague complaint into a coordinate.

## An answer has a supply chain

A production agent rarely moves in one step from a source to an answer. It searches, opens documents, takes notes, delegates, compresses intermediate results, verifies selected facts, and finally writes. Every step is a boundary where information can be dropped, rounded, or quietly reinterpreted.

That makes agent reliability an information-flow problem. The useful unit of measurement is not *was the document retrieved?* It is *did the exact evidence the final answer needed survive the whole path?*

<figure class="wide">
  <iframe src="/writing/retrieval-is-not-delivery/figures/evidence-path.html" title="Interactive diagram: the five checkpoints between a source and an answer, each with what it measures and what a miss means" loading="lazy" class="fig-evidence-path"></iframe>
  <figcaption><b>FIG. 01</b> — The five places a fact can die between a source and an answer. Select a checkpoint to see what it measures and what a miss at that point actually means.</figcaption>
</figure>

This framing lines up with the broader literature. The [MAST failure taxonomy](https://arxiv.org/abs/2503.13657) finds that multi-agent systems fail through specification, coordination, and verification — not primarily because a model lacked capability. Anthropic's account of its [multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) makes the same dependency visible from the other direction: parallel research only helps when the coordinating agent actually receives and combines the findings.

## Failure 1: summaries are a lossy codec

The first version asked the research agent for a concise summary to pass to the answer writer. Concision sounded like efficiency. It was compression applied at exactly the point where fidelity mattered most.

A source might say that a rule applies only to eligible records, at a daily aggregation level, after excluding retries. A fluent summary returns *aggregate eligible records*. The gist survives. The conditions, the source location, and the exclusion do not — and, crucially, the downstream agent has no way to tell that anything is missing. A lossy summary and a complete one look identical on arrival.

<figure class="wide">
  <img src="/writing/retrieval-is-not-delivery/figures/evidence-record.svg" alt="Side-by-side comparison: a free-form summary preserving only the gist, versus a structured evidence record preserving verbatim excerpt, source, conditions, interpretation, and open gaps." width="920" height="520" loading="lazy" decoding="async" />
  <figcaption><b>FIG. 02</b> — A summary preserves the gist. A structured evidence record also preserves the exact wording, where it came from, the conditions attached to it, and what remains unresolved.</figcaption>
</figure>

We replaced the free-form summary with a structured evidence record. The handoff message had to carry the finding, a verbatim excerpt, the source and location, the conditions that applied, and any unresolved gap — in separate fields. The receiving agent could now distinguish what a source said from what the research agent concluded about it.

At baseline, 22% of the relevant excerpts the research agent had actually read appeared in the message it sent onward. After the structured record and the changes around it, 60% survived. That gap is the distance between what one agent found and what the system could use.

## Failure 2: more context is not more attention

The internal knowledge was organised as a long reference document — a system overview, operating rules, metric definitions, a glossary. Evidence for a single question was often spread across several of those sections. Reading one plausible-looking section produced a convincing feeling of completion.

Loading the whole document into a larger prompt does not fix this. [Lost in the Middle](https://arxiv.org/abs/2307.03172) showed that models use long contexts unevenly, with relevant information in the middle receiving measurably less effective attention. Anthropic's guide to [context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) makes the operational version of the point: context is a finite budget, and additional tokens dilute the high-signal evidence an agent actually needs.

The fix was to give the agent a map of the document rather than the document itself. Before concluding, it checked which sections it had not read, and followed each important term across sections rather than stopping at the first definition. Expected facts found rose from 65% to 82%, including several that had consistently been missed in the glossary.

## Failure 3: unavailable sources still cost you

The agent could search several prepared document collections, but not every collection existed for every team. The system exposed the full menu regardless. The agent spent real turns calling sources that could not return anything, interpreting empty responses, and deciding whether an empty result meant *nothing found* or *try again differently*.

In aggregate logs this looked like a search-quality problem. It was an interface problem. **A tool that cannot work should not be competing for the agent's attention.**

We added an inventory of what was actually searchable for each team, computed before the agent started. Missing and empty sources disappeared from the menu. Attempts to search unavailable sources fell from 75 to 0 across the evaluation, and the roughly 10% of search calls that had been returning nothing fell to 0 as well.

## Failure 4: retrieved evidence can still be wrong

A well-cited answer can be confidently out of date. Documents describe intended behaviour; live systems show current state. They are not interchangeable, and the gap between them is exactly where the interesting failures live.

So we made live verification an explicit stage rather than an emergent behaviour. In the final version, 14 of the 45 questions triggered checks against the live warehouse. One check found that the field needed to join two tables did not exist. Another found that a documented policy had been retired months earlier. In both cases the correct output was to state the gap plainly — not to construct a confident answer over a broken assumption.

## Measure the path, not only the answer

A final-answer score is still necessary. It tells you whether the system helped. It does not tell you what to fix. So we followed each expected fact from the first search to the final response.

<div class="table-scroll">

| Step | Question | What a miss usually means |
|---|---|---|
| Search | Did the agent open a source containing the expected fact? | The search missed the right source |
| Read | Did it capture the fact from that source? | Overlooked, or misread |
| Pass on | Did the exact evidence reach the answer writer? | The summary removed a load-bearing detail |
| Check live | Was a time-sensitive fact verified against the live system? | The answer may rest on stale documentation |
| Answer | Did the final response include the required support? | Lost earlier, or dropped during writing |

</div>

The checkpoint view also stopped us from declaring victory early. One measure got **worse**: the rate at which indexed search returned the exact document the annotators expected fell from 40% to 14%. The workflow got better at using evidence from the reference document while indexed search got worse at finding one particular file. That search regression was real, and it stayed unresolved.

Every improvement needs a paired measure of what might degrade. A broader search finds more relevant material while returning the exact target less often. A structured message preserves excerpts while still omitting an unexplored source. One aggregate number hides both trades.

## A checklist for agent builders

1. **Track each fact from source to answer.** Record what the agent opened, what it extracted, what it passed on, what it cited, and what it verified. Without this you are debugging by intuition.
2. **Structure the messages between agents.** Keep verbatim evidence, interpretation, source location, conditions, and open questions in separate fields. Prose merges them, and merged fields cannot be audited.
3. **Treat context as a budget.** Load high-signal evidence when it is needed, keep pointers to the rest, and record explicitly what has not been checked.
4. **Show the agent only tools that work.** Remove empty, unavailable, and unauthorised sources before the agent starts choosing.
5. **Prefer the most direct source.** Documents are good for policy and orientation. Live systems are better for current fields, counts, and state.
6. **Allow honest gaps.** *The sources disagree* and *these tables cannot be joined* are valid outputs. A system forced to always answer will eventually invent the bridge.
7. **Track what got worse.** Keep wrong-answer rate, exact-match rate, empty searches, cost, and latency beside your coverage number, so one gain cannot quietly fund a loss somewhere else.

## What this does not prove

This was one internal system, evaluated on 45 questions. Scoring each output three times reduced some evaluator variance; it did not make the sample representative. The question mix, the available sources, and the workflow design all shaped these numbers. They are not a benchmark for research agents in general, and I would not use them to predict what your pipeline will do.

The conclusion I would defend is narrower and, I think, more useful: **an answer has an evidence supply chain, and a final-answer score cannot see it.** Better retrieval is worth having, but it cannot recover a fact that gets compressed away three steps later. If the path between source and answer is invisible, a team will keep repairing the first component it happens to be able to see — which is usually search, and usually not the problem.

<div class="claim">The model does not need to remember everything. The system needs to preserve the right things.</div>
