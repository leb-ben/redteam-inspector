
    // Main RedTeam Inspector
    class RedTeamInspector {
        constructor() {
            this.scanner = new ObjectScanner();
            this.hooking = new HookingSystem();
            this.ui = new UIManager();
            this.isActive = false;
        }

        init() {
            if (this.isActive) return;
            
            console.log('%c🔴 RedTeam Inspector Initializing...', 'color: #ff0000; font-weight: bold; font-size: 16px');
            console.warn('⚠️ AUTHORIZED RED TEAM USE ONLY - UNAUTHORIZED ACCESS IS PROHIBITED');
            
            // Initialize components
            this.ui.init();
            this.hooking.install();
            
            // Initial scan
            this.scan();
            
            this.isActive = true;
            
            console.log('%c✓ RedTeam Inspector Ready', 'color: #00ff00; font-weight: bold');
        }

        scan() {
            console.log('🔍 Scanning objects...');
            const results = this.scanner.scanAll();
            this.ui.displayResults(results);
            console.log(`✓ Scan complete: ${results.length} objects found`);
        }

        minimize() {
            this.ui.panel.classList.toggle('minimized');
        }

        close() {
            if (confirm('Are you sure you want to close RedTeam Inspector?')) {
                this.ui.panel.remove();
                this.isActive = false;
                console.log('🔴 RedTeam Inspector closed');
            }
        }

        exportResults() {
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

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `redteam-export-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('📁 Results exported successfully');
        }

        // Advanced features
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
                return;
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
        }

        findSensitiveData() {
            const sensitive = this.scanner.results.filter(r => r.isSensitive);
            console.table(sensitive.map(s => ({
                path: s.path,
                type: s.type,
                preview: s.value.preview
            })));
            return sensitive;
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

})();
