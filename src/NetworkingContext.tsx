import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useRef,
	type Dispatch,
	type SetStateAction,
} from "react";
import Peer from "peerjs";
import { defaultTabela, type Cell } from "./BoardConstants";

export interface PeerData {
	id: string;
	name?: string;
	index?: number;
	tabela?: Cell[][];
}

export interface NetworkingContextValue {
	hostId: string;
	setHostId: Dispatch<SetStateAction<string>>;

	peerId: string;

	peerData: PeerData[];
	setPeerData: Dispatch<SetStateAction<PeerData[]>>;

	name: string;
	setName: Dispatch<SetStateAction<string>>;

	connectToPeer: (peerId: string) => void;
	broadcastMessage: (type: string, data: any) => void;
	sharePeerData: () => void;
	sendMessageToNextPlayer: (type: string, data: any) => void;
	registerCallback: (type: string, callback: (...args: any[]) => void) => void;
}

const NetworkingContext = createContext<NetworkingContextValue | undefined>(undefined);

const urlParams = new URLSearchParams(window.location.search);
export const gameIdFromUrl = urlParams.get("game");
const data = localStorage.getItem(gameIdFromUrl + "-data");
var dataObj = data ? JSON.parse(data) : undefined;
console.log(dataObj);

const savedPeerId = localStorage.getItem(gameIdFromUrl + "-peerId");

export const NetworkingProvider = ({ children }: { children: React.ReactNode }) => {
	var peer = savedPeerId ? new Peer(savedPeerId) : new Peer();
	const [connections, setConnections] = useState<Map<string, any>>(new Map());
	const [hostId, setHostId] = useState("");
	const [peerId, setPeerId] = useState(savedPeerId ?? "");
	const [peerData, setPeerData] = useState<PeerData[]>(dataObj?.peerData ?? []);
	const [name, setName] = useState("");

	// function callbacks, map from string to a function
	// Use a ref so event handlers always see the latest callbacks without stale closures
	const callbacksRef = useRef<Map<string, (...args: any[]) => void>>(new Map());

	const appendLog = (msg: string) => console.log(msg);

	useEffect(() => {
		// Check for host ID in URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const hostIdFromUrl = urlParams.get("host");
		if (hostIdFromUrl) {
			setHostId(hostIdFromUrl);
			appendLog(`Host ID loaded from URL: ${hostIdFromUrl}`);
			// remove it from url
			window.history.replaceState({}, "", window.location.pathname);
		}
	}, []);

	useEffect(() => {
		peer.on("open", (id) => {
			setPeerId(id);
			if (peerData.length == 0) {
				setPeerData([{ id, name: "", index: 0 }]);
			}
			appendLog(`Your Peer ID: ${id}`);
		});

		peer.on("connection", (conn) => {
			appendLog(`Incoming connection from ${conn.peer}`);
			setupConnection(conn, true); // Incoming = host side
		});
	}, []);

	useEffect(() => {
		for (let otherPeer of peerData) {
			if (connections.has(otherPeer.id) || otherPeer.id == peerId) continue;
			connectToPeer(otherPeer.id);
		}
	}, []);

	const connectToPeer = (id: string) => {
		console.log("PEER IS: ", peer);
		if (!peer) return;
		console.log("TRYING TO CONNECT TO: ", id);
		const conn = peer.connect(id);
		console.log("TRYING TO SETUP CONNECTION TO: ", id);
		setupConnection(conn);
	};

	const connectToPeers = (peerIds: string[]) => {
		if (!peer) return;
		peerIds.forEach((id) => {
			if (id === peerId || connections.has(id)) return;
			connectToPeer(id);
		});
	};

	const registerCallback = (type: string, callback: (...args: any[]) => void) => {
		callbacksRef.current.set(type, callback);
	};

	const onReceivePeerData = (incoming: boolean, _conn: any, data: any) => {
		if (!incoming) {
			//console.log(`Received peer data: ${data.peerData}`);
			const peers = Array.from(data.peerData.keys?.() ?? []) as string[];
			if (peers.length) connectToPeers(peers);
			setPeerData(data.peerData);
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

	const onReceiveMove = (incoming: boolean, conn: any, data: any) => {
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
		registerCallback("peer-data", onReceivePeerData);
		registerCallback("name", onReceiveName);
		registerCallback("move", onReceiveMove);
	}, []);

	const setupConnection = (conn: any, incoming = false) => {
		conn.on("open", () => {
			//console.log(`Connected to ${conn.peer}`);
			setConnections((prev) => new Map(prev.set(conn.peer, conn)));
			if (!incoming) {
				conn.send({ type: "name", name });
				//console.log(`Sent name: ${name}`);
			}
			console.log("MAYBE");
			setPeerData((prev) => [...prev, { id: conn.peer, name: "", index: prev.length }]);

			conn.on("data", (data: any) => {
				const map = callbacksRef.current;
				if (map.has(data.type)) {
					map.get(data.type)?.(incoming, conn, data);
				}
			});
		});
	};

	const broadcastMessage = (type: string, data: any) => {
		// console.log(`You: ${message}`);
		connections.forEach((conn) => conn.send({ type, data }));
	};

	const sharePeerData = () => {
		connections.forEach((conn) => conn.send({ type: "peer-data", peerData }));
		//console.log("Shared peer data.");
	};

	const sendMessageToNextPlayer = (type: string, data: any) => {
		// find the index of me
		const me = peerData.findIndex((p) => p.id === peerId);
		const nextPlayer = peerData[(me + 1) % peerData.length];
		if (nextPlayer) {
			const conn = connections.get(nextPlayer.id);
			if (conn) {
				conn.send({ type, data });
			}
		}
	};

	return (
		<NetworkingContext.Provider
			value={{
				hostId,
				peerId,
				peerData,
				name,
				setHostId,
				setPeerData,
				setName,
				connectToPeer,
				broadcastMessage,
				sharePeerData,
				sendMessageToNextPlayer,
				registerCallback,
			}}
		>
			{children}
		</NetworkingContext.Provider>
	);
};

export const useNetworking = () => {
	const ctx = useContext(NetworkingContext);
	if (!ctx) throw new Error("useNetworking must be used within NetworkingProvider");
	return ctx;
};
