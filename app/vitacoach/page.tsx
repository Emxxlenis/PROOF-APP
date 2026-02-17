"use client";

// Marcar como dinámico para evitar prerenderización
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, Send, Loader2, Sparkles, Code, TrendingUp, 
  DollarSign, Target, Users, Bot, User, Clock, CheckCircle2, 
  Lightbulb, ArrowRight, Hash, Trash2, AlertTriangle, 
  Paperclip, X, FileText,
  Image as ImageIcon, File
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamicImport from "next/dynamic";
import type { AgentType } from "@/types/database";

// Dynamic import de react-markdown para reducir el bundle inicial
const MarkdownRenderer = dynamicImport(
  () => import("@/components/ui/markdown-renderer").then((mod) => mod.MarkdownRenderer),
  {
    loading: () => <div className="animate-pulse text-muted-foreground">Cargando...</div>,
    ssr: false,
  }
);
import { TutorialOverlay } from "@/components/ui/tutorial-overlay";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useSelectedProject } from "@/lib/hooks/useSelectedProject";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: AgentType;
  timestamp: Date;
  files?: ChatFile[];
}

// Agentes con colores coherentes con la marca Proof (azules, cyans, verdes, naranja)
const AGENTS = [
  { id: "orchestrator" as AgentType, name: "Coordinador", shortName: "Coord", icon: MessageSquare, description: "Tu guía principal para navegar entre todos los agentes", color: "blue-600", bgColor: "bg-blue-600", hoverColor: "hover:bg-blue-50", textColor: "text-blue-600" },
  { id: "validation" as AgentType, name: "Validación", shortName: "Valid", icon: Sparkles, description: "Valida tu idea y analiza su viabilidad en el mercado", color: "cyan-600", bgColor: "bg-cyan-600", hoverColor: "hover:bg-cyan-50", textColor: "text-cyan-600" },
  { id: "technical" as AgentType, name: "Técnico", shortName: "Tech", icon: Code, description: "Tu co-founder técnico virtual para decisiones de stack", color: "teal-600", bgColor: "bg-teal-600", hoverColor: "hover:bg-teal-50", textColor: "text-teal-600" },
  { id: "market" as AgentType, name: "Mercado", shortName: "Mkt", icon: TrendingUp, description: "Estrategia go-to-market y posicionamiento", color: "sky-600", bgColor: "bg-sky-600", hoverColor: "hover:bg-sky-50", textColor: "text-sky-600" },
  { id: "sales" as AgentType, name: "Ventas", shortName: "Sales", icon: Users, description: "Coach de ventas y adquisición de clientes", color: "orange-500", bgColor: "bg-orange-500", hoverColor: "hover:bg-orange-50", textColor: "text-orange-500" },
  { id: "finance" as AgentType, name: "Finanzas", shortName: "Fin", icon: DollarSign, description: "CFO virtual para métricas y proyecciones", color: "emerald-600", bgColor: "bg-emerald-600", hoverColor: "hover:bg-emerald-50", textColor: "text-emerald-600" },
  { id: "progress" as AgentType, name: "Progreso", shortName: "OKRs", icon: Target, description: "Tracking de objetivos y resultados clave", color: "blue-500", bgColor: "bg-blue-500", hoverColor: "hover:bg-blue-50", textColor: "text-blue-500" },
];

const QUICK_ACTIONS = [
  "¿Cómo consigo mis primeros usuarios?",
  "¿Cómo valido mi idea rápidamente?",
  "¿Qué stack tecnológico usar?",
  "¿Cómo estructurar mi pitch?",
  "¿Cuáles son mis próximos pasos?",
];

