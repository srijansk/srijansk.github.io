---
title: "Reviewing what an agent wrote"
summary: "A working prototype for reviewing a document an agent wrote, and the reasoning behind it. The rule underneath: what a person corrected or approved, the agent cannot quietly undo."
date: 2026-10-21
teaser: "Review inside the document an agent wrote, where a person's corrections and approvals outrank the agent."
kind: concept
surface: people
order: 1
preview: review
---

Writing a long reference document is now an agent's job. Reviewing it is still a person's, and most of the work comes after the first draft: someone who did not write it decides which sentences to trust, fixes the wrong ones, and needs those fixes to survive when the agent writes the next version. Interfaces for AI output mostly serve the drafting: a prompt, a stream of text, a copy button. This prototype is about the review, done inside the document rather than in a report beside it. The content is invented, and the prototype is a reconstruction; it grew out of review tools I have worked on.

<figure class="wide">
  <iframe src="/design/reviewing-what-an-agent-wrote/prototype.html" title="Interactive prototype: three sections of an invented agent-written reference document, with citations that open their source lines, per-section approval, regeneration, and checks tied to the lines they read" loading="lazy" class="fig-review-proto"></iframe>
  <figcaption><b>PROTOTYPE</b> — Open a citation to see the lines it rests on. Approve, request changes to, or reject each section, then publish or regenerate. In the source panel, change a cited file and watch which checks lapse.</figcaption>
</figure>

## A person's correction outranks the agent

When a reviewer rewrites a sentence, the sentence becomes theirs. On the next run the agent may propose a change to it, and the proposal waits for someone to accept it, but the agent never writes over it. In the prototype, Dana has corrected when a day's totals become final. Regenerate as often as you like: her sentence stays, marked as hers, and the source panel shows the agent's sentence she replaced. Without this rule every regeneration is a gamble with earlier corrections, and reviewers soon stop correcting.

## Approving is a signature

A reviewer who approves a section takes responsibility for it as written, so the approval should record what they looked at. The prototype keeps a receipt with each approval ("approved by you, 2 of 3 sources opened"), and approving a section that still has an open issue says so before anything is published. Code review already works this way. GitHub shows how many files a reviewer has marked as viewed, and a repository can [dismiss an approval as stale](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) when new commits change the diff. A document an agent maintains deserves the same.

## A check lasts as long as the text it read

A citation says where a sentence came from, not that the source supports it. In an audit of generative search engines, only 74.5% of citations supported the sentence they were attached to ([Liu, Zhang and Liang, 2023](https://arxiv.org/abs/2304.09848)). The prototype therefore keeps three states apart: a sentence can be cited, checked, or flagged, and a flag spells out the disagreement ("the text says two days; the cited line says three").

Every check records the exact lines it read. When those lines change, only the sentences citing them lose their check and show "source changed since the check"; everything else keeps its state. GitHub does the same with a file a reviewer has marked as viewed: [if the file changes, it is unmarked](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/reviewing-proposed-changes-in-a-pull-request). This is the answer I would give to the question of when a verification should expire: when what it verified changes, not on a calendar, and not all at once.

## Most readers never click

In a pre-registered study of 308 people using an AI assistant, 189 never opened a single source ([Kim et al., 2025](https://arxiv.org/abs/2502.08554)). Citations still shape belief: in another experiment, trust in answers rose when citations were present, even when the citations were random ([Ding et al., 2025](https://arxiv.org/abs/2501.01303)). So the state of each sentence has to be readable without clicking. In the prototype the marks on the page carry it, and the source panel is for the reviewer who wants the lines.

Marking only the problems is not enough. When fact-checkers attached warnings to some false headlines, people rated the untagged false headlines as more accurate, and tagging verified headlines as well removed the effect ([Pennycook et al., 2020](https://ideas.repec.org/a/inm/ormnsc/v66y2020i11p4944-4957.html)). A document that flags its errors and leaves everything else plain invites the same reading, so every citation in the prototype says what happened to it. Where the agent is unsure, the sentence says why in words ("the only source is a code comment"), which tells the reviewer what to go and check.

## What already exists

Several products cover part of this. NotebookLM, Perplexity and Claude's citations show where a statement points. Google Docs suggestion mode, Cursor's accept and reject per change, and pull-request review let a person decide on each change once. Swimm [alerts teams when code changes affect their documentation](https://docs.swimm.io/features/keep-docs-updated-with-auto-sync/), and Google's Code Wiki [regenerates the documentation after each change](https://developers.googleblog.com/introducing-code-wiki-accelerating-your-code-understanding/). What I have not seen together is the combination this prototype argues for: corrections that survive regeneration, approvals that record what was examined, and checks bound to the text they read.

## What this does not settle

I have not tested this with reviewers. The measure I would use is planted errors: put known mistakes into a document and count how many reviewers catch before they publish. Speed is the wrong target, because a faster review often means leaning on the agent more when it is wrong.

Two questions stay open. An automated check can say a sentence holds when it does not, so the prototype draws the machine's check differently from a person's approval, but it cannot say how often the checker misses. And re-reading a cited line of code is cheap, while re-running a cited warehouse query can be expensive; how often to re-check depends on what the source costs to read.
