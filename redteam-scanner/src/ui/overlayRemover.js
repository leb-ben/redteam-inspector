/**
 * Overlay Remover Module
 * Removes blur effects, paywalls, and overlays that hide content
 */

class OverlayRemover {
    constructor() {
        this.removedElements = [];
        this.modifiedElements = [];
        this.originalStyles = new Map();
    }
    
    removeAll() {
        console.log('🔓 Starting overlay removal...');
        
        // Remove blur effects
        this.removeBlurEffects();
        
        // Remove overlay elements
        this.removeOverlayElements();
        
        // Remove paywall elements
        this.removePaywallElements();
        
        // Enable scrolling
        this.enableScrolling();
        
        // Remove event listeners that prevent interaction
        this.removeBlockingEventListeners();
        
        // Make hidden content visible
        this.revealHiddenContent();
        
        // Remove modal backdrops
        this.removeModalBackdrops();
        
        // Fix pointer events
        this.fixPointerEvents();
        
        console.log(`✅ Removed ${this.removedElements.length} elements and modified ${this.modifiedElements.length} elements`);
        
        return {
            removedCount: this.removedElements.length,
            modifiedCount: this.modifiedElements.length,
            removedElements: this.removedElements,
            modifiedElements: this.modifiedElements
        };
    }
    
