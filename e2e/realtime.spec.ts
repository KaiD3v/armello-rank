import { expect, test } from "@playwright/test";

const accessCode = process.env.ACCESS_CODE ?? "armello-throne-2026";

test.describe("realtime ranking", () => {
  test.setTimeout(90_000);

  test("syncs point changes across two browser contexts", async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    async function unlock(page: typeof pageA) {
      await page.goto("/");
      await expect(page.getByTestId("access-code")).toBeVisible({
        timeout: 60_000,
      });
      await page.getByTestId("access-code").fill(accessCode);
      await page.getByRole("button", { name: "Abrir o pergaminho" }).click();
      await expect(page.getByText("Quadro dos Heróis")).toBeVisible();
    }

    await unlock(pageA);
    await unlock(pageB);

    const rowA = pageA
      .locator("ol[aria-label='Ranking dos heróis'] > li")
      .filter({ hasText: "Henrique" });
    const rowB = pageB
      .locator("ol[aria-label='Ranking dos heróis'] > li")
      .filter({ hasText: "Henrique" });

    const beforeText = await rowB.innerText();
    const beforeMatch = beforeText.match(/(\d+)\s+pontos?/);
    const beforePoints = beforeMatch ? Number(beforeMatch[1]) : 0;

    await rowA
      .getByRole("button", { name: /Adicionar um ponto a Henrique/ })
      .click();

    await expect
      .poll(async () => {
        const text = await rowB.innerText();
        const match = text.match(/(\d+)\s+pontos?/);
        return match ? Number(match[1]) : -1;
      }, { timeout: 15_000 })
      .toBe(beforePoints + 1);

    await contextA.close();
    await contextB.close();
  });
});
