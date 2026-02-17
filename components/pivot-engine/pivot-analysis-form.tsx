'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowRight, ChevronDown, AlertCircle, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface PivotAnalysisFormProps {
  onAnalyze: (formData: any) => void;
  isLoading: boolean;
  startup: any;
}

export function PivotAnalysisForm({ onAnalyze, isLoading, startup }: PivotAnalysisFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    // Situación actual
    currentUsers: '',
    currentTraction: '',
    problems: '',
    currentRevenue: '',
    
    // Datos de mercado
    currentMarket: startup?.target_audience || '',
    alternativeMarkets: '',
    targetMarket: '',
    
    // Restricciones
    techStack: '',
    techDebt: 'Baja',
    teamSize: '1',
    actualCac: '0',
    actualLtv: '0',
    burnRate: '0',
    runway: '0',
    availableBudget: '0',
    
    // Opciones de pivot
    pivotOptions: '',
    pivotReason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos requeridos
    if (!formData.problems || !formData.currentMarket || !formData.alternativeMarkets) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Preparar datos para el API
    const analysisData = {
      currentSituation: {
        currentUsers: formData.currentUsers || '0',
        currentTraction: formData.currentTraction || 'Sin traction',
        problems: formData.problems.split('\n').filter(p => p.trim()),
        currentRevenue: formData.currentRevenue || '0',
        pivotOptions: formData.pivotOptions.split('\n').filter(p => p.trim()) || [
          'Cambio de mercado objetivo',
          'Cambio de modelo de negocio',
          'Cambio de stack tecnológico',
        ],
        pivotOption: formData.pivotReason || 'Opción de pivot',
      },
      marketData: {
        currentMarket: formData.currentMarket,
        alternativeMarkets: formData.alternativeMarkets.split('\n').filter(m => m.trim()),
        targetMarket: formData.targetMarket || formData.currentMarket,
      },
      constraints: {
        techStack: formData.techStack || startup?.competitive_advantage || 'No especificado',
        techDebt: formData.techDebt,
        teamSize: parseInt(formData.teamSize) || 1,
        actualCac: parseFloat(formData.actualCac) || 0,
        actualLtv: parseFloat(formData.actualLtv) || 0,
        burnRate: parseFloat(formData.burnRate) || 0,
        runway: parseFloat(formData.runway) || 0,
        availableBudget: parseFloat(formData.availableBudget) || 0,
      },
    };

    onAnalyze(analysisData);
  };

  // Calcular progreso del formulario
  const calculateProgress = () => {
    let filled = 0;
    let total = 0;
    
    // Campos requeridos
    if (formData.problems) filled++;
    total++;
    if (formData.currentMarket) filled++;
    total++;
    if (formData.alternativeMarkets) filled++;
    total++;
    
    // Campos opcionales pero importantes
    if (formData.currentUsers) filled += 0.5;
    if (formData.currentTraction) filled += 0.5;
    if (formData.pivotReason) filled += 0.5;
    
    return Math.min((filled / total) * 100, 100);
  };

  const progress = calculateProgress();

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-tutorial="pivot-form">
      {/* Indicador de Progreso */}
      <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Progreso del formulario</span>
              <span className="text-gray-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500">
              {progress < 50 ? 'Completa los campos requeridos para continuar' : 
               progress < 80 ? '¡Vas bien! Completa más campos para un mejor análisis' :
               '¡Excelente! Tu formulario está casi completo'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Situación Actual */}
      <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Situación Actual de tu Startup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentUsers">Usuarios Actuales</Label>
            <Input
              id="currentUsers"
              type="text"
              placeholder="Ej: 50 usuarios activos"
              value={formData.currentUsers}
              onChange={(e) => setFormData({ ...formData, currentUsers: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="currentTraction">Traction Actual</Label>
            <Textarea
              id="currentTraction"
              placeholder="Describe tu traction actual (métricas, engagement, etc.)"
              value={formData.currentTraction}
              onChange={(e) => setFormData({ ...formData, currentTraction: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="problems">Problemas Identificados *</Label>
            <Textarea
              id="problems"
              placeholder="Lista los problemas que has identificado (uno por línea):&#10;- Bajo engagement&#10;- Alto CAC&#10;- Poco product-market fit"
              value={formData.problems}
              onChange={(e) => setFormData({ ...formData, problems: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="currentRevenue">Revenue Actual (COP)</Label>
            <Input
              id="currentRevenue"
              type="number"
              placeholder="0"
              value={formData.currentRevenue}
              onChange={(e) => setFormData({ ...formData, currentRevenue: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Datos de Mercado */}
      <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Análisis de Mercado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentMarket">Mercado Actual *</Label>
            <Input
              id="currentMarket"
              type="text"
              placeholder="Ej: Estudiantes universitarios en Colombia"
              value={formData.currentMarket}
              onChange={(e) => setFormData({ ...formData, currentMarket: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="alternativeMarkets">Mercados Alternativos a Evaluar *</Label>
            <Textarea
              id="alternativeMarkets"
              placeholder="Lista los mercados alternativos que quieres evaluar (uno por línea):&#10;- Pequeñas empresas&#10;- Profesionales independientes&#10;- Instituciones educativas"
              value={formData.alternativeMarkets}
              onChange={(e) => setFormData({ ...formData, alternativeMarkets: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="targetMarket">Mercado Objetivo (si ya tienes uno en mente)</Label>
            <Input
              id="targetMarket"
              type="text"
              placeholder="Deja vacío si quieres que la IA lo sugiera"
              value={formData.targetMarket}
              onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Restricciones */}
      <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Restricciones y Recursos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="techStack">Stack Tecnológico</Label>
              <Input
                id="techStack"
                type="text"
                placeholder="Ej: React, Node.js, PostgreSQL"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="techDebt">Deuda Técnica</Label>
              <div className="relative">
                <select
                  id="techDebt"
                  className={`w-full pl-11 pr-10 py-2.5 bg-background border-2 rounded-lg appearance-none cursor-pointer transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none font-medium ${
                    formData.techDebt === 'Baja' ? 'border-green-500/30 hover:border-green-500/50' :
                    formData.techDebt === 'Media' ? 'border-yellow-500/30 hover:border-yellow-500/50' :
                    'border-red-500/30 hover:border-red-500/50'
                  }`}
                  value={formData.techDebt}
                  onChange={(e) => setFormData({ ...formData, techDebt: e.target.value })}
                  style={{
                    color: 'transparent',
                    textShadow: '0 0 0 transparent'
                  }}
                >
                  <option value="Baja" className="bg-background text-foreground py-2">
                    Baja
                  </option>
                  <option value="Media" className="bg-background text-foreground py-2">
                    Media
                  </option>
                  <option value="Alta" className="bg-background text-foreground py-2">
                    Alta
                  </option>
                </select>
                {/* Chevron icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
                {/* Indicador visual del nivel seleccionado con icono y texto */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                  <div className={
                    formData.techDebt === 'Baja' ? 'text-green-500' :
                    formData.techDebt === 'Media' ? 'text-yellow-500' :
                    'text-red-500'
                  }>
                    {formData.techDebt === 'Baja' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : formData.techDebt === 'Media' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${
                    formData.techDebt === 'Baja' ? 'text-green-600 dark:text-green-400' :
                    formData.techDebt === 'Media' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {formData.techDebt}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="teamSize">Tamaño del Equipo</Label>
              <Input
                id="teamSize"
                type="number"
                min="1"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="availableBudget">Presupuesto Disponible (COP)</Label>
              <Input
                id="availableBudget"
                type="number"
                placeholder="0"
                value={formData.availableBudget}
                onChange={(e) => setFormData({ ...formData, availableBudget: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="actualCac">CAC Actual (COP)</Label>
              <Input
                id="actualCac"
                type="number"
                placeholder="0"
                value={formData.actualCac}
                onChange={(e) => setFormData({ ...formData, actualCac: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="actualLtv">LTV Actual (COP)</Label>
              <Input
                id="actualLtv"
                type="number"
                placeholder="0"
                value={formData.actualLtv}
                onChange={(e) => setFormData({ ...formData, actualLtv: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="burnRate">Burn Rate Mensual (COP)</Label>
              <Input
                id="burnRate"
                type="number"
                placeholder="0"
                value={formData.burnRate}
                onChange={(e) => setFormData({ ...formData, burnRate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="runway">Runway (meses)</Label>
              <Input
                id="runway"
                type="number"
                placeholder="0"
                value={formData.runway}
                onChange={(e) => setFormData({ ...formData, runway: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Razón del Pivot */}
      <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Razón del Pivot</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="pivotReason">¿Por qué estás considerando pivotear?</Label>
            <Textarea
              id="pivotReason"
              placeholder="Describe brevemente por qué estás considerando un pivot..."
              value={formData.pivotReason}
              onChange={(e) => setFormData({ ...formData, pivotReason: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón de envío */}
      <Button
        type="submit"
        className="relative w-full overflow-hidden bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 h-auto rounded-xl shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 border border-cyan-500/30 disabled:opacity-70 disabled:cursor-not-allowed group"
        disabled={isLoading}
        data-tutorial="analyze-button"
      >
        {/* Efecto de brillo animado */}
        {!isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
        )}
        
        {/* Contenido del botón */}
        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
          {isLoading ? (
            <>
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/20 backdrop-blur-sm shadow-md">
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin drop-shadow-sm" />
              </div>
              <span className="font-semibold tracking-wide drop-shadow-sm">Analizando...</span>
            </>
          ) : (
            <>
              <div className="p-1.5 sm:p-2 rounded-lg bg-white/20 group-hover:bg-white/30 backdrop-blur-sm transition-all duration-300 shadow-md group-hover:scale-105">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow-sm" />
              </div>
              <span className="font-semibold tracking-wide drop-shadow-sm">Iniciar Análisis de Pivot</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow-sm group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
            </>
          )}
        </div>
        
        {/* Efecto de partículas decorativas */}
        {!isLoading && (
          <>
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white/40 rounded-full group-hover:bg-white/60 transition-all duration-300"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/30 rounded-full group-hover:bg-white/50 transition-all duration-300"></div>
          </>
        )}
      </Button>
    </form>
  );
}
