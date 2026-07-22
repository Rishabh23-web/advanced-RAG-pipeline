import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      });

      const data = await response.json();
      
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer || data.error }]);
    } catch (error) {
      console.error('Error fetching chat:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'An error occurred while fetching the answer.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to highlight citations like [Lesson: X @ Y]
  const formatText = (text) => {
    if (!text) return null;
    
    // Split by citation pattern
    const parts = text.split(/(\[Lesson:.*?@.*?\])/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('[Lesson:')) {
        return (
          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded cursor-pointer hover:bg-blue-200 transition-colors">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center">
        <h1 className="text-xl font-bold text-gray-800">Udemy Advanced RAG Q&A</h1>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>Ask a question about the course materials.</p>
            <p className="text-sm">Example: "What is the temporal dead zone in Node.js?"</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-lg p-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
              <div className="text-sm font-semibold mb-1 opacity-75">
                {msg.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <div className="leading-relaxed whitespace-pre-wrap">
                {formatText(msg.content)}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-500 border border-gray-200 rounded-lg p-4 shadow-sm">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 rounded-full border border-gray-300 px-6 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;
