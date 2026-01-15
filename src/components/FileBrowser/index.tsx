"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
// AWS SDKのインポート
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
// microCMS拡張フィールドAPIのインポート
import { setupFieldExtension } from "microcms-field-extension-api";

import client from "@/lib/aws";
import File from "./File";
import SelectedFileViewer from "./SelectedFileViewer";

// JotaiのフックとAtomののインポート
import { useAtom, useSetAtom } from "jotai";
import {
  selectedFileAtom,
  searchWordAtom,
  frameIDAtom,
  isErrorAtom,
} from "./atom";

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

  // Jotaiの状態管理
  const [selectedFile, setSelectedFile] = useAtom(selectedFileAtom);
  const [searchWord, setSearchWord] = useAtom(searchWordAtom);
  const setFrameID = useSetAtom(frameIDAtom);
  const setIsError = useSetAtom(isErrorAtom);

  const [files, setFiles] = useState<S3File[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // パラメータに認証トークンがなければ処理を中断
  const authToken = searchParams.get("auth");

  if (AUTH_TOKEN && authToken !== AUTH_TOKEN) {
    console.log("認証に失敗しました。URLにパラメータを追加してください。");
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
        setFrameID(e.data.id); // iframe識別子を保存（postMessage送信時に必要なためここで取得しておく）
        setSelectedFile(e.data.message?.data.id || ""); // 前回セットした値を保存
      },
      onPostSuccess: (e) => {
        setIsError(false);
        console.log("成功時レスポンス:", e);
      },
      onPostError: (e) => {
        setIsError(true);
        console.log("失敗時レスポンス:", e);
      },
    });
  }, []);

  return (
    <>
      {selectedFile && <SelectedFileViewer />}

      <div className="mb-4">
        <input
          className="block border-gray-300 border rounded px-2 py-1 w-[300px]"
          type="text"
          defaultValue={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          placeholder="ファイル名で検索..."
          ref={searchInputRef}
        />
      </div>

      <details open={!selectedFile}>
        <summary className="cursor-pointer mb-2">
          ファイル一覧を表示／非表示
        </summary>

        {files &&
          files.map((file) => (
            <File
              key={file.key}
              id={file.key}
              fullURL={file.fullURL}
              isImage={file.isImage}
              isSelected={selectedFile === file.key}
            />
          ))}
      </details>
    </>
  );
}
