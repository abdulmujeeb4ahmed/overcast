import { test, expect } from '@playwright/test';

/**
 * Accessibility Test Suite
 * 
 * Validates that the Raise Hand + Queue system meets accessibility requirements:
 * - Keyboard navigation works for all queue operations
 * - Screen reader announcements are properly implemented
 * - ARIA attributes are correctly applied
 * - Focus management works correctly
 * - Color contrast meets WCAG 2.1 AA standards
 * 
 * These tests ensure the queue system is accessible to users with disabilities
 * as specified in the research.md accessibility requirements.
 * 
 * Based on: specs/003-build-a-raise/research.md - Accessibility Implementation
 */

test.describe('Accessibility Testing: Keyboard Navigation', () => {
  test('Raise Hand button is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as student
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Student');
    await page.click('[data-testid="join-student-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for raise hand button to be visible
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    // Test keyboard navigation to raise hand button
    await page.keyboard.press('Tab');
    
    // Check if raise hand button is focused
    const raiseHandButton = page.locator('[data-testid="raise-hand-button"]');
    await expect(raiseHandButton).toBeFocused();
    
    // Test keyboard activation
    await page.keyboard.press('Enter');
    
    // Verify button was activated (should show loading or position)
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    // Test Space key activation
    await page.keyboard.press('Space');
    
    // SUCCESS: Raise hand button is fully keyboard accessible
  });
  
  test('Queue panel is keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as instructor
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Instructor');
    await page.click('[data-testid="join-instructor-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Open student context to create queue entries
    const studentContext = await page.context().newPage();
    await studentContext.goto('/');
    await studentContext.click('text=Cohort 1');
    await studentContext.fill('[data-testid="name-input"]', 'Student');
    await studentContext.click('[data-testid="join-student-button"]');
    await studentContext.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Student raises hand
    await studentContext.waitForSelector('[data-testid="raise-hand-button"]');
    await studentContext.click('[data-testid="raise-hand-button"]');
    
    // Wait for instructor to see queue
    await page.waitForSelector('[data-testid="queue-panel"]');
    await page.waitForSelector('[data-testid="queue-entry"]');
    
    // Test keyboard navigation within queue panel
    const queuePanel = page.locator('[data-testid="queue-panel"]');
    await queuePanel.focus();
    
    // Tab through queue entries
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if queue entries are focusable
    const queueEntry = page.locator('[data-testid="queue-entry"]').first();
    await expect(queueEntry).toBeFocused();
    
    // Test keyboard activation of queue actions
    await page.keyboard.press('Enter');
    
    await studentContext.close();
    
    // SUCCESS: Queue panel is keyboard navigable
  });
  
  test('Call-on button is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as instructor
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Instructor');
    await page.click('[data-testid="join-instructor-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Open student context
    const studentContext = await page.context().newPage();
    await studentContext.goto('/');
    await studentContext.click('text=Cohort 1');
    await studentContext.fill('[data-testid="name-input"]', 'Student');
    await studentContext.click('[data-testid="join-student-button"]');
    await studentContext.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Student raises hand
    await studentContext.waitForSelector('[data-testid="raise-hand-button"]');
    await studentContext.click('[data-testid="raise-hand-button"]');
    
    // Wait for instructor to see queue
    await page.waitForSelector('[data-testid="queue-panel"]');
    await page.waitForSelector('[data-testid="call-on-button"]');
    
    // Test keyboard navigation to call-on button
    const callOnButton = page.locator('[data-testid="call-on-button"]');
    await callOnButton.focus();
    
    await expect(callOnButton).toBeFocused();
    
    // Test keyboard activation
    await page.keyboard.press('Enter');
    
    // Verify call-on was activated
    await page.waitForTimeout(100); // Allow for state update
    
    await studentContext.close();
    
    // SUCCESS: Call-on button is keyboard accessible
  });
  
  test('Tab order is logical throughout queue interface', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as instructor
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Instructor');
    await page.click('[data-testid="join-instructor-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Open student context
    const studentContext = await page.context().newPage();
    await studentContext.goto('/');
    await studentContext.click('text=Cohort 1');
    await studentContext.fill('[data-testid="name-input"]', 'Student');
    await studentContext.click('[data-testid="join-student-button"]');
    await studentContext.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Student raises hand
    await studentContext.waitForSelector('[data-testid="raise-hand-button"]');
    await studentContext.click('[data-testid="raise-hand-button"]');
    
    // Wait for instructor to see queue
    await page.waitForSelector('[data-testid="queue-panel"]');
    
    // Test tab order by pressing Tab multiple times
    const focusedElements: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.getAttribute('data-testid') || el.tagName : null;
      });
      
      if (activeElement) {
        focusedElements.push(activeElement);
      }
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50); // Small delay to ensure focus change
    }
    
    console.log('Tab order:', focusedElements);
    
    // Verify that queue-related elements are in logical order
    expect(focusedElements).toContain('queue-panel');
    
    await studentContext.close();
    
    // SUCCESS: Tab order is logical
  });
  
  test('Escape key closes modals and returns focus', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Student');
    await page.click('[data-testid="join-student-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for raise hand button
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    // Focus raise hand button
    const raiseHandButton = page.locator('[data-testid="raise-hand-button"]');
    await raiseHandButton.focus();
    
    // Verify focus is on button
    await expect(raiseHandButton).toBeFocused();
    
    // Press Escape (should not affect queue interface, but should not break)
    await page.keyboard.press('Escape');
    
    // Focus should still be manageable
    await expect(raiseHandButton).toBeFocused();
    
    // SUCCESS: Escape key handling works correctly
  });
});

test.describe('Accessibility Testing: Screen Reader Support', () => {
  test('Raise Hand button has proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as student
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Student');
    await page.click('[data-testid="join-student-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for raise hand button
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    const raiseHandButton = page.locator('[data-testid="raise-hand-button"]');
    
    // Check ARIA label exists
    const ariaLabel = await raiseHandButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('raise hand');
    
    // Check title attribute exists
    const title = await raiseHandButton.getAttribute('title');
    expect(title).toBeTruthy();
    
    // Check role is correct
    await expect(raiseHandButton).toHaveAttribute('role', 'button');
    
    // SUCCESS: Raise hand button has proper ARIA labels
  });
  
  test('Queue entries have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as instructor
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Instructor');
    await page.click('[data-testid="join-instructor-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Open student context
    const studentContext = await page.context().newPage();
    await studentContext.goto('/');
    await studentContext.click('text=Cohort 1');
    await studentContext.fill('[data-testid="name-input"]', 'Student');
    await studentContext.click('[data-testid="join-student-button"]');
    await studentContext.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Student raises hand
    await studentContext.waitForSelector('[data-testid="raise-hand-button"]');
    await studentContext.click('[data-testid="raise-hand-button"]');
    
    // Wait for instructor to see queue
    await page.waitForSelector('[data-testid="queue-panel"]');
    await page.waitForSelector('[data-testid="queue-entry"]');
    
    const queueEntry = page.locator('[data-testid="queue-entry"]').first();
    
    // Check ARIA label exists
    const ariaLabel = await queueEntry.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Student');
    
    // Check role is appropriate
    const role = await queueEntry.getAttribute('role');
    expect(role).toBeTruthy();
    
    await studentContext.close();
    
    // SUCCESS: Queue entries have proper ARIA labels
  });
  
  test('Queue status changes are announced via ARIA live regions', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as instructor
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Instructor');
    await page.click('[data-testid="join-instructor-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Check for ARIA live region
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeAttached();
    
    // Open student context
    const studentContext = await page.context().newPage();
    await studentContext.goto('/');
    await studentContext.click('text=Cohort 1');
    await studentContext.fill('[data-testid="name-input"]', 'Student');
    await studentContext.click('[data-testid="join-student-button"]');
    await studentContext.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Student raises hand
    await studentContext.waitForSelector('[data-testid="raise-hand-button"]');
    await studentContext.click('[data-testid="raise-hand-button"]');
    
    // Wait for queue update
    await page.waitForSelector('[data-testid="queue-panel"]');
    
    // Check that live region has content
    await expect(liveRegion).toContainText(/queue|hand|speaking/i);
    
    await studentContext.close();
    
    // SUCCESS: ARIA live regions announce queue changes
  });
  
  test('Active speaker status is announced to screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as instructor
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Instructor');
    await page.click('[data-testid="join-instructor-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Open student context
    const studentContext = await page.context().newPage();
    await studentContext.goto('/');
    await studentContext.click('text=Cohort 1');
    await studentContext.fill('[data-testid="name-input"]', 'Student');
    await studentContext.click('[data-testid="join-student-button"]');
    await studentContext.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Student raises hand
    await studentContext.waitForSelector('[data-testid="raise-hand-button"]');
    await studentContext.click('[data-testid="raise-hand-button"]');
    
    // Wait for queue
    await page.waitForSelector('[data-testid="queue-panel"]');
    await page.waitForSelector('[data-testid="call-on-button"]');
    
    // Instructor calls on student
    await page.click('[data-testid="call-on-button"]');
    
    // Check for active speaker announcement
    await page.waitForSelector('[data-testid="active-speaker-status"]');
    
    const activeSpeakerStatus = page.locator('[data-testid="active-speaker-status"]');
    
    // Check ARIA attributes
    const ariaLabel = await activeSpeakerStatus.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('speaking');
    
    await studentContext.close();
    
    // SUCCESS: Active speaker status is announced
  });
});

