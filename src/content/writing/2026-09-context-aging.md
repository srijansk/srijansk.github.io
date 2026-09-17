---
title: "Context Aging: What an Agent Forgets While It Is Still Running"
publication: "Srijan Saket"
date: 2026-09-14
teaser: "Long-running agents don't fail when the window fills. They fail earlier — when what they observed forty calls ago is still in the context and no longer effective."
dek: "Long-running agents don't fail when the window fills. They fail earlier, when what they observed forty calls ago is still in the context and no longer effective. The fix is not a bigger window. It is to stop treating the conversation as the memory."
excerpt: "An agent read a pricing rule with two constant eras at tool call 12 — correctly, aloud, in its own reasoning. Two hundred and eighty calls later, the document it finished described the rule with one constant. Nothing had been truncated; the fact was in the context the whole time. Context rot, lost-in-the-middle and context poisoning are about how much, where, and what. This is about when — and why the fix is a durable tier the agent writes to at the moment of observation, reads back before it drafts, and is checked against by code before it is allowed to say it is done."
tags: [agents, context-engineering, memory]
coauthors: ["Susnato Dhar"]
series: "Context as a ranking problem"
seriesOrder: 2
thumbnail: "/writing/context-aging/plate.svg"
socialImage: "/writing/context-aging/card.png"
featured: true
draft: false
---

The agent read the pricing rule at tool call 12. Two constants, two eras, a cutover date — it quoted all three back in its own reasoning, correctly. Then it kept going: two hundred and eighty more calls across a codebase, a warehouse and a query log, drafting sections of a long technical reference as it went. The section on pricing, written near the end of the run, described the rule with one constant.

Nothing had been truncated. The run was well inside the window. The observation at call 12 was still there, verbatim, in the history the model was reading from. It had simply stopped mattering.

<div class="claim">An observation can be present in an agent's context and no longer effective. That gap — present, not effective — is the failure, and it has a shape that length alone does not explain.</div>

I have now measured this from both ends of one system, with <b>Susnato Dhar</b>. On the reading side, an agent that consumes a long reference document to answer questions. On the writing side, the agent that produces that document, over runs of 270 to 350 turns in a single continuous conversation. Both fail the same way at different scales. What follows is what we instrumented, what we built, what moved, what did not, and why I think the field is currently filing this failure under the wrong name.

## Three fixes that don't fix it

The instinct on seeing the pricing section is one of three.

**A bigger window.** But the fact was in the window. The runs where this happened were using a fraction of their capacity. This is not overflow.

**A better model.** I cannot rule this one out from evidence, and I say so at the end. But look at what a better model would have to do. It would not need to read better — it read the rule correctly. It would need to weigh an observation from 280 calls ago the same as one from two calls ago, and the multi-turn literature below says that is precisely what models do not do.

**Better retrieval.** The search worked. The agent opened the right file at call 12 and read the right lines. On the reading side we measured this directly at [five checkpoints along the path from a source to an answer](/writing/retrieval-is-not-delivery/): at baseline the agent *found* 65% of the expected facts while reading, and 22% of that evidence survived to the next stage. Retrieval was the stage that was already working.

Each fix addresses a different variable. None of them is the variable that moved.

## Rot, position, poison — and age

The literature has good names for three ways a context fails, and they are about three different variables.

**How much.** Chroma's [Context Rot](https://www.trychroma.com/research/context-rot) study ran 18 models and found that *"models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows."* [NoLiMa](https://arxiv.org/abs/2502.05167) sharpened it: once the needle has to be inferred rather than matched, 11 of 13 models fall below half their short-context score by 32K tokens. The variable is length.

