---
title: "Reviewing what an agent wrote"
summary: "A prototype for reviewing a document an agent wrote, built around four places a review goes wrong: most readers never click the sources, a checked source changes, a section is approved after a partial read, and the next regeneration rewrites a person's fix."
teaser: "Four places a review of an agent's document goes wrong, and a prototype with an answer for each."
date: 2026-10-14
updated: 2026-11-01
kind: concept
surface: people
order: 1
preview: review
---

An agent read a two-step rule in its first minute: drop every candidate scoring below a cutoff, then keep the top five. More than twenty minutes and nearly four hundred tool calls later it drafted the section about that rule as "keep the top five", and later rewrote it without opening the file again. The run is from [Context Aging](/writing/context-aging/), an essay I wrote with Susnato Dhar; it changes the details and keeps the sequence. A sentence like that reads like any other. Catching it means opening the file, and a page that cites no lines gives a reviewer nowhere to start.

That is the reviewer's position with everything an agent writes. The agent cannot be asked what it meant, and next week it will write the document again. This prototype is about the review, done inside the document, and its sections follow the order a reviewer works in. The content is invented; the ideas grew out of review tools I have worked on.

<figure class="wide">
  <iframe src="/design/reviewing-what-an-agent-wrote/prototype.html" title="Interactive prototype: three sections of an invented agent-written reference document, with four guided steps, citations that open their source lines, per-section approval with a receipt, and regeneration with checks tied to the lines they read" loading="lazy" class="fig-review-proto"></iframe>
  <figcaption><b>Prototype.</b> Four things to try are listed above the document, one for each section below: open a citation, change a cited file and watch its check lapse, approve a section and read its receipt, then request changes and regenerate.</figcaption>
</figure>

## You read it and never click

In a pre-registered study of 308 people using an AI assistant, 189 never opened a source, though the sources still reduced reliance on wrong answers and the people who clicked were more often right ([Kim et al., 2025](https://arxiv.org/abs/2502.08554)). In another experiment, self-reported trust in answers rose when citations were present, even random ones ([Ding et al., 2025](https://arxiv.org/abs/2501.01303)). A reviewer who does not click judges each sentence by the sentence alone, which is how the one in the opening would have passed.

So the state of a sentence has to be readable without a click. In the prototype every citation says which of five things happened to it: checked against its lines, cited but never checked, flagged, in conflict, or stale because the lines it rests on changed. A flag spells out the disagreement, as in "The sentence says two days; line 37 says three.", and a conflict shows both sources. Each count above the document steps through the sentences it counts: "2 open issues" opens the two sentences. When fact-checkers attached warnings to some false headlines, people rated the untagged false headlines as more accurate, and tagging the verified headlines as well removed the effect ([Pennycook et al., 2020](https://ideas.repec.org/a/inm/ormnsc/v66y2020i11p4944-4957.html)). A page that flags only its errors invites the same reading, so the dull sentences carry a state too. Checker marks are blue and a person's are yellow, so one never passes for the other.

## You check a sentence, and the source changes next week

A citation says where a sentence came from, not whether the source supports it: in a 2023 audit of generative search engines, only 74.5% of citations supported the sentence they were attached to ([Liu, Zhang and Liang, 2023](https://arxiv.org/abs/2304.09848)). A reference document is read for months, and its lines get edited in that time.

In the prototype a check is bound to the exact lines it read. When those lines change, only the sentences citing them lose their check; everything else keeps its state. Open citation 1 and press "Change this file": its sentence becomes "needs a re-check" and nothing else moves. GitHub treats a file a reviewer marked as viewed the same way, [unmarking it if the file changes](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request), and Swimm [keeps copied code snippets in sync and flags the document when a change affects them](https://docs.swimm.io/features/keep-docs-updated-with-auto-sync/). This adds the same expiry for prose, one sentence at a time.

## You approve a section you only half read

Approving is when a reviewer takes responsibility for a section as written, and it often follows a partial read, which the prototype shows instead of hiding. Each approval keeps a receipt, such as "Approved by you, 2 of 3 sources opened", where opened means the reviewer clicked through to the lines. Approving a section with an open issue says so before anything is published, and if a source behind an approved section changes first, the approval lapses.

GitHub records the diff an approval covered and can [dismiss the approval as stale](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) when new commits change it, and Reviewable records [which files each reviewer marked as reviewed at which revision](https://docs.reviewable.io/files.html). Both record the diff or the reviewer's declaration. Recording what the reviewer opened is the part I have not seen elsewhere, and the part reviewers may like least, since it shows how little was opened.

## Then the agent rewrites over your fix

When a reviewer rewrites a sentence, the sentence becomes theirs. Generated code "should never be edited by hand, otherwise you can't safely regenerate it", so the Generation Gap pattern keeps the handwritten part in a class the generator never touches ([Fowler, after Vlissides](https://www.martinfowler.com/dslCatalog/generationGap.html)), and EMF moved the rule inside the file, leaving any method without its @generated tag untouched ([EMF docs](https://help.eclipse.org/latest/topic/org.eclipse.emf.doc/references/overview/EMF.html)). Shared editors have the other half, a change a reader may suggest and only the owner can accept ([Google Docs](https://support.google.com/docs/answer/6033474)). This prototype joins the two with the roles reversed: the agent suggests, and a sentence is protected because a person wrote it.

In the prototype, Dana has corrected when a day's totals become final. Request changes on "Daily totals" and regenerate: the agent notices that the nightly rollup now starts later, flags Dana's sentence and pins a proposed change under it. The sentence stays as written until someone approves the change. Without that rule every regeneration puts earlier corrections at risk, and reviewers learn not to correct.

## Open questions

I have not tested this with reviewers. The measure I would use is planted errors: put known mistakes into a document and count how many each reviewer catches before publishing. The receipt gives a second measure, sources opened per approval, and I would want to know whether showing the receipt changes the number.

The checker has a blind spot the opening shows. That sentence agreed with its lines and left a step out, and a check that compares a sentence with its source can say they disagree, not that the sentence says less. It would have carried a tick here. What bears on it is the receipt: an approval with no sources opened is a reviewer who never looked.

The proposed sentence in the Retries section is the rule that [When knowledge reaches the agent](/design/when-knowledge-reaches-the-agent/) carries into an agent's session.
