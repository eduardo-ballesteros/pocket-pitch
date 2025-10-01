const { test, expect } = require('@playwright/test');

test.describe('Pocket Pitch Generator', () => {
  test('should generate a pitch with debug mode', async ({ page }) => {
    // Navigate to the app with debug flag
    await page.goto('http://localhost:3000?debug=true');

    // Fill in the form
    await page.fill('input[placeholder="Service Provider Name"]', 'Anthropic');
    await page.fill('input[placeholder="Service Provider URL"]', 'https://anthropic.com');
    await page.fill('input[placeholder="Target Customer Name"]', 'OpenAI');
    await page.fill('input[placeholder="Target Customer URL"]', 'https://openai.com');
    await page.fill('textarea[placeholder="Enter additional context or information"]',
      'AI research and development partnership opportunities');

    // Click the generate button
    await page.click('button:has-text("Generate Pitch")');

    // Wait for the loading to complete (button text changes back)
    await expect(page.locator('button:has-text("Generate Pitch")')).toBeVisible({ timeout: 60000 });

    // Check if we got results or debug information
    const resultSection = page.locator('h3:has-text("Generated Pitch")');
    const debugSection = page.locator('h3:has-text("Debug Information")');
    const errorSection = page.locator('.bg-red-100');

    // Wait for one of these to appear
    await Promise.race([
      resultSection.waitFor({ timeout: 60000 }),
      debugSection.waitFor({ timeout: 60000 }),
      errorSection.waitFor({ timeout: 60000 })
    ]);

    // Log what we got
    if (await resultSection.isVisible()) {
      console.log('✓ Generated pitch successfully');
    }

    if (await debugSection.isVisible()) {
      console.log('✓ Debug information is visible');

      // Get debug info text content
      const debugText = await page.locator('.bg-gray-100').innerText();
      console.log('\n=== DEBUG INFO ===\n', debugText);

      // Check for specific debug sections
      await expect(page.locator('h4:has-text("Request Data")')).toBeVisible();
      await expect(page.locator('h4:has-text("Tavily API")')).toBeVisible();
      await expect(page.locator('h4:has-text("Perplexity API")')).toBeVisible();
    }

    if (await errorSection.isVisible()) {
      const errorText = await errorSection.innerText();
      console.log('✗ Error occurred:', errorText);
    }

    // Take a screenshot for inspection
    await page.screenshot({ path: 'test-results/pitch-generation.png', fullPage: true });
  });

  test('should generate a pitch without debug mode', async ({ page }) => {
    // Navigate to the app without debug flag
    await page.goto('http://localhost:3000');

    // Fill in the form
    await page.fill('input[placeholder="Service Provider Name"]', 'Tesla');
    await page.fill('input[placeholder="Service Provider URL"]', 'https://tesla.com');
    await page.fill('input[placeholder="Target Customer Name"]', 'Ford');
    await page.fill('input[placeholder="Target Customer URL"]', 'https://ford.com');
    await page.fill('textarea[placeholder="Enter additional context or information"]',
      'Electric vehicle collaboration');

    // Click the generate button
    await page.click('button:has-text("Generate Pitch")');

    // Wait for the loading to complete
    await expect(page.locator('button:has-text("Generate Pitch")')).toBeVisible({ timeout: 60000 });

    // Check that debug section should NOT be visible
    const debugSection = page.locator('h3:has-text("Debug Information")');
    await expect(debugSection).not.toBeVisible();

    // Check for result or error
    const resultSection = page.locator('h3:has-text("Generated Pitch")');
    const errorSection = page.locator('.bg-red-100');

    const hasResult = await resultSection.isVisible();
    const hasError = await errorSection.isVisible();

    if (hasResult) {
      console.log('✓ Generated pitch successfully (no debug info shown)');
    } else if (hasError) {
      const errorText = await errorSection.innerText();
      console.log('✗ Error occurred:', errorText);
    }

    // Take a screenshot
    await page.screenshot({ path: 'test-results/pitch-generation-no-debug.png', fullPage: true });
  });
});
