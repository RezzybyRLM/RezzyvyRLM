(function() {
  'use strict';

  // Configuration
  const WIDGET_CONFIG = {
    apiUrl: 'https://rezzybyrlm.com/api/widget',
    version: '1.0.0',
    defaultLimit: 5,
    defaultTheme: 'light'
  };

  // Widget class
  class RezzyJobWidget {
    constructor(options = {}) {
      this.options = {
        companyId: options.companyId || null,
        limit: options.limit || WIDGET_CONFIG.defaultLimit,
        theme: options.theme || WIDGET_CONFIG.defaultTheme,
        container: options.container || 'rezzy-job-widget',
        showPoweredBy: options.showPoweredBy !== false,
        ...options
      };

      this.container = null;
      this.isLoaded = false;
      this.jobs = [];
      this.company = null;

      this.init();
    }

    async init() {
      if (!this.options.companyId) {
        this.showError('Company ID is required');
        return;
      }

      this.container = document.getElementById(this.options.container);
      if (!this.container) {
        console.error('Rezzy Job Widget: Container element not found');
        return;
      }

      this.showLoading();
      await this.loadData();
    }

    async loadData() {
      try {
        const url = `${WIDGET_CONFIG.apiUrl}?company_id=${this.options.companyId}&limit=${this.options.limit}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.company = data.company;
        this.jobs = data.jobs;
        this.render();
        this.isLoaded = true;
      } catch (error) {
        console.error('Rezzy Job Widget Error:', error);
        this.showError('Failed to load jobs. Please try again later.');
      }
    }

    showLoading() {
      this.container.innerHTML = `
        <div class="rezzy-widget-loading" style="
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            width: 20px;
            height: 20px;
            border: 2px solid #e5e7eb;
            border-top: 2px solid #FF6B6B;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
          "></div>
          Loading jobs...
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
    }

    showError(message) {
      this.container.innerHTML = `
        <div class="rezzy-widget-error" style="
          padding: 20px;
          text-align: center;
          color: #dc2626;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
        ">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">⚠️ Error</div>
          <div style="font-size: 14px;">${message}</div>
        </div>
      `;
    }

    render() {
      const theme = this.options.theme === 'dark' ? 'dark' : 'light';
      const themeStyles = this.getThemeStyles(theme);
      
      this.container.innerHTML = `
        <div class="rezzy-job-widget" style="${themeStyles.container}">
          ${this.renderHeader()}
          ${this.renderJobs()}
          ${this.renderFooter()}
        </div>
        <style>
          .rezzy-job-widget * { margin: 0; padding: 0; box-sizing: border-box; }
          .rezzy-job-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .rezzy-job-widget a { text-decoration: none; }
          .rezzy-job-widget a:hover { opacity: 0.8; }
          .rezzy-job-widget .job-item:hover { background: ${theme === 'dark' ? '#374151' : '#f9fafb'}; }
        </style>
      `;
    }

    renderHeader() {
      const theme = this.options.theme === 'dark' ? 'dark' : 'light';
      const headerStyles = this.getThemeStyles(theme).header;
      
      return `
        <div class="widget-header" style="${headerStyles}">
          <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">
            Jobs at ${this.company.name}
          </h2>
          <p style="font-size: 14px; opacity: 0.9;">
            ${this.jobs.length} open position${this.jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
      `;
    }

    renderJobs() {
      if (this.jobs.length === 0) {
        return this.renderNoJobs();
      }

      const theme = this.options.theme === 'dark' ? 'dark' : 'light';
      const jobStyles = this.getThemeStyles(theme).job;
      
      return `
        <div class="job-list" style="padding: 0;">
          ${this.jobs.map(job => `
            <div class="job-item" style="${jobStyles.item}">
              <div class="job-title" style="${jobStyles.title}">
                ${job.title}
                ${job.is_featured ? '<span class="featured-badge" style="background: #fbbf24; color: #92400e; padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: 500; margin-left: 8px;">Featured</span>' : ''}
              </div>
              <div class="job-meta" style="${jobStyles.meta}">
                📍 ${job.location} • ${job.job_type}
                ${job.salary_range ? ` • 💰 ${job.salary_range}` : ''}
              </div>
              <div class="job-description" style="${jobStyles.description}">
                ${job.description}
              </div>
              <a href="${job.apply_url}" class="job-apply" style="${jobStyles.apply}" target="_blank" rel="noopener noreferrer">
                Apply Now
              </a>
            </div>
          `).join('')}
        </div>
      `;
    }

    renderNoJobs() {
      const theme = this.options.theme === 'dark' ? 'dark' : 'light';
      const noJobsStyles = this.getThemeStyles(theme).noJobs;
      
      return `
        <div class="no-jobs" style="${noJobsStyles}">
          <p>No open positions at the moment.</p>
          <p>Check back soon for new opportunities!</p>
        </div>
      `;
    }

    renderFooter() {
      if (!this.options.showPoweredBy) return '';

      const theme = this.options.theme === 'dark' ? 'dark' : 'light';
      const footerStyles = this.getThemeStyles(theme).footer;
      
      return `
        <div class="widget-footer" style="${footerStyles}">
          <p>Powered by <a href="https://rezzybyrlm.com" target="_blank" style="color: #FF6B6B;">Rezzy Job Aggregator</a></p>
        </div>
      `;
    }

    getThemeStyles(theme) {
      const isDark = theme === 'dark';
      
      return {
        container: `
          max-width: 400px;
          margin: 0 auto;
          background: ${isDark ? '#1f2937' : '#fff'};
          border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        `,
        header: `
          background: #FF6B6B;
          color: white;
          padding: 16px;
          text-align: center;
        `,
        job: {
          item: `
            padding: 16px;
            border-bottom: 1px solid ${isDark ? '#374151' : '#f3f4f6'};
            transition: background-color 0.2s;
          `,
          title: `
            font-size: 16px;
            font-weight: 600;
            color: #FF6B6B;
            margin-bottom: 4px;
          `,
          meta: `
            font-size: 14px;
            color: ${isDark ? '#9ca3af' : '#6b7280'};
            margin-bottom: 8px;
          `,
          description: `
            font-size: 14px;
            color: ${isDark ? '#d1d5db' : '#4b5563'};
            margin-bottom: 12px;
            line-height: 1.4;
          `,
          apply: `
            display: inline-block;
            background: #FF6B6B;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
          `
        },
        noJobs: `
          padding: 32px;
          text-align: center;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
        `,
        footer: `
          background: ${isDark ? '#111827' : '#f9fafb'};
          padding: 12px;
          text-align: center;
          font-size: 12px;
          color: ${isDark ? '#9ca3af' : '#6b7280'};
        `
      };
    }

    // Public API methods
    refresh() {
      this.loadData();
    }

    updateOptions(newOptions) {
      this.options = { ...this.options, ...newOptions };
      if (this.isLoaded) {
        this.render();
      }
    }

    getJobs() {
      return this.jobs;
    }

    getCompany() {
      return this.company;
    }
  }

  // Auto-initialize widgets on page load
  function initializeWidgets() {
    const widgets = document.querySelectorAll('[data-rezzy-widget]');
    
    widgets.forEach(element => {
      const companyId = element.getAttribute('data-company-id');
      const limit = parseInt(element.getAttribute('data-limit')) || 5;
      const theme = element.getAttribute('data-theme') || 'light';
      const showPoweredBy = element.getAttribute('data-show-powered-by') !== 'false';

      if (companyId) {
        new RezzyJobWidget({
          companyId,
          limit,
          theme,
          container: element.id,
          showPoweredBy
        });
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidgets);
  } else {
    initializeWidgets();
  }

  // Expose to global scope
  window.RezzyJobWidget = RezzyJobWidget;

})();
