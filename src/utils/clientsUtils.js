import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

/**
 * Exporta un array de clientes a un archivo Excel.
 * @param {Array} clients
 */
export function exportToExcel(clients) {
  const data = clients.map((client) => ({
    Nombre: client.name,
    Tipo: client.type === "individual" ? "Individual" : "Empresa",
    "Tipo de Documento": client.documentType,
    "Número de Documento": client.documentNumber,
    Email: client.email,
    Teléfono: client.phone,
    "Nombre del Negocio": client.businessInfo?.businessName || "-",
    Dirección: client.address || "-",
    "Límite de Crédito": client.creditLimit,
    "Términos de Pago": client.paymentTerms,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  XLSX.writeFile(wb, "clientes.xlsx");
}

/**
 * Exporta un array de clientes a un archivo PDF.
 * @param {Array} clients
 */
export function exportToPDF(clients) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte de Clientes", 14, 15);

  doc.setFontSize(10);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22);

  const tableData = clients.map((client) => [
    client.name,
    client.type === "individual" ? "Individual" : "Empresa",
    client.documentType,
    client.documentNumber,
    client.email,
    client.phone,
    client.businessInfo?.businessName || "-",
    client.address || "-",
    client.creditLimit,
    client.paymentTerms,
  ]);

  doc.autoTable({
    head: [
      [
        "Nombre",
        "Tipo",
        "Tipo Doc.",
        "Número Doc.",
        "Email",
        "Teléfono",
        "Negocio",
        "Dirección",
        "Límite Crédito",
        "Términos",
      ],
    ],
    body: tableData,
    startY: 30,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save("clientes.pdf");
}
