import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  Paper,
  Text,
  UnstyledButton,
  Group,
  ScrollArea,
  VisuallyHidden,
} from "@mantine/core";
import { IconCalendarEvent } from "@tabler/icons-react";
import clsx from "clsx";
import classes from "@/features/editor/components/mention/mention.module.css";
import { parseDateSuggestions, DateSuggestion } from "./due-date-parser";

interface DueDateListProps {
  query: string;
  command: (date: Date) => void;
}

const DueDateList = forwardRef<any, DueDateListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([]);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const parsed = parseDateSuggestions(props.query);
    setSuggestions(parsed);
    setSelectedIndex(0);
    setAnnouncement(
      parsed.length === 0
        ? "No date matches"
        : `${parsed.length} date suggestion${parsed.length > 1 ? "s" : ""} available`
    );
  }, [props.query]);

  const selectItem = (index: number) => {
    const item = suggestions[index];
    if (item) props.command(item.date);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + suggestions.length - 1) % suggestions.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % suggestions.length);
        return true;
      }
      if (event.key === "Enter") {
        if (suggestions.length === 0) return false;
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (suggestions.length === 0) {
    return (
      <Paper shadow="md" py="xs" px="sm" withBorder radius="md">
        <VisuallyHidden role="status" aria-live="polite">{announcement}</VisuallyHidden>
        <Text c="dimmed" size="sm">
          {props.query.length < 2 ? "Keep typing a date…" : "No matching dates"}
        </Text>
      </Paper>
    );
  }

  return (
    <Paper
      shadow="md"
      withBorder
      radius="md"
      py={6}
      role="listbox"
      aria-label="Date suggestions"
    >
      <VisuallyHidden role="status" aria-live="polite">{announcement}</VisuallyHidden>
      <Text c="dimmed" size="xs" fw={500} px="sm" pt={2} pb={4} tt="uppercase" style={{ userSelect: "none" }}>
        Due date
      </Text>
      <ScrollArea.Autosize mah={300} w={280} scrollbars="y" scrollbarSize={6}>
        {suggestions.map((item, index) => (
          <UnstyledButton
            key={index}
            role="option"
            aria-selected={index === selectedIndex}
            onClick={() => selectItem(index)}
            className={clsx(classes.menuBtn, {
              [classes.selectedItem]: index === selectedIndex,
            })}
            px="sm"
          >
            <Group gap="sm" wrap="nowrap">
              <IconCalendarEvent size={16} stroke={1.5} style={{ flexShrink: 0, color: "var(--color-text-secondary)" }} />
              <div style={{ flex: 1 }}>
                <Text size="sm" fw={500}>{item.label}</Text>
                <Text size="xs" c="dimmed">{item.sublabel}</Text>
              </div>
            </Group>
          </UnstyledButton>
        ))}
      </ScrollArea.Autosize>
    </Paper>
  );
});

export default DueDateList;