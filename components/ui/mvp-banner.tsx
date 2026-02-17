"use client";

import { AlertCircle, Mail, X, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MVPBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleEmailClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const email = "lenisdomingueze@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      // Fallback: redirigir al formulario de contacto
      window.location.href = "/contacto";
    }
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-b border-amber-200/50 shadow-sm relative overflow-hidden pt-14 sm:pt-0">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)`
        }} />
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 relative z-10">
        <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Icon with animated pulse */}
            <div className="relative flex-shrink-0 mt-0.5 sm:mt-0">
              <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20" />
              <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 rounded-full p-1.5 sm:p-2 shadow-md">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <p className="text-xs sm:text-sm font-semibold text-amber-900 leading-tight">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600" />
                    Versión MVP en Prueba
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-amber-800 leading-tight hidden sm:inline">
                  Esta plataforma está en periodo de prueba.
                </p>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 leading-tight mt-0.5 sm:mt-1">
                Si encuentras algún problema o tienes sugerencias, repórtalo a{" "}
                <button
                  onClick={handleEmailClick}
                  className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-700 underline decoration-2 underline-offset-2 transition-colors hover:bg-amber-100/50 px-1 py-0.5 rounded cursor-pointer"
                  type="button"
                  title={emailCopied ? "Email copiado" : "Copiar email"}
                >
                  {emailCopied ? (
                    <>
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="break-all sm:break-normal">Email copiado</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="break-all sm:break-normal">lenisdomingueze@gmail.com</span>
                    </>
                  )}
                </button>
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-amber-100/80 rounded-full transition-all hover:scale-110 active:scale-95"
            aria-label="Cerrar aviso"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700" />
          </Button>
        </div>
      </div>
    </div>
  );
}

