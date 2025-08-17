import chroma from "chroma-js";
import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react";
import { YambBoard } from "./Board";
import type { RowName } from "./BoardConstants";
import { defaultTabela, type Cell } from "./BoardConstants";
import { DicePicker } from "./Dice";
import { useNetworking, type PeerData } from "./NetworkingContext";
import { NetworkingMenu } from "./NetworkingMenu";

const urlParams = new URLSearchParams(window.location.search);
export const gameIdFromUrl = urlParams.get("game");

export interface GameState {
	roundIndex: number;
	value: number[];
	najava?: RowName;
	dirigovana?: RowName;
	isMyMove: boolean;
	blackout?: boolean;
}

export interface TabelaState {
	tabela: Cell[][];
	setTabela: Dispatch<SetStateAction<Cell[][]>>;
	updateTabela: (row: number, col: number, cell: Cell) => void;
}

export interface PeerDataState {
	peerData: PeerData[];
	setPeerData: Dispatch<SetStateAction<PeerData[]>>;
}

export const StateContext = createContext<{
	state: GameState;
	setState: Dispatch<SetStateAction<GameState>>;
}>({
	state: {} as GameState,
	setState: () => {},
});

export const TabelaContext = createContext<TabelaState>({
	tabela: [] as Cell[][],
	setTabela: () => {},
	updateTabela: () => {},
});

export const PeerDataContext = createContext<PeerDataState>({
	peerData: [] as PeerData[],
	setPeerData: () => {},
});

const data = localStorage.getItem(gameIdFromUrl + "-data");
let dataObj = data ? JSON.parse(data) : undefined;

