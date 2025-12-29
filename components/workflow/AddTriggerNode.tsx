import { CustomNodeProps } from "@/types/workflows.interface";

export const AddTriggerNode = ({ data }: CustomNodeProps) => {
    return (
        <div className="px-2 py-1 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-600/20 cursor-pointer hover:bg-emerald-700 transition-all duration-200 border border-emerald-500">
            <div className="text-center">
                <div className="text-lg mb-1 font-bold">+</div>
                <div className="font-semibold text-xs">Add Trigger</div>
            </div>
        </div>
    );
};