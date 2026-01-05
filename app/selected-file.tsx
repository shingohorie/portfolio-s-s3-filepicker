export default function SelectedFileViewer({
  selectedFile,
}: {
  selectedFile: string;
}) {
  return (
    <p className="mb-4 p-3 bg-blue-100 rounded border border-blue-300">
      <span className="block text-sm font-semibold text-gray-700">選択中:</span>
      <span className="block text-base text-gray-900">{selectedFile}</span>
    </p>
  );
}
