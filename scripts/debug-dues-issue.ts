import { db } from "../src/db/client";
import { dues, members, users, enrollments } from "../src/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

async function debugDuesIssue() {
  console.log("🔍 [DEBUG] Analizando el problema de cuotas...");
  
  try {
    // 1. Obtener todos los socios
    const allMembers = await db
      .select({
        member: {
          id: members.id,
          name: users.name,
          email: users.email,
          documentNumber: members.documentNumber,
        },
        enrollment: {
          id: enrollments.id,
          planName: enrollments.planName,
          monthlyAmount: enrollments.monthlyAmount,
          startDate: enrollments.startDate,
        },
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .leftJoin(enrollments, eq(enrollments.memberId, members.id))
      .orderBy(users.name);

    console.log(`📊 [DEBUG] Encontrados ${allMembers.length} socios`);
    
    for (const member of allMembers) {
      console.log(`\n👤 [DEBUG] Socio: ${member.member.name} (${member.member.documentNumber})`);
      console.log(`   📧 Email: ${member.member.email}`);
      console.log(`   📋 Inscripción: ${member.enrollment?.planName || 'Sin inscripción'}`);
      console.log(`   💰 Mensualidad: $${member.enrollment?.monthlyAmount || 0}`);
      console.log(`   📅 Fecha inicio: ${member.enrollment?.startDate || 'N/A'}`);
      
      // Obtener contadores reales
      const [total, paid, pending] = await Promise.all([
        db.select({ count: count() }).from(dues).where(eq(dues.memberId, member.member.id)),
        db.select({ count: count() }).from(dues).where(and(eq(dues.memberId, member.member.id), eq(dues.status, 'PAID'))),
        db.select({ count: count() }).from(dues).where(and(eq(dues.memberId, member.member.id), eq(dues.status, 'PENDING'))),
      ]);
      
      console.log(`   📈 Total cuotas: ${total[0]?.count || 0}`);
      console.log(`   ✅ Pagadas: ${paid[0]?.count || 0}`);
      console.log(`   ⏳ Pendientes: ${pending[0]?.count || 0}`);
      
      // Verificar si debería tener 360 cuotas
      const expectedDues = 360;
      const actualDues = total[0]?.count || 0;
      
      if (actualDues !== expectedDues) {
        console.log(`   ⚠️  INCONSISTENCIA: Debería tener ${expectedDues} cuotas, tiene ${actualDues}`);
        
        // Mostrar primeras y últimas cuotas para diagnóstico
        const firstDue = await db
          .select()
          .from(dues)
          .where(eq(dues.memberId, member.member.id))
          .orderBy(dues.dueDate)
          .limit(1);
          
        const lastDue = await db
          .select()
          .from(dues)
          .where(eq(dues.memberId, member.member.id))
          .orderBy(dues.dueDate)
          .limit(1)
          .offset(Math.max(0, actualDues - 1));
        
        if (firstDue.length > 0) {
          console.log(`   📅 Primera cuota: ${firstDue[0].dueDate} (${firstDue[0].status})`);
        }
        if (lastDue.length > 0) {
          console.log(`   📅 Última cuota: ${lastDue[0].dueDate} (${lastDue[0].status})`);
        }
      } else {
        console.log(`   ✅ CORRECTO: Tiene las ${expectedDues} cuotas esperadas`);
      }
    }
    
    // 2. Verificar si hay inscripciones sin cuotas
    const enrollmentsWithoutDues = await db
      .select({
        enrollment: enrollments,
        member: {
          name: users.name,
          documentNumber: members.documentNumber,
        },
      })
      .from(enrollments)
      .innerJoin(members, eq(enrollments.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(sql`NOT EXISTS (
        SELECT 1 FROM ${dues} WHERE ${dues.enrollmentId} = ${enrollments.id}
      )`);
    
    if (enrollmentsWithoutDues.length > 0) {
      console.log(`\n⚠️  [DEBUG] Inscripciones sin cuotas: ${enrollmentsWithoutDues.length}`);
      for (const item of enrollmentsWithoutDues) {
        console.log(`   ${item.member.name} (${item.member.documentNumber}) - Inscripción ${item.enrollment.id}`);
      }
    }
    
  } catch (error) {
    console.error("❌ [DEBUG] Error:", error);
  }
}

debugDuesIssue().then(() => {
  console.log("\n✅ [DEBUG] Análisis completado");
  process.exit(0);
}).catch((error) => {
  console.error("❌ [DEBUG] Error en análisis:", error);
  process.exit(1);
});
