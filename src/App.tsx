import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ColumnNames,
	createDefaultBoard,
	RowNames,
	type Cell,
} from "./components/Board/BoardHelpers";
import { NetworkingMenu } from "./components/Networking/NetworkingMenu";
import { YambGame } from "./components/YambGame/YambGame";
import {
	PeerDataContext,
	StateContext,
	TabelaContext,
	type GameState,
} from "./contexts/GameContext";
import { useNetworking } from "./contexts/NetworkingContext";
import { HouseSvg, MoonSvg, SunSvg } from "./Svgs";
import { generateTailwindShades } from "./utils/generateTailwindShades";

const urlParams = new URLSearchParams(window.location.search);
const gameIdFromUrl = urlParams.get("game");

const data = gameIdFromUrl ? localStorage.getItem(gameIdFromUrl + "-data") : undefined;
let dataObj = data ? JSON.parse(data) : undefined;

type Theme = "light" | "dark";

function setThemeValues(newTheme: Theme) {
	let colors = ["bg", "fg", "black", "gray", "shade-1", "inner-bg", "control"];
	for (let color of colors) {
		document.documentElement.style.setProperty(
			`--${color}-color`,
			`var(--${color}-${newTheme})`
		);
	}
}
let loadedTheme: Theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";
if (loadedTheme != "light") setThemeValues(loadedTheme);

