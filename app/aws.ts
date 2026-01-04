import { S3Client } from "@aws-sdk/client-s3";

// 環境変数の読み込み
const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;

let client: S3Client | null = null;

if (REGION && BUCKET_NAME && ACCESS_KEY_ID && SECRET_ACCESS_KEY) {
  // S3クライアントの初期化
  client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
}

export default client;
