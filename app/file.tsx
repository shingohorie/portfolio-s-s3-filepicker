import { useState } from "react";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { FcImageFile, FcClapperboard } from "react-icons/fc";
import { RiCheckboxMultipleBlankLine } from "react-icons/ri";

import client from "./aws";

type FileProps = {
  key: string;
  id: string;
  src: string;
  isImage: boolean;
};

// 環境変数の読み込み
const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;

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

export default function File({ id, src, isImage }: FileProps) {
  const [isHover, setIsHover] = useState(false);
  return (
    <div className="relative table mb-2">
      <p>
        {isImage ? (
          <FcImageFile className="inline-block mr-2 mb-1" />
        ) : (
          <FcClapperboard className="inline-block mr-2 mb-1" />
        )}

        <span className="cursor-pointer hover:text-blue-500">{id}</span>

        <button
          onClick={() => handleOpenPresigned(id)}
          className="ml-2 text-[10px] bg-gray-200 p-1 cursor-pointer hover:text-blue-500"
        >
          view <RiCheckboxMultipleBlankLine className="inline-block mb-1" />
        </button>
      </p>
    </div>
  );
}
