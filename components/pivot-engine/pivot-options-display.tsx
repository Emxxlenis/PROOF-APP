'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Code, DollarSign, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface PivotOptionsDisplayProps {
  analysis: any;
}

export function PivotOptionsDisplay({ analysis }: PivotOptionsDisplayProps) {
  const options = analysis.orchestratorRecommendation?.pivot_options_ranked || [];

  if (options.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Opciones de Pivot</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay opciones disponibles para mostrar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vista de Comparación Rápida */}
      <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Comparación Rápida de Opciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-blue-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Opción</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Éxito</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Mercado</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Técnico</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Financiero</th>
                </tr>
              </thead>
              <tbody>
                {options.map((option: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Badge className={`${
                          index === 0 ? 'bg-green-500' :
                          index === 1 ? 'bg-blue-500' :
                          'bg-purple-500'
                        } text-white`}>
                          #{index + 1}
                        </Badge>
                        <span className="font-medium text-gray-800">{option.option_name || `Opción ${index + 1}`}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-green-600' :
                        index === 1 ? 'text-blue-600' :
                        'text-purple-600'
                      }`}>
                        {option.success_probability || option.overall_score || 0}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-gray-700">{option.market_fit_probability || 'N/A'}%</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-gray-700">{option.technical_feasibility || 'N/A'}%</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-gray-700">{option.financial_viability || 'N/A'}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detalles de cada opción */}
      {options.map((option: any, index: number) => (
        <Card
          key={index}
          className={`border-2 relative overflow-hidden transition-all duration-300 hover:shadow-xl bg-white/80 backdrop-blur-sm ${
            index === 0
              ? 'border-green-500/50 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-green-950/30'
              : index === 1
              ? 'border-blue-500/50 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-blue-950/30'
              : 'border-purple-500/50 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-purple-950/30'
          }`}
        >
          {index === 0 && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-2xl"></div>
          )}
          {index === 1 && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
          )}
          {index === 2 && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
          )}
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  className={`text-white font-bold px-3 py-1 shadow-md ${
                    index === 0
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                      : index === 1
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600'
                  }`}
                >
                  #{index + 1}
                </Badge>
                <CardTitle className="text-xl font-bold">{option.option_name || `Opción ${index + 1}`}</CardTitle>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold mb-1 ${
                  index === 0 ? 'text-green-600' :
                  index === 1 ? 'text-blue-600' :
                  'text-purple-600'
                }`}>
                  {option.success_probability || option.overall_score || 0}%
                </div>
                <div className="text-xs text-muted-foreground font-medium">Probabilidad de éxito</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            {/* Rationale mejorado */}
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg border border-border/50">
              <h4 className="font-bold mb-3 flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                ¿Por qué esta opción?
              </h4>
              <p className="text-foreground leading-relaxed">{option.rationale || 'Sin rationale disponible'}</p>
            </div>

            {/* Métricas clave mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-lg transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Mercado</div>
                      <div className="text-2xl font-bold text-green-600">{option.market_fit_probability || 'N/A'}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 hover:shadow-lg transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Code className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Técnico</div>
                      <div className="text-2xl font-bold text-blue-600">{option.technical_feasibility || 'N/A'}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20 hover:shadow-lg transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Financiero</div>
                      <div className="text-2xl font-bold text-orange-600">{option.financial_viability || 'N/A'}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Plan de acción mejorado */}
            {option.action_plan_2_weeks && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    Plan de Acción (2 Semanas)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {typeof option.action_plan_2_weeks === 'string' ? (
                    <p className="text-foreground leading-relaxed">{option.action_plan_2_weeks}</p>
                  ) : (
                    <div className="space-y-4">
                      {option.action_plan_2_weeks.week_1 && (
                        <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                          <div className="font-bold mb-3 flex items-center gap-2 text-primary">
                            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">1</div>
                            Semana 1
                          </div>
                          <ul className="space-y-2">
                            {Array.isArray(option.action_plan_2_weeks.week_1)
                              ? option.action_plan_2_weeks.week_1.map((action: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-foreground">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{action}</span>
                                  </li>
                                ))
                              : Object.values(option.action_plan_2_weeks.week_1).map((action: any, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-foreground">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{String(action)}</span>
                                  </li>
                                ))}
                          </ul>
                        </div>
                      )}
                      {option.action_plan_2_weeks.week_2 && (
                        <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                          <div className="font-bold mb-3 flex items-center gap-2 text-primary">
                            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">2</div>
                            Semana 2
                          </div>
                          <ul className="space-y-2">
                            {Array.isArray(option.action_plan_2_weeks.week_2)
                              ? option.action_plan_2_weeks.week_2.map((action: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-foreground">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{action}</span>
                                  </li>
                                ))
                              : Object.values(option.action_plan_2_weeks.week_2).map((action: any, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-foreground">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{String(action)}</span>
                                  </li>
                                ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Riesgos críticos mejorados */}
            {option.critical_risks && option.critical_risks.length > 0 && (
              <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/20 dark:to-red-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    Riesgos Críticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {option.critical_risks.map((risk: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/80 border border-orange-500/20">
                        <span className="text-orange-600 mt-1 font-bold">⚠</span>
                        <span className="text-foreground leading-relaxed">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Métricas críticas mejoradas */}
            {option.critical_metrics && option.critical_metrics.length > 0 && (
              <Card className="border border-purple-200/60 bg-gradient-to-br from-purple-50/50 via-violet-50/30 to-fuchsia-50/30 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-500/20 border border-purple-300/40 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    </div>
                    Métricas Clave a Medir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {option.critical_metrics.map((metric: string, i: number) => (
                      <Badge 
                        key={i} 
                        className="group relative overflow-hidden text-sm sm:text-base py-3 px-4 sm:px-5 bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border border-purple-400/30 font-medium shadow-md hover:shadow-lg transition-all duration-300 rounded-lg hover:scale-[1.02] inline-block"
                      >
                        {/* Efecto de brillo sutil */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <span className="relative z-10 drop-shadow-sm leading-relaxed break-words whitespace-normal text-center inline-block max-w-full">
                          {metric}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