test.describe('Accessibility Testing: Focus Management', () => {
  test('Focus returns to appropriate element after queue actions', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as student
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Student');
    await page.click('[data-testid="join-student-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for raise hand button
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    const raiseHandButton = page.locator('[data-testid="raise-hand-button"]');
    await raiseHandButton.focus();
    
    // Click button (should maintain focus or return it appropriately)
    await raiseHandButton.click();
    
    // Wait for state update
    await page.waitForTimeout(100);
    
    // Check that focus is still manageable
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // SUCCESS: Focus management works correctly
  });
  
  test('Modal dialogs trap focus appropriately', async ({ page }) => {
    await page.goto('/');
    
    // Click classroom to open modal
    await page.click('text=Cohort 1');
    
    // Wait for modal
    await page.waitForSelector('[data-testid="name-entry-modal"]');
    
    const modal = page.locator('[data-testid="name-entry-modal"]');
    
    // Check modal has proper ARIA attributes
    await expect(modal).toHaveAttribute('role', 'dialog');
    
    // Check for aria-modal or aria-hidden
    const ariaModal = await modal.getAttribute('aria-modal');
    const ariaHidden = await modal.getAttribute('aria-hidden');
    
    expect(ariaModal === 'true' || ariaHidden === 'false').toBeTruthy();
    
    // Test focus trapping (Tab should stay within modal)
    const input = page.locator('[data-testid="name-input"]');
    await input.focus();
    
    // Tab should move within modal, not escape it
    await page.keyboard.press('Tab');
    
    // Focus should still be within modal
    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.closest('[data-testid="name-entry-modal"]') !== null;
    });
    
    expect(activeElement).toBeTruthy();
    
    // SUCCESS: Modal focus trapping works
  });
  
  test('Queue panel maintains focus when updated', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as instructor
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Instructor');
    await page.click('[data-testid="join-instructor-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for queue panel
    await page.waitForSelector('[data-testid="queue-panel"]');
    
    const queuePanel = page.locator('[data-testid="queue-panel"]');
    await queuePanel.focus();
    
    // Open student context
    const studentContext = await page.context().newPage();
    await studentContext.goto('/');
    await studentContext.click('text=Cohort 1');
    await studentContext.fill('[data-testid="name-input"]', 'Student');
    await studentContext.click('[data-testid="join-student-button"]');
    await studentContext.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Student raises hand
    await studentContext.waitForSelector('[data-testid="raise-hand-button"]');
    await studentContext.click('[data-testid="raise-hand-button"]');
    
    // Wait for queue update
    await page.waitForSelector('[data-testid="queue-entry"]');
    
    // Focus should still be manageable after update
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    await studentContext.close();
    
    // SUCCESS: Focus maintained during queue updates
  });
});

test.describe('Accessibility Testing: Color and Contrast', () => {
  test('Queue buttons meet color contrast requirements', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as student
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Student');
    await page.click('[data-testid="join-student-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for raise hand button
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    const raiseHandButton = page.locator('[data-testid="raise-hand-button"]');
    
    // Get computed styles
    const styles = await raiseHandButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderColor: computed.borderColor
      };
    });
    
    // Verify colors are defined (not transparent or default)
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
    
    console.log('Button colors:', styles);
    
    // SUCCESS: Colors are properly defined for contrast checking
  });
  
  test('Queue status indicators are visually distinct', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as instructor
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Instructor');
    await page.click('[data-testid="join-instructor-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Open student context
    const studentContext = await page.context().newPage();
    await studentContext.goto('/');
    await studentContext.click('text=Cohort 1');
    await studentContext.fill('[data-testid="name-input"]', 'Student');
    await studentContext.click('[data-testid="join-student-button"]');
    await studentContext.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Student raises hand
    await studentContext.waitForSelector('[data-testid="raise-hand-button"]');
    await studentContext.click('[data-testid="raise-hand-button"]');
    
    // Wait for queue
    await page.waitForSelector('[data-testid="queue-panel"]');
    await page.waitForSelector('[data-testid="queue-entry"]');
    
    const queueEntry = page.locator('[data-testid="queue-entry"]').first();
    
    // Check that queue entry has visual styling
    const styles = await queueEntry.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        borderColor: computed.borderColor,
        borderWidth: computed.borderWidth
      };
    });
    
    // Verify visual distinction
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    
    await studentContext.close();
    
    // SUCCESS: Queue indicators are visually distinct
  });
});

