import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

// Сторож вырезанного: в вебе нет распознавания лиц (R-50), Яндекс.Диска и FTP-камер (R-52).
// Красный тест = кто-то вернул вырезанное.
const ROOT = process.cwd();
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, string>;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|js|jsx)$/.test(full) ? [full] : [];
  });
}

// Смотрим код, который уезжает в браузер; тесты вправе упоминать старые имена.
const files = sourceFiles(join(ROOT, "src"))
  .map((f) => relative(ROOT, f))
  .filter((f) => !/\.test\.(ts|tsx)$/.test(f));

const offenders = (pattern: RegExp, allowed: string[] = []) =>
  files.filter((f) => !allowed.includes(f) && pattern.test(readFileSync(join(ROOT, f), "utf-8")));

// Политика конфиденциальности — общий документ оператора: описывает поиск по лицу НА ТОЧКЕ.
const POLICY = "src/pages/Policy/policyContent.ts";

describe("[R-50] в вебе нет распознавания лиц", () => {
  it("[R-50] библиотеки распознавания нет в зависимостях", () => {
    expect(Object.keys(deps).filter((d) => /face-api|tensorflow|react-webcam/.test(d))).toEqual([]);
  });

  it("[R-50] весов нейросетей нет в сайте", () => {
    expect(existsSync(join(ROOT, "public/weights"))).toBe(false);
    expect(readFileSync(join(ROOT, "vite.config.ts"), "utf-8")).not.toMatch(/face-api/);
  });

  it("[R-50] код не распознаёт лица и не ведёт на экран «Распознавание»", () => {
    expect(existsSync(join(ROOT, "src/pages/Recognition"))).toBe(false);
    expect(offenders(/face-api|faceDetection|descriptor|\/weights|Recognition/i)).toEqual([]);
  });

  it("[R-50] тексты сайта не описывают распознавание в вебе", () => {
    expect(offenders(/распознаван/i, [POLICY])).toEqual([]);
    expect(readFileSync(join(ROOT, POLICY), "utf-8")).not.toMatch(/онлайн-поиск фотографий по изображению лица/i);
  });
});

describe("[R-52] в вебе нет Яндекс.Диска и FTP-камер", () => {
  // «yandex» целиком не запрещаем: в политике — контактный адрес на yandex.com.
  it("[R-52] код не знает Яндекс.Диск, FTP и управление камерами", () => {
    expect(offenders(/yandex-?disk|yadisk|\bftp\b|Я\.Диск|Яндекс\.Диск|CameraSetup|getCameras|\/cameras|фотоаппарат/i)).toEqual([]);
  });
});
