import { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import ChatInterface from './components/ChatInterface';
import { getEmbeddingProvider, setEmbeddingProvider } from './api';

function App() {
    const [isReady, setIsReady] = useState(false);
    const [showUploader, setShowUploader] = useState(true);
    const [embeddingProvider, setEmbeddingProviderState] = useState('huggingface');
    const [changingProvider, setChangingProvider] = useState(false);

    useEffect(() => {
        const fetchProvider = async () => {
            try {
                const result = await getEmbeddingProvider();
                setEmbeddingProviderState(result.provider);
            } catch (err) {
                console.error('Failed to fetch embedding provider:', err);
            }
        };
        fetchProvider();
    }, []);

    const handleProviderChange = async (newProvider) => {
        if (newProvider === embeddingProvider || changingProvider) return;

        setChangingProvider(true);
        try {
            await setEmbeddingProvider(newProvider);
            setEmbeddingProviderState(newProvider);
            setIsReady(false);
        } catch (err) {
            console.error('Failed to change provider:', err);
        } finally {
            setChangingProvider(false);
        }
    };

    const handleUploadComplete = (result) => {
        setIsReady(true);
        setTimeout(() => setShowUploader(false), 2000);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass border-b border-slate-700/50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold gradient-text">PDF RAG Chatbot</h1>
                                <p className="text-xs text-slate-400">Powered by Gemini AI</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Embeddings:</span>
                                <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                                    <button
                                        onClick={() => handleProviderChange('huggingface')}
                                        disabled={changingProvider}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${embeddingProvider === 'huggingface'
                                            ? 'bg-emerald-500 text-white'
                                            : 'text-slate-400 hover:text-slate-200'
                                            } ${changingProvider ? 'opacity-50' : ''}`}
                                    >
                                        HuggingFace
                                    </button>
                                    <button
                                        onClick={() => handleProviderChange('google')}
                                        disabled={changingProvider}
                                        className={`px-3 py-1 text-xs rounded-md transition-all ${embeddingProvider === 'google'
                                            ? 'bg-blue-500 text-white'
                                            : 'text-slate-400 hover:text-slate-200'
                                            } ${changingProvider ? 'opacity-50' : ''}`}
                                    >
                                        Google
                                    </button>
                                </div>
                            </div>

                            {isReady && (
                                <button
                                    onClick={() => setShowUploader(!showUploader)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 transition-all"
                                >
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-sm text-slate-300">Add More PDFs</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${embeddingProvider === 'huggingface' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        <span className="text-slate-400">
                            {embeddingProvider === 'huggingface'
                                ? 'Using HuggingFace (local, no API quota)'
                                : 'Using Google (requires API quota)'}
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
                {showUploader && (
                    <div className="p-6 border-b border-slate-700/30">
                        <FileUploader onUploadComplete={handleUploadComplete} />
                    </div>
                )}

                <div className={`flex-1 flex flex-col ${showUploader ? 'min-h-[400px]' : 'min-h-[600px]'}`}>
                    <ChatInterface isReady={isReady} />
                </div>
            </main>

            <footer className="glass border-t border-slate-700/50 py-3">
                <div className="max-w-6xl mx-auto px-6">
                    <p className="text-center text-xs text-slate-500">
                        Built with React, FastAPI & LangChain • Using Google Gemini & Pinecone
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
