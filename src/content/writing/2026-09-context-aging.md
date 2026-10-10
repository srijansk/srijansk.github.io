---
title: "Context Aging: What an Agent Forgets While It Is Still Running"
publication: "Srijan Saket"
date: 2026-09-14
teaser: "An agent can lose a fact it is still holding: read in its first minute, never truncated, missing from what it writes twenty minutes later. A working name for that, what we built against it, and a null result."
dek: "An agent can lose a fact it is still holding: read in its first minute, never truncated, missing from the section it drafts twenty minutes later. What we measured from both ends of one system, what we built against it, and why the first end-to-end result was a null."
excerpt: "An agent read a two-step rule in its first minute and drafted it, more than twenty minutes later, as one step. Nothing had been truncated. I call the turn-indexed form of that loss context aging: a working lens rather than a new variable, because neither the published measurements nor ours can yet separate it from length. Susnato Dhar and I built a ledger the agent writes at the moment of observation, reads back before drafting, and is checked against in code before it may close a section. The check worked. The score did not move. This post covers why, and the experiment that would settle the rest."
tags: [agents, context-engineering, memory]
coauthors: ["Susnato Dhar"]
series: "Context as a ranking problem"
seriesOrder: 2
thumbnail: "/writing/context-aging/plate.svg"
socialImage: "/writing/context-aging/card.png"
featured: true
draft: false
---

The agent opened the file in its first minute. The rule it needed had two steps: drop every candidate scoring below a cutoff, then keep the top five. More than twenty minutes later it drafted the section that described that rule, and the rule had become "keep the top five." Later in the run it rewrote the same section, and still did not open the file again. A second rule in the same run lost one of its two branches the same way.

The details are changed here; the sequence is what the trace showed. Nothing had been truncated. Every read in that run had finished within its first five minutes, and the file was still in the history the model was reading from, verbatim. It had stopped shaping what the agent wrote.

<div class="claim">An observation can still be in an agent's context and no longer change what the agent writes. That gap is the failure this post is about.</div>

Susnato Dhar and I have measured this from both ends of one system. On the reading side, an agent consumes a long reference document to answer questions. On the writing side, an agent produces that document over runs of 270 to 350 turns in a single continuous conversation. Both lose information after they have found it. This post covers what we instrumented, what we built, what the first end-to-end tests showed, and what nobody, including us, has yet separated.

## Three fixes that don't fix it

The instinct on seeing that section is one of three.

**A bigger window.** The rule was already in the window; nothing had been cut. A bigger window keeps more material in, and the measurements below suggest that more material makes early facts weaker, not stronger.

**A better model.** I have not replayed these runs on a stronger model, so I cannot rule this out. Laban and colleagues found the turn effect described below in all fifteen models they tested, and found it more muted in the more capable ones. A better model may shrink this; I would not bet on it removing it.

**Better retrieval.** Search found the file. The loss came after it. On the reading side we measured this directly at [five points along the path from a source to an answer](/writing/retrieval-is-not-delivery/): at baseline, only 22% of the expected excerpts the research agent had actually read made it into its message to the writer. Most of the loss came after retrieval.

## Rot, position, poison, and age

The literature has good names for three ways a context fails.

**How much.** Chroma's [Context Rot](https://www.trychroma.com/research/context-rot) study ran 18 models and found that *"models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows."* [NoLiMa](https://arxiv.org/abs/2502.05167) sharpened it: once the needle has to be inferred rather than matched, 11 of 13 models fall below half their short-context score by 32K tokens. The variable is length.

