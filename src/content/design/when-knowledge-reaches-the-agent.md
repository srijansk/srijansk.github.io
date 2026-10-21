---
title: "When knowledge reaches the agent"
summary: "For an agent, knowledge that is available is not knowledge that arrives. One coding session drawn as a timeline, with the same team fact delivered three ways."
teaser: "The same team fact, delivered three ways in one coding session, and where each one is when the agent makes the edit."
date: 2026-10-21
kind: concept
surface: agents
order: 2
preview: delivery
---

An AI-native interface is the one an agent works through: the instructions it starts with, the tools it can call, and whatever arrives in its context while it works. The agent is the user here, and like any user it acts on what is in front of it when it decides. That makes timing a design decision. A fact the agent could have found is not a fact it had when it made the edit.

I have watched this fail. On an earlier project we gave an agent tools to search a knowledge base, with descriptions and worked examples, and it never called them. Adding guidance to the prompt did not change that either; I wrote it up in [Agent Context Is a Recommendation Problem](/writing/agent-context-is-a-recommendation-problem/).

<figure class="wide">
  <iframe src="/design/when-knowledge-reaches-the-agent/timeline.html" title="Interactive timeline: one invented coding session in ten turns, showing when the same team fact reaches the agent through a tool it must call, through its standing instructions, and when it opens the file it is about to change" loading="lazy" class="fig-delivery"></iframe>
  <figcaption><b>SCHEMATIC</b> — One invented session in ten turns. The fact is a team rule: a retried event must keep the original event's idempotency key. Move through the turns and see, for each route, where the fact is when the agent edits the retry code. The session is invented; the three routes are how agents receive knowledge today.</figcaption>
</figure>

## Three routes, and where each one fails

**A tool the agent has to call.** The agent decides when to ask, which works when it knows what it does not know. A coding agent changing retry logic does not know the team has a rule about idempotency keys, so it has no reason to look. This is the route that failed for us.

**Standing instructions.** CLAUDE.md, AGENTS.md and always-on editor rules put the fact in context from the first turn. It is there, but it is far from the moment it matters and competes with everything else the agent reads on the way. In a long run, an early fact can go missing from later work even though it was never truncated; I wrote about that in [Context Aging](/writing/context-aging/).

**At the moment the work touches it.** The fact arrives when the agent opens the file it applies to. The platforms already lean this way: Claude Code [loads CLAUDE.md files in subdirectories on demand](https://docs.claude.com/en/docs/claude-code/memory) and supports rules scoped to file paths, and Cursor rules can [apply when a file matches a pattern](https://cursor.com/docs/context/rules). My open-source tool [crewlore](https://github.com/srijansk/crewlore) does it per claim rather than per directory: when the agent reads or edits a file, the team's decisions and gotchas scoped to that file arrive with the tool's result, each quoting where it came from, so in the usual read-then-edit flow they are in view before the edit.

## Manners for pushing knowledge

Putting something into an agent's context uninvited is an interruption, and it needs the same restraint a good colleague shows. These are the rules crewlore's hooks follow:

- Say it once per scope in a conversation. The agent reads the same file many times; it does not need the same reminder each time.
- Say nothing when there is nothing to add. An empty interruption still costs attention.
- Never block. If delivery fails, the agent carries on as if the hook were not there.
- Come back after compaction. Compaction drops injected context, so the hook forgets what it has shown and offers it again on the next read.

The same thinking applies to anything an agent receives without asking for it: retrieved documents, warnings from a linter, a reviewer's notes. Each one should arrive next to the action it bears on, once, and only when it changes what the agent should do.

## What this does not settle

I have not measured the three routes against each other. The context-aging work with Susnato Dhar is a reason for caution: there, a ledger that put noted values back in front of the agent before it wrote fired as designed, and the score did not move. Arriving at the right moment is a precondition for using a fact, not a guarantee. The comparison I would run gives one set of tasks and one set of team facts to the same agent three times, once per route, and counts the edits that break a known rule.

There is also a limit on push. It only works for knowledge with an address, such as a file, a table or a service. A rule about how the team works in general has nowhere to attach, and still belongs in the standing instructions.
