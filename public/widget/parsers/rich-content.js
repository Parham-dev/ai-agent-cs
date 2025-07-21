/**
 * AI Customer Service Widget Rich Content Parser
 * Orchestrates markdown parsing, XSS protection, and content enhancement
 */

(function(window) {
  'use strict';

  /**
   * Rich content parser and processor
   */
  class RichContentParser {
    constructor(utils) {
      this.utils = utils || {};
      
      // Initialize dependencies
      this.xss = new window.CustomerAgentXSSProtection();
      this.markdown = new window.CustomerAgentMarkdownParser(this.xss);
      
      // Content type detection patterns
      this.patterns = {
        // URLs for auto-linking
        url: /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi,
        
        // Email addresses
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        
        // Phone numbers (basic pattern)
        phone: /\b\+?[\d\s\-\(\)]{10,}\b/g,
        
        // Code detection (triple backticks or inline)
        hasCode: /```[\s\S]*?```|`[^`]+`/,
        
        // Markdown detection
        hasMarkdown: /(\*\*|__|~~|\*|_|`|#{1,6}\s|^\s*[\*\-]\s|^\s*\d+\.\s|^>\s)/m,
        
        // List detection
        hasList: /^\s*[\*\-\+]\s|^\s*\d+\.\s/m,
        
        // Special content patterns
        mention: /@(\w+)/g,
        hashtag: /#(\w+)/g
      };

      // Content enhancement options
      this.defaultOptions = {
        enableMarkdown: true,
        enableAutoLinking: true,
        enableMentions: false,
        enableHashtags: false,
        enableEmojis: true,
        maxLength: 10000,
        allowImages: false,
        allowLinks: true,
        preserveLineBreaks: true,
        sanitize: true
      };
    }

    /**
     * Process and enhance message content
     * @param {string} content - Raw message content
     * @param {Object} options - Processing options
     * @returns {Object} - Processed content with metadata
     */
    processContent(content, options = {}) {
      if (!content || typeof content !== 'string') {
        return {
          html: '',
          text: '',
          type: 'empty',
          features: []
        };
      }

      const opts = { ...this.defaultOptions, ...options };
      const features = [];

      // Rate limiting
      const processedContent = this.xss.rateLimitContent(content, opts.maxLength);

      // Detect content type and features
      const contentType = this.detectContentType(processedContent);
      
      let html = processedContent;
      let plainText = processedContent;

      try {
        // Process based on content type and options
        if (contentType.type === 'html') {
          // Content is already HTML - fix structure and sanitize it
          html = this.fixHTMLStructure(processedContent);
          plainText = this.extractPlainText(html);
          features.push('html');
        } else if (contentType.hasMarkdown && opts.enableMarkdown) {
          html = this.markdown.parseForChat(processedContent);
          plainText = this.markdown.stripMarkdown(processedContent);
          features.push('markdown');
        } else {
          // Basic text processing
          html = this.processPlainText(processedContent, opts);
          plainText = this.xss.sanitizeText(processedContent);
        }

        // Auto-link URLs if enabled
        if (opts.enableAutoLinking && contentType.hasUrls) {
          html = this.autoLinkUrls(html);
          features.push('autolink');
        }

        // Process mentions
        if (opts.enableMentions && contentType.hasMentions) {
          html = this.processMentions(html);
          features.push('mentions');
        }

        // Process hashtags
        if (opts.enableHashtags && contentType.hasHashtags) {
          html = this.processHashtags(html);
          features.push('hashtags');
        }

        // Emoji processing (if enabled)
        if (opts.enableEmojis) {
          html = this.processEmojis(html);
          features.push('emojis');
        }

        // Final sanitization - use sanitizeParsedHTML to avoid double-encoding
        if (opts.sanitize) {
          html = this.xss.sanitizeParsedHTML(html, {
            allowBasicFormatting: true,
            allowLinks: opts.allowLinks,
            allowImages: opts.allowImages
          });
        }

      } catch (error) {
        this.utils.log && this.utils.log('Content processing error:', error);
        // Fallback to safe text
        html = this.xss.sanitizeText(processedContent);
        plainText = processedContent;
        features.push('error-fallback');
      }

      return {
        html: html.trim(),
        text: plainText.trim(),
        type: contentType.type,
        features: features,
        length: processedContent.length,
        truncated: content.length > opts.maxLength
      };
    }

    /**
     * Detect content type and features
     * @param {string} content - Content to analyze
     * @returns {Object} - Content analysis results
     */
    detectContentType(content) {
      const analysis = {
        type: 'text',
        hasHTML: /<[^>]+>/.test(content), // Check for HTML tags
        hasMarkdown: this.patterns.hasMarkdown.test(content),
        hasCode: this.patterns.hasCode.test(content),
        hasList: this.patterns.hasList.test(content),
        hasUrls: this.patterns.url.test(content),
        hasEmails: this.patterns.email.test(content),
        hasMentions: this.patterns.mention.test(content),
        hasHashtags: this.patterns.hashtag.test(content),
        lineCount: content.split('\n').length
      };

      // Determine primary content type
      if (analysis.hasHTML) {
        analysis.type = 'html'; // Content is already HTML
      } else if (analysis.hasCode) {
        analysis.type = 'code';
      } else if (analysis.hasMarkdown) {
        analysis.type = 'markdown';
      } else if (analysis.hasList) {
        analysis.type = 'list';
      } else if (analysis.lineCount > 3) {
        analysis.type = 'multiline';
      }

      return analysis;
    }

    /**
     * Process plain text with basic enhancements
     * @param {string} text - Plain text to process
     * @param {Object} options - Processing options
     * @returns {string} - Enhanced HTML
     */
    processPlainText(text, options = {}) {
      let html = this.xss.sanitizeText(text);

      // Preserve line breaks
      if (options.preserveLineBreaks) {
        html = html.replace(/\n/g, '<br>');
      }

      return html;
    }

    /**
     * Auto-link URLs in content
     * @param {string} html - HTML content
     * @returns {string} - HTML with auto-linked URLs
     */
    autoLinkUrls(html) {
      return html.replace(this.patterns.url, (url) => {
        const sanitizedUrl = this.xss.sanitizeURL(url);
        if (!sanitizedUrl) {
          return url;
        }
        
        // Truncate long URLs for display
        const displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
        
        return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer" title="${sanitizedUrl}">${displayUrl}</a>`;
      });
    }

    /**
     * Process @mentions in content
     * @param {string} html - HTML content
     * @returns {string} - HTML with processed mentions
     */
    processMentions(html) {
      return html.replace(this.patterns.mention, (_, username) => {
        const sanitizedUsername = this.xss.sanitizeText(username);
        return `<span class="mention" data-user="${sanitizedUsername}">@${sanitizedUsername}</span>`;
      });
    }

    /**
     * Process #hashtags in content
     * @param {string} html - HTML content
     * @returns {string} - HTML with processed hashtags
     */
    processHashtags(html) {
      return html.replace(this.patterns.hashtag, (_, hashtag) => {
        const sanitizedHashtag = this.xss.sanitizeText(hashtag);
        return `<span class="hashtag" data-tag="${sanitizedHashtag}">#${sanitizedHashtag}</span>`;
      });
    }

    /**
     * Process emojis and emoticons
     * @param {string} html - HTML content
     * @returns {string} - HTML with processed emojis
     */
    processEmojis(html) {
      // Basic emoticon to emoji conversion
      const emoticons = {
        ':)': '😊',
        ':-)': '😊',
        ':(': '😢',
        ':-(': '😢',
        ':D': '😃',
        ':-D': '😃',
        ';)': '😉',
        ';-)': '😉',
        ':P': '😛',
        ':-P': '😛',
        ':o': '😮',
        ':-o': '😮',
        ':|': '😐',
        ':-|': '😐',
        ':*': '😘',
        ':-*': '😘',
        '</3': '💔',
        '<3': '❤️'
      };

      let result = html;
      
      Object.entries(emoticons).forEach(([emoticon, emoji]) => {
        // Escape special regex characters
        const escapedEmoticon = emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedEmoticon}\\b`, 'g');
        result = result.replace(regex, emoji);
      });

      return result;
    }

    /**
     * Extract plain text from processed content
     * @param {string} html - HTML content
     * @returns {string} - Plain text
     */
    extractPlainText(html) {
      // Create temporary div to extract text content
      const temp = document.createElement('div');
      temp.innerHTML = html;
      return temp.textContent || temp.innerText || '';
    }


    /**
     * Fix common HTML structure issues
     * @param {string} html - HTML to fix
     * @returns {string} - Fixed HTML
     */
    fixHTMLStructure(html) {
      // Fix <li> tags inside <p> tags (invalid HTML)
      // Replace <p><li> with <ul><li> and </li><br> with </li></ul><p>
      html = html.replace(/<p>(<li>)/g, '<ul>$1');
      html = html.replace(/(<\/li>)<br>/g, '$1');
      html = html.replace(/(<\/li>)<\/p>/g, '$1</ul>');
      
      // Fix orphaned <li> tags not in lists
      html = html.replace(/(<li>[\s\S]*?<\/li>)(?![^<]*<\/[uo]l>)/g, '<ul>$1</ul>');
      
      // Remove empty paragraphs
      html = html.replace(/<p>\s*<\/p>/g, '');
      
      return html;
    }

  }

  // Export to window
  window.CustomerAgentRichContentParser = RichContentParser;

})(window);