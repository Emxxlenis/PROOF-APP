"use client";

import Image from "next/image";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = "Cargando...", fullScreen = true }: LoadingStateProps) {
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const lolaCargaUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-carga_hugsw5`;

  const content = (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
      <div className="relative mb-6 sm:mb-8">
        <div className="absolute -inset-4 bg-blue-200/20 rounded-full blur-2xl animate-pulse" />
        <Image
          src={lolaCargaUrl}
          alt="Lola pensando"
          width={192}
          height={192}
          className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain animate-pulse"
          unoptimized
        />
      </div>
      <div className="text-center space-y-2">
        <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 animate-pulse">
          {message}
        </p>
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {content}
    </div>
  );
}







