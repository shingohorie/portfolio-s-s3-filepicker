'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
// microCMS拡張フィールドAPIのインポート
import { setupFieldExtension } from 'microcms-field-extension-api';

import File from './File';
import SelectedFileViewer from './SelectedFileViewer';

// JotaiのフックとAtomのインポート
import { useAtom, useSetAtom } from 'jotai';
import {
  selectedFileAtom,
  searchWordAtom,
  frameIDAtom,
  isErrorAtom,
} from './atom';

// S3から取得した情報の型定義
import type { _Object } from '@aws-sdk/client-s3';

// 環境変数の読み込み
const REGION = process.env.NEXT_PUBLIC_AWS_REGION;
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const MICROCMS_SERVICE_ID = process.env.NEXT_PUBLIC_MICROCMS_SERVICE_ID;

// 公開URLのベース
const PUBLIC_URL_BASE = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;

// microCMSのオリジンURL
const ORIGIN = `https://${MICROCMS_SERVICE_ID}.microcms.io`;

type S3File = {
  key: string;
  fullURL: string;
  isImage: boolean;
  lastModified: Date;
};

export default function FileBrowser() {
  const searchParams = useSearchParams();
  const [selectedFile, setSelectedFile] = useAtom(selectedFileAtom);
  const [searchWord, setSearchWord] = useAtom(searchWordAtom);
  const setFrameID = useSetAtom(frameIDAtom);
  const setIsError = useSetAtom(isErrorAtom);
  const [files, setFiles] = useState<S3File[]>([]);

  // 💡 認証エラー状態を管理するstateを追加
  const [authError, setAuthError] = useState(false);

  const authToken = searchParams.get('auth');

  // S3から一覧を取得する処理
  const fetchFiles = async () => {
    try {
      // 取得したトークンを、裏窓APIにパスワードとして渡す
      const res = await fetch(`/api/s3-files?auth=${authToken || ''}`);

      if (res.status === 401) {
        setAuthError(true);
        return;
      }

      if (!res.ok) throw new Error('取得エラー');

      const data = await res.json();

      // データの整形
      const fileList: S3File[] = (data?.Contents || [])
        .filter((item: _Object) => item.Key && !item.Key.endsWith('/')) // フォルダを除外
        .map((item: _Object) => ({
          key: item.Key!,
          fullURL: PUBLIC_URL_BASE + item.Key!,
          isImage: /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.Key!),
          lastModified: item.LastModified ?? new Date(0),
        }))
        // 新しい順に並び替え
        .sort((a: S3File, b: S3File) => {
          return a.key.localeCompare(b.key);
        });

      setFiles(fileList);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFiles();

    setupFieldExtension({
      origin: ORIGIN,
      width: '100%',
      height: 250,
      onDefaultData: (e) => {
        setFrameID(e.data.id);
        setSelectedFile(e.data.message?.data.id || '');
      },
      onPostSuccess: (e) => setIsError(false),
      onPostError: (e) => setIsError(true),
    });
  }, []);

  const filteredFiles = useMemo(() => {
    if (searchWord === '' || !searchWord) return files;
    return files.filter(
      (file) => file.key.split('/')[0].indexOf(searchWord) !== -1,
    );
  }, [files, searchWord]);

  // 認証エラー時はここで画面の描画を止める
  if (authError) {
    return (
      <div className="p-4 text-red-500">
        認証に失敗しました。URLのパラメータ（?auth=...）が正しいか確認してください。
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 left-0 z-10 mb-4 p-4 bg-white -mt-4 -ml-4 -mr-4">
        {selectedFile && <SelectedFileViewer />}
        <input
          className="block border-gray-300 border rounded px-2 py-1 w-[300px]"
          type="text"
          defaultValue={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          placeholder="ファイル名で検索..."
        />
      </div>
      <details open={!selectedFile}>
        <summary className="cursor-pointer mb-2">
          ファイル一覧を表示／非表示
        </summary>
        {filteredFiles &&
          filteredFiles.map((file) => (
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
