// Interactive family tree canvas — pan/zoom graph of big/little relationships.
// Uses React Flow for rendering; nodes laid out in generational pledge class rows.
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { buildFamilyTree } from "@/lib/build-family-tree";
import { MOCK_MEMBERS } from "@/lib/mock-data";
import { MemberNode } from "./MemberNode";
import { GhostNode } from "./GhostNode";
import { MemberDetailPanel } from "./MemberDetailPanel";
import type { Member } from "@/types/member";
import type { MemberNodeData } from "./MemberNode";

const nodeTypes = {
  memberNode: MemberNode,
  ghostNode: GhostNode,
};

export function FamilyTreeGraph() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { nodes, edges } = useMemo(() => buildFamilyTree(MOCK_MEMBERS), []);

  const onNodeClick: NodeMouseHandler<Node> = useCallback((_event, node) => {
    if (node.type === "memberNode") {
      setSelectedMember((node.data as unknown as MemberNodeData).member ?? null);
    }
  }, []);

  const onPaneClick = useCallback(() => setSelectedMember(null), []);

  return (
    <div className="relative w-full h-[calc(100vh-56px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e2e8f0" />
      </ReactFlow>

      {selectedMember && (
        <MemberDetailPanel
          member={selectedMember}
          members={MOCK_MEMBERS}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
