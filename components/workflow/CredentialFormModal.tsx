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
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Setup {pendingActionType.label}</h3>
                    <p className="text-zinc-400 text-sm">
                        Please provide your <span className="font-semibold text-emerald-400">{credentialInfo.platform}</span> credentials to continue.
                    </p>
                </div>

                {credentialInfo.useOAuth ? (
                    <>
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-600/30 rounded-xl flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-semibold text-emerald-400 mb-1">OAuth Authorization</h3>
                                <div className="text-xs text-zinc-400">
                                    <p>You'll be redirected to authorize access to your {credentialInfo.platform} account.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 border border-zinc-700 rounded-lg shadow-sm text-sm font-medium text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                                disabled={isOAuthLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onSubmit}
                                className="flex-1 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                disabled={isOAuthLoading}
                            >
                                {isOAuthLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Authorizing...
                                    </div>
                                ) : (
                                    `Authorize with ${credentialInfo.platform}`
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                    >
                        <div className="space-y-4">
                            {credentialInfo.fields?.map((field: CredentialFormField) => (
                                <div key={field.key} className="form-group">
                                    <label className="block text-sm font-semibold text-zinc-300 mb-1">
                                        {field.label}
                                        {field.required && <span className="text-red-400 ml-1">*</span>}
                                    </label>
                                    <input
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
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
                                className="flex-1 py-2 border border-zinc-700 rounded-lg shadow-sm text-sm font-medium text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
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