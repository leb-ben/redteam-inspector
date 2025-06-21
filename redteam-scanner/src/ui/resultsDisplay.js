/**
 * Results Display Module
 * Creates a dark-themed, interactive display for scan results
 */

class ResultsDisplay {
    constructor() {
        this.container = null;
        this.resultsData = null;
        this.activeTab = 'overview';
        this.styles = this.getStyles();
    }
    
    getStyles() {
        return `
            .redteam-scanner-results {
                position: fixed;
                top: 0;
                right: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                color: #e0e0e0;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 14px;
                overflow: hidden;
                z-index: 999999;
                display: flex;
                flex-direction: column;
            }
            
            .scanner-header {
                background: #1a1a1a;
                padding: 15px 20px;
                border-bottom: 2px solid #bb86fc;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .scanner-title {
                font-size: 20px;
                font-weight: bold;
                color: #bb86fc;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .scanner-close {
                background: #bb86fc;
                color: #000;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .scanner-close:hover {
                background: #9c6cdc;
                transform: scale(1.05);
            }
            
            .scanner-tabs {
                background: #2a2a2a;
                padding: 0;
                display: flex;
                border-bottom: 1px solid #444;
            }
            
            .scanner-tab {
                padding: 12px 24px;
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
                border-bottom: 3px solid transparent;
            }
            
            .scanner-tab:hover {
                color: #bb86fc;
                background: rgba(187, 134, 252, 0.1);
            }
            
            .scanner-tab.active {
                color: #bb86fc;
                border-bottom-color: #bb86fc;
                background: rgba(187, 134, 252, 0.05);
            }
            
            .scanner-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #1a1a1a;
            }
            
            .scanner-section {
                margin-bottom: 30px;
                background: #2a2a2a;
                border-radius: 8px;
                padding: 20px;
                border: 1px solid #333;
            }
            
            .scanner-section-title {
                font-size: 18px;
                color: #bb86fc;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .scanner-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            
            .scanner-table th {
                background: #333;
                color: #bb86fc;
                padding: 12px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #444;
            }
            
            .scanner-table td {
                padding: 10px 12px;
                border: 1px solid #444;
                background: #1a1a1a;
                vertical-align: top;
            }
            
            .scanner-table tr:hover td {
                background: rgba(187, 134, 252, 0.05);
            }
            
            .scanner-table a {
                color: #03dac6;
                text-decoration: none;
                word-break: break-all;
            }
            
            .scanner-table a:hover {
                text-decoration: underline;
                color: #4ff3e0;
            }
            
            .severity-high {
                color: #ff5252;
                font-weight: bold;
            }
            
            .severity-medium {
                color: #ffb74d;
                font-weight: bold;
            }
            
            .severity-low {
                color: #81c784;
                font-weight: bold;
            }
            
            .scanner-stat {
                display: inline-block;
                background: #333;
                padding: 8px 16px;
                border-radius: 4px;
                margin: 5px;
                border: 1px solid #444;
            }
            
            .scanner-stat-label {
                color: #888;
                font-size: 12px;
            }
            
            .scanner-stat-value {
                color: #bb86fc;
                font-size: 20px;
                font-weight: bold;
            }
            
            .scanner-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                margin: 2px;
            }
            
            .badge-api {
                background: #2196f3;
                color: #fff;
            }
            
            .badge-jwt {
                background: #ff9800;
                color: #fff;
            }
            
            .badge-key {
                background: #f44336;
                color: #fff;
            }
            
            .badge-email {
                background: #4caf50;
                color: #fff;
            }
            
            .scanner-code {
                background: #0a0a0a;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                overflow-x: auto;
                color: #03dac6;
            }
            
            .scanner-empty {
                text-align: center;
                color: #666;
                padding: 40px;
                font-style: italic;
            }
            
            .scanner-export {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #bb86fc;
                color: #000;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                transition: all 0.3s;
            }
            
            .scanner-export:hover {
                background: #9c6cdc;
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
            }
            
            .scanner-loading {
                text-align: center;
                padding: 40px;
            }
            
            .scanner-spinner {
                border: 3px solid #333;
                border-top: 3px solid #bb86fc;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .collapsible {
                cursor: pointer;
                user-select: none;
            }
            
            .collapsible:before {
                content: '▼';
                display: inline-block;
                margin-right: 5px;
                transition: transform 0.3s;
            }
            
            .collapsible.collapsed:before {
                transform: rotate(-90deg);
            }
            
            .collapsible-content {
                max-height: 1000px;
                overflow: hidden;
                transition: max-height 0.3s ease-out;
            }
            
            .collapsible-content.collapsed {
                max-height: 0;
            }
            
            ::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            
            ::-webkit-scrollbar-track {
                background: #1a1a1a;
            }
            
            ::-webkit-scrollbar-thumb {
                background: #444;
                border-radius: 5px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
        `;
    }
    
