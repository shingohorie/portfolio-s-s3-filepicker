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

    sendFieldExtensionMessage(
      {
        id: frameID,

        message: {
          /**
           * Any object that can be serialized to JSON.
           * This value returned by contents API.
           * required.
           */
          data: {
            url: fullURL,
            id: id,
          },
        },
      },

      /**
       * Origin passed to `iframe.set`.
       */
      ORIGIN
    );

    // microCMS側にもポストメッセージを送信
    // window.parent.postMessage(
    //   {
    //     id: frameID, // iframe識別子
    //     action: "MICROCMS_POST_DATA",
    //     message: {
    //       id: frameID,
    //       data: {
    //         url: fullURL,
    //         id: id,
    //       },
    //     },
    //   },
    //   ORIGIN
    // );
  };

  return (
    <div className="relative table mb-2">
      <p className="flex items-center gap-2">
        {isImage ? <FcImageFile /> : <FcClapperboard />}

        <span
          className={`font-mono ${
            isSelected
              ? "pointer-events-none opacity-50"
              : "cursor-pointer hover:text-blue-500"
          }`}
          onClick={() => handleSelect(id, fullURL)}
        >
          {id}
        </span>

        <button
          className="cursor-pointer hover:text-blue-500"
          onClick={() => handleOpenPresigned(id)}
        >
          <IoMdEye />
        </button>
      </p>
    </div>
  );
}
