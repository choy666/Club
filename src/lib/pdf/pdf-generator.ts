import jsPDF from "jspdf";
import { formatDateDDMMYYYY } from "@/lib/utils/date-utils";

interface Member {
  id: number;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  estado: "activo" | "inactivo" | "pendiente" | "vitalicio";
  estadoCompleto:
    | "Vitalicio Activo"
    | "Vitalicio Inactivo"
    | "Regular Activo"
    | "Regular Inactivo"
    | "Pendiente"
    | "Inactivo";
  estadoCuota: "al_dia" | "deudor";
  fechaIngreso: string;
  plan: "mensual" | "anual" | "vitalicio";
  ultimaCuota: string | null;
  fechaInscripcion: string | null;
  fechaCobertura: string | null;
  cuotasPagadas: number;
  cuotasPendientes: number;
}

interface PDFConfig {
  title: string;
  filters: {
    search: string;
    statusFilter: string;
    debtFilter: string;
  };
  totalRecords: number;
  generatedAt: string;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private lineHeight: number = 7;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: "landscape", // Horizontal para visualizar toda la tabla
      unit: "mm",
      format: "a4", // A4 landscape para mejor aprovechamiento
    });
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = this.margin;
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  private checkPageBreak(requiredHeight: number): void {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin) {
      this.addNewPage();
    }
  }

  private setFont(size: number = 12, style: "normal" | "bold" = "normal"): void {
    this.doc.setFontSize(size);
    this.doc.setFont("helvetica", style);
  }

  private addText(text: string, x: number, y: number, options?: { align?: "left" | "center" | "right" }): void {
    this.doc.text(text, x, y, options);
  }

  private addHeader(config: PDFConfig): void {
    // Título principal
    this.setFont(20, "bold");
    this.addText(config.title, this.pageWidth / 2, this.currentY, { align: "center" });
    this.currentY += 15;

    // Información del reporte
    this.setFont(10, "normal");
    this.addText(`Fecha de generación: ${config.generatedAt}`, this.margin, this.currentY);
    this.currentY += 6;
    this.addText(`Total de registros: ${config.totalRecords}`, this.margin, this.currentY);
    this.currentY += 6;

    // Filtros aplicados
    const activeFilters = [];
    if (config.filters.search) activeFilters.push(`Búsqueda: ${config.filters.search}`);
    if (config.filters.statusFilter) activeFilters.push(`Estado: ${config.filters.statusFilter}`);
    if (config.filters.debtFilter) activeFilters.push(`Cuotas: ${config.filters.debtFilter}`);

    if (activeFilters.length > 0) {
      this.addText(`Filtros: ${activeFilters.join(" | ")}`, this.margin, this.currentY);
      this.currentY += 6;
    }

    // Línea separadora
    this.currentY += 5;
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addTableHeader(): void {
    this.checkPageBreak(15);

    this.setFont(9, "bold"); // 9pt para landscape
    const headers = [
      { text: "Nombre", x: this.margin },
      { text: "DNI", x: 60 },
      { text: "Email", x: 90 },
      { text: "Estado", x: 140 },
      { text: "F. Inscripción", x: 185 },
      { text: "F. Cobertura", x: 225 },
      { text: "Cuotas", x: 265 },
    ];

    headers.forEach(header => {
      this.addText(header.text, header.x, this.currentY);
    });

    this.currentY += 10;

    // Línea bajo el encabezado
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 5;
  }

  private addMemberRow(member: Member): void {
    this.checkPageBreak(12);

    this.setFont(8, "normal"); // 8pt para landscape

    // Nombre (truncado si es muy largo)
    const nombre = member.nombre.length > 15 ? member.nombre.substring(0, 12) + "..." : member.nombre;
    this.addText(nombre, this.margin, this.currentY);

    // DNI
    this.addText(member.dni, 60, this.currentY);

    // Email (truncado)
    const email = member.email.length > 18 ? member.email.substring(0, 15) + "..." : member.email;
    this.addText(email, 90, this.currentY);

    // Estado completo con color
    // Color según estado
    if (member.estadoCompleto.includes("Vitalicio")) {
      this.doc.setTextColor(139, 69, 19); // Marrón
    } else if (member.estadoCompleto.includes("Activo")) {
      this.doc.setTextColor(34, 139, 34); // Verde
    } else if (member.estadoCompleto.includes("Inactivo")) {
      this.doc.setTextColor(220, 20, 60); // Rojo
    } else if (member.estadoCompleto.includes("Pendiente")) {
      this.doc.setTextColor(255, 140, 0); // Naranja
    }

    this.addText(member.estadoCompleto, 140, this.currentY);
    this.doc.setTextColor(0, 0, 0); // Reset color

    // Fecha de inscripción
    const fechaInscripcion = member.fechaInscripcion 
      ? formatDateDDMMYYYY(member.fechaInscripcion) 
      : "N/A";
    this.addText(fechaInscripcion, 185, this.currentY);

    // Fecha de cobertura
    let fechaCobertura = "N/A";
    if (member.fechaCobertura) {
      if (member.fechaCobertura === "Vitalicio Activo") {
        fechaCobertura = "Vitalicio";
      } else if (member.fechaCobertura.includes("\nbaja")) {
        const [fecha] = member.fechaCobertura.split("\nbaja");
        fechaCobertura = formatDateDDMMYYYY(fecha) + " (B)";
      } else {
        fechaCobertura = formatDateDDMMYYYY(member.fechaCobertura);
      }
    }
    this.addText(fechaCobertura, 225, this.currentY);

    // Cuotas pagadas/total (columna final visible)
    const cuotasInfo = member.fechaInscripcion
      ? `${member.cuotasPagadas}/${member.cuotasPagadas + member.cuotasPendientes}`
      : "N/A";
    this.addText(cuotasInfo, 265, this.currentY);

    // Línea separadora gris claro debajo de cada fila
    this.currentY += 10;
    this.doc.setLineWidth(0.2);
    this.doc.setDrawColor(200, 200, 200); // Gris claro
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.doc.setDrawColor(0, 0, 0); // Reset color
  }

  private addFooter(pageNumber: number, totalPages: number): void {
    const footerY = this.pageHeight - 15;
    this.setFont(8, "normal");
    this.addText(
      `Página ${pageNumber} de ${totalPages}`,
      this.pageWidth / 2,
      footerY,
      { align: "center" }
    );
  }

  public generatePDF(members: Member[], config: PDFConfig): void {
    // Agregar encabezado
    this.addHeader(config);

    // Agregar encabezado de tabla
    this.addTableHeader();

    // Agregar filas de socios
    members.forEach((member) => {
      this.addMemberRow(member);
    });

    // Agregar footer a todas las páginas
    const totalPages = this.doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages);
    }

    // Descargar el PDF
    const fileName = `reporte-socios-${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(fileName);
  }
}

export const generateMembersPDF = (
  members: Member[],
  config: PDFConfig
): void => {
  const pdfGenerator = new PDFGenerator();
  pdfGenerator.generatePDF(members, config);
};
