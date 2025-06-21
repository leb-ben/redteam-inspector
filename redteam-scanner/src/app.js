/**
 * RedTeam Security Scanner - Main Application
 * Orchestrates all scanning modules and provides a unified interface
 */

(function() {
    'use strict';
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        console.error('This script must be run in a browser environment');
        return;
    }
    
    class RedTeamScanner {
        constructor() {
            this.scanner = null;
            this.overlayRemover = null;
            this.resultsDisplay = null;
            this.isScanning = false;
            this.scanResults = null;
        }
        
        async init() {
            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                  RedTeam Security Scanner v1.0                 ║
║                Enterprise-Grade Security Assessment            ║
╚═══════════════════════════════════════════════════════════════╝
            `);
            
            // Load dependencies if not already loaded
            await this.loadDependencies();
            
            // Initialize modules
            this.scanner = new SecurityScanner({
                maxDepth: 5,
                maxProperties: 10000,
                timeout: 30000,
                enableHeapAnalysis: true,
                enableNetworkMonitoring: true,
                enableDeepDOMAnalysis: true
            });
            
            this.overlayRemover = new OverlayRemover();
            this.resultsDisplay = new ResultsDisplay();
            
            // Set up keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            console.log('✅ RedTeam Scanner initialized successfully');
            console.log('📌 Press Ctrl+Shift+S to start scanning');
            console.log('📌 Press Ctrl+Shift+R to remove overlays');
            console.log('📌 Press Ctrl+Shift+V to view last results');
        }
        
        async loadDependencies() {
            // Check if modules are already loaded
            if (typeof SecurityScanner === 'undefined') {
                await this.loadScript('/src/core/scanner.js');
            }
            if (typeof OverlayRemover === 'undefined') {
                await this.loadScript('/src/ui/overlayRemover.js');
            }
            if (typeof ResultsDisplay === 'undefined') {
                await this.loadScript('/src/ui/resultsDisplay.js');
            }
        }
        
        loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+Shift+S - Start scan
                if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                    e.preventDefault();
                    this.startScan();
                }
                
                // Ctrl+Shift+R - Remove overlays
                if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                    e.preventDefault();
                    this.removeOverlays();
                }
                
                // Ctrl+Shift+V - View results
                if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                    e.preventDefault();
                    this.viewResults();
                }
                
                // Escape - Close results
                if (e.key === 'Escape' && this.resultsDisplay.container) {
                    this.resultsDisplay.destroy();
                }
            });
        }
        
        async startScan() {
            if (this.isScanning) {
                console.warn('⚠️ Scan already in progress');
                return;
            }
            
            this.isScanning = true;
            console.log('🚀 Starting comprehensive security scan...');
            
            // Show scanning indicator
            this.showScanningIndicator();
            
            try {
                // Perform the scan
                this.scanResults = await this.scanner.performDeepScan();
                
                // Display results
                this.resultsDisplay.create(this.scanResults);
                
                // Log summary
                this.logScanSummary();
                
            } catch (error) {
                console.error('❌ Scan failed:', error);
                alert('Scan failed: ' + error.message);
            } finally {
                this.isScanning = false;
                this.hideScanningIndicator();
            }
        }
        
        removeOverlays() {
            console.log('🔓 Removing overlays and blur effects...');
            
            const result = this.overlayRemover.removeAll();
            
            console.log(`✅ Overlay removal complete:
- Removed ${result.removedCount} elements
- Modified ${result.modifiedCount} elements`);
            
            // Show notification
            this.showNotification(`Removed ${result.removedCount} overlays and modified ${result.modifiedCount} elements`);
        }
        
        viewResults() {
            if (!this.scanResults) {
                console.warn('⚠️ No scan results available. Run a scan first.');
                this.showNotification('No scan results available. Press Ctrl+Shift+S to start a scan.');
                return;
            }
            
            this.resultsDisplay.create(this.scanResults);
        }
        
        showScanningIndicator() {
            const indicator = document.createElement('div');
            indicator.id = 'redteam-scanning-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #1a1a1a;
                color: #bb86fc;
                padding: 15px 20px;
                border-radius: 8px;
                border: 2px solid #bb86fc;
                font-family: monospace;
                font-size: 14px;
                z-index: 999999;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            const spinner = document.createElement('div');
            spinner.style.cssText = `
                border: 2px solid #333;
                border-top: 2px solid #bb86fc;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            indicator.appendChild(spinner);
            indicator.appendChild(document.createTextNode('Scanning in progress...'));
            
            document.body.appendChild(indicator);
        }
        
        hideScanningIndicator() {
            const indicator = document.getElementById('redteam-scanning-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
        
        showNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #1a1a1a;
                color: #03dac6;
                padding: 15px 20px;
                border-radius: 8px;
                border: 1px solid #03dac6;
                font-family: monospace;
                font-size: 14px;
                z-index: 999999;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease-out;
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        logScanSummary() {
            const stats = this.scanResults.statistics || {};
            console.log(`
📊 Scan Summary:
═══════════════════════════════════════════════════════
🔗 URLs Discovered: ${stats.totalURLs || 0}
🔐 Sensitive Data: ${stats.totalSensitiveData || 0}
⚠️  Vulnerabilities: ${stats.totalVulnerabilities || 0}
📋 Properties: ${stats.totalProperties || 0}
📁 Files Found: ${stats.totalFiles || 0}
⏱️  Scan Duration: ${stats.scanDuration || 0}ms
═══════════════════════════════════════════════════════
            `);
        }
    }
    
    // Create and initialize the scanner
    window.redteamScanner = new RedTeamScanner();
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.redteamScanner.init();
        });
    } else {
        window.redteamScanner.init();
    }
    
    // Also create a console command for easy access
    window.RedTeamScan = {
        start: () => window.redteamScanner.startScan(),
        removeOverlays: () => window.redteamScanner.removeOverlays(),
        viewResults: () => window.redteamScanner.viewResults(),
        exportResults: () => {
            if (window.redteamScanner.scanResults) {
                const dataStr = JSON.stringify(window.redteamScanner.scanResults, null, 2);
                console.log(dataStr);
                return window.redteamScanner.scanResults;
            } else {
                console.warn('No scan results available');
                return null;
            }
        }
    };
    
    // Provide usage instructions
    console.log(`
🔍 RedTeam Security Scanner Commands:
════════════════════════════════════════════════════════════════
• RedTeamScan.start()         - Start security scan
• RedTeamScan.removeOverlays() - Remove overlays and blur
• RedTeamScan.viewResults()    - View last scan results
• RedTeamScan.exportResults()  - Export results to console

Keyboard Shortcuts:
• Ctrl+Shift+S - Start scan
• Ctrl+Shift+R - Remove overlays
• Ctrl+Shift+V - View results
• Escape - Close results view
════════════════════════════════════════════════════════════════
    `);
    
})();
