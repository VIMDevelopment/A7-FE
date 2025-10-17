import JSZip from "jszip";
import { saveAs } from "file-saver";
import { showNotification } from "../../../../components/ShowNotification";

export type FileForZip = {
  url: string;
  fileName: string;
};

export const downloadImageByUrl = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();

    if (blob.size > 1000) {
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } else {
      showNotification({
        message: "Произошла ошибка при скачивании файла",
        type: "error",
      });
    }
  } catch (_) {
    showNotification({
      message: "Произошла ошибка при скачивании файла",
      type: "error",
    });
  }
};

export const handleDownloadAll = async (files: FileForZip[]) => {
  const zip = new JSZip();
  const folder = zip.folder("photos");

  for (const file of files) {
    const filename = file.fileName;
    try {
      const res = await fetch(file.url, { mode: "cors" });
      const blob = await res.blob();
      folder?.file(filename, blob);
    } catch (err) {
      showNotification({
        message: "Произошла ошибка при скачивании файлов",
        type: "error",
      });
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "photos.zip");
};

export const handlePrintPhoto = (url: string, name: string) => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${name}</title>
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              height: 100vh;
            }
            img {
              max-width: 100%;
              height: auto;
              object-fit: contain;
            }
          }
          body {
            margin: 0;
            background: white;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 0;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <img id="photo" src="${url}" alt="${name}" />
      </body>
    </html>
  `);
  doc.close();

  const img = doc.getElementById("photo") as HTMLImageElement | null;
  if (img) {
    img.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1500);
    };
  }
};
