---
title: "Your Eval Has a Noise Floor"
publication: "Srijan Saket"
date: 2026-09-05
teaser: "Before you can tell whether a change helped, you have to know how much your benchmark moves when nothing changes at all. Usually nobody has measured that."
dek: "Before you can say a change helped, you need to know how far your benchmark moves when nothing changes at all. Almost nobody measures that first, and it is cheap next to what it saves you."
excerpt: "One configuration, run four times with nothing changed, scored 33, 27, 17 and 25 claims out of sixty. Re-judging a byte-identical artifact under the same protocol moved its score by four. With a run-to-run standard deviation of about six claims, a single-run improvement had to be about three times that size before it meant anything. Here is how to find your own floor, what it costs, and why more judge passes will not save you."
tags: [evaluation, benchmarks, agents]
series: "Evidence-carrying systems"
seriesOrder: 3
thumbnail: "/writing/your-eval-has-a-noise-floor/plate.svg"
cover: "/writing/your-eval-has-a-noise-floor/figures/claim-decomposition.svg"
socialImage: "/writing/your-eval-has-a-noise-floor/card.png"
featured: true
draft: false
---

A configuration scored 33 claims out of sixty. I ran it again, unchanged: 27. Twice more: 17 and 25.

Same code, corpus, prompt, model and reasoning effort; the only difference was that I had run it again. Sixteen claims separated the best run from the worst, on a rubric where people were reporting three-claim improvements to me as wins.

<div class="claim">If a change moves the score less than an unchanged re-run does, a single run cannot tell you the change did anything.</div>

That is an obvious statement and an easy one to violate, because the machinery that would catch it (repeats, re-judges, a stated floor) costs real money and produces no new capability. It is the experiment that tells you your other experiments were wrong. Nobody is excited to run it.

In [Retrieval Is Not Delivery](/writing/retrieval-is-not-delivery/), averaging repeated judging passes was the first version of this discipline, and it measured only the judge. This post measures both kinds of movement on a different benchmark, a 60-claim rubric over long-form documents: what the numbers turned out to be, what measuring them cost, and the protocol I would now insist on before believing any single-run comparison of agents that produce long-form output.

## Two sources of movement, measured separately

Long-form agent output is usually scored by an LLM judge against a rubric: a set of claims the artifact should contain, checked one at a time. That gives you two sources of variance, one nested inside the other, and they need separating before either can be reasoned about.

**Judge variance** is how much the score moves when the artifact is fixed and only the scoring changes. To measure it, take one output, freeze it, and score it again. Not a similar artifact: the *same bytes*.

**Run variance** is how much the score moves when the configuration is fixed and only the generation changes. To measure it, run the identical config again and score both outputs under whatever judging protocol you have already settled.

These get conflated constantly, and the conflation is expensive: if you attribute judge noise to run instability you will go tune sampling parameters that were never the problem, and the reverse sends you buying judge passes for a problem that is mostly generation. Variances add, not standard deviations. Here judging was roughly a tenth to a sixth of the run-to-run variance, so more judge passes cannot rescue a small single-run difference; only more runs can.

None of this is new statistics. Evan Miller's [Adding Error Bars to Evals](https://arxiv.org/abs/2411.00640) gives the formulas (resampled answers, paired differences, clustered standard errors, power analysis), and [Card et al.](https://arxiv.org/abs/2010.06595) showed how often NLP comparisons are underpowered. What changes for long-form agent output is the unit: one run produces one artifact scored on every claim at once, so claims rise and fall together, and the run, not the claim, is what you replicate. Beneath both sits a third source, which claims made it into the rubric at all; at sixty claims, that alone is worth about four claims of standard error.

<div class="metric-grid">
  <div><span class="metric-value">4 / 60</span><span class="metric-label">re-judge drift</span><span class="metric-context">identical bytes, same 3-pass protocol; largest of three checks</span></div>
  <div><span class="metric-value">&asymp;6.4 / 60</span><span class="metric-label">run-to-run standard deviation</span><span class="metric-context">pooled over replicated configs; individual configs ~1–11</span></div>
  <div><span class="metric-value">5</span><span class="metric-label">judge passes per artifact</span><span class="metric-context">majority per claim, adopted after these measurements</span></div>
  <div><span class="metric-value">n &ge; 3</span><span class="metric-label">repeats before attributing a change</span><span class="metric-context">a minimum: it detects only ~15-claim gaps</span></div>
</div>
<p class="metric-note">Measured on a 60-claim rubric over long-form technical artifacts. Your numbers will differ; the method is what transfers.</p>

A conflict of interest first: I built the benchmark, and my team built the system and the judge harness. Re-judging a byte-identical artifact with the same three-pass majority protocol moved its strict score by four claims in sixty; two more identical-text re-judges moved three and one. Run to run, scores had a pooled standard deviation of about 6.4 claims across the configurations I replicated, and individual configurations ranged from about 1 to 11. That is the typical size of the noise, not a bar to clear: two single runs differ with a standard deviation of about 9 claims, so on this corpus a single-run difference had to exceed roughly 18 claims to mean anything at the usual 95% level. A lot of the differences people were reporting to me were under six.