const Yamb = ({
	gameId,
	hostId,
	setHostId,
}: {
	gameId: string;
	hostId: string;
	setHostId: Dispatch<SetStateAction<string>>;
}) => {
	const [state, setState] = useState<GameState>(
		dataObj?.state ?? {
			roundIndex: 0,
			value: [],
			isMyMove: false,
		}
	);

	const { peerData, setPeerData } = useContext(PeerDataContext);

	const { peerId, registerDataCallback } = useNetworking();

	const [scale, setScale] = useState(1);
	const { tabela, updateTabela } = useContext(TabelaContext);

	const [showSettings, setShowSettings] = useState(false);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const colorPickerRef = useRef<HTMLInputElement>(null);
	const [textRef, setTextRef] = useState<HTMLDivElement | null>(null);

	const [themeColor, setThemeColor] = useState(dataObj?.color ?? "#50a2ff"); // save maybe

	useEffect(() => {
		if (peerData.length > 0) {
			if (hostId == peerId) setState((prev) => ({ ...prev, isMyMove: true }));
		}
	}, []);

	useEffect(() => {
		let data: any = {};

		data.peerData = peerData;
		data.peerData = data.peerData.map((p: any) => (p.id === peerId ? { ...p, tabela } : p));
		data.tabela = tabela;
		data.peerId = peerId;
		data.state = state;
		data.color = themeColor;
		data.date = new Date().getTime();

		localStorage.setItem(gameId + "-data", JSON.stringify(data));
		localStorage.setItem(gameId + "-peerId", peerId); // should this be moved to NetworkingContext?
	}, [state, tabela, peerData, themeColor]);

	const onReceivePreviousPlayersMove = (_incoming: boolean, _conn: any, _data: any) => {
		setState((prev) => ({ ...prev, isMyMove: true }));
	};
	const onReceiveNajava = (_incoming: boolean, _conn: any, data: any) => {
		setState((prev) => ({ ...prev, dirigovana: data.data as RowName }));
	};

	useEffect(() => {
		registerDataCallback("najava", onReceiveNajava);
		registerDataCallback("next-player", onReceivePreviousPlayersMove);
	}, []);

	function getRandomColor() {
		let letters = "0123456789ABCDEF";
		let color = "#";
		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
	useEffect(() => {
		const updateScale = () => {
			const width = window.innerWidth;
			let newScale = width >= 600 ? 1.0 : (0.9 * width) / 600;
			setScale(newScale);

			//setThemeColor(getRandomColor());
		};

		updateScale();
		window.addEventListener("resize", updateScale);
		return () => window.removeEventListener("resize", updateScale);
	}, []);

	useEffect(() => {
		try {
			encodeTabelaToCanvas(tabela, canvasRef, themeColor);

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
	}, [tabela, themeColor]);

	useEffect(() => {
		colorPickerRef.current?.addEventListener("change", () => {
			const color = colorPickerRef.current?.value;
			if (!color) return;
			setThemeColor(color);
		});
	}, []);

	useEffect(() => {
		generateTailwindShades(themeColor);
	}, [themeColor]);

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
					<div
						style={{ transform: `scale(${scale})`, transformOrigin: "top" }}
						className="relative"
					>
						<YambBoard tabela={tabela} updateTabela={updateTabela} />
						<div
							className="absolute m-6 rounded-md border-4 bg-main-200 p-2 text-3xl"
							style={{ top: "525px" }}
							onClick={(e) => {
								(e.target as HTMLDivElement).hidden = true;
							}}
							hidden={true}
							ref={setTextRef}
						>
							☝️🤖
						</div>
						<div className="mt-6 flex flex-row items-center justify-center gap-6">
							<div className="mb-2 flex flex-col items-center justify-around gap-4">
								<button
									className="relative h-[50px] w-[50px] rounded-md border-2 border-main-600 bg-main-900 p-1"
									// onClick={() => {
									// 	showColorPicker();
									// }}
								>
									<img src="assets/large-paint-brush.svg"></img>
									<input
										type="color"
										defaultValue="#eb6434"
										ref={colorPickerRef}
										className="absolute left-0 top-0 h-12 w-12 opacity-0"
									/>
								</button>

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
								{state.roundIndex > 0 && (
									<button
										className="h-[50px] w-[50px] rounded-md border-2 border-main-600 bg-main-900 p-1"
										onClick={() => {
											setShowSettings(!showSettings);
										}}
									>
										<img src="assets/cog.svg"></img>
									</button>
								)}
							</div>
							<DicePicker
								showSettings={showSettings}
								textRef={textRef}
								gameId={gameId}
							/>
						</div>
					</div>

					{/* <button onClick={saveToLocalStorage}>Save to local storage</button> */}
				</div>
			</StateContext.Provider>
		</div>
	);
};

const App = () => {
	const [hasStarted, setHasStarted] = useState(gameIdFromUrl ? true : false);
	const [tabela, setTabela] = useState<Cell[][]>(dataObj?.tabela ?? defaultTabela());
	const [gameId, setGameId] = useState(gameIdFromUrl ? gameIdFromUrl : "");

	const [peerData, setPeerData] = useState<PeerData[]>(dataObj?.peerData ?? []);

	const { connectToAllPeers, registerCallback, registerDataCallback } = useNetworking();

	const onReceivePeerData = (incoming: boolean, _conn: any, data: any) => {
		if (!incoming) {
			console.log(`Received peer data: ${data.data}`);
			const peers = data.data.map((p: any) => p.id);
			console.log("Peers: ", peers);
			if (peers.length) connectToAllPeers(peers);
			setPeerData(data.data);
		}
	};

	const onReceiveName = (incoming: boolean, conn: any, data: any) => {
		if (incoming) {
			//console.log(`Received name. ${conn.peer} is named: ${data.name}`);
			setPeerData((prev) =>
				prev.map((p) => (p.id === conn.peer ? { ...p, name: data.name } : p))
			);
		}
	};

	const onReceiveMove = (_incoming: boolean, conn: any, data: any) => {
		setPeerData((prev) =>
			prev.map((p) =>
				p.id === conn.peer && p.tabela == undefined ? { ...p, tabela: defaultTabela() } : p
			)
		);
		data = data.data;
		let rowIndex = data.rowIndex;
		let colIndex = data.colIndex;
		let value = data.value;
		setPeerData((prev) => {
			//data = data.data;
			return prev.map((p) =>
				p.id === conn.peer && p.tabela != undefined
					? {
							...p,
							tabela: p.tabela.map((row, i) =>
								i == rowIndex
									? row.map((cell, j) =>
											j == colIndex ? { ...cell, value } : cell
									  )
									: row
							),
					  }
					: p
			);
		});
	};

	useEffect(() => {
		registerCallback("open", (id) => {
			if (peerData.length == 0) {
				setPeerData([{ id, name: "", index: 0 }]);
			}

			console.log("CALLING OPEN");
			console.log("MY ID IS: ", id);
			console.log(
				"PEER DATA IS: ",
				peerData.map((p) => p.id)
			);
			connectToAllPeers(peerData.map((p) => p.id));
		});

		registerCallback("connection", (conn) => {
			console.log(`Incoming connection from FROM APP ${conn.peer}`);
			setPeerData((prev) => {
				if (!prev.find((p) => p.id === conn.peer)) {
					return [...prev, { id: conn.peer, name: "", index: prev.length }];
				}
				return prev;
			});
		});

		registerDataCallback("peer-data", onReceivePeerData);
		registerDataCallback("name", onReceiveName);
		registerDataCallback("move", onReceiveMove);
	}, []);

	const [hostId, setHostId] = useState("");

	const updateTabela = (row: number, col: number, value: Cell) => {
		setTabela((prev) => {
			const copy = prev.map((row) => [...row]);
			copy[row][col] = value;
			return copy;
		});
	};

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const gameIdFromUrl = urlParams.get("game");
		if (gameIdFromUrl) {
			setHasStarted(true);
		}

		const hostIdFromUrl = urlParams.get("host");
		if (hostIdFromUrl) {
			setHostId(hostIdFromUrl);

			console.log(`Host ID loaded from URL: ${hostIdFromUrl}`);
			// remove it from url
			window.history.replaceState({}, "", window.location.pathname);
		}
	}, []);

	useEffect(() => {
		if (gameId) {
			const urlParams = new URLSearchParams(window.location.search);

			urlParams.set("game", gameId);

			window.history.replaceState(
				{},
				"",
				window.location.pathname + "?" + urlParams.toString()
			);
		}
	}, [gameId]);

	return (
		<div>
			<TabelaContext.Provider value={{ tabela, setTabela, updateTabela }}>
				<PeerDataContext.Provider value={{ peerData, setPeerData }}>
					{!hasStarted ? (
						<NetworkingMenu
							setHasStarted={setHasStarted}
							setGameId={setGameId}
							hostId={hostId}
							setHostId={setHostId}
						/>
					) : (
						<Yamb gameId={gameId} hostId={hostId} setHostId={setHostId} />
					)}
				</PeerDataContext.Provider>
			</TabelaContext.Provider>
		</div>
	);
};

export default App;
function encodeTabelaToCanvas(tabela: Cell[][], canvasRef: any, themeColor: any) {
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

function generateTailwindShades(baseColor: string) {
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