    create(results) {
        this.resultsData = results;
        
        // Remove existing container if any
        this.destroy();
        
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'redteam-scanner-results';
        
        // Add styles
        const styleElement = document.createElement('style');
        styleElement.textContent = this.styles;
        document.head.appendChild(styleElement);
        
        // Create header
        const header = this.createHeader();
        this.container.appendChild(header);
        
        // Create tabs
        const tabs = this.createTabs();
        this.container.appendChild(tabs);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'scanner-content';
        content.id = 'scanner-content';
        this.container.appendChild(content);
        
        // Create export button
        const exportBtn = this.createExportButton();
        this.container.appendChild(exportBtn);
        
        // Add to body
        document.body.appendChild(this.container);
        
        // Show initial tab
        this.showTab('overview');
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.className = 'scanner-header';
        
        const title = document.createElement('div');
        title.className = 'scanner-title';
        title.innerHTML = '🔍 RedTeam Security Scanner Results';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'scanner-close';
        closeBtn.textContent = '✕ Close';
        closeBtn.onclick = () => this.destroy();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    createTabs() {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'scanner-tabs';
        
        const tabs = [
            { id: 'overview', label: '📊 Overview' },
            { id: 'urls', label: '🔗 URLs & Files' },
            { id: 'sensitive', label: '🔐 Sensitive Data' },
            { id: 'vulnerabilities', label: '⚠️ Vulnerabilities' },
            { id: 'properties', label: '📋 Properties' },
            { id: 'raw', label: '💾 Raw Data' }
        ];
        
        tabs.forEach(tab => {
            const tabBtn = document.createElement('button');
            tabBtn.className = 'scanner-tab';
            tabBtn.id = `tab-${tab.id}`;
            tabBtn.textContent = tab.label;
            tabBtn.onclick = () => this.showTab(tab.id);
            tabsContainer.appendChild(tabBtn);
        });
        
        return tabsContainer;
    }
    
    showTab(tabId) {
        this.activeTab = tabId;
        
        // Update tab buttons
        document.querySelectorAll('.scanner-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`tab-${tabId}`).classList.add('active');
        
        // Update content
        const content = document.getElementById('scanner-content');
        content.innerHTML = '';
        
        switch (tabId) {
            case 'overview':
                content.appendChild(this.createOverviewContent());
                break;
            case 'urls':
                content.appendChild(this.createURLsContent());
                break;
            case 'sensitive':
                content.appendChild(this.createSensitiveDataContent());
                break;
            case 'vulnerabilities':
                content.appendChild(this.createVulnerabilitiesContent());
                break;
            case 'properties':
                content.appendChild(this.createPropertiesContent());
                break;
            case 'raw':
                content.appendChild(this.createRawDataContent());
                break;
        }
    }
    
    createOverviewContent() {
        const container = document.createElement('div');
        
        // Statistics section
        const statsSection = document.createElement('div');
        statsSection.className = 'scanner-section';
        
        const statsTitle = document.createElement('h2');
        statsTitle.className = 'scanner-section-title';
        statsTitle.textContent = '📈 Scan Statistics';
        statsSection.appendChild(statsTitle);
        
        const stats = this.resultsData.statistics || {};
        const statItems = [
            { label: 'Total URLs', value: stats.totalURLs || 0 },
            { label: 'Sensitive Data', value: stats.totalSensitiveData || 0 },
            { label: 'Vulnerabilities', value: stats.totalVulnerabilities || 0 },
            { label: 'Properties', value: stats.totalProperties || 0 },
            { label: 'Files Found', value: stats.totalFiles || 0 },
            { label: 'Scan Duration', value: `${stats.scanDuration || 0}ms` }
        ];
        
        const statsContainer = document.createElement('div');
        statItems.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.className = 'scanner-stat';
            statDiv.innerHTML = `
                <div class="scanner-stat-label">${stat.label}</div>
                <div class="scanner-stat-value">${stat.value}</div>
            `;
            statsContainer.appendChild(statDiv);
        });
        statsSection.appendChild(statsContainer);
        container.appendChild(statsSection);
        
        // Frameworks detected
        if (stats.frameworks && stats.frameworks.length > 0) {
            const frameworksSection = document.createElement('div');
            frameworksSection.className = 'scanner-section';
            
            const frameworksTitle = document.createElement('h2');
            frameworksTitle.className = 'scanner-section-title';
            frameworksTitle.textContent = '🛠️ Detected Frameworks';
            frameworksSection.appendChild(frameworksTitle);
            
            const frameworksList = document.createElement('div');
            stats.frameworks.forEach(framework => {
                const badge = document.createElement('span');
                badge.className = 'scanner-badge badge-api';
                badge.textContent = framework;
                frameworksList.appendChild(badge);
            });
            frameworksSection.appendChild(frameworksList);
            container.appendChild(frameworksSection);
        }
        
        // Summary
        const summarySection = document.createElement('div');
        summarySection.className = 'scanner-section';
        
        const summaryTitle = document.createElement('h2');
        summaryTitle.className = 'scanner-section-title';
        summaryTitle.textContent = '📝 Scan Summary';
        summarySection.appendChild(summaryTitle);
        
        const summaryContent = document.createElement('div');
        summaryContent.innerHTML = `
            <p><strong>Target:</strong> ${this.resultsData.url}</p>
            <p><strong>Domain:</strong> ${this.resultsData.domain}</p>
            <p><strong>Timestamp:</strong> ${this.resultsData.timestamp}</p>
        `;
        summarySection.appendChild(summaryContent);
        container.appendChild(summarySection);
        
        return container;
    }
    
