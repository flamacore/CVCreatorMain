import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

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
};

const buildPdfFileName = (title: string) => `${title.replace(/\s+/g, "-").toLowerCase() || "resume"}.pdf`;

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

  try {
    const iframeDocument = iframe.contentDocument;

    if (!iframeDocument) {
      throw new Error("Could not create export surface for PDF generation.");
    }

    iframeDocument.open();
    iframeDocument.write(html);
    iframeDocument.close();

    await waitForDocumentReady(iframeDocument);
    injectPdfOverrides(iframeDocument);

    if ("fonts" in iframeDocument) {
      await iframeDocument.fonts.ready.catch(() => undefined);
    }

    await waitForImages(iframeDocument);

    const page = iframeDocument.querySelector<HTMLElement>(".cv-page");

    if (!page) {
      throw new Error("Could not find the resume page to export.");
    }

    const pageWidthPx = Math.ceil(page.offsetWidth);
    const pageHeightPx = Math.ceil(page.offsetHeight);
    const a4AspectRatio = A4_HEIGHT_MM / A4_WIDTH_MM;
    const pageAspectRatio = pageHeightPx / pageWidthPx;
    const isSingleA4Page = Math.abs(pageAspectRatio - a4AspectRatio) < 0.02;

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

    const imageData = canvas.toDataURL("image/png");
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
    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const anchor = window.document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = buildPdfFileName(title);
    anchor.click();
    window.URL.revokeObjectURL(downloadUrl);
  } finally {
    iframe.remove();
  }
};