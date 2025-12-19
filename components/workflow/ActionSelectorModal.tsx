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
    isEditing = false
}: ActionSelectorModalProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                {!showConfigForm ? (
                    <>
                        <h3 className="text-lg font-bold mb-4">Add Action</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {actionTypes.map((actionType) => {
                                const credentialInfo = actionCredentialMapping[actionType.id];
                                const hasCredential = credentialInfo ? checkCredentialExists(credentialInfo.platform) : true;

                                return (
                                    <button
                                        key={actionType.id}
                                        onClick={() => onSelectActionType(actionType)}
                                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition text-left relative"
                                        style={{ borderColor: actionType.color }}
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{actionType.label}</div>
                                            {actionType.description && (
                                                <div className="text-xs text-gray-500">{actionType.description}</div>
                                            )}
                                        </div>
                                        {credentialInfo && !hasCredential && (
                                            <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full" title="Credentials required" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center mb-4">
                            {!isEditing && (
                                <button
                                    onClick={onBackToSelector}
                                    className="mr-2 text-gray-500 hover:text-gray-700"
                                >
                                    ← Back
                                </button>
                            )}
                            <h3 className="text-lg font-bold">Configure {currentActionType?.label}</h3>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            onConfigSubmit();
                        }}>
                            <div className="space-y-4">
                                {currentActionType?.configFields?.map((field) => (
                                    <div key={field.key} className="form-group">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {field.label}
                                            {field.required && <span className="text-red-500">*</span>}
                                        </label>

                                        {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                                            <input
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={configValues[field.key] || ''}
                                                onChange={(e) => onConfigChange(field.key, e.target.value)}
                                                required={field.required}
                                            />
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={configValues[field.key] || ''}
                                                onChange={(e) => onConfigChange(field.key, e.target.value)}
                                                required={field.required}
                                                rows={3}
                                            />
                                        ) : field.type === 'select' ? (
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

                            <div className="mt-6 flex space-x-3">
                                <button
                                    type="button"
                                    onClick={isEditing ? onClose : onBackToSelector}
                                    className="flex-1 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    {isEditing ? 'Update Node' : 'Add Node'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}