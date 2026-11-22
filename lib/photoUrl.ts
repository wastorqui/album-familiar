import type { Photo } from "./types";
export const photoUrl = (p: Photo, big = false) => `/api/foto?p=${encodeURIComponent(big ? p.path : p.thumb)}&a=${p.access}`;
