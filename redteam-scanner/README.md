# RedTeam Security Scanner

<div align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg" alt="Node">
</div>

## 🔍 Overview

RedTeam Security Scanner is an enterprise-grade security assessment tool designed for modern web applications. It provides comprehensive vulnerability detection, sensitive data discovery, and advanced DOM analysis capabilities.

**⚠️ Legal Notice**: This tool is for educational and authorized security testing purposes only. Always obtain proper permission before scanning any website.

## ✨ Features

### Core Capabilities

- **🔐 Deep DOM Analysis**: Comprehensive analysis of DOM structure, hidden elements, and dynamic content
- **🔑 Sensitive Data Detection**: Identifies API keys, tokens, credentials, and personal information exposure
- **🐛 Vulnerability Assessment**: Detects XSS, CORS misconfigurations, CSP issues, and more
- **📁 File Discovery**: Intelligent fuzzing to discover hidden files, backups, and configuration files
- **👁️ Overlay Removal**: Remove paywalls, blur effects, and overlays that hide content
- **📊 Real-time Monitoring**: Monitor network requests, WebSocket connections, and API calls

### Technical Features

- Hooks into XMLHttpRequest, Fetch API, and WebSocket for comprehensive network monitoring
- Analyzes localStorage, sessionStorage, cookies, and IndexedDB
- Detects common frameworks (React, Angular, Vue, etc.)
- Identifies prototype pollution vulnerabilities
- Discovers exposed source maps
- Monitors PostMessage communications
- Performs deep property extraction with circular reference handling

## 🚀 Quick Start

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/redteam-scanner.git
cd redteam-scanner
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:8080
```

### Using the Bookmarklet

1. Visit the scanner homepage at `http://localhost:8080`
2. Click "Install Bookmarklet" and drag the button to your bookmarks bar
3. Navigate to any website you want to scan
4. Click the bookmarklet to inject and run the scanner

### Keyboard Shortcuts

- `Ctrl+Shift+S` - Start security scan
- `Ctrl+Shift+R` - Remove overlays and blur effects
- `Ctrl+Shift+V` - View last scan results
- `Escape` - Close results view

### Console Commands

Open the browser console and use these commands:

```javascript
RedTeamScan.start()         // Start a comprehensive security scan
RedTeamScan.removeOverlays() // Remove overlays, paywalls, and blur effects
RedTeamScan.viewResults()    // View the last scan results
RedTeamScan.exportResults()  // Export scan results to console
```

## 📊 Understanding Results

### Overview Tab
- Scan statistics and summary
- Detected frameworks and technologies
- Overall security posture

### URLs & Files Tab
- Discovered endpoints and API routes
- Hidden files and directories
- Sitemap and robots.txt entries

### Sensitive Data Tab
- API keys and tokens (masked)
- Database connection strings
- Email addresses and personal data
- Internal IP addresses

### Vulnerabilities Tab
- Security issues categorized by severity
- Detailed descriptions and evidence
- Remediation recommendations

### Properties Tab
- Interesting JavaScript properties
- Global variables and configurations
- Framework-specific data

## 🛠️ Architecture

```
redteam-scanner/
├── src/
│   ├── core/
│   │   └── scanner.js       # Main scanning engine
│   ├── modules/
│   │   ├── urlDiscovery.js  # URL and endpoint discovery
│   │   ├── dataDetection.js # Sensitive data detection
│   │   └── vulnTesting.js   # Vulnerability testing
│   ├── ui/
│   │   ├── overlayRemover.js # Overlay removal functionality
│   │   └── resultsDisplay.js  # Results visualization
│   └── app.js               # Main application orchestrator
├── public/
│   └── index.html           # Web interface
├── server.js                # Express server
└── package.json             # Dependencies
```

## 🔧 Configuration

The scanner can be configured with various options:

```javascript
const scanner = new SecurityScanner({
    maxDepth: 5,                    // Maximum object traversal depth
    maxProperties: 10000,           // Maximum properties to extract
    timeout: 30000,                 // Scan timeout in milliseconds
    enableHeapAnalysis: true,       // Enable heap snapshot analysis
    enableNetworkMonitoring: true,  // Monitor network requests
    enableDeepDOMAnalysis: true     // Perform deep DOM analysis
});
```

## 🔍 Detection Patterns

### Sensitive Data Patterns
- API Keys: `api_key`, `apikey`, `api-key`
- JWT Tokens: `eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+`
- AWS Keys: `AKIA[0-9A-Z]{16}`
- Private Keys: `-----BEGIN RSA PRIVATE KEY-----`
- Database URLs: `mongodb://`, `postgres://`, `mysql://`

### Vulnerability Checks
- Missing Content Security Policy
- Insecure cookies (missing Secure/HttpOnly flags)
- Mixed content (HTTP resources on HTTPS pages)
- PostMessage with wildcard origin
- Exposed source maps
- Password forms without HTTPS

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all security checks pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is provided for educational and authorized security testing purposes only. Users are responsible for complying with all applicable laws and regulations. The authors assume no liability for misuse or damage caused by this tool.

## 🙏 Acknowledgments

- Inspired by various security research tools and methodologies
- Built with modern web technologies
- Special thanks to the security research community

## 📞 Support

- Create an issue for bug reports or feature requests
- Join our Discord community for discussions
- Check the wiki for detailed documentation

---

<div align="center">
  Made with ❤️ by the RedTeam Security Scanner Team
</div>
