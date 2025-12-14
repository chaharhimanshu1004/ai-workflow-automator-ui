import { ActionsI } from '@/types/workflows.interface';

interface TriggerSelectorModalProps {
    isOpen: boolean;
    triggerTypes: ActionsI[];
    onSelectTrigger: (triggerType: ActionsI) => void;
    onClose: () => void;
}

export function TriggerSelectorModal({
    isOpen,
    triggerTypes,
    onSelectTrigger,
    onClose
}: TriggerSelectorModalProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4">Select Trigger</h3>
                <div className="grid grid-cols-1 gap-3">
                    {triggerTypes.map((triggerType) => (
                        <button
                            key={triggerType.id}
                            onClick={() => onSelectTrigger(triggerType)}
                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition text-left"
                            style={{ borderColor: triggerType.color }}
                        >
                            <div>
                                <div className="font-medium text-sm">{triggerType.label}</div>
                                <div className="text-xs text-gray-500">{triggerType.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}