    createURLsContent() {
        const container = document.createElement('div');
        
        // Discovered URLs
        if (this.resultsData.urls && this.resultsData.urls.length > 0) {
            const urlsSection = document.createElement('div');
            urlsSection.className = 'scanner-section';
            
            const urlsTitle = document.createElement('h2');
            urlsTitle.className = 'scanner-section-title';
            urlsTitle.textContent = `🔗 Discovered URLs (${this.resultsData.urls.length})`;
            urlsSection.appendChild(urlsTitle);
            
            const table = document.createElement('table');
            table.className = 'scanner-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Source</th>
                        <th>Actions</th>
                    </tr>
                </thead>
            `;
            
            const tbody = document.createElement('tbody');
            this.resultsData.urls.forEach(urlInfo => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><a href="${urlInfo.url}" target="_blank">${this.truncateUrl(urlInfo.url)}</a></td>
                    <td>${urlInfo.source}</td>
                    <td>
                        <button onclick="window.open('${urlInfo.url}', '_blank')" class="scanner-badge">Open</button>
                        <button onclick="navigator.clipboard.writeText('${urlInfo.url}')" class="scanner-badge">Copy</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            urlsSection.appendChild(table);
            container.appendChild(urlsSection);
        }
        
        // Discovered Files
        if (this.resultsData.files && this.resultsData.files.length > 0) {
            const filesSection = document.createElement('div');
            filesSection.className = 'scanner-section';
            
            const filesTitle = document.createElement('h2');
            filesTitle.className = 'scanner-section-title';
            filesTitle.textContent = `📁 Discovered Files (${this.resultsData.files.length})`;
            filesSection.appendChild(filesTitle);
            
            const filesList = document.createElement('div');
            this.resultsData.files.forEach(file => {
                const fileDiv = document.createElement('div');
                fileDiv.style.margin = '5px 0';
                fileDiv.innerHTML = `<a href="${file}" target="_blank">${file}</a>`;
                filesList.appendChild(fileDiv);
            });
            
            filesSection.appendChild(filesList);
            container.appendChild(filesSection);
        }
        
        if ((!this.resultsData.urls || this.resultsData.urls.length === 0) && 
            (!this.resultsData.files || this.resultsData.files.length === 0)) {
            container.innerHTML = '<div class="scanner-empty">No URLs or files discovered</div>';
        }
        
        return container;
    }
    
    createSensitiveDataContent() {
        const container = document.createElement('div');
        
        if (this.resultsData.sensitiveData && this.resultsData.sensitiveData.length > 0) {
            const section = document.createElement('div');
            section.className = 'scanner-section';
            
            const title = document.createElement('h2');
            title.className = 'scanner-section-title';
            title.textContent = `🔐 Sensitive Data Found (${this.resultsData.sensitiveData.length})`;
            section.appendChild(title);
            
            const table = document.createElement('table');
            table.className = 'scanner-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Value (Masked)</th>
                        <th>Source</th>
                    </tr>
                </thead>
            `;
            
            const tbody = document.createElement('tbody');
            this.resultsData.sensitiveData.forEach(data => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><span class="scanner-badge badge-${data.type.toLowerCase()}">${data.type}</span></td>
                    <td><code>${data.value}</code></td>
                    <td>${data.source}</td>
                `;
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            section.appendChild(table);
            container.appendChild(section);
        } else {
            container.innerHTML = '<div class="scanner-empty">No sensitive data found</div>';
        }
        
        return container;
    }
    
    createVulnerabilitiesContent() {
        const container = document.createElement('div');
        
        if (this.resultsData.vulnerabilities && this.resultsData.vulnerabilities.length > 0) {
            const section = document.createElement('div');
            section.className = 'scanner-section';
            
            const title = document.createElement('h2');
            title.className = 'scanner-section-title';
            title.textContent = `⚠️ Vulnerabilities Found (${this.resultsData.vulnerabilities.length})`;
            section.appendChild(title);
            
            const table = document.createElement('table');
            table.className = 'scanner-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Description</th>
                        <th>Evidence</th>
                    </tr>
                </thead>
            `;
            
            const tbody = document.createElement('tbody');
            this.resultsData.vulnerabilities.forEach(vuln => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${vuln.type}</td>
                    <td><span class="severity-${vuln.severity.toLowerCase()}">${vuln.severity}</span></td>
                    <td>${vuln.description}</td>
                    <td><pre class="scanner-code">${JSON.stringify(vuln.evidence, null, 2)}</pre></td>
                `;
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            section.appendChild(table);
            container.appendChild(section);
        } else {
            container.innerHTML = '<div class="scanner-empty">No vulnerabilities found</div>';
        }
        
        return container;
    }
    
    createPropertiesContent() {
        const container = document.createElement('div');
        
        if (this.resultsData.properties && this.resultsData.properties.length > 0) {
            const section = document.createElement('div');
            section.className = 'scanner-section';
            
            const title = document.createElement('h2');
            title.className = 'scanner-section-title';
            title.textContent = `📋 Interesting Properties (${this.resultsData.properties.length})`;
            section.appendChild(title);
            
            // Group properties by depth
            const groupedProps = {};
            this.resultsData.properties.forEach(prop => {
                const depth = prop.depth || 0;
                if (!groupedProps[depth]) {
                    groupedProps[depth] = [];
                }
                groupedProps[depth].push(prop);
            });
            
            Object.entries(groupedProps).forEach(([depth, props]) => {
                const depthSection = document.createElement('div');
                depthSection.style.marginBottom = '20px';
                
                const depthTitle = document.createElement('h3');
                depthTitle.className = 'collapsible';
                depthTitle.textContent = `Depth ${depth} (${props.length} properties)`;
                depthTitle.onclick = (e) => {
                    e.target.classList.toggle('collapsed');
                    e.target.nextElementSibling.classList.toggle('collapsed');
                };
                depthSection.appendChild(depthTitle);
                
                const depthContent = document.createElement('div');
                depthContent.className = 'collapsible-content';
                
                const table = document.createElement('table');
                table.className = 'scanner-table';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Path</th>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Attributes</th>
                        </tr>
                    </thead>
                `;
                
                const tbody = document.createElement('tbody');
                props.forEach(prop => {
                    const row = document.createElement('tr');
                    const attrs = [];
                    if (prop.writable) attrs.push('W');
                    if (prop.enumerable) attrs.push('E');
                    if (prop.configurable) attrs.push('C');
                    
                    row.innerHTML = `
                        <td><code>${prop.path}</code></td>
                        <td>${prop.type}</td>
                        <td>${this.formatValue(prop.value)}</td>
                        <td>${attrs.join(', ')}</td>
                    `;
                    tbody.appendChild(row);
                });
                
                table.appendChild(tbody);
                depthContent.appendChild(table);
                depthSection.appendChild(depthContent);
                section.appendChild(depthSection);
            });
            
            container.appendChild(section);
        } else {
            container.innerHTML = '<div class="scanner-empty">No interesting properties found</div>';
        }
        
        return container;
    }
    
