"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, ArrowRight, ArrowLeft, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // Selector CSS del elemento a destacar
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: () => void; // Acción a ejecutar cuando se muestra este paso
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  storageKey: string; // Para guardar si el usuario ya completó el tutorial
  title?: string;
  description?: string;
}

export function TutorialOverlay({
  steps,
  onComplete,
  storageKey,
  title = "Tutorial",
  description = "Aprende a usar esta sección paso a paso",
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [cardPosition, setCardPosition] = useState<React.CSSProperties>({});
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetBorderRadius, setTargetBorderRadius] = useState<string>("0.75rem");
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Verificar si el usuario ya completó el tutorial
    const completed = localStorage.getItem(`tutorial_${storageKey}_completed`);
    if (completed === "true") {
      setHasCompleted(true);
      return;
    }
    setIsOpen(true);
  }, [storageKey]);

  // Función auxiliar para detectar superposición entre dos rectángulos
  const checkOverlap = (rect1: DOMRect, rect2: DOMRect): boolean => {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  };

  // Función para calcular posición mejorada que evita superponerse con el elemento objetivo
  const calculatePosition = useCallback(() => {
    const step = steps[currentStep];
    const targetElement = step.target ? document.querySelector(step.target) : null;
    const cardElement = cardRef.current;

    if (!cardElement) return {};

    const cardRect = cardElement.getBoundingClientRect();
    const cardWidth = Math.min(cardRect.width || 420, window.innerWidth - 40);
    const cardHeight = cardRect.height || 300;
    const padding = 24; // Padding desde los bordes
    const gap = 20; // Espacio entre elemento y tarjeta
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Si no hay elemento objetivo, centrar
    if (!targetElement) {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "min(90vw, 500px)",
        maxHeight: "min(90vh, 700px)",
        zIndex: 60,
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const position = step.position || "bottom";

    let style: React.CSSProperties = {
      position: "fixed",
      maxWidth: "min(90vw, 450px)",
      maxHeight: "min(90vh, 650px)",
      zIndex: 60,
    };

    // Función para verificar y ajustar posición para evitar superposición
    const adjustPositionToAvoidOverlap = (
      initialTop: number,
      initialLeft: number,
      initialTransform: string
    ): { top: number; left: number; transform: string } => {
      // Calcular el rectángulo real de la tarjeta considerando transformaciones
      const getCardRect = (top: number, left: number, transform: string): DOMRect => {
        let cardLeft = left;
        let cardTop = top;
        let cardRight = left + cardWidth;
        let cardBottom = top + cardHeight;

        if (transform.includes("translateX(-50%)")) {
          cardLeft = left - cardWidth / 2;
          cardRight = left + cardWidth / 2;
        }
        if (transform.includes("translateY(-50%)")) {
          cardTop = top - cardHeight / 2;
          cardBottom = top + cardHeight / 2;
        }

        return {
          top: cardTop,
          left: cardLeft,
          right: cardRight,
          bottom: cardBottom,
          width: cardRight - cardLeft,
          height: cardBottom - cardTop,
        } as DOMRect;
      };

      // Rectángulo del elemento objetivo con padding para el borde
      const targetRect = {
        top: rect.top - 6,
        left: rect.left - 6,
        right: rect.right + 6,
        bottom: rect.bottom + 6,
        width: rect.width + 12,
        height: rect.height + 12,
      } as DOMRect;

      // Verificar si la posición inicial se superpone
      const initialCardRect = getCardRect(initialTop, initialLeft, initialTransform);
      const initialOverlaps = checkOverlap(targetRect, initialCardRect);

      if (!initialOverlaps) {
        // No hay superposición, usar posición inicial
        return { top: initialTop, left: initialLeft, transform: initialTransform };
      }

      // Hay superposición, probar posiciones alternativas
      const alternativePositions = [
        // Arriba del elemento
        {
          top: rect.top - cardHeight - gap,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%)",
        },
        // Abajo del elemento
        {
          top: rect.bottom + gap,
          left: rect.left + rect.width / 2,
          transform: "translateX(-50%)",
        },
        // Izquierda del elemento
        {
          top: rect.top + rect.height / 2,
          left: rect.left - cardWidth - gap,
          transform: "translateY(-50%)",
        },
        // Derecha del elemento
        {
          top: rect.top + rect.height / 2,
          left: rect.right + gap,
          transform: "translateY(-50%)",
        },
        // Arriba izquierda del viewport
        {
          top: padding,
          left: padding,
          transform: "none",
        },
        // Arriba derecha del viewport
        {
          top: padding,
          left: viewportWidth - cardWidth - padding,
          transform: "none",
        },
        // Abajo izquierda del viewport
        {
          top: viewportHeight - cardHeight - padding,
          left: padding,
          transform: "none",
        },
        // Abajo derecha del viewport
        {
          top: viewportHeight - cardHeight - padding,
          left: viewportWidth - cardWidth - padding,
          transform: "none",
        },
      ];

      // Probar cada posición alternativa
      for (const pos of alternativePositions) {
        // Verificar que esté dentro del viewport
        const clampedTop = Math.max(
          padding,
          Math.min(pos.top, viewportHeight - cardHeight - padding)
        );
        const clampedLeft = Math.max(
          padding,
          Math.min(pos.left, viewportWidth - cardWidth - padding)
        );

        const testCardRect = getCardRect(clampedTop, clampedLeft, pos.transform);
        const testOverlaps = checkOverlap(targetRect, testCardRect);

        if (!testOverlaps) {
          return {
            top: clampedTop,
            left: clampedLeft,
            transform: pos.transform,
          };
        }
      }

      // Si todas las posiciones se superponen, usar la posición inicial pero ajustada al lado opuesto
      const fallbackTop = rect.bottom + gap > viewportHeight / 2
        ? Math.max(padding, rect.top - cardHeight - gap)
        : Math.min(viewportHeight - cardHeight - padding, rect.bottom + gap);
      const fallbackLeft = rect.right + gap > viewportWidth / 2
        ? Math.max(padding, rect.left - cardWidth - gap)
        : Math.min(viewportWidth - cardWidth - padding, rect.right + gap);

      return {
        top: fallbackTop,
        left: fallbackLeft,
        transform: "none",
      };
    };

    // Calcular posición óptima
    switch (position) {
      case "top": {
        let top = rect.top - cardHeight - gap;
        let left = rect.left + rect.width / 2;
        
        if (top < padding) {
          top = rect.bottom + gap;
        }
        
        const halfCardWidth = cardWidth / 2;
        if (left - halfCardWidth < padding) {
          left = padding + halfCardWidth;
        } else if (left + halfCardWidth > viewportWidth - padding) {
          left = viewportWidth - padding - halfCardWidth;
        }
        
        const adjusted = adjustPositionToAvoidOverlap(
          Math.max(padding, Math.min(top, viewportHeight - cardHeight - padding)),
          left,
          "translateX(-50%)"
        );
        
        style = {
          ...style,
          top: `${adjusted.top}px`,
          left: `${adjusted.left}px`,
          transform: adjusted.transform,
        };
        break;
      }
      case "bottom": {
        let top = rect.bottom + gap;
        let left = rect.left + rect.width / 2;
        
        if (top + cardHeight > viewportHeight - padding) {
          top = rect.top - cardHeight - gap;
          if (top < padding) {
            top = Math.max(padding, (viewportHeight - cardHeight) / 2);
          }
        }
        
        const halfCardWidth = cardWidth / 2;
        if (left - halfCardWidth < padding) {
          left = padding + halfCardWidth;
        } else if (left + halfCardWidth > viewportWidth - padding) {
          left = viewportWidth - padding - halfCardWidth;
        }
        
        const adjusted = adjustPositionToAvoidOverlap(
          Math.max(padding, Math.min(top, viewportHeight - cardHeight - padding)),
          left,
          "translateX(-50%)"
        );
        
        style = {
          ...style,
          top: `${adjusted.top}px`,
          left: `${adjusted.left}px`,
          transform: adjusted.transform,
        };
        break;
      }
      case "left": {
        let top = rect.top + rect.height / 2;
        let left = rect.left - cardWidth - gap;
        
        if (left < padding) {
          left = rect.right + gap;
        }
        
        const halfCardHeight = cardHeight / 2;
        if (top - halfCardHeight < padding) {
          top = padding + halfCardHeight;
        } else if (top + halfCardHeight > viewportHeight - padding) {
          top = viewportHeight - padding - halfCardHeight;
        }
        
        const adjusted = adjustPositionToAvoidOverlap(
          Math.max(padding + halfCardHeight, Math.min(top, viewportHeight - padding - halfCardHeight)),
          Math.max(padding, Math.min(left, viewportWidth - cardWidth - padding)),
          "translateY(-50%)"
        );
        
        style = {
          ...style,
          top: `${adjusted.top}px`,
          left: `${adjusted.left}px`,
          transform: adjusted.transform,
        };
        break;
      }
      case "right": {
        let top = rect.top + rect.height / 2;
        let left = rect.right + gap;
        
        if (left + cardWidth > viewportWidth - padding) {
          left = rect.left - cardWidth - gap;
        }
        
        const halfCardHeight = cardHeight / 2;
        if (top - halfCardHeight < padding) {
          top = padding + halfCardHeight;
        } else if (top + halfCardHeight > viewportHeight - padding) {
          top = viewportHeight - padding - halfCardHeight;
        }
        
        const adjusted = adjustPositionToAvoidOverlap(
          Math.max(padding + halfCardHeight, Math.min(top, viewportHeight - padding - halfCardHeight)),
          Math.max(padding, Math.min(left, viewportWidth - cardWidth - padding)),
          "translateY(-50%)"
        );
        
        style = {
          ...style,
          top: `${adjusted.top}px`,
          left: `${adjusted.left}px`,
          transform: adjusted.transform,
        };
        break;
      }
      case "center":
      default:
        style = {
          ...style,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
        break;
    }

    return style;
  }, [currentStep, steps]);

  // Actualizar posición cuando cambia el paso, scroll o resize
  useEffect(() => {
    if (!isOpen) return;

    // Actualizar posición inmediatamente sin delay
    const updatePosition = () => {
      // Usar requestAnimationFrame para mejor rendimiento
      requestAnimationFrame(() => {
        const step = steps[currentStep];
        const targetElement = step?.target ? document.querySelector(step.target) : null;
        
        // Actualizar el rect del elemento objetivo para sincronización precisa
        if (targetElement) {
          // Usar getBoundingClientRect que devuelve las dimensiones exactas del elemento
          // incluyendo padding y border, pero sin margin
          const rect = targetElement.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(targetElement);
          
          // Obtener el border-radius del elemento para que el highlight coincida exactamente
          const borderRadius = computedStyle.borderRadius || "0.75rem";
          setTargetBorderRadius(borderRadius);
          
          // getBoundingClientRect devuelve las dimensiones del elemento incluyendo:
          // - padding
          // - border
          // Pero NO margin
          // Esto es exactamente lo que queremos para que el highlight coincida con el tamaño visual del elemento
          setTargetRect(rect);
        } else {
          setTargetRect(null);
          setTargetBorderRadius("0.75rem");
        }
        
        const newPosition = calculatePosition();
        setCardPosition(newPosition);
      });
    };

    const step = steps[currentStep];
    if (step?.target) {
      const element = document.querySelector(step.target);
      if (element) {
        // Función para actualizar el rect del elemento de manera precisa
        const updateElementRect = () => {
          requestAnimationFrame(() => {
            const elementRect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);
            const borderRadius = computedStyle.borderRadius || "0.75rem";
            
            setTargetRect(elementRect);
            setTargetBorderRadius(borderRadius);
          });
        };
        
        // Actualizar rect inmediatamente
        updateElementRect();
        
        // Scroll más rápido usando auto en lugar de smooth para mejor rendimiento
        // O usar smooth pero con timeout más corto
        const rect = element.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && rect.left >= 0 && 
                            rect.bottom <= window.innerHeight && 
                            rect.right <= window.innerWidth;
        
        if (!isInViewport) {
          // Solo hacer scroll si el elemento no está visible
          element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          // Reducir timeout de 600ms a 250ms para respuesta más rápida
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          scrollTimeoutRef.current = setTimeout(() => {
            updateElementRect();
            updatePosition();
          }, 250);
        } else {
          // Si ya está visible, actualizar posición inmediatamente
          updatePosition();
        }
        
        if (step.action) {
          step.action();
        }
      }
    } else {
      setTargetRect(null);
      setTargetBorderRadius("0.75rem");
      updatePosition();
    }

    const handleResize = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Actualizar rect cuando hay resize
      const step = steps[currentStep];
      if (step?.target) {
        const element = document.querySelector(step.target);
        if (element) {
          requestAnimationFrame(() => {
            const elementRect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);
            const borderRadius = computedStyle.borderRadius || "0.75rem";
            setTargetRect(elementRect);
            setTargetBorderRadius(borderRadius);
          });
        }
      }
      scrollTimeoutRef.current = setTimeout(updatePosition, 100);
    };

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Actualizar rect cuando hay scroll para mantener precisión
      const step = steps[currentStep];
      if (step?.target) {
        const element = document.querySelector(step.target);
        if (element) {
          requestAnimationFrame(() => {
            const elementRect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);
            const borderRadius = computedStyle.borderRadius || "0.75rem";
            setTargetRect(elementRect);
            setTargetBorderRadius(borderRadius);
          });
        }
      }
      scrollTimeoutRef.current = setTimeout(updatePosition, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentStep, isOpen, steps, calculatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Cambiar paso inmediatamente para transición más rápida
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Cambiar paso inmediatamente para transición más rápida
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tutorial_${storageKey}_completed`, "true");
    setIsOpen(false);
    setHasCompleted(true);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  // Actualizar el rect del elemento objetivo periódicamente para máxima precisión
  // Este hook debe estar antes de los returns condicionales
  useEffect(() => {
    if (!isOpen) return;
    
    const step = steps[currentStep];
    const targetElement = step?.target ? document.querySelector(step.target) : null;
    
    if (targetElement) {
      const updateRect = () => {
        requestAnimationFrame(() => {
          const elementRect = targetElement.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(targetElement);
          const borderRadius = computedStyle.borderRadius || "0.75rem";
          
          setTargetRect(elementRect);
          setTargetBorderRadius(borderRadius);
        });
      };
      
      // Actualizar inmediatamente
      updateRect();
      
      // Actualizar periódicamente mientras el tutorial está abierto para mantener precisión
      const interval = setInterval(updateRect, 100);
      
      return () => clearInterval(interval);
    } else {
      setTargetRect(null);
      setTargetBorderRadius("0.75rem");
    }
  }, [isOpen, currentStep, steps]);

  if (hasCompleted && !isOpen) {
    return null;
  }

  if (!isOpen) return null;

  const step = steps[currentStep];
  const targetElement = step.target ? document.querySelector(step.target) : null;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay oscuro con agujero para el elemento resaltado */}
      {targetRect ? (() => {
        const rect = targetRect;
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0 && 
                         rect.left < window.innerWidth && rect.right > 0;
        
        if (!isVisible) {
          // Si el elemento no es visible, mostrar overlay completo
          return (
            <div
              className="fixed inset-0 bg-black/45 z-[50] backdrop-blur-sm animate-in fade-in-0 duration-300"
              onClick={handleSkip}
              aria-hidden="true"
            />
          );
        }

        // Calcular el área del elemento exactamente sin padding - debe coincidir con el tamaño del botón
        const highlightTop = rect.top;
        const highlightLeft = rect.left;
        const highlightRight = rect.right;
        const highlightBottom = rect.bottom;

        // Crear overlay usando múltiples divs para formar un "agujero"
        // Asegurar que los valores estén dentro de los límites del viewport
        const safeTop = Math.max(0, highlightTop);
        const safeLeft = Math.max(0, highlightLeft);
        const safeRight = Math.min(window.innerWidth, highlightRight);
        const safeBottom = Math.min(window.innerHeight, highlightBottom);
        
        return (
          <div
            className="fixed inset-0 z-[50] pointer-events-auto"
            onClick={handleSkip}
            aria-hidden="true"
          >
            {/* Parte superior del overlay */}
            {safeTop > 0 && (
              <div
                className="fixed left-0 right-0 bg-black/45 backdrop-blur-sm"
                style={{
                  top: 0,
                  height: `${safeTop}px`,
                  transition: "height 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            )}
            
            {/* Parte izquierda del overlay */}
            {safeLeft > 0 && safeTop < safeBottom && (
              <div
                className="fixed bg-black/45 backdrop-blur-sm"
                style={{
                  top: `${safeTop}px`,
                  left: 0,
                  width: `${safeLeft}px`,
                  height: `${safeBottom - safeTop}px`,
                  transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1), top 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            )}
            
            {/* Parte derecha del overlay */}
            {safeRight < window.innerWidth && safeTop < safeBottom && (
              <div
                className="fixed bg-black/45 backdrop-blur-sm"
                style={{
                  top: `${safeTop}px`,
                  left: `${safeRight}px`,
                  width: `${window.innerWidth - safeRight}px`,
                  height: `${safeBottom - safeTop}px`,
                  transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1), top 0.25s cubic-bezier(0.4, 0, 0.2, 1), left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            )}
            
            {/* Parte inferior del overlay */}
            {safeBottom < window.innerHeight && (
              <div
                className="fixed left-0 right-0 bg-black/45 backdrop-blur-sm"
                style={{
                  top: `${safeBottom}px`,
                  height: `${window.innerHeight - safeBottom}px`,
                  transition: "height 0.25s cubic-bezier(0.4, 0, 0.2, 1), top 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            )}
          </div>
        );
      })() : (
        // Si no hay elemento objetivo, mostrar overlay completo
        <div
          className="fixed inset-0 bg-black/45 z-[50] backdrop-blur-sm animate-in fade-in-0 duration-300"
          onClick={handleSkip}
          aria-hidden="true"
        />
      )}
      
      {/* Highlight del elemento objetivo mejorado - z-index superior para asegurar visibilidad */}
      {targetRect && (() => {
        // Obtener el rect más reciente del elemento para máxima precisión
        const step = steps[currentStep];
        const currentElement = step?.target ? document.querySelector(step.target) : null;
        const rect = currentElement ? currentElement.getBoundingClientRect() : targetRect;
        
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0 && 
                         rect.left < window.innerWidth && rect.right > 0;
        
        if (!isVisible) return null;
        
        // Usar coordenadas exactas del elemento - el recuadro debe tener exactamente el mismo tamaño que el botón
        // El borde se dibuja usando outline para un efecto más limpio y preciso
        const borderWidth = 3;
        
        // Asegurar que las coordenadas sean números enteros para evitar subpixel rendering
        // Usar Math.floor para top y left para evitar que se desplace hacia abajo
        const top = Math.floor(rect.top);
        const left = Math.floor(rect.left);
        const width = Math.ceil(rect.width);
        const height = Math.ceil(rect.height);
        
        return (
          <>
            {/* Borde principal alrededor del elemento - exactamente del mismo tamaño */}
            <div
              className="fixed z-[65] pointer-events-none animate-pulse"
              style={{
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${height}px`,
                borderRadius: targetBorderRadius,
                outline: `${borderWidth}px solid rgba(59, 130, 246, 1)`,
                outlineOffset: '0px',
                boxShadow: `
                  0 0 0 ${borderWidth + 1}px rgba(59, 130, 246, 0.8),
                  0 0 20px rgba(59, 130, 246, 0.5),
                  0 0 40px rgba(59, 130, 246, 0.3)
                `,
                transition: "top 0.25s cubic-bezier(0.4, 0, 0.2, 1), left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.25s cubic-bezier(0.4, 0, 0.2, 1), outline 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            {/* Segundo borde más sutil para efecto de glow interno */}
            <div
              className="fixed z-[64] pointer-events-none"
              style={{
                top: `${top + 1}px`,
                left: `${left + 1}px`,
                width: `${width - 2}px`,
                height: `${height - 2}px`,
                borderRadius: targetBorderRadius,
                outline: `1px solid rgba(147, 197, 253, 0.6)`,
                outlineOffset: '0px',
                transition: "top 0.25s cubic-bezier(0.4, 0, 0.2, 1), left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </>
        );
      })()}

      {/* Card del tutorial completamente rediseñada */}
      <Card
        ref={cardRef}
        className={cn(
          "fixed z-[60] w-full shadow-2xl border-2",
          "bg-gradient-to-br from-blue-50/95 via-cyan-50/95 to-white backdrop-blur-xl",
          "border-blue-200/60",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300",
          targetElement ? "max-w-[95vw] sm:max-w-md" : "max-w-[95vw] sm:max-w-lg"
        )}
        style={{
          ...cardPosition,
          transition: "top 0.25s cubic-bezier(0.4, 0, 0.2, 1), left 0.25s cubic-bezier(0.4, 0, 0.2, 1), right 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Barra superior con gradiente */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
        
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>

        <CardHeader className="pb-4 pt-4 sm:pt-6 px-4 sm:px-6 relative z-10">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex-shrink-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent truncate">
                    {step.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-[10px] sm:text-xs font-semibold"
                    >
                      Paso {currentStep + 1} de {steps.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0 hover:bg-red-50 hover:text-red-600 transition-colors rounded-full"
              aria-label="Cerrar tutorial"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
          
          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Progreso del tutorial</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-blue-100" />
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-4 sm:pb-6 px-4 sm:px-6 relative z-10">
          <CardDescription className="text-sm sm:text-base leading-relaxed text-gray-700 mb-4 sm:mb-6 min-h-[50px] sm:min-h-[60px]">
            {step.description}
          </CardDescription>

          {/* Indicadores de pasos */}
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-8 bg-gradient-to-r from-blue-500 to-cyan-500"
                    : index < currentStep
                    ? "w-2 bg-green-500"
                    : "w-2 bg-gray-300"
                )}
              />
            ))}
          </div>

          {/* Botones de navegación mejorados */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1 sm:flex-initial min-w-0 sm:min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed border-blue-200 hover:bg-blue-50 text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">Ant.</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 px-3 sm:px-4 text-xs sm:text-sm order-last sm:order-none"
            >
              Omitir
            </Button>
            
            <Button
              size="sm"
              onClick={handleNext}
              className="flex-1 sm:flex-initial min-w-0 sm:min-w-[120px] bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-blue-500/50 transition-all text-xs sm:text-sm"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Finalizar
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
