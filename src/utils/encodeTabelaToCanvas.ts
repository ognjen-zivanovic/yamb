import type { PeerData } from "../App";
import type { Cell } from "../components/Board/BoardConstants";
import type { GameState } from "../contexts/GameContext";

export function encodeTabelaToCanvas(
	tabela: Cell[][],
	gameState: GameState,
	peerData: PeerData[],
	peerId: string,
	gameId: string,
	themeColor: any,
	canvasRef: any
) {
	console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
	const rows = tabela.length;
	const cols = tabela.reduce((max, r) => Math.max(max, r.length), 0);
	const totalCells = rows * cols;

	let headerSize = 9 + peerData.length;
	// 4 pixels
	// first pixel stores the first character of the name in R, second in G, third in B and 255 in A
	// second pixel stores the fourth character of the name in R, fifth in G, sixth in B and 255 in A
	// third one stores rows in R, columns in G, and 255 in B and A
	// fourth one stores the theme color

	console.log("headerSize", headerSize);
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

	// let pixelIndex = 0;
	// function addPixel(r: number, g: number, b: number, a: number) {

	data[0 * 4 + 0] = "O".charCodeAt(0) & 0xff;
	data[0 * 4 + 1] = "G".charCodeAt(0) & 0xff;
	data[0 * 4 + 2] = "N".charCodeAt(0) & 0xff;
	data[0 * 4 + 3] = 255;

	data[1 * 4 + 0] = "J".charCodeAt(0) & 0xff;
	data[1 * 4 + 1] = "E".charCodeAt(0) & 0xff;
	data[1 * 4 + 2] = "N".charCodeAt(0) & 0xff;
	data[1 * 4 + 3] = 255;

	let currTime = Math.floor(new Date().getTime() / 1000);

	data[2 * 4 + 0] = rows & 0xff;
	data[2 * 4 + 1] = cols & 0xff;
	data[2 * 4 + 2] = (currTime >> 24) & 0xff;
	data[2 * 4 + 3] = 255;

	console.log(currTime);
	data[3 * 4 + 0] = (currTime >> 16) & 0xff;
	data[3 * 4 + 1] = (currTime >> 8) & 0xff;
	data[3 * 4 + 2] = currTime & 0xff;
	data[3 * 4 + 3] = 255;

	let colorString = themeColor;
	colorString = colorString.replace("#", "");

	let RColor = parseInt(colorString.substring(0, 2), 16);
	let GColor = parseInt(colorString.substring(2, 4), 16);
	let BColor = parseInt(colorString.substring(4, 6), 16);
	let AColor = 255;

	data[4 * 4 + 0] = RColor;
	data[4 * 4 + 1] = GColor;
	data[4 * 4 + 2] = BColor;
	data[4 * 4 + 3] = AColor;

	console.log("Encoding with color: ", RColor, GColor, BColor, AColor);

	data[5 * 4 + 0] =
		((gameState.isMyMove ? 1 : 0) << 7) |
		((gameState.isRucna ? 1 : 0) << 6) |
		(gameState.roundIndex & 0b00111111);
	data[5 * 4 + 1] =
		(((gameState.najava ?? -1) & 0xf) << 4) | ((gameState.dirigovana ?? -1) & 0xf);
	data[5 * 4 + 2] = peerData.length & 0xff;
	data[5 * 4 + 3] = 255;

	const numChosen = gameState.chosenDice?.length ?? 0;
	const dice =
		gameState.chosenDice != undefined && gameState.rolledDice != undefined
			? [...gameState.chosenDice, ...gameState.rolledDice]
			: [0, 0, 0, 0, 0, 0];
	console.log("DICE: ", dice);
	data[6 * 4 + 0] =
		((((0 < numChosen ? 1 : 0) << 3) | (dice[0] & 0b111)) << 4) |
		(((1 < numChosen ? 1 : 0) << 3) | (dice[1] & 0b111));
	data[6 * 4 + 1] =
		((((2 < numChosen ? 1 : 0) << 3) | (dice[2] & 0b111)) << 4) |
		(((3 < numChosen ? 1 : 0) << 3) | (dice[3] & 0b111));
	data[6 * 4 + 2] =
		((((4 < numChosen ? 1 : 0) << 3) | (dice[4] & 0b111)) << 4) |
		(((5 < numChosen ? 1 : 0) << 3) | (dice[5] & 0b111));
	data[6 * 4 + 3] = 255;

	data[7 * 4 + 0] = parseInt(gameId.slice(0, 2), 16) & 0xff;
	data[7 * 4 + 1] = parseInt(gameId.slice(2, 4), 16) & 0xff;
	data[7 * 4 + 2] = parseInt(gameId.slice(4, 6), 16) & 0xff;
	data[7 * 4 + 3] = 255;

	data[8 * 4 + 0] = parseInt(peerId.slice(0, 2), 16) & 0xff;
	data[8 * 4 + 1] = parseInt(peerId.slice(2, 4), 16) & 0xff;
	data[8 * 4 + 2] = parseInt(peerId.slice(4, 6), 16) & 0xff;
	data[8 * 4 + 3] = 255;

	for (let i = 0; i < peerData.length; i++) {
		const peer = peerData[i];
		data[9 * 4 + i * 4 + 0] = parseInt(peer.id.slice(0, 2), 16) & 0xff;
		data[9 * 4 + i * 4 + 1] = parseInt(peer.id.slice(2, 4), 16) & 0xff;
		data[9 * 4 + i * 4 + 2] = parseInt(peer.id.slice(4, 6), 16) & 0xff;
		data[9 * 4 + i * 4 + 3] = 255;
	}

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
