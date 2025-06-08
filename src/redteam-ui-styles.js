
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
