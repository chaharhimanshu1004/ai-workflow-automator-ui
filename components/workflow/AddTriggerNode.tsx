import { CustomNodeProps } from "@/types/workflows.interface";

export const AddTriggerNode = ({ data }: CustomNodeProps) => {
    return (
        <div className="px-2 py-1 bg-blue-500 text-white rounded shadow cursor-pointer hover:bg-blue-600 transition">
            <div className="text-center">
                <div className="text-xs mb-0">+</div>
                <div className="font-medium text-[10px]">Add Trigger</div>
            </div>
        </div>
    );
};