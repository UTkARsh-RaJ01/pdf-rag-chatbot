import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadPDFs } from '../api';

const FileUploader = ({ onUploadComplete, disabled }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [error, setError] = useState(null);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        setError(null);
        setUploadProgress({ files: acceptedFiles.length, status: 'Processing...' });

        try {
            const result = await uploadPDFs(acceptedFiles);
            setUploadProgress({
                files: result.files_processed,
                chunks: result.total_chunks,
                status: 'Complete!',
            });

            if (onUploadComplete) {
                onUploadComplete(result);
            }

            setTimeout(() => setUploadProgress(null), 3000);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.detail || 'Failed to upload files. Please try again.');
            setUploadProgress(null);
        } finally {
            setUploading(false);
        }
    }, [onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        disabled: disabled || uploading,
        multiple: true,
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed 
          transition-all duration-300 cursor-pointer
          ${isDragActive
                        ? 'border-primary-400 bg-primary-500/10 scale-[1.02]'
                        : 'border-slate-600 hover:border-primary-500 hover:bg-slate-800/50'
                    }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} />

                <div className="p-8 text-center">
                    <div className={`
            mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4
            transition-all duration-300
            ${isDragActive ? 'bg-primary-500/20 scale-110' : 'bg-slate-700/50'}
          `}>
                        <svg
                            className={`w-8 h-8 transition-colors ${isDragActive ? 'text-primary-400' : 'text-slate-400'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>

                    {uploading ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-primary-400 font-medium">Processing PDFs...</span>
                            </div>
                            {uploadProgress && (
                                <p className="text-sm text-slate-400">
                                    {uploadProgress.status}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <p className="text-lg font-medium text-slate-200 mb-1">
                                {isDragActive ? 'Drop your PDFs here' : 'Drag & drop PDF files'}
                            </p>
                            <p className="text-sm text-slate-400">
                                or click to browse • Multiple files supported
                            </p>
                        </>
                    )}
                </div>

                {isDragActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-primary-500/20 animate-pulse" />
                )}
            </div>

            {uploadProgress && !uploading && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-slide-left">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">
                            {uploadProgress.files} file(s) processed • {uploadProgress.chunks} chunks created
                        </span>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-slide-left">
                    <div className="flex items-center gap-2 text-red-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
