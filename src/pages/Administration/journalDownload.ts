import axios, { type AxiosRequestConfig } from "axios";
import { saveAs } from "file-saver";

export type JournalKind = "deletion" | "action";

export function filenameOf(disposition: string | undefined, fallback: string): string {
  return /filename="([^"]+)"/.exec(disposition ?? "")?.[1] ?? fallback;
}

export async function downloadJournal(
  kind: JournalKind,
  period: { from?: string; to?: string },
  config: AxiosRequestConfig,
  get: typeof axios.get = axios.get,
  save: (blob: Blob, name: string) => void = saveAs
): Promise<void> {
  const label = kind === "deletion" ? "deletions" : "actions";
  const params = Object.fromEntries(Object.entries(period).filter(([, v]) => !!v));
  const res = await get(`/journal/${label}.csv`, { ...config, params, responseType: "blob" });
  save(res.data, filenameOf(res.headers?.["content-disposition"], `wanmax-${label}.csv`));
}
