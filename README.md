# 🔴 RedTeam Inspector

A powerful client-side JavaScript inspection tool for authorized security testing and vulnerability assessment.

![Version](https://img.shields.io/badge/version-1.0.0-red)
![License](https://img.shields.io/badge/license-MIT-blue)
![Purpose](https://img.shields.io/badge/purpose-security%20testing-orange)

## ⚠️ Legal Warning

**IMPORTANT**: This tool is designed for authorized security testing only. Unauthorized use may violate laws and regulations. Always ensure you have explicit permission before using this tool on any website or application.

## 🚀 Features

### Core Capabilities
- **Deep Object Scanning**: Recursively scans all JavaScript objects, including window, document, and framework-specific objects
- **Sensitive Data Detection**: Automatically identifies potential sensitive information using pattern matching
- **Network Interception**: Hooks into fetch() and XMLHttpRequest to monitor API calls
- **Event Listener Tracking**: Tracks all registered event listeners on the page
- **Real-time Monitoring**: Live updates as new data is intercepted or objects change

### Advanced Features
- **Property Editing**: Modify writable object properties directly from the UI
- **Code Execution**: Execute arbitrary JavaScript code in the page context
- **Object Monitoring**: Set up proxies to monitor object access and modifications
- **Data Export**: Export all collected data as JSON for further analysis
- **Framework Detection**: Automatically detects and scans React, Vue, Angular, and jQuery objects

## 📦 Installation

### Method 1: Direct Script Injection
```javascript
// Paste this in the browser console
(function(){
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/redteam-inspector.js';
    document.head.appendChild(script);
})();
```

### Method 2: Bookmarklet
```javascript
javascript:(function(){const s=document.createElement('script');s.src='https://your-domain.com/redteam-inspector.js';document.head.appendChild(s);})();
```

### Method 3: Browser Extension
Include the script in your extension's content script:
```json
{
    "content_scripts": [{
        "matches": ["<all_urls>"],
        "js": ["redteam-inspector.js"]
    }]
}
```

## 🎯 Usage

### Basic Usage
1. Load the script on any webpage
2. The RedTeam Inspector panel will appear in the top-right corner
3. Navigate through the tabs to explore different features

### Console Commands
```javascript
// Re-scan all objects
redteamInspector.scan();

// Find all sensitive data
redteamInspector.findSensitiveData();

// Execute custom code
redteamInspector.executeCode('console.log(document.cookie)');

// Monitor an object for changes
redteamInspector.monitorObject('window.userConfig', (action, prop, value) => {
    console.log(`${action}: ${prop} = ${value}`);
});

// Intercept form submissions
redteamInspector.interceptFormSubmissions();

// Export all data
redteamInspector.exportResults();
```

## 🔍 UI Components

### Object Scan Tab
- Displays all scanned objects in a hierarchical view
- Sensitive items are highlighted in red
- Click on items to expand and view details
- Search functionality to filter results

### Intercepted Tab
- Shows all intercepted network requests (fetch, XHR)
- Displays intercepted events (form submissions, clicks, etc.)
- Real-time updates with timestamp

### Event Listeners Tab
- Lists all registered event listeners
- Shows the target element and event type
- Displays the listener function source code

### Statistics Tab
- Summary of scanned objects
- Count of sensitive items found
- Number of intercepted requests
- Export functionality

## 🛠️ Configuration

Modify the CONFIG object in the source code to customize:
```javascript
const CONFIG = {
    maxDepth: 10,                    // Maximum recursion depth
    maxArrayLength: 100,             // Maximum array items to display
    sensitivePatterns: /token|.../,  // Regex for sensitive data
    ignoredProperties: [...],        // Properties to skip
    frameworkRoots: {...}           // Framework-specific roots
};
```

## 🔒 Security Considerations

### For Developers (Defense)
- Avoid storing sensitive data in global scope
- Use proper access controls and authentication
- Implement Content Security Policy (CSP)
- Minimize exposed API endpoints
- Use HTTPS for all communications
- Implement proper CORS policies

### For Security Testers
- Always obtain written authorization
- Document all findings responsibly
- Follow responsible disclosure practices
- Respect scope limitations
- Maintain confidentiality

## 📊 Example Findings

The tool can help identify:
- Exposed API keys and tokens
- Hardcoded credentials
- Sensitive user data in memory
- Insecure data storage practices
- Client-side validation bypasses
- Hidden form fields and parameters
- Unprotected API endpoints

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🚨 Disclaimer

This tool is provided for educational and authorized security testing purposes only. The authors are not responsible for any misuse or damage caused by this tool. Users are solely responsible for complying with applicable laws and regulations.

## 🔗 Resources

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Client-Side Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html)
- [JavaScript Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**Remember**: With great power comes great responsibility. Use this tool ethically and legally.
