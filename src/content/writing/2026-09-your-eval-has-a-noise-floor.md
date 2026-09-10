---
title: "Your Eval Has a Noise Floor"
publication: "Srijan Saket"
date: 2026-09-05
teaser: "Before you can tell whether a change helped, you have to know how much your benchmark moves when nothing changes at all. Usually nobody has measured that."
dek: "Before you can say a change helped, you need to know how far your benchmark moves when nothing changes at all. Almost nobody measures that first — and it is the cheapest experiment you will ever run."
excerpt: "Re-judging a byte-identical artifact — same text, same rubric, same judge, one more pass — moved its score by four claims in sixty. Re-running an unchanged configuration moved it by about six. Which means any single-run improvement smaller than six claims was indistinguishable from running the same thing twice. Here is how to find your own floor, and what it costs."
tags: [evaluation, benchmarks, agents]
series: "Evidence-carrying systems"
seriesOrder: 3
thumbnail: "/writing/your-eval-has-a-noise-floor/plate.svg"
socialImage: "/writing/your-eval-has-a-noise-floor/card.png"
featured: true
draft: true
---

I shipped a change, re-ran the benchmark, and the score went up by three claims out of sixty. Five percent. Modest, but real — the kind of result that gets written into a decision log and quietly becomes load-bearing for everything built on top of it.

Then, for unrelated reasons, I re-ran the *unchanged* configuration. It moved by four.

Nothing had changed. Same code, same corpus, same prompt, same model, same reasoning effort. The benchmark had simply exhaled.

<div class="claim">A result smaller than the movement your system already shows when nothing changes is not a small result. It is not a result.</div>

That is an obvious statement and an easy one to violate, because the machinery that would catch it — repeats, re-judges, a stated floor — costs real money and produces no new capability. It is the experiment that tells you your other experiments were wrong. Nobody is excited to run it.

Scoring every output three times, in [the evidence supply-chain work](/writing/retrieval-is-not-delivery/), was the first version of this discipline. This post is what happened when I measured how much that actually bought — what it cost, what the numbers turned out to be, and the protocol I would now insist on before believing any single-run comparison of agents that produce long-form output.

## Two sources of movement, measured separately

Long-form agent output is usually scored by an LLM judge against a rubric: a set of claims the artifact should contain, checked one at a time. That gives you two independent sources of variance, and they need separating before either can be reasoned about.

**Judge variance** is how much the score moves when the artifact is fixed and only the scoring changes. To measure it, take one output, freeze it, and score it again. Not a similar artifact — the *same bytes*.

**Run variance** is how much the score moves when the configuration is fixed and only the generation changes. To measure it, run the identical config again and score both outputs under whatever judging protocol you have already settled.

These get conflated constantly, and the conflation is expensive: if you attribute judge noise to run instability you will go tune sampling parameters that were never the problem.

<div class="metric-grid">
  <div><span class="metric-value">±4 / 60</span><span class="metric-label">judge variance</span><span class="metric-context">byte-identical artifact, one extra pass</span></div>
  <div><span class="metric-value">~6 / 60</span><span class="metric-label">run-to-run floor</span><span class="metric-context">unchanged configuration, repeated</span></div>
  <div><span class="metric-value">5</span><span class="metric-label">judge passes per artifact</span><span class="metric-context">majority verdict per claim</span></div>
  <div><span class="metric-value">n &ge; 3</span><span class="metric-label">repeats before attributing a change</span><span class="metric-context">minimum, not a target</span></div>
</div>
<p class="metric-note">Measured on a 60-claim rubric over long-form technical artifacts. Your numbers will differ; the method is what transfers.</p>

A single-pass re-judge of a byte-identical artifact moved its score by four claims in sixty. Most configurations moved about six claims run to run. So on this corpus, any single-run difference under roughly six claims sat inside the movement two identical runs already showed — and a lot of the differences people were reporting to me were under six claims.

<figure class="wide">
  <iframe src="/writing/your-eval-has-a-noise-floor/figures/noise-floor.html" title="Interactive chart: an observed delta compared against the judge-variance band and the run-to-run floor, showing when a result clears the noise" loading="lazy" class="fig-noise-floor"></iframe>
  <figcaption><b>FIG. 01</b> — Drag the observed improvement. Below the run-to-run floor, the result is inside the movement two identical runs already produce. The band does not go away by hoping; it goes away by repeating.</figcaption>
</figure>

## What the floor costs

The uncomfortable part is the arithmetic. Three generation repeats per configuration and two configurations to compare is six artifacts; five judge passes on each is thirty judging passes — all to make one honest claim about one change. On expensive models and long artifacts, that is not a rounding error in the budget — it is the budget.

There are three ways to pay it, in descending order of how much I like them:

**Shrink the comparison, not the protocol.** Test fewer levers properly rather than many levers badly. A ranked list of six candidate changes, of which you can afford to evaluate two honestly, is more useful than six numbers you cannot defend.

**Reuse the expensive half.** Judge variance is a property of the rubric and the judge, not of the system under test. Measure it once, carefully, and reuse it as the band for everything scored the same way. Re-derive it when the rubric or the judge model changes — and treat a judge-model upgrade as a rubric change, because it is one.