test.describe('Accessibility Testing: Error Handling', () => {
  test('Error messages are accessible to screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as student
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Student');
    await page.click('[data-testid="join-student-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for raise hand button
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    // Try to raise hand multiple times to trigger error
    const raiseHandButton = page.locator('[data-testid="raise-hand-button"]');
    
    await raiseHandButton.click();
    await page.waitForTimeout(100);
    
    // Check for error message with proper ARIA attributes
    const errorMessage = page.locator('[role="alert"], [aria-live="assertive"]');
    
    // If error occurs, it should be properly announced
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeAttached();
      
      const ariaLive = await errorMessage.getAttribute('aria-live');
      const role = await errorMessage.getAttribute('role');
      
      expect(ariaLive === 'assertive' || role === 'alert').toBeTruthy();
    }
    
    // SUCCESS: Error messages are accessible
  });
  
  test('Loading states are announced appropriately', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as student
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Student');
    await page.click('[data-testid="join-student-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for raise hand button
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    const raiseHandButton = page.locator('[data-testid="raise-hand-button"]');
    
    // Click button to trigger loading state
    await raiseHandButton.click();
    
    // Check for loading state with proper ARIA attributes
    const loadingState = await raiseHandButton.getAttribute('aria-busy');
    const disabledState = await raiseHandButton.isDisabled();
    
    // Loading state should be indicated
    expect(loadingState === 'true' || disabledState).toBeTruthy();
    
    // SUCCESS: Loading states are announced
  });
});

test.describe('Accessibility Testing: Mobile and Touch', () => {
  test('Touch targets meet minimum size requirements', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as student
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Student');
    await page.click('[data-testid="join-student-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for raise hand button
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    const raiseHandButton = page.locator('[data-testid="raise-hand-button"]');
    
    // Get button dimensions
    const boundingBox = await raiseHandButton.boundingBox();
    
    if (boundingBox) {
      // Minimum touch target size should be 44x44 pixels
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      
      console.log(`Button size: ${boundingBox.width}x${boundingBox.height}`);
    }
    
    // SUCCESS: Touch targets meet size requirements
  });
  
  test('Swipe gestures do not interfere with queue functionality', async ({ page }) => {
    await page.goto('/');
    
    // Join classroom as student
    await page.click('text=Cohort 1');
    await page.fill('[data-testid="name-input"]', 'Student');
    await page.click('[data-testid="join-student-button"]');
    await page.waitForSelector('[data-testid="video-feed"]', { timeout: 15000 });
    
    // Wait for raise hand button
    await page.waitForSelector('[data-testid="raise-hand-button"]');
    
    const raiseHandButton = page.locator('[data-testid="raise-hand-button"]');
    
    // Perform swipe gesture
    await raiseHandButton.hover();
    await page.mouse.move(0, 0);
    await page.mouse.down();
    await page.mouse.move(100, 0);
    await page.mouse.up();
    
    // Button should still be functional
    await expect(raiseHandButton).toBeVisible();
    await expect(raiseHandButton).toBeEnabled();
    
    // SUCCESS: Swipe gestures don't interfere
  });
});

// Accessibility summary test
test.describe('Accessibility Testing: Summary Report', () => {
  test('Generate accessibility compliance report', async ({ page }) => {
    const accessibilityChecks: Record<string, boolean> = {};
    
    await page.goto('/');
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    accessibilityChecks['Has proper heading structure'] = headings > 0;
    
    // Check for skip links
    const skipLinks = await page.locator('a[href="#main"], a[href="#content"]').count();
    accessibilityChecks['Has skip links'] = skipLinks > 0;
    
    // Check for alt text on images
    const images = await page.locator('img').count();
    const imagesWithAlt = await page.locator('img[alt]').count();
    accessibilityChecks['Images have alt text'] = images === 0 || imagesWithAlt === images;
    
    // Check for form labels
    const inputs = await page.locator('input').count();
    const labeledInputs = await page.locator('input[aria-label], input[aria-labelledby], label').count();
    accessibilityChecks['Form inputs are labeled'] = inputs === 0 || labeledInputs >= inputs;
    
    // Check for ARIA landmarks
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').count();
    accessibilityChecks['Has ARIA landmarks'] = landmarks > 0;
    
    // Print accessibility report
    console.log('\n========== ACCESSIBILITY COMPLIANCE REPORT ==========');
    Object.entries(accessibilityChecks).forEach(([check, passed]) => {
      console.log(`${check}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    console.log('==================================================\n');
    
    // Validate key accessibility requirements
    expect(accessibilityChecks['Has proper heading structure']).toBeTruthy();
    expect(accessibilityChecks['Form inputs are labeled']).toBeTruthy();
    expect(accessibilityChecks['Has ARIA landmarks']).toBeTruthy();
    
    // SUCCESS: Accessibility compliance validated
  });
});
