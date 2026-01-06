import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sendFieldExtensionMessage } from "microcms-field-extension-api";

import { FcImageFile, FcClapperboard } from "react-icons/fc";
import { IoMdEye } from "react-icons/io";

import client from "./aws";

// S3から取得した情報の型定義
type FileProps = {
  id: string;
  fullURL: string;
  frameID: string;
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

// microCMSのオリジンURL
const ORIGIN = `https://${MICROCMS_SERVICE_ID}.microcms.io`;

export default function File({
  id,
  fullURL,
  frameID,
  isImage,
  isSelected,
  onSelect,
}: FileProps) {
  const domId = `file-item-${id}`;

  // 署名付きURLを発行して開く処理
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
    sendFieldExtensionMessage(
      {
        id: frameID,
        message: {
          data: {
            url: fullURL,
            id: id,
          },
        },
      },
      ORIGIN
    );
  };

  return (
    <div className="relative table mb-2" id={domId}>
      <p className="flex items-center gap-2">
        {isImage ? <FcImageFile /> : <FcClapperboard />}

        <span
          className={`inline-flex items-center gap-2 font-mono ${
            isSelected ? "" : "opacity-50 hover:opacity-100"
          }`}
          onClick={() => handleSelect(id, fullURL)}
        >
          <span
            className={`${
              isSelected ? "pointer-events-none" : "cursor-pointer"
            }`}
          >
            {id}
          </span>

          <button
            className="cursor-pointer hover:text-blue-500"
            onClick={() => handleOpenPresigned(id)}
          >
            <IoMdEye />
          </button>
        </span>
      </p>
    </div>
  );
}
