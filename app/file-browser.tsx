"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { setupFieldExtension } from "microcms-field-extension-api";

import client from "./aws";
import File from "./file";
import SelectedFileViewer from "./selected-file";

// 環境変数の読み込み
const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN;
const MICROCMS_SERVICE_ID = process.env.NEXT_PUBLIC_MICROCMS_SERVICE_ID;

// 公開URLのベース
const PUBLIC_URL_BASE = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;

// microCMSのオリジンURL
const ORIGIN = `https://${MICROCMS_SERVICE_ID}.microcms.io`;

// S3から取得した情報の型定義
type S3File = {
  key: string;
  fullURL: string;
  isImage: boolean;
  lastModified: Date;
};

export default function FileBrowser() {
  const searchParams = useSearchParams();

  const [files, setFiles] = useState<S3File[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [frameID, setFrameID] = useState("");

  // パラメータに認証トークンがなければ処理を中断
  const authToken = searchParams.get("auth");

  if (AUTH_TOKEN && authToken !== AUTH_TOKEN) {
    return;
  }

  // S3から一覧を取得する処理
  const fetchFiles = async () => {
    if (!BUCKET_NAME || !client) {
      return;
    }

    // ListObjectsV2コマンドを作成
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1000, // 取得数（必要に応じて増やす）
    });

    // 送信
    const data = await client.send(command);

    // データの整形
    const fileList: S3File[] = (data?.Contents || [])
      .filter((item) => item.Key && !item.Key.endsWith("/")) // フォルダを除外
      .map((item) => ({
        key: item.Key!,
        fullURL: PUBLIC_URL_BASE + item.Key!,
        isImage: /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.Key!),
        lastModified: item.LastModified ?? new Date(0),
      }))
      // 新しい順に並び替え
      .sort((a, b) => {
        return a.key.localeCompare(b.key);
      });

    setFiles(fileList);
    setIsReady(true);
  };

  useEffect(() => {
    // コンポーネントのマウント時にS3からファイル一覧を取得
    fetchFiles();

    // microCMSからのメッセージを受信
    setupFieldExtension({
      origin: ORIGIN,
      width: "100%", //iframeの幅
      height: 250, //iframeの高さ
      onDefaultData: (e) => {
        console.log("初期データ:", e);
        setFrameID(e.data.id); // iframe識別子を保存
        setSelectedFile(e.data.message?.data.id || ""); // 前回セットした値を保存
      },
      onPostSuccess: (e) => console.log("成功時レスポンス:", e),
      onPostError: (e) => console.log("失敗時レスポンス:", e),
    });
  }, []);

  return (
    <div
      className={`transition-opacity ${isReady ? "opacity-100" : "opacity-0"}`}
    >
      {selectedFile && <SelectedFileViewer selectedFile={selectedFile} />}
      <details open={!selectedFile}>
        <summary className="cursor-pointer mb-2">
          ファイル一覧を表示／非表示
        </summary>
        {files &&
          files.map((file) => (
            <File
              key={file.key}
              id={file.key}
              frameID={frameID}
              fullURL={file.fullURL}
              isImage={file.isImage}
              isSelected={selectedFile === file.key}
              onSelect={setSelectedFile}
            />
          ))}
      </details>
    </div>
  );
}