<figure class="wide">
  <iframe src="/writing/your-eval-has-a-noise-floor/figures/noise-floor.html" title="Interactive chart: an observed difference between two configurations compared against the 95% noise band for one, three or ten runs per configuration" loading="lazy" class="fig-noise-floor"></iframe>
  <figcaption><b>FIG. 01</b> — Drag the observed difference, and choose how many runs each configuration got. The band is the 95% range for the difference between two configurations that are actually identical, given a run-to-run standard deviation of 6.4 claims. It narrows with repeats, not with hope.</figcaption>
</figure>

## What the floor costs

The uncomfortable part is the arithmetic. Three generation repeats per configuration and two configurations to compare is six artifacts; five judge passes on each is thirty judging passes, all to make one honest claim about one change. On expensive models and long artifacts, that can be most of what you have to spend on the experiment. And three runs per configuration is a minimum, not a guarantee: at a run-to-run standard deviation of 6.4, it detects only gaps of about 15 claims with 80% power. Detecting a 6-claim gap reliably takes about 18 runs per configuration.

There are three ways to pay it, in descending order of how much I like them:

**Shrink the comparison, not the protocol.** Test fewer levers properly rather than many levers badly. A ranked list of six candidate changes, of which you can afford to evaluate two honestly, is more useful than six numbers you cannot defend.

**Measure the smaller half once; keep paying for the bigger one.** Judging is not free (five passes over a long artifact can cost about as much as generating it), but its variance is the smaller share, so a judge-variance estimate can be reused for everything scored the same way. Measure it on artifacts across your score range: judges flip most on claims an artifact half-satisfies, so judge noise depends on the artifact as well as the rubric. Re-derive it when the rubric or the judge model changes, and treat a judge-model upgrade as a rubric change, because it is one.

**Pre-register the expectation.** Before running, write down what you expect and what would falsify it. It costs nothing, and while it does not shrink the noise, it stops you choosing the comparison after you have seen it, which is how most fishing expeditions turn into findings. Keep a ledger of every run, including the ones that went against you. The ledger is the thing that makes the eventual positive result believable, to a reader and more importantly to you in three months.

## Decomposition changes what you are measuring

There is a second measurement problem, and I think it is where much of the judge noise comes from.

A rubric claim like *the nightly job excludes retried events before aggregating, and this changed in the second era of the pipeline* is not one assertion. It is three or four. Scored whole, it is all-or-nothing: an artifact that gets the exclusion right and the era wrong scores identically to one that gets neither. That is a lossy instrument: it compresses the difference between near-complete and absent, and a judge deciding whether a compound requirement is "present" will sometimes round up.

When I traced the identical-bytes re-judge, all four flips went from correct to partial: the judge applied the same requirements more strictly the second time, and one of the four was the first pass crediting something the artifact did not contain. Across all three identical-text re-judges, the same few compound claims kept flipping; one flipped in all three. Nine in ten of the rubric's requirements turned out to be multi-clause sentences. An artifact that satisfies two clauses of three has no stable verdict for any judge; more passes average over the ambiguity instead of resolving it. Decomposition makes the question well-posed. I have not yet measured how much it shrinks the band.

Decomposing each claim into atomic assertions and scoring those changes both the resolution and the number. Sixty claims became several hundred atomic assertions in my case, and the reported numbers moved substantially, not because any system got better, but because the ruler changed. Which way they move depends on the aggregation rule. Credit the fraction of assertions met and near-complete work gains; require every assertion and scores fall hard. My re-score sat in between, with the judge still giving one verdict per claim against the atomic list: scores fell for 12 of 14 artifacts, by up to 8 claims, and I changed the number of judge passes at the same time.

<figure class="wide">
  <a class="fig-zoom" href="/writing/zoom.html?f=/writing/your-eval-has-a-noise-floor/figures/claim-decomposition.svg"><img src="/writing/your-eval-has-a-noise-floor/figures/claim-decomposition.svg" alt="Diagram: one compound rubric claim decomposed into four atomic assertions, three of them met, scored three ways: whole claim 0%, fraction of assertions met 75%, all assertions required 0%." width="1000" height="440" loading="lazy" decoding="async" /></a>
  <figcaption><b>FIG. 02</b> — The same output, three rulers. Whole-claim scoring cannot tell <i>almost complete</i> from <i>entirely absent</i>, and a judge may round it either way. Counting the fraction of assertions met keeps that distinction; requiring every assertion scores the claim as missing, but from four answerable questions instead of one ambiguous one.</figcaption>
</figure>

The rule this implies: **a score is only comparable to another score computed under the same claim-set version.** Version your rubric, ship the changelog with the results, and never compare across versions without saying so. Re-scoring old artifacts under a new rubric is cheap. Silently mixing rubric versions is how a benchmark stops meaning anything.

