---
title: "Reviewing what an agent wrote"
summary: "A prototype for reviewing a document an agent wrote, built around four places a review goes wrong: nobody clicks the sources, a checked source changes, a section is approved after a partial read, and the next regeneration rewrites a person's fix."
teaser: "Four places a review of an agent's document goes wrong, and a prototype with an answer for each."
date: 2026-10-14
updated: 2026-11-01
kind: concept
surface: people
order: 1
preview: review
---

In a run we traced for [Context Aging](/writing/context-aging/), an essay I wrote with Susnato Dhar, an agent read a two-step rule in its first minute: drop every candidate scoring below a cutoff, then keep the top five. More than twenty minutes and nearly four hundred tool calls later it drafted the section about that rule as "keep the top five", and later rewrote the section without opening the file again. The essay changes the details and keeps the sequence. In the finished document that sentence looked like every other. The only way to catch it was to open the file, and nothing on the page said which lines.

That is the reviewer's position with everything an agent writes. The author will not be in the meeting, and next week the agent will write the document again. Interfaces for AI output mostly serve the drafting. This prototype is about the review, done inside the document, and it is built around four places a review goes wrong. The content is invented; the ideas grew out of review tools I have worked on.

<figure class="wide">
  <iframe src="/design/reviewing-what-an-agent-wrote/prototype.html" title="Interactive prototype: three sections of an invented agent-written reference document, with three guided steps, citations that open their source lines, per-section approval with a receipt, and regeneration with checks tied to the lines they read" loading="lazy" class="fig-review-proto"></iframe>
  <figcaption><b>Prototype.</b> Three things to try are listed above the document: open a citation, approve a section and read its receipt, then request changes and regenerate. In the source panel, change a cited file and watch the checks that rested on it lapse.</figcaption>
</figure>

## You read it and never click

In a pre-registered study of 308 people using an AI assistant, 189 never opened a source ([Kim et al., 2025](https://arxiv.org/abs/2502.08554)). In another experiment, self-reported trust in answers rose when citations were present, even random ones ([Ding et al., 2025](https://arxiv.org/abs/2501.01303)). A reviewer who does not click judges each sentence by the sentence alone, which is how the one in the opening would have passed.

So the state of a sentence has to be readable without a click. In the prototype every citation says what happened to it: checked against its lines, cited but never checked, or flagged with the disagreement spelled out, as in "The sentence says two days; line 37 says three." The counts above the document each step through the sentences they count, so "2 open issues" opens the two sentences rather than only counting them. When fact-checkers attached warnings to some false headlines, people rated the untagged false headlines as more accurate, and tagging the verified headlines as well removed the effect ([Pennycook et al., 2020](https://ideas.repec.org/a/inm/ormnsc/v66y2020i11p4944-4957.html)). A page that flags only its errors invites the same reading, so the dull sentences carry a state too. The checker's marks are blue and a person's are yellow, so a machine check never passes for a human one.

## You check a sentence, and the source changes next week

A citation says where a sentence came from. Whether the source supports it is a separate question: in an audit of generative search engines, only 74.5% of citations supported the sentence they were attached to ([Liu, Zhang and Liang, 2023](https://arxiv.org/abs/2304.09848)). A reference document is read for months, and the lines a sentence rests on get edited in that time.

In the prototype a check is bound to the exact lines it read. When those lines change, only the sentences citing them lose their check; everything else keeps its state. Open citation 1 and press "Change this file": its sentence becomes "needs a re-check" and the rest of the document stays as it was. Two sources that disagree are both shown. GitHub treats a file a reviewer marked as viewed the same way, [unmarking it if the file changes](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request), and Swimm [alerts a team when code changes affect its documentation](https://docs.swimm.io/features/keep-docs-updated-with-auto-sync/). A verification should expire when what it verified changes, and only for the sentences that relied on it.

## You approve a section you only half read

Approving is when a reviewer takes responsibility for a section as written, and it usually follows a partial read, which the prototype shows instead of hiding. Each approval keeps a receipt, such as "Approved by you, 1 of 3 sources opened", where opened means the reviewer clicked through to the lines. Approving a section with an open issue says so before anything is published, and if a source behind an approved section changes first, the approval lapses.

GitHub goes part of the way: a repository can [dismiss an approval as stale](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) when new commits change the diff. Its viewed marks track a reviewer's own progress; nothing records what an approval rested on. The receipt is the part I have not seen elsewhere, and the part reviewers may like least, since it shows how little was opened.

## Next week the agent rewrites over your fix

When a reviewer rewrites a sentence, the sentence becomes theirs. Code generators met this problem long ago. Generated code "should never be edited by hand, otherwise you can't safely regenerate it", so the Generation Gap pattern keeps the handwritten part in a class the generator never touches ([Fowler, after Vlissides](https://www.martinfowler.com/dslCatalog/generationGap.html)). A document cannot be split into two classes, so the rule has to live at the level of the sentence.

In the prototype, Dana has corrected when a day's totals become final. Request changes on "Daily totals" and regenerate: the agent notices that the nightly rollup now starts later, flags Dana's sentence and pins a proposed change under it. The sentence stays as written until someone approves the change. The agent can argue with a person's sentence. It cannot overwrite one. Without that rule every regeneration puts earlier corrections at risk, and reviewers learn not to correct.

## Open questions

I have not tested this with reviewers. The measure I would use is planted errors: put known mistakes into a document and count how many reviewers catch before they publish. Time spent is a poor target, since a fast review can mean the reviewer trusted the agent rather than checked it. The receipt gives a second measure, sources opened per approval, and I would want to know whether showing it changes it.

The checker itself can be wrong: a check that says a sentence holds can miss an error, and the prototype has no way to show how often that happens. Re-checking costs differ too: a line of code is cheap to re-read and a warehouse query is not, so how often to re-check depends on the source.

The proposed sentence in the Retries section is also the rule followed into an agent's session in [When knowledge reaches the agent](/design/when-knowledge-reaches-the-agent/). What a person approves here is what the next agent should receive there.