// 🦍
const App = () => {
	const [hasStarted, setHasStarted] = useState(gameIdFromUrl ? true : false);
	const [tabela, setTabela] = useState<Cell[][]>(() => dataObj?.tabela ?? createDefaultBoard());
	const [gameId, setGameId] = useState(gameIdFromUrl ?? "");

	const [peerData, setPeerData] = useState<PeerData[]>(dataObj?.peerData ?? []);

	const { connectToAllPeers, registerCallback, registerDataCallback } = useNetworking();

	const [theme, setTheme] = useState<Theme>(loadedTheme);

	const [gameState, setGameState] = useState<GameState>(
		dataObj?.gameState ?? {
			roundIndex: 0,
			value: [],
			isMyMove: false,
			chosenDice: [],
			rolledDice: [],
			numChosenDice: 0,
			isExcluded: [],
		}
	);

	const onReceivePeerData = useCallback(
		(incoming: boolean, _conn: any, data: any) => {
			if (!incoming) {
				const peers = data.data.map((p: any) => p.id);
				if (peers.length) connectToAllPeers(peers);
				setPeerData(data.data);
			}
		},
		[connectToAllPeers]
	);

	const onReceiveName = useCallback((incoming: boolean, conn: any, data: any) => {
		if (incoming) {
			//console.log(`Received name. ${conn.peer} is named: ${data.name}`);
			setPeerData((prev) =>
				prev.map((p) => (p.id === conn.peer ? { ...p, name: data.name } : p))
			);
		}
	}, []);

	const onReceiveMove = useCallback((_incoming: boolean, conn: any, data: any) => {
		setPeerData((prev) =>
			prev.map((p) =>
				p.id === conn.peer && p.tabela == undefined
					? { ...p, tabela: createDefaultBoard() }
					: p
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
	}, []);

	useEffect(() => {
		registerCallback("open", (id) => {
			if (peerData.length == 0) {
				setPeerData([{ id, name: "", index: 0 }]);
			}
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

	const updateTabela = useCallback((row: number, col: number, value: Cell) => {
		setTabela((prev) => {
			//const copy = prev.map((row) => [...row]);
			const copy = prev;
			copy[row][col] = value;

			const calculateSumOfFirstSum = (colIndex: number) => {
				if (!copy[RowNames.Suma1][colIndex]?.value) {
					let cnt = 0;
					let sum = 0;
					for (let i = 0; i < 6; i++) {
						if (copy[i][colIndex]?.value != undefined) {
							cnt++;
							sum += copy[i][colIndex]?.value ?? 0;
						}
					}
					if (sum > 60) {
						sum += 30;
					}

					if (cnt == 6) {
						copy[RowNames.Suma1][colIndex] = { value: sum, isAvailable: false };
						calculateSumOfRow(RowNames.Suma1);
					}
				}
			};
			const calculateSumOfSecondSum = (colIndex: number) => {
				if (!copy[RowNames.Suma2][colIndex]?.value) {
					let maxi = copy[RowNames.Maksimum][colIndex]?.value;
					let mini = copy[RowNames.Minimum][colIndex]?.value;
					let jedinice = copy[RowNames.Jedinice][colIndex]?.value;

					if (maxi != undefined && mini != undefined && jedinice != undefined) {
						let sum = Math.max(maxi - mini, 0) * jedinice;
						copy[RowNames.Suma2][colIndex] = { value: sum, isAvailable: false };
						calculateSumOfRow(RowNames.Suma2);
					}
				}
			};
			const calculateSumOfLastSum = (colIndex: number) => {
				if (!copy[RowNames.Suma3][colIndex]?.value) {
					let sum = 0;
					for (let rowIndex = RowNames.Kenta; rowIndex <= RowNames.Yamb; rowIndex++) {
						if (copy[rowIndex][colIndex]?.value == undefined) {
							return;
						}
						sum += copy[rowIndex][colIndex]?.value ?? 0;
					}
					copy[RowNames.Suma3][colIndex] = { value: sum, isAvailable: false };
					calculateSumOfRow(RowNames.Suma3);
				}
			};
			const calculateSumOfRow = (rowName: (typeof RowNames)[keyof typeof RowNames]) => {
				if (copy[rowName][ColumnNames.Yamb]?.value == undefined) {
					let sum = 0;
					for (let colIndex = 0; colIndex < 10; colIndex++) {
						if (
							!gameState.isExcluded[colIndex] &&
							copy[rowName][colIndex]?.value == undefined
						) {
							return;
						}
						sum += copy[rowName][colIndex]?.value ?? 0;
					}
					copy[rowName][ColumnNames.Yamb] = { value: sum, isAvailable: false };
				}
			};
			if (row >= RowNames.Jedinice && row <= RowNames.Sestice) calculateSumOfFirstSum(col);
			if (row == RowNames.Maksimum || row == RowNames.Minimum || row == RowNames.Jedinice)
				calculateSumOfSecondSum(col);
			if (row >= RowNames.Kenta && row <= RowNames.Yamb) calculateSumOfLastSum(col);

			return copy;
		});
	}, []);

	const [willJoinHost, setWillJoinHost] = useState(false); // bad name
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const gameIdFromUrl = urlParams.get("game");
		if (gameIdFromUrl) {
			setHasStarted(true);
		}

		const hostIdFromUrl = urlParams.get("host");
		if (hostIdFromUrl) {
			setHostId(hostIdFromUrl);
			setWillJoinHost(true);
			window.history.replaceState({}, "", window.location.pathname);
		}
	}, []);

	// EASTER EGG ----------------------------------
	const tapsRef = useRef<number[]>([]);
	const TAP_WINDOW = 1000; // ms

	const [isRunning, setIsRunning] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	// function that gets called every second
	const tick = () => {
		let randomColor = Math.floor(Math.random() * 16777215)
			.toString(16)
			.padStart(6, "0");
		generateTailwindShades(randomColor);
	};

	useEffect(() => {
		if (isRunning) {
			intervalRef.current = setInterval(tick, 1000);
		} else if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		// cleanup on unmount
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isRunning]);

	useEffect(() => {
		function handleClick() {
			const now = Date.now();
			tapsRef.current.push(now);

			// keep only last 5
			if (tapsRef.current.length > 5) tapsRef.current.shift();

			// check if 5 taps within window
			if (
				tapsRef.current.length === 5 &&
				tapsRef.current[4] - tapsRef.current[0] <= TAP_WINDOW
			) {
				setIsRunning((prev) => !prev);

				tapsRef.current = []; // reset
			}

			// drop stale taps
			const cutoff = now - TAP_WINDOW;
			while (tapsRef.current.length && tapsRef.current[0] < cutoff) {
				tapsRef.current.shift();
			}
		}

		document.body.addEventListener("click", handleClick);
		return () => document.body.removeEventListener("click", handleClick);
	}, []);
	// EASTER EGG ----------------------------------

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

	// ✅ memoize context values to avoid re-renders
	const tabelaContextValue = useMemo(
		() => ({ tabela, setTabela, updateTabela }),
		[tabela, updateTabela]
	);
	const peerDataContextValue = useMemo(() => ({ peerData, setPeerData }), [peerData]);

	return (
		<div>
			<TabelaContext.Provider value={tabelaContextValue}>
				<PeerDataContext.Provider value={peerDataContextValue}>
					{!hasStarted ? (
						<NetworkingMenu
							setHasStarted={setHasStarted}
							setGameId={setGameId}
							hostId={hostId}
							setHostId={setHostId}
							willJoinHost={willJoinHost}
							setWillJoinHost={setWillJoinHost}
						/>
					) : (
						<StateContext.Provider value={{ gameState, setGameState }}>
							<YambGame gameId={gameId} hostId={hostId} />
						</StateContext.Provider>
					)}
				</PeerDataContext.Provider>
			</TabelaContext.Provider>
			<button
				className="fixed bottom-[5vw] right-[5vw] h-[9.75vw] w-[9.75vw] rounded-[0.9vw] border-[0.5vw] border-main-600 bg-main-900 p-[0.6vw] sm:bottom-[32px] sm:right-[32px] sm:h-[50px] sm:w-[50px] sm:rounded-[6px] sm:border-[2px] sm:p-[4px]"
				onClick={() => {
					window.location.href = "/yamb/";
				}}
			>
				<HouseSvg />
			</button>
			<button
				className="fixed bottom-[5vw] left-[5vw] h-[9.75vw] w-[9.75vw] rounded-[0.9vw] border-[0.5vw] border-main-600 bg-main-900 p-[0.6vw] sm:bottom-[32px] sm:left-[32px] sm:h-[50px] sm:w-[50px] sm:rounded-[6px] sm:border-[2px] sm:p-[4px]"
				onClick={() => {
					let newTheme: Theme = theme === "light" ? "dark" : "light";

					setThemeValues(newTheme);
					setTheme(newTheme);
					localStorage.setItem("theme", newTheme);
				}}
			>
				{theme === "light" ? <MoonSvg /> : <SunSvg />}
			</button>
		</div>
	);
};

export default App;
export interface PeerData {
	id: string;
	name?: string;
	index?: number;
	tabela?: Cell[][];
}
