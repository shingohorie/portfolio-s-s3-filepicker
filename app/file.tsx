import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  setupFieldExtension,
  sendFieldExtensionMessage,
} from "microcms-field-extension-api";

import { FcImageFile, FcClapperboard } from "react-icons/fc";
import { RiCheckboxMultipleBlankLine } from "react-icons/ri";

import client from "./aws";

type FileProps = {
  id: string;
  src: string;
  isImage: boolean;
};

// 環境変数の読み込み
const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;

export default function File({ id, src, isImage }: FileProps) {
  const searchParams = useSearchParams();
  // ★重要: URLパラメータの 'id' を取得する
  // カスタムフィールド内では、microCMSがここ毎回違うIDを自動で入れてくれます
  const fieldId = searchParams.get("id");
  const origin =
    searchParams.get("origin") || "https://portfolio-s.microcms.io";

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

  const handleSelect = (id: string, src: string, isImage: boolean) => {
    // if (!fieldId) {
    //   alert("フィールドIDがありません。microCMS管理画面から開いてください。");
    //   return;
    // }
    // // 2. 送信処理（関数名修正）
    // sendFieldExtensionMessage(
    //   {
    //     id: fieldId,
    //     message: {
    //       id: id,
    //       title: id,
    //       imageUrl: isImage ? src : undefined,
    //       data: src, // APIで返却される値
    //     },
    //   },
    //   origin // 第2引数にもオリジンが必要です
    // );
    // // ユーザーへのフィードバック（任意）
    // alert(`microCMSにセットしました: \n${id}`);
  };

  useEffect(() => {
    // 1. 初期化処理（関数名修正）
    // setupFieldExtension({
    //   origin: origin, // メッセージを受け取る親元を指定
    //   width: "100%",
    //   height: 400,
    //   onDefaultData: (data) => {
    //     console.log("初期データ:", data);
    //   },
    // });
    window.addEventListener("message", (e) => {
      if (
        e.isTrusted === true &&
        e.data.action === "MICROCMS_GET_DEFAULT_DATA"
      ) {
        console.log("初期データ:", e.data);
        // idやmessageを保存する
        // e.data.id: 識別子
        // e.data.message: 設定済みの値
        // e.data.user.email: ログイン中のユーザーメールアドレス情報
        // e.data.context.endpoint: APIのエンドポイント名
      }
    });
  }, [origin]);

  // 1. microCMS SDKの初期化
  return (
    <div className="relative table mb-2">
      <p>
        {isImage ? (
          <FcImageFile className="inline-block mr-2 mb-1" />
        ) : (
          <FcClapperboard className="inline-block mr-2 mb-1" />
        )}

        <span
          className="cursor-pointer hover:text-blue-500"
          onClick={() => handleSelect(id, src, isImage)}
        >
          {id}
        </span>

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
