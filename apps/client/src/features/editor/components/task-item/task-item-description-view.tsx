import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";

export default function TaskItemDescriptionView(props: NodeViewProps) {
  const descriptionStyle = `
    [data-type="taskItemDescription"] {
      font-size: 12px;
      opacity: 0.75;
      margin: 2px 0 0 0;
      outline: none;
    }
    [data-mantine-color-scheme="dark"] [data-type="taskItemDescription"] {
      color: var(--mantine-color-gray-3);
    }
    [data-mantine-color-scheme="light"] [data-type="taskItemDescription"] {
      color: var(--mantine-color-gray-9);
    }
  `;

  return (
    <NodeViewWrapper data-type="taskItemDescription">
      <style>{descriptionStyle}</style>
      <NodeViewContent as="span" />
    </NodeViewWrapper>
  );
}