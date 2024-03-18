export const ungzip = async (data: string, length: number) => {
  if (data.length !== length) {
    throw new Error("Invalid length");
  }
  const readableStream = new Blob([
    Uint8Array.from(atob(data), (c) => c.charCodeAt(0)),
  ]).stream();
  const decompressedStream = readableStream.pipeThrough(
    // @ts-ignore
    new DecompressionStream("gzip")
  );
  return await new Response(decompressedStream).json();
};
