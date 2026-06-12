import { Node } from "@tiptap/core";

export const TaskItemDescription = Node.create({
  name: "taskItemDescription",
  group: "block",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="taskItemDescription"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "taskItemDescription" }, 0];
  },
});