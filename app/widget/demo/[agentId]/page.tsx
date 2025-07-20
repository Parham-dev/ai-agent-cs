'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Script from 'next/script'

export default function WidgetDemoPage() {
  const params = useParams()
  const agentId = params?.agentId as string

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

    if (!agentId) {
      showStatus('No agent ID provided in URL', 'error');
      return;
    }

    showStatus('Loading third-party demo...', 'info');
    
    // Configure widget before script loads
    (window as unknown as Record<string, unknown>).CustomerAgent = {
      agentId: agentId,
      position: 'bottom-right',
      theme: 'auto', 
      primaryColor: '#007bff',
      greeting: 'Hello! Welcome to our demo store. How can I help you today?',
      debug: true // Enable debug to see what's happening
    };
    
    setTimeout(() => {
      showStatus('Demo configured - widget should appear automatically', 'success');
    }, 1000);
  }, [agentId]);

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
        .status {
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        .status.info {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.5);
        }
        .status.success {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.5);
        }
        .status.error {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
        }
      `}</style>
      
      {/* AI Customer Support Widget */}
      <Script 
        src="http://localhost:3000/widget/widget.js" 
        strategy="afterInteractive"
      />
      
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
              🛍️ Demo E-commerce Store
            </h1>
            <p style={{ 
              fontSize: '1.2rem', 
              opacity: 0.9, 
              marginBottom: '1rem' 
            }}>
              Welcome to our online store! Browse our products and get instant AI-powered support.
            </p>
            <p style={{ 
              fontSize: '1rem', 
              opacity: 0.7, 
              marginBottom: '2rem' 
            }}>
              This is a third-party website simulation with AI customer service widget
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
                transition: 'all 0.3s ease',
                marginBottom: '1rem'
              }}
            >
              💬 Need Help? Chat with us!
            </button>
            <div 
              id="status" 
              style={{
                maxWidth: '400px',
                margin: '0 auto',
                display: 'none'
              }}
            />
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>🛒 Our Products</h3>
            <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
              Browse our featured products and get instant support from our AI assistant:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '1rem', borderRadius: '8px' }}>
                <h4>📱 Smartphones</h4>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Latest models with advanced features</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '1rem', borderRadius: '8px' }}>
                <h4>💻 Laptops</h4>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>High-performance computers for work</p>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '1rem', borderRadius: '8px' }}>
                <h4>🎧 Headphones</h4>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Premium audio experience</p>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              💡 <strong>Try asking our AI:</strong> &quot;What&apos;s your return policy?&quot; or &quot;Do you have any smartphone deals?&quot;
            </p>
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
              <h3 style={{ marginBottom: '1rem' }}>🚚 Fast Delivery</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                Free shipping on orders over $50. Same-day delivery available in select areas.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>🛡️ Secure Payment</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                Your transactions are protected with industry-leading security measures.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>🔄 Easy Returns</h3>
              <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                30-day return policy with hassle-free exchanges and refunds.
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
            <h2 style={{ marginBottom: '1rem' }}>💬 Customer Support</h2>
            <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
              Need help? Our AI assistant is here 24/7 to answer your questions!
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '1.5rem',
              borderRadius: '8px',
              margin: '2rem 0',
              fontSize: '0.9rem'
            }}>
              <p style={{ marginBottom: '1rem' }}>✨ <strong>Powered by AI</strong></p>
              <p style={{ marginBottom: '1rem' }}>🕐 Available 24/7</p>
              <p style={{ marginBottom: '0' }}>⚡ Instant responses</p>
            </div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Look for the chat bubble in the bottom-right corner!
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '2rem 0',
          opacity: 0.6,
          fontSize: '0.9rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          marginTop: '3rem'
        }}>
          <p>© 2024 Demo Store - This is a simulation for testing the AI customer service widget</p>
        </div>
      </div>
    </>
  );
}