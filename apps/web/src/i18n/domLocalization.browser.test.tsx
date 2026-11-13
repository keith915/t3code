import { useLayoutEffect, useRef, type ReactNode } from "react";
import { describe, expect, it, vi } from "vite-plus/test";

import { render } from "../../test/render";
import { startUiDomLocalization } from "./domLocalization";

function Localized({ children }: { readonly children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    return root ? startUiDomLocalization(root) : undefined;
  }, []);
  return <div ref={ref}>{children}</div>;
}

describe("DOM UI localization", () => {
  it("translates UI copy and attributes", async () => {
    // No links or route hooks in this fixture.
    await using screen = await render(
      <Localized>
        <button type="button" aria-label="Add project">
          Cancel
        </button>
      </Localized>,
      { router: false },
    );
    expect(screen.container.querySelector("button")?.textContent).toBe("取消");
    expect(screen.container.querySelector("button")?.getAttribute("aria-label")).toBe("添加项目");
  });

  it("skips chat content and translates nodes added later", async () => {
    const fixture = (showRetry: boolean) => (
      <Localized>
        <div className="chat-markdown">Cancel</div>
        <button type="button">Cancel</button>
        {showRetry ? <button type="button">Retry</button> : null}
      </Localized>
    );
    // No links or route hooks in this fixture.
    await using screen = await render(fixture(false), { router: false });
    expect(screen.container.querySelector(".chat-markdown")?.textContent).toBe("Cancel");
    expect(screen.container.querySelector("button")?.textContent).toBe("取消");
    await screen.rerender(fixture(true));
    await vi.waitFor(() => {
      expect(
        [...screen.container.querySelectorAll("button")].map((button) => button.textContent),
      ).toEqual(["取消", "重试"]);
    });
  });
});