**Where.** [Lost in the Middle](https://arxiv.org/abs/2307.03172): performance is highest when the relevant information sits at the beginning or the end of the input and *"significantly degrades when models must access relevant information in the middle."* The variable is position.

**What.** Drew Breunig's [taxonomy](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html) — poisoning, distraction, confusion, clash — is mostly about content: a hallucination that gets referenced, superfluous material that shapes the answer, accumulated information that conflicts with the prompt. The variable is contamination. (Distraction sits on the border with length; I come back to it under repetition.)

The failure at call 12 is none of these. The context was not long. The fact was not in the middle — it was early, at the good end of the U. It was not wrong. What had changed was **when**: the effectiveness of an observation decays with the number of turns since it was made, even while it stays in the window. I call this **context aging**, and I think it earns its own name for a practical reason: it takes a different fix from the other three.

<figure class="wide">
  <img src="/writing/context-aging/figures/four-variables.svg" alt="Four rows, each a strip of context cells. Length: the strip overflows its frame. Position: the middle cells are faded. Contamination: one cell is marked wrong. Age: an early cell is bright but its influence fades to nothing by the time the strip reaches the present." width="1000" height="490" loading="lazy" decoding="async" />
  <figcaption><b>FIG. 01</b> — Four ways a context fails, four variables. Rot is how much; lost-in-the-middle is where; poisoning is what. Aging is when — and it is the only one where the fact is short, well-placed, correct, and still lost.</figcaption>
</figure>

The nearest published measurement I know of is a [2026 study of 4,416 trials across 12 models](https://arxiv.org/abs/2604.20911): a prohibition stated early in a conversation loses force as turns pass — complied with 73% of the time at turn 5, 33% at turn 16 — and token-matched controls show length explains only part of it. That study measures constraints, not evidence, so I hold it loosely. But it is decay by turn, with the instruction still present, which is the shape I am describing. [Laban and colleagues](https://arxiv.org/abs/2505.06120) supply the mechanism from the other side: in multi-turn conversation, models *"make assumptions in early turns and prematurely attempt to generate final solutions, on which they overly rely"* — a 39% average drop against the same task asked all at once. Early material is over-relied on as a *conclusion* and under-used as *evidence*. Anchoring and aging are two faces of one failure: the model does not go back and read.

Why would an observation age at all? Two mechanisms, and both predict decay by turn rather than by length. The first is dilution. Attention is a budget — Anthropic's [context-engineering guide](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) uses exactly that word — and every later token takes a share of it; in Gamage's token-matched controls, the *content* that accumulated over the turns, not its token count, accounted for 62–100% of the decay. The second is anchoring: a model that has already drawn a conclusion from an observation prefers the conclusion to the observation, and a conclusion drawn at call 12 is what call 292 reaches for. If aging were only rot in disguise, holding the token count fixed would erase it. It does not.

## What we instrumented

On the reading side, the five checkpoints from the [earlier post](/writing/retrieval-is-not-delivery/): search, read, pass on, check live, answer.

On the writing side, three instruments. A trace audit asked a single question of every run: does the writer ever re-read a source after it has drafted from it? Zero of five runs. A second audit inserted advisory nudges — *consider re-checking what you found earlier* — into the run at intervals; they fired ten times and were acted on zero times. The third was a transcript study of three other systems given the same task and the same sources. Every one of them kept an external evidence store between exploring and writing: checkpoint notes, a locker of saved query results, a findings file with one claim per line. Ours had none. Across the audits, *collected but never encoded* was the single largest loss channel between what the agent had seen and what it finished.

## Failure 1: the handoff to another agent

I have written about this one [already](/writing/retrieval-is-not-delivery/), so briefly. A research agent read the right source and passed the answer writer a fluent summary; the summary kept the gist and dropped the exclusion, the source and the condition, and the writer could not tell anything was missing. Replacing the free-form summary with a structured evidence record — finding, verbatim excerpt, source, conditions, open gap, in separate fields — took the share of exact evidence surviving the handoff from 22% to 60%, and the share reaching the final answer from 23% to 51%.

Same numbers, different lens. That post was about the boundary between two agents. This one is about the boundary between an agent and its own past, and it turns out to be the same boundary. A summary is a lossy codec. So is a long conversation.

## Failure 2: the handoff to your own past

The writer had two ways to hold an observation: draft a sentence from it immediately, or leave it in the conversation. Anything in the second category aged. The fix has three parts, and the third is the one that matters.

**A note, at observation time, with the value.** A tool that appends one row to a findings ledger the moment a document-worthy fact is seen: the finding, its source, and the load-bearing value — the constant, the date, the threshold. Not a summary of the file. The number. For the rule from the opening, the row is roughly this:

```text
finding    fee rate has two eras, not one
value      0.030 through 2024-03-10 · 0.035 from 2024-03-11
source     billing/fees.py, lines 142–158
noted_at   call 12
status     not yet drafted
```

**A read-back before drafting.** The prompt tells the writer to page through the ledger before it drafts each section, so a section is written against everything learned rather than against whatever is still vivid. Manus does something structurally similar for goals — rewriting its to-do file so it is [*"reciting its objectives into the end of the context"*](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) — and it is worth naming what that is: re-observation. A fact that is re-read is young again.

**A gate, in code, between collected and done.** When the writer declares a section finished, the harness scans whether each value noted while exploring that section appears anywhere in the drafted text. If one does not, the finalize is refused once, with the list. Once: acknowledge-and-proceed, so it cannot loop. The same scan runs over the whole document at final verification and returns anything still unencoded as a revision directive.

The ledger lives on the harness side, on the run's state, not in the conversation. It survives compaction, it [survives a crash](/writing/completion-is-a-proof/), and it is written out with the run. That placement is the point of the design: it makes *collected but never encoded* something code refuses at the moment, rather than something an eval finds two weeks later.

<figure class="wide">
  <iframe src="/writing/context-aging/figures/run-replay.html" title="Interactive: scrub through a 40-turn run and watch observations age; toggle the ledger to see them reinstated before drafting" loading="lazy" class="fig-run-replay"></iframe>
  <figcaption><b>FIG. 02</b> — Scrub the run. Without a ledger, each observation's effect on the draft fades with the turns since it was made, and the draft at the end is written from whatever is still vivid. With one, noted values are read back before drafting and checked before the section closes. The decay curve is a schematic, not a measurement.</figcaption>
</figure>

I cannot yet give you the delta. The validation is in progress against a locked prompt at three or more repeats, because the last time I trusted a single run [it turned out to be weather](/writing/your-eval-has-a-noise-floor/). What I can say is what the gate changed in kind: the loss channel became visible to code. The first implementation of the ledger is Susnato's; my part was the validation and the wording of the read-back.

## Failure 3: compaction without a destination

Long runs approach provider limits, and the naive response — summarise the transcript — is Failure 1 applied to the agent's own memory. Everyone I have read who has shipped this says the same thing. Anthropic: [*"the art of compaction lies in the selection of what to keep versus what to discard."*](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) Cognition: compressing a history into *"key details, events, and decisions … is hard to get right"*, they [fine-tuned a model for it](https://cognition.com/blog/dont-build-multi-agents), and it *"will still eventually hit a limit."* A [2026 paper](https://arxiv.org/abs/2606.11213) names four failures of summary-based compaction — unpredictable lossiness, destruction of causal structure, blocking model cost, compression-induced hallucination — and replaces it with a deterministic, LLM-free policy that sheds only *"action episodes whose effects are already persisted."* One session ran 89 sequential tasks across 80 million tokens with no measurable loss against isolated runs.

That last clause is the rule. Our version is a set of compaction instructions that name the tier: preserve which sections are drafted, finalised and pending and what each still needs; preserve open threads; preserve **key facts, numbers and source references not yet noted to the ledger or drafted into a section**. Drop file contents and query bodies that have already been noted, drafted or ruled out. Manus states the same rule for web pages — [*"the content of a web page can be dropped from the context as long as the URL is preserved."*](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)

Compaction is only safe if there is somewhere for facts to go other than the summary. Design the durable tier first; then *drop the file contents* becomes a safe instruction by construction, for everything the tier holds.

## Failure 4: re-reading what you have already seen

After compaction wipes the history, the agent cannot know it has read a file before. The cheapest primitive we built is an already-read cache: a second read of the same file returns a pointer — *you read this twelve calls ago; here is its shape* — instead of the bytes. The agent can recognise that it is re-asking, and behave accordingly. The same record doubles as the read-set that later gates consult. It matters for aging in a second way: a full re-read is the opposite of compaction — it puts bytes the tier already holds back into the window, where they start aging all over again.

## Failure 5: aging shows up as repetition

Forgetting is only half of how aging presents. In one run the agent issued the same warehouse query 247 times in a row. In another it padded 326 citations from 10 distinct values. Breunig's *distraction* is this at a larger scale — Gemini 2.5 Pro repeating historical actions past 100K tokens instead of synthesising new ones — and Laban's *over-reliance* is the same thing seen from inside the model. Every pacer in our writer is a step counter. There is no notion of marginal utility, no duplicate-query detection, and no elapsed time on any model-facing surface: the agent cannot know it is seventy minutes into a ninety-minute budget. The fix is designed and not built — a novelty guard that returns a cached pointer for a hash-normalised repeat, and a stale-streak nudge — so it goes in the list of things this post does not prove.

## Three tiers, and a rule for each

What all five failures share is a confusion about which tier a fact lives in.

<figure class="wide">
  <img src="/writing/context-aging/figures/three-tiers.svg" alt="Three stacked tiers. Working context: small, expensive, aging — what the current step needs. Task memory: durable, structured, with provenance — the ledger, the workspace, the evidence envelope. Long-term memory: the reference document and its index, which outlive the task. Arrows: note at observation, review before drafting, draft from the tier, gate before done." width="1000" height="590" loading="lazy" decoding="async" />
  <figcaption><b>FIG. 03</b> — Working context is what the model reasons over now: small, expensive, and aging. Task memory is durable and structured, and every row carries where it came from. Long-term memory outlives the task. The four arrows are the whole design: note, review, draft, gate.</figcaption>
</figure>

The rule for what stays in working context: what the current step needs to decide, plus the constraints that would make the step wrong if forgotten. Everything else goes to the durable tier with provenance attached, so that it can come back as a citation rather than as a memory.

The field converged on the tiers before it converged on the rule. [MemGPT](https://arxiv.org/abs/2310.08560) framed the model as an operating system paging between a small main context and a large external store. Manus makes the file system the store. Anthropic's research agent [saves its plan to memory before it starts](https://www.anthropic.com/engineering/multi-agent-research-system), *"since if the context window exceeds 200,000 tokens it will be truncated."* [Zep](https://arxiv.org/abs/2501.13956) gives the store two clocks — when a fact was recorded and when it was true — and invalidates superseded facts instead of deleting them, which is what lets a tier answer *what was the rule in March* without lying. And [RaMem](https://arxiv.org/abs/2606.22844) names what happens to a tier without provenance: *context collapse*, memories that have lost the conditions needed to judge whether they are evidence for this query at all. A durable tier does not fade the way a conversation does. It ages into ambiguity instead.

Which brings this post back to the series it belongs to. Once the facts are in a tier, deciding what to bring back into working context is a ranking problem. The [Generative Agents](https://arxiv.org/abs/2304.03442) work scored every memory by recency, importance and relevance — recency an exponential decay, factor 0.995 per hour of simulated time since the memory was last retrieved — and summed them. Recency is one feature of three, not the score. A durable tier without a ranker is just a bigger haystack; [the previous post](/writing/agent-context-is-a-recommendation-problem/) is about what the ranker should look like.

## A checklist

1. **Externalise at observation time, with the value.** The number, the date, the threshold, and the source — in a row, the moment it is seen. Not a summary of the file.
2. **Draft from the tier, not from recall.** Read the ledger back before writing each section. Re-observation is the only thing that makes an old fact young.
3. **Put a code check between collected and done.** Scan the draft for every noted value before a section is allowed to close. Refuse once, with the list.
4. **Write compaction instructions that name the tier.** Preserve what is not yet noted or drafted. Drop what is. Compaction is safe exactly for what the tier already holds.
5. **Expose *already seen* as a pointer, not a payload.** A record of what the model has read, returned as shape rather than bytes.
6. **Measure survival, not similarity.** The question is not whether the fact was retrieved. It is whether the value the agent saw at call 12 is in the thing it shipped at call 292.

## What this does not prove

The reading-side numbers come with a regression I have reported before: exact-document retrieval fell from 40% to 14% as the agent got better at using the map instead of opening the source. It stayed unresolved.

The ledger's effect on end-to-end quality is not yet validated at three or more repeats, and I have deliberately not quoted a delta. A related lesson makes me cautious: a coverage gate that forced bounded reads before the first draft fixed the coverage symptom in every run we tried, and end-to-end scores did not move, because the bottleneck had shifted to drafting. Necessary, not sufficient, and I expect the ledger to be argued about the same way.

The two studies I leaned on for the aging claim measure constraints and conversations, not evidence use. The evidence-use version — an observed value going missing from a shipped artifact as turns pass — is our measurement and my interpretation of its shape. I would like someone to measure it properly, holding length fixed and varying only the age of the observation.

External memory is not free of loss; it moves the loss to the write. In Mem0's [own paper](https://arxiv.org/abs/2504.19413) the memory system scores 66.9 against 72.9 for the full transcript on the same benchmark, winning on latency and tokens rather than accuracy. A [2026 cost-performance study](https://arxiv.org/abs/2603.04814) finds long context beats fact memory on recall for two of three benchmarks and that memory suits *"stable, factual attributes suited to flat-typed extraction."* The case for a durable tier is long runs and survival through compaction — not accuracy in the small. If your run fits in the window and ends before anything ages, keep the transcript.

And a wrong fact in the tier is a wrong fact with provenance. A ledger makes poisoning more durable, not less. The gate checks that noted values were *used*; it does not check that they were *right*.

The ledger is not free either. Every note is a tool call, and a writer that notes everything has replaced aging with bloat — a second transcript, with better formatting. *Document-worthy, with a load-bearing value* is a judgment the model still has to make, and I have not measured how often it gets that judgment wrong in either direction.

I have not replayed the failing run on a stronger model, so a better model is not ruled out. What is ruled out is the reason to expect one to help: the observation was read correctly, and the loss happened afterwards.

All numbers are self-measured, on one internal evaluation of 45 questions and a handful of writing runs, on one model family.

<div class="claim">The conversation is not the memory. It is where memory goes to age.</div>
