import axios, { type AxiosRequestConfig } from "axios";

type Post = (url: string, body: unknown, config: AxiosRequestConfig) => Promise<unknown>;

const DOWNLOAD_CHUNK = 1000;

const quietly = (request: Promise<unknown>): Promise<void> => request.then(
  () => undefined,
  () => undefined,
);

export async function recordDownload(photoIds: string[], config: AxiosRequestConfig, post: Post = axios.post): Promise<void> {
  const unique = Array.from(new Set(photoIds.filter(Boolean)));
  for (let i = 0; i < unique.length; i += DOWNLOAD_CHUNK) {
    await quietly(post("/journal/download", { photoIds: unique.slice(i, i + DOWNLOAD_CHUNK), from: "album" }, config));
  }
}

export async function recordView(photoId: string | undefined, config: AxiosRequestConfig, post: Post = axios.post): Promise<void> {
  if (photoId) await quietly(post("/journal/view", { photoId, from: "album" }, config));
}