## Volume is not quality, and compliance is not score

Two more instrument traps, both of which I walked into.

**Volume is not quality.** The number of assertions an artifact makes, as opposed to the number of rubric claims it satisfies, correlates with length, with formatting conventions, with how aggressively the writer splits sentences, and with a dozen other things that have nothing to do with whether the artifact is any good. If you optimise it, you will get more assertions. You will not get a better artifact.

**Compliance is not score.** Building an artifact that obeys every instruction is a different achievement from building one that contains the right knowledge. I have watched a configuration obey new instructions almost perfectly, eleven of twelve compliance checks passing, and score no better than the configuration it was meant to improve; another obeyed its precision rules and landed a few claims lower, inside the noise. My working reading is that attention behaves as if it were conserved: add a requirement and something else gets less of it. Your eval should be able to see which.

## Guard against the leak you will not notice

If you build both the system and the benchmark, the failure mode is not that you cheat. It is that you drift.

A phrase from the answer key finds its way into a prompt as a helpful example. A threshold from the gold set gets hardcoded as a sensible default. A seed query is written by someone who has read the claims. None of it feels like cheating and all of it inflates the score without improving anything real.

The defence I trust most is mechanical: a check that extracts every model-facing string (system prompts, tool descriptions, output contracts, injected directives, seed lists) and fails a required check before merge if any distinctive token from the answer key, such as an identifier, a flag name or a number, appears in it. It catches verbatim leaks, the common case. It cannot catch paraphrase. A seed query written by someone who has read the claims shares concepts, not tokens, and passes; ours once passed a list of seed queries that turned out to be the evaluation domain's own vocabulary, and a reviewer, not the check, caught it. For that class the defence is procedural: prompts and seeds written by people who have not read the gold, or derived by the system from the raw task description.

For the mechanical part, two properties matter. Discover the surface automatically (build the agent and walk everything it will send) rather than trusting a list someone must remember to update, and scan the whole gold set rather than a hand-maintained token list. The system gets taught method. It never gets shown answers.

State the conflict of interest plainly, too. If you designed the benchmark and ran every system on it, say so in the first paragraph of the results, not in a footnote. A reader who discovers it themselves will discount everything else.

## The protocol

1. **Measure judge variance first.** Re-score several frozen artifacts spanning your score range, several times each, and report per-claim agreement and the spread of the total. One re-score is one draw.
2. **Decompose compound claims** into atomic assertions, and say which ruler and which aggregation rule produced the number.
3. **Judge with several passes, take the majority, and state the tie rule.** Four verdict classes can tie at any count. Majority voting removes some of the judge's randomness and none of its bias, and it moves the expected score, so the number of passes belongs in the rubric version too.
4. **Repeat generation at n ≥ 3** on unchanged configurations, and publish the spread, not only the mean. A standard deviation from three runs is itself uncertain by a factor of several.
5. **Compare with an interval, not a threshold.** State your floor as a standard deviation, with its n. Report the difference in means with a 95% interval over runs (half-width about 2.8σ/√n: here about 18 claims at n = 1, 10 at n = 3, and 6 only at n ≈ 10). If the interval spans zero, report it as *inside the noise*, not as a small win. These assume σ comes from many earlier runs, your stated floor; if σ comes only from the runs being compared, use a t-multiplier, and at n = 3 the half-width is about 14.5.
6. **Version the rubric.** Ship the changelog. Never compare across versions silently.
7. **Gate the verbatim leak mechanically**, over every model-facing string, against the whole gold set, and keep people who have read the gold away from prompts and seeds.
8. **Pre-register expectations and log every run**, especially the ones that went against you.

Most of this is unglamorous, and all of it is cheaper than the alternative, which is building six months of work on a three-claim improvement that was weather.

## What this does not prove

These numbers came from one benchmark family, one rubric style, one judge model, and one class of artifact: long-form technical documents scored by claim recall. A 4-claim re-judge drift and a 6.4-claim run-to-run standard deviation on a 60-claim rubric are my numbers, not yours. A deterministic scorer removes the judge band but not the run-to-run floor, which here was mostly generation. A shorter rubric shrinks both in claims but not in percentage points; a more objective task shrinks both; a fuzzier one grows both.

I also cannot tell you the floor is stationary, and on my own data it is not: on one benchmark and one model, configuration-level standard deviations ranged from about 1 to 11 claims, so the floor is a property of the system as much as of the benchmark. Measure it for the configurations you are comparing. I measured it on a handful of configurations over a few weeks; a different model, a longer artifact, or a corpus with more ambiguous claims could move it, and I have not tested any of those systematically.

What I would defend is the ordering. **Measure the movement before you measure the improvement.** It is the experiment that tells you whether the others were worth running, and the reason it usually goes unrun is not that it is hard. It is that its most likely finding is that you have been fooling yourself.