    removeBlurEffects() {
        // Remove blur from all elements
        const blurredElements = document.querySelectorAll('*');
        blurredElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            
            // Check for blur filter
            if (computedStyle.filter && computedStyle.filter.includes('blur')) {
                this.saveOriginalStyle(element, 'filter', computedStyle.filter);
                element.style.filter = 'none';
                this.modifiedElements.push({
                    element: element,
                    modification: 'Removed blur filter',
                    selector: this.getSelector(element)
                });
            }
            
            // Check for backdrop filter
            if (computedStyle.backdropFilter && computedStyle.backdropFilter !== 'none') {
                this.saveOriginalStyle(element, 'backdropFilter', computedStyle.backdropFilter);
                element.style.backdropFilter = 'none';
                this.modifiedElements.push({
                    element: element,
                    modification: 'Removed backdrop filter',
                    selector: this.getSelector(element)
                });
            }
            
            // Check for opacity used to hide content
            if (computedStyle.opacity === '0') {
                this.saveOriginalStyle(element, 'opacity', computedStyle.opacity);
                element.style.opacity = '1';
                this.modifiedElements.push({
                    element: element,
                    modification: 'Set opacity to 1',
                    selector: this.getSelector(element)
                });
            }
        });
        
        // Remove blur classes
        const blurClasses = ['blur', 'blurred', 'is-blurred', 'has-blur', 'content-blur', 
                           'paywall-blur', 'premium-blur', 'locked-blur'];
        
        blurClasses.forEach(className => {
            const elements = document.getElementsByClassName(className);
            Array.from(elements).forEach(element => {
                element.classList.remove(className);
                this.modifiedElements.push({
                    element: element,
                    modification: `Removed class: ${className}`,
                    selector: this.getSelector(element)
                });
            });
        });
    }
    
    removeOverlayElements() {
        // Common overlay selectors
        const overlaySelectors = [
            // Generic overlays
            '[class*="overlay"]',
            '[class*="modal-backdrop"]',
            '[class*="popup"]',
            '[class*="lightbox"]',
            '[class*="dialog-overlay"]',
            '[class*="mask"]',
            '[class*="cover"]',
            '[class*="curtain"]',
            '[class*="shade"]',
            '[class*="veil"]',
            
            // Paywall specific
            '[class*="paywall"]',
            '[class*="subscription"]',
            '[class*="premium-overlay"]',
            '[class*="content-gate"]',
            '[class*="register-wall"]',
            '[class*="signup-wall"]',
            '[class*="login-wall"]',
            '[class*="meter-wall"]',
            
            // Common IDs
            '#overlay',
            '#modal-overlay',
            '#paywall',
            '#subscription-overlay',
            '#popup-overlay',
            
            // Data attributes
            '[data-paywall]',
            '[data-overlay]',
            '[data-modal-backdrop]',
            '[data-content-gate]',
            
            // Specific site patterns
            '.tp-modal',
            '.tp-backdrop',
            '.piano-modal',
            '.piano-backdrop',
            '.tinypass',
            '.metering-modal',
            '.metering-overlay'
        ];
        
        overlaySelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // Check if element is actually blocking content
                    const computedStyle = window.getComputedStyle(element);
                    const isBlocking = (
                        computedStyle.position === 'fixed' ||
                        computedStyle.position === 'absolute'
                    ) && (
                        parseInt(computedStyle.zIndex) > 1000 ||
                        computedStyle.zIndex === 'auto'
                    );
                    
                    if (isBlocking) {
                        element.remove();
                        this.removedElements.push({
                            selector: selector,
                            tagName: element.tagName,
                            classes: element.className,
                            id: element.id
                        });
                    }
                });
            } catch (e) {
                // Invalid selector, skip
            }
        });
    }
    
    removePaywallElements() {
        // Remove elements that commonly contain paywall messages
        const paywallTextPatterns = [
            /subscribe/i,
            /subscription/i,
            /premium/i,
            /member/i,
            /paywall/i,
            /register/i,
            /sign up/i,
            /create.*account/i,
            /continue reading/i,
            /read more/i,
            /full access/i,
            /unlimited access/i
        ];
        
        const textElements = document.querySelectorAll('div, section, aside, article');
        textElements.forEach(element => {
            const text = element.textContent || '';
            const hasPaywallText = paywallTextPatterns.some(pattern => pattern.test(text));
            
            if (hasPaywallText) {
                const computedStyle = window.getComputedStyle(element);
                const isOverlay = (
                    computedStyle.position === 'fixed' ||
                    computedStyle.position === 'absolute'
                ) && parseInt(computedStyle.zIndex) > 100;
                
                if (isOverlay) {
                    element.remove();
                    this.removedElements.push({
                        reason: 'Paywall text pattern',
                        text: text.substring(0, 100),
                        tagName: element.tagName
                    });
                }
            }
        });
    }
    
    enableScrolling() {
        // Re-enable scrolling on body and html
        const scrollTargets = [document.body, document.documentElement];
        
        scrollTargets.forEach(target => {
            if (target) {
                // Remove overflow hidden
                if (target.style.overflow === 'hidden') {
                    this.saveOriginalStyle(target, 'overflow', target.style.overflow);
                    target.style.overflow = 'auto';
                    this.modifiedElements.push({
                        element: target,
                        modification: 'Enabled scrolling',
                        selector: target.tagName
                    });
                }
                
                // Remove position fixed on body
                if (target === document.body && target.style.position === 'fixed') {
                    this.saveOriginalStyle(target, 'position', target.style.position);
                    target.style.position = 'static';
                    this.modifiedElements.push({
                        element: target,
                        modification: 'Removed fixed positioning',
                        selector: 'body'
                    });
                }
                
                // Remove height restrictions
                if (target.style.height === '100%' || target.style.maxHeight === '100vh') {
                    this.saveOriginalStyle(target, 'height', target.style.height);
                    this.saveOriginalStyle(target, 'maxHeight', target.style.maxHeight);
                    target.style.height = 'auto';
                    target.style.maxHeight = 'none';
                    this.modifiedElements.push({
                        element: target,
                        modification: 'Removed height restrictions',
                        selector: target.tagName
                    });
                }
            }
        });
        
        // Remove no-scroll classes
        const noScrollClasses = ['no-scroll', 'noscroll', 'overflow-hidden', 'modal-open', 
                               'freeze', 'frozen', 'locked', 'prevent-scroll'];
        
        noScrollClasses.forEach(className => {
            document.body.classList.remove(className);
            document.documentElement.classList.remove(className);
        });
    }
    
    removeBlockingEventListeners() {
        // Create new elements to remove all event listeners
        const newBody = document.body.cloneNode(true);
        document.body.parentNode.replaceChild(newBody, document.body);
        
        // Prevent future blocking
        const preventDefaultHandler = (e) => {
            e.stopPropagation();
        };
        
        // Override common blocking methods
        const blockingEvents = ['contextmenu', 'selectstart', 'copy', 'cut', 'paste'];
        blockingEvents.forEach(eventType => {
            document.addEventListener(eventType, preventDefaultHandler, true);
        });
        
        this.modifiedElements.push({
            element: document.body,
            modification: 'Removed all event listeners',
            selector: 'body'
        });
    }
    
    revealHiddenContent() {
        // Find elements that might be hiding content
        const hiddenSelectors = [
            '[style*="display: none"]',
            '[style*="display:none"]',
            '[style*="visibility: hidden"]',
            '[style*="visibility:hidden"]',
            '.hidden',
            '.hide',
            '.d-none',
            '.invisible',
            '[hidden]'
        ];
        
        hiddenSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // Check if this might be content (not UI elements)
                    const isContent = element.textContent && element.textContent.trim().length > 50;
                    
                    if (isContent) {
                        if (element.style.display === 'none') {
                            this.saveOriginalStyle(element, 'display', element.style.display);
                            element.style.display = 'block';
                        }
                        
                        if (element.style.visibility === 'hidden') {
                            this.saveOriginalStyle(element, 'visibility', element.style.visibility);
                            element.style.visibility = 'visible';
                        }
                        
                        element.removeAttribute('hidden');
                        element.classList.remove('hidden', 'hide', 'd-none', 'invisible');
                        
                        this.modifiedElements.push({
                            element: element,
                            modification: 'Revealed hidden content',
                            selector: this.getSelector(element)
                        });
                    }
                });
            } catch (e) {
                // Invalid selector, skip
            }
        });
    }
    
    removeModalBackdrops() {
        // Remove Bootstrap and other framework modal backdrops
        const backdropSelectors = [
            '.modal-backdrop',
            '.mfp-bg',
            '.fancybox-overlay',
            '.lb-overlay',
            '.pswp__bg',
            '.tingle-modal__close',
            '[class*="backdrop"]',
            '[class*="modal-bg"]',
            '[class*="dialog-bg"]'
        ];
        
        backdropSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.remove();
                this.removedElements.push({
                    selector: selector,
                    reason: 'Modal backdrop'
                });
            });
        });
    }
    
    fixPointerEvents() {
        // Re-enable pointer events on content
        const contentSelectors = ['article', 'main', 'section', '.content', '#content', 
                                '.post', '.article-body', '.entry-content'];
        
        contentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (window.getComputedStyle(element).pointerEvents === 'none') {
                    this.saveOriginalStyle(element, 'pointerEvents', element.style.pointerEvents);
                    element.style.pointerEvents = 'auto';
                    this.modifiedElements.push({
                        element: element,
                        modification: 'Enabled pointer events',
                        selector: this.getSelector(element)
                    });
                }
            });
        });
        
        // Also check all elements for pointer-events: none
        document.querySelectorAll('[style*="pointer-events: none"]').forEach(element => {
            this.saveOriginalStyle(element, 'pointerEvents', element.style.pointerEvents);
            element.style.pointerEvents = 'auto';
            this.modifiedElements.push({
                element: element,
                modification: 'Enabled pointer events',
                selector: this.getSelector(element)
            });
        });
    }
    
    saveOriginalStyle(element, property, value) {
        if (!this.originalStyles.has(element)) {
            this.originalStyles.set(element, {});
        }
        this.originalStyles.get(element)[property] = value;
    }
    
    getSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ').filter(c => c).join('.');
            if (classes) {
                return `${element.tagName.toLowerCase()}.${classes}`;
            }
        }
        
        return element.tagName.toLowerCase();
    }
    
    restore() {
        // Restore original styles
        this.originalStyles.forEach((styles, element) => {
            Object.entries(styles).forEach(([property, value]) => {
                element.style[property] = value;
            });
        });
        
        console.log('✅ Original styles restored');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OverlayRemover;
} else {
    window.OverlayRemover = OverlayRemover;
}
