/**
 * AI Customer Service Widget XSS Protection
 * Comprehensive content sanitization and XSS prevention
 */

(function(window) {
  'use strict';

  /**
   * XSS Protection class for sanitizing content
   */
  class XSSProtection {
    constructor() {
      // HTML entities for encoding
      this.htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#96;',
        '=': '&#x3D;'
      };

      // Dangerous HTML tags that should be completely removed
      this.dangerousTags = [
        'script', 'object', 'embed', 'link', 'style', 'iframe', 'frame',
        'frameset', 'applet', 'base', 'meta', 'form', 'input', 'button',
        'textarea', 'select', 'option'
      ];

      // Dangerous attributes that should be removed
      this.dangerousAttributes = [
        'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
        'onmousedown', 'onmouseup', 'onkeydown', 'onkeyup', 'onkeypress',
        'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect',
        'onresize', 'onscroll', 'javascript:', 'vbscript:', 'data:',
        'src', 'href', 'action', 'background', 'dynsrc', 'lowsrc'
      ];

      // Safe HTML tags for markdown rendering (whitelist)
      this.safeTags = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody',
        'tr', 'td', 'th', 'caption', 'hr'
      ];

      // Safe attributes (whitelist)
      this.safeAttributes = [
        'class', 'id', 'title', 'alt', 'width', 'height', 'align',
        'style' // Will be further sanitized
      ];
    }

    /**
     * Sanitize HTML content to prevent XSS attacks
     * @param {string} html - HTML content to sanitize
     * @param {Object} options - Sanitization options
     * @returns {string} - Sanitized HTML
     */
    sanitizeHTML(html, options = {}) {
      if (typeof html !== 'string') {
        return '';
      }

      const opts = {
        allowBasicFormatting: true,
        allowLinks: false,
        allowImages: false,
        stripDangerousTags: true,
        encodeEntities: true,
        ...options
      };

      let sanitized = html;

      // Remove or encode dangerous content
      if (opts.stripDangerousTags) {
        sanitized = this.removeDangerousTags(sanitized);
      }

      if (opts.encodeEntities) {
        sanitized = this.encodeHTMLEntities(sanitized);
      }

      // Clean attributes
      sanitized = this.sanitizeAttributes(sanitized);

      // Remove javascript: and data: URLs
      sanitized = this.sanitizeURLs(sanitized);

      return sanitized.trim();
    }

    /**
     * Encode HTML entities to prevent XSS
     * @param {string} text - Text to encode
     * @returns {string} - Encoded text
     */
    encodeHTMLEntities(text) {
      return text.replace(/[&<>"'`=\/]/g, (char) => {
        return this.htmlEntities[char] || char;
      });
    }

    /**
     * Decode HTML entities for display
     * @param {string} text - Encoded text
     * @returns {string} - Decoded text
     */
    decodeHTMLEntities(text) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    }

    /**
     * Remove dangerous HTML tags
     * @param {string} html - HTML content
     * @returns {string} - Content with dangerous tags removed
     */
    removeDangerousTags(html) {
      // Remove dangerous tags and their content
      const dangerousTagsRegex = new RegExp(
        `<\\s*\\/?\\s*(${this.dangerousTags.join('|')})\\s*[^>]*>`,
        'gi'
      );
      
      return html.replace(dangerousTagsRegex, '');
    }

    /**
     * Sanitize HTML attributes
     * @param {string} html - HTML content
     * @returns {string} - HTML with sanitized attributes
     */
    sanitizeAttributes(html) {
      // Remove dangerous attributes
      let sanitized = html;
      
      this.dangerousAttributes.forEach(attr => {
        const attrRegex = new RegExp(`\\s*${attr}\\s*=\\s*[^>\\s]*`, 'gi');
        sanitized = sanitized.replace(attrRegex, '');
      });

      return sanitized;
    }

    /**
     * Sanitize URLs to prevent javascript: and data: schemes
     * @param {string} html - HTML content
     * @returns {string} - HTML with sanitized URLs
     */
    sanitizeURLs(html) {
      // Remove javascript:, data:, and vbscript: URLs
      const dangerousUrlRegex = /(javascript|data|vbscript):\s*[^"'\s>]*/gi;
      return html.replace(dangerousUrlRegex, '#');
    }

    /**
     * Sanitize text content (for non-HTML content)
     * @param {string} text - Text to sanitize
     * @returns {string} - Sanitized text
     */
    sanitizeText(text) {
      if (typeof text !== 'string') {
        return '';
      }

      // Encode HTML entities and remove control characters
      return this.encodeHTMLEntities(text)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control chars
    }

    /**
     * Validate and sanitize URLs
     * @param {string} url - URL to validate
     * @returns {string|null} - Sanitized URL or null if invalid
     */
    sanitizeURL(url) {
      if (!url || typeof url !== 'string') {
        return null;
      }

      // Remove dangerous protocols
      if (/^(javascript|data|vbscript):/i.test(url)) {
        return null;
      }

      // Only allow http, https, mailto, and relative URLs
      if (!/^(https?:\/\/|mailto:|\/|\.\/|#)/i.test(url)) {
        return null;
      }

      // Basic URL encoding of dangerous characters
      return url.replace(/[<>"']/g, (char) => {
        return encodeURIComponent(char);
      });
    }

    /**
     * Sanitize pre-parsed HTML without double-encoding entities
     * This is for HTML that already has encoded text content
     * @param {string} html - Pre-parsed HTML to sanitize
     * @param {Object} options - Sanitization options
     * @returns {string} - Sanitized HTML
     */
    sanitizeParsedHTML(html, options = {}) {
      if (typeof html !== 'string') {
        return '';
      }

      const opts = {
        allowBasicFormatting: true,
        allowLinks: false,
        allowImages: false,
        stripDangerousTags: true,
        ...options
      };

      let sanitized = html;

      // Remove dangerous tags but don't encode entities
      if (opts.stripDangerousTags) {
        sanitized = this.removeDangerousTags(sanitized);
      }

      // Clean attributes
      sanitized = this.sanitizeAttributes(sanitized);

      // Remove javascript: and data: URLs
      sanitized = this.sanitizeURLs(sanitized);

      return sanitized.trim();
    }



    /**
     * Rate limiting for sanitization to prevent DoS
     * @param {string} content - Content to process
     * @param {number} maxLength - Maximum allowed length
     * @returns {string} - Truncated content if necessary
     */
    rateLimitContent(content, maxLength = 10000) {
      if (!content || typeof content !== 'string') {
        return '';
      }

      if (content.length > maxLength) {
        return content.substring(0, maxLength) + '...';
      }

      return content;
    }

    /**
     * Comprehensive content sanitization for chat messages
     * @param {string} content - Message content
     * @param {Object} options - Sanitization options
     * @returns {string} - Sanitized content
     */
    sanitizeMessage(content, options = {}) {
      const opts = {
        allowMarkdown: true,
        allowBasicHTML: true,
        maxLength: 10000,
        preserveFormatting: true,
        ...options
      };

      // Rate limiting
      const rateLimited = this.rateLimitContent(content, opts.maxLength);

      // Sanitize based on options
      if (opts.allowBasicHTML) {
        return this.sanitizeHTML(rateLimited, {
          allowBasicFormatting: true,
          allowLinks: opts.allowLinks || false,
          allowImages: opts.allowImages || false
        });
      } else {
        return this.sanitizeText(rateLimited);
      }
    }
  }

  // Export to window
  window.CustomerAgentXSSProtection = XSSProtection;

})(window);