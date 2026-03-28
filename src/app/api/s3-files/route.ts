// src/app/api/s3-files/route.ts
import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

export async function GET(request: Request) {
  // リクエストされたURLから、クエリパラメータ(?auth=...)を取り出す
  const { searchParams } = new URL(request.url);
  const clientToken = searchParams.get('auth');

  // 認証トークンを比較して、正しくない場合は401エラーを返す
  if (AUTH_TOKEN && clientToken !== AUTH_TOKEN) {
    return NextResponse.json(
      { error: '認証エラー：不正なアクセスです' },
      { status: 401 },
    );
  }

  if (!REGION || !BUCKET_NAME || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    return NextResponse.json(
      { error: 'AWS設定が不足しています' },
      { status: 500 },
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
    // ListObjectsV2コマンドを作成
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1000, // 取得数（必要に応じて増やす）
    });

    // 送信してデータを取得
    const data = await client.send(command);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'S3からの取得に失敗しました' },
      { status: 500 },
    );
  }
}
