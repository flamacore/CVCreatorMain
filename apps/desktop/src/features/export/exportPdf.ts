import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { invoke } from "@tauri-apps/api/core";

import { isTauriRuntime } from "../state/persistence";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

const createPdfExportDiagnostics = () => {
  const entries: string[] = [];

  return {
    entries,
    push: (message: string) => {
      entries.push(message);
    },
  };
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Unknown PDF export error.";
};

const buildPdfExportFailure = (error: unknown, diagnostics: string[]) => {
  const detailLines = diagnostics.length > 0 ? `\n\nDiagnostics:\n- ${diagnostics.join("\n- ")}` : "";
  return new Error(`PDF export failed: ${toErrorMessage(error)}${detailLines}`);
};

const waitForDocumentReady = async (iframeDocument: Document) => {
  if (iframeDocument.readyState === "complete") {
    return;
  }

  await new Promise<void>((resolve) => {
    const handleReadyState = () => {
      if (iframeDocument.readyState === "complete") {
        iframeDocument.removeEventListener("readystatechange", handleReadyState);
        resolve();
      }
    };

    iframeDocument.addEventListener("readystatechange", handleReadyState);
  });
};

const waitForImages = async (iframeDocument: Document) => {
  const images = Array.from(iframeDocument.images);

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          const finalize = () => {
            image.removeEventListener("load", finalize);
            image.removeEventListener("error", finalize);
            resolve();
          };

          image.addEventListener("load", finalize);
          image.addEventListener("error", finalize);
        }),
    ),
  );

  return images.length;
};

const buildPdfFileName = (title: string) => `${title.replace(/\s+/g, "-").toLowerCase() || "resume"}.pdf`;

const savePdfBlob = async (blob: Blob, title: string, diagnostics: ReturnType<typeof createPdfExportDiagnostics>) => {
  if (isTauriRuntime()) {
    diagnostics.push(`runtime=tauri`);
    diagnostics.push(`save-command suggested=${buildPdfFileName(title)}`);

    const selectedPath = await invoke<string | null>("save_export_file", {
      suggestedName: buildPdfFileName(title),
      fileTypeDescription: "PDF",
      extension: "pdf",
      bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
    });

    if (!selectedPath) {
      diagnostics.push("save-command result=cancelled");
      return;
    }

    diagnostics.push(`save-command result=${selectedPath}`);
    diagnostics.push(`write-file bytes=${blob.size}`);
    diagnostics.push("write-file result=success");
    return;
  }

  diagnostics.push("runtime=browser");
  diagnostics.push(`download file=${buildPdfFileName(title)}`);
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = buildPdfFileName(title);
  anchor.click();
  window.URL.revokeObjectURL(downloadUrl);
  diagnostics.push("download result=success");
};

const injectPdfOverrides = (iframeDocument: Document) => {
  const overrideStyle = iframeDocument.createElement("style");
  overrideStyle.textContent = `
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    .cv-page {
      margin: 0 !important;
      border-radius: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }

    .cv-section {
      overflow: visible !important;
    }

    .cv-hero-photo-frame {
      width: var(--hero-photo-size) !important;
      height: calc(var(--hero-photo-size) * 4 / 3) !important;
      min-height: calc(var(--hero-photo-size) * 4 / 3) !important;
    }

    .cv-hero-photo {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      aspect-ratio: auto !important;
      display: block !important;
    }
  `;

  iframeDocument.head.appendChild(overrideStyle);
};

export const exportPdfFromHtml = async (html: string, title: string) => {
  const diagnostics = createPdfExportDiagnostics();
  const iframe = window.document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.top = "0";
  iframe.style.left = "-10000px";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.border = "0";

  window.document.body.appendChild(iframe);
  diagnostics.push(`iframe appended title=${title || "untitled"}`);

  try {
    const iframeDocument = iframe.contentDocument;

    if (!iframeDocument) {
      throw new Error("Could not create export surface for PDF generation.");
    }

    iframeDocument.open();
    iframeDocument.write(html);
    iframeDocument.close();
    diagnostics.push(`iframe document written readyState=${iframeDocument.readyState}`);

    await waitForDocumentReady(iframeDocument);
    diagnostics.push(`document readyState=${iframeDocument.readyState}`);
    injectPdfOverrides(iframeDocument);
    diagnostics.push("pdf overrides injected");

    if ("fonts" in iframeDocument) {
      await iframeDocument.fonts.ready.catch(() => undefined);
      diagnostics.push("fonts ready=resolved");
    } else {
      diagnostics.push("fonts ready=unsupported");
    }

    const imageCount = await waitForImages(iframeDocument);
    diagnostics.push(`images ready count=${imageCount}`);

    const page = iframeDocument.querySelector<HTMLElement>(".cv-page");

    if (!page) {
      throw new Error("Could not find the resume page to export.");
    }

    const pageWidthPx = Math.ceil(page.offsetWidth);
    const pageHeightPx = Math.ceil(page.offsetHeight);
    const a4AspectRatio = A4_HEIGHT_MM / A4_WIDTH_MM;
    const pageAspectRatio = pageHeightPx / pageWidthPx;
    const isSingleA4Page = Math.abs(pageAspectRatio - a4AspectRatio) < 0.02;
    diagnostics.push(
      `page size=${pageWidthPx}x${pageHeightPx} singleA4=${isSingleA4Page} aspect=${pageAspectRatio.toFixed(4)}`,
    );

    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      foreignObjectRendering: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: pageWidthPx,
      height: pageHeightPx,
      windowWidth: pageWidthPx,
      windowHeight: pageHeightPx,
    });
    diagnostics.push(`canvas size=${canvas.width}x${canvas.height}`);

    const imageData = canvas.toDataURL("image/png");
    diagnostics.push(`png length=${imageData.length}`);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    if (isSingleA4Page) {
      pdf.addImage(imageData, "PNG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, "FAST");
    } else {
      const renderedWidth = A4_WIDTH_MM;
      const renderedHeight = (pageHeightPx * renderedWidth) / pageWidthPx;
      let remainingHeight = renderedHeight;
      let offsetY = 0;

      pdf.addImage(imageData, "PNG", 0, offsetY, renderedWidth, renderedHeight, undefined, "FAST");
      remainingHeight -= A4_HEIGHT_MM;

      while (remainingHeight > 0) {
        offsetY = remainingHeight - renderedHeight;
        pdf.addPage("a4", "portrait");
        pdf.addImage(imageData, "PNG", 0, offsetY, renderedWidth, renderedHeight, undefined, "FAST");
        remainingHeight -= A4_HEIGHT_MM;
      }
    }

    const pdfBlob = pdf.output("blob");
    diagnostics.push(`pdf blob size=${pdfBlob.size}`);
    await savePdfBlob(pdfBlob, title, diagnostics);
    diagnostics.push("export result=success");
    console.info("PDF export diagnostics", diagnostics.entries);
  } catch (error) {
    console.error("PDF export failed", {
      error,
      diagnostics: diagnostics.entries,
    });
    throw buildPdfExportFailure(error, diagnostics.entries);
  } finally {
    iframe.remove();
  }
};