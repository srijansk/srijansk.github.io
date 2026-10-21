---
title: "Reviewing what an agent wrote"
summary: "A working prototype for reviewing a document an agent wrote, and the reasoning behind it. The rule underneath: what a person corrected or approved, the agent cannot quietly undo."
teaser: "Review inside the document an agent wrote, where a person's corrections and approvals outrank the agent."
date: 2026-10-14
updated: 2026-10-21
kind: concept
surface: people
order: 1
preview: review
---

Writing a long reference document is now an agent's job. Reviewing it is still a person's, and most of the work comes after the first draft: someone who did not write it decides which sentences to trust, fixes the wrong ones, and needs those fixes to survive when the agent writes the next version. Interfaces for AI output mostly serve the drafting. This prototype is about the review, done inside the document rather than in a report beside it. The content is invented; the ideas grew out of review tools I have worked on.

<figure class="wide">
  <iframe src="/design/reviewing-what-an-agent-wrote/prototype.html" title="Interactive prototype: three sections of an invented agent-written reference document, with citations that open their source lines, per-section approval, regeneration, and checks tied to the lines they read" loading="lazy" class="fig-review-proto"></iframe>
  <figcaption><b>Prototype.</b> Open a citation to see the lines it rests on. Approve, request changes to, or reject each section, then publish or regenerate. In the source panel, change a cited file and watch which checks lapse.</figcaption>
</figure>

## A person's correction outranks the agent

When a reviewer rewrites a sentence, the sentence becomes theirs. In the prototype, Dana has corrected when a day's totals become final. Regenerate that section and the agent notices that the nightly rollup now starts later: it flags Dana's sentence and pins a proposed change underneath, and the sentence stays exactly as written until someone approves the change. The agent can argue with a person's sentence. It cannot overwrite one.

Code generators met this problem long ago. Generated code "should never be edited by hand, otherwise you can't safely regenerate it", so the Generation Gap pattern keeps the handwritten part in a class the generator never touches ([Fowler, after Vlissides](https://www.martinfowler.com/dslCatalog/generationGap.html)). A document cannot be split into two classes, so the same rule has to live at the level of the sentence. Without it, every regeneration puts earlier corrections at risk, and reviewers soon stop correcting.

## Approving is a signature

A reviewer who approves a section takes responsibility for it as written, so the approval records what they looked at. The prototype keeps a receipt with each approval, such as "Approved by you, 2 of 3 sources opened", where opened means the reviewer clicked through to the lines. Approving a section that still has an open issue says so before anything is published, and if a source behind an approved section changes before publishing, the approval lapses.

GitHub goes part of the way. A repository can [dismiss an approval as stale](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) when new commits change the diff. Its "viewed" marks, though, only track a reviewer's own progress; nothing records what the approval rested on. That receipt is the part I have not seen elsewhere.

## A check lasts as long as the text it read

A citation says where a sentence came from. Whether the source supports it is a separate question: in an audit of generative search engines, only 74.5% of citations supported the sentence they were attached to ([Liu, Zhang and Liang, 2023](https://arxiv.org/abs/2304.09848)). In the prototype a sentence is cited, checked or flagged, and a flag spells out the disagreement, as in "The sentence says two days; line 37 says three." Two sources that disagree are both shown.

Every check records the exact lines it read. When those lines change, only the sentences citing them lose their check; everything else keeps its state. GitHub treats a file a reviewer marked as viewed the same way: [if the file changes, it is unmarked](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request). A verification should expire when what it verified changes, and only for the sentences that relied on it. Swimm does something similar for documentation, [alerting teams when code changes affect it](https://docs.swimm.io/features/keep-docs-updated-with-auto-sync/).

## Most readers never click

In a pre-registered study of 308 people working with an AI assistant, 189 never opened a single source ([Kim et al., 2025](https://arxiv.org/abs/2502.08554)). Citations still shape belief: in another experiment, trust in answers rose when citations were present, even when the citations were random ([Ding et al., 2025](https://arxiv.org/abs/2501.01303)). So the state of each sentence has to be readable without clicking. The counts above the prototype's document each step through the sentences they count, and the source panel is there for the reviewer who wants the lines.

Marking only the problems is not enough. When fact-checkers attached warnings to some false headlines, people rated the untagged false headlines as more accurate; in a second study, about which headlines to share, tagging verified headlines as well removed the effect ([Pennycook et al., 2020](https://ideas.repec.org/a/inm/ormnsc/v66y2020i11p4944-4957.html)). A page that flags its errors and leaves everything else plain invites the same reading, so every citation in the prototype says what happened to it. The checker's marks are blue and a person's are yellow, so a machine check never passes for a human one. Where the agent is unsure, the sentence says why in words ("the only source is a code comment"), which tells the reviewer what to check.

## Open questions

I have not tested this with reviewers. The measure I would use is planted errors: put known mistakes into a document and count how many reviewers catch before they publish. Time spent is a poor target, since a fast review can mean the reviewer trusted the agent rather than checked it.

The checker itself can be wrong. A check that says a sentence holds can miss an error, and the prototype has no way to show how often its checker misses. Re-checking costs differ too: re-reading a line of code is cheap, while re-running a warehouse query can be expensive, so how often to re-check depends on what the source costs to read.

The proposed sentence in the Retries section is also the rule followed into an agent's session in [When knowledge reaches the agent](/design/when-knowledge-reaches-the-agent/). What a person approves here is what the next agent should receive there.
