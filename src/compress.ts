export const ungzip = async (data: string) => {
  const readableStream = new Blob([
    Uint8Array.from(atob(data), (c) => c.charCodeAt(0)),
  ]).stream();
  const decompressedStream = readableStream.pipeThrough(
    // @ts-ignore
    new DecompressionStream("gzip")
  );
  const json = new TextDecoder().decode(
    (await decompressedStream
      .getReader()
      .read()
      .then((r) => r.value)) as Uint8Array
  );
  return JSON.parse(json);
};
