"use client";

import { useState, useEffect } from "react";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { useSearchParams } from "next/navigation";

import client from "./aws";
import File from "./file";

// 環境変数の読み込み
const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN;

// 公開URLのベース
const PUBLIC_URL_BASE = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;

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

  // S3から一覧を取得する処理
  useEffect(() => {
    // 認証トークンの取得
    const authToken = searchParams.get("auth");

    const fetchFiles = async () => {
      // パラメータに認証トークンがなければ処理を中断
      if ((AUTH_TOKEN && authToken !== AUTH_TOKEN) || !client) {
        return;
      }

      // ListObjectsV2コマンドを作成
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 100, // 取得数（必要に応じて増やす）
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
          // 1. 拡張子を取り出して小文字にする（ない場合は空文字）
          const extA = a.key.split(".").pop()?.toLowerCase() || "";
          const extB = b.key.split(".").pop()?.toLowerCase() || "";

          // 2. 第一ソート：拡張子で比較
          const extComparison = extA.localeCompare(extB);

          // 拡張子が違うなら、その結果を返す（これで順序が決まる）
          if (extComparison !== 0) {
            return extComparison;
          }

          // 3. 第二ソート：拡張子が同じなら、ファイル名（キー）全体で比較
          return a.key.localeCompare(b.key);
        });

      setFiles(fileList);
    };

    fetchFiles();
  }, []);

  return (
    <div>
      {selectedFile && (
        <p className="mb-4 p-3 bg-blue-100 rounded border border-blue-300">
          <span className="block text-sm font-semibold text-gray-700">
            選択中:
          </span>
          <span className="block text-base text-gray-900">{selectedFile}</span>
        </p>
      )}
      {files &&
        files.map((file) => (
          <File
            key={file.key}
            id={file.key}
            fullURL={file.fullURL}
            isImage={file.isImage}
            isSelected={selectedFile === file.key}
            onSelect={setSelectedFile}
          />
        ))}
    </div>
  );
}
