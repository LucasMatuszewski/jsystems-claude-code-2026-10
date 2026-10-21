import { expect, type Page, type Response, test } from "@playwright/test";
import { submitCaseAndWaitForDecision } from "./pages/chat.page";

const LEAK_PATTERN = "sk-or-";
const TEXT_CONTENT_TYPE = /javascript|json|html|event-stream/i;

function firstReturnDecision(page: Page) {
  return submitCaseAndWaitForDecision(page, {
    caseType: "return",
    category: "smartphone",
    channel: "online",
    daysAgo: 9,
    photo: "phone-1.jpg",
  });
}

/** Reloads the page, accepts the beforeunload dialog and returns its type. */
async function reloadAcceptingDialog(page: Page): Promise<string> {
  const dialogPromise = page.waitForEvent("dialog", { timeout: 15_000 });
  const reloaded = page.reload();
  const dialog = await dialogPromise;
  const type = dialog.type();
  await dialog.accept();
  await reloaded;
  return type;
}

test.describe("E-19 no credential leaks to the browser", () => {
  test("no app response text or request contains the OpenRouter key prefix, no request goes to openrouter.ai", async ({
    page,
  }, testInfo) => {
    const appOrigin = new URL(
      testInfo.project.use.baseURL ?? "http://localhost:3000"
    ).origin;
    const requests: { url: string; postData: string | null }[] = [];
    const responseBodies: Promise<{ url: string; body: string }>[] = [];

    // Passive observation only: listeners never alter, route or fulfil traffic.
    page.on("request", (request) => {
      requests.push({ postData: request.postData(), url: request.url() });
    });
    page.on("response", (response: Response) => {
      const url = new URL(response.url());
      if (url.origin !== appOrigin) {
        return;
      }
      const contentType = response.headers()["content-type"] ?? "";
      if (!TEXT_CONTENT_TYPE.test(contentType)) {
        return;
      }
      responseBodies.push(
        response.text().then(
          (body) => ({ body, url: response.url() }),
          () => ({ body: "", url: response.url() })
        )
      );
    });

    const { chat } = await firstReturnDecision(page);
    await chat.firstAssistantText();

    const bodies = await Promise.all(responseBodies);
    console.log(
      `E-19 observed ${requests.length} requests, ${bodies.length} text responses on ${appOrigin}`
    );
    for (const { body, url } of bodies) {
      expect(
        body,
        `response ${url} must not contain the key prefix`
      ).not.toContain(LEAK_PATTERN);
    }
    for (const request of requests) {
      expect(
        new URL(request.url).hostname,
        `request ${request.url} must not target openrouter.ai`
      ).not.toBe("openrouter.ai");
      expect(
        request.postData ?? "",
        `request ${request.url} body`
      ).not.toContain(LEAK_PATTERN);
    }
    expect(requests.map((request) => request.url).join("\n")).not.toContain(
      LEAK_PATTERN
    );
  });
});

test.describe("E-20 nothing is persisted in the browser after a case", () => {
  test("after reload the form is empty and no storage or IndexedDB data remains", async ({
    page,
  }) => {
    const { chat } = await firstReturnDecision(page);
    await chat.firstAssistantText();

    const beforeUnloadType = await reloadAcceptingDialog(page);
    expect(beforeUnloadType).toBe("beforeunload");

    await expect(page.getByTestId("form-screen")).toBeVisible();
    await expect(page.locator("#field-modelName")).toHaveValue("");
    await expect(page.getByRole("radio")).toHaveCount(4);
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);

    const storageCounts = await page.evaluate(() => [
      localStorage.length,
      sessionStorage.length,
    ]);
    expect(storageCounts).toEqual([0, 0]);

    const databases = await page.evaluate(async () => {
      if (typeof indexedDB.databases !== "function") {
        return null;
      }
      const list = await indexedDB.databases();
      return list.map((database) => database.name ?? "");
    });
    console.log(
      `E-20 storage counts=${JSON.stringify(storageCounts)} indexedDB=${JSON.stringify(databases)}`
    );
    expect(databases === null || databases.length === 0).toBe(true);
  });
});
