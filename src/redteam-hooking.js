
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
