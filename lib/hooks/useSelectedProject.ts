"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const SELECTED_PROJECT_KEY = "selected_project_id";

export function useSelectedProject() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const previousProjectIdRef = useRef<string | null>(null);
  
  // Crear cliente solo en el navegador
  const [supabase, setSupabase] = useState<any>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const client = createClient();
        setSupabase(client);
      } catch (error: any) {
        console.error("Error creating Supabase client:", error);
      }
    }
  }, []);

  // Cargar proyectos del usuario
  useEffect(() => {
    if (!supabase) return; // Esperar a que el cliente esté listo
    
    loadProjects();

    // Escuchar eventos de eliminación de proyectos
    const handleProjectDeleted = () => {
      loadProjects();
    };

    // Escuchar evento personalizado cuando se elimina un proyecto
    window.addEventListener('project-deleted', handleProjectDeleted);
    
    // También escuchar cambios en localStorage (cuando se elimina el proyecto seleccionado o cambia)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SELECTED_PROJECT_KEY) {
        if (!e.newValue) {
          // El proyecto seleccionado fue eliminado, recargar lista
          loadProjects();
        } else if (e.newValue !== previousProjectIdRef.current) {
          // El proyecto cambió desde otra pestaña, actualizar estado
          previousProjectIdRef.current = e.newValue;
          setSelectedProjectId(e.newValue);
        }
      }
    };
    
    // Escuchar cambios desde la misma pestaña usando custom event
    const handleCustomStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newProjectId = customEvent.detail?.projectId || null;
      if (newProjectId !== previousProjectIdRef.current) {
        previousProjectIdRef.current = newProjectId;
        setSelectedProjectId(newProjectId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('project-selected', handleCustomStorageChange);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('project-deleted', handleProjectDeleted);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('project-selected', handleCustomStorageChange);
      }
    };
  }, [supabase]);

  const loadProjects = async () => {
    if (!supabase) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Cargar proyectos del usuario (como creador)
      const { data: userProjects } = await supabase
        .from("startups")
        .select("*")
        .eq("student_id", session.user.id)
        .order("created_at", { ascending: false });

      // Cargar proyectos donde el usuario es miembro del equipo
      const { data: teamProjects } = await supabase
        .from("team_members")
        .select(`
          startup:startups!team_members_startup_id_fkey (*)
        `)
        .eq("user_id", session.user.id);

      // Combinar proyectos
      const allProjects = [
        ...(userProjects || []),
        ...(teamProjects?.map((tp: any) => tp.startup).filter(Boolean) || [])
      ];

      // Eliminar duplicados
      const uniqueProjects = Array.from(
        new Map(allProjects.map((p: any) => [p.id, p])).values()
      );

      setProjects(uniqueProjects);

      // Actualizar el proyecto seleccionado
      const savedProjectId = localStorage.getItem(SELECTED_PROJECT_KEY);
      
      if (uniqueProjects.length > 0) {
        // Si hay proyectos, verificar si el guardado aún existe
        const projectToSelect = savedProjectId && uniqueProjects.find(p => p.id === savedProjectId)
          ? savedProjectId
          : uniqueProjects[0].id;
        
        // Solo actualizar si cambió
        if (projectToSelect !== previousProjectIdRef.current) {
          previousProjectIdRef.current = projectToSelect;
          setSelectedProjectId(projectToSelect);
          localStorage.setItem(SELECTED_PROJECT_KEY, projectToSelect);
          // Disparar evento personalizado para notificar a otras páginas
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('project-selected', { 
              detail: { projectId: projectToSelect } 
            }));
          }
        }
      } else {
        // No hay proyectos, limpiar la selección
        if (previousProjectIdRef.current !== null) {
          previousProjectIdRef.current = null;
          setSelectedProjectId(null);
          localStorage.removeItem(SELECTED_PROJECT_KEY);
          // Disparar evento personalizado
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('project-selected', { 
              detail: { projectId: null } 
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectProject = (projectId: string) => {
    previousProjectIdRef.current = projectId;
    setSelectedProjectId(projectId);
    localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
    // Disparar evento personalizado para notificar a otras páginas
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('project-selected', { 
        detail: { projectId } 
      }));
    }
    // Recargar la página para actualizar todos los datos
    window.location.reload();
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  return {
    selectedProject,
    selectedProjectId,
    projects,
    loading,
    selectProject,
    reloadProjects: loadProjects,
  };
}
