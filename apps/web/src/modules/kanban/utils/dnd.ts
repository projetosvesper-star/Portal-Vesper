import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export function useKanbanDndSensors() {
  const pointer = useSensor(PointerSensor, {
    activationConstraint: { distance: 6 },
  });
  const keyboard = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });
  return useSensors(pointer, keyboard);
}
