
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
