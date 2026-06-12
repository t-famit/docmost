import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ActionIcon, Badge, Popover } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconCalendar, IconCalendarExclamation } from "@tabler/icons-react";
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";

export default function TaskItemView(props: NodeViewProps) {
  const { node, updateAttributes, editor } = props;
  const { checked, dueDate } = node.attrs;
  const [opened, setOpened] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditable = editor.isEditable;
  const parsedDate = dueDate ? dayjs(dueDate) : null;
  const isOverdue = parsedDate && !checked && parsedDate.isBefore(dayjs(), "day");
  const isToday = parsedDate && parsedDate.isSame(dayjs(), "day");
  const isThisWeek = parsedDate && !isOverdue && !isToday && parsedDate.diff(dayjs(), "day") <= 7;
  const dateColor = isOverdue ? "red.6" : isToday ? "orange.7" : isThisWeek ? "yellow.7" : "blue.7";

  const hasDescription = node.childCount > 1 &&
    node.child(1).type.name === "taskItemDescription";

  useEffect(() => {
    const handler = () => setOpened(true);
    document.addEventListener("openTaskDatePicker", handler);
    return () => document.removeEventListener("openTaskDatePicker", handler);
  }, []);

  useEffect(() => {
    if (opened) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (!dueDate) {
        updateAttributes({ dueDate: dayjs().startOf("day").toISOString() });
      }
    }
  }, [opened]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ checked: e.target.checked });
  };

  const currentValue = dueDate ? new Date(dueDate) : null;

  const descriptionStyle = `
    [data-type="taskItemDescription"] {
      font-size: 12px;
      opacity: 0.75;
      margin: 2px 0 0 0;
    }
    [data-mantine-color-scheme="dark"] [data-type="taskItemDescription"] {
      color: var(--mantine-color-gray-3);
    }
    [data-mantine-color-scheme="light"] [data-type="taskItemDescription"] {
      color: var(--mantine-color-gray-9);
    }
  `;

  return (
    <NodeViewWrapper as="li" data-checked={checked} data-type="taskItem">
      <style>{descriptionStyle}</style>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={handleCheckboxChange}
            disabled={!isEditable}
            contentEditable={false}
            style={{ marginTop: "3px", cursor: "pointer" }}
          />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          {/* Task text */}
          <NodeViewContent
            as="div"
            style={{
              textDecoration: checked ? "line-through" : "none",
              opacity: checked ? 0.6 : 1,
              outline: "none",
            }}
          />
          {/* Date row — after text, before description */}
          {dueDate && isEditable && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }} contentEditable={false}>
              <Popover
                opened={opened}
                onChange={setOpened}
                position="bottom-start"
                withArrow
                shadow="md"
              >
                <Popover.Target>
                  <ActionIcon
                    variant="subtle"
                    color={dateColor}
                    size="xs"
                    onClick={() => setOpened((o) => !o)}
                    className="not-draggable"
                    title={`Due: ${parsedDate?.format("MMM D, YYYY")}`}
                  >
                    {isOverdue
                      ? <IconCalendarExclamation size={12} />
                      : <IconCalendar size={12} />
                    }
                  </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown>
                  <DateInput
                    ref={inputRef}
                    value={currentValue}
                    onChange={(date) => {
                      updateAttributes({ dueDate: date ? dayjs(date).toISOString() : null });
                    }}
                    valueFormat="MM/DD/YYYY"
                    placeholder="MM/DD/YYYY"
                    clearable
                    size="sm"
                    firstDayOfWeek={0}
                    highlightToday
                    weekendDays={[]}
                  />
                </Popover.Dropdown>
              </Popover>
              <Badge
                color={dateColor}
                variant="filled"
                size="xs"
                className="not-draggable"
                style={{ cursor: "default", fontSize: "9px" }}
              >
                {isToday ? "Today" : isOverdue ? `Overdue · ${parsedDate?.format("MMM D")}` : parsedDate?.format("MMM D")}
              </Badge>
            </div>
          )}
          {/* Ghost calendar — no date assigned */}
          {!dueDate && isEditable && false && (
            <div style={{ display: "flex", alignItems: "center" }} contentEditable={false}>
              <Popover
                opened={opened}
                onChange={setOpened}
                position="bottom-start"
                withArrow
                shadow="md"
              >
                <Popover.Target>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={() => setOpened((o) => !o)}
                    className="not-draggable"
                    title="Set due date"
                    style={{ opacity: 0, transition: "opacity 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                  >
                    <IconCalendar size={12} />
                  </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown>
                  <DateInput
                    ref={inputRef}
                    value={currentValue}
                    onChange={(date) => {
                      updateAttributes({ dueDate: date ? dayjs(date).toISOString() : null });
                    }}
                    valueFormat="MM/DD/YYYY"
                    placeholder="MM/DD/YYYY"
                    clearable
                    size="sm"
                    firstDayOfWeek={0}
                    highlightToday
                    weekendDays={[]}
                  />
                </Popover.Dropdown>
              </Popover>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}