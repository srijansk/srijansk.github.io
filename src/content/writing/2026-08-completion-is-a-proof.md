---
title: "Completion Is a Proof, Not a Status"
publication: "Srijan Saket"
date: 2026-08-22
teaser: "A coding agent is not finished when its stream closes. It is finished when its processes are dead, its output is drained, and its workspace is durable, and the runtime can show evidence for all three."
dek: "A coding agent is not finished when its stream closes. It is finished when its processes are dead, its output is drained, and the workspace it changed is durable, and the runtime can show evidence for all three."
excerpt: "A command in a remote sandbox wrote one unbroken 4 MiB line. The HTTP stream returned no output and no terminal event, the producer was still alive blocked on its pipe, and the request had already discarded the handle used to cancel it. To the caller the tool call was over. To the machine the computation had not ended. Four independent clocks settle at the end of an agent run, and many platforms compress all four into a single status field."
coauthors: ["Vivek Sharma"]
tags: [agents, systems, reliability]
series: "Evidence-carrying systems"
seriesOrder: 2
thumbnail: "/writing/completion-is-a-proof/plate.svg"
socialImage: "/writing/completion-is-a-proof/card.png"
featured: true
draft: false
---

A command in a remote coding-agent sandbox wrote one unbroken 4 MiB line. The HTTP stream returned no output and no terminal event. The producer was still alive, blocked on its pipe, and the request had already cleaned up the ordinary handle used to cancel it.

To the caller, the tool call was over. To the machine, the computation had not ended.

Retrying at that moment could run the same logical command twice. Releasing the sandbox could discard files it had changed. Showing a green *done* badge would convert real uncertainty into a stated fact.

<div class="claim">A closed connection is evidence about transport. It is not evidence about the process, its output, or the durability of its effects.</div>

This class of bug matters because coding agents do more than call short APIs. They compile projects, run test suites, install packages, start servers, and write artifacts. Each action crosses several systems that fail independently: the model, the workflow, the HTTP request, the process owner, the log store, and the workspace store.

What follows is the contract <b>Vivek Sharma</b> and I arrived at, the probes we used to qualify it, and the parts we still cannot prove.

None of the parts is new. The thesis is the [end-to-end argument](https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf): in Saltzer, Reed and Clark's careful file transfer, the transfer is declared committed only after the receiver reads the file back from disk and the checksums match. The rules are settled practice: idempotency keys, cursor-based log replay, systemd's TERM-then-KILL across a control group, Kubernetes' Unknown pod phase and at-most-one StatefulSets, and durable execution, which I have [written about before](https://bitsnneurons.substack.com/p/crash-proof-custom-agents). What is easy to skip in an agent runtime is the join at the end of a run.

## One status hides four clocks

Many agent products compress the end of a run into a single state: running, succeeded, failed, lost. At least four clocks settle independently.

1. **Transport**: did the request or stream return?
2. **Process**: can the command, or any descendant it started, still execute?
3. **Output**: have stdout and stderr been drained to a known final byte?
4. **Workspace**: are the resulting files present in a verified, restorable checkpoint?

They can settle in any order. A request can vanish while the command continues. A parent can exit while a child holds a pipe open. Output can drain before an asynchronous upload finishes. The model can emit a final response anywhere on that timeline, and that response is an intent to close, not proof that closing is safe.

