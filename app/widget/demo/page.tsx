'use client'

import { useEffect } from 'react'

export default function WidgetDemoPage() {
  useEffect(() => {
    // Get the first available agent ID
    async function getFirstAgent() {
      try {
        const response = await fetch('/api/agents');
        const data = await response.json();
        if (data.success && data.data && data.data.agents.length > 0) {
          return data.data.agents[0].id;
        }
        return null;
      } catch (error) {
        console.error('Failed to get agent:', error);
        return null;
      }
    }

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
      showStatus('Loading demo...', 'info');
      
      // Get first available agent
      const agentId = await getFirstAgent();
      if (agentId) {
        (window as { CustomerAgent?: Record<string, unknown> }).CustomerAgent = {
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
        
        showStatus('Widget ready! Look for the chat bubble.', 'success');
        
        // Load the widget
        const script = document.createElement('script');
        script.src = '/widget/widget.js';
        script.onload = () => {
          showStatus('Widget loaded successfully!', 'success');
        };
        script.onerror = () => {
          showStatus('Failed to load widget', 'error');
        };
        document.head.appendChild(script);
      } else {
        showStatus('No agents found. Please create an agent first.', 'error');
      }
    }

    initWidget();
  }, []);

  const openWidget = () => {
    if (typeof window !== 'undefined' && (window as { CustomerAgent?: { open?: () => void } }).CustomerAgent) {
      (window as { CustomerAgent?: { open?: () => void } }).CustomerAgent?.open?.();
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
              marginBottom: '2rem' 
            }}>
              Experience intelligent customer support powered by AI agents
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
              This demo shows the widget in action. Here&apos;s what you can try:
            </p>
            <ol style={{ paddingLeft: '1.5rem', opacity: 0.9 }}>
              <li style={{ marginBottom: '0.5rem' }}>Wait for the chat bubble to appear (bottom-right corner)</li>
              <li style={{ marginBottom: '0.5rem' }}>Click the bubble or the button above to open the chat</li>
              <li style={{ marginBottom: '0.5rem' }}>Ask questions like &quot;What products do you have?&quot; or &quot;Tell me about your store&quot;</li>
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
    agentId: 'your-agent-id-here',
    position: 'bottom-right',
    theme: 'auto',
    primaryColor: '#007bff'
  };
</script>
<script src="/widget/widget.js"></script>`}
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Replace &quot;your-agent-id-here&quot; with your actual agent ID from the dashboard.
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