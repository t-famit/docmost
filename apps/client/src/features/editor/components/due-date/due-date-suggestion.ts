import { ReactRenderer } from "@tiptap/react";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import DueDateList from "./due-date-list";
import dayjs from "dayjs";

const dueDateSuggestion = (onSelectDate: (date: Date) => void) => {
  let component: ReactRenderer | null = null;
  let activeClientRect: (() => DOMRect) | null = null;
  let updatePositionCleanup: (() => void) | null = null;
  let outsideClickHandler: ((e: MouseEvent) => void) | null = null;

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
  };

  return {
    onStart: (props: any) => {
      // Only trigger after "due " prefix
      if (!props.query.startsWith("due ") && props.query !== "due") return;

      const dateQuery = props.query.startsWith("due ")
        ? props.query.slice(4)
        : "";

      component = new ReactRenderer(DueDateList, {
        props: {
          query: dateQuery,
          command: (date: Date) => {
            onSelectDate(date);
            destroy();
          },
        },
        editor: props.editor,
      });

      if (!props.clientRect) return;
      activeClientRect = props.clientRect;

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
            { placement: "bottom-start", middleware: [offset(4), flip(), shift()] }
          ).then(({ x, y }) => {
            Object.assign(element.style, {
              left: `${x}px`,
              top: `${y}px`,
              position: "absolute",
              zIndex: "190",
            });
          });
        }
      );
    },

    onUpdate: (props: any) => {
      if (!props.query.startsWith("due") ) {
        destroy();
        return;
      }

      const dateQuery = props.query.startsWith("due ")
        ? props.query.slice(4)
        : "";

      if (component) {
        component.updateProps({
          query: dateQuery,
          command: (date: Date) => {
            onSelectDate(date);
            destroy();
          },
        });
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
      return (component?.ref as any)?.onKeyDown(props);
    },

    onExit: () => {
      destroy();
    },
  };
};

export default dueDateSuggestion;