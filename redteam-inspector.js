/**
 * RedTeam Client-Side Inspector Tool
 * Version: 1.0.0
 * Purpose: Authorized security testing and vulnerability assessment
 * 
 * IMPORTANT: This tool is for authorized red team use only.
 * Unauthorized use may violate laws and regulations.
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        maxDepth: 10,
        maxArrayLength: 100,
        sensitivePatterns: /token|password|secret|key|auth|session|cookie|credential|api|private|email|user|id|ssn|credit|card|account|pin|cvv|social|passport|license|bank/i,
        ignoredProperties: ['__proto__', 'constructor', 'prototype'],
        frameworkRoots: {
            react: ['__REACT_DEVTOOLS_GLOBAL_HOOK__', '_reactRootContainer'],
            vue: ['__VUE__', '__VUE_DEVTOOLS_GLOBAL_HOOK__'],
            angular: ['ng', 'angular'],
            jquery: ['jQuery', '$']
        }
    };

    // State management
    const state = {
        results: new Map(),
        hooks: new Map(),
        visitedObjects: new WeakSet(),
        interceptedData: [],
        eventListeners: new Map()
    };

    // Utility functions
    const utils = {
        isObject: (obj) => obj !== null && typeof obj === 'object',
        
        isSensitive: (key, value) => {
            if (CONFIG.sensitivePatterns.test(key)) return true;
            if (typeof value === 'string' && value.length > 10) {
                return CONFIG.sensitivePatterns.test(value);
            }
            return false;
        },

        getType: (obj) => {
            if (obj === null) return 'null';
            if (obj === undefined) return 'undefined';
            if (Array.isArray(obj)) return 'array';
            if (obj instanceof Date) return 'date';
            if (obj instanceof RegExp) return 'regexp';
            if (obj instanceof Error) return 'error';
            if (typeof obj === 'function') return 'function';
            return typeof obj;
        },

        truncate: (str, length = 100) => {
            if (typeof str !== 'string') str = String(str);
            return str.length > length ? str.substring(0, length) + '...' : str;
        },

        safeStringify: (obj, depth = 2) => {
            const seen = new WeakSet();
            return JSON.stringify(obj, (key, value) => {
                if (depth <= 0) return '[Max Depth]';
                if (seen.has(value)) return '[Circular]';
                if (utils.isObject(value)) {
                    seen.add(value);
                    depth--;
                }
                return value;
            }, 2);
        },

        getObjectPath: (path) => {
            const parts = path.split('.');
            let obj = window;
            for (const part of parts) {
                if (obj && typeof obj === 'object' && part in obj) {
                    obj = obj[part];
                } else {
                    return undefined;
                }
            }
            return obj;
        },

        setObjectPath: (path, value) => {
            const parts = path.split('.');
            const last = parts.pop();
            let obj = window;
            
            for (const part of parts) {
                if (obj && typeof obj === 'object' && part in obj) {
                    obj = obj[part];
                } else {
                    return false;
                }
            }
            
            if (obj && typeof obj === 'object') {
                try {
                    obj[last] = value;
                    return true;
                } catch (e) {
                    return false;
                }
            }
            return false;
        }
    };


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


    // Dynamic hooking system
    class HookingSystem {
        constructor() {
            this.originalFetch = window.fetch;
            this.originalXHR = window.XMLHttpRequest;
            this.originalAddEventListener = EventTarget.prototype.addEventListener;
            this.interceptedData = [];
        }

        install() {
            this.hookFetch();
            this.hookXHR();
            this.hookEventListeners();
        }

        hookFetch() {
            const self = this;
            window.fetch = async function(...args) {
                const [url, options] = args;
                const requestData = {
                    type: 'fetch',
                    url: url,
                    method: options?.method || 'GET',
                    headers: options?.headers,
                    body: options?.body,
                    timestamp: new Date().toISOString()
                };

                try {
                    const response = await self.originalFetch.apply(this, args);
                    const clone = response.clone();
                    
                    // Try to parse response
                    clone.text().then(text => {
                        let data;
                        try {
                            data = JSON.parse(text);
                        } catch {
                            data = text;
                        }

                        if (self.isInteresting(data)) {
                            self.interceptedData.push({
                                ...requestData,
                                response: {
                                    status: response.status,
                                    statusText: response.statusText,
                                    headers: Object.fromEntries(response.headers.entries()),
                                    data: data
                                }
                            });
                            self.notifyUI('fetch', requestData.url);
                        }
                    }).catch(() => {});

                    return response;
                } catch (error) {
                    self.interceptedData.push({
                        ...requestData,
                        error: error.message
                    });
                    throw error;
                }
            };
        }

        hookXHR() {
            const self = this;
            const OriginalXHR = this.originalXHR;
            
            window.XMLHttpRequest = function() {
                const xhr = new OriginalXHR();
                const originalOpen = xhr.open;
                const originalSend = xhr.send;
                const requestData = {
                    type: 'xhr',
                    timestamp: new Date().toISOString()
                };

                xhr.open = function(method, url, ...args) {
                    requestData.method = method;
                    requestData.url = url;
                    return originalOpen.apply(this, [method, url, ...args]);
                };

                xhr.send = function(body) {
                    requestData.body = body;
                    
                    xhr.addEventListener('load', function() {
                        let responseData;
                        try {
                            responseData = JSON.parse(xhr.responseText);
                        } catch {
                            responseData = xhr.responseText;
                        }

                        if (self.isInteresting(responseData)) {
                            self.interceptedData.push({
                                ...requestData,
                                response: {
                                    status: xhr.status,
                                    statusText: xhr.statusText,
                                    data: responseData
                                }
                            });
                            self.notifyUI('xhr', requestData.url);
                        }
                    });

                    return originalSend.apply(this, [body]);
                };

                return xhr;
            };
        }

        hookEventListeners() {
            const self = this;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                // Track event listeners
                const target = this;
                const key = target.toString();
                
                if (!state.eventListeners.has(key)) {
                    state.eventListeners.set(key, new Map());
                }
                
                const listeners = state.eventListeners.get(key);
                if (!listeners.has(type)) {
                    listeners.set(type, []);
                }
                
                listeners.get(type).push({
                    listener: listener,
                    options: options,
                    source: listener.toString()
                });

                // Wrap sensitive event types
                if (['submit', 'input', 'change', 'click'].includes(type)) {
                    const wrappedListener = function(event) {
                        if (self.isInterestingEvent(event)) {
                            self.interceptedData.push({
                                type: 'event',
                                eventType: type,
                                target: event.target?.tagName,
                                data: self.extractEventData(event),
                                timestamp: new Date().toISOString()
                            });
                            self.notifyUI('event', type);
                        }
                        return listener.call(this, event);
                    };
                    
                    return self.originalAddEventListener.call(this, type, wrappedListener, options);
                }

                return self.originalAddEventListener.call(this, type, listener, options);
            };
        }

        isInteresting(data) {
            if (!data) return false;
            
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
            if (CONFIG.sensitivePatterns.test(dataStr)) return true;
            
            if (typeof data === 'object') {
                return Object.keys(data).some(key => CONFIG.sensitivePatterns.test(key));
            }
            
            return false;
        }

        isInterestingEvent(event) {
            if (event.type === 'submit') return true;
            if (event.target?.type === 'password') return true;
            if (event.target?.name && CONFIG.sensitivePatterns.test(event.target.name)) return true;
            if (event.target?.value && CONFIG.sensitivePatterns.test(event.target.value)) return true;
            return false;
        }

        extractEventData(event) {
            const data = {
                type: event.type,
                target: {
                    tagName: event.target?.tagName,
                    type: event.target?.type,
                    name: event.target?.name,
                    id: event.target?.id,
                    className: event.target?.className
                }
            };

            if (event.target?.value && this.isInteresting(event.target.value)) {
                data.target.value = '[REDACTED - Sensitive]';
            }

            return data;
        }

        notifyUI(type, detail) {
            window.dispatchEvent(new CustomEvent('redteam-intercept', {
                detail: { type, detail, timestamp: new Date().toISOString() }
            }));
        }
    }


    // UI Manager
    class UIManager {
        constructor() {
            this.panel = null;
            this.resultsContainer = null;
            this.interceptContainer = null;
            this.isMinimized = false;
        }

        init() {
            this.createStyles();
            this.createPanel();
            this.attachEventHandlers();
        }

        createStyles() {
            const style = document.createElement('style');
            style.textContent = `
                #redteam-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 600px;
                    max-height: 80vh;
                    background: #1a1a1a;
                    color: #e0e0e0;
                    border: 2px solid #ff0000;
                    border-radius: 8px;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 12px;
                    z-index: 999999;
                    box-shadow: 0 4px 20px rgba(255, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                }

                #redteam-panel.minimized {
                    height: auto;
                    max-height: none;
                }

                #redteam-panel.minimized .panel-body {
                    display: none;
                }

                .panel-header {
                    background: #2a0000;
                    padding: 10px 15px;
                    border-bottom: 1px solid #ff0000;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                    user-select: none;
                }

                .panel-title {
                    font-weight: bold;
                    color: #ff0000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .panel-controls {
                    display: flex;
                    gap: 10px;
                }

                .panel-btn {
                    background: #ff0000;
                    color: #000;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: bold;
                    transition: all 0.2s;
                }

                .panel-btn:hover {
                    background: #ff3333;
                    transform: scale(1.05);
                }

                .panel-body {
                    flex: 1;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .panel-tabs {
                    display: flex;
                    background: #2a2a2a;
                    border-bottom: 1px solid #444;
                }

                .panel-tab {
                    padding: 8px 15px;
                    cursor: pointer;
                    border: none;
                    background: none;
                    color: #999;
                    font-size: 12px;
                    transition: all 0.2s;
                }

                .panel-tab.active {
                    color: #ff0000;
                    background: #1a1a1a;
                    border-bottom: 2px solid #ff0000;
                }

                .panel-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    max-height: 500px;
                }

                .warning-banner {
                    background: #ff0000;
                    color: #000;
                    padding: 8px;
                    text-align: center;
                    font-weight: bold;
                    font-size: 11px;
                }

                .result-item {
                    margin-bottom: 10px;
                    border: 1px solid #333;
                    border-radius: 4px;
                    overflow: hidden;
                    transition: all 0.2s;
                }

                .result-item.sensitive {
                    border-color: #ff0000;
                    box-shadow: 0 0 5px rgba(255, 0, 0, 0.3);
                }

                .result-header {
                    background: #2a2a2a;
                    padding: 8px 12px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .result-header:hover {
                    background: #333;
                }

                .result-path {
                    color: #4a9eff;
                    font-weight: bold;
                    word-break: break-all;
                }

                .result-type {
                    color: #999;
                    font-size: 11px;
                    background: #1a1a1a;
                    padding: 2px 6px;
                    border-radius: 3px;
                }

                .result-details {
                    padding: 12px;
                    background: #0a0a0a;
                    display: none;
                    border-top: 1px solid #333;
                }

                .result-item.expanded .result-details {
                    display: block;
                }

                .detail-row {
                    display: flex;
                    margin-bottom: 8px;
                    align-items: flex-start;
                }

                .detail-label {
                    color: #888;
                    min-width: 100px;
                    font-weight: bold;
                }

                .detail-value {
                    flex: 1;
                    color: #e0e0e0;
                    word-break: break-all;
                    font-family: monospace;
                }

                .detail-value.editable {
                    cursor: pointer;
                    border: 1px dashed #444;
                    padding: 2px 4px;
                    border-radius: 3px;
                }

                .detail-value.editable:hover {
                    border-color: #ff0000;
                    background: #1a1a1a;
                }

                .value-preview {
                    max-height: 200px;
                    overflow-y: auto;
                    background: #1a1a1a;
                    padding: 8px;
                    border-radius: 4px;
                    white-space: pre-wrap;
                }

                .intercept-item {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 4px;
                    padding: 10px;
                    margin-bottom: 10px;
                }

                .intercept-type {
                    display: inline-block;
                    background: #ff0000;
                    color: #000;
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .intercept-details {
                    margin-top: 8px;
                    font-size: 11px;
                    color: #999;
                }

                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .stat-box {
                    background: #2a2a2a;
                    padding: 10px;
                    border-radius: 4px;
                    text-align: center;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #ff0000;
                }

                .stat-label {
                    font-size: 11px;
                    color: #888;
                    margin-top: 5px;
                }

                .search-box {
                    width: 100%;
                    padding: 8px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    color: #e0e0e0;
                    border-radius: 4px;
                    margin-bottom: 15px;
                }

                .search-box:focus {
                    outline: none;
                    border-color: #ff0000;
                }

                .export-btn {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    background: #ff0000;
                    color: #000;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 12px;
                }

                .export-btn:hover {
                    background: #ff3333;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }

                .intercepting {
                    animation: pulse 1s infinite;
                }

                .edit-input {
                    width: 100%;
                    padding: 4px;
                    background: #2a2a2a;
                    border: 1px solid #ff0000;
                    color: #e0e0e0;
                    border-radius: 3px;
                    font-family: monospace;
                    font-size: 12px;
                }

                .event-listener-item {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 4px;
                    padding: 10px;
                    margin-bottom: 10px;
                }

                .event-target {
                    color: #4a9eff;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .event-type {
                    display: inline-block;
                    background: #444;
                    color: #e0e0e0;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    margin-right: 5px;
                }

                .listener-source {
                    margin-top: 8px;
                    padding: 8px;
                    background: #0a0a0a;
                    border-radius: 4px;
                    font-size: 11px;
                    overflow-x: auto;
                    white-space: pre;
                }
            `;
            document.head.appendChild(style);
        }


        createPanel() {
            this.panel = document.createElement('div');
            this.panel.id = 'redteam-panel';
            this.panel.innerHTML = `
                <div class="warning-banner">
                    ⚠️ AUTHORIZED RED TEAM USE ONLY - UNAUTHORIZED ACCESS IS PROHIBITED ⚠️
                </div>
                <div class="panel-header">
                    <div class="panel-title">
                        <span>🔴</span>
                        <span>RedTeam Inspector</span>
                        <span class="intercepting" style="display: none;">●</span>
                    </div>
                    <div class="panel-controls">
                        <button class="panel-btn" onclick="redteamInspector.minimize()">_</button>
                        <button class="panel-btn" onclick="redteamInspector.close()">X</button>
                    </div>
                </div>
                <div class="panel-body">
                    <div class="panel-tabs">
                        <button class="panel-tab active" data-tab="scan">Object Scan</button>
                        <button class="panel-tab" data-tab="intercept">Intercepted</button>
                        <button class="panel-tab" data-tab="events">Event Listeners</button>
                        <button class="panel-tab" data-tab="stats">Statistics</button>
                    </div>
                    <div class="panel-content" data-content="scan">
                        <input type="text" class="search-box" placeholder="Search properties, values, or types...">
                        <div id="scan-results"></div>
                    </div>
                    <div class="panel-content" data-content="intercept" style="display: none;">
                        <div id="intercept-results"></div>
                    </div>
                    <div class="panel-content" data-content="events" style="display: none;">
                        <div id="event-results"></div>
                    </div>
                    <div class="panel-content" data-content="stats" style="display: none;">
                        <div class="stats-container">
                            <div class="stat-box">
                                <div class="stat-value" id="stat-objects">0</div>
                                <div class="stat-label">Objects Scanned</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value" id="stat-sensitive">0</div>
                                <div class="stat-label">Sensitive Items</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value" id="stat-intercepted">0</div>
                                <div class="stat-label">Intercepted</div>
                            </div>
                        </div>
                        <button class="export-btn" onclick="redteamInspector.exportResults()">Export All Data</button>
                    </div>
                </div>
            `;

            document.body.appendChild(this.panel);
            this.resultsContainer = document.getElementById('scan-results');
            this.interceptContainer = document.getElementById('intercept-results');
            this.eventContainer = document.getElementById('event-results');
            this.makeDraggable();
        }

        attachEventHandlers() {
            // Tab switching
            this.panel.querySelectorAll('.panel-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabName = e.target.dataset.tab;
                    this.switchTab(tabName);
                });
            });

            // Search functionality
            const searchBox = this.panel.querySelector('.search-box');
            searchBox.addEventListener('input', (e) => {
                this.filterResults(e.target.value);
            });

            // Listen for intercept events
            window.addEventListener('redteam-intercept', (e) => {
                this.addInterceptItem(e.detail);
                this.updateStats();
            });

            // Handle clicks on editable values
            this.panel.addEventListener('click', (e) => {
                if (e.target.classList.contains('editable')) {
                    if (e.target.dataset.editable === 'true') {
                        this.editValue(e.target);
                    } else if (e.target.dataset.enumerable === 'true') {
                        this.enumerateObject(e.target);
                    }
                }
            });
        }

        switchTab(tabName) {
            this.panel.querySelectorAll('.panel-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === tabName);
            });

            this.panel.querySelectorAll('.panel-content').forEach(content => {
                content.style.display = content.dataset.content === tabName ? 'block' : 'none';
            });

            if (tabName === 'events') {
                this.displayEventListeners();
            }
        }

        displayResults(results) {
            this.resultsContainer.innerHTML = '';
            
            // Group by sensitivity
            const sensitive = results.filter(r => r.isSensitive);
            const normal = results.filter(r => !r.isSensitive);
            
            [...sensitive, ...normal].forEach(result => {
                const item = this.createResultItem(result);
                this.resultsContainer.appendChild(item);
            });

            this.updateStats();
        }

        createResultItem(result) {
            const div = document.createElement('div');
            div.className = `result-item ${result.isSensitive ? 'sensitive' : ''}`;
            div.innerHTML = `
                <div class="result-header">
                    <span class="result-path">${result.path}</span>
                    <span class="result-type">${result.type}</span>
                </div>
                <div class="result-details">
                    ${this.createDetailRows(result)}
                </div>
            `;

            // Toggle expansion
            div.querySelector('.result-header').addEventListener('click', () => {
                div.classList.toggle('expanded');
            });

            return div;
        }

        createDetailRows(result) {
            let html = '';
            
            // Value preview
            html += `
                <div class="detail-row">
                    <div class="detail-label">Value:</div>
                    <div class="detail-value">
                        <div class="value-preview">${this.formatValueForDisplay(result.value, result.type)}</div>
                    </div>
                </div>
            `;

            // Properties
            html += `
                <div class="detail-row">
                    <div class="detail-label">Writable:</div>
                    <div class="detail-value ${result.writable ? 'editable' : ''}" 
                         data-path="${result.path}" 
                         data-editable="${result.writable}">
                        ${result.writable ? '✓ Yes (Click to edit)' : '✗ No'}
                    </div>
                </div>
            `;

            html += `
                <div class="detail-row">
                    <div class="detail-label">Enumerable:</div>
                    <div class="detail-value ${result.enumerable ? 'editable' : ''}"
                         data-path="${result.path}"
                         data-enumerable="${result.enumerable}">
                        ${result.enumerable ? '✓ Yes (Click to enumerate)' : '✗ No'}
                    </div>
                </div>
            `;

            html += `
                <div class="detail-row">
                    <div class="detail-label">Configurable:</div>
                    <div class="detail-value">${result.configurable ? '✓ Yes' : '✗ No'}</div>
                </div>
            `;

            return html;
        }

        formatValueForDisplay(value, type) {
            if (type === 'function' && value.source) {
                return `<pre>${utils.truncate(value.source, 500)}</pre>`;
            }
            if (type === 'array' && value.items) {
                return `<pre>${JSON.stringify(value.items, null, 2)}</pre>`;
            }
            if (type === 'object' && value.preview) {
                return value.preview;
            }
            if (type === 'string' && value.preview) {
                return utils.truncate(value.preview, 200);
            }
            return value.preview || '[No preview available]';
        }

        addInterceptItem(data) {
            const item = document.createElement('div');
            item.className = 'intercept-item';
            item.innerHTML = `
                <span class="intercept-type">${data.type.toUpperCase()}</span>
                <div class="intercept-details">
                    <strong>${data.detail}</strong><br>
                    <small>${data.timestamp}</small>
                </div>
            `;
            
            this.interceptContainer.insertBefore(item, this.interceptContainer.firstChild);
            
            // Show intercepting indicator
            const indicator = this.panel.querySelector('.intercepting');
            indicator.style.display = 'inline';
            setTimeout(() => indicator.style.display = 'none', 1000);
        }

        filterResults(searchTerm) {
            const items = this.resultsContainer.querySelectorAll('.result-item');
            const term = searchTerm.toLowerCase();
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(term) ? 'block' : 'none';
            });
        }

        updateStats() {
            const scanner = window.redteamInspector.scanner;
            const hooking = window.redteamInspector.hooking;
            
            document.getElementById('stat-objects').textContent = scanner.results.length;
            document.getElementById('stat-sensitive').textContent = 
                scanner.results.filter(r => r.isSensitive).length;
            document.getElementById('stat-intercepted').textContent = hooking.interceptedData.length;
        }

        displayEventListeners() {
            this.eventContainer.innerHTML = '';
            
            state.eventListeners.forEach((events, target) => {
                const targetDiv = document.createElement('div');
                targetDiv.className = 'event-listener-item';
                
                let html = `<div class="event-target">${target}</div>`;
                
                events.forEach((listeners, eventType) => {
                    listeners.forEach(listener => {
                        html += `
                            <span class="event-type">${eventType}</span>
                            <div class="listener-source">${listener.source}</div>
                        `;
                    });
                });
                
                targetDiv.innerHTML = html;
                this.eventContainer.appendChild(targetDiv);
            });
        }

        editValue(element) {
            const path = element.dataset.path;
            const currentValue = utils.getObjectPath(path);
            
            const input = document.createElement('input');
            input.className = 'edit-input';
            input.value = JSON.stringify(currentValue);
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    try {
                        const newValue = JSON.parse(input.value);
                        if (utils.setObjectPath(path, newValue)) {
                            element.innerHTML = '✓ Updated successfully';
                            element.style.color = '#00ff00';
                            setTimeout(() => {
                                window.redteamInspector.scan();
                            }, 1000);
                        } else {
                            element.innerHTML = '✗ Update failed';
                            element.style.color = '#ff0000';
                        }
                    } catch (err) {
                        element.innerHTML = '✗ Invalid JSON';
                        element.style.color = '#ff0000';
                    }
                }
                if (e.key === 'Escape') {
                    element.innerHTML = '✓ Yes (Click to edit)';
                    element.style.color = '';
                }
            });
            
            element.innerHTML = '';
            element.appendChild(input);
            input.focus();
        }

        enumerateObject(element) {
            const path = element.dataset.path;
            const obj = utils.getObjectPath(path);
            
            if (obj && typeof obj === 'object') {
                const keys = Object.keys(obj);
                const preview = keys.slice(0, 10).join(', ') + (keys.length > 10 ? '...' : '');
                element.innerHTML = `Keys: ${preview} (${keys.length} total)`;
            }
        }

        makeDraggable() {
            const header = this.panel.querySelector('.panel-header');
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;

            header.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', dragEnd);

            function dragStart(e) {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;

                if (e.target === header || header.contains(e.target)) {
                    isDragging = true;
                }
            }

            function drag(e) {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;

                    xOffset = currentX;
                    yOffset = currentY;

                    setTranslate(currentX, currentY, this.panel);
                }
            }

            function dragEnd(e) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
            }

            function setTranslate(xPos, yPos, el) {
                el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
            }
        }
    }


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

