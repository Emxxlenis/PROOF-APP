"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PublicLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [landingPage, setLandingPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLandingPage();
  }, [slug]);

  const loadLandingPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/validation/landing-page?url=${slug}`);
      
      if (!response.ok) {
        throw new Error("Landing page no encontrada");
      }

      const data = await response.json();
      setLandingPage(data.landingPage);
    } catch (err: any) {
      setError(err.message || "Error al cargar la landing page");
    } finally {
      setLoading(false);
    }
  };

  const handleCTAClick = async () => {
    if (!landingPage) return;

    // Track conversion event
    try {
      await fetch("/api/validation/track-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId: landingPage.startup_id,
          landingPageId: landingPage.id,
          eventType: "conversion",
        }),
      });
    } catch (err) {
      console.error("Error tracking conversion:", err);
    }

    // Redirect to CTA URL or show email form
    if (landingPage.cta_url) {
      window.location.href = landingPage.cta_url;
    } else {
      // Show email capture form (simple implementation)
      const email = prompt("Ingresa tu email para recibir más información:");
      if (email) {
        // Note: Email capture functionality to be implemented
        // Future: Save email to database or send to email service
        alert("¡Gracias! Te contactaremos pronto.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Landing Page no encontrada</h1>
          <p className="text-muted-foreground">{error || "La página que buscas no existe"}</p>
        </div>
      </div>
    );
  }

  // Render HTML content if available
  if (landingPage.html_content) {
    return (
      <div className="w-full h-screen">
        <iframe
          srcDoc={landingPage.html_content}
          className="w-full h-full border-0"
          title={landingPage.title || "Landing Page"}
        />
      </div>
    );
  }

  // Fallback: Render basic landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">{landingPage.headline}</h1>
          {landingPage.subheadline && (
            <h2 className="text-2xl text-muted-foreground mb-8">
              {landingPage.subheadline}
            </h2>
          )}
          {landingPage.description && (
            <p className="text-lg mb-12 text-muted-foreground">
              {landingPage.description}
            </p>
          )}
          <button
            onClick={handleCTAClick}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
          >
            {landingPage.cta_text || "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}
