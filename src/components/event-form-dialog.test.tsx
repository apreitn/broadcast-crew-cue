import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { EventFormDialog } from "./event-form-dialog";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("@/hooks/use-planner", () => ({
  usePlannerMutation: () => ({ mutate, isPending: false }),
}));

it("blocks an invalid broadcast and clears the inline error when the times are fixed", () => {
  render(<EventFormDialog trigger={<button>New broadcast</button>} />);
  fireEvent.click(screen.getByRole("button", { name: "New broadcast" }));

  const title = screen.getByLabelText("Title");
  const crewCall = screen.getByLabelText("Crew call");
  const offAir = screen.getByLabelText("Off air");
  const save = screen.getByRole("button", { name: "Create broadcast" });

  fireEvent.change(title, { target: { value: "Cup final" } });
  fireEvent.change(offAir, { target: { value: "18:30" } });
  expect(screen.getByRole("alert")).toHaveTextContent("Off air must be later than on air.");
  fireEvent.click(save);
  expect(mutate).not.toHaveBeenCalled();

  fireEvent.change(offAir, { target: { value: "21:30" } });
  fireEvent.change(crewCall, { target: { value: "19:30" } });
  expect(screen.getByRole("alert")).toHaveTextContent("Crew call must be at or before on air.");
  fireEvent.click(save);
  expect(mutate).not.toHaveBeenCalled();

  fireEvent.change(crewCall, { target: { value: "19:00" } });
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.click(save);
  expect(mutate).toHaveBeenCalledOnce();
});
