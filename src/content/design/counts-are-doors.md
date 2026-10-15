---
title: "Counts are doors"
summary: "Every number on a screen about AI output should open the items it counts. A count you cannot open asks for trust instead of earning it."
date: 2026-10-14
kind: principle
order: 2
preview: tally
---

Screens that report on AI systems are full of numbers: claims written, citations attached, checks failed, sources in conflict. When a number is a dead end, the reader can only take it on faith or ignore it. When it opens the exact items it counts, it becomes the fastest way into the work.

Here is the same summary built as doors. Open any count.

<div class="doors">
  <details class="door">
    <summary><span class="door-n">214</span><span class="door-l">cited claims</span><span class="door-hint">open</span></summary>
    <ul class="door-list">
      <li>Refunds post only after the processor confirms settlement.<i>ledger/settle.py · lines 142–151</i></li>
      <li>Daily totals exclude retried events.<i>jobs/rollup.sql · lines 18–24</i></li>
      <li>Chargebacks reverse the original entry rather than adding a negative one.<i>docs/ledger.md · section 3</i></li>
      <li class="door-more">211 more, grouped by section</li>
    </ul>
  </details>
  <details class="door" open>
    <summary><span class="door-n">13</span><span class="door-l">flagged by the automated check</span><span class="door-hint">open</span></summary>
    <ul class="door-list">
      <li>Settlement window stated as two days.<i>The cited source says three.</i></li>
      <li>Retry rule missing from section 4.<i>It was noted during research and never written.</i></li>
      <li>Fee change dated 11 March.<i>Two sources disagree on the date.</i></li>
      <li class="door-more">10 more, filtered to flagged only</li>
    </ul>
  </details>
  <details class="door">
    <summary><span class="door-n">3</span><span class="door-l">source conflicts</span><span class="door-hint">open</span></summary>
    <ul class="door-list">
      <li>Fee change date: the changelog says 11 March, the config history says 14 March.</li>
      <li>Settlement window: the runbook says two days, the code says three.</li>
      <li>Owner of the rollup job: two teams are listed.</li>
    </ul>
  </details>
  <details class="door">
    <summary><span class="door-n">0</span><span class="door-l">stale citations</span><span class="door-hint">open</span></summary>
    <ul class="door-list">
      <li>All 214 citations were re-checked against the current sources this morning.<i>A zero should open what was checked, and when.</i></li>
    </ul>
  </details>
</div>

## The rules

**Open the filtered list, never the directory.** "13 flagged" opens those thirteen items. Opening a table of all 214 claims with a filter the reader has to find and set turns a door back into a wall.

**One home per number.** Each count is computed in one place and agrees everywhere it appears. If the summary says 13 and the section view says 12, the reader now distrusts both, and the work behind them.

**Count only what the data can support.** If what the system has is "a citation exists", the number says "cited", not "verified". Checking that a cited sentence still matches its source is a different, more expensive fact, and it deserves its own count.

**Zero is a door too.** "0 conflicts" should open what was compared, by what method, and when. Otherwise a zero cannot be told apart from not having looked.

**Coverage before conclusions.** Lead with how much was read and checked, then say what it means. A confident summary over an unknown amount of evidence is the thing these screens exist to prevent.

## Where it applies

I arrived at this while designing review surfaces for documents that agents write, where every number is a claim about work the reader did not see. It applies anywhere a system summarises its own output: evaluation dashboards, test reports, data-quality monitors, and the status line at the end of an agent run.

<div class="claim">A number that cannot be opened is an assertion. A number that can is a door.</div>
