import { useState } from "react";
import clsx from "clsx";

import { FcImageFile, FcClapperboard } from "react-icons/fc";

type AssetProps = {
  key: string;
  id: string;
  src: string;
  isImage: boolean;
};

export default function File({ id, src, isImage }: AssetProps) {
  const [isHover, setIsHover] = useState(false);
  return (
    <div className="relative table mb-2">
      {/* ファイルパスとアイコン */}
      <p
        onMouseOver={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="cursor-pointer hover:text-blue-500"
      >
        {isImage ? (
          <FcImageFile className="inline-block mr-2 mb-1" />
        ) : (
          <FcClapperboard className="inline-block mr-2 mb-1" />
        )}

        {id}
      </p>
      {/* プレビュー */}
      <figure
        className={clsx(
          isHover ? "" : "hidden",
          "block absolute top-0 left-[100%] w-[320px] ml-4 z-10 border border-gray-300 bg-white p-2 shadow-lg"
        )}
        onMouseOver={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        {isImage ? (
          <img src={src} alt={id} className="block w-[100%] h-auto" />
        ) : (
          <video preload="metadata" className="block w-[100%] h-auto">
            <source src={src} type="video/mp4" />
          </video>
        )}
      </figure>
    </div>
  );
}
