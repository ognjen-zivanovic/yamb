import {
	useEffect,
	useState,
	createContext,
	type SetStateAction,
	type Dispatch,
	useRef,
	useContext,
} from "react";
import { NetworkingMenu } from "./NetworkingMenu";
import { YambBoard } from "./Board";
import type { RowName } from "./BoardConstants";
import { DicePicker } from "./Dice";
import { NetworkingProvider, useNetworking } from "./NetworkingContext";
import { ColumnNames, RowNames, type Cell } from "./BoardConstants";
import { defaultTabela } from "./BoardConstants";
import chroma from "chroma-js";

export interface State {
	roundIndex: number;
	value: number[];
	najava?: RowName;
	dirigovana?: RowName;
	isMyMove: boolean;
	blackout?: boolean;
}

function generateTailwindShades(baseColor?: string) {
	if (!baseColor) return;
	// These are roughly how Tailwind's default shades are spaced
	const scale = chroma.scale(["#fff", baseColor, "#000"]).mode("lrgb");

	const colors = {
		50: scale(0.05).hex(),
		100: scale(0.1).hex(),
		200: scale(0.2).hex(),
		300: scale(0.3).hex(),
		400: scale(0.4).hex(),
		500: scale(0.5).hex(), // base
		600: scale(0.6).hex(),
		700: scale(0.7).hex(),
		800: scale(0.8).hex(),
		900: scale(0.9).hex(),
		950: scale(0.95).hex(),
	};

	for (const [key, value] of Object.entries(colors)) {
		document.documentElement.style.setProperty("--main-" + key, value);
	}
}

export interface TabelaState {
	tabela: Cell[][];
	updateTabela: (row: number, col: number, cell: Cell) => void;
}

export const StateContext = createContext<{
	state: State;
	setState: Dispatch<SetStateAction<State>>;
}>({
	state: {} as State,
	setState: () => {},
});

export const TabelaContext = createContext<TabelaState>({
	tabela: [] as Cell[][],
	updateTabela: () => {},
});

const Yamb = () => {
	const [state, setState] = useState<State>({ roundIndex: 0, value: [], isMyMove: false });
	const [scale, setScale] = useState(1);
	const { tabela, updateTabela } = useContext(TabelaContext);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const colorPickerRef = useRef<HTMLInputElement>(null);

	const { peerData, setPeerData, peerId, registerCallback } = useNetworking();
	useEffect(() => {
		if (peerData[0].id === peerId) {
			setState((prev) => ({ ...prev, isMyMove: true }));
		}
	}, []);

	const saveToLocalStorage = () => {
		setPeerData((prev) => prev.map((p) => (p.id === peerId ? { ...p, tabela } : p)));

		setPeerData((prev) => {
			localStorage.setItem("yamb-" + Date.now().toString(), JSON.stringify(prev));
			return prev;
		});
	};

	const loadFromLocalStorage = () => {
		Object.keys(localStorage).forEach((key) => {
			console.log(key);
		});
	};

	const onRecievePreviousPlayersMove = (_incoming: boolean, _conn: any, _data: any) => {
		setState((prev) => ({ ...prev, isMyMove: true }));
	};
	const onReceiveNajava = (_incoming: boolean, _conn: any, data: any) => {
		setState((prev) => ({ ...prev, dirigovana: data.data as RowName }));
	};

	useEffect(() => {
		registerCallback("najava", onReceiveNajava);
		registerCallback("next-player", onRecievePreviousPlayersMove);
	}, []);

	function getRandomColor() {
		var letters = "0123456789ABCDEF";
		var color = "#";
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
	useEffect(() => {
		const updateScale = () => {
			generateTailwindShades(getRandomColor());
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

			ctx.putImageData(imageData, 0, 0);

			// 4) Save as PNG

			//let thing = buttonRef.current!;
			//thing.onclick = () => {
			//	let canvas = canvasRef.current!;
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

	useEffect(() => {
		colorPickerRef.current?.addEventListener("change", () => {
			generateTailwindShades(colorPickerRef.current?.value);
		});
	}, []);

	// const showColorPicker = () => {
	// 	colorPickerRef.current?.click();
	// };

	return (
		<div className="relative">
			<StateContext.Provider value={{ state, setState }}>
				<div className="absolute top-0 flex w-screen flex-col items-center justify-center pb-4 pt-4">
					<div className="relative z-10 flex flex-row">
						<canvas ref={canvasRef} className="absolute h-[1px] translate-x-[-50%]" />
						{/* <button ref={buttonRef} className="h-16 w-16 bg-amber-900">
					Shit
				</button> */}
					</div>
					<div style={{ transform: `scale(${scale})`, transformOrigin: "top" }}>
						<YambBoard tabela={tabela} updateTabela={updateTabela} />

						<div className="mt-6 flex flex-row items-center justify-center gap-6">
							<div className="mb-2 flex flex-col items-center justify-around gap-4">
								<button
									className="h-[50px] w-[50px] rounded-md border-2 border-main-600 bg-main-900 p-1"
									// onClick={() => {
									// 	showColorPicker();
									// }}
								>
									<img src="assets/large-paint-brush.svg"></img>
								</button>
								<input
									type="color"
									defaultValue="#eb6434"
									ref={colorPickerRef}
									className="fixed h-12 w-12 opacity-0"
								/>
								{state.isMyMove && state.roundIndex > 0 && (
									<>
										<button
											className="h-[50px] w-[50px] rounded-md border-2 border-main-600 bg-main-900 p-1"
											onClick={() =>
												setState((prev) => ({ ...prev, blackout: true }))
											}
										>
											<img src="assets/interdiction.svg"></img>
										</button>
									</>
								)}
							</div>
							{state.isMyMove && <DicePicker />}
						</div>
					</div>

					{/* <button onClick={saveToLocalStorage}>Save to local storage</button> */}
				</div>
			</StateContext.Provider>
		</div>
	);
};

const App = () => {
	const [hasStarted, setHasStarted] = useState(false);
	const [tabela, setTabela] = useState<Cell[][]>(defaultTabela());

	const updateTabela = (row: number, col: number, value: Cell) => {
		setTabela((prev) => {
			const copy = prev.map((row) => [...row]);
			copy[row][col] = value;
			return copy;
		});
	};

	return (
		<div>
			<TabelaContext.Provider value={{ tabela, updateTabela }}>
				<NetworkingProvider>
					{!hasStarted ? <NetworkingMenu setHasStarted={setHasStarted} /> : <Yamb />}
				</NetworkingProvider>
			</TabelaContext.Provider>
		</div>
	);
};

export default App;
