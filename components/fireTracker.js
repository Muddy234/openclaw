/**
 * fireTracker.js
 * Sidebar FIRE progress tracker that persists across all tabs
 * Shows projected net worth vs FIRE target with live updates
 */

/**
 * Render the FIRE tracker for the sidebar
 * @param {Object} snapshot - Current financial snapshot
 * @returns {string} HTML for the tracker
 */
function renderFireTracker(snapshot) {
  // Check if we have enough data to show the tracker
  if (!snapshot || !snapshot.general || !snapshot.general.monthlyExpense) {
    return '';
  }

  // Calculate projection using verification function (inflation-adjusted FIRE target)
  let projectedNetWorth = 0;
  let fireTarget = 0;
  let progress = 0;

  // Use calculateVerificationProjection for consistency with the chart
  // This uses inflation-adjusted ending expenses for the FIRE target
  if (typeof calculateVerificationProjection === 'function') {
    try {
      const result = calculateVerificationProjection(snapshot);
      if (result && result.summary) {
        projectedNetWorth = result.summary.endingNetWorth || 0;
        fireTarget = result.summary.fireTarget || 0;
      }
    } catch (e) {
      console.warn('FireTracker: Could not calculate projection', e);
    }
  } else if (typeof calculateProjection === 'function') {
    // Fallback to basic projection if verification not available
    try {
      const projection = calculateProjection(snapshot);
      if (projection && projection.summary) {
        projectedNetWorth = projection.summary.projectedNetWorth || 0;
        fireTarget = projection.summary.fireTarget || 0;
      }
    } catch (e) {
      console.warn('FireTracker: Could not calculate projection', e);
    }
  }

  // Fallback calculation if projection not available
  if (fireTarget === 0) {
    const annualExp = typeof getFireAnnualExpenses === 'function'
      ? getFireAnnualExpenses(snapshot)
      : (snapshot.general.monthlyExpense || 0) * 12;
    if (annualExp > 0) {
      fireTarget = annualExp * 25;
    }
  }

  // Calculate progress percentage (capped at 100% for display, but show actual if over)
  progress = fireTarget > 0 ? (projectedNetWorth / fireTarget) * 100 : 0;
  const displayProgress = Math.min(progress, 100);
  const isOverTarget = progress > 100;

  // Determine status for color coding
  const difference = projectedNetWorth - fireTarget;
  let statusClass = 'fire-tracker-behind';
  let statusLabel = 'Behind';

  if (progress >= 100) {
    statusClass = 'fire-tracker-ontrack';
    statusLabel = 'On Track';
  } else if (progress >= 90) {
    statusClass = 'fire-tracker-close';
    statusLabel = 'Close';
  }

  // Format currency helper (compact for sidebar)
  const formatCurrency = (n) => {
    const absValue = Math.abs(n);
    if (absValue >= 1000000) {
      return (n < 0 ? '-' : '') + '$' + (absValue / 1000000).toFixed(1) + 'M';
    }
    if (absValue >= 1000) {
      return (n < 0 ? '-' : '') + '$' + (absValue / 1000).toFixed(0) + 'K';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  };

  // Format difference with +/- sign
  const formatDifference = (n) => {
    const formatted = formatCurrency(Math.abs(n));
    return n >= 0 ? '+' + formatted : '-' + formatted;
  };

  return `
    <div class="fire-tracker ${statusClass}"
         role="complementary"
         aria-label="FIRE Progress Tracker">
      <div class="fire-tracker-title">
        <span class="fire-tracker-icon" aria-hidden="true"></span>
        FIRE Progress
      </div>
      <div class="fire-tracker-row">
        <span class="fire-tracker-label">Projected</span>
        <span class="fire-tracker-value">${formatCurrency(projectedNetWorth)}</span>
      </div>
      <div class="fire-tracker-row">
        <span class="fire-tracker-label">Target</span>
        <span class="fire-tracker-value">${formatCurrency(fireTarget)}</span>
      </div>
      <div class="fire-tracker-row">
        <span class="fire-tracker-label">Gap</span>
        <span class="fire-tracker-value ${difference >= 0 ? 'text-success' : ''}">${formatDifference(difference)}</span>
      </div>
      <div class="fire-tracker-progress">
        <div class="fire-tracker-progress-bar"
             style="width: ${displayProgress}%"
             role="progressbar"
             aria-valuenow="${Math.round(progress)}"
             aria-valuemin="0"
             aria-valuemax="100">
        </div>
      </div>
      <div class="fire-tracker-footer">
        <span>${Math.round(progress)}%${isOverTarget ? ' (exceeds!)' : ''}</span>
        <span class="fire-tracker-status">${statusLabel}</span>
      </div>
    </div>
  `;
}

// Expose globally
window.renderFireTracker = renderFireTracker;
