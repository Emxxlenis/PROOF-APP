"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

export default function SeanEllisSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [startup, setStartup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [question1, setQuestion1] = useState<string>("");
  const [question2, setQuestion2] = useState<string>("");
  const [question3, setQuestion3] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [respondentName, setRespondentName] = useState<string>("");
  const [respondentEmail, setRespondentEmail] = useState<string>("");

  useEffect(() => {
    loadSurvey();
  }, [token]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sean-ellis/share/${token}`);
      
      if (!response.ok) {
        throw new Error("Encuesta no encontrada");
      }

      const data = await response.json();
      setStartup(data.startup);
    } catch (err: any) {
      console.error("Error loading survey:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question1) {
      alert("Por favor responde al menos la primera pregunta");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/validation/sean-ellis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId: startup.id,
          question1Score: question1,
          question2Score: question2 || null,
          question3Score: question3 || null,
          additionalFeedback: feedback || null,
          respondentName: respondentName || null,
          respondentEmail: respondentEmail || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al enviar respuesta");
      }

      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || "Error al enviar respuesta");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Cargando encuesta..." />;
  }

  if (!startup) {
    return (
      <EmptyState
        title="Encuesta no encontrada"
        message="La encuesta que buscas no existe"
        variant="error"
      />
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">¡Gracias por tu respuesta!</CardTitle>
            <CardDescription>
              Tu opinión es muy valiosa para {startup.name}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Sean Ellis Test</CardTitle>
            <CardDescription>
              Ayuda a validar {startup.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Question 1 - Required */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Si {startup.name} desapareciera mañana, ¿qué tan decepcionado estarías?
                </Label>
                <RadioGroup value={question1} onValueChange={setQuestion1} required>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very_disappointed" id="q1-very" />
                    <Label htmlFor="q1-very" className="font-normal cursor-pointer">
                      Muy decepcionado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="somewhat_disappointed" id="q1-somewhat" />
                    <Label htmlFor="q1-somewhat" className="font-normal cursor-pointer">
                      Algo decepcionado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_disappointed" id="q1-not" />
                    <Label htmlFor="q1-not" className="font-normal cursor-pointer">
                      No estaría decepcionado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="does_not_apply" id="q1-na" />
                    <Label htmlFor="q1-na" className="font-normal cursor-pointer">
                      No aplica (nunca lo he usado)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question 2 - Optional */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  ¿Qué tipo de persona usaría {startup.name}?
                </Label>
                <RadioGroup value={question2} onValueChange={setQuestion2}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very_disappointed" id="q2-very" />
                    <Label htmlFor="q2-very" className="font-normal cursor-pointer">
                      Muy decepcionado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="somewhat_disappointed" id="q2-somewhat" />
                    <Label htmlFor="q2-somewhat" className="font-normal cursor-pointer">
                      Algo decepcionado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_disappointed" id="q2-not" />
                    <Label htmlFor="q2-not" className="font-normal cursor-pointer">
                      No estaría decepcionado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="does_not_apply" id="q2-na" />
                    <Label htmlFor="q2-na" className="font-normal cursor-pointer">
                      No aplica
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question 3 - Optional */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  ¿Cuál es la principal alternativa a {startup.name}?
                </Label>
                <RadioGroup value={question3} onValueChange={setQuestion3}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very_disappointed" id="q3-very" />
                    <Label htmlFor="q3-very" className="font-normal cursor-pointer">
                      Muy decepcionado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="somewhat_disappointed" id="q3-somewhat" />
                    <Label htmlFor="q3-somewhat" className="font-normal cursor-pointer">
                      Algo decepcionado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_disappointed" id="q3-not" />
                    <Label htmlFor="q3-not" className="font-normal cursor-pointer">
                      No estaría decepcionado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="does_not_apply" id="q3-na" />
                    <Label htmlFor="q3-na" className="font-normal cursor-pointer">
                      No aplica
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Optional feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback adicional (opcional)</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Comparte cualquier comentario adicional..."
                  rows={4}
                />
              </div>

              {/* Optional contact info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tu nombre (opcional)</Label>
                  <input
                    id="name"
                    type="text"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Tu email (opcional)</Label>
                  <input
                    id="email"
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !question1}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Respuesta"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