<figure class="wide">
  <!-- Inlined from figures/four-clocks.svg (canonical; edit there, then re-inline).
       Inline rather than <img> so the page's print and reduced-motion rules apply:
       an <img> sub-document would print at frame zero, i.e. empty. -->
  <a class="fig-zoom" href="/writing/completion-is-a-proof/figures/four-clocks.svg">
  <svg xmlns="http://www.w3.org/2000/svg" id="fc" viewBox="0 0 1000 420" width="1000" height="420" role="img"
       aria-labelledby="title desc" font-family="Inter, system-ui, -apple-system, 'Segoe UI', sans-serif">
    <title id="title">Four clocks settling independently at the end of an agent run</title>
    <desc id="desc">Four horizontal lanes — transport, process, output, workspace — each settling at a different point on the same timeline. In this run, transport settles first. The span between the transport settle and the workspace settle is marked as the window in which a run looks finished but is not, where duplicate execution and lost files occur. Safe completion is only at the last settle.</desc>
    <style>
      #fc .lane-label { font-size: 14.1px; fill: #1A1A1A; font-weight: 600; }
      #fc .lane-sub { font-size: 11.75px; fill: #595959; }
      #fc .kicker { font-size: 11.75px; fill: #595959; letter-spacing: .11em; text-transform: uppercase; }
      #fc .tick { font-size: 11.75px; fill: #595959; }
      #fc .flag { font-size: 14.1px; fill: #0A5C38; font-weight: 600; }
      #fc .danger { font-size: 12.9px; fill: #9B4A2F; font-weight: 600; }
      #fc .danger-sub { font-size: 12.9px; fill: #9B4A2F; }
      #fc .bar { fill: #0A5C38; opacity: .82; }
      #fc .bar { animation: grow .85s cubic-bezier(.4,0,.2,1) both; }
      #fc .late { animation: fade .45s ease-out both; }
      @keyframes grow { from { width: 0; } }
      @keyframes fade { from { opacity: 0; } }
      #fc #b1 { animation-delay: .15s } #fc #d1 { animation-delay: 1.00s }
      #fc #b2 { animation-delay: .75s } #fc #d2 { animation-delay: 1.60s }
      #fc #b3 { animation-delay: 1.35s } #fc #d3 { animation-delay: 2.20s }
      #fc #b4 { animation-delay: 1.95s } #fc #d4 { animation-delay: 2.80s }
      #fc #zone { animation-delay: 1.15s }
      #fc #safe { animation-delay: 2.90s }
      @media (prefers-reduced-motion: reduce), print {
        #fc .bar, #fc .late { animation: none; }
      }
    </style>
    <rect width="1000" height="420" fill="#FFFFFF"/>
    <text class="kicker" x="30" y="28">One run · four independent clocks</text>
    <g class="late" id="zone">
      <rect x="412" y="52" width="414" height="272" fill="rgba(155,74,47,0.07)"/>
      <line x1="412" y1="52" x2="412" y2="324" stroke="#9B4A2F" stroke-width="1.25" stroke-dasharray="3 3" opacity=".65"/>
      <text class="danger" x="424" y="348">The window where a run looks finished and is not</text>
      <text class="danger-sub" x="424" y="366">Retry here duplicates work. Release here discards files.</text>
    </g>
    <g>
      <text class="lane-label" x="30" y="82">Transport</text>
      <text class="lane-sub"   x="30" y="98">did the stream return?</text>
      <rect x="190" y="68" width="740" height="22" rx="2" fill="#F4F4EF" stroke="#E5E5E0"/>
      <rect id="b1" class="bar" x="190" y="68" width="222" height="22" rx="2"/>
      <circle class="late" id="d1" cx="412" cy="79" r="5" fill="#0A5C38"/>
      <text class="lane-label" x="30" y="147">Process</text>
      <text class="lane-sub"   x="30" y="163">can it still execute?</text>
      <rect x="190" y="133" width="740" height="22" rx="2" fill="#F4F4EF" stroke="#E5E5E0"/>
      <rect id="b2" class="bar" x="190" y="133" width="385" height="22" rx="2"/>
      <circle class="late" id="d2" cx="575" cy="144" r="5" fill="#0A5C38"/>
      <text class="lane-label" x="30" y="212">Output</text>
      <text class="lane-sub"   x="30" y="228">drained to a final byte?</text>
      <rect x="190" y="198" width="740" height="22" rx="2" fill="#F4F4EF" stroke="#E5E5E0"/>
      <rect id="b3" class="bar" x="190" y="198" width="488" height="22" rx="2"/>
      <circle class="late" id="d3" cx="678" cy="209" r="5" fill="#0A5C38"/>
      <text class="lane-label" x="30" y="277">Workspace</text>
      <text class="lane-sub"   x="30" y="293">checkpointed and verified?</text>
      <rect x="190" y="263" width="740" height="22" rx="2" fill="#F4F4EF" stroke="#E5E5E0"/>
      <rect id="b4" class="bar" x="190" y="263" width="636" height="22" rx="2"/>
      <circle class="late" id="d4" cx="826" cy="274" r="5" fill="#0A5C38"/>
    </g>
    <g class="late" id="safe">
      <line x1="826" y1="52" x2="826" y2="324" stroke="#0A5C38" stroke-width="1.25"/>
      <polygon points="826,46 820,56 832,56" fill="#0A5C38"/>
      <text class="flag" x="826" y="38" text-anchor="middle">safe to complete</text>
    </g>
    <line x1="190" y1="324" x2="930" y2="324" stroke="#D8D8D2"/>
    <text class="tick" x="190" y="342">model emits final response</text>
    <text class="tick" x="930" y="342" text-anchor="end">receipts joined</text>
    <line x1="30" y1="386" x2="970" y2="386" stroke="#E5E5E0"/>
    <text class="lane-sub" x="30" y="404">A status field can only record one of these. A completion contract joins all four.</text>
  </svg>
  </a>
  <figcaption><b>FIG. 01</b> — One possible order, in which the request returns first. Whatever the order, safe completion waits for process quiescence, output drain, and a verified workspace checkpoint. Between the first and last settle, a retry can duplicate work and a release can lose files.</figcaption>
