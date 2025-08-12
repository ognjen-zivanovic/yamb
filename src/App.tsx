import {
	useEffect,
	useState,
	createContext,
	type SetStateAction,
	type Dispatch,
	useRef,
} from "react";
import { NetworkingMenu } from "./NetworkingMenu";
import { YambBoard } from "./Board";
import type { RowName } from "./Board";
import { DicePicker } from "./Dice";
import { NetworkingProvider, useNetworking } from "./NetworkingContext";
import { type Cell } from "./Board";

export interface State {
	roundIndex: number;
	value: number[];
	najava?: RowName;
	dirigovana?: RowName;
	isMyMove: boolean;
}

export const StateContext = createContext<{
	state: State;
	setState: Dispatch<SetStateAction<State>>;
}>({
	state: {} as State,
	setState: () => {},
});

const Yamb = () => {
	const [state, setState] = useState<State>({ roundIndex: 0, value: [], isMyMove: false });
	const [tabela, setTabela] = useState<Cell[][]>(() => Array.from({ length: 16 }, () => []));

	const updateTabela = (row: number, col: number, value: Cell) => {
		setTabela((prev) => {
			const copy = prev.map((row) => [...row]);
			copy[row][col] = value;
			return copy;
		});
	};

	const [scale, setScale] = useState(1);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const { peerData, peerId, registerCallback } = useNetworking();
	useEffect(() => {
		if (peerData[0].id === peerId) {
			setState((prev) => ({ ...prev, isMyMove: true }));
		}
	}, []);

	const onRecievePreviousPlayersMove = (_incoming: boolean, _conn: any, data: any) => {
		console.log("previous players move", data);
		console.log("aklj;sdf;asdfl;jkasdfl;jkasdfljkasdfjklafsd");
		setState((prev) => ({ ...prev, isMyMove: true }));
	};
	const onReceiveNajava = (_incoming: boolean, _conn: any, data: any) => {
		console.log("najava", data);
		setState((prev) => ({ ...prev, dirigovana: data.data as RowName }));
	};

	useEffect(() => {
		registerCallback("najava", onReceiveNajava);
		registerCallback("move", onRecievePreviousPlayersMove);
	}, []);

	useEffect(() => {
		const updateScale = () => {
			const width = window.innerWidth;
			setScale(width >= 600 ? 1.0 : (0.9 * width) / 600);
		};

		updateScale();
		window.addEventListener("resize", updateScale);
		return () => window.removeEventListener("resize", updateScale);
	}, []);

	useEffect(() => {
		try {
			const rows = tabela.length;
			const cols = tabela.reduce((max, r) => Math.max(max, r.length), 0);
			const totalCells = rows * cols;

			let headerSize = 3;
			// 3 pixels
			// first one stores rows in R, columns in G, and 255 in B and A
			// second pixel stores the first character of the name in R, second in G, third in B and 255 in A
			// third pixel stores the fourth character of the name in R, fifth in G, sixth in B and 255 in A

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

			data[0 + 0] = rows & 0xff;
			data[0 + 1] = cols & 0xff;
			data[0 + 2] = 255;
			data[0 + 3] = 255;

			data[1 * 4 + 0] = "O".charCodeAt(0) & 0xff;
			data[1 * 4 + 1] = "G".charCodeAt(0) & 0xff;
			data[1 * 4 + 2] = "N".charCodeAt(0) & 0xff;
			data[1 * 4 + 3] = 255;

			data[2 * 4 + 0] = "J".charCodeAt(0) & 0xff;
			data[2 * 4 + 1] = "E".charCodeAt(0) & 0xff;
			data[2 * 4 + 2] = "N".charCodeAt(0) & 0xff;
			data[2 * 4 + 3] = 255;

			// console.log(data[0 + 0], data[0 + 1], data[0 + 2], data[0 + 3]);
			// console.log(data[1 * 4 + 0], data[1 * 4 + 1], data[1 * 4 + 2], data[1 * 4 + 3]);
			// console.log(data[2 * 4 + 0], data[2 * 4 + 1], data[2 * 4 + 2], data[2 * 4 + 3]);
			// Encode cells row-major into pixels
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const cellIndex = r * cols + c + headerSize;
					const pixelOffset = cellIndex * 4;

					const cell = tabela[r]?.[c];
					let value = 0x50; // sentinel for undefined
					let available = 2; // 2 = undefined, 1 = true, 0 = false
					let hasValue = 0xa0;

					if (cell) {
						if (cell.value !== undefined) {
							// clamp to int16
							const v = cell.value;
							value = Math.max(0, Math.min(255, v));
						}
						if (cell.isAvailable !== undefined) {
							available = cell.isAvailable ? 1 : 0;
						}
						if (cell.value !== undefined) {
							hasValue = 0xa2;
						}
					}

					// pack int16 big-endian into R,G
					const i8 = value & 0xff;
					// console.log(u16);
					available = 0xff - available;

					// 50a2ff
					data[pixelOffset + 0] = i8; // R
					data[pixelOffset + 1] = hasValue; // G: 0
					data[pixelOffset + 2] = available; // B: value
					data[pixelOffset + 3] = 255; // A
				}
			}

			// Ensure remaining pixels (padding) are opaque black
			for (let i = (totalCells + headerSize) * 4; i < data.length; i += 4) {
				data[i + 0] = 0;
				data[i + 1] = 0;
				data[i + 2] = 0;
				data[i + 3] = 255;
			}

			// console.log(data);
			ctx.putImageData(imageData, 0, 0);

			// 4) Save as PNG

			//let thing = buttonRef.current!;
			//thing.onclick = () => {
			//	let canvas = canvasRef.current!;
			//	console.log("SHIIIIIIIIIIIIIIIIIIi");
			//	var imageURL = canvas.toDataURL("image/png");
			//	var link = document.createElement("a");
			//	link.href = imageURL;
			//	link.download = "tabela.png";
			//	link.click();
			//};
		} catch (err) {
			console.error("Failed to export tabela image:", err);
		}
	}, [tabela]);

	return (
		<div>
			<StateContext.Provider value={{ state, setState }}>
				<div className="flex flex-col items-center justify-center h-screen w-screen">
					<div className="flex flex-row relative z-10">
						<canvas ref={canvasRef} className="h-[1px] absolute translate-x-[-50%]" />
						{/* <button ref={buttonRef} className="w-16 h-16 bg-amber-900">
					Shit
				</button> */}
					</div>
					<div style={{ transform: `scale(${scale})`, transformOrigin: "top" }}>
						<YambBoard
							scale={scale}
							tabela={tabela}
							setTabela={setTabela}
							updateTabela={updateTabela}
						/>

						{state.isMyMove && <DicePicker />}
					</div>
					<button
						onClick={() => {
							// load png from custom file

							// load file
							const input = document.createElement("input");
							input.type = "file";
							input.accept = "image/*";

							input.onchange = () => {
								const file = input.files?.[0];
								if (!file) return;

								const reader = new FileReader();

								reader.onload = (e) => {
									const dataUrl = e.target?.result as string;
									const img = new Image();

									img.onload = () => {
										//const canvas = canvasRef.current!;
										// create a temp invisible canvas
										const canvas = document.createElement("canvas");
										canvas.width = img.width;
										canvas.height = img.height;

										const ctx = canvas.getContext("2d");
										if (!ctx) {
											console.error("Unable to get 2D context");
											return;
										}

										ctx.drawImage(img, 0, 0);
										const imageData = ctx.getImageData(
											0,
											0,
											img.width,
											img.height
										);
										const pixels = imageData.data; // Uint8ClampedArray [r, g, b, a, r, g, b, a, ...]

										// console.log("Pixel data:", pixels);
										// console.log(`Image dimensions: ${img.width}x${img.height}`);

										let start = -1;
										let startCnt = 0;

										for (let i = 0; i < pixels.length; i += 4) {
											const r = pixels[i];
											const g = pixels[i + 1];
											const b = pixels[i + 2];

											if (
												r == "O".charCodeAt(0) &&
												g == "G".charCodeAt(0) &&
												b == "N".charCodeAt(0)
											) {
												const r2 = pixels[i + 4];
												const g2 = pixels[i + 5];
												const b2 = pixels[i + 6];
												if (
													r2 == "J".charCodeAt(0) &&
													g2 == "E".charCodeAt(0) &&
													b2 == "N".charCodeAt(0)
												) {
													console.log("Found O G N J E N");
													start = i;
													startCnt++;
												}
											}
										}
										console.log("startCnt", startCnt);
										if (start != -1) {
											let rows = pixels[start - startCnt * 4];
											let cols = pixels[start - startCnt * 4 + 1];
											let totalCells = rows * cols;

											console.log(rows, cols, totalCells);
											start += (startCnt + 1) * 4;
											for (let r = 0; r < rows; r++) {
												for (let c = 0; c < cols; c++) {
													const cellIndex = r * cols + c;
													const pixelOffset =
														cellIndex * 4 * startCnt + start;

													let availableNum: number | undefined =
														0xff - pixels[pixelOffset + 2];
													let available: boolean | undefined = undefined;
													let hasValue: boolean | undefined =
														pixels[pixelOffset + 1] == 0xa2;
													let val: number | undefined =
														pixels[pixelOffset];
													if (hasValue == false) val = undefined;
													if (availableNum == 2) available = undefined;
													if (availableNum == 1) available = true;
													if (availableNum == 0) available = false;

													if (
														val != undefined ||
														available != undefined
													) {
														console.log(
															r,
															c,
															val,
															available,
															pixels[pixelOffset + 1]
														);
														updateTabela(r, c, {
															value: val,
															isAvailable: available,
														});
													}
												}
											}
										}
									};

									img.src = dataUrl;
								};

								reader.readAsDataURL(file);
							};

							input.click();
						}}
					>
						KOKOOOOO
					</button>
				</div>
			</StateContext.Provider>
		</div>
	);
};

const PreviousSaveBoard = () => {
	const [tabela, setTabela] = useState<Cell[][]>(() => Array.from({ length: 16 }, () => []));

	const updateTabela = (row: number, col: number, value: Cell) => {
		setTabela((prev) => {
			const copy = prev.map((row) => [...row]);
			copy[row][col] = value;
			return copy;
		});
	};

	const [scale, setScale] = useState(1);

	useEffect(() => {
		const updateScale = () => {
			const width = window.innerWidth;
			setScale(width >= 600 ? 1.0 : (0.9 * width) / 600);
		};

		updateScale();
		window.addEventListener("resize", updateScale);
		return () => window.removeEventListener("resize", updateScale);
	}, []);

	return (
		<div>
			<YambBoard
				scale={scale}
				tabela={tabela}
				setTabela={setTabela}
				updateTabela={updateTabela}
			/>
		</div>
	);
};

const App = () => {
	const [hasStarted, setHasStarted] = useState(false);

	return (
		<div>
			<NetworkingProvider>
				{!hasStarted ? <NetworkingMenu setHasStarted={setHasStarted} /> : <Yamb />}
			</NetworkingProvider>
		</div>
	);
};

export default App;
