import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import { NavigationScroll } from "@/app/layout/NavigationScroll";

let resize: () => void;
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

// Exercise actual router history rather than mocking navigation intent.
const setup = () => {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <NavigationScroll />
            <div data-route-content tabIndex={-1}>
              <Outlet />
            </div>
          </>
        ),
        children: [{ path: "*", element: <h1>Page</h1> }],
      },
    ],
    { initialEntries: ["/"] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

test("new products start at the top; Back and Forward restore separate entries", async () => {
  const router = setup();
  Object.defineProperty(window, "scrollY", { value: 800 });
  fireEvent.scroll(window);
  await act(() => router.navigate("/products/a"));
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
  expect(screen.getByRole("heading").parentElement).toHaveFocus();
  Object.defineProperty(window, "scrollY", { value: 1500 });
  fireEvent.scroll(window);
  await act(() => router.navigate(-1));
  expect(window.scrollTo).toHaveBeenLastCalledWith({
    top: 800,
    left: 0,
    behavior: "instant",
  });
  act(() => resize());
  expect(window.scrollTo).toHaveBeenLastCalledWith({
    top: 800,
    left: 0,
    behavior: "instant",
  });
  Object.defineProperty(window, "scrollY", { value: 800 });
  fireEvent.scroll(window);
  await act(() => router.navigate(1));
  expect(window.scrollTo).toHaveBeenLastCalledWith({
    top: 1500,
    left: 0,
    behavior: "instant",
  });
  await act(() => router.navigate("/products/b"));
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
});

test("same-page URL updates can preserve position", async () => {
  const router = setup();
  vi.mocked(window.scrollTo).mockClear();
  await act(() =>
    router.navigate("/?tab=products", { preventScrollReset: true }),
  );
  expect(window.scrollTo).not.toHaveBeenCalled();
});

test("section links find delayed targets", async () => {
  const scrollIntoView = vi.fn();
  const router = setup();
  await act(() => router.navigate("/products/a#details"));
  const target = document.createElement("section");
  target.id = "details";
  target.scrollIntoView = scrollIntoView;
  document.body.append(target);
  act(() => resize());
  expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "instant" });
  target.remove();
});
