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
