import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";

export const DueDateMentionPluginKey = new PluginKey("dueDateMention");

export const DueDateMention = Extension.create({
  name: "dueDateMention",

  addOptions() {
    return {
      suggestion: {
        char: "@",
        pluginKey: DueDateMentionPluginKey,
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          return $from.parent.type.name === "paragraph" &&
            $from.node(-1)?.type.name === "taskItem";
        },
        command: ({ editor, range, props }) => {
          if (!props?.date) return;
          const { state } = editor.view;
          const $from = state.doc.resolve(range.from);
          const taskItemPos = $from.before(-1);
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .command(({ tr }) => {
              tr.setNodeMarkup(taskItemPos, undefined, {
                ...state.doc.nodeAt(taskItemPos)?.attrs,
                dueDate: props.date,
              });
              return true;
            })
            .run();
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
