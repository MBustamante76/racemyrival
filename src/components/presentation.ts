export type PresentationMode = "polished" | "wireframe";

export const PRESENTATION_STORAGE_KEY = "rmr-presentation";

export function resolvePresentationMode(
  search: string,
  storage: Pick<Storage, "getItem"> | null,
): PresentationMode {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fromSearch = params.get("mode");
  if (fromSearch === "wireframe") {
    return "wireframe";
  }
  if (fromSearch === "polished") {
    return "polished";
  }

  const stored = storage?.getItem(PRESENTATION_STORAGE_KEY);
  return stored === "wireframe" ? "wireframe" : "polished";
}
