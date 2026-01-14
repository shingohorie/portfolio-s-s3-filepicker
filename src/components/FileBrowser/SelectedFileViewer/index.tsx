// JotaiのフックとAtomののインポート
import { useAtomValue } from "jotai";
import { selectedFileAtom, isErrorAtom } from "@/state/atom";

export default function SelectedFileViewer() {
  const selectedFile = useAtomValue(selectedFileAtom);
  const isError = useAtomValue(isErrorAtom);

  return (
    <div className="sticky top-0 left-0 z-10 mb-4 p-4 bg-white -mt-4 -ml-4 -mr-4">
      <div
        className={`relative flex items-center p-3 rounded border ${
          isError ? "bg-red-100 border-red-300" : "bg-blue-100 border-blue-300"
        }`}
      >
        {isError ? (
          <p className="block text-sm mr-1 text-gray-700">
            エラーが発生しました
          </p>
        ) : (
          <p className="block text-sm mr-1 text-gray-700">
            選択中: <span className="font-mono">{selectedFile}</span>
          </p>
        )}
      </div>
    </div>
  );
}
