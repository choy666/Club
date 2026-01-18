import jsPDF from "jspdf";
import { formatDateDDMMYYYY } from "@/lib/utils/date-utils";

// Logo del club en formato base64 con prefijo correcto para jsPDF
const logoBase64 =
  "data:image/png;base64,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";

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

  private addText(
    text: string,
    x: number,
    y: number,
    options?: { align?: "left" | "center" | "right" }
  ): void {
    this.doc.text(text, x, y, options);
  }

  private addLogo(): void {
    // Agregar logo en la esquina superior derecha
    const logoSize = 25; // Tamaño del logo en mm
    const logoX = this.pageWidth - this.margin - logoSize;
    const logoY = this.margin;

    try {
      // Intentar agregar el logo desde la ruta pública
      this.doc.addImage(logoBase64, "PNG", logoX, logoY, logoSize, logoSize);
    } catch (error) {
      // Si hay error al cargar el logo, continuar sin él
      console.warn("No se pudo cargar el logo en el PDF:", error);
    }
  }

  private addHeader(config: PDFConfig): void {
    // Agregar logo en la esquina superior derecha
    this.addLogo();

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

    // Información institucional
    this.addText(`Cuit: 30-53106311-9`, this.margin, this.currentY);
    this.currentY += 6;
    this.addText(`Ing. Brutos: Exento`, this.margin, this.currentY);
    this.currentY += 6;
    this.addText(`Inicio de Actividad: 01/05/1896`, this.margin, this.currentY);
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

    headers.forEach((header) => {
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
    const nombre =
      member.nombre.length > 15 ? member.nombre.substring(0, 12) + "..." : member.nombre;
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
    this.addText(`Página ${pageNumber} de ${totalPages}`, this.pageWidth / 2, footerY, {
      align: "center",
    });
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
    const fileName = `reporte-socios-${new Date().toISOString().split("T")[0]}.pdf`;
    this.doc.save(fileName);
  }
}

export const generateMembersPDF = (members: Member[], config: PDFConfig): void => {
  const pdfGenerator = new PDFGenerator();
  pdfGenerator.generatePDF(members, config);
};
