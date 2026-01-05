export default function SelectedFileViewer({
  selectedFile,
}: {
  selectedFile: string;
}) {
  return (
    <div className="sticky top-0 left-0 z-10 pb-4">
      <div className="relative p-3 bg-blue-100 rounded border border-blue-300 custom-shadow">
        <p className="block text-sm font-semibold text-gray-700">選択中:</p>
        <p className="block text-base text-gray-900">{selectedFile}</p>
      </div>
    </div>
  );
}
