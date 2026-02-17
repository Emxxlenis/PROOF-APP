"use client";

import { ReactNode } from "react";
import Image from "next/image";

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  fullScreen?: boolean;
  variant?: "empty" | "error";
}

export function EmptyState({ 
  title, 
  message, 
  action, 
  fullScreen = true,
  variant = "empty"
}: EmptyStateProps) {
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const lolaConstructUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-construct_wojore`;

  const defaultTitle = variant === "error" 
    ? "Algo salió mal" 
    : "Estamos construyendo";
  
  const defaultMessage = variant === "error"
    ? "Estamos trabajando para solucionarlo. Muy pronto estaremos listos."
    : "Muy pronto estaremos listos";

  const content = (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4">
      <div className="relative mb-6 sm:mb-8">
        <div className="absolute -inset-4 bg-blue-200/20 rounded-full blur-2xl animate-pulse" />
        <Image
          src={lolaConstructUrl}
          alt="Lola construyendo"
          width={192}
          height={192}
          className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
          unoptimized
        />
      </div>
      <div className="text-center space-y-3 sm:space-y-4 max-w-md">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
          {title || defaultTitle}
        </h3>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
          {message || defaultMessage}
        </p>
        {action && (
          <div className="pt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 rounded-2xl border border-blue-100 shadow-sm">
      {content}
    </div>
  );
}







