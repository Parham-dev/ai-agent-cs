'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function WidgetDemoPage() {
  const params = useParams()
  const agentId = params.agentId as string

  useEffect(() => {
    // Status helper
    function showStatus(message: string, type = 'info') {
      const status = document.getElementById('status');
      if (status) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
          status.style.display = 'none';
        }, 4000);
      }
    }

    // Initialize widget
    async function initWidget() {
      if (!agentId) {
        showStatus('No agent ID provided in URL', 'error');
        return;
      }

      showStatus('Loading demo...', 'info');
      
      // Wait a moment to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Configure widget with the agent ID from URL - MUST be set before script loads
      (window as any).CustomerAgent = {
        agentId: agentId,
        position: 'bottom-right',
        theme: 'auto',
        primaryColor: '#007bff',
        greeting: 'Hello! Welcome to our demo. I can help you find products and answer questions about our store.',
        triggers: {
          showAfter: 3000,
          showOnScroll: 30
        },
        debug: true
      };
      
      console.log('Widget config set:', (window as any).CustomerAgent);
      
      showStatus('Configuration set, loading widget...', 'info');
      
      // Load the widget script
      const script = document.createElement('script');
      script.src = '/widget/widget.js';
      script.onload = () => {
        showStatus('Widget loaded successfully!', 'success');
      };
      script.onerror = (error) => {
        console.error('Script load error:', error);
        showStatus('Failed to load widget script', 'error');
      };
      
      document.head.appendChild(script);
    }

    initWidget();
  }, [agentId]);

  const openWidget = () => {
    if (typeof window !== 'undefined' && (window as any).CustomerAgent) {
      (window as any).CustomerAgent.open();
    }
  };

  return (
    <>
      <style jsx global>{`
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
      `}</style>
      
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '40px',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1rem', 
              fontWeight: 700 
            }}>
              🤖 AI Customer Service Widget Demo
            </h1>
            <p style={{ 
              fontSize: '1.2rem', 
              opacity: 0.9, 
              marginBottom: '1rem' 
            }}>
              Experience intelligent customer support powered by AI agents
            </p>
            <p style={{ 
              fontSize: '1rem', 
              opacity: 0.7, 
              marginBottom: '2rem' 
            }}>
              Agent ID: {agentId}
            </p>
            <button 
              onClick={openWidget}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              💬 Try the Chat Widget
            </button>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>🎯 Demo Instructions</h3>
            <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
              This demo shows the widget in action. Here's what you can try:
            </p>
            <ol style={{ paddingLeft: '1.5rem', opacity: 0.9 }}>
              <li style={{ marginBottom: '0.5rem' }}>Wait for the chat bubble to appear (bottom-right corner)</li>
              <li style={{ marginBottom: '0.5rem' }}>Click the bubble or the button above to open the chat</li>
              <li style={{ marginBottom: '0.5rem' }}>Ask questions like "What products do you have?" or "Tell me about your store"</li>
              <li style={{ marginBottom: '0.5rem' }}>The AI agent will respond using real integration data</li>
            </ol>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '60px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>🚀 Instant Setup</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                Add powerful AI customer service to your website with just one line of code.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>🎨 Fully Customizable</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                Match your brand with custom themes, colors, and positioning options.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>📱 Mobile Ready</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                Responsive design that works perfectly on desktop and mobile devices.
              </p>
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '3rem',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Integration Code</h2>
            <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
              Copy and paste this code into your website:
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '1.5rem',
              borderRadius: '8px',
              margin: '2rem 0',
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '0.9rem',
              overflowX: 'auto'
            }}>
{`<script>
  window.CustomerAgent = {
    agentId: '${agentId}',
    position: 'bottom-right',
    theme: 'auto',
    primaryColor: '#007bff'
  };
</script>
<script src="/widget/widget.js"></script>`}
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              This demo is using agent ID: {agentId}
            </p>
          </div>
        </div>
        
        <div 
          id="status" 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            maxWidth: '300px',
            display: 'none'
          }}
        />
      </div>
    </>
  );
}