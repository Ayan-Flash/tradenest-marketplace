import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    try {
      const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
      if (storedMessages.length === 0) {
        setMessages([
          {
            role: 'assistant',
            content: '👋 Hi! I am TradeNest Assistant. How can I help you today with buying, selling, or renting items?'
          }
        ]);
      } else {
        setMessages(storedMessages);
      }
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('messages', JSON.stringify(messages));
    }
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: trimmed,
        messages: updatedMessages,
      });

      const botReply = response.data?.reply || "I didn't receive a response.";
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: botReply }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Sorry, there was an issue processing your request. Please ensure the backend is running and GEMINI_API_KEY is configured.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    try {
      await axios.post(`${API_BASE_URL}/new-session`).catch(() => {});
      const welcome = [
        {
          role: 'assistant',
          content: '👋 New conversation started. How can I help you today?'
        }
      ];
      setMessages(welcome);
      localStorage.setItem('messages', JSON.stringify(welcome));
    } catch (error) {
      console.error('Error starting new session:', error);
    }
  };

  return (
    <div className="row justify-content-center py-2">
      <div className="col-12 col-md-10 col-lg-8">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <span className="fs-4 me-2">🤖</span>
              <div>
                <h5 className="mb-0 fw-bold">TradeNest AI Support</h5>
                <small className="opacity-75">Instant answers for marketplace queries</small>
              </div>
            </div>
            <button
              onClick={startNewSession}
              className="btn btn-sm btn-outline-light"
              title="Reset conversation"
            >
              🔄 New Chat
            </button>
          </div>

          <div
            className="card-body p-3 overflow-auto"
            style={{ height: '450px', backgroundColor: '#f8f9fa' }}
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div
                    className={`p-3 rounded-4 shadow-sm ${
                      isUser
                        ? 'bg-primary text-white text-end'
                        : 'bg-white text-dark border'
                    }`}
                    style={{ maxWidth: '80%', wordBreak: 'break-word' }}
                  >
                    <div className="small fw-semibold opacity-75 mb-1">
                      {isUser ? 'You' : 'TradeNest Assistant'}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="d-flex justify-content-start mb-3">
                <div className="bg-white text-muted border p-3 rounded-4 shadow-sm small">
                  <span className="spinner-grow spinner-grow-sm me-2" role="status"></span>
                  TradeNest Assistant is typing...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="card-footer bg-white border-top p-3">
            <form onSubmit={sendMessage} className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Ask anything about buying, selling, renting..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary px-4 fw-semibold"
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
