import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { sendChatMessage } from '../utils/api';
import './AgentChatbot.css';

export default function AgentChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello! I'm Scantinel AI. I can help you analyze scan results, explain vulnerabilities, or answer general security questions. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatbotRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Helper to format basic markdown (bold and lists)
  const formatText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;

    const renderLineText = (str) => {
      const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: 'var(--primary-color, #00D4FF)' }}>{part.slice(2, -2)}</strong>;
        } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        } else if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      });
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
      const isNumber = /^\d+\.\s/.test(trimmed);

      if (isBullet || isNumber) {
        if (!inList) inList = true;
        const content = isBullet ? trimmed.substring(2) : trimmed.replace(/^\d+\.\s/, '');
        listItems.push(
          <li key={i} style={{ marginBottom: '6px', lineHeight: '1.5' }}>
            {renderLineText(content)}
          </li>
        );
      } else {
        if (inList) {
          elements.push(<ul key={`ul-${i}`} style={{ paddingLeft: '20px', margin: '8px 0', listStyleType: 'disc' }}>{listItems}</ul>);
          listItems = [];
          inList = false;
        }
        if (trimmed.startsWith('### ')) {
          elements.push(<h4 key={i} style={{ margin: '12px 0 8px 0', fontSize: '1.05rem', fontWeight: 'bold' }}>{renderLineText(trimmed.substring(4))}</h4>);
        } else if (trimmed.startsWith('## ')) {
          elements.push(<h3 key={i} style={{ margin: '14px 0 8px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>{renderLineText(trimmed.substring(3))}</h3>);
        } else if (trimmed.startsWith('# ')) {
          elements.push(<h2 key={i} style={{ margin: '16px 0 8px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>{renderLineText(trimmed.substring(2))}</h2>);
        } else if (trimmed) {
          elements.push(<p key={i} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{renderLineText(trimmed)}</p>);
        }
      }
    });

    if (inList) {
      elements.push(<ul key="ul-end" style={{ paddingLeft: '20px', margin: '8px 0', listStyleType: 'disc' }}>{listItems}</ul>);
    }

    return elements;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Format messages for Gemini API (Must start with a 'user' message)
      const messagesToSend = newMessages[0].text.startsWith("Hello! I'm Scantinel AI") 
        ? newMessages.slice(1) 
        : newMessages;
        
      const formattedMessages = messagesToSend.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
      
      const response = await sendChatMessage(formattedMessages);
      
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Sorry, I encountered an error. Please make sure the Gemini API key is configured in the backend.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container" ref={chatbotRef}>
      {!isOpen ? (
        <button className="chatbot-toggle glass-button" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
        </button>
      ) : (
        <div className="chatbot-window glass-panel">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <Bot size={20} className="text-primary" />
              <span>Scantinel AI</span>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="chatbot-messages custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="chat-avatar">
                  {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="chat-bubble" style={{ display: 'flex', flexDirection: 'column' }}>
                  {formatText(msg.text)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message model">
                <div className="chat-avatar"><Bot size={16} /></div>
                <div className="chat-bubble typing">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-area" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your security scan..."
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="send-btn">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
