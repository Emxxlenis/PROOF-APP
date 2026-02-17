'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Calendar, Target, AlertCircle, DollarSign } from 'lucide-react';

interface PivotValidationPlanProps {
  validation: any;
}

export function PivotValidationPlan({ validation }: PivotValidationPlanProps) {
  if (!validation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan de Validación</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay plan de validación disponible.</p>
        </CardContent>
      </Card>
    );
  }

  const hypotheses = validation.critical_hypotheses || [];
  const validationPlan = validation.quick_validation_plan || {};
  const keyMetrics = validation.key_metrics || [];
  const goNoGoCriteria = validation.go_no_go_criteria || 'No especificado';

  return (
    <div className="space-y-6">
      {/* Hipótesis Críticas mejoradas */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            Hipótesis Críticas a Validar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hypotheses.length === 0 ? (
            <p className="text-muted-foreground">No hay hipótesis definidas.</p>
          ) : (
            <div className="space-y-4">
              {hypotheses.map((hypothesis: any, index: number) => (
                <Card key={index} className="border-2 border-l-4 border-l-primary border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:shadow-lg transition-all">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                          {index + 1}
                        </div>
                        <h4 className="font-bold text-lg">Hipótesis {index + 1}</h4>
                      </div>
                      <Badge className="bg-primary/10 text-primary border border-primary/20 font-semibold px-3 py-1">
                        {hypothesis.days_to_validate || 'N/A'} días
                      </Badge>
                    </div>
                    <p className="text-foreground mb-4 leading-relaxed font-medium">{hypothesis.hypothesis}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                        <div className="font-semibold text-muted-foreground mb-1">Método de Validación:</div>
                        <div className="text-foreground font-medium">{hypothesis.validation_method || 'No especificado'}</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                        <div className="font-semibold text-muted-foreground mb-1">Tamaño de Muestra:</div>
                        <div className="text-foreground font-medium">{hypothesis.sample_size || 'N/A'} personas</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="font-semibold text-muted-foreground mb-2">Criterio de Éxito:</div>
                      <div className="text-foreground bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-500/20">{hypothesis.success_criteria || 'No especificado'}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline de Validación mejorado */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            Timeline de Validación (2 Semanas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(validationPlan).length === 0 ? (
            <p className="text-muted-foreground">No hay timeline disponible.</p>
          ) : (
            <div className="space-y-6">
              {validationPlan.week_1 && (
                <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border-2 border-primary/20">
                  <h4 className="font-bold mb-4 text-primary flex items-center gap-2 text-lg">
                    <div className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">1</div>
                    Semana 1
                  </h4>
                  {typeof validationPlan.week_1 === 'string' ? (
                    <p className="text-foreground leading-relaxed">{validationPlan.week_1}</p>
                  ) : (
                    <div className="space-y-3">
                      {validationPlan.week_1.days_1_3 && (
                        <div className="pl-4 border-l-4 border-primary bg-muted/30 p-3 rounded-r-lg">
                          <div className="font-bold text-sm text-primary mb-1">Días 1-3:</div>
                          <p className="text-foreground leading-relaxed">{validationPlan.week_1.days_1_3}</p>
                        </div>
                      )}
                      {validationPlan.week_1.days_4_7 && (
                        <div className="pl-4 border-l-4 border-primary bg-muted/30 p-3 rounded-r-lg">
                          <div className="font-bold text-sm text-primary mb-1">Días 4-7:</div>
                          <p className="text-foreground leading-relaxed">{validationPlan.week_1.days_4_7}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {validationPlan.week_2 && (
                <div className="bg-gradient-to-r from-purple-500/5 to-transparent p-4 rounded-lg border-2 border-purple-500/20">
                  <h4 className="font-bold mb-4 text-purple-600 flex items-center gap-2 text-lg">
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center">2</div>
                    Semana 2
                  </h4>
                  {typeof validationPlan.week_2 === 'string' ? (
                    <p className="text-foreground leading-relaxed">{validationPlan.week_2}</p>
                  ) : (
                    <div className="space-y-3">
                      {validationPlan.week_2.days_8_10 && (
                        <div className="pl-4 border-l-4 border-purple-600 bg-muted/30 p-3 rounded-r-lg">
                          <div className="font-bold text-sm text-purple-600 mb-1">Días 8-10:</div>
                          <p className="text-foreground leading-relaxed">{validationPlan.week_2.days_8_10}</p>
                        </div>
                      )}
                      {validationPlan.week_2.days_11_14 && (
                        <div className="pl-4 border-l-4 border-purple-600 bg-muted/30 p-3 rounded-r-lg">
                          <div className="font-bold text-sm text-purple-600 mb-1">Días 11-14:</div>
                          <p className="text-foreground leading-relaxed">{validationPlan.week_2.days_11_14}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas Clave mejoradas */}
      {keyMetrics.length > 0 && (
        <Card className="border border-purple-200/60 bg-gradient-to-br from-purple-50/50 via-violet-50/30 to-fuchsia-50/30 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-500/20 border border-purple-300/40 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              Métricas Clave a Medir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {keyMetrics.map((metric: string, index: number) => (
                <Badge 
                  key={index} 
                  className="group relative overflow-hidden text-sm py-2.5 px-5 bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border border-purple-400/30 font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg hover:scale-105"
                >
                  {/* Efecto de brillo sutil */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <span className="relative z-10 drop-shadow-sm">{metric}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criterios Go/No-Go mejorados */}
      <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            Criterios Go/No-Go
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed font-medium bg-background/80 p-4 rounded-lg border border-border/50">{goNoGoCriteria}</p>
        </CardContent>
      </Card>

      {/* Costo Estimado mejorado */}
      {validation.estimated_cost && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              Recursos Necesarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 rounded-lg border border-primary/20">
              <div className="font-semibold text-muted-foreground mb-2">Costo Estimado:</div>
              <div className="text-3xl font-bold text-primary">
                {(() => {
                  let costNumber: number;
                  let currency: string = '';
                  
                  // Si estimated_cost es un string, extraer el número y la moneda
                  if (typeof validation.estimated_cost === 'string') {
                    // Buscar número en el string (puede tener comas o puntos como separadores de miles)
                    const numberMatch = validation.estimated_cost.match(/[\d,\.]+/);
                    // Buscar moneda (priorizar la primera que aparezca antes del paréntesis o al final)
                    const currencyMatch = validation.estimated_cost.match(/\b(COP|USD)\b/i);
                    
                    if (numberMatch) {
                      costNumber = parseFloat(numberMatch[0].replace(/,/g, '').replace(/\./g, ''));
                      // Si hay moneda en el string, usar la primera encontrada
                      if (currencyMatch) {
                        currency = currencyMatch[1].toUpperCase();
                      } else {
                        // Si no hay moneda, determinar basándose en el valor
                        currency = costNumber > 1000 ? 'COP' : 'USD';
                      }
                      return `$${costNumber.toLocaleString()} ${currency}`;
                    }
                    // Si no se puede extraer número, intentar limpiar el string
                    return validation.estimated_cost;
                  }
                  
                  // Si es un número, determinar la moneda
                  costNumber = typeof validation.estimated_cost === 'number' 
                    ? validation.estimated_cost 
                    : parseFloat(String(validation.estimated_cost));
                  
                  if (isNaN(costNumber)) {
                    return String(validation.estimated_cost);
                  }
                  
                  currency = costNumber > 1000 ? 'COP' : 'USD';
                  return `$${costNumber.toLocaleString()} ${currency}`;
                })()}
              </div>
            </div>
            {validation.resources_needed && validation.resources_needed.length > 0 && (
              <div>
                <div className="font-semibold text-muted-foreground mb-3">Recursos Necesarios:</div>
                <ul className="space-y-2">
                  {validation.resources_needed.map((resource: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-foreground">{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
