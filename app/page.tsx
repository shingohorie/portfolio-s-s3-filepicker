"use client";

import { useState, useEffect } from "react";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

import Link from "next/link";
import Image from "next/image";

// 環境変数の読み込み
const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;

// 公開URLのベース
const PUBLIC_URL_BASE = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;

type S3File = {
  key: string;
  url: string;
  isImage: boolean;
  lastModified: Date;
};

export default function Home() {
  const [files, setFiles] = useState<S3File[]>([]);

  // S3から一覧を取得する処理
  useEffect(() => {
    const fetchFiles = async () => {
      if (!REGION || !BUCKET_NAME || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
        return;
      }

      // S3クライアントの初期化
      const client = new S3Client({
        region: REGION,
        credentials: {
          accessKeyId: ACCESS_KEY_ID,
          secretAccessKey: SECRET_ACCESS_KEY,
        },
      });

      // try {
      // ListObjectsV2コマンドを作成
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 100, // 取得数（必要に応じて増やす）
      });

      // 送信
      const data = await client.send(command);

      console.log(data.Contents);

      //   // データの整形
      const fileList: S3File[] = (data.Contents || [])
        .filter((item) => item.Key && !item.Key.endsWith("/")) // フォルダを除外
        .map((item) => ({
          key: item.Key!,
          url: PUBLIC_URL_BASE + item.Key!,
          isImage: /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.Key!),
          lastModified: item.LastModified ?? new Date(0),
        }))
        // 新しい順に並び替え
        .sort((a, b) => b.key.localeCompare(a.key));

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
    <ul>
      {files &&
        files.map((file) => (
          <li key={file.key}>
            <span>
              {file.isImage ? (
                <Image
                  src={file.url}
                  alt={file.key}
                  width={200}
                  height={200}
                  objectFit="cover"
                  unoptimized
                />
              ) : (
                <video width="320" height="240" controls>
                  <source src={file.url} type="video/mp4" />
                </video>
              )}
            </span>
          </li>
        ))}
    </ul>
  );
}
