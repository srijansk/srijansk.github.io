---
title: "When knowledge reaches the agent"
summary: "An agent can only use what is in front of it when it acts. Four ways to put a team's knowledge in front of a coding agent, in the order they reach it during a session, what each one costs, and what my own data says about them."
teaser: "One team rule and a ten-turn coding session: where each delivery route leaves the rule when the agent edits."
date: 2026-10-21
updated: 2026-11-01
kind: concept
surface: agents
order: 2
preview: delivery
---

On an earlier project we gave an agent tools to search a knowledge base, with descriptions and worked examples, and it never called them, even after the prompt told it to. That was one task on one model, an existence proof rather than a rate, as I wrote in [Agent Context Is a Recommendation Problem](/writing/agent-context-is-a-recommendation-problem/). Later runs were larger and cut both ways. When a knowledge tool was live and prominent in the agent's workspace, agents called it in 37 of 43 tasks. When a frozen copy of the knowledge was attached instead, they never called the live source, and read the stale copy in 12 of 17 tasks.

Some of the interfaces I think about most have a model as their user. SWE-agent's authors called this the [agent-computer interface](https://arxiv.org/abs/2405.15793), on the view that language-model agents "represent a new category of end users with their own needs and abilities". For a coding agent, that interface includes the instructions it starts with, the tools it can call, and whatever arrives in its context while it works. This piece is about the last part: when a piece of team knowledge should reach the agent, and in what form.

<figure class="wide">
  <iframe src="/design/when-knowledge-reaches-the-agent/timeline.html" title="Interactive schematic: one invented coding session in ten turns, showing when one team rule reaches the agent through its standing instructions, a tool it can call, a push when it opens the file, and a lookup it must make before the edit" loading="lazy" class="fig-delivery"></iframe>
  <figcaption><b>Schematic.</b> One invented session in ten turns and one team rule: a retried event keeps the original event's idempotency key. Move through the turns, change the assumptions, and see where the rule is when the agent edits the retry code.</figcaption>
</figure>

## Four routes, in the order they reach the agent

The platform docs list the first three. What the timeline adds is when each route puts the rule in front of the agent, relative to the edit.

**Standing instructions.** CLAUDE.md, AGENTS.md and always-on editor rules are in context from the first turn, and Claude Code re-reads its root CLAUDE.md after compaction. The cost is distance. The rule sits many turns from the edit, behind everything read since, and long runs can lose early facts without truncating them, which I wrote about in [Context Aging](/writing/context-aging/).

**Pull, through a tool the agent can call.** It works when the agent knows what it is missing, and it cannot work for a rule the agent does not know exists: an agent changing retry logic has no reason to search for idempotency keys. Cursor's "Apply Intelligently" rules are half-way: the rule's description is always in context, and the agent pulls the body "when Agent decides it's relevant based on description" ([docs](https://cursor.com/docs/context/rules)). That solves not knowing a rule exists, and leaves the failure in the opening, where the tools were described and never called.

**Push, with the file.** The rule arrives when the agent opens the file it applies to. Claude Code loads a path-scoped rule "when Claude uses the Read, Write, or Edit tool on a matching file" ([docs](https://docs.claude.com/en/docs/claude-code/memory)), and Cursor rules can apply "when file matches a specified pattern" ([docs](https://cursor.com/docs/context/rules)). It is the agent's version of what Rhodes and Maes called [just-in-time information retrieval](https://www.bradleyrhodes.com/Papers/rhodes-jitir-agents-ibmsj-2000.pdf): information presented "based on a person's local context in an easily accessible yet nonintrusive manner". Its failure is the stale copy: in the runs above, the frozen copy was read in 12 of 17 tasks while the live source was never called.

**A gate before the edit.** The agent has to look the rule up before its first irreversible step, so the edit waits. It is the most reliable route and the most intrusive one. In the context-aging work with Susnato Dhar, timing decided whether a prompt was obeyed: a nudge to read more, sent at drafting time, fired ten times in one run and was followed zero times, while a gate that forced reads before the first draft was obeyed. The essay's caveat travels with it: a gate of that kind fixed the symptom it targeted in every run of that experiment, and the end-to-end score did not move, so a gate delivers the rule without by itself making the edit right.

## What crewlore changes, and what it leaves alone

My open-source tool [crewlore](https://github.com/srijansk/crewlore) pushes through the hooks Claude Code already provides; the mechanism is the platform's. What crewlore changes is what arrives. The knowledge is not a rule someone wrote by hand. It is compiled from the team's past sessions and pull requests, and each claim says whether the team adopted it or tried it and declined, what to do instead when it was declined, and which lines it was compiled from.

It also arrives labelled as "evidence to weigh, not instructions". In the [instruction hierarchy](https://arxiv.org/abs/2404.13208) proposed for language models, tool output is the lowest-privileged source of instructions: the paper ranks "untrusted outputs from tools" below the system prompt and the user, because that is where injected instructions arrive, so knowledge pushed through that channel should say what it is.

crewlore's hooks do not gate. If delivery fails, the agent carries on as if they were not there. They mention each scope once per conversation and again after it is compacted, and stay silent when there is nothing to add. A gate would be more reliable for the rules that matter most, and a team that needs one can add it.

The rule in the timeline is the sentence that waits for a person's approval in [Reviewing what an agent wrote](/design/reviewing-what-an-agent-wrote/); which version arrives here is decided there.

## What would change my mind

I have not compared the four routes on the same tasks. The test I would run gives one agent one set of tasks and one set of team rules four times, once per route, and counts the edits that break a rule, along with what each route costs in tokens and in interruptions. If pushing with the file does no better than standing instructions once the stale-copy problem is fixed, the argument about distance is wrong.

Push also needs an address. A rule about a file, a table or a service can travel with it. A rule about how the team works in general has nowhere to attach, and still belongs in the standing instructions.
