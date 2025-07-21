/**
 * AI Customer Service Widget Markdown Parser
 * Lightweight markdown parser with XSS protection
 */

(function(window) {
  'use strict';

  /**
   * Markdown parser class
   */
  class MarkdownParser {
    constructor(xssProtection) {
      this.xss = xssProtection || new window.CustomerAgentXSSProtection();
      
      // Markdown regex patterns
      this.patterns = {
        // Headers
        h1: /^# (.*$)/gm,
        h2: /^## (.*$)/gm,
        h3: /^### (.*$)/gm,
        h4: /^#### (.*$)/gm,
        h5: /^##### (.*$)/gm,
        h6: /^###### (.*$)/gm,
        
        // Text formatting
        bold: /\*\*(.*?)\*\*/g,
        italic: /\*(.*?)\*/g,
        strikethrough: /~~(.*?)~~/g,
        underline: /__(.*?)__/g,
        
        // Code
        inlineCode: /`([^`]+)`/g,
        codeBlock: /```([\s\S]*?)```/g,
        
        // Links and images
        link: /\[([^\]]+)\]\(([^)]+)\)/g,
        image: /!\[([^\]]*)\]\(([^)]+)\)/g,
        
        // Lists
        unorderedList: /^\* (.+)$/gm,
        orderedList: /^\d+\. (.+)$/gm,
        
        // Quotes and lines
        blockquote: /^> (.+)$/gm,
        horizontalRule: /^---$/gm,
        
        // Line breaks
        lineBreak: /\n/g,
        doubleLineBreak: /\n\n/g
      };
    }

    /**
     * Parse markdown text to HTML
     * @param {string} markdown - Markdown text to parse
     * @param {Object} options - Parsing options
     * @returns {string} - Sanitized HTML output
     */
    parse(markdown, options = {}) {
      if (!markdown || typeof markdown !== 'string') {
        return '';
      }

      const opts = {
        allowImages: false,
        allowLinks: true,
        allowHeaders: true,
        allowLists: true,
        allowCodeBlocks: true,
        sanitize: true,
        ...options
      };

      // Don't pre-sanitize input - let individual parsers handle text sanitization
      let html = markdown;

      // Process in order of complexity (blocks first, then inline)
      
      // Code blocks (must be first to avoid conflicts)
      if (opts.allowCodeBlocks) {
        html = this.parseCodeBlocks(html);
      }

      // Headers
      if (opts.allowHeaders) {
        html = this.parseHeaders(html);
      }

      // Lists
      if (opts.allowLists) {
        html = this.parseLists(html);
      }

      // Blockquotes
      html = this.parseBlockquotes(html);

      // Horizontal rules
      html = this.parseHorizontalRules(html);

      // Links (before images to handle markdown properly)
      if (opts.allowLinks) {
        html = this.parseLinks(html);
      }

      // Images
      if (opts.allowImages) {
        html = this.parseImages(html);
      }

      // Text formatting (inline elements)
      html = this.parseInlineFormatting(html);

      // Line breaks
      html = this.parseLineBreaks(html);

      // Final sanitization - use sanitizeParsedHTML to avoid encoding the HTML we just created
      if (opts.sanitize) {
        html = this.xss.sanitizeParsedHTML(html, {
          allowBasicFormatting: true,
          allowLinks: opts.allowLinks,
          allowImages: opts.allowImages
        });
      }

      return html;
    }

    /**
     * Parse headers (h1-h6)
     * @param {string} text - Text to parse
     * @returns {string} - Text with headers parsed
     */
    parseHeaders(text) {
      return text
        .replace(this.patterns.h6, (_, content) => `<h6>${this.xss.encodeHTMLEntities(content)}</h6>`)
        .replace(this.patterns.h5, (_, content) => `<h5>${this.xss.encodeHTMLEntities(content)}</h5>`)
        .replace(this.patterns.h4, (_, content) => `<h4>${this.xss.encodeHTMLEntities(content)}</h4>`)
        .replace(this.patterns.h3, (_, content) => `<h3>${this.xss.encodeHTMLEntities(content)}</h3>`)
        .replace(this.patterns.h2, (_, content) => `<h2>${this.xss.encodeHTMLEntities(content)}</h2>`)
        .replace(this.patterns.h1, (_, content) => `<h1>${this.xss.encodeHTMLEntities(content)}</h1>`);
    }

    /**
     * Parse inline formatting (bold, italic, etc.)
     * @param {string} text - Text to parse
     * @returns {string} - Text with inline formatting parsed
     */
    parseInlineFormatting(text) {
      return text
        // Code (before other formatting) - code content should be escaped
        .replace(this.patterns.inlineCode, (_, code) => {
          return `<code>${this.xss.encodeHTMLEntities(code)}</code>`;
        })
        // Bold (before italic to handle ***)
        .replace(this.patterns.bold, (_, content) => {
          return `<strong>${this.xss.encodeHTMLEntities(content)}</strong>`;
        })
        // Italic
        .replace(this.patterns.italic, (_, content) => {
          return `<em>${this.xss.encodeHTMLEntities(content)}</em>`;
        })
        // Strikethrough
        .replace(this.patterns.strikethrough, (_, content) => {
          return `<del>${this.xss.encodeHTMLEntities(content)}</del>`;
        })
        // Underline
        .replace(this.patterns.underline, (_, content) => {
          return `<u>${this.xss.encodeHTMLEntities(content)}</u>`;
        });
    }

    /**
     * Parse code blocks
     * @param {string} text - Text to parse
     * @returns {string} - Text with code blocks parsed
     */
    parseCodeBlocks(text) {
      return text.replace(this.patterns.codeBlock, (match, code) => {
        // Escape HTML in code blocks
        const escapedCode = this.xss.encodeHTMLEntities(code.trim());
        return `<pre><code>${escapedCode}</code></pre>`;
      });
    }

    /**
     * Parse lists
     * @param {string} text - Text to parse
     * @returns {string} - Text with lists parsed
     */
    parseLists(text) {
      // Process unordered lists
      text = text.replace(/^\* (.+)$/gm, (_, content) => {
        return `<li>${this.xss.encodeHTMLEntities(content)}</li>`;
      });
      text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

      // Process ordered lists
      text = text.replace(/^\d+\. (.+)$/gm, (_, content) => {
        return `<li>${this.xss.encodeHTMLEntities(content)}</li>`;
      });
      // Note: This is simplified - a more robust parser would group consecutive list items

      return text;
    }

    /**
     * Parse blockquotes
     * @param {string} text - Text to parse
     * @returns {string} - Text with blockquotes parsed
     */
    parseBlockquotes(text) {
      return text.replace(this.patterns.blockquote, (_, content) => {
        return `<blockquote>${this.xss.encodeHTMLEntities(content)}</blockquote>`;
      });
    }

    /**
     * Parse horizontal rules
     * @param {string} text - Text to parse
     * @returns {string} - Text with horizontal rules parsed
     */
    parseHorizontalRules(text) {
      return text.replace(this.patterns.horizontalRule, '<hr>');
    }

    /**
     * Parse links
     * @param {string} text - Text to parse
     * @returns {string} - Text with links parsed
     */
    parseLinks(text) {
      return text.replace(this.patterns.link, (_, linkText, url) => {
        // Sanitize the URL
        const sanitizedUrl = this.xss.sanitizeURL(url);
        if (!sanitizedUrl) {
          return this.xss.encodeHTMLEntities(linkText); // Return escaped text if URL is invalid
        }
        
        const sanitizedText = this.xss.encodeHTMLEntities(linkText);
        return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer">${sanitizedText}</a>`;
      });
    }

    /**
     * Parse images
     * @param {string} text - Text to parse
     * @returns {string} - Text with images parsed
     */
    parseImages(text) {
      return text.replace(this.patterns.image, (_, altText, url) => {
        // Sanitize the URL
        const sanitizedUrl = this.xss.sanitizeURL(url);
        if (!sanitizedUrl || !/^https?:\/\//.test(sanitizedUrl)) {
          return this.xss.encodeHTMLEntities(altText); // Return escaped alt text if URL is invalid
        }
        
        const sanitizedAlt = this.xss.encodeHTMLEntities(altText);
        return `<img src="${sanitizedUrl}" alt="${sanitizedAlt}" style="max-width: 100%; height: auto;">`;
      });
    }

    /**
     * Parse line breaks
     * @param {string} text - Text to parse
     * @returns {string} - Text with line breaks parsed
     */
    parseLineBreaks(text) {
      // Convert double line breaks to paragraphs
      text = text.replace(this.patterns.doubleLineBreak, '</p><p>');
      
      // Convert single line breaks to <br>
      text = text.replace(this.patterns.lineBreak, '<br>');
      
      // Wrap in paragraph tags
      text = `<p>${text}</p>`;
      
      // Clean up empty paragraphs
      text = text.replace(/<p><\/p>/g, '');
      text = text.replace(/<p><br><\/p>/g, '');
      
      return text;
    }

    /**
     * Parse markdown for chat messages (optimized for chat)
     * @param {string} markdown - Markdown text
     * @returns {string} - HTML suitable for chat display
     */
    parseForChat(markdown) {
      return this.parse(markdown, {
        allowImages: false, // Disable images in chat for security
        allowLinks: true,
        allowHeaders: false, // Disable large headers in chat
        allowLists: true,
        allowCodeBlocks: true,
        sanitize: true
      });
    }

    /**
     * Strip all markdown and return plain text
     * @param {string} markdown - Markdown text
     * @returns {string} - Plain text
     */
    stripMarkdown(markdown) {
      if (!markdown || typeof markdown !== 'string') {
        return '';
      }

      return markdown
        // Remove markdown syntax
        .replace(/#{1,6}\s+/g, '') // Headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
        .replace(/\*(.*?)\*/g, '$1') // Italic
        .replace(/__(.*?)__/g, '$1') // Underline
        .replace(/~~(.*?)~~/g, '$1') // Strikethrough
        .replace(/`([^`]+)`/g, '$1') // Inline code
        .replace(/```[\s\S]*?```/g, '[code block]') // Code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
        .replace(/^[\*\-]\s+/gm, '') // Unordered lists
        .replace(/^\d+\.\s+/gm, '') // Ordered lists
        .replace(/^>\s+/gm, '') // Blockquotes
        .replace(/^---$/gm, '') // Horizontal rules
        .trim();
    }
  }

  // Export to window
  window.CustomerAgentMarkdownParser = MarkdownParser;

})(window);