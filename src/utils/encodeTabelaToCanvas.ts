import type { Cell } from "../components/Board/BoardConstants";

export function encodeTabelaToCanvas(tabela: Cell[][], canvasRef: any, themeColor: any) {
	const rows = tabela.length;
	const cols = tabela.reduce((max, r) => Math.max(max, r.length), 0);
	const totalCells = rows * cols;

	let headerSize = 4;
	// 4 pixels
	// first pixel stores the first character of the name in R, second in G, third in B and 255 in A
	// second pixel stores the fourth character of the name in R, fifth in G, sixth in B and 255 in A
	// third one stores rows in R, columns in G, and 255 in B and A
	// fourth one stores the theme color
	const size = Math.ceil(Math.sqrt(totalCells + headerSize || 1));
	const canvas = canvasRef.current!;
	const w = size * size;
	const h = 1;
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d")!;
	if (!ctx) throw new Error("2D context not available");

	const imageData = ctx.createImageData(w, h);
	const data = imageData.data;

	data[0 * 4 + 0] = "O".charCodeAt(0) & 0xff;
	data[0 * 4 + 1] = "G".charCodeAt(0) & 0xff;
	data[0 * 4 + 2] = "N".charCodeAt(0) & 0xff;
	data[0 * 4 + 3] = 255;

	data[1 * 4 + 0] = "J".charCodeAt(0) & 0xff;
	data[1 * 4 + 1] = "E".charCodeAt(0) & 0xff;
	data[1 * 4 + 2] = "N".charCodeAt(0) & 0xff;
	data[1 * 4 + 3] = 255;

	data[2 * 4 + 0] = rows & 0xff;
	data[2 * 4 + 1] = cols & 0xff;
	data[2 * 4 + 2] = 255;
	data[2 * 4 + 3] = 255;

	let colorString = themeColor;
	colorString = colorString.replace("#", "");

	let RColor = parseInt(colorString.substring(0, 2), 16);
	let GColor = parseInt(colorString.substring(2, 4), 16);
	let BColor = parseInt(colorString.substring(4, 6), 16);
	let AColor = 255;

	data[3 * 4 + 0] = RColor;
	data[3 * 4 + 1] = GColor;
	data[3 * 4 + 2] = BColor;
	data[3 * 4 + 3] = AColor;

	console.log("Encoding with color: ", RColor, GColor, BColor, AColor);

	// Encode cells row-major into pixels
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const cellIndex = r * cols + c + headerSize;
			const pixelOffset = cellIndex * 4;

			const cell = tabela[r]?.[c];
			let value = 0; // if undefined, value is 0
			let available = 2; // 2 = undefined, 1 = true, 0 = false
			let hasValue = 1; // 0 = has value, 1 = undefined / no value

			if (cell) {
				if (cell.value !== undefined) {
					// clamp to int8
					const v = cell.value;
					value = Math.max(0, Math.min(255, v));
				}
				if (cell.isAvailable !== undefined) {
					available = cell.isAvailable ? 1 : 0;
				}
				if (cell.value !== undefined) {
					hasValue = 0;
				}
			}

			// pack int16 big-endian into R,G
			const i8 = value & 0xff;

			// 50a2ff
			data[pixelOffset + 0] = i8 ^ RColor; // R
			data[pixelOffset + 1] = hasValue ^ GColor; // G: 0
			data[pixelOffset + 2] = available ^ BColor; // B: value
			data[pixelOffset + 3] = 255; // A
		}
	}

	// Ensure remaining pixels (padding) are opaque black
	for (let i = (totalCells + headerSize) * 4; i < data.length; i += 4) {
		data[i + 0] = RColor;
		data[i + 1] = GColor;
		data[i + 2] = BColor;
		data[i + 3] = AColor;
	}

	ctx.putImageData(imageData, 0, 0);
}
