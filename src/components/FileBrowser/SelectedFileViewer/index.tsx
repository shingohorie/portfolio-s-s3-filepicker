// JotaiのフックとAtomののインポート
import { useAtomValue } from "jotai";
import { selectedFileAtom, isErrorAtom } from "../atom";

export default function SelectedFileViewer() {
  const selectedFile = useAtomValue(selectedFileAtom);
  const isError = useAtomValue(isErrorAtom);

  return (
    <div
      className={`relative flex items-center p-3 mb-4 rounded border ${
        isError ? "bg-red-100 border-red-300" : "bg-blue-100 border-blue-300"
      }`}
    >
      {isError ? (
        <p className="block text-sm mr-1 text-gray-700">エラーが発生しました</p>
      ) : (
        <p className="block text-sm mr-1 text-gray-700">
          選択中: <span className="font-mono">{selectedFile}</span>
        </p>
      )}
    </div>
  );
}
