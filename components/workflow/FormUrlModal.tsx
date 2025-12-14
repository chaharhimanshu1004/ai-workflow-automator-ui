import toast from 'react-hot-toast';

interface FormUrlModalProps {
    isOpen: boolean;
    formUrl: string | null;
    onClose: () => void;
}

export function FormUrlModal({ isOpen, formUrl, onClose }: FormUrlModalProps) {
    if (!isOpen || !formUrl) return null;

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(formUrl);
        toast.success('Form URL copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg w-full mx-4">
                <div className="flex items-center mb-4">
                    <span className="mr-3 text-2xl">📝</span>
                    <h3 className="text-lg font-bold">Form Trigger Created!</h3>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Your form trigger is ready! Anyone who submits this form will trigger your workflow:
                    </p>

                    <div className="bg-gray-50 border rounded-md p-3 mb-4">
                        <div className="flex items-center justify-between">
                            <code className="text-sm text-blue-600 break-all mr-2">
                                {formUrl}
                            </code>
                            <button
                                onClick={handleCopyUrl}
                                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition flex-shrink-0"
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <a
                            href={formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-green-600 text-white text-center rounded-md hover:bg-green-700 transition text-sm"
                        >
                            🔗 Test Form
                        </a>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">How it Works</h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Share this link with anyone</li>
                                    <li>When someone submits the form → Your workflow runs</li>
                                    <li>Form data is available in your workflow actions</li>
                                    <li>No configuration needed - just share and go!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}