</figure>

## Replace the status with receipts

The useful abstraction is a small set of evidence receipts, each produced by the component that has the authority to make that claim.

- The **session runtime** owns the process tree and the byte log. Its receipt proves the process cannot continue, names the final output cursor, and records the last workspace mutation associated with the session.
- The **workspace service** owns durable publication. Its receipt names a committed mutation watermark, an immutable checkpoint manifest, and the runtime generation permitted to write it.
- The **close protocol** freezes admission, settles every admitted session, verifies that the checkpoint covers their terminal mutations, and only then publishes success and releases compute.

<figure class="wide">
  <a class="fig-zoom" href="/writing/completion-is-a-proof/figures/completion-authorities.svg"><img src="/writing/completion-is-a-proof/figures/completion-authorities.svg" alt="Diagram showing three authorities (session runtime, workspace service, close protocol), each certifying only facts it can observe, joined into a single completion decision." width="1000" height="500" loading="lazy" decoding="async" /></a>
  <figcaption><b>FIG. 02</b> — No component is asked to certify a fact it cannot observe. The close protocol exposes success only after joining the runtime and workspace receipts.</figcaption>
</figure>

This makes status a projection over durable facts rather than a value someone writes. If the process receipt is present but the checkpoint receipt is missing, the task is waiting for one named authority to settle one named obligation, and a retry can re-run the join without re-running the command.

## Five rules for agent runtimes

### 1. Identity must outlive transport

A logical command needs a stable invocation key and an immutable command digest. If admission is retried, the runtime should return the existing session rather than launch a replacement. An HTTP request ID, a UI call ID, or a stream connection is not that identity: each can disappear while the process survives.

### 2. Logs are byte records, not lines

Line readers either cap line length or buffer without bound, and program output is not always text. Drain fixed-size byte chunks into an append-only log with a monotonic cursor; decode and truncate later, for the model or the UI. The control path should retain the bytes and let a new reader resume after its last acknowledged cursor.

### 3. The model is not the process supervisor

Timeouts, signal escalation, output drain, and recovery must continue when there is no reader and no model turn in flight. Polling a command from the prompt burns context and makes runtime safety depend on whether the model remembers to keep asking. The model decides *what* to run; the runtime owns *how it ends*.

### 4. Unknown is a real state

If a process owner disappears, a missing session record is not proof that its child died. Freeze new workspace admission while the runtime inspects a reachable owner, terminates the owned process tree, or destroys the exact dedicated sandbox. Until one of those produces positive evidence, do not relaunch and do not manufacture a terminal state.

Death evidence must come from a boundary the runtime owns and can observe empty: a killed cgroup that reports no live processes, a subreaper that has reaped every descendant, or a destroyed dedicated sandbox. A process group is not enough: in our probes, a descendant that started its own session survived the group's termination and held the output pipe open, so the session correctly recorded an incomplete drain. A subreaper-based owner later contained double-fork and setsid descendants.

### 5. Close is a join, not a callback

Store the model's final response as pending. Seal the set of admitted sessions. Settle every session: wait for required commands, and stop or hand off long-running services such as dev servers. Record a final filesystem scan, so the boundary also covers writes a file watcher has not yet reported. Advance durable publication through that boundary. Create the checkpoint manifest last, and read back that exact version. Fence the runtime generation. Then, and only then, publish the outcome and release the runtime.

