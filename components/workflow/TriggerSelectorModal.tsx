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
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Select Trigger</h3>
                    <p className="text-zinc-400 text-sm">Choose how you want to start your workflow</p>
                </div>
                
                <div className="space-y-3 mb-6">
                    {triggerTypes.map((triggerType) => (
                        <button
                            key={triggerType.id}
                            onClick={() => onSelectTrigger(triggerType)}
                            className="w-full flex items-center p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all text-left group"
                        >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: `${triggerType.color}20` }}>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: triggerType.color }}></div>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-white mb-1">{triggerType.label}</div>
                                {triggerType.description && (
                                    <div className="text-xs text-zinc-500">{triggerType.description}</div>
                                )}
                            </div>
                            <svg className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl transition-colors font-medium"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}