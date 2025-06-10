// Main RedTeam Inspector
class RedTeamInspector {
    constructor() {
        this.scanner = new ObjectScanner();
        this.hooking = new HookingSystem();
        this.ui = new UIManager();
        this.isActive = false;
    }

    init() {
        if (this.isActive) return 'Already initialized';
        
        console.log('%c🔴 RedTeam Inspector Initializing...', 'color: #ff0000; font-weight: bold; font-size: 16px');
        console.warn('⚠️ AUTHORIZED RED TEAM USE ONLY - UNAUTHORIZED ACCESS IS PROHIBITED');
        
        this.ui.init();
        this.hooking.install();
        this.scan();
        
        this.isActive = true;
        console.log('%c✓ RedTeam Inspector Ready', 'color: #00ff00; font-weight: bold');
        return 'RedTeam Inspector initialized successfully';
    }

    scan() {
        console.log('🔍 Scanning objects...');
        try {
            const results = this.scanner.scanAll();
            this.ui.displayResults(results);
            console.log(`✓ Scan complete: ${results.length} objects found`);
            return `Scan complete: ${results.length} objects found`;
        } catch (e) {
            console.error('Scan failed:', e);
            return `Scan failed: ${e.message}`;
        }
    }

    minimize() {
        this.ui.panel.classList.toggle('minimized');
        return 'Panel minimized';
    }

    close() {
        if (confirm('Are you sure you want to close RedTeam Inspector?')) {
            this.ui.panel.remove();
            this.isActive = false;
            console.log('🔴 RedTeam Inspector closed');
            return 'RedTeam Inspector closed';
        }
        return 'Close cancelled';
    }

    exportCriticalFindings() {
        try {
            const criticalResults = this.scanner.results.filter(r => r.score > 70);
            const exportData = {
                timestamp: new Date().toISOString(),
                scanResults: criticalResults,
                interceptedData: this.hooking.interceptedData.filter(d => d.isSensitive),
                statistics: {
                    objectsScanned: this.scanner.results.length,
                    criticalItems: criticalResults.length,
                    interceptedRequests: this.hooking.interceptedData.length
                }
            };

            const domain = window.location.hostname || 'localhost';
            const date = new Date().toISOString().split('T')[0];
            const filename = `Critical_Findings-${domain}-${date}.json`;

            this._downloadJSON(exportData, filename);
            console.log('📁 Critical findings exported successfully');
            return 'Critical findings export successful';
        } catch (e) {
            console.error('Export failed:', e);
            return `Export failed: ${e.message}`;
        }
    }

    exportFullData() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                scanResults: this.scanner.results,
                interceptedData: this.hooking.interceptedData,
                eventListeners: Array.from(state.eventListeners.entries()).map(([target, events]) => ({
                    target: target,
                    events: Array.from(events.entries()).map(([type, listeners]) => ({
                        type: type,
                        count: listeners.length,
                        listeners: listeners.map(l => l.source)
                    }))
                })),
                statistics: {
                    objectsScanned: this.scanner.results.length,
                    sensitiveItems: this.scanner.results.filter(r => r.isSensitive).length,
                    interceptedRequests: this.hooking.interceptedData.length
                }
            };

            const domain = window.location.hostname || 'localhost';
            const date = new Date().toISOString().split('T')[0];
            const filename = `Full_Data_Pull-${domain}-${date}.json`;

            this._downloadJSON(exportData, filename);
            console.log('📁 Full data exported successfully');
            return 'Full data export successful';
        } catch (e) {
            console.error('Export failed:', e);
            return `Export failed: ${e.message}`;
        }
    }

    _downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    executeCode(code) {
        try {
            const result = eval(code);
            console.log('✓ Code executed:', result);
            return result;
        } catch (e) {
            console.error('✗ Execution error:', e);
            return e;
        }
    }

    monitorObject(path, callback) {
        const obj = utils.getObjectPath(path);
        if (!obj || typeof obj !== 'object') {
            console.error('Invalid object path');
            return 'Invalid object path';
        }

        const handler = {
            get(target, prop) {
                callback('get', prop, target[prop]);
                return target[prop];
            },
            set(target, prop, value) {
                callback('set', prop, value);
                target[prop] = value;
                return true;
            }
        };

        const proxy = new Proxy(obj, handler);
        utils.setObjectPath(path, proxy);
        console.log(`✓ Monitoring ${path}`);
        return `Now monitoring ${path}`;
    }

    findSensitiveData() {
        const sensitive = this.scanner.results.filter(r => r.isSensitive);
        console.table(sensitive.map(s => ({
            path: s.path,
            type: s.type,
            preview: s.value.preview
        })));
        return {
            count: sensitive.length,
            items: sensitive,
            message: `Found ${sensitive.length} sensitive items`
        };
    }

    interceptFormSubmissions() {
        document.addEventListener('submit', (e) => {
            const formData = new FormData(e.target);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            console.log('📋 Form submission intercepted:', {
                action: e.target.action,
                method: e.target.method,
                data: data
            });
            
            if (confirm('Allow form submission?')) {
                return true;
            } else {
                e.preventDefault();
                return false;
            }
        }, true);
        return 'Form submission interception enabled';
    }
}

// Create global instance
window.redteamInspector = new RedTeamInspector();

// Auto-initialize or wait for manual trigger
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.redteamInspector.init();
    });
} else {
    window.redteamInspector.init();
}

// Expose to console
console.log('%c🔴 RedTeam Inspector loaded. Use window.redteamInspector to access.', 'color: #ff0000; font-weight: bold');
