import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { FcImageFile, FcClapperboard } from "react-icons/fc";
import { RiCheckboxMultipleBlankLine } from "react-icons/ri";
import { IoMdEye } from "react-icons/io";

import client from "./aws";

type FileProps = {
  id: string;
  fullURL: string;
  isImage: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

// 環境変数の読み込み
const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;
const MICROCMS_SERVICE_ID = process.env.NEXT_PUBLIC_MICROCMS_SERVICE_ID;

const ORIGIN = `https://${MICROCMS_SERVICE_ID}.microcms.io`;

export default function File({
  id,
  fullURL,
  isImage,
  isSelected,
  onSelect,
}: FileProps) {
  const [frameID, setFrameID] = useState("");

  // viewボタンを押下したら署名付きURLを発行して開く
  const handleOpenPresigned = async (key: string) => {
    if (
      !REGION ||
      !BUCKET_NAME ||
      !ACCESS_KEY_ID ||
      !SECRET_ACCESS_KEY ||
      !client
    ) {
      return;
    }

    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: key,
    });

    // 署名付きURLを発行して開く（有効期限 60秒）
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 60 });

    window.open(signedUrl, "_blank");
  };

  // ファイルを選択したらmicroCMS側にポストメッセージを送信
  const handleSelect = (id: string, fullURL: string) => {
    // FileBrowser側の状態を更新
    if (id && onSelect) {
      onSelect(id);
    }

    // microCMS側にもポストメッセージを送信
    window.parent.postMessage(
      {
        id: frameID, // iframe識別子
        action: "MICROCMS_POST_DATA",
        message: {
          id: frameID,
          data: {
            id: fullURL,
          },
        },
      },
      ORIGIN
    );
  };

  useEffect(() => {
    // microCMSからのメッセージを受信
    window.addEventListener("message", (e) => {
      if (!e.isTrusted) {
        return;
      }
      if (e.data.action === "MICROCMS_GET_DEFAULT_DATA") {
        console.log("初期データ:", e.data);
        setFrameID(e.data.id); // iframe識別子を保存
      }
      if (e.data.action === "MICROCMS_POST_DATA_SUCCESS") {
        console.log("レスポンス:", e.data);
      }
    });
  }, []);

  return (
    <div className="relative table mb-2">
      <p className="flex items-center gap-2">
        {isImage ? <FcImageFile /> : <FcClapperboard />}

        <span
          className={
            isSelected
              ? "pointer-events-none opacity-50"
              : `cursor-pointer hover:text-blue-500`
          }
          onClick={() => handleSelect(id, fullURL)}
        >
          {id}
        </span>

        <button
          onClick={() => handleOpenPresigned(id)}
          className="cursor-pointer hover:text-blue-500"
        >
          <IoMdEye />
        </button>
      </p>
    </div>
  );
}
