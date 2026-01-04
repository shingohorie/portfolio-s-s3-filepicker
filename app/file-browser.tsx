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
  url: string;
  isImage: boolean;
  lastModified: Date;
};

export default function FileBrowser() {
  const searchParams = useSearchParams();

  const [files, setFiles] = useState<S3File[]>([]);

  // S3から一覧を取得する処理
  useEffect(() => {
    const authToken = searchParams.get("auth");

    const fetchFiles = async () => {
      if (AUTH_TOKEN && authToken !== AUTH_TOKEN) {
        return;
      }

      if (!client) {
        return;
      }

      // if (!REGION || !BUCKET_NAME || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      //   return;
      // }

      // // S3クライアントの初期化
      // const client = new S3Client({
      //   region: REGION,
      //   credentials: {
      //     accessKeyId: ACCESS_KEY_ID,
      //     secretAccessKey: SECRET_ACCESS_KEY,
      //   },
      // });

      // try {
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
          url: PUBLIC_URL_BASE + item.Key!,
          isImage: /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.Key!),
          lastModified: item.LastModified ?? new Date(0),
        }))
        // 新しい順に並び替え
        .sort((a, b) => {
          // 1. 拡張子を取り出して小文字にする（ない場合は空文字）
          const extA = a.key.split(".").pop()?.toLowerCase() || "";
          const extB = b.key.split(".").pop()?.toLowerCase() || "";

          // 2. 第一ソート：拡張子で比較
          // localeCompareは、文字列を比較して -1, 0, 1 を返す便利な関数です
          const extComparison = extA.localeCompare(extB);

          // 拡張子が違うなら、その結果を返す（これで順序が決まる）
          if (extComparison !== 0) {
            return extComparison;
          }

          // 3. 第二ソート：拡張子が同じなら、ファイル名（キー）全体で比較
          return a.key.localeCompare(b.key);
        });

      setFiles(fileList);
      // } catch (err: any) {
      //   console.error(err);
      //   setError(err.message || "S3からの取得に失敗しました");
      // } finally {
      //   setLoading(false);
      // }
    };

    fetchFiles();
  }, []);

  return (
    <div className="p-4">
      {files &&
        files.map((file) => (
          <File
            key={file.key}
            id={file.key}
            src={file.url}
            isImage={file.isImage}
          />
        ))}
    </div>
  );
}
