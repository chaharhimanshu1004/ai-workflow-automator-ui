import { ActionsI, ActionConfig } from '@/types/workflows.interface';
import { actionCredentialMapping } from '@/lib/constants/credentials';

interface ActionSelectorModalProps {
    isOpen: boolean;
    actionTypes: ActionsI[];
    currentActionType: ActionsI | null;
    showConfigForm: boolean;
    configValues: Record<string, any>;
    checkCredentialExists: (platform: string) => boolean;
    onSelectActionType: (actionType: ActionsI) => void;
    onConfigChange: (key: string, value: any) => void;
    onConfigSubmit: () => void;
    onBackToSelector: () => void;
    onClose: () => void;
    isEditing?: boolean;
    upstreamNodes?: { id: string; label: string }[];
}

export function ActionSelectorModal({
    isOpen,
    actionTypes,
    currentActionType,
    showConfigForm,
    configValues,
    checkCredentialExists,
    onSelectActionType,
    onConfigChange,
    onConfigSubmit,
    onBackToSelector,
    onClose,
    isEditing = false,
    upstreamNodes = []
}: ActionSelectorModalProps) {
    if (!isOpen) return null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {!showConfigForm ? (
                    <>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">Add Action</h3>
                            <p className="text-zinc-400 text-sm">Select an action to add to your workflow</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                            {actionTypes.map((actionType) => {
                                const credentialInfo = actionCredentialMapping[actionType.id];
                                const hasCredential = credentialInfo ? checkCredentialExists(credentialInfo.platform) : true;

                                return (
                                    <button
                                        key={actionType.id}
                                        onClick={() => onSelectActionType(actionType)}
                                        className="flex items-start p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all text-left relative group"
                                    >
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-110 transition-transform"
                                            style={{ backgroundColor: `${actionType.color}20` }}>
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: actionType.color }}></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-white text-sm mb-1">{actionType.label}</div>
                                            {actionType.description && (
                                                <div className="text-xs text-zinc-500 line-clamp-2">{actionType.description}</div>
                                            )}
                                        </div>
                                        {credentialInfo && !hasCredential && (
                                            <div className="absolute top-2 right-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                    Setup Cred
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center mb-6">
                            <button
                                onClick={onBackToSelector}
                                className="mr-3 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-white mb-1">
                                    {isEditing ? 'Edit' : 'Configure'} {currentActionType?.label}
                                </h3>
                                <p className="text-zinc-400 text-sm">{currentActionType?.description}</p>
                            </div>
                        </div>

                        {upstreamNodes.length > 0 && (
                            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-600/30 rounded-xl">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-emerald-400 mb-2">Available Variables</h4>
                                        <p className="text-xs text-zinc-400 mb-3">Copy and paste these variables into your configuration fields</p>
                                        <div className="space-y-2">
                                            {upstreamNodes.map((node) => (
                                                <div key={node.id} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg group">
                                                    <span className="text-zinc-300 font-medium text-sm truncate mr-2" title={node.label}>{node.label}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <code className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">{'{{'}{node.id}.output{'}}'}</code>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(`{{${node.id}.output}}`)}
                                                            className="text-xs text-emerald-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/10 px-2 py-1 rounded"
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            onConfigSubmit();
                        }}>
                            <div className="space-y-5 mb-6">
                                {currentActionType?.configFields?.map((field) => (
                                    <div key={field.key} className="form-group">
                                        <label className="block text-sm font-semibold text-zinc-300 mb-2">
                                            {field.label}
                                            {field.required && <span className="text-red-400 ml-1">*</span>}
                                        </label>

                                        {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                                            <input
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                                                value={configValues[field.key] || ''}
                                                onChange={(e) => onConfigChange(field.key, e.target.value)}
                                                required={field.required}
                                            />
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                placeholder={field.placeholder}
                                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all min-h-[100px] resize-y"
                                                value={configValues[field.key] || ''}
                                                onChange={(e) => onConfigChange(field.key, e.target.value)}
                                                required={field.required}
                                            />
                                        ) : field.type === 'select' ? (
                                            <select
                                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                                                value={configValues[field.key] || ''}
                                                onChange={(e) => onConfigChange(field.key, e.target.value)}
                                                required={field.required}
                                            >
                                                <option value="">Select an option</option>
                                                {field.options?.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : null}
                                    </div>
                                ))}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 border border-zinc-700 rounded-xl text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-emerald-600/20"
                                >
                                    {isEditing ? 'Update' : 'Add'} Action
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}