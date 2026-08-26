import { publicRequest } from "../client";

export const syncCases = (token: string, cases: object[]) =>
  publicRequest<unknown>("/api/sync", {
    method: "POST",
    body: JSON.stringify({ token, cases }),
  });
