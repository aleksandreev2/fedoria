'use client'

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'

export type StoryNodeData = {
  editHref: string
  kind: string
  label: string
  meta: string
  status: string
}

export type StoryGraphNode = Node<StoryNodeData, 'storyEvent'>

function StoryEventNode({ data }: NodeProps<StoryGraphNode>) {
  return (
    <article className={`fedoria-story-node fedoria-story-node--${data.kind}`}>
      <Handle type="target" position={Position.Left} />
      <div className="fedoria-story-node__meta">
        <span>{data.kind}</span>
        <span>{data.status}</span>
      </div>
      <strong>{data.label}</strong>
      <small>{data.meta}</small>
      <a href={data.editHref}>Открыть Event ↗</a>
      <Handle type="source" position={Position.Right} />
    </article>
  )
}

const nodeTypes = { storyEvent: StoryEventNode }

export function StoryGraphCanvas({ nodes, edges }: { nodes: StoryGraphNode[]; edges: Edge[] }) {
  return (
    <div className="fedoria-story-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.8}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable
      >
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} />
        <Background gap={22} size={1} />
      </ReactFlow>
    </div>
  )
}
