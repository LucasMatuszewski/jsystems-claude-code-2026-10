import { test } from "@playwright/test";
test("probe", async ({ page, browserName }) => {
  await page.goto("/");
  const el = page.locator("#field-purchaseDate");
  await el.click();
  await page.keyboard.type("21102026");
  console.log("PROBE", browserName, "dmy->", await el.inputValue());
  await el.fill("");
  await el.click();
  await page.keyboard.type("10212026");
  console.log("PROBE", browserName, "mdy->", await el.inputValue());
});
