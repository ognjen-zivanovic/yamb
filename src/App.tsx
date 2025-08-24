import { useEffect, useState } from "react";
import { ColumnNames, createDefaultBoard, RowNames } from "./components/Board/BoardConstants";
import { type Cell } from "./components/Board/BoardConstants";
import { useNetworking } from "./contexts/NetworkingContext";
import { NetworkingMenu } from "./components/Networking/NetworkingMenu";
import { YambGame } from "./components/YambGame/YambGame";
import { TabelaContext, PeerDataContext } from "./contexts/GameContext";

const urlParams = new URLSearchParams(window.location.search);
const gameIdFromUrl = urlParams.get("game");

const data = gameIdFromUrl ? localStorage.getItem(gameIdFromUrl + "-data") : undefined;
let dataObj = data ? JSON.parse(data) : undefined;

// 🦍
const App = () => {
	const [hasStarted, setHasStarted] = useState(gameIdFromUrl ? true : false);
	const [tabela, setTabela] = useState<Cell[][]>(() => dataObj?.tabela ?? createDefaultBoard());
	const [gameId, setGameId] = useState(gameIdFromUrl ?? "");

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
				}
			};
			const calculateSumOfRow = (rowName: (typeof RowNames)[keyof typeof RowNames]) => {
				if (copy[rowName][ColumnNames.Yamb]?.value == undefined) {
					let sum = 0;
					for (let colIndex = 0; colIndex < 10; colIndex++) {
						if (copy[rowName][colIndex]?.value == undefined) {
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
			if (row == RowNames.Suma1 || row == RowNames.Suma2 || row == RowNames.Suma3)
				calculateSumOfRow(row);

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
						<YambGame gameId={gameId} hostId={hostId} />
					)}
				</PeerDataContext.Provider>
			</TabelaContext.Provider>
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
