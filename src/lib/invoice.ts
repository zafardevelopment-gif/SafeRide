import { jsPDF } from "jspdf";
import { formatINR } from "@/lib/utils";
import type { Payment } from "@/types";

interface InvoiceData {
  payment: Payment;
  customerName: string;
  customerEmail: string | null;
  planName: string;
}

export function generateInvoicePDF({ payment, customerName, customerEmail, planName }: InvoiceData): Buffer {
  const doc = new jsPDF();
  const gstin = process.env.GSTIN ?? "";
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "SafeRide QR";

  doc.setFontSize(18);
  doc.text(appName, 14, 20);
  doc.setFontSize(10);
  doc.text("Tax Invoice", 14, 27);
  doc.text(`GSTIN: ${gstin}`, 14, 33);

  doc.setFontSize(10);
  doc.text(`Invoice No: ${payment.id}`, 140, 20);
  doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString("en-IN")}`, 140, 26);

  doc.setFontSize(11);
  doc.text("Bill To:", 14, 46);
  doc.setFontSize(10);
  doc.text(customerName, 14, 52);
  if (customerEmail) doc.text(customerEmail, 14, 58);

  const tableTop = 72;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 14, tableTop);
  doc.text("Amount", 160, tableTop, { align: "right" });
  doc.line(14, tableTop + 2, 196, tableTop + 2);
  doc.setFont("helvetica", "normal");

  doc.text(payment.description ?? planName, 14, tableTop + 10);
  doc.text(formatINR(payment.amount), 160, tableTop + 10, { align: "right" });

  doc.text(`GST (${process.env.GST_PERCENTAGE ?? 18}%)`, 14, tableTop + 18);
  doc.text(formatINR(payment.gst_amount), 160, tableTop + 18, { align: "right" });

  doc.line(14, tableTop + 24, 196, tableTop + 24);
  doc.setFont("helvetica", "bold");
  doc.text("Total", 14, tableTop + 32);
  doc.text(formatINR(payment.total_amount), 160, tableTop + 32, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Payment status: ${payment.status}`, 14, tableTop + 46);
  if (payment.razorpay_payment_id) {
    doc.text(`Razorpay payment ID: ${payment.razorpay_payment_id}`, 14, tableTop + 52);
  }

  return Buffer.from(doc.output("arraybuffer"));
}
