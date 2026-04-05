"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type ExerciseImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  fallback: React.ReactNode;
};

function shouldBypassNextOptimizer(src: string) {
  try {
    const parsed = new URL(src);
    return parsed.hostname.endsWith(".ufs.sh") || parsed.hostname === "utfs.io";
  } catch {
    return false;
  }
}

export default function ExerciseImage({
  src,
  alt,
  fallback,
  ...props
}: ExerciseImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const normalizedSrc = src ?? null;

  if (!normalizedSrc || failedSrc === normalizedSrc) {
    return <>{fallback}</>;
  }

  const shouldUseUnoptimized = shouldBypassNextOptimizer(normalizedSrc);

  return (
    <Image
      {...props}
      src={normalizedSrc}
      alt={alt}
      unoptimized={shouldUseUnoptimized}
      onError={() => {
        setFailedSrc(normalizedSrc);
      }}
    />
  );
}
