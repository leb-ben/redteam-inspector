
    // Core scanner
    class ObjectScanner {
        constructor() {
            this.results = [];
            this.path = [];
            this.scanned = new WeakSet();
        }

        scan(obj, name = 'root', depth = 0) {
            if (depth > CONFIG.maxDepth) return;
            if (this.scanned.has(obj)) return;
            if (!utils.isObject(obj)) return;

            this.scanned.add(obj);
            this.path.push(name);

            try {
                const properties = this.getProperties(obj);
                
                properties.forEach(prop => {
                    try {
                        const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
                        const value = obj[prop];
                        const type = utils.getType(value);
                        const isSensitive = utils.isSensitive(prop, value);
                        
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
                            depth: depth
                        };

                        this.results.push(result);

                        // Recursively scan objects
                        if (utils.isObject(value) && !this.scanned.has(value)) {
                            this.scan(value, prop, depth + 1);
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
                });
            } catch (e) {
                console.error('Scan error:', e);
            }

            this.path.pop();
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
