export type ResizeRequest = {
  file: File;
  maxSide: number;
  quality: number;
};

export type ResizeResponse =
  | { status: "resized"; blob: Blob }
  | { status: "skipped" }
  | { status: "error"; message: string };
