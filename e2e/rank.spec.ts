import { expect, test } from "@playwright/test";

const accessCode = process.env.ACCESS_CODE ?? "armello-throne-2026";

test.describe("Armello Rank flow", () => {
  test.setTimeout(90_000);

  test("rejects wrong code", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("access-code")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("access-code").fill("wrong-code");
    await page.getByRole("button", { name: "Abrir o pergaminho" }).click();
    await expect(page.getByText("O selo rejeitou o código")).toBeVisible();
    await expect(page.getByText("Quadro dos Heróis")).toHaveCount(0);
  });

  test("unlocks, adjusts points, and clamps at zero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("access-code")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("access-code").fill(accessCode);
    await page.getByRole("button", { name: "Abrir o pergaminho" }).click();
    await expect(page.getByText("Quadro dos Heróis")).toBeVisible();

    const row = page.locator("ol[aria-label='Ranking dos heróis'] > li").filter({ hasText: "Afonso" });
    const plus = row.getByRole("button", { name: /Adicionar um ponto a Afonso/ });
    const minus = row.getByRole("button", { name: /Subtrair um ponto de Afonso/ });

    await plus.click();
    await expect(row).toContainText(/\d+ pontos?/);

    await expect
      .poll(async () => {
        if (await minus.isDisabled()) {
          return "zero";
        }
        await minus.click();
        return "draining";
      }, { timeout: 15_000 })
      .toBe("zero");

    await expect(minus).toBeDisabled();
    await expect(row).toContainText("0 pontos");
  });
});
