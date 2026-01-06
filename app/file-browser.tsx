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
        // 1. 拡張子を取り出して小文字にする（ない場合は空文字）
        // const extA = a.key.split(".").pop()?.toLowerCase() || "";
        // const extB = b.key.split(".").pop()?.toLowerCase() || "";

        // // 2. 第一ソート：拡張子で比較
        // const extComparison = extA.localeCompare(extB);

        // // 拡張子が違うなら、その結果を返す（これで順序が決まる）
        // if (extComparison !== 0) {
        //   return extComparison;
        // }

        // // 3. 第二ソート：拡張子が同じなら、ファイル名（キー）全体で比較
        return a.key.localeCompare(b.key);
      });

    setFiles(fileList);
  };

  useEffect(() => {
    // コンポーネントのマウント時にS3からファイル一覧を取得
    fetchFiles();

    // microCMSからのメッセージを受信
    /**
     * Setup iframe field.
     */
    setupFieldExtension({
      /**
       * This iframe will only receive messages from this origin.
       * If you specify "*", you can receive messages from all origins. (Not recommend)
       * required.
       */
      origin: ORIGIN,

      /**
       * Height of iframe field in admin page.
       * string or number. optional.
       */
      height: 500,

      /**
       * Width of iframe field in admin page.
       * string or number. optional.
       */
      width: "100%",

      /**
       * Callback when you get the initial value.
       */
      onDefaultData: (message) => {
        console.log("初期データ:", message);
        setFrameID(message.data.id); // iframe識別子を保存
        setSelectedFile(message.data.message?.data.id || ""); // 前回セットした値を保存
      },

      /**
       * Callback when you succeed to post value.
       */
      onPostSuccess: (message) => console.log("成功時レスポンス:", message),

      /**
       * Callback when you failed to post value.
       */
      onPostError: (message) => console.log("失敗時レスポンス:", message),
    });
    // window.addEventListener("message", (e) => {
    //   if (!e.isTrusted) {
    //     return;
    //   }
    //   if (e.data.action === "MICROCMS_GET_DEFAULT_DATA") {
    //     console.log("初期データ:", e.data);
    //     setFrameID(e.data.id); // iframe識別子を保存
    //     setSelectedFile(e.data.message.data.id); // 前回セットした値を保存
    //   }
    //   if (e.data.action === "MICROCMS_POST_DATA_SUCCESS") {
    //     console.log("レスポンス:", e.data);
    //   }
    // });
  }, []);

  return (
    <div>
      {selectedFile && <SelectedFileViewer selectedFile={selectedFile} />}
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
    </div>
  );
}
