/**
 * tabNavigation.js
 * Handles dashboard tab navigation and state management
 * WCAG 2.1 AA compliant tab interface
 */

(function() {
  'use strict';

  // State management
  let currentTab = 'overview';
  const TAB_STORAGE_KEY = 'financialGPS_activeTab';
  const VALID_TABS = ['summary', 'overview', 'investments', 'projections', 'fire', 'debts', 'taxes', 'scenarios'];

  /**
   * Initialize tab navigation
   * Called after dashboard renders
   */
  function initTabNavigation() {
    // Restore last active tab from localStorage
    const savedTab = getSavedTab();
    if (savedTab) {
      currentTab = savedTab;
    }

    // Set up event listeners
    attachTabListeners();
    attachMobileMenuListener();
    attachKeyboardNavigation();

    // Show initial tab
    switchTab(currentTab);
  }

  /**
   * Get saved tab from localStorage
   * Validates against allowed tabs for security
   */
  function getSavedTab() {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY);
      if (saved && VALID_TABS.includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load saved tab:', e);
    }
    return null;
  }

  /**
   * Save active tab to localStorage
   */
  function saveActiveTab(tabId) {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tabId);
    } catch (e) {
      console.warn('Failed to save active tab:', e);
    }
  }

  /**
   * Attach click listeners to tab buttons
   */
  function attachTabListeners() {
    const tabs = document.querySelectorAll('.dashboard-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = tab.getAttribute('data-tab');
        if (tabId && VALID_TABS.includes(tabId)) {
          switchTab(tabId);
        }
      });
    });
  }

  /**
   * Attach mobile menu toggle listener
   */
  function attachMobileMenuListener() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.dashboard-sidebar');

    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', isOpen.toString());
      });

      // Close menu when tab is clicked on mobile
      const tabs = document.querySelectorAll('.dashboard-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          if (window.innerWidth < 768) {
            sidebar.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (window.innerWidth < 768 &&
            sidebar.classList.contains('is-open') &&
            !sidebar.contains(e.target) &&
            !toggle.contains(e.target)) {
          sidebar.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /**
   * Attach keyboard navigation (Arrow keys)
   * ACCESSIBILITY: WCAG 2.1 requirement for tab controls
   */
  function attachKeyboardNavigation() {
    const tabs = Array.from(document.querySelectorAll('.dashboard-tab'));

    tabs.forEach((tab, index) => {
      tab.addEventListener('keydown', (e) => {
        let newIndex = index;

        switch(e.key) {
          case 'ArrowDown':
          case 'ArrowRight':
            e.preventDefault();
            newIndex = (index + 1) % tabs.length;
            break;
          case 'ArrowUp':
          case 'ArrowLeft':
            e.preventDefault();
            newIndex = (index - 1 + tabs.length) % tabs.length;
            break;
          case 'Home':
            e.preventDefault();
            newIndex = 0;
            break;
          case 'End':
            e.preventDefault();
            newIndex = tabs.length - 1;
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            const tabId = tab.getAttribute('data-tab');
            if (tabId) {
              switchTab(tabId);
            }
            return;
          default:
            return;
        }

        tabs[newIndex].focus();
        const newTabId = tabs[newIndex].getAttribute('data-tab');
        if (newTabId) {
          switchTab(newTabId);
        }
      });
    });
  }

  /**
   * Switch to a specific tab
   * @param {string} tabId - Tab identifier
   */
  function switchTab(tabId) {
    // Validate tabId
    if (!VALID_TABS.includes(tabId)) {
      console.error('Invalid tab ID:', tabId);
      return;
    }

    // Update tab buttons
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === tabId;
      tab.setAttribute('aria-selected', isActive.toString());
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // Update panels
    const panels = document.querySelectorAll('.dashboard-panel');
    panels.forEach(panel => {
      const isActive = panel.getAttribute('data-panel') === tabId;

      if (isActive) {
        panel.removeAttribute('hidden');
        panel.setAttribute('aria-hidden', 'false');
      } else {
        panel.setAttribute('hidden', '');
        panel.setAttribute('aria-hidden', 'true');
      }
    });

    // Update state
    currentTab = tabId;
    saveActiveTab(tabId);

    // Scroll to top of content
    const content = document.querySelector('.dashboard-content');
    if (content) {
      content.scrollTop = 0;
    }

    // Re-initialize any charts that need rendering when their tab becomes visible
    if (tabId === 'summary') {
      setTimeout(() => {
        if (typeof initSummaryCharts === 'function') {
          initSummaryCharts();
        }
      }, 50);
    } else if (tabId === 'projections') {
      setTimeout(() => {
        if (typeof initNetWorthChart === 'function') {
          initNetWorthChart();
        }
      }, 50);
    } else if (tabId === 'debts') {
      setTimeout(() => {
        if (typeof initDebtPayoffChart === 'function') {
          initDebtPayoffChart();
        }
      }, 50);
    } else if (tabId === 'investments') {
      setTimeout(() => {
        if (typeof initInvestmentCharts === 'function') {
          initInvestmentCharts();
        }
      }, 50);
    } else if (tabId === 'scenarios') {
      setTimeout(() => {
        if (typeof initScenarioComparisonChart === 'function') {
          initScenarioComparisonChart();
        }
      }, 50);
    } else if (tabId === 'overview') {
      setTimeout(() => {
        if (typeof initBudgetCharts === 'function') initBudgetCharts();
        if (typeof initExpenseSliders === 'function') initExpenseSliders();
      }, 50);
    }
  }

  /**
   * Get current active tab
   * @returns {string} Current tab ID
   */
  function getCurrentTab() {
    return currentTab;
  }

  // Expose public API
  window.DashboardTabs = {
    init: initTabNavigation,
    switchTab: switchTab,
    getCurrentTab: getCurrentTab
  };

})();