**Where.** [Lost in the Middle](https://arxiv.org/abs/2307.03172): performance is highest when the relevant information sits at the beginning or end of the input and *"significantly degrades when models must access relevant information in the middle."* The variable is position.

**What.** Drew Breunig's [taxonomy](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html) of poisoning, distraction, confusion and clash is mostly about content: a hallucination that gets referenced, superfluous material that shapes the answer, accumulated information that conflicts with the prompt. The variable is contamination.

The rule in the opening was correct, and nothing had been cut. The context was long, which matters. What the three names do not foreground is time: the number of turns between seeing a fact and needing it. Agent loops count in turns, so I call the turn-indexed form of these effects **context aging**.

It is a lens, not a fourth variable I can isolate. The closest published measurements all see early material losing force inside the window, and none of them separates age from length. Laban and colleagues measured [the conversational version](https://arxiv.org/abs/2505.06120): when a task arrives in pieces over several turns, models *"make assumptions in early turns and prematurely attempt to generate final solutions, on which they overly rely,"* with an average drop of 39% against the same task given at once. In their summarisation task, eighth-turn summaries drew 20% of their citations from documents introduced in turn eight and 8% from documents introduced in turns two and three, and they name the effect *loss-in-middle-turns*. Our rule was read early but not first, which is where their models looked least. Li and colleagues found [instruction drift within eight rounds](https://arxiv.org/abs/2402.10962) of a conversation and attribute it in part to attention decaying over long exchanges. [PI-LLM](https://arxiv.org/abs/2506.08184) shows earlier information interfering with recall of later updates, a working-memory limit "beyond context length" in its title's words.

The closest study to the opening is a [2026 paper](https://arxiv.org/abs/2604.20911) of 4,416 trials across 12 models. On its most affected model, compliance with an early formatting prohibition fell from 73% at turn 5 to 33% at turn 16 while the instruction was still in the window. Its author attributes the decay to accumulated tokens diluting attention: token volume, not turn depth, was the significant predictor, and the paper presents itself as extending lost-in-the-middle to the retention of behavioural constraints. So it shows early material losing force without being cut. It does not show age acting apart from length, and neither do we.

<figure class="wide">
  <a class="fig-zoom" href="/writing/context-aging/figures/four-variables.svg"><img src="/writing/context-aging/figures/four-variables.svg" alt="Four rows, each a strip of context cells inside the same frame. How much: every cell is used less reliably as the window fills. Where: cells are strong at both ends and faint in the middle. What: one cell is marked wrong. When: an early cell is bright, but the line of its influence fades before the strip reaches the present." width="1000" height="490" loading="lazy" decoding="async" /></a>
  <figcaption><b>FIG. 01</b> — Four lenses on one window. Rot is how much, lost-in-the-middle is where, poisoning is what. Aging is when: the turns between seeing a fact and needing it. In every measurement I know of, aging grows together with length, so treat it as the lens an agent loop can act on rather than as a separate cause.</figcaption>
</figure>

Why use the name at all, then? Because it points at something a loop can act on. You cannot make a long run short without losing the work it did, but you can control when a fact comes back. Manus rewrites a to-do file so that the agent is [*"reciting its objectives into the end of the context"*](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus), explicitly to avoid lost-in-the-middle. What follows is that move made systematic for evidence: write the value down when it is seen, bring it back right before it is used, and check in code that it arrived. None of that depends on which mechanism is right. If the cause is length, the value returns at the end of the window; if it is turns, the value returns fresh.

Two mechanisms are on offer, and both operate inside the window. One is dilution: attention behaves like a budget (Anthropic's [context-engineering guide](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) uses exactly that word), and every later token takes a share of it, which is a story about length. The other is anchoring, Laban's early assumptions that later turns fail to revise. In our data neither is separable from length. The experiment that would separate them holds token count and position fixed and varies only the turns since an observation; a second version holds turns fixed and varies how similar the intervening material is. I have not run either.

## What we instrumented

On the reading side, the five measurement points from the [earlier post](/writing/retrieval-is-not-delivery/): search, read, pass on, check live, answer.

On the writing side, the traces said three things. First, the writer works in two phases. A trace audit of five runs found no reads at all after the first draft: the writer explores, then drafts from what it has. In the run from the opening, the section was rewritten more than half an hour after the last read.

Second, timing decides whether a prompt is obeyed. A nudge to open files a draft cited but the agent had not read fired ten times in one run and was followed zero times, because every draft came after the last read. A gate that forced reads before the first draft was obeyed: it named four files, and the agent read eight.

Third, the agent will go back when it has room. In a focused replay with an ample budget, it re-read its cited source before fixing a section three times out of three, in both arms of the comparison. In full runs, budget pressure is part of why it does not.

Under all three sat a structural fact. The writer had nowhere to put an observation except the conversation: no notes, no saved results, no findings list between exploring and writing. Whatever it saw either became a sentence at once or stayed in the history and aged. In one diagnosed run, four of the claims it got wrong were facts it had read and then drafted without their specifics; about five were never retrieved at all.

Not everything that looks like forgetting is. One early pipeline repeated the same query 247 times in a row, because the harness had resumed it past its own final answer. In the run from the opening, the agent spent the quarter of an hour between its last read and its first draft re-citing ten values 326 times. Both are a loop with nothing to tell it that it has stopped learning anything, and the harness is the first place to look. Exact repeats of a warehouse query are now served from a cache.

## Failure 1: the handoff to another agent

I have written about this one [already](/writing/retrieval-is-not-delivery/), so briefly. A research agent read the right source and passed the answer writer a fluent summary; the summary kept the gist and dropped the exclusion, the source and the condition, and the writer could not tell anything was missing. A structured evidence record (finding, verbatim excerpt, source, conditions, open gap, in separate fields), together with the changes around it, took the share of read excerpts that reached the writer from 22% to 60%.

That post was about the boundary between two agents. This one is about the boundary between an agent and its own past, and it behaves the same way. A summary is a lossy codec. So is a long conversation.

## Failure 2: the handoff to your own past

The writer had two ways to hold an observation: draft a sentence from it immediately, or leave it in the conversation. Anything in the second category aged. The fix has three parts.

**A note, at observation time, with the value.** A tool appends one row to a findings ledger the moment a document-worthy fact is seen: the finding, its source, and the value that matters, whether a constant, a date or a threshold. For the rule from the opening, the row is roughly this:

```text
finding    candidate selection has two steps, not one
value      keep score ≥ p60, then the top 5
source     selection.py, lines 40–58
noted_at   minute 1
status     not yet drafted
```

**A read-back before drafting.** The prompt tells the writer to page through the ledger before it drafts each section, so a section is written against everything learned rather than against whatever is still vivid. This is the recitation move from above, applied to evidence instead of goals.

**A gate, in code, between collected and done.** When the writer closes a section, the harness checks every value noted before that section began against the whole drafted text. A fresh note gets one section's grace, since it may belong to the next section; at the final close, everything outstanding counts. If a value is missing, the close is refused once, with the list, and a second attempt passes, so the gate cannot trap the writer in a loop. At final verification, a deterministic pass compares the whole ledger with the document and returns anything still unencoded as a revision directive.

The ledger lives on the harness side, on the run's state, not in the conversation. It survives compaction, it [survives a crash](/writing/completion-is-a-proof/), and it is written out with the run. That placement is the point of the design: it turns *collected but never encoded* into something code refuses at the moment, rather than something an evaluation finds two weeks later.

<figure class="wide">
  <iframe src="/writing/context-aging/figures/run-replay.html" title="Interactive: scrub through a 40-turn schematic run and watch observations age; toggle the ledger to see them reinstated before drafting" loading="lazy" class="fig-run-replay"></iframe>
  <figcaption><b>FIG. 02</b> — Scrub the run. Without a ledger, each observation's effect fades with the turns since it was made, and later sections are drafted from whatever is still vivid. With one, noted values are read back before drafting and checked before a section closes. The decay curve is a schematic, and the ledger arm is perfect by construction; the measured result is in the next section.</figcaption>
</figure>

## What the first measurements showed

The first implementation of the ledger is Susnato's; my part was the validation and the wording of the read-back. The first two end-to-end runs used a different benchmark from the reading side, a 60-claim rubric over long-form documents, and bundled the ledger with other changes.

The binding worked. Both runs used the ledger heavily, the gate refused to close sections dozens of times, and the values that were noted reached the text. Recall did not rise. What got noted followed the emphasis of the rest of the bundle and crowded out breadth: the runs leaned on one kind of source, cited far fewer of the others, and left two kinds uncited altogether. The two runs were also one claim apart, the most consistent pair we measured on that benchmark. Pairing the ledger with an explicit floor for each kind of source removed the displacement in the next pair of runs, and whether that raises the score is the same open question at two runs. A later version that enforced the gate more strictly passed 11 of 12 compliance checks across three runs, and the mean score stayed inside the noise.

So the ledger is measured to bind, and not yet measured to help. My working reading is that noting spends from the same budget as exploring: a writer told to write things down writes down what it is pointed at, and looks at less of everything else. A gate can tell you that a value reached the text. It cannot tell you that it was the right value to be looking for. The controlled comparison, the ledger alone against the same configuration without it at three or more repeats, is still owed, and after [measuring the noise floor](/writing/your-eval-has-a-noise-floor/) I will not quote a delta before it exists.

## Failure 3: compaction without a destination

Long runs approach provider limits, and the naive response, summarising the transcript, is Failure 1 applied to the agent's own memory. The people who have shipped this say so. Anthropic: [*"the art of compaction lies in the selection of what to keep versus what to discard."*](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) Cognition: compressing a history into *"key details, events, and decisions … is hard to get right"*, they [fine-tuned a model for it](https://cognition.com/blog/dont-build-multi-agents), and it *"will still eventually hit a limit."* [ACE](https://arxiv.org/abs/2510.04618) names two ways repeated rewriting fails: *brevity bias*, which drops domain insight for concise summaries, and *context collapse*, where *"iterative rewriting erodes details over time"*; its remedy is structured, incremental updates instead of rewrites. A [2026 paper](https://arxiv.org/abs/2606.11213) names four failures of summary-based compaction (unpredictable lossiness, destruction of causal structure, blocking model cost, compression-induced hallucination) and replaces it with a deterministic, LLM-free policy that sheds only *"action episodes whose effects are already persisted."* One session ran 89 sequential tasks across 80 million tokens with no measurable loss against isolated runs.

That last clause is the rule. Our compaction instructions name the tier: keep the run's progress and its open threads, keep anything not yet written to the ledger or a draft, and drop raw material that already is. Manus states the same rule for web pages: [*"the content of a web page can be dropped from the context as long as the URL is preserved."*](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)

Compaction is only safe if there is somewhere for facts to go other than the summary. Design the durable tier first; then *drop the file contents* becomes a safe instruction by construction, for everything the tier holds.

## Failure 4: re-reading what you have already seen

After compaction wipes the history, the agent cannot know it has read a file before. The cheapest primitive we built is an already-read cache: a second read of the same file returns a pointer, *you read this earlier; here is its shape*, instead of the bytes. It saves budget, and it doubles as the read-set that later gates consult.

It also has a cost I should own. A pointer that says *you have read this* assumes the reading is still effective, which is exactly the assumption aging breaks; in the opening, re-opening the file was the cure. The version I would build now returns a pointer only for what the tier already holds, with that source's ledger rows attached, and lets the agent re-read a cited span whenever it is about to draft from it.

## Three tiers, and the rule between them

What these failures share is a confusion about which tier a fact lives in.

<figure class="wide">
  <a class="fig-zoom" href="/writing/context-aging/figures/three-tiers.svg"><img src="/writing/context-aging/figures/three-tiers.svg" alt="Three stacked tiers. Working context: small, expensive, aging, what the current step needs. Task memory: durable, structured, with provenance: the ledger, evidence records, the workspace, the already-read set. Long-term memory: the reference document and its index, which outlive the task. Arrows between the top two tiers: note at observation, review before drafting, draft from the tier, and a gate in code before a section closes." width="1000" height="590" loading="lazy" decoding="async" /></a>
  <figcaption><b>FIG. 03</b> — Working context is what the model reasons over now: small, expensive, and aging. Task memory is durable and structured, and every row carries where it came from. Long-term memory outlives the task. The four moves between the top two tiers are the design: note, review, draft, gate.</figcaption>
</figure>

The rule for what stays in working context: what the current step needs to decide, plus the constraints that would make the step wrong if forgotten. Everything else goes to the durable tier with provenance attached, so that it can come back as a citation rather than as a memory.

The field converged on the tiers before it converged on the rule. [MemGPT](https://arxiv.org/abs/2310.08560) framed the model as an operating system paging between a small main context and a large external store. Manus makes the file system the store. Anthropic's research agent [saves its plan to memory before it starts](https://www.anthropic.com/engineering/multi-agent-research-system), *"since if the context window exceeds 200,000 tokens it will be truncated."* [Zep](https://arxiv.org/abs/2501.13956) gives the store two clocks, when a fact was recorded and when it was true, and invalidates superseded facts instead of deleting them, which is what lets a tier answer *what was the rule in March* without lying. And [RaMem](https://arxiv.org/abs/2606.22844) names what happens to a tier without provenance: *context collapse*, memories that have lost the conditions needed to judge whether they are evidence for this query at all. (ACE uses the same name for details eroded by repeated rewriting; the two are cousins.) A durable tier does not fade the way a conversation does. It ages into ambiguity instead.

Which brings this post back to the series it belongs to. Once the facts are in a tier, deciding what to bring back into working context is a ranking problem. The [Generative Agents](https://arxiv.org/abs/2304.03442) work scored every memory by recency, importance and relevance (recency an exponential decay, factor 0.995 per hour of simulated time since the memory was last retrieved) and summed them. Recency is one feature of three, not the score. A durable tier without a ranker is just a bigger haystack; [the previous post](/writing/agent-context-is-a-recommendation-problem/) is about what the ranker should look like.

## A checklist

1. **Externalise at observation time, with the value.** The number, the date, the threshold and the source, in a row, the moment it is seen.
2. **Draft from the tier, not from recall.** Read the ledger back before writing each section, so the value is fresh where it is used.
3. **Make the check forcing, and put it before the step.** Advice delivered while drafting was ignored; a requirement before drafting was obeyed. Scan the draft for every noted value before a section closes, and refuse once, with the list.
4. **Write compaction instructions that name the tier.** Keep what is not yet noted or drafted. Drop what is.
5. **Return a pointer only for what the tier holds.** Attach that source's ledger rows, and let the agent re-read a cited span on demand.
6. **Measure survival, not similarity.** The question is not whether the fact was retrieved. It is whether the value the agent saw in minute one is in the thing it shipped.
7. **Score the outcome, not the compliance.** A gate that is obeyed every time can leave the score where it was. Look for what the new work displaced.

## What this does not prove

Aging here is a lens, not a separated cause. Every measurement I know of, ours included, lets age and length grow together. The experiment that would separate them holds token count and position fixed and varies only the turns since an observation, then holds turns fixed and varies how similar the intervening material is. I would like someone to run it, and would be glad to be told that aging is rot with a clock on it.

The ledger is measured to bind and not to help. The first two runs bundled it with other changes on a different benchmark; the stricter version raised compliance without moving the mean; neither is the controlled comparison, which is still owed at three or more repeats. A related lesson makes me cautious: a coverage gate that forced bounded reads before the first draft fixed the coverage symptom in every run we tried, and end-to-end scores did not move, because the bottleneck had shifted to drafting.

The ledger is not free either. Every note is a tool call, and in one later run notes took about a third of the tool-call budget. *Document-worthy, with a value that matters* is a judgment the model still has to make, and I have not measured how often it gets that judgment wrong in either direction.

The reading-side numbers come with a regression I have reported before: exact-document retrieval fell from 40% to 14% over the same versions, and we never established why.

External memory is not free of loss; it moves the loss to the write. In Mem0's [own paper](https://arxiv.org/abs/2504.19413) the memory system scores 66.9 against 72.9 for the full transcript on the same benchmark, winning on latency and tokens rather than accuracy. A [2026 cost-performance study](https://arxiv.org/abs/2603.04814) finds long context beats fact memory on recall for two of three benchmarks and that memory suits *"stable, factual attributes suited to flat-typed extraction."* The case for a durable tier is long runs and survival through compaction, not accuracy in the small. If your run fits in the window and ends before anything ages, keep the transcript.

And a wrong fact in the tier is a wrong fact with provenance. A ledger makes poisoning more durable, not less. The gate checks that noted values were *used*; it does not check that they were *right*.

All numbers are self-measured: one internal evaluation of 45 questions on the reading side, a handful of diagnosed writing runs, and two- and three-run comparisons on a 60-claim benchmark, all on one model family.

<div class="claim">Write it down when you see it, bring it back when you need it, check that it arrived, and then check whether any of that moved the score.</div>
