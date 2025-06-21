/**
 * RedTeam Security Scanner - Core Module
 * Enterprise-grade security assessment engine for modern web applications
 */

class SecurityScanner {
    constructor(options = {}) {
        this.options = {
            maxDepth: options.maxDepth || 5,
            maxProperties: options.maxProperties || 10000,
            timeout: options.timeout || 30000,
            enableHeapAnalysis: options.enableHeapAnalysis !== false,
            enableNetworkMonitoring: options.enableNetworkMonitoring !== false,
            enableDeepDOMAnalysis: options.enableDeepDOMAnalysis !== false,
            ...options
        };
        
        this.results = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            domain: window.location.hostname,
            properties: [],
            urls: new Set(),
            sensitiveData: [],
            vulnerabilities: [],
            files: new Set(),
            errors: [],
            statistics: {}
        };
        
        this.visitedObjects = new WeakSet();
        this.propertyCount = 0;
        this.startTime = Date.now();
        
        // Initialize sub-scanners
        this.initializeSubScanners();
    }
    
    initializeSubScanners() {
        // Hook into various browser APIs for monitoring
        this.hookBrowserAPIs();
        this.setupNetworkInterception();
        this.setupMutationObserver();
    }
    
    hookBrowserAPIs() {
        // Hook XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        const scanner = this;
        
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            xhr.open = function(method, url, ...args) {
                scanner.captureURL(url, 'XHR');
                return originalOpen.apply(this, [method, url, ...args]);
            };
            
            xhr.send = function(data) {
                if (data) {
                    scanner.analyzeRequestData(data, 'XHR');
                }
                return originalSend.apply(this, [data]);
            };
            
            return xhr;
        };
        
        // Hook fetch
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            scanner.captureURL(url.toString(), 'Fetch');
            if (options && options.body) {
                scanner.analyzeRequestData(options.body, 'Fetch');
            }
            return originalFetch.apply(this, arguments);
        };
        
        // Hook WebSocket
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            scanner.captureURL(url, 'WebSocket');
            const ws = new originalWebSocket(url, protocols);
            
            const originalSend = ws.send;
            ws.send = function(data) {
                scanner.analyzeRequestData(data, 'WebSocket');
                return originalSend.apply(this, [data]);
            };
            
            return ws;
        };
        
        // Hook postMessage
        const originalPostMessage = window.postMessage;
        window.postMessage = function(message, targetOrigin, transfer) {
            scanner.analyzePostMessage(message, targetOrigin);
            return originalPostMessage.apply(this, arguments);
        };
    }
    
    setupNetworkInterception() {
        // Monitor all network requests via Performance API
        if (window.PerformanceObserver) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'resource') {
                        this.captureURL(entry.name, 'Resource');
                    }
                }
            });
            observer.observe({ entryTypes: ['resource'] });
        }
    }
    
    setupMutationObserver() {
        // Monitor DOM changes for dynamically added content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            this.analyzeDOMNode(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeOldValue: true
        });
    }
    
    captureURL(url, source) {
        try {
            // Normalize and validate URL
            const normalizedUrl = this.normalizeURL(url);
            if (normalizedUrl && this.isRelevantURL(normalizedUrl)) {
                this.results.urls.add({
                    url: normalizedUrl,
                    source: source,
                    timestamp: Date.now()
                });
            }
        } catch (e) {
            // Silently handle URL parsing errors
        }
    }
    
    normalizeURL(url) {
        try {
            if (!url) return null;
            
            // Handle relative URLs
            if (url.startsWith('//')) {
                url = window.location.protocol + url;
            } else if (url.startsWith('/')) {
                url = window.location.origin + url;
            } else if (!url.match(/^https?:\/\//)) {
                url = window.location.origin + '/' + url;
            }
            
            return new URL(url).href;
        } catch (e) {
            return null;
        }
    }
    
    isRelevantURL(url) {
        try {
            const urlObj = new URL(url);
            // Filter out external resources and common CDNs
            const excludedDomains = [
                'googleapis.com', 'gstatic.com', 'cloudflare.com', 
                'jsdelivr.net', 'unpkg.com', 'cdnjs.com', 'fontawesome.com',
                'google-analytics.com', 'googletagmanager.com', 'facebook.com',
                'twitter.com', 'doubleclick.net'
            ];
            
            return !excludedDomains.some(domain => urlObj.hostname.includes(domain));
        } catch (e) {
            return false;
        }
    }
    
    analyzeRequestData(data, source) {
        try {
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
            this.detectSensitivePatterns(dataStr, `${source} Request`);
        } catch (e) {
            // Handle parsing errors silently
        }
    }
    
    analyzePostMessage(message, targetOrigin) {
        if (targetOrigin === '*') {
            this.results.vulnerabilities.push({
                type: 'PostMessage',
                severity: 'High',
                description: 'PostMessage with wildcard targetOrigin detected',
                evidence: { message: this.truncate(JSON.stringify(message), 200) }
            });
        }
    }
    
    analyzeDOMNode(node) {
        // Check for interesting attributes
        const interestingAttrs = ['data-api', 'data-key', 'data-token', 'data-secret', 
                                 'data-password', 'data-auth', 'data-config'];
        
        interestingAttrs.forEach(attr => {
            if (node.hasAttribute && node.hasAttribute(attr)) {
                const value = node.getAttribute(attr);
                if (value) {
                    this.detectSensitivePatterns(value, `DOM Attribute: ${attr}`);
                }
            }
        });
        
        // Recursively analyze child nodes
        if (node.querySelectorAll) {
            // Check for hidden inputs
            node.querySelectorAll('input[type="hidden"]').forEach(input => {
                if (input.value) {
                    this.detectSensitivePatterns(input.value, 'Hidden Input');
                }
            });
            
            // Check for scripts with inline content
            node.querySelectorAll('script').forEach(script => {
                if (script.textContent) {
                    this.analyzeScriptContent(script.textContent);
                }
            });
        }
    }

    
    analyzeScriptContent(content) {
        // Look for hardcoded credentials and API endpoints
        const patterns = [
            /api[_-]?key\s*[:=]\s*["']([^"']+)["']/gi,
            /secret\s*[:=]\s*["']([^"']+)["']/gi,
            /password\s*[:=]\s*["']([^"']+)["']/gi,
            /token\s*[:=]\s*["']([^"']+)["']/gi,
            /\/api\/[^\s"']+/g,
            /https?:\/\/[^\s"']+\/api\/[^\s"']+/g
        ];
        
        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    this.detectSensitivePatterns(match, 'Script Content');
                });
            }
        });
    }
    
    detectSensitivePatterns(text, source) {
        const patterns = {
            'API_KEY': /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
            'JWT_TOKEN': /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
            'AWS_KEY': /AKIA[0-9A-Z]{16}/g,
            'PRIVATE_KEY': /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
            'DATABASE_URL': /(?:mongodb|postgres|mysql|redis):\/\/[^\s]+/gi,
            'BEARER_TOKEN': /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
            'BASIC_AUTH': /basic\s+[a-zA-Z0-9+\/]+=*/gi,
            'EMAIL': /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            'CREDIT_CARD': /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
            'SSN': /\b\d{3}-\d{2}-\d{4}\b/g,
            'PHONE': /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            'INTERNAL_IP': /\b(?:10|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g
        };
        
        Object.entries(patterns).forEach(([type, pattern]) => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    this.results.sensitiveData.push({
                        type: type,
                        value: this.maskSensitiveValue(match),
                        source: source,
                        timestamp: Date.now()
                    });
                });
            }
        });
    }
    
    maskSensitiveValue(value) {
        if (value.length <= 8) return value;
        const visibleChars = Math.min(4, Math.floor(value.length / 4));
        return value.substring(0, visibleChars) + '*'.repeat(value.length - visibleChars * 2) + 
               value.substring(value.length - visibleChars);
    }
    
    truncate(str, maxLength) {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }
    
    async performDeepScan() {
        console.log('🔍 Starting RedTeam Security Scanner...');
        
        try {
            // Phase 1: Extract window and global objects
            await this.scanGlobalObjects();
            
            // Phase 2: Deep DOM analysis
            if (this.options.enableDeepDOMAnalysis) {
                await this.performDOMAnalysis();
            }
            
            // Phase 3: Analyze localStorage and sessionStorage
            await this.scanStorageAPIs();
            
            // Phase 4: Analyze cookies
            await this.scanCookies();
            
            // Phase 5: Network and resource analysis
            await this.analyzeNetworkResources();
            
            // Phase 6: Heap snapshot analysis (if enabled)
            if (this.options.enableHeapAnalysis && typeof chrome !== 'undefined' && chrome.devtools) {
                await this.performHeapAnalysis();
            }
            
            // Phase 7: Security vulnerability checks
            await this.performSecurityChecks();
            
            // Phase 8: File discovery
            await this.performFileDiscovery();
            
            // Generate statistics
            this.generateStatistics();
            
            console.log('✅ Scan completed successfully');
            return this.results;
            
        } catch (error) {
            console.error('❌ Scan error:', error);
            this.results.errors.push({
                phase: 'General',
                error: error.message,
                stack: error.stack
            });
            return this.results;
        }
    }
    
    async scanGlobalObjects() {
        const globalTargets = [
            { name: 'window', obj: window, priority: 1 },
            { name: 'document', obj: document, priority: 1 },
            { name: 'navigator', obj: navigator, priority: 1 },
            { name: 'location', obj: location, priority: 1 },
            { name: 'history', obj: history, priority: 2 },
            { name: 'crypto', obj: window.crypto, priority: 2 },
            { name: 'performance', obj: window.performance, priority: 2 },
            { name: 'caches', obj: window.caches, priority: 2 }
        ];
        
        // Detect frameworks
        const frameworks = this.detectFrameworks();
        frameworks.forEach(fw => {
            globalTargets.push({ name: fw.name, obj: fw.obj, priority: 3 });
        });
        
        // Scan each target
        for (const target of globalTargets) {
            if (target.obj) {
                this.deepPropertyExtraction(target.obj, target.name, 0);
            }
        }
        
        // Scan custom global variables
        this.scanCustomGlobals();
    }
    
    detectFrameworks() {
        const frameworks = [];
        const checks = [
            { name: 'React', obj: window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__ },
            { name: 'Angular', obj: window.angular || window.ng },
            { name: 'Vue', obj: window.Vue || window.__VUE__ },
            { name: 'jQuery', obj: window.jQuery || window.$ },
            { name: 'Ember', obj: window.Ember },
            { name: 'Backbone', obj: window.Backbone },
            { name: 'Redux', obj: window.__REDUX_DEVTOOLS_EXTENSION__ },
            { name: 'Next.js', obj: window.__NEXT_DATA__ },
            { name: 'Nuxt', obj: window.__NUXT__ }
        ];
        
        checks.forEach(check => {
            if (check.obj) {
                frameworks.push(check);
                this.results.statistics.frameworks = this.results.statistics.frameworks || [];
                this.results.statistics.frameworks.push(check.name);
            }
        });
        
        return frameworks;
    }
    
    deepPropertyExtraction(obj, path, depth) {
        if (!obj || typeof obj !== 'object' || depth > this.options.maxDepth) return;
        if (this.visitedObjects.has(obj)) return;
        if (this.propertyCount >= this.options.maxProperties) return;
        
        this.visitedObjects.add(obj);
        
        try {
            const properties = Object.getOwnPropertyNames(obj);
            const symbols = Object.getOwnPropertySymbols(obj);
            
            [...properties, ...symbols].forEach(prop => {
                if (this.propertyCount >= this.options.maxProperties) return;
                
                try {
                    const propPath = `${path}.${String(prop)}`;
                    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
                    const value = obj[prop];
                    
                    this.propertyCount++;
                    
                    const propertyInfo = {
                        path: propPath,
                        type: typeof value,
                        value: this.serializeValue(value),
                        writable: descriptor ? descriptor.writable : undefined,
                        enumerable: descriptor ? descriptor.enumerable : undefined,
                        configurable: descriptor ? descriptor.configurable : undefined,
                        depth: depth
                    };
                    
                    // Check if property contains sensitive data
                    if (typeof value === 'string' && value.length > 0) {
                        this.detectSensitivePatterns(value, propPath);
                    }
                    
                    // Store interesting properties
                    if (this.isInterestingProperty(propPath, value)) {
                        this.results.properties.push(propertyInfo);
                    }
                    
                    // Recurse for objects
                    if (value && typeof value === 'object' && depth < this.options.maxDepth - 1) {
                        this.deepPropertyExtraction(value, propPath, depth + 1);
                    }
                    
                } catch (e) {
                    // Property access denied
                }
            });
        } catch (e) {
            // Object access denied
        }
    }
    
    serializeValue(value) {
        try {
            if (value === null) return 'null';
            if (value === undefined) return 'undefined';
            if (typeof value === 'function') return '[Function]';
            if (typeof value === 'symbol') return value.toString();
            if (value instanceof RegExp) return value.toString();
            if (value instanceof Date) return value.toISOString();
            if (value instanceof Error) return value.message;
            
            if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    return value.length > 10 ? `[Array(${value.length})]` : JSON.stringify(value);
                }
                return '[Object]';
            }
            
            if (typeof value === 'string' && value.length > 200) {
                return value.substring(0, 200) + '...';
            }
            
            return String(value);
        } catch (e) {
            return '[Serialization Error]';
        }
    }
    
    isInterestingProperty(path, value) {
        // Filter out common uninteresting properties
        const boringPatterns = [
            /\.Math\./,
            /\.console\./,
            /\.CSS/,
            /\.HTML[A-Z]/,
            /\.SVG[A-Z]/,
            /\.WebGL/,
            /\.prototype\./
        ];
        
        if (boringPatterns.some(pattern => pattern.test(path))) {
            return false;
        }
        
        // Include properties with interesting names
        const interestingPatterns = [
            /api/i,
            /key/i,
            /token/i,
            /secret/i,
            /password/i,
            /auth/i,
            /credential/i,
            /private/i,
            /config/i,
            /admin/i,
            /debug/i,
            /internal/i
        ];
        
        return interestingPatterns.some(pattern => pattern.test(path));
    }
    
    scanCustomGlobals() {
        const standardGlobals = new Set([
            'window', 'document', 'navigator', 'location', 'history', 'screen',
            'localStorage', 'sessionStorage', 'console', 'alert', 'confirm', 'prompt',
            'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
            'XMLHttpRequest', 'fetch', 'Promise', 'Array', 'Object', 'String',
            'Number', 'Boolean', 'Date', 'RegExp', 'Error', 'JSON', 'Math',
            'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURI', 'decodeURI',
            'encodeURIComponent', 'decodeURIComponent', 'eval', 'Function'
        ]);
        
        for (const prop in window) {
            if (!standardGlobals.has(prop) && window.hasOwnProperty(prop)) {
                try {
                    const value = window[prop];
                    this.deepPropertyExtraction(value, `window.${prop}`, 0);
                } catch (e) {
                    // Access denied
                }
            }
        }
    }
    
    async performDOMAnalysis() {
        // Analyze all script tags
        document.querySelectorAll('script').forEach(script => {
            if (script.src) {
                this.captureURL(script.src, 'Script Tag');
            }
            if (script.textContent) {
                this.analyzeScriptContent(script.textContent);
            }
        });
        
        // Analyze all link tags
        document.querySelectorAll('link').forEach(link => {
            if (link.href) {
                this.captureURL(link.href, 'Link Tag');
            }
        });
        
        // Analyze forms
        document.querySelectorAll('form').forEach(form => {
            if (form.action) {
                this.captureURL(form.action, 'Form Action');
            }
            
            // Check for password fields without HTTPS
            if (form.querySelector('input[type="password"]') && !window.location.protocol.includes('https')) {
                this.results.vulnerabilities.push({
                    type: 'Insecure Form',
                    severity: 'High',
                    description: 'Password form without HTTPS',
                    evidence: { action: form.action }
                });
            }
        });
        
        // Analyze iframes
        document.querySelectorAll('iframe').forEach(iframe => {
            if (iframe.src) {
                this.captureURL(iframe.src, 'IFrame');
            }
        });
        
        // Analyze media elements
        ['img', 'video', 'audio', 'source'].forEach(tag => {
            document.querySelectorAll(tag).forEach(element => {
                if (element.src) {
                    this.captureURL(element.src, `${tag.toUpperCase()} Tag`);
                }
            });
        });
        
        // Analyze data attributes
        document.querySelectorAll('[data-api], [data-endpoint], [data-url]').forEach(element => {
            ['data-api', 'data-endpoint', 'data-url'].forEach(attr => {
                const value = element.getAttribute(attr);
                if (value) {
                    this.captureURL(value, `DOM ${attr}`);
                }
            });
        });
    }
    
    async scanStorageAPIs() {
        // localStorage
        try {
            if (window.localStorage && localStorage.length > 0) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const value = localStorage.getItem(key);
                    
                    this.results.properties.push({
                        path: `localStorage.${key}`,
                        type: 'string',
                        value: this.truncate(value, 200),
                        writable: true,
                        enumerable: true,
                        configurable: true,
                        depth: 0
                    });
                    
                    this.detectSensitivePatterns(value, `localStorage.${key}`);
                }
            }
        } catch (e) {
            this.results.errors.push({
                phase: 'localStorage',
                error: e.message
            });
        }
        
        // sessionStorage
        try {
            if (window.sessionStorage && sessionStorage.length > 0) {
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    const value = sessionStorage.getItem(key);
                    
                    this.results.properties.push({
                        path: `sessionStorage.${key}`,
                        type: 'string',
                        value: this.truncate(value, 200),
                        writable: true,
                        enumerable: true,
                        configurable: true,
                        depth: 0
                    });
                    
                    this.detectSensitivePatterns(value, `sessionStorage.${key}`);
                }
            }
        } catch (e) {
            this.results.errors.push({
                phase: 'sessionStorage',
                error: e.message
            });
        }
        
        // IndexedDB
        try {
            if (window.indexedDB) {
                const databases = await indexedDB.databases();
                databases.forEach(db => {
                    this.results.properties.push({
                        path: `indexedDB.${db.name}`,
                        type: 'database',
                        value: `version: ${db.version}`,
                        writable: false,
                        enumerable: true,
                        configurable: false,
                        depth: 0
                    });
                });
            }
        } catch (e) {
            // IndexedDB access may be restricted
        }
    }
    
    async scanCookies() {
        try {
            if (document.cookie) {
                const cookies = document.cookie.split(';');
                cookies.forEach(cookie => {
                    const [name, value] = cookie.trim().split('=');
                    
                    this.results.properties.push({
                        path: `cookie.${name}`,
                        type: 'string',
                        value: this.truncate(value, 100),
                        writable: true,
                        enumerable: true,
                        configurable: true,
                        depth: 0
                    });
                    
                    // Check for insecure cookies
                    if (!cookie.includes('Secure') && window.location.protocol === 'https:') {
                        this.results.vulnerabilities.push({
                            type: 'Insecure Cookie',
                            severity: 'Medium',
                            description: `Cookie '${name}' missing Secure flag on HTTPS`,
                            evidence: { cookie: name }
                        });
                    }
                    
                    if (!cookie.includes('HttpOnly')) {
                        this.results.vulnerabilities.push({
                            type: 'Missing HttpOnly',
                            severity: 'Medium',
                            description: `Cookie '${name}' accessible via JavaScript`,
                            evidence: { cookie: name }
                        });
                    }
                });
            }
        } catch (e) {
            this.results.errors.push({
                phase: 'Cookies',
                error: e.message
            });
        }
    }
    
    async analyzeNetworkResources() {
        // Get all resources loaded by the page
        if (window.performance && performance.getEntriesByType) {
            const resources = performance.getEntriesByType('resource');
            resources.forEach(resource => {
                this.captureURL(resource.name, 'Performance API');
                
                // Check for resources loaded over HTTP on HTTPS page
                if (window.location.protocol === 'https:' && resource.name.startsWith('http:')) {
                    this.results.vulnerabilities.push({
                        type: 'Mixed Content',
                        severity: 'Medium',
                        description: 'Resource loaded over HTTP on HTTPS page',
                        evidence: { url: resource.name }
                    });
                }
            });
        }
        
        // Analyze service workers
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            this.results.properties.push({
                path: 'serviceWorker.controller',
                type: 'object',
                value: navigator.serviceWorker.controller.scriptURL,
                writable: false,
                enumerable: true,
                configurable: false,
                depth: 0
            });
        }
    }
    
    async performHeapAnalysis() {
        // This would require Chrome DevTools Protocol
        // For now, we'll do a simplified analysis
        console.log('⚠️ Heap analysis requires Chrome DevTools Protocol access');
    }
    
    async performSecurityChecks() {
        // Check for common vulnerabilities
        
        // 1. Check Content Security Policy
        const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!csp) {
            this.results.vulnerabilities.push({
                type: 'Missing CSP',
                severity: 'Medium',
                description: 'No Content Security Policy detected',
                evidence: {}
            });
        }
        
        // 2. Check for X-Frame-Options
        const xframe = document.querySelector('meta[http-equiv="X-Frame-Options"]');
        if (!xframe) {
            this.results.vulnerabilities.push({
                type: 'Clickjacking',
                severity: 'Medium',
                description: 'No X-Frame-Options header detected',
                evidence: {}
            });
        }
        
        // 3. Check for exposed source maps
        const scripts = document.querySelectorAll('script[src]');
        for (const script of scripts) {
            const mapUrl = script.src + '.map';
            try {
                const response = await fetch(mapUrl, { method: 'HEAD' });
                if (response.ok) {
                    this.results.vulnerabilities.push({
                        type: 'Exposed Source Map',
                        severity: 'Low',
                        description: 'JavaScript source map is publicly accessible',
                        evidence: { url: mapUrl }
                    });
                    this.results.files.add(mapUrl);
                }
            } catch (e) {
                // Source map not found
            }
        }
        
        // 4. Check for prototype pollution
        if (window.__proto__.polluted === true) {
            this.results.vulnerabilities.push({
                type: 'Prototype Pollution',
                severity: 'High',
                description: 'Prototype pollution vulnerability detected',
                evidence: {}
            });
        }
    }
    
    async performFileDiscovery() {
        const commonPaths = [
            // Configuration files
            '/.env', '/.env.local', '/.env.production', '/.env.development',
            '/config.json', '/config.js', '/config.yml', '/config.yaml',
            '/settings.json', '/settings.js', '/app.config.js',
            
            // Backup files
            '/backup.zip', '/backup.tar.gz', '/site-backup.zip',
            '/database.sql', '/dump.sql', '/backup.sql',
            
            // Version control
            '/.git/config', '/.git/HEAD', '/.gitignore',
            '/.svn/entries', '/.hg/requires',
            
            // Build artifacts
            '/package.json', '/package-lock.json', '/yarn.lock',
            '/composer.json', '/composer.lock',
            '/Gemfile', '/Gemfile.lock',
            '/requirements.txt', '/Pipfile', '/Pipfile.lock',
            
            // Documentation
            '/README.md', '/readme.txt', '/CHANGELOG.md',
            '/TODO.md', '/TODO.txt', '/NOTES.txt',
            
            // Server files
            '/.htaccess', '/.htpasswd', '/web.config',
            '/nginx.conf', '/httpd.conf',
            
            // API documentation
            '/swagger.json', '/swagger.yaml', '/openapi.json',
            '/api-docs', '/api/docs', '/api/swagger',
            
            // Common directories
            '/admin/', '/api/', '/backup/', '/temp/', '/tmp/',
            '/uploads/', '/files/', '/data/', '/config/',
            '/private/', '/internal/', '/debug/', '/test/',
            
            // Source maps and debug files
            '/app.js.map', '/main.js.map', '/bundle.js.map',
            '/vendor.js.map', '/chunk.js.map',
            
            // Log files
            '/error.log', '/access.log', '/debug.log',
            '/app.log', '/system.log',
            
            // Database files
            '/database.db', '/data.db', '/app.db',
            '/dump.sql', '/backup.sql',
            
            // Sensitive information
            '/secrets.json', '/secrets.yml', '/credentials.json',
            '/auth.json', '/keys.json', '/tokens.json'
        ];
        
        // Test each path
        for (const path of commonPaths) {
            try {
                const url = window.location.origin + path;
                const response = await fetch(url, { 
                    method: 'HEAD',
                    mode: 'no-cors'
                });
                
                // If we get a response, the file might exist
                this.results.files.add(url);
            } catch (e) {
                // File not found or access denied
            }
        }
        
        // Also check robots.txt
        try {
            const robotsUrl = window.location.origin + '/robots.txt';
            const response = await fetch(robotsUrl);
            if (response.ok) {
                const text = await response.text();
                this.results.files.add(robotsUrl);
                
                // Parse robots.txt for additional paths
                const lines = text.split('\n');
                lines.forEach(line => {
                    const match = line.match(/^(?:Disallow|Allow):\s*(.+)$/i);
                    if (match) {
                        const path = match[1].trim();
                        if (path && path !== '/') {
                            this.captureURL(window.location.origin + path, 'robots.txt');
                        }
                    }
                });
            }
        } catch (e) {
            // robots.txt not found
        }
        
        // Check sitemap
        try {
            const sitemapUrl = window.location.origin + '/sitemap.xml';
            const response = await fetch(sitemapUrl);
            if (response.ok) {
                const text = await response.text();
                this.results.files.add(sitemapUrl);
                
                // Parse sitemap for URLs
                const urlMatches = text.match(/<loc>([^<]+)<\/loc>/g);
                if (urlMatches) {
                    urlMatches.forEach(match => {
                        const url = match.replace(/<\/?loc>/g, '');
                        this.captureURL(url, 'sitemap.xml');
                    });
                }
            }
        } catch (e) {
            // sitemap.xml not found
        }
    }
    
    generateStatistics() {
        // Convert Sets to Arrays for serialization
        this.results.urls = Array.from(this.results.urls);
        this.results.files = Array.from(this.results.files);
        
        // Generate statistics
        this.results.statistics = {
            ...this.results.statistics,
            totalProperties: this.results.properties.length,
            totalURLs: this.results.urls.length,
            totalSensitiveData: this.results.sensitiveData.length,
            totalVulnerabilities: this.results.vulnerabilities.length,
            totalFiles: this.results.files.length,
            totalErrors: this.results.errors.length,
            scanDuration: Date.now() - this.startTime,
            propertyTypes: this.getPropertyTypeStats(),
            vulnerabilitySeverity: this.getVulnerabilitySeverityStats(),
            sensitiveDataTypes: this.getSensitiveDataTypeStats()
        };
    }
    
    getPropertyTypeStats() {
        const stats = {};
        this.results.properties.forEach(prop => {
            stats[prop.type] = (stats[prop.type] || 0) + 1;
        });
        return stats;
    }
    
    getVulnerabilitySeverityStats() {
        const stats = {};
        this.results.vulnerabilities.forEach(vuln => {
            stats[vuln.severity] = (stats[vuln.severity] || 0) + 1;
        });
        return stats;
    }
    
    getSensitiveDataTypeStats() {
        const stats = {};
        this.results.sensitiveData.forEach(data => {
            stats[data.type] = (stats[data.type] || 0) + 1;
        });
        return stats;
    }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityScanner;
} else {
    window.SecurityScanner = SecurityScanner;
}