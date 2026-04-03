"use client";

import { useApp } from "@/lib/context";
import AgentReasoning from "@/components/AgentReasoning";

export default function GlobalAgentReasoning() {
  const { agentEvents } = useApp();
  return <AgentReasoning events={agentEvents} />;
}
