import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.PRIVATE_S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.PRIVATE_S3_SECRET_KEY;
const SERVER_AUTH_TOKEN = process.env.PRIVATE_AUTH_TOKEN;

export async function GET(request: Request) {
  // リクエストされたURLから、クエリパラメータ(?auth=...)を取り出す
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const clientToken = searchParams.get('auth');

  // 認証トークンを比較して、正しくない場合は401エラーを返す
  if (SERVER_AUTH_TOKEN && clientToken !== SERVER_AUTH_TOKEN) {
    return NextResponse.json(
      { error: '認証エラー：不正なアクセスです' },
      { status: 401 },
    );
  }

  if (!key || !REGION || !BUCKET_NAME || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { error: '必須パラメータが不足しています' },
      { status: 400 },
    );
  }

  const client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    // サーバーサイドで署名付きURLを発行（有効期限60秒）
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 60 });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    return NextResponse.json(
      { error: '署名付きURLの取得に失敗しました' },
      { status: 500 },
    );
  }
}
