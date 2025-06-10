
    // Core scanner
    class ObjectScanner {
    constructor() {
        this.results = [];
        this.path = [];
        this.scanned = new WeakSet();
        this.isCancelled = false;
        this.progress = 0;
        this.totalObjects = 0;
        this.processedObjects = 0;
    }

    async scan(obj, name = 'root', depth = 0) {
        if (this.isCancelled) return;
        if (depth > CONFIG.maxDepth) return;
        if (this.scanned.has(obj)) return;
        if (!utils.isObject(obj)) return;

        // Prevent scanning the scanner instance itself or paths starting with redteamInspector
        if (name === 'redteamInspector' || name === 'redteamScanner' || name === 'redteam') return;
        if (this.path.length > 0 && this.path[0] === 'redteamInspector') return;

        this.scanned.add(obj);
        this.path.push(name);
        this.processedObjects++;
        this.progress = (this.processedObjects / this.totalObjects) * 100;

        try {
            const properties = this.getProperties(obj);
            
            // Process properties in chunks to prevent blocking
            for (let i = 0; i < properties.length; i += 10) {
                if (this.isCancelled) break;

                const chunk = properties.slice(i, i + 10);
                await new Promise(resolve => setTimeout(resolve, 0));

                for (const prop of chunk) {
                    try {
                        const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
                        const value = obj[prop];
                        const type = utils.getType(value);
                        const isSensitive = utils.isSensitive(prop, value);

                        // Compute score based on criteria
                        let score = 0;
                        if (isSensitive) score += 50;
                        if (typeof value === 'string') {
                            if (/password|login|username|token|secret/i.test(prop)) score += 15;
                            if (/jwt|session|2fa|otp/i.test(prop)) score += 30;
                        }
                        if (descriptor?.writable) score += 10;
                        if (descriptor?.enumerable) score += 10;
                        if (type !== 'object' && type !== 'function' && type !== 'array' && type !== 'string') score += 5;
                        if (utils.isFrameworkObject(value)) score += 15;
                        if (utils.isUserDefined(value)) score += 40;

                        const result = {
                            path: [...this.path, prop].join('.'),
                            property: prop,
                            type: type,
                            value: this.formatValue(value, type),
                            writable: descriptor?.writable || false,
                            enumerable: descriptor?.enumerable || false,
                            configurable: descriptor?.configurable || false,
                            isSensitive: isSensitive,
                            hasChildren: utils.isObject(value) && !this.scanned.has(value),
                            depth: depth,
                            score: score
                        };

                        // Only push results with score > 30 by default
                        if (score > 30) {
                            this.results.push(result);
                            // Limit stored results to 5,000 items
                            if (this.results.length > 5000) {
                                this.results.sort((a, b) => b.score - a.score);
                                this.results.length = 5000;
                            }
                        }

                        // Recursively scan objects
                        if (utils.isObject(value) && !this.scanned.has(value)) {
                            await this.scan(value, prop, depth + 1);
                        }
                    } catch (e) {
                        // Property access error
                        this.results.push({
                            path: [...this.path, prop].join('.'),
                            property: prop,
                            type: 'error',
                            value: `[Access Error: ${e.message}]`,
                            error: true
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Scan error:', e);
        }

        this.path.pop();
    }

    async scanAll() {
        this.results = [];
        this.scanned = new WeakSet();
        this.isCancelled = false;
        this.progress = 0;
        this.processedObjects = 0;

        // Estimate total objects to scan
        this.totalObjects = Object.keys(window).length;
        
        await this.scan(window);
        return this.results;
    }

    cancelScan() {
        this.isCancelled = true;
        return 'Scan cancelled';
    }

    getProgress() {
        return {
            progress: this.progress,
            processedObjects: this.processedObjects,
            totalObjects: this.totalObjects,
            resultsFound: this.results.length
        };
    }

        getProperties(obj) {
            const props = new Set();
            
            // Get own properties
            Object.getOwnPropertyNames(obj).forEach(prop => {
                if (!CONFIG.ignoredProperties.includes(prop)) {
                    props.add(prop);
                }
            });
            
            // Get symbol properties
            Object.getOwnPropertySymbols(obj).forEach(sym => {
                props.add(sym);
            });
            
            return Array.from(props);
        }

        formatValue(value, type) {
            switch (type) {
                case 'function':
                    return {
                        preview: `[Function: ${value.name || 'anonymous'}]`,
                        source: value.toString(),
                        length: value.length
                    };
                case 'array':
                    return {
                        preview: `[Array(${value.length})]`,
                        items: value.slice(0, CONFIG.maxArrayLength),
                        truncated: value.length > CONFIG.maxArrayLength
                    };
                case 'object':
                    const keys = Object.keys(value);
                    return {
                        preview: `[Object {${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}]`,
                        keys: keys.length
                    };
                case 'string':
                    return {
                        preview: utils.truncate(value, 100),
                        full: value,
                        length: value.length
                    };
                default:
                    return {
                        preview: String(value),
                        raw: value
                    };
            }
        }

        scanAll() {
            this.results = [];
            this.scanned = new WeakSet();
            
            // Scan window object
            this.scan(window, 'window');
            
            // Scan document
            this.scan(document, 'document');
            
            // Scan navigator
            this.scan(navigator, 'navigator');
            
            // Scan storage
            if (typeof localStorage !== 'undefined') {
                this.scan(localStorage, 'localStorage');
            }
            if (typeof sessionStorage !== 'undefined') {
                this.scan(sessionStorage, 'sessionStorage');
            }
            
            // Scan framework roots
            Object.entries(CONFIG.frameworkRoots).forEach(([framework, roots]) => {
                roots.forEach(root => {
                    if (window[root]) {
                        this.scan(window[root], `${framework}.${root}`);
                    }
                });
            });
            
            return this.results;
        }
    }
