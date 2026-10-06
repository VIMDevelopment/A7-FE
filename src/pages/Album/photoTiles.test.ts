import {
  buildDeleteConfirmMessage,
  buildPhotoTiles,
  deletionPlanFromTileKeys,
  downloadFilesFromTileKeys,
  photoIdFromTileKey,
  photoIdsFromTileKeys,
  previewSourcesFromTiles,
  reconcileSelectedTileKeys,
  tilesForPreview,
} from "./photoTiles";
import type { Photo } from "../../apiV2/a7-service/model/photo";

const S3 = "https://s3.twcstorage.ru/bucket/photos/album-1";
const versions = (id: string, tag: string) => ({
  original: `${S3}/170_${tag}_${id}.jpg`,
  preview: `${S3}/170_${tag}_${id}_preview.webp`,
  small: `${S3}/170_${tag}_${id}_small.webp`,
});
const makePhoto = (id: string, modified = false): Photo =>
  ({
    id,
    albumId: "album-1",
    fileName: `IMG_${id}.jpg`,
    fileSize: 100,
    mimeType: "image/jpeg",
    isCover: false,
    tags: [],
    status: "idle",
    createdAt: "2026-10-06T10:00:00.000Z",
    updatedAt: "2026-10-06T10:00:00.000Z",
    default: versions(id, "d"),
    ...(modified ? { current: versions(id, "m") } : {}),
  }) as Photo;

describe("buildPhotoTiles (R-44)", () => {
  it("[R-44] фото без модификации — одна плитка, как раньше", () => {
    const tiles = buildPhotoTiles([makePhoto("p1")]);
    expect(tiles.map((t) => t.variant)).toEqual(["single"]);
    expect(tiles[0].versions).toEqual(versions("p1", "d"));
    expect(tiles[0].label).toBe("IMG_p1.jpg");
  });

  it("[R-44] модифицированное фото — две плитки рядом: сначала модификат, за ним оригинал с пометкой", () => {
    const tiles = buildPhotoTiles([makePhoto("p1", true), makePhoto("p2")]);
    expect(tiles.map((t) => t.key)).toEqual(["p1:modified", "p1:original", "p2:single"]);
    expect(tiles[0].versions).toEqual(versions("p1", "m"));
    expect(tiles[1].versions).toEqual(versions("p1", "d"));
    expect(tiles[1].label).toBe("IMG_p1.jpg (оригинал)");
  });

  it("[R-44] просмотр листает плитки по порядку; у оригинала — превью исходника", () => {
    const tiles = buildPhotoTiles([makePhoto("p1", true)]);
    expect(previewSourcesFromTiles(tiles)).toEqual([versions("p1", "m").preview, versions("p1", "d").preview]);
  });

  it("[R-44] скачивание: модификат — «_улучшенная», оригинал — исходник «_оригинал»; адреса без меток (подпись R-46)", () => {
    const tiles = buildPhotoTiles([makePhoto("p1", true)]);
    expect(downloadFilesFromTileKeys(tiles, ["p1:modified", "p1:original"])).toEqual([
      { url: versions("p1", "m").original, fileName: "IMG_p1_улучшенная.jpg" },
      { url: versions("p1", "d").original, fileName: "IMG_p1_оригинал.jpg" },
    ]);
    expect(tiles.every((t) => !t.versions.original.includes("?"))).toBe(true);
  });

  it("[R-44] скачиваются ровно выбранные версии", () => {
    const tiles = buildPhotoTiles([makePhoto("p1", true)]);
    expect(downloadFilesFromTileKeys(tiles, ["p1:original"])).toEqual([
      { url: versions("p1", "d").original, fileName: "IMG_p1_оригинал.jpg" },
    ]);
  });
});

describe("удаление и выбор плиток (R-44)", () => {
  const tiles = buildPhotoTiles([makePhoto("p1", true), makePhoto("p2")]);

  it("[R-44] фото удаляется, только если выбраны обе его плитки", () => {
    expect(deletionPlanFromTileKeys(tiles, ["p1:modified", "p1:original", "p2:single"])).toEqual({
      photoIds: ["p1", "p2"],
      partiallySelectedCount: 0,
    });
  });

  it("[R-44] выбрана одна плитка из двух — фото не удаляется, предупреждение честное", () => {
    const plan = deletionPlanFromTileKeys(tiles, ["p1:modified", "p2:single"]);
    expect(plan).toEqual({ photoIds: ["p2"], partiallySelectedCount: 1 });
    expect(buildDeleteConfirmMessage({ photoCount: 1, tileLabel: "IMG_p2.jpg", partiallySelectedCount: 1 })).toMatch(
      /У 1 фото галочка снята/
    );
  });

  it("[R-44] модификация выбранных — одно фото один раз, даже если выбраны обе плитки", () => {
    expect(photoIdsFromTileKeys(tiles, ["p1:modified", "p1:original"])).toEqual(["p1"]);
  });

  it("[R-44] фото домодифицировалось — галочка с single переезжает на модификат", () => {
    const after = buildPhotoTiles([makePhoto("p1", true)]);
    expect(reconcileSelectedTileKeys(after, ["p1:single"])).toEqual(["p1:modified"]);
    const same = ["p1:modified"];
    expect(reconcileSelectedTileKeys(after, same)).toBe(same);
  });

  it("ключ плитки → id фото; замороженный список важнее свежего", () => {
    expect(photoIdFromTileKey("abc:original")).toBe("abc");
    expect(photoIdFromTileKey("bad")).toBe("");
    expect(tilesForPreview(null, tiles)).toBe(tiles);
    expect(tilesForPreview([], tiles)).toEqual([]);
  });
});