**Pre-register the expectation.** Before running, write down what you expect and what would falsify it. This costs nothing and does more work than any amount of extra compute, because it converts a fishing expedition into a test. Keep a ledger of every run, including the ones that went against you. The ledger is the thing that makes the eventual positive result believable — to a reader, and more importantly to you in three months.

## Decomposition changes what you are measuring

There is a second, quieter measurement problem that has nothing to do with variance.

A rubric claim like *the nightly job excludes retried events before aggregating, and this changed in the second era of the pipeline* is not one assertion. It is three or four. Scored whole, it is all-or-nothing: an artifact that gets the exclusion right and the era wrong scores identically to one that gets neither. That is a lossy instrument, and it is lossy in a direction that flatters weak outputs and punishes near-complete ones.

Decomposing each claim into atomic assertions and scoring those changes both the resolution and the number. Sixty claims became several hundred atomic assertions in my case, and the reported percentages moved substantially — not because any system got better, but because the ruler changed.

<figure class="wide">
  <img src="/writing/your-eval-has-a-noise-floor/figures/claim-decomposition.svg" alt="Diagram: one compound rubric claim decomposed into four atomic assertions, showing how whole-claim scoring collapses partial credit that atomic scoring preserves." width="920" height="440" loading="lazy" decoding="async" />
  <figcaption><b>FIG. 02</b> — The same output, two rulers. Whole-claim scoring throws away the distinction between <i>almost complete</i> and <i>entirely absent</i>. Atomic scoring keeps it — and produces a different headline number for identical work.</figcaption>
</figure>

The rule this implies: **a score is only comparable to another score computed under the same claim-set version.** Version your rubric, ship the changelog with the results, and never compare across versions without saying so. Re-scoring old artifacts under a new rubric is cheap. Silently mixing rubric versions is how a benchmark stops meaning anything.

## Volume is not quality, and compliance is not score

Two more instrument traps, both of which I walked into.

**Claim count is not a quality metric.** It is tempting, because it is easy to compute and it moves. But the number of claims an artifact contains correlates with length, with formatting conventions, with how aggressively the writer splits sentences, and with a dozen other things that have nothing to do with whether the artifact is any good. If you optimise it, you will get more claims. You will not get a better artifact.

**Compliance is not score.** Building an artifact that obeys every structural instruction — every required section present, every citation formatted, every field populated — is a different achievement from building one that contains the right knowledge. I have seen a configuration follow the specification more faithfully and score worse, because effort spent satisfying structure was effort not spent finding evidence. Attention is conserved. If you add a requirement, something else gets less of it, and your eval should be able to see which.

## Guard against the leak you will not notice

If you build both the system and the benchmark, the failure mode is not that you cheat. It is that you drift.

A phrase from the answer key finds its way into a prompt as a helpful example. A threshold from the gold set gets hardcoded as a sensible default. A seed query is written by someone who has read the claims. None of it feels like cheating and all of it inflates the score without improving anything real.

The only defence I trust is mechanical: a required check in CI that extracts every model-facing string — system prompts, tool descriptions, output contracts, injected directives, seed lists — and asserts that the set is disjoint from the benchmark's answer key. Not a review step. A gate that fails the build.

Two properties matter. It has to cover *every* model-facing surface, so adding a new prompt without adding it to the check is itself a failure. And it should scan the whole gold set automatically rather than a hand-maintained token list, so it scales as the benchmark grows. The system gets taught method. It never gets shown answers.

State the conflict of interest plainly, too. If you designed the benchmark and ran every system on it, say so in the first paragraph of the results, not in a footnote. A reader who discovers it themselves will discount everything else.

## The protocol

1. **Measure judge variance first.** Freeze one artifact, score it again, and record the band. Everything downstream is interpreted against this number.
2. **Judge with an odd number of passes and take the majority.** One pass is a coin with a bias you have not measured.
3. **Repeat generation at n ≥ 3** on unchanged configurations, and publish the spread, not only the mean.
4. **State your floor before comparing.** A delta under the floor gets reported as *inside the noise*, not as a small win.
5. **Version the rubric.** Ship the changelog. Never compare across versions silently.
6. **Decompose compound claims** into atomic assertions, and say which ruler produced the number.
7. **Gate the leak in CI**, over every model-facing string, against the whole gold set.
8. **Pre-register expectations and log every run**, especially the ones that went against you.

Most of this is unglamorous, and all of it is cheaper than the alternative, which is building six months of work on a three-claim improvement that was weather.

## What this does not prove

These numbers came from one benchmark family, one rubric style, one judge model, and one class of artifact — long-form technical documents scored by claim recall. A ±4 judge band and a ~6 run-to-run floor on a 60-claim rubric are my numbers, not yours. On a shorter rubric, a more objective task, or a deterministic scorer, both will be much smaller; on a fuzzier one, larger.

I also cannot tell you the floor is stationary. I measured it on a handful of configurations over a few weeks. A different model, a longer artifact, or a corpus with more genuinely ambiguous claims could move it, and I have not tested any of those systematically.

What I would defend is the ordering. **Measure the movement before you measure the improvement.** It is the cheapest experiment in the whole programme, it is the only one that tells you whether the others were worth running, and the reason it usually goes unrun is not that it is hard — it is that its most likely finding is that you have been fooling yourself.
