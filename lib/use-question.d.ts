declare function isActive<D>(c: {
    data: D | null;
}): c is {
    data: D;
};
export default function useQuestion<DataType = string>(): {
    ask: (data: DataType) => Promise<boolean>;
    data: DataType | null;
    isActive: typeof isActive;
    onConfirm: () => void;
    onReject: () => void;
};
export {};
