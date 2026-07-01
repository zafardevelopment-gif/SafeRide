import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";

const A4_WIDTH_IN = 8.27;
const A4_HEIGHT_IN = 11.69;
const MARGIN_IN = 0.3;

interface StickerSize {
  widthIn: number;
  heightIn: number;
  gapIn: number;
}

const SIZES: Record<"square" | "strip", StickerSize> = {
  square: { widthIn: 3.5, heightIn: 3.5, gapIn: 0.2 },
  strip: { widthIn: 4, heightIn: 2, gapIn: 0.15 },
};

// Fixed capture pixel size per format — matches the explicit inline
// width/height set on .ss-sticker-cell in print-sheet.tsx (96 CSS px/in)
// so the captured image is deterministic regardless of the responsive
// on-screen grid width.
const CAPTURE_PX: Record<"square" | "strip", { width: number; height: number }> = {
  square: { width: 336, height: 336 },
  strip: { width: 384, height: 192 },
};

// Captures every .ss-sticker-cell element inside the container and lays
// them out into an A4 PDF at true physical size, wrapping to new pages
// as needed — one screenshot per sticker rather than one giant page
// capture, since that stays sharp regardless of how many stickers there are.
export async function downloadStickerPdf(
  containerId: string,
  format: "square" | "strip",
  filename: string
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) throw new Error("Sticker container not found.");

  const cells = Array.from(container.querySelectorAll<HTMLElement>(".ss-sticker-cell"));
  if (cells.length === 0) throw new Error("No stickers to export.");

  const { widthIn, heightIn, gapIn } = SIZES[format];
  const usableWidth = A4_WIDTH_IN - MARGIN_IN * 2;
  const usableHeight = A4_HEIGHT_IN - MARGIN_IN * 2;
  const cols = Math.max(1, Math.floor((usableWidth + gapIn) / (widthIn + gapIn)));
  const rows = Math.max(1, Math.floor((usableHeight + gapIn) / (heightIn + gapIn)));
  const perPage = cols * rows;

  const pdf = new jsPDF({ unit: "in", format: "a4" });

  for (let i = 0; i < cells.length; i++) {
    const imgData = await toPng(cells[i], { pixelRatio: 3, backgroundColor: "#ffffff" });

    const pageIndex = Math.floor(i / perPage);
    const indexOnPage = i % perPage;
    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);

    if (pageIndex > 0 && indexOnPage === 0) pdf.addPage();

    const x = MARGIN_IN + col * (widthIn + gapIn);
    const y = MARGIN_IN + row * (heightIn + gapIn);
    pdf.addImage(imgData, "PNG", x, y, widthIn, heightIn);
  }

  pdf.save(filename);
}
