// R-44: виртуальные плитки веб-альбома (порт плиток точки, R-12/R-25 там же).
//
// В базе одно фото = одна запись: `default` — оригинал, `current` — модифицированная версия.
// Руководителю нужно видеть ОБЕ, поэтому запись с модификацией разворачивается в две плитки:
// сначала модификат, следом оригинал. Ни база, ни хранилище не трогаются.
//
// Отличия от точки: подписи и имена файлов строятся из `fileName` (в вебе адреса хранилища —
// сгенерированные ключи, имён с диска там нет); кэш-метки `?v=` не добавляем — адреса файлов
// подписываются (R-46), лишний параметр сломал бы подпись.

import type { Photo } from "../../apiV2/a7-service/model/photo";
import type { PhotoVersions } from "../../apiV2/a7-service/model/photoVersions";
import { makeFileName, type FileForZip } from "./components/PhotoCard/helpers";

export type PhotoTileVariant = "single" | "modified" | "original";

export type PhotoTile = {
  /** Уникальный ключ плитки — им помечается выбор (id фото не годится: плиток две). */
  key: string;
  /** id записи. У пары плиток он ОДИН — массовые операции обязаны дедуплицировать. */
  photoId: string;
  photo: Photo;
  variant: PhotoTileVariant;
  /** Версии файла, которые показывает именно эта плитка. */
  versions: PhotoVersions;
  /** Подпись под плиткой. */
  label: string;
  /** Имя файла этой плитки для печати/скачивания. */
  downloadFileName: string;
};

export function buildPhotoTiles(photos: Photo[]): PhotoTile[] {
  const tiles: PhotoTile[] = [];
  for (const photo of photos) {
    if (!photo.current?.original) {
      tiles.push({
        key: `${photo.id}:single`,
        photoId: photo.id,
        photo,
        variant: "single",
        versions: photo.default,
        label: photo.fileName,
        downloadFileName: makeFileName({ fileName: photo.fileName, isOriginal: true }),
      });
      continue;
    }
    tiles.push({
      key: `${photo.id}:modified`,
      photoId: photo.id,
      photo,
      variant: "modified",
      versions: photo.current,
      label: photo.fileName,
      downloadFileName: makeFileName({ fileName: photo.fileName, isOriginal: false }),
    });
    tiles.push({
      key: `${photo.id}:original`,
      photoId: photo.id,
      photo,
      variant: "original",
      versions: photo.default,
      label: `${photo.fileName} (оригинал)`,
      downloadFileName: makeFileName({ fileName: photo.fileName, isOriginal: true }),
    });
  }
  return tiles;
}

/** Источники превью — по одному на плитку и в её порядке (индексация тулбара просмотра). */
export function previewSourcesFromTiles(tiles: PhotoTile[]): string[] {
  return tiles.map((tile) => tile.versions.preview);
}

/** id фото по выбранным плиткам без дублей: две плитки одного фото — одна запись (одна оплата). */
export function photoIdsFromTileKeys(tiles: PhotoTile[], selectedKeys: string[]): string[] {
  const selected = new Set(selectedKeys);
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const tile of tiles) {
    if (!selected.has(tile.key) || seen.has(tile.photoId)) continue;
    seen.add(tile.photoId);
    ids.push(tile.photoId);
  }
  return ids;
}

/**
 * План удаления (R-12 точки): удаление сносит запись целиком — обе плитки, поэтому фото
 * удаляется, только если выбраны ВСЕ его плитки. Снятая галочка = «это фото оставить».
 */
export function deletionPlanFromTileKeys(
  tiles: PhotoTile[],
  selectedKeys: string[]
): { photoIds: string[]; partiallySelectedCount: number } {
  const selected = new Set(selectedKeys);
  const total = new Map<string, number>();
  const picked = new Map<string, number>();
  const order: string[] = [];
  for (const tile of tiles) {
    if (!total.has(tile.photoId)) order.push(tile.photoId);
    total.set(tile.photoId, (total.get(tile.photoId) ?? 0) + 1);
    if (selected.has(tile.key)) picked.set(tile.photoId, (picked.get(tile.photoId) ?? 0) + 1);
  }
  const photoIds: string[] = [];
  let partiallySelectedCount = 0;
  for (const id of order) {
    const n = picked.get(id) ?? 0;
    if (n === 0) continue;
    if (n === total.get(id)) photoIds.push(id);
    else partiallySelectedCount++;
  }
  return { photoIds, partiallySelectedCount };
}

/** id фото из ключа плитки (`<id>:<variant>`), режем по последнему двоеточию. */
export function photoIdFromTileKey(key: string): string {
  const i = key.lastIndexOf(":");
  return i === -1 ? "" : key.slice(0, i);
}

/**
 * Переносит выбор на пересобранный список: когда фото домодифицировалось, `id:single`
 * исчезает, появляются `id:modified` + `id:original` — галочка переезжает на одну плитку
 * (single, иначе modified). Ничего не поменялось — возвращается ТОТ ЖЕ массив.
 */
export function reconcileSelectedTileKeys(tiles: PhotoTile[], selectedKeys: string[]): string[] {
  if (tiles.length === 0 || selectedKeys.length === 0) return selectedKeys;
  const live = new Set(tiles.map((t) => t.key));
  const result: string[] = [];
  const seen = new Set<string>();
  let changed = false;
  for (const key of selectedKeys) {
    let next: string | undefined = key;
    if (!live.has(key)) {
      const photoId = photoIdFromTileKey(key);
      next =
        tiles.find((t) => t.photoId === photoId && t.variant === "single")?.key ??
        tiles.find((t) => t.photoId === photoId && t.variant === "modified")?.key;
      changed = true;
    }
    if (!next || seen.has(next)) {
      changed = true;
      continue;
    }
    seen.add(next);
    result.push(next);
  }
  return changed ? result : selectedKeys;
}

/** Пока открыт просмотр, список плиток заморожен: опрос пересобрал бы индексы под кнопками тулбара. */
export function tilesForPreview(frozen: PhotoTile[] | null, fresh: PhotoTile[]): PhotoTile[] {
  return frozen ?? fresh;
}

/** Файлы для «Скачать выбранные»: обе версии нужны, один и тот же файл дважды — нет. */
export function downloadFilesFromTileKeys(tiles: PhotoTile[], selectedKeys: string[]): FileForZip[] {
  const selected = new Set(selectedKeys);
  const files: FileForZip[] = [];
  const seen = new Set<string>();
  for (const tile of tiles) {
    if (!selected.has(tile.key)) continue;
    const dedupe = `${tile.versions.original}|${tile.downloadFileName}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    files.push({ url: tile.versions.original, fileName: tile.downloadFileName });
  }
  return files;
}

/** Текст подтверждения удаления: имя — с плитки, с которой нажали; честно о частично выбранных. */
export function buildDeleteConfirmMessage({
  photoCount,
  tileLabel,
  partiallySelectedCount = 0,
}: {
  photoCount: number;
  tileLabel: string;
  partiallySelectedCount?: number;
}): string {
  const what =
    photoCount === 1 && tileLabel ? `фото ${tileLabel}` : photoCount === 1 ? "фото" : `выбранные (${photoCount}) фото`;
  const partial =
    partiallySelectedCount > 0
      ? ` У ${partiallySelectedCount} фото галочка снята с одной из карточек — эти фото не будут удалены.`
      : "";
  return `Вы уверены, что хотите удалить ${what}? Данные будут безвозвратно утеряны.${partial}`;
}
