---
title: "Explanations you can scrub"
summary: "Every essay here has a figure the reader can operate: a slider, a toggle, a run to scrub. What building them taught me about explaining systems: the thing you let readers change is the argument."
date: 2026-10-14
kind: study
order: 3
preview: figures
---

Every essay on this site has at least one figure the reader can operate. They are the part of the writing I would most like to be judged on as design, because each one had to decide what a reader should be able to change, and that decision is the argument.

<figure class="wide">
  <iframe src="/writing/your-eval-has-a-noise-floor/figures/noise-floor.html" title="Interactive chart: an observed difference between two configurations compared against the 95% noise band for one, three or ten runs per configuration" loading="lazy" class="fig-noise-floor"></iframe>
  <figcaption><b>FROM <a href="/writing/your-eval-has-a-noise-floor/">YOUR EVAL HAS A NOISE FLOOR</a></b> — Drag the observed difference, and choose how many runs each configuration got. The band is the range a difference between two identical configurations falls in.</figcaption>
</figure>

## The four figures

- **[The noise floor](/writing/your-eval-has-a-noise-floor/).** Drag an observed improvement and change the number of runs per configuration. The only control that moves the noise band is the number of runs, which is the essay's whole point.
- **[A run you can scrub](/writing/context-aging/).** Forty turns of an agent's run, with four observations that fade as turns pass. Toggle a ledger and watch which of them reach each draft.
- **[The evidence path](/writing/retrieval-is-not-delivery/).** Five places evidence can be lost between a source and an answer. Select one to see what it measures and what a miss there means.
- **[Two vocabularies](/writing/agent-context-is-a-recommendation-problem/).** The same pipeline labelled in recommender-systems terms and in agent-context terms. Switch between them and the missing stage shows itself.

## What building them taught me

**The control is the claim.** Each figure gives the reader one variable to change, and choosing it was the design work. The noise-floor figure first had one slider against fixed bands. It showed the problem but not the way out, until I added the number of runs as a second control, because that is the one thing a team can change.

**Say what is schematic, inside the figure.** The run replay animates an invented decay curve, and its ledger arm is perfect by construction. The figure says so in its own caption, not in a footnote, because a reader who scrubs it is forming a belief about how real agents behave.

**Numbers keep their denominators.** An early version of the evidence-path figure drew its five numbers as a funnel. They were measured against different denominators, so the funnel told a story the data did not. Each step now states what it counts, and the funnel is gone.

**It has to work on a phone.** Most readers arrive from a link on their phone. The figures size themselves to their content at any width, and static diagrams open full size for zooming. A figure that clips on a phone is a broken sentence.

**Motion is opt-out.** Anything that animates stops for readers who have asked their system to reduce motion, and the finished state is always the authored one.

<div class="claim">An explanation you can operate is a small model of the system. Choose the one thing the reader can change, and make it the thing that matters.</div>
