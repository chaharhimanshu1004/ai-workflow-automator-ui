import { ActionsI, CredentialFormField } from '@/types/workflows.interface';
import { actionCredentialMapping } from '@/lib/constants/credentials';

interface CredentialFormModalProps {
    isOpen: boolean;
    pendingActionType: ActionsI | null;
    credentialFormData: Record<string, string>;
    isOAuthLoading: boolean;
    onFormChange: (key: string, value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export function CredentialFormModal({
    isOpen,
    pendingActionType,
    credentialFormData,
    isOAuthLoading,
    onFormChange,
    onSubmit,
    onClose
}: CredentialFormModalProps) {
    if (!isOpen || !pendingActionType) return null;

    const credentialInfo = actionCredentialMapping[pendingActionType.id];
    if (!credentialInfo) return null;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                    <div>
                        <h3 className="text-lg font-bold">Setup {pendingActionType.label}</h3>
                        <p className="text-sm text-gray-600">
                            Please provide your {credentialInfo.platform} credentials to continue.
                        </p>
                    </div>
                </div>

                {credentialInfo.useOAuth ? (
                    <>
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">Gmail OAuth Authorization</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>You'll be redirected to Google to authorize access to your Gmail account.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                disabled={isOAuthLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onSubmit}
                                className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                disabled={isOAuthLoading}
                            >
                                {isOAuthLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Authorizing...
                                    </div>
                                ) : (
                                    'Authorize with Google'
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit();
                    }}>
                        <div className="space-y-4">
                            {credentialInfo.fields?.map((field) => (
                                <div key={field.key} className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label}
                                        {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        value={credentialFormData[field.key] || ''}
                                        onChange={(e) => onFormChange(field.key, e.target.value)}
                                        required={field.required}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Save & Continue
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}