import { ReactRenderer, useEditor } from "@tiptap/react";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import MentionList from "@/features/editor/components/mention/mention-list.tsx";
import DueDateList from "@/features/editor/components/due-date/due-date-list.tsx";
import dayjs from "dayjs";

function getWhitespaceCount(query: string) {
  const matches = query?.match(/([\s]+)/g);
  return matches?.length || 0;
}

const mentionRenderItems = () => {
  let component: ReactRenderer | null = null;
  let activeClientRect: (() => DOMRect) | null = null;
  let updatePositionCleanup: (() => void) | null = null;
  let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
  let isDueDateMode = false;

  const destroy = () => {
    if (outsideClickHandler) {
      document.removeEventListener("pointerdown", outsideClickHandler);
      outsideClickHandler = null;
    }
    updatePositionCleanup?.();
    updatePositionCleanup = null;
    component?.destroy();
    if (component?.element?.parentNode) {
      component.element.parentNode.removeChild(component.element);
    }
    component = null;
    isDueDateMode = false;
  };

  const mountComponent = (
    ComponentClass: any,
    props: any,
    editor: any,
    clientRect: () => DOMRect,
    shiftMiddleware: any,
  ) => {
    component = new ReactRenderer(ComponentClass, {
      props,
      editor,
    });

    activeClientRect = clientRect;
    const { element } = component;
    document.body.appendChild(element);

    outsideClickHandler = (e: MouseEvent) => {
      if (element && !element.contains(e.target as Node)) {
        destroy();
      }
    };
    document.addEventListener("pointerdown", outsideClickHandler);

    updatePositionCleanup = autoUpdate(
      { getBoundingClientRect: () => activeClientRect ? activeClientRect() : new DOMRect() },
      element,
      () => {
        if (!component?.element) return;
        computePosition(
          { getBoundingClientRect: () => activeClientRect ? activeClientRect() : new DOMRect() },
          element,
          { placement: "bottom-start", middleware: [offset(4), flip(), shiftMiddleware] },
        ).then(({ x, y }) => {
          Object.assign(element.style, {
            left: `${x}px`,
            top: `${y}px`,
            position: "absolute",
            zIndex: "190",
          });
        });
      },
    );
  };

  const makeDueDateCommand = (editor: any, range: any) => (date: Date) => {
    const { state } = editor.view;
    const $from = state.doc.resolve(range.from);

    // find the taskItem ancestor
    let taskItemPos: number | null = null;
    let taskItemAttrs: any = null;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === "taskItem") {
        taskItemPos = $from.before(depth);
        taskItemAttrs = node.attrs;
        break;
      }
    }

    if (taskItemPos === null) {
      destroy();
      return;
    }

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .command(({ tr }: any) => {
        tr.setNodeMarkup(taskItemPos, undefined, {
          ...taskItemAttrs,
          dueDate: dayjs(date).toISOString(),
        });
        return true;
      })
      .run();

    destroy();
  };

  return {
    onStart: (props: {
      editor: ReturnType<typeof useEditor>;
      clientRect: () => DOMRect;
      query: string;
      range: any;
    }) => {
      console.log("mention onStart query:", props.query);
      if (props.query.charAt(0) === " ") return;

      const editorDom = props.editor?.view?.dom;
      const asideEl = editorDom?.closest(".mantine-AppShell-aside");
      const dialogEl = editorDom?.closest("[data-comment-dialog]");
      const chatInput = editorDom?.closest("[data-chat-input]");
      const isInCommentContext = !!(asideEl || dialogEl || chatInput);

      const shiftMiddleware = asideEl
        ? shift({ boundary: asideEl, crossAxis: true, padding: 8 })
        : shift();

      isDueDateMode = props.query.startsWith("due ");

      if (isDueDateMode) {
        const dateQuery = props.query.slice(4);
        mountComponent(
          DueDateList,
          {
            query: dateQuery,
            command: makeDueDateCommand(props.editor, props.range),
          },
          props.editor,
          props.clientRect,
          shiftMiddleware,
        );
      } else {
        const whitespaceCount = getWhitespaceCount(props.query);
        if (whitespaceCount > 4) return;

        mountComponent(
          MentionList,
          { ...props, isInCommentContext },
          props.editor,
          props.clientRect,
          shiftMiddleware,
        );
      }
    },

    onUpdate: (props: {
      editor: ReturnType<typeof useEditor>;
      clientRect: () => DOMRect;
      query: string;
      range: any;
    }) => {
      if (props.query.charAt(0) === " ") {
        destroy();
        return;
      }

      const nowDueDate = props.query.startsWith("due ");

      // if mode has switched, destroy and let onStart rebuild
      if (nowDueDate !== isDueDateMode) {
        destroy();
        if (nowDueDate) {
          isDueDateMode = true;
          const dateQuery = props.query.slice(4);
          const editorDom = props.editor?.view?.dom;
          const asideEl = editorDom?.closest(".mantine-AppShell-aside");
          const shiftMiddleware = asideEl
            ? shift({ boundary: asideEl, crossAxis: true, padding: 8 })
            : shift();
          mountComponent(
            DueDateList,
            {
              query: dateQuery,
              command: makeDueDateCommand(props.editor, props.range),
            },
            props.editor,
            props.clientRect,
            shiftMiddleware,
          );
        }
        return;
      }

      if (isDueDateMode) {
        const dateQuery = props.query.slice(4);
        if (component) {
          component.updateProps({
            query: dateQuery,
            command: makeDueDateCommand(props.editor, props.range),
          });
        }
      } else {
        if (component) {
          component.updateProps(props);
        }

        const whitespaceCount = getWhitespaceCount(props.query);
        if (
          whitespaceCount > 4 &&
          //@ts-ignore
          props.editor.storage.mentionItems.length === 1
        ) {
          destroy();
          return;
        }
        if (whitespaceCount > 7) {
          destroy();
          return;
        }
      }

      if (props.clientRect) {
        activeClientRect = props.clientRect;
      }
    },

    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        destroy();
        return true;
      }
      if (props.event.key === "Enter" && !component) {
        destroy();
        return false;
      }
      return (component?.ref as any)?.onKeyDown(props);
    },

    onExit: () => {
      destroy();
    },
  };
};

export default mentionRenderItems;