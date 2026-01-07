/**
 * Script para depurar inscripciones en la base de datos
 * Ejecutar con: npm run debug:enrollment
 */

import { db } from "@/db/client";
import { enrollments, members, users, dues } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

async function debugLatestEnrollment() {
  console.log('🔍 [DEBUG] Buscando última inscripción creada...\n');

  try {
    // Obtener la última inscripción creada
    const latestEnrollment = await db
      .select({
        enrollments,
        members: {
          id: members.id,
          documentNumber: members.documentNumber,
          status: members.status,
          createdAt: members.createdAt,
          updatedAt: members.updatedAt,
        },
        users: {
          name: users.name,
          email: users.email,
        },
      })
      .from(enrollments)
      .innerJoin(members, eq(enrollments.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .orderBy(desc(enrollments.createdAt))
      .limit(1);

    if (!latestEnrollment.length) {
      console.log('❌ No se encontraron inscripciones');
      return;
    }

    const enrollment = latestEnrollment[0];
    const enrollmentData = enrollment.enrollments;
    const memberData = enrollment.members;
    const userData = enrollment.users;

    console.log('📋 [DEBUG] Datos de la inscripción:');
    console.log('├─ ID:', enrollmentData.id);
    console.log('├─ Member ID:', enrollmentData.memberId);
    console.log('├─ Start Date (BD):', enrollmentData.startDate);
    console.log('├─ Start Date (tipo):', typeof enrollmentData.startDate);
    console.log('├─ Plan Name:', enrollmentData.planName);
    console.log('├─ Monthly Amount:', enrollmentData.monthlyAmount);
    console.log('├─ Status:', enrollmentData.status);
    console.log('├─ Notes:', enrollmentData.notes);
    console.log('├─ Created At (BD):', enrollmentData.createdAt);
    console.log('├─ Updated At (BD):', enrollmentData.updatedAt);
    console.log('└─ Created At (tipo):', typeof enrollmentData.createdAt);

    console.log('\n👤 [DEBUG] Datos del socio:');
    console.log('├─ ID:', memberData.id);
    console.log('├─ Name:', userData.name);
    console.log('├─ Email:', userData.email);
    console.log('├─ Document:', memberData.documentNumber);
    console.log('├─ Status:', memberData.status);
    console.log('├─ Member Created At:', memberData.createdAt);
    console.log('└─ Member Updated At:', memberData.updatedAt);

    // Obtener primeras 5 cuotas generadas
    const firstDues = await db
      .select()
      .from(dues)
      .where(eq(dues.enrollmentId, enrollmentData.id))
      .orderBy(dues.dueDate)
      .limit(5);

    if (firstDues.length > 0) {
      console.log('\n💰 [DEBUG] Primeras 5 cuotas generadas:');
      firstDues.forEach((due, index) => {
        console.log(`├─ Cuota ${index + 1}:`);
        console.log(`│  ├─ ID: ${due.id}`);
        console.log(`│  ├─ Due Date (BD): ${due.dueDate}`);
        console.log(`│  ├─ Due Date (tipo): ${typeof due.dueDate}`);
        console.log(`│  ├─ Amount: ${due.amount}`);
        console.log(`│  ├─ Status: ${due.status}`);
        console.log(`│  └─ Created At: ${due.createdAt}`);
      });
    }

    // Verificación de timezone
    console.log('\n🌍 [DEBUG] Información de timezone:');
    console.log('├─ Fecha y hora actual:', new Date().toString());
    console.log('├─ ISO String:', new Date().toISOString());
    console.log('├─ Local String:', new Date().toLocaleString('es-AR'));
    console.log('├─ Timezone Offset:', new Date().getTimezoneOffset(), 'minutos');
    console.log('└─ Timezone Offset (horas):', new Date().getTimezoneOffset() / 60);

    // Validación de formato de fecha
    console.log('\n🧪 [DEBUG] Validación de formato de fecha:');
    const startDate = enrollmentData.startDate;
    console.log('├─ Es string:', typeof startDate === 'string');
    console.log('├─ Contiene T:', startDate.includes('T'));
    console.log('├─ Formato YYYY-MM-DD:', /^\d{4}-\d{2}-\d{2}$/.test(startDate));
    
    if (typeof startDate === 'string' && !startDate.includes('T')) {
      const [year, month, day] = startDate.split('-');
      console.log('├─ Parseado - Año:', year);
      console.log('├─ Parseado - Mes:', month);
      console.log('├─ Parseado - Día:', day);
      console.log('└─ Formato DD/MM/YYYY:', `${day}/${month}/${year}`);
    }

  } catch (error) {
    console.error('❌ [DEBUG] Error al consultar inscripciones:', error);
  }
}

// Ejecutar la función
debugLatestEnrollment().catch(console.error);
