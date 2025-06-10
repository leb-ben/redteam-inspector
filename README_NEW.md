# 🔴 RedTeam Inspector

> **PRIVATE DEVELOPMENT NOTES**  
> Latest Updates (v2.0):
> - NEW: Progressive scanning that won't freeze your browser
> - NEW: 2FA detection and testing capabilities
> - NEW: Memory management (max 5k items)
> - NEW: Real-time progress tracking
> - NEW: Separate exports for critical/full findings
>
> **Quick Start:**
> 1. Open browser console (F12)
> 2. Paste the loader code (see Installation)
> 3. Look for the red dot (🔴) panel
> 4. Click "Object Scan" to start

## What Does This Tool Do?

RedTeam Inspector helps you find security issues in web applications by:
- Finding sensitive data like API keys and tokens
- Detecting 2FA/authentication implementations
- Monitoring memory for data leaks
- Tracking event listeners and network calls
- Analyzing client-side security

## 🚀 New Features Explained

### Progressive Scanning
- Scans in small chunks to keep the browser responsive
- Shows real-time progress bar
- Automatically manages memory usage
- Can be paused/resumed anytime

### 2FA Analysis
- Finds two-factor authentication code
- Shows potential bypass opportunities
- Lists all authentication paths
- Helps identify implementation flaws

### Smart Exports
- "Export Critical" - Just the important findings
- "Export Full" - Complete scan results
- Saves as JSON files for easy sharing
- Includes severity scores

## 📦 Installation

Copy and paste this in your browser console:
```javascript
(function(){
    const script = document.createElement('script');
    script.src = 'https://raw.githubusercontent.com/leb-ben/redteam-inspector/main/redteam-inspector.min.js';
    document.head.appendChild(script);
})();
```

## 🎯 How to Use

### Basic Steps:
1. Load the script (see Installation)
2. Look for the red dot panel (🔴) in top-right
3. Choose what you want to do:
   - Find sensitive data → "Object Scan" tab
   - Test 2FA → "2FA Analysis" tab
   - Monitor network → "Intercepted" tab
   - Check events → "Event Listeners" tab
   - See statistics → "Statistics" tab

### Finding Sensitive Data:
1. Go to "Object Scan" tab
2. Watch the progress bar
3. Look for items highlighted in teal
4. Click items to see details
5. Use search to filter results

### Testing 2FA:
1. Go to "2FA Analysis" tab
2. Start a scan
3. Look for authentication patterns
4. Check implementation details
5. Export findings for reports

### Memory Management:
1. Watch the progress bar
2. Export regularly on big sites
3. Cancel scan if needed
4. Clear results to free memory

## 🛠️ Configuration

### Basic Settings
```javascript
window.redteamInspector.CONFIG = {
    // How deep to scan
    maxDepth: 10,
    
    // How many results to keep
    maxResults: 5000,
    
    // How fast to scan
    chunkSize: 10,
    scanDelay: 0,
    
    // What to look for
    sensitivePatterns: /token|key|password|secret|auth|2fa|otp/i
};
```

### UI Settings
```javascript
window.redteamInspector.UI_CONFIG = {
    // Colors
    theme: {
        primary: '#20b2aa',    // Teal
        secondary: '#40e0d0'   // Turquoise
    }
};
```

## 🔒 Security Notes

### For Safe Usage:
- Always get permission first
- Export findings regularly
- Clear results after testing
- Monitor memory usage
- Use on test environments when possible

### What to Watch For:
- API keys and tokens
- Hardcoded passwords
- 2FA implementation flaws
- Memory leaks
- Exposed endpoints
- Client-side validation issues

## 🆘 Troubleshooting

### If the Tool Freezes:
1. Click "Cancel Scan"
2. Reduce chunk size
3. Export and restart

### If Memory Usage is High:
1. Export current findings
2. Clear results
3. Continue scanning

### If Can't Find Data:
1. Check search patterns
2. Increase scan depth
3. Try different starting points

## ⚠️ Legal Warning

**IMPORTANT**: This tool is designed for authorized security testing only. Unauthorized use may violate laws and regulations. Always ensure you have explicit permission before using this tool on any website or application.

![Version](https://img.shields.io/badge/version-2.0.0-red)
![License](https://img.shields.io/badge/license-MIT-blue)
![Purpose](https://img.shields.io/badge/purpose-security%20testing-orange)

---

**Remember**: This tool is powerful - use it wisely and responsibly!
