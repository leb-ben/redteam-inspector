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
