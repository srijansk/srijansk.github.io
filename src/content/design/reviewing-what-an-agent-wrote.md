---
title: "Reviewing what an agent wrote"
summary: "An agent can write a long reference document in an hour. The harder hour is the next one, when a person has to decide what to trust, fix what is wrong, and keep those fixes. A concept for doing that inside the document."
date: 2026-10-14
kind: concept
order: 1
preview: review
---

An agent can now write a forty-page reference document about a codebase or a data warehouse in under an hour. The harder hour is the next one. Someone who did not write it has to decide which sentences to trust, fix the ones that are wrong, and keep those fixes when the agent regenerates the document next week.

Most interfaces for AI output are built for the first hour: a prompt box, a stream of text, a copy button. This concept is about the second. It treats the document as the place where review happens, not a report that sits beside it.

<figure class="wide">
  <iframe src="/design/reviewing-what-an-agent-wrote/prototype.html" title="Interactive prototype: a section of an agent-written reference document with citations, verification state, human edits and per-section review" loading="lazy" class="fig-review-proto"></iframe>
  <figcaption><b>PROTOTYPE</b> — Hover or tap a citation to see the exact source it rests on. Switch the layers on and off. Accept, comment on, or drop each section, then publish or regenerate and see what changes. The content is invented.</figcaption>
</figure>

## What the prototype is arguing

**Every claim shows what it was made from.** A citation is useful only if checking it is cheap. Hovering a citation shows the exact lines it rests on (a code hunk, a query, a sentence from a document) with the path and position, not just a document title. If checking takes two seconds, people check. If it takes two minutes, they trust or distrust the whole document at once.

**Grounded and verified are different states, drawn differently.** A citation proves the agent pointed at something; it does not prove the sentence still matches it. The prototype draws two marks: one for "rests on a source", another for "re-checked against the current source and still holds". Citations raise trust even when they are wrong, so the difference has to be visible.

**Review happens on the sentence it concerns.** When an automated check finds a problem, it appears on the sentence, with the disagreement spelled out: the text says two days, the source says three. A separate audit report is the version nobody reads.

**Nothing moves silently.** Edits made by a person are marked as such and survive the next regeneration. Proposed changes wait in a queue until someone approves them. Every new edition arrives with a summary of what changed: claims added, rewritten, and dropped.

**Disagreement is content.** When two sources conflict, the document says so and shows both, instead of choosing one quietly. A conflict a reader can see is more useful than a confident sentence that hides it.

**No confidence scores.** A number like 0.82 next to a sentence invites false precision. Weak claims get a plain-language hedge; strong ones get nothing.

**Counts open what they count.** "13 flagged" should open those thirteen sentences, filtered, not a directory of everything. That one gets [its own page](/design/counts-are-doors/).

## Review per section, then publish or regenerate

A reviewer rarely wants to accept or reject a whole document. The prototype asks for a decision per section: accept it, comment on it, or drop it. Then there are two ways forward. Publishing applies only the accepted sections and leaves the rest as they were. Regenerating sends the comments back to the agent for the sections that need work, and keeps every accepted section and every human edit exactly as it is.

That split matters because regeneration is where trust usually breaks. If fixing one paragraph means re-running the whole document, every earlier correction is at risk, and reviewers learn not to bother.

## What this does not settle

This is a concept with a working prototype, not a measured product. I have not run a study on it. If I did, I would measure three things: how long it takes a reviewer to confirm or reject a single claim, what share of human edits survive the next regeneration, and how often two reviewers agree on what to accept.

It also leaves hard questions open. Re-checking a citation against a live source is cheap for code and expensive for a warehouse query. A document that changes weekly needs a way to expire old verifications without burying readers in warnings. And a reviewer who accepts a section takes on responsibility for it, which an interface should make explicit rather than incidental.

<div class="claim">An agent's document should be easy to check, easy to correct, and impossible to un-correct by accident.</div>
