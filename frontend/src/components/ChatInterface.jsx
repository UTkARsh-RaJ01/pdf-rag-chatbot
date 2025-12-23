import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendMessage, clearHistory } from '../api';

const ChatInterface = ({ isReady }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading || !isReady) return;

        const userMessage = { role: 'human', content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await sendMessage(userMessage.content, messages);
            const aiMessage = {
                role: 'ai',
                content: response.answer,
                sources: response.sources
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            console.error('Chat error:', err);
            const errorMessage = {
                role: 'ai',
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                isError: true
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleClearChat = async () => {
        try {
            await clearHistory();
            setMessages([]);
        } catch (err) {
            console.error('Failed to clear history:', err);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-emerald-500 glow-pulse' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-slate-300 font-medium">
                        {isReady ? 'Ready to chat' : 'Upload PDFs to start'}
                    </span>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={handleClearChat}
                        className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-200 mb-2">Start a Conversation</h3>
                            <p className="text-slate-400">
                                {isReady
                                    ? 'Ask questions about your uploaded PDFs and I\'ll find the answers for you.'
                                    : 'Upload PDF documents above to begin chatting with your documents.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <MessageBubble key={index} message={message} />
                    ))
                )}

                {loading && (
                    <div className="flex justify-start animate-slide-left">
                        <div className="bg-slate-700/50 rounded-2xl rounded-bl-md px-5 py-3">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-primary-400 rounded-full typing-dot" />
                                <div className="w-2 h-2 bg-primary-400 rounded-full typing-dot" />
                                <div className="w-2 h-2 bg-primary-400 rounded-full typing-dot" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-700/50">
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isReady ? "Ask a question about your documents..." : "Upload PDFs first to start chatting"}
                        disabled={!isReady || loading}
                        className={`
              flex-1 px-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700
              text-slate-200 placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
              transition-all duration-200
              ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || !isReady || loading}
                        className={`
              px-6 py-3 rounded-xl font-medium
              bg-gradient-to-r from-primary-500 to-primary-600
              hover:from-primary-400 hover:to-primary-500
              text-white shadow-lg shadow-primary-500/25
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
              flex items-center gap-2
            `}
                    >
                        <span>Send</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

const MessageBubble = ({ message }) => {
    const isHuman = message.role === 'human';

    return (
        <div className={`flex ${isHuman ? 'justify-end' : 'justify-start'} ${isHuman ? 'animate-slide-right' : 'animate-slide-left'}`}>
            <div className={`
        max-w-[80%] rounded-2xl px-5 py-3
        ${isHuman
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-md'
                    : message.isError
                        ? 'bg-red-500/20 text-red-200 border border-red-500/30 rounded-bl-md'
                        : 'bg-slate-700/50 text-slate-200 rounded-bl-md'
                }
      `}>
                <div className={`prose prose-sm max-w-none ${isHuman ? 'prose-invert' : 'prose-slate prose-invert'}`}>
                    {isHuman ? (
                        <p className="m-0 whitespace-pre-wrap">{message.content}</p>
                    ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    )}
                </div>

                {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600/50">
                        <p className="text-xs text-slate-400 mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs px-2 py-0.5 rounded-full bg-slate-600/50 text-slate-300"
                                >
                                    {source}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;
