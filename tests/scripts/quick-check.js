/**
 * Quick Check Script
 * 
 * Verificación rápida de funcionalidades críticas sin necesidad de base de datos
 * 
 * Uso: node tests/scripts/quick-check.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificación Rápida de Funcionalidades\n');

let errors = [];
let warnings = [];

// 1. Verificar que useSelectedProject existe y tiene las funciones necesarias
console.log('1. Verificando useSelectedProject hook...');
const hookPath = path.join(__dirname, '../../lib/hooks/useSelectedProject.ts');
if (fs.existsSync(hookPath)) {
  const hookContent = fs.readFileSync(hookPath, 'utf8');
  
  const requiredFunctions = [
    'selectProject',
    'selectedProjectId',
    'projects',
  ];
  
  requiredFunctions.forEach(func => {
    if (hookContent.includes(func)) {
      console.log(`   ✅ ${func} encontrado`);
    } else {
      errors.push(`   ❌ ${func} no encontrado en useSelectedProject`);
    }
  });
  
  // Verificar que escucha eventos
  if (hookContent.includes('project-selected') && hookContent.includes('storage')) {
    console.log('   ✅ Eventos de sincronización configurados');
  } else {
    warnings.push('   ⚠️  Puede faltar sincronización de eventos');
  }
} else {
  errors.push('   ❌ useSelectedProject.ts no encontrado');
}

// 2. Verificar que las páginas principales usan useSelectedProject
console.log('\n2. Verificando uso de useSelectedProject en páginas...');
const pagesToCheck = [
  { path: 'app/dashboard/page.tsx', name: 'Dashboard' },
  { path: 'app/dashboard/startup-builder/page.tsx', name: 'Startup Builder' },
  { path: 'app/dashboard/validation/page.tsx', name: 'Validation' },
  { path: 'app/dashboard/hypothesis/page.tsx', name: 'Hypothesis' },
  { path: 'app/dashboard/pivots/page.tsx', name: 'Pivots' },
  { path: 'app/dashboard/okrs/page.tsx', name: 'OKRs' },
  { path: 'app/dashboard/metrics/page.tsx', name: 'Metrics' },
  { path: 'app/vitacoach/page.tsx', name: 'VitaCoach' },
  { path: 'app/ideapivotengine/page.tsx', name: 'Pivot Engine' },
];

pagesToCheck.forEach(page => {
  const pagePath = path.join(__dirname, '../../', page.path);
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    if (content.includes('useSelectedProject')) {
      console.log(`   ✅ ${page.name} usa useSelectedProject`);
      
      // Verificar que usa selectedProjectId
      if (content.includes('selectedProjectId')) {
        console.log(`      ✅ ${page.name} usa selectedProjectId`);
      } else {
        warnings.push(`      ⚠️  ${page.name} no usa selectedProjectId`);
      }
    } else {
      errors.push(`   ❌ ${page.name} NO usa useSelectedProject`);
    }
  } else {
    warnings.push(`   ⚠️  ${page.name} no encontrado en ${page.path}`);
  }
});

// 3. Verificar que las consultas filtran por startup_id
console.log('\n3. Verificando filtrado por startup_id en consultas...');
const criticalQueries = [
  { file: 'app/vitacoach/page.tsx', query: 'coach_interactions', field: 'startup_id' },
  { file: 'app/dashboard/okrs/page.tsx', query: 'okrs', field: 'startup_id' },
  { file: 'app/dashboard/validation/page.tsx', query: 'hypotheses', field: 'startup_id' },
  { file: 'app/dashboard/pivots/page.tsx', query: 'pivot_analysis', field: 'startup_id' },
];

criticalQueries.forEach(check => {
  const filePath = path.join(__dirname, '../../', check.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasQuery = content.includes(`.from("${check.query}")`);
    const hasFilter = content.includes(`.eq("${check.field}"`);
    
    if (hasQuery && hasFilter) {
      console.log(`   ✅ ${check.file} filtra ${check.query} por ${check.field}`);
    } else if (hasQuery && !hasFilter) {
      errors.push(`   ❌ ${check.file} consulta ${check.query} pero NO filtra por ${check.field}`);
    }
  }
});

// 4. Verificar migración de coach_interactions
console.log('\n4. Verificando migración de coach_interactions...');
const migrationPath = path.join(__dirname, '../../supabase/migrations/029_add_startup_id_to_coach_interactions.sql');
if (fs.existsSync(migrationPath)) {
  console.log('   ✅ Migración 029 encontrada');
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  if (migrationContent.includes('startup_id')) {
    console.log('   ✅ Migración incluye startup_id');
  } else {
    errors.push('   ❌ Migración no incluye startup_id');
  }
} else {
  warnings.push('   ⚠️  Migración 029 no encontrada');
}

// 5. Verificar que el selector de proyecto existe en el layout
console.log('\n5. Verificando selector de proyecto en layout...');
const layoutPath = path.join(__dirname, '../../app/dashboard/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const hasUseSelectedProject = layoutContent.includes('useSelectedProject');
  const hasSelectProject = layoutContent.includes('selectProject');
  const hasSelectedProject = layoutContent.includes('selectedProject');
  const hasDropdown = layoutContent.includes('DropdownMenu') && layoutContent.includes('projects');
  
  if (hasUseSelectedProject && hasSelectProject && hasSelectedProject && hasDropdown) {
    console.log('   ✅ Selector de proyecto encontrado en layout');
    console.log('      ✅ Usa useSelectedProject hook');
    console.log('      ✅ Tiene función selectProject');
    console.log('      ✅ Tiene DropdownMenu para proyectos');
  } else {
    warnings.push('   ⚠️  Selector de proyecto puede no estar completamente implementado en el layout');
  }
}

// Resumen
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Todas las verificaciones pasaron correctamente');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`❌ ${errors.length} error(es) encontrado(s):\n`);
    errors.forEach(error => console.log(error));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} advertencia(s):\n`);
    warnings.forEach(warning => console.log(warning));
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
}
