import { Suspense } from "react";
import FileBrowser from "@/components/FileBrowser";

export default function Home() {
  return (
    <main className="p-4">
      <Suspense fallback={<div>読み込み中...</div>}>
        <FileBrowser />
      </Suspense>
    </main>
  );
}
