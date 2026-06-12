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

  const handleDateChange = (date: Date | null) => {
    updateAttributes({ dueDate: date ? dayjs(date).toISOString() : null });
    setOpened(false);
    editor.commands.focus();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ checked: e.target.checked });
  };

  const currentValue = dueDate ? new Date(dueDate) : null;

  return (
    <NodeViewWrapper as="li" data-checked={checked} data-type="taskItem">
      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={handleCheckboxChange}
          disabled={!isEditable}
          contentEditable={false}
          style={{ marginTop: "3px", flexShrink: 0, cursor: "pointer" }}
        />
        {isEditable && (
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
                color={dueDate ? dateColor : "gray"}
                size="sm"
                onClick={() => setOpened((o) => !o)}
                contentEditable={false}
                title={dueDate ? `Due: ${parsedDate?.format("MMM D, YYYY")}` : "Set due date"}
              >
                {isOverdue
                  ? <IconCalendarExclamation size={14} />
                  : <IconCalendar size={14} />
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
        )}
          {dueDate && (
            <Badge
              color={dateColor}
              variant="filled"
              size="xs"
              contentEditable={false}
              className="not-draggable"
              style={{ flexShrink: 0, alignSelf: "flex-start", marginTop: "4px", cursor: "default" }}
            >
              {isToday ? "Today" : isOverdue ? `Overdue · ${parsedDate?.format("MMM D")}` : parsedDate?.format("MMM D")}
            </Badge>
          )}
        <NodeViewContent
          as="span"
          style={{
            textDecoration: checked ? "line-through" : "none",
            opacity: checked ? 0.6 : 1,
            flex: 1,
            outline: "none",
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}
