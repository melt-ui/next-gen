/**
 * Convert a blob to a binary string
 *
 * The blob can optionnaly be sliced with the slice arguments
 *
 * @version 1.0.0
 * @since   1.0.0
 * @param   {Blob}  blob Blob to convert and optionnally sample
 * @param   {Number}  chunk Size in bytes to slice blob
 * @return  {Promise<string>}       Binary data as a string
 */
export function blobToBinaryString(blob: Blob, chunk?: number): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		const s = chunk ? Math.min(chunk, blob.size) : blob.size;
		const b = blob.slice(0, s);

		reader.onload = () => resolve(reader.result as string); // Type assertion
		reader.onerror = reject;
		reader.readAsBinaryString(b);
	});
}

/**
 * Convert a blob to an ArrayBuffer
 *
 * The blob can optionnally be sliced with the `size`argument
 *
 * @version 1.0.0
 * @since   1.0.0
 * @param   {Blob}  blob Blob
 * @param   {Number}  chunk Size in bytes to slice blob
 * @return  {Promise<ArrayBuffer>}       Binary data as a buffer
 */
export function blobToArrayBuffer(blob: Blob, chunk?: number): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		const s = chunk ? Math.min(chunk, blob.size) : blob.size;
		const b = blob.slice(0, s);

		reader.onload = () => resolve(reader.result as ArrayBuffer); // Type assertion
		reader.onerror = reject;
		reader.readAsArrayBuffer(b);
	});
}

/**
 * Compares two buffers byte to byte
 *
 * @version 1.0.0
 * @since   1.0.0
 * @param   {ArrayBuffer}  buf1          First buffer
 * @param   {ArrayBuffer}  buf2          Second buffer
 * @return  {Boolean}           `true` if buffers are equal
 */
export function compareBuffers(buf1: ArrayBuffer, buf2: ArrayBuffer): boolean {
	if (buf1 === buf2) return true;
	if (buf1.byteLength !== buf2.byteLength) return false;

	const d1 = new DataView(buf1),
		d2 = new DataView(buf2);

	let i = buf1.byteLength;
	while (i--) {
		/* istanbul ignore else */
		if (d1.getUint8(i) !== d2.getUint8(i)) return false;
	}

	return true;
}

/**
 * Compares two File objects by their content using chunking.
 *
 * @param {File} file1 The first File object.
 * @param {File} file2 The second File object.
 * @param {number} [chunkSize=1024 * 1024] The chunk size in bytes.  Defaults
 *  to 1MB.
 * @returns {Promise<boolean>} A promise that resolves to true if the files
 *  have the same content, false otherwise.
 */
export async function areFilesEqual(
	file1: File,
	file2: File,
	chunkSize: number = 1024 * 1024,
): Promise<boolean> {
	if (file1.size !== file2.size) {
		return false; // Optimization: Different sizes mean different content
	}

	let offset = 0;
	while (offset < file1.size) {
		const s = Math.min(chunkSize, file1.size - offset); // Correct slice size
		const b1 = file1.slice(offset, offset + s);
		const b2 = file2.slice(offset, offset + s);

		const chunk1 = await blobToArrayBuffer(b1, chunkSize);
		const chunk2 = await blobToArrayBuffer(b2, chunkSize);

		if (!compareBuffers(chunk1, chunk2)) {
			return false;
		}

		offset += chunkSize;
	}

	return true;
}