    createRawDataContent() {
        const container = document.createElement('div');
        
        const section = document.createElement('div');
        section.className = 'scanner-section';
        
        const title = document.createElement('h2');
        title.className = 'scanner-section-title';
        title.textContent = '💾 Raw Scan Data';
        section.appendChild(title);
        
        const pre = document.createElement('pre');
        pre.className = 'scanner-code';
        pre.style.maxHeight = '600px';
        pre.style.overflow = 'auto';
        pre.textContent = JSON.stringify(this.resultsData, null, 2);
        
        section.appendChild(pre);
        container.appendChild(section);
        
        return container;
    }
    
    createExportButton() {
        const button = document.createElement('button');
        button.className = 'scanner-export';
        button.textContent = '📥 Export Results';
        button.onclick = () => this.exportResults();
        return button;
    }
    
    exportResults() {
        const dataStr = JSON.stringify(this.resultsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `redteam-scan-${this.resultsData.domain}-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    truncateUrl(url) {
        if (url.length > 80) {
            return url.substring(0, 77) + '...';
        }
        return url;
    }
    
    formatValue(value) {
        if (typeof value === 'string' && value.length > 100) {
            return `<span title="${value}">${value.substring(0, 97)}...</span>`;
        }
        return value;
    }
    
    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultsDisplay;
} else {
    window.ResultsDisplay = ResultsDisplay;
}
