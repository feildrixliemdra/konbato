/**
 * File handoff between routes.
 *
 * The homepage lets you drop a file before you have chosen a tool. Once the
 * right tool is picked, the file has to arrive there without being picked a
 * second time. A File cannot go through the URL or sessionStorage, so it is
 * parked here in module memory, which survives a client-side navigation and
 * is deliberately lost on a hard reload: a stale file from a previous visit
 * must never appear in a tool unasked.
 *
 * Every upload zone asks for the parked files on mount, so every tool gets
 * this for free. A zone only takes them if it accepts at least one of them;
 * a zone for a different kind of file leaves them for the zone they were
 * meant for, so the handoff does not depend on which zone mounts first.
 */
let pending: File[] | null = null;

export function stageFiles(files: File[]): void {
  pending = files.length ? files : null;
}

export function takeStagedFiles(accepts: (file: File) => boolean): File[] | null {
  if (!pending || !pending.some(accepts)) return null;
  const files = pending;
  pending = null;
  return files;
}
