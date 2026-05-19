import { apiRequest } from "./client";

export type FileRead = {
  id: string;
  owner_user_id?: string | null;
  module_key?: string | null;
  bucket: string;
  object_key: string;
  original_name: string;
  content_type?: string | null;
  size_bytes: number;
  checksum?: string | null;
  visibility: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PresignedFileResponse = {
  file: FileRead;
  url: string;
};

export async function uploadFile(args: { file: File; moduleKey?: string; bucket?: string }) {
  const { file, moduleKey, bucket } = args;
  const form = new FormData();
  form.append("upload", file);
  const qs = new URLSearchParams();
  if (moduleKey) qs.set("module_key", moduleKey);
  if (bucket) qs.set("bucket", bucket);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiRequest<FileRead>(`/api/files/upload${suffix}`, {
    method: "POST",
    body: form,
  });
}

export async function getFilePresigned(fileId: string) {
  return apiRequest<PresignedFileResponse>(`/api/files/${fileId}`);
}

