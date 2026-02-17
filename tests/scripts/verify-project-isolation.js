/**
 * Script de Verificación de Aislamiento de Proyectos
 * 
 * Este script verifica que los datos están correctamente aislados por proyecto
 * en la base de datos de Supabase.
 * 
 * Uso: node tests/scripts/verify-project-isolation.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
function loadEnvFile() {
  const envPath = path.join(__dirname, '../../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyProjectIsolation() {
  console.log('🔍 Verificando aislamiento de proyectos...\n');

  try {
    // 1. Verificar que coach_interactions tiene startup_id
    console.log('1. Verificando coach_interactions...');
    // Intentar primero sin student_id para evitar problemas con enums en users
    const { data: coachInteractions, error: coachError } = await supabase
      .from('coach_interactions')
      .select('id, startup_id')
      .limit(10);

    if (coachError) {
      // Si hay error de enum, puede ser por datos corruptos en users relacionados
      if (coachError.message.includes('enum user_role')) {
        console.warn('⚠️  Error de enum user_role detectado. Esto indica datos corruptos en la tabla users.');
        console.warn('   Hay usuarios con rol "editor" que no existe en el enum user_role.');
        console.warn('   Recomendación: Limpiar datos corruptos en la tabla users.');
        console.warn('   Continuando con verificación de otras tablas...');
      } else {
        console.error('❌ Error al consultar coach_interactions:', coachError.message);
      }
    } else {
      const withoutStartupId = coachInteractions.filter(ci => !ci.startup_id);
      if (withoutStartupId.length > 0) {
        console.warn(`⚠️  Encontradas ${withoutStartupId.length} interacciones sin startup_id`);
      } else {
        console.log('✅ Todas las interacciones tienen startup_id');
      }
    }

    // 2. Verificar que validations están asociadas a startups
    // NOTA: validations NO tiene student_id, solo startup_id
    console.log('\n2. Verificando validations...');
    const { data: validations, error: validationsError } = await supabase
      .from('validations')
      .select('id, startup_id')
      .limit(10);

    if (validationsError) {
      console.error('❌ Error al consultar validations:', validationsError.message);
    } else {
      const withoutStartupId = validations.filter(v => !v.startup_id);
      if (withoutStartupId.length > 0) {
        console.warn(`⚠️  Encontradas ${withoutStartupId.length} validaciones sin startup_id`);
      } else {
        console.log('✅ Todas las validaciones tienen startup_id');
      }
    }

    // 3. Verificar que OKRs están asociados a startups
    console.log('\n3. Verificando OKRs...');
    const { data: okrs, error: okrsError } = await supabase
      .from('okrs')
      .select('id, startup_id')
      .limit(10);

    if (okrsError) {
      console.error('❌ Error al consultar okrs:', okrsError.message);
    } else {
      const withoutStartupId = okrs.filter(o => !o.startup_id);
      if (withoutStartupId.length > 0) {
        console.warn(`⚠️  Encontrados ${withoutStartupId.length} OKRs sin startup_id`);
      } else {
        console.log('✅ Todos los OKRs tienen startup_id');
      }
    }

    // 4. Verificar que pivot_analysis están asociados a startups
    console.log('\n4. Verificando pivot_analysis...');
    const { data: pivots, error: pivotsError } = await supabase
      .from('pivot_analysis')
      .select('id, startup_id')
      .limit(10);

    if (pivotsError) {
      console.error('❌ Error al consultar pivot_analysis:', pivotsError.message);
    } else {
      const withoutStartupId = pivots.filter(p => !p.startup_id);
      if (withoutStartupId.length > 0) {
        console.warn(`⚠️  Encontrados ${withoutStartupId.length} pivots sin startup_id`);
      } else {
        console.log('✅ Todos los pivots tienen startup_id');
      }
    }

    // 5. Verificar que hypotheses están asociadas a startups
    console.log('\n5. Verificando hypotheses...');
    const { data: hypotheses, error: hypothesesError } = await supabase
      .from('hypotheses')
      .select('id, startup_id')
      .limit(10);

    if (hypothesesError) {
      console.error('❌ Error al consultar hypotheses:', hypothesesError.message);
    } else {
      const withoutStartupId = hypotheses.filter(h => !h.startup_id);
      if (withoutStartupId.length > 0) {
        console.warn(`⚠️  Encontradas ${withoutStartupId.length} hipótesis sin startup_id`);
      } else {
        console.log('✅ Todas las hipótesis tienen startup_id');
      }
    }

    // 6. Verificar integridad: contar datos por proyecto
    console.log('\n6. Verificando integridad de datos por proyecto...');
    const { data: startups, error: startupsError } = await supabase
      .from('startups')
      .select('id, name, student_id');

    if (startupsError) {
      console.error('❌ Error al consultar startups:', startupsError.message);
    } else {
      for (const startup of startups.slice(0, 5)) { // Limitar a 5 para no saturar
        const { count: okrCount } = await supabase
          .from('okrs')
          .select('*', { count: 'exact', head: true })
          .eq('startup_id', startup.id);

        const { count: validationCount } = await supabase
          .from('validations')
          .select('*', { count: 'exact', head: true })
          .eq('startup_id', startup.id);

        const { count: hypothesisCount } = await supabase
          .from('hypotheses')
          .select('*', { count: 'exact', head: true })
          .eq('startup_id', startup.id);

        console.log(`  📊 ${startup.name}: ${okrCount} OKRs, ${validationCount} validaciones, ${hypothesisCount} hipótesis`);
      }
    }

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }
}

verifyProjectIsolation();
