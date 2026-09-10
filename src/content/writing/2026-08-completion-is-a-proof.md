---
title: "Completion Is a Proof, Not a Status"
publication: "Srijan Saket"
date: 2026-08-22
teaser: "A coding agent is not finished when its stream closes. It is finished when its processes are dead, its output is drained, and its workspace is durable — and the runtime can show evidence for all three."
dek: "A coding agent is not finished when its stream closes. It is finished when its processes are dead, its output is drained, and the workspace it changed is durable — and the runtime can show evidence for all three."
excerpt: "A command in a remote sandbox wrote one unbroken 4 MiB line. The HTTP stream returned no output and no terminal event, the producer was still alive blocked on its pipe, and the request had already discarded the handle used to cancel it. To the caller the tool call was over. To the machine the computation had not ended. Four independent clocks settle at the end of an agent run, and most platforms compress all four into a single status field."
coauthors: ["Vivek Sharma"]
tags: [agents, systems, reliability]
series: "Evidence-carrying systems"
seriesOrder: 2
featured: true
draft: true
---

A command in a remote coding-agent sandbox wrote one unbroken 4 MiB line. The HTTP stream returned no output and no terminal event. The producer was still alive, blocked on its pipe — and the request had already cleaned up the ordinary handle used to cancel it.

To the caller, the tool call was over. To the machine, the computation had not ended.

Retrying at that moment could run the same logical command twice. Releasing the sandbox could discard files it had changed. Showing a green *done* badge would convert genuine uncertainty into a stated fact.

<div class="claim">A closed connection is evidence about transport. It is not evidence about the process, its output, or the durability of its effects.</div>

This class of bug matters because coding agents do more than call short APIs. They compile projects, run test suites, install packages, start servers, and write artifacts. Each action crosses several systems that fail independently: the model, the workflow, the HTTP request, the process owner, the log store, and the workspace store.

What follows is the contract <b>Vivek Sharma</b> and I arrived at, the probes we used to qualify it, and the parts we still cannot prove.

## One status hides four clocks

Most agent products compress the end of a run into a single state: running, succeeded, failed, lost. At least four clocks settle independently.

1. **Transport** — did the request or stream return?
2. **Process** — can the command, or any descendant it started, still execute?
3. **Output** — have stdout and stderr been drained to a known final byte?
4. **Workspace** — are the resulting files present in a verified, restorable checkpoint?

Their order is not fixed, which is the entire difficulty. A request can vanish while the command continues. A parent can exit while a child holds a pipe open. Output can drain before an asynchronous upload finishes. The model can emit a final response anywhere on that timeline — and that response is an intent to close, not proof that closing is safe.

<figure class="wide">
  <img src="/writing/completion-is-a-proof/figures/four-clocks.svg" alt="Animated timeline showing four independent lanes — transport, process, output, workspace — settling at different times, with the safe completion point occurring only after the last one settles." width="1000" height="420" loading="lazy" decoding="async" />
  <figcaption><b>FIG. 01</b> — A returned request is only the first clock to settle. Safe completion waits for process quiescence, output drain, and a verified workspace checkpoint. The gap between the first and last settle is where duplicate execution and lost files live.</figcaption>
</figure>

## Replace the status with receipts

The useful abstraction is not a larger state machine. It is a small set of evidence receipts, each produced by the component that actually has the authority to make that claim.

- The **session runtime** owns the process tree and the byte log. Its receipt proves the process cannot continue, names the final output cursor, and records the last workspace mutation associated with the session.
- The **workspace service** owns durable publication. Its receipt names a committed mutation watermark, an immutable checkpoint manifest, and the runtime generation permitted to write it.
- The **close protocol** freezes admission, waits for every admitted session, verifies that the checkpoint covers their terminal mutations, and only then publishes success and releases compute.

<figure>
  <img src="/writing/completion-is-a-proof/figures/completion-authorities.svg" alt="Diagram showing three authorities — session runtime, workspace service, close protocol — each certifying only facts it can observe, joined into a single completion decision." width="920" height="500" loading="lazy" decoding="async" />
  <figcaption><b>FIG. 02</b> — No component is asked to certify a fact it cannot observe. The close protocol exposes success only after joining the runtime and workspace receipts.</figcaption>
</figure>

This makes status a projection over durable facts rather than a value someone writes. If the process receipt is present but the checkpoint receipt is missing, the task is not vaguely *stuck*. It is waiting for one named authority to settle one named obligation — and a retry can re-run the join without re-running the command.

## Five rules for agent runtimes

### 1. Identity must outlive transport

A logical command needs a stable invocation key and an immutable command digest. If admission is retried, the runtime should return the existing session rather than launch a replacement. An HTTP request ID, a UI call ID, or a stream connection is not that identity — each can disappear while the process survives.

### 2. Logs are byte records, not lines