export default function ProofCoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("orchestrator");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [okrEvidence, setOkrEvidence] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const router = useRouter();
  
  // Usar el hook para obtener el proyecto seleccionado
  const { selectedProjectId } = useSelectedProject();

  // Inicializar cliente solo en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient());
    }
  }, []);
  
  // Recargar historial cuando cambia el proyecto o el agente
  useEffect(() => {
    if (supabase && selectedProjectId) {
      loadConversationHistory();
    }
  }, [selectedProjectId, supabase]);

  // Cloudinary URLs
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const proofLogoUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-logo_nupbgm`;
  const lolaCoachUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/lola-coach_mgxmgu`;

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/auth");
  };

  // Funciones para manejo de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} es muy grande. Máximo 10MB.`);
        return false;
      }
      return true;
    });
    setAttachedFiles(prev => [...prev, ...validFiles].slice(0, 3)); // Max 3 archivos
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, accessToken: string): Promise<ChatFile | null> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/coach/upload-file", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.file;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (type.includes("pdf")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Cargar evidencias de OKRs al iniciar
  useEffect(() => {
    if (!supabase) return;
    const loadOkrEvidence = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: startup } = await supabase
        .from("startups")
        .select("id")
        .eq("student_id", session.user.id)
        .maybeSingle();

      if (!startup) return;

      const { data: okrs } = await supabase
        .from("okrs")
        .select("id, objective, key_result_1, key_result_2, key_result_3")
        .eq("startup_id", startup.id);

      if (!okrs || okrs.length === 0) return;

      const okrIds = okrs.map(okr => okr.id);
      const { data: evidence } = await supabase
        .from("okr_evidence")
        .select("*")
        .in("okr_id", okrIds);

      if (evidence) {
        // Combinar OKRs con sus evidencias
        const evidenceWithContext = evidence.map(ev => {
          const okr = okrs.find(o => o.id === ev.okr_id);
          return {
            ...ev,
            okr_objective: okr?.objective,
            key_result: ev.key_result_number === 1 ? okr?.key_result_1 
              : ev.key_result_number === 2 ? okr?.key_result_2 
              : okr?.key_result_3
          };
        });
        setOkrEvidence(evidenceWithContext);
      }
    };

    loadOkrEvidence();
  }, [supabase, selectedProjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversationHistory = useCallback(async () => {
    if (!supabase || !selectedProjectId) {
      setMessages([]);
      return;
    }
    try {
      setLoadingHistory(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessages([]);
        return;
      }

      // Verificar que el proyecto pertenece al usuario y obtener su ID
      const { data: startup } = await supabase
        .from("startups")
        .select("id")
        .eq("id", selectedProjectId)
        .eq("student_id", session.user.id)
        .maybeSingle();

      if (!startup) {
        setMessages([]);
        return;
      }

      // IMPORTANTE: Filtrar por startup_id para aislar los chats por proyecto
      const { data: history, error } = await supabase
        .from("coach_interactions")
        .select("*")
        .eq("startup_id", startup.id)  // <-- Filtrar por startup_id, no solo student_id
        .eq("agent_type", selectedAgent)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Error loading history:", error);
        setMessages([]);
        return;
      }

      const historyMessages: Message[] = [];
      history?.forEach((interaction) => {
        historyMessages.push({
          id: `${interaction.id}-user`,
          role: "user",
          content: interaction.query,
          agent: selectedAgent,
          timestamp: new Date(interaction.created_at),
        });
        historyMessages.push({
          id: `${interaction.id}-assistant`,
          role: "assistant",
          content: interaction.response,
          agent: selectedAgent,
          timestamp: new Date(interaction.created_at),
        });
      });

      setMessages(historyMessages);
    } catch (error) {
      console.error("Error loading conversation history:", error);
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedAgent, supabase, selectedProjectId]);

  useEffect(() => {
    // Limpiar mensajes cuando cambia el proyecto para evitar mezclar conversaciones
    setMessages([]);
    loadConversationHistory();
  }, [loadConversationHistory, selectedProjectId]);

  const handleSend = async () => {
    if (!supabase) return;
    if ((!input.trim() && attachedFiles.length === 0) || loading) return;

    const userQuery = input.trim();
    const filesToUpload = [...attachedFiles];
    
    // Limpiar input y archivos antes de procesar
    setInput("");
    setAttachedFiles([]);
    setLoading(true);

    // Crear mensaje del usuario inicialmente sin archivos
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userQuery || "(Archivo adjunto)",
      timestamp: new Date(),
      files: [],
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      let {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error("Debes iniciar sesión para usar Proof Coach");
        }
        
        const refreshResult = await supabase.auth.refreshSession();
        session = refreshResult.data.session;
        
        if (!session) {
          throw new Error("Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.");
        }
      }

      const accessToken = session.access_token;

      // Subir archivos adjuntos si hay
      const uploadedFiles: ChatFile[] = [];
      if (filesToUpload.length > 0) {
        setUploadingFile(true);
        for (const file of filesToUpload) {
          const uploaded = await uploadFile(file, accessToken);
          if (uploaded) uploadedFiles.push(uploaded);
        }
        setUploadingFile(false);

        // Actualizar el mensaje del usuario con los archivos subidos
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, files: uploadedFiles }
            : msg
        ));
      }

      // Usar el proyecto seleccionado
      const projectId = selectedProjectId || localStorage.getItem("selected_project_id");
      
      if (!projectId) {
        throw new Error("No hay proyecto seleccionado. Por favor, selecciona un proyecto primero.");
      }

      const { data: startup } = await supabase
        .from("startups")
        .select("*")
        .eq("id", projectId)
        .eq("student_id", session.user.id)
        .maybeSingle();
      
      if (!startup) {
        throw new Error("No se encontró el proyecto o no tienes acceso a él.");
      }

      const { data: validations } = startup
        ? await supabase
            .from("validations")
            .select("*")
            .eq("startup_id", startup.id)
            .order("created_at", { ascending: false })
            .limit(3)
            .then((result) => result)
        : { data: [] };

      const { data: okrs } = startup
        ? await supabase
            .from("okrs")
            .select("*")
            .eq("startup_id", startup.id)
            .order("created_at", { ascending: false })
            .limit(5)
            .then((result) => result)
        : { data: [] };

      const conversationHistory = messages
        .slice(-20)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Preparar información de archivos adjuntos para el contexto
      const attachedFilesInfo = uploadedFiles.map(f => ({
        name: f.file_name,
        type: f.file_type,
        url: f.file_url,
      }));

      // Preparar evidencias de OKRs para el contexto (especialmente para el agente de Progreso)
      const okrEvidenceContext = okrEvidence.map(ev => ({
        objective: ev.okr_objective,
        key_result: ev.key_result,
        file_name: ev.file_name,
        file_type: ev.file_type,
        description: ev.description,
        uploaded_at: ev.uploaded_at,
      }));

      const response = await fetch("/api/vitacoach", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({
          query: userQuery,
          agentType: selectedAgent,
          startupId: startup?.id || projectId || null,
          context: {
            startup: startup || null,
            validations: validations || [],
            okrs: okrs || [],
            okrEvidence: okrEvidenceContext,
            attachedFiles: attachedFilesInfo,
          },
          conversationHistory: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener respuesta");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        agent: selectedAgent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Guardar la interacción en la base de datos con startup_id
      const { error: insertError } = await supabase.from("coach_interactions").insert({
        student_id: session.user.id,
        startup_id: startup.id,
        agent_type: selectedAgent,
        query: userQuery,
        response: data.response,
        tokens_used: data.tokensUsed || null,
      });

      if (insertError) {
        console.error("Error saving interaction to DB:", insertError);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const handleDeleteConversation = async () => {
    if (!supabase) return;
    try {
      setDeleting(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Debes iniciar sesión para eliminar la conversación");
        setDeleting(false);
        return;
      }

      // Obtener el startup_id del proyecto seleccionado
      const projectId = selectedProjectId || localStorage.getItem("selected_project_id");
      if (!projectId) {
        alert("No hay proyecto seleccionado");
        setDeleting(false);
        return;
      }

      const { data: startup } = await supabase
        .from("startups")
        .select("id")
        .eq("id", projectId)
        .eq("student_id", session.user.id)
        .maybeSingle();

      if (!startup) {
        alert("No se encontró el proyecto");
        setDeleting(false);
        return;
      }

      // IMPORTANTE: Filtrar por startup_id para eliminar solo los chats del proyecto actual
      const { data: deletedData, error } = await supabase
        .from("coach_interactions")
        .delete()
        .eq("startup_id", startup.id)  // <-- Filtrar por startup_id
        .eq("agent_type", selectedAgent)
        .select();

      if (error) {
        console.error("Error deleting conversation:", error);
        alert(`Error al eliminar la conversación: ${error.message}`);
        setDeleting(false);
        return;
      }

      setMessages([]);
      setShowDeleteDialog(false);
      await loadConversationHistory();
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      alert(`Error al eliminar la conversación: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const selectedAgentData = AGENTS.find((a) => a.id === selectedAgent);

  const proofCoachTutorialSteps = [
    {
      id: "welcome",
      title: "Bienvenido a Proof Coach",
      description: "Tu co-founder virtual con 7 agentes especializados. Cada agente te ayuda en áreas específicas de tu startup.",
      position: "center" as const,
    },
    {
      id: "agents",
      title: "Selecciona un Agente",
      description: "Usa las pestañas para elegir: Coordinador (general), Validación, Técnico, Mercado, Ventas, Finanzas o Progreso.",
      target: "[data-tutorial='agent-selector']",
      position: "bottom" as const,
    },
    {
      id: "chat",
      title: "Área de Conversación",
      description: "Aquí verás el historial con el agente seleccionado. Puedes hacer preguntas específicas y recibir respuestas detalladas.",
      target: "[data-tutorial='chat-area']",
      position: "right" as const,
    },
    {
      id: "input",
      title: "Escribe tu Pregunta",
      description: "Escribe cualquier pregunta sobre tu startup. Sé específico para mejores respuestas. También puedes usar las acciones rápidas.",
      target: "[data-tutorial='input-area']",
      position: "top" as const,
    },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50">
      {/* MVP Banner - Already included in root layout, but adding note here for visibility */}
      <TutorialOverlay
        steps={proofCoachTutorialSteps}
        storageKey="proofcoach"
        title="Tutorial de Proof Coach"
        description="Aprende a usar el sistema de agentes especializados"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden container mx-auto px-4 py-4 max-w-5xl">
        {/* Agent Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-2 mb-4 flex-shrink-0" data-tutorial="agent-selector">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              const isSelected = selectedAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    isSelected
                      ? `${agent.bgColor} text-white shadow-md`
                      : `text-gray-600 ${agent.hoverColor} hover:${agent.textColor}`
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? "text-white" : ""}`} />
                  <span className="text-sm font-medium hidden md:inline">{agent.name}</span>
                  <span className="text-sm font-medium md:hidden">{agent.shortName}</span>
                </button>
              );
            })}
          </div>
          
          {/* Agent Description */}
          <div className="mt-3 px-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${selectedAgentData?.bgColor}`}></div>
            <p className="text-sm text-gray-600">
              <span className={`font-semibold ${selectedAgentData?.textColor}`}>{selectedAgentData?.name}:</span>{" "}
              {selectedAgentData?.description}
            </p>
            <HelpTooltip
              content="Cada agente tiene expertise específico. Selecciona el más adecuado para tu consulta."
              variant="info"
            />
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col shadow-sm border border-blue-100 rounded-2xl overflow-hidden bg-white" data-tutorial="chat-area">
          {/* Chat Header */}
          <div className={`${selectedAgentData?.bgColor} px-6 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Proof Coach</h3>
                <p className="text-sm text-white/80">{selectedAgentData?.name}</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg px-3 py-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="text-sm hidden sm:inline">Limpiar</span>
              </Button>
            )}
          </div>

          <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-500">Cargando historial...</p>
                </div>
              ) : messages.length === 0 ? (
                /* Empty State with Lola */
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  {/* Lola Image */}
                  <div className="relative mb-6">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl"></div>
                    <img
                      src={lolaCoachUrl}
                      alt="Lola Coach - Tu asesora de startups"
                      className="relative w-40 h-40 object-contain drop-shadow-lg"
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Habla con tu Coach de Startups
                  </h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    Pregúntale a <span className={`font-semibold ${selectedAgentData?.textColor}`}>{selectedAgentData?.name}</span> lo que necesites. 
                    Estoy aquí para ayudarte 24/7 con tu emprendimiento.
                  </p>
                  
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100 max-w-2xl w-full">
                    <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2 justify-center">
                      <Lightbulb className="h-4 w-4 text-orange-500" />
                      Preguntas sugeridas:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {QUICK_ACTIONS.map((action, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action)}
                          className="bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-400 text-gray-700 hover:text-blue-700 transition-all rounded-full text-xs px-4"
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Messages List */
                messages.map((message) => {
                  const agentData = message.agent ? AGENTS.find((a) => a.id === message.agent) : selectedAgentData;
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                    >
                      {/* Assistant Avatar */}
                      {message.role === "assistant" && (
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full ${agentData?.bgColor} flex items-center justify-center shadow-md`}>
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl shadow-sm transition-all duration-200 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white p-3 sm:p-4"
                            : "bg-white border border-blue-100 p-4 sm:p-5"
                        }`}
                      >
                        {/* Agent Badge for Assistant */}
                        {message.role === "assistant" && agentData && (
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                            <Badge 
                              className={`text-xs ${agentData.bgColor} text-white border-0 font-medium px-2 py-0.5`}
                            >
                              {agentData.name}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Message Content */}
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none text-gray-700">
                            <MarkdownRenderer 
                              content={message.content}
                              agentData={agentData}
                            />
                          </div>
                        ) : (
                          <div>
                            {/* Archivos adjuntos del usuario */}
                            {message.files && message.files.length > 0 && (
                              <div className="mb-2 space-y-1">
                                {message.files.map((file, idx) => (
                                  <a
                                    key={idx}
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2 text-sm hover:bg-white/30 transition-colors"
                                  >
                                    {getFileIcon(file.file_type)}
                                    <span className="truncate max-w-[150px] sm:max-w-[200px]">{file.file_name}</span>
                                    {file.file_size && (
                                      <span className="text-white/70 text-xs">({formatFileSize(file.file_size)})</span>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap leading-relaxed text-white">
                              {message.content}
                            </div>
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <div className={`text-xs mt-3 pt-2 flex items-center gap-1.5 border-t ${
                          message.role === "user" 
                            ? "text-white/70 border-white/20" 
                            : "text-gray-400 border-gray-100"
                        }`}>
                          <Clock className="h-3 w-3" />
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      {/* User Avatar */}
                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              
              {/* Loading State */}
              {loading && (
                <div className="flex justify-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full ${selectedAgentData?.bgColor} flex items-center justify-center shadow-md animate-pulse`}>
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Loader2 className={`h-4 w-4 animate-spin ${selectedAgentData?.textColor}`} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">Pensando...</span>
                        <span className="text-xs text-gray-400">Procesando tu consulta</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 bg-white p-4 flex-shrink-0" data-tutorial="input-area">
              {/* Archivos adjuntos preview */}
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-sm"
                    >
                      {getFileIcon(file.type)}
                      <span className="truncate max-w-[120px] sm:max-w-[150px] text-gray-700">{file.name}</span>
                      <span className="text-gray-400 text-xs">({formatFileSize(file.size)})</span>
                      <button
                        onClick={() => removeAttachedFile(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                {/* Botón adjuntar archivo */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || attachedFiles.length >= 3}
                  className="h-[44px] w-[44px] sm:h-[52px] sm:w-[52px] border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl flex-shrink-0"
                  title="Adjuntar archivo (máx. 3)"
                >
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </Button>
                
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Pregúntale a ${selectedAgentData?.name}...`}
                  className="min-h-[44px] sm:min-h-[52px] max-h-[100px] sm:max-h-[120px] resize-none text-sm sm:text-base border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl bg-gray-50 flex-1"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={loading || (!input.trim() && attachedFiles.length === 0)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all h-[44px] sm:h-[52px] px-4 sm:px-6 rounded-xl flex-shrink-0 text-sm sm:text-base"
                  size="lg"
                >
                  {loading ? (
                    uploadingFile ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Subiendo...</span>
                      </div>
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Enter para enviar | Adjunta imágenes, PDF, Word, Excel (máx. 10MB)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Conversation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md rounded-2xl border-2 border-red-100/50 shadow-2xl bg-white">
          <AlertDialogHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-red-400/20 rounded-full blur-lg animate-pulse"></div>
                <div className="relative p-3 rounded-full bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300/50 shadow-md">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                ¿Eliminar conversación?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-700 leading-relaxed pt-2">
              Esta acción eliminará permanentemente toda la conversación con{" "}
              <span className={`font-bold ${selectedAgentData?.textColor}`}>{selectedAgentData?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/60 border-2 border-amber-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-sm text-amber-900 leading-relaxed font-medium">
                El agente perderá todo el contexto de tus mensajes anteriores y comenzará desde cero.
              </p>
            </div>
          </div>

          <AlertDialogFooter className="gap-3 sm:gap-2 flex-col sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 transition-all duration-200 shadow-sm hover:shadow-md">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              disabled={deleting}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:via-red-700 hover:to-red-800 text-white rounded-xl font-semibold px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-white/0 group-hover:from-white/10 group-hover:via-white/5 group-hover:to-white/10 transition-all duration-300"></div>
              <div className="relative flex items-center justify-center gap-2">
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <div className="p-1 rounded-md bg-white/20 group-hover:bg-white/30 transition-colors">
                      <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </div>
                    <span>Eliminar</span>
                  </>
                )}
              </div>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}





