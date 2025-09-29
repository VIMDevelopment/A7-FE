import { RcFile } from "antd/lib/upload";
import { showNotification } from "../../../../components/ShowNotification";

export const beforeUpload = (file: File): boolean => {
  const isImage = file.type.startsWith("image/");

  if (!isImage) {
    console.error("Можно загружать только изображения!");
    void showNotification({
      message: "Ошибка загрузки файла",
      description: "Можно загружать только изображения",
      type: "error",
    });
  }

  return isImage;
};

const translitMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d",
  е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
  ш: "sh", щ: "sch", ы: "y", э: "e", ю: "yu",
  я: "ya",
};

export const normalizeFile = (file: File): File => {
  const ext = file.name.split(".").pop();
  const base = file.name.replace(/\.[^/.]+$/, "");

  const transliterated = base
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      if (translitMap[lower]) {
        return char === lower ? translitMap[lower] : translitMap[lower].toUpperCase();
      }
      return char; // латиница, цифры, пробелы и т.п.
    })
    .join("");

  const safeName = transliterated
    .replace(/\s+/g, "_")       // пробелы → _
    .replace(/[^a-zA-Z0-9-_]/g, ""); // убрать всё лишнее

  return new File([file], `${safeName}.${ext}`, { type: file.type });
};