Line readers have size limits, and program output is not always text. Drain fixed-size byte chunks into an append-only log with a monotonic cursor; decode and truncate later, for the model or the UI. The control path should retain the bytes and let a new reader resume after its last acknowledged cursor.

### 3. The model is not the process supervisor

Timeouts, signal escalation, output drain, and recovery must continue when there is no reader and no model turn in flight. Polling a command from the prompt burns context and makes runtime safety depend on whether the model remembers to keep asking. The model decides *what* to run; the runtime owns *how it ends*.

### 4. Unknown is a real state

If a process owner disappears, a missing session record is not proof that its child died. Freeze new workspace admission while the runtime inspects a reachable owner, terminates the owned process tree, or destroys the exact dedicated sandbox. Until one of those produces positive evidence, do not relaunch and do not manufacture a terminal state.

### 5. Close is a join, not a callback

Store the model's final response as pending. Seal the set of admitted sessions. Settle every session. Advance durable publication through the largest terminal mutation receipt. Create the checkpoint manifest last, and read back that exact version. Then — and only then — publish the outcome and release the runtime.

```text
complete(task) =
  admission_is_sealed
  AND every_session_has(death_proof, final_output_cursor)
  AND checkpoint_covers(max_terminal_mutation)
  AND checkpoint_manifest_reads_back_exactly
```

## What the probes found

We isolated the runtime from the model and ran specified synthetic commands against a live managed sandbox. These are exact contract observations from a qualification run — not aggregate success rates, and not a claim that every provider fails the same way.

<div class="table-scroll">

| Probe | Stream-shaped path | Session contract |
|---|---|---|
| Retry identity | The same lookup ID executed twice | The same specification returned one child process |
| 4 MiB line | 0 output events, 0 terminal events; producer still blocked | 4,194,304 bytes replayed in 71 contiguous events |
| Quiet deadline | A 1 s request completed after 4.205 s | A reader-independent 1.5 s deadline plus 0.5 s grace escalated TERM to KILL |
| Binary output | A 256-byte probe returned an exit event and 0 payload bytes | A 1,024-byte arbitrary payload replayed with an identical SHA-256 digest |
| Reader loss | The process survived disconnect, but no reattach or replay API existed | Sixteen 20 s quiet and noisy sessions ran unread, then replayed complete output |

</div>

The 4 MiB case was not ordinary truncation. A line-oriented reader met an approximately 64 KiB limit; the child blocked while writing; the stream cleaned up; and the runtime lost its ordinary control handle in the process. Byte-oriented drain fixed the size assumption, and durable session identity kept control reachable after the reader disappeared. Two different bugs wearing one symptom.

The quiet timeout failed for the opposite reason. Elapsed time was only checked when output arrived, so silence prevented the timeout loop from running at all — the deadline was structurally unreachable in exactly the case it existed for. Moving the clock into an independent process owner made it independent of both output and readers.

## A review checklist for any agent platform

You do not need this architecture to run the test. Ask the team operating any long-running agent:

- What stable key prevents a retried tool call from launching a duplicate command?
- Who owns the process after the request, worker, or model turn disappears?
- Can a new reader replay output from an acknowledged byte cursor?
- What proves the entire descendant process tree can no longer execute?
- What filesystem mutation must the final checkpoint cover?
- Is the checkpoint manifest immutable, and verified by an exact-version read-back?
- Does an unknown process outcome block relaunch, or get relabelled as failure?
- Can the platform explain *which receipt* allowed it to show success?

If the answers reduce to *the stream ended*, *the exit code was zero*, or *the model said it was done*, the platform has a status. It does not yet have a completion contract.

## What this does not prove

Evidence-carrying completion is a safety contract under explicit assumptions. It is not formal verification, and it is not a promise of continuous availability. If an isolated runtime cannot be inspected or destroyed, close may remain blocked — that is the intended behaviour, and it is still an outage. Bytes lost before reaching any durable surface cannot be reconstructed. Effects outside the managed workspace — an API call, a database write, an email — need their own transaction or compensation mechanism, and nothing here provides one.

The evidence is also narrower than a finished benchmark. The traces above are qualification records rather than a public corpus. High-concurrency remote stress and several provider-specific recovery paths remain unmeasured. We have not published a latency distribution from process exit through verified task success. Those are the next experiments, not numbers to infer from the probes.

## The larger shift

Recent systems work is making environment state, recovery, and external effects explicit: [Agent libOS](https://arxiv.org/abs/2606.03895) gives long-running agents stable runtime primitives; [Crab](https://arxiv.org/abs/2604.28138) and [AgentRewind](https://arxiv.org/abs/2608.14380) coordinate recovery with environment state; [Cordon](https://arxiv.org/abs/2606.17573) stages tool effects behind a semantic transaction. Completion is the adjacent boundary, and it is still mostly unguarded: what evidence permits the system to finalise the run at all?

<div class="claim">Across system boundaries, completion should be evidence a runtime can show — not merely a status it can set.</div>