```text
complete(task) =
  admission_is_sealed
  AND every_session_has(death_proof, final_output_cursor, terminal_mutation)
  AND checkpoint_covers(final_scan_boundary)   -- >= every terminal_mutation
  AND checkpoint_manifest_reads_back_exactly
  AND checkpoint_carries_runtime_fence
```

## What the probes found

We isolated the runtime from the model and ran specified synthetic commands on one live managed sandbox: first against the stream-shaped shell path we were replacing, then against a minimal session owner installed in the same sandbox to test the contract. Each cell is a separate probe, so parameters can differ across a row. These are exact observations from qualification runs, not aggregate success rates, and they cover rules 1 to 3.

<div class="table-scroll">

| Probe | Stream-shaped path | Session contract |
|---|---|---|
| Retry identity | The same lookup ID executed twice | The same invocation key and spec returned one child process |
| 4 MiB line | 0 output events, 0 terminal events; producer still blocked | 4,194,304 bytes replayed contiguously (71 events in total) |
| Quiet deadline | A silent command with a 1 s timeout completed after 4.205 s with exit 0 | A reader-independent 1.5 s deadline plus 0.5 s grace escalated TERM to KILL on a process that ignored TERM; outcome: timed out |
| Binary output | A 256-byte probe returned an exit event and 0 payload bytes | A 1,024-byte arbitrary payload replayed with an identical SHA-256 digest |
| Reader loss | The process survived disconnect, but no reattach or replay API existed | Sixteen 20 s quiet and noisy sessions ran unread, then replayed complete output |

</div>

The 4 MiB case was not ordinary truncation. A line reader with a 64 KiB default limit (Python's asyncio StreamReader) failed on the line; the child blocked once the pipe filled; the stream cleaned up; and the runtime lost its ordinary control handle in the process. Byte-oriented drain fixed the size assumption, and durable session identity kept control reachable after the reader disappeared. These were two different bugs with one symptom.

The quiet timeout failed for the opposite reason. Elapsed time was only checked when output arrived, so silence prevented the timeout loop from running at all: the deadline was unreachable in exactly the case it existed for. Moving the clock into an independent process owner made it independent of both output and readers.

Rule 4 was tested separately. In a live run we killed the session owner and its child; the runtime found the owner missing in durable state, destroyed the exact dedicated sandbox, recorded that destruction as the death proof, and only then concluded the session. Rule 5 has so far passed contract tests against a real database, not fault injection at every close boundary.

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

Evidence-carrying completion is a safety contract under explicit assumptions: the authority store is not corrupt, exact-version object reads can be trusted, and the sandbox provider either reports process state correctly or can attest that a dedicated runtime was destroyed. It is not formal verification, not a promise of continuous availability, and not exactly-once execution: after positive death evidence, a retry may run the command again on top of whatever the first attempt left behind. If an isolated runtime cannot be inspected or destroyed, close may remain blocked; that is the intended behaviour, and it is still an outage. Bytes lost before reaching any durable surface cannot be reconstructed. Effects outside the managed workspace — an API call, a database write, an email — need their own transaction or compensation mechanism, and nothing here provides one.

The evidence is also narrower than a finished benchmark. The traces above are qualification records rather than a public corpus. High-concurrency remote stress and several provider-specific recovery paths remain unmeasured. We have not published a latency distribution from process exit through verified task success. Those are the next experiments, not numbers to infer from the probes.

## The larger shift

Recent systems work is making environment state, recovery, and external effects explicit. [Agent libOS](https://arxiv.org/abs/2606.03895v3) goes furthest: it finalises each provider effect as committed, failed or unknown, and never treats a timeout or process death as evidence that the effect did not run. [Crab](https://arxiv.org/abs/2604.28138) and [AgentRewind](https://arxiv.org/abs/2608.14380) coordinate recovery with environment state; [Cordon](https://arxiv.org/abs/2606.17573) stages tool effects behind a semantic transaction. None of them, as far as we found, joins process death, output drained to a final byte, and a checkpoint covering the last write before deciding whether a run may be finalised at all.

<div class="claim">Across system boundaries, completion should be evidence a runtime can show, not merely a status it can set.</div>
