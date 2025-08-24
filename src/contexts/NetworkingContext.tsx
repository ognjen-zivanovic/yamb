import { customAlphabet } from "nanoid";
import Peer, { type DataConnection, type PeerEvents } from "peerjs";
import React, {
	type Dispatch,
	type SetStateAction,
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

export interface NetworkingContextValue {
	peerId: string;

	connectToPeer: (peerId: string) => DataConnection | undefined;
	connectToAllPeers: (peerIds: string[]) => void;

	broadcastMessage: (type: string, data: any) => void;

	sendMessageToNextPlayer: (type: string, data: any) => void;

	registerCallback: (type: keyof PeerEvents, callback: (...args: any[]) => void) => void;
	registerDataCallback: (type: string, callback: (...args: any[]) => void) => void;

	setNextPeerId: Dispatch<SetStateAction<string>>;
}
const NetworkingContext = createContext<NetworkingContextValue | undefined>(undefined);
const urlParams = new URLSearchParams(window.location.search);
const gameIdFromUrl = urlParams.get("game");
const hostIdFromUrl = urlParams.get("host");
const data = gameIdFromUrl ? localStorage.getItem(gameIdFromUrl + "-data") : undefined;
let savedGameData = data ? JSON.parse(data) : undefined;
const savedPeerId = gameIdFromUrl ? localStorage.getItem(gameIdFromUrl + "-peerId") : undefined;
// find index of me
let index = savedGameData?.peerData.findIndex((p: any) => p.id === savedPeerId);
let savedNextPeerId = undefined;
if (index != undefined && savedGameData != undefined) {
	savedNextPeerId = savedGameData.peerData[(index + 1) % savedGameData.peerData.length]?.id;
	console.log("Next peer id is ", savedNextPeerId);
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const nanoid = customAlphabet(alphabet, 6);

export const NetworkingProvider = ({ children }: { children: React.ReactNode }) => {
	const [peer] = useState<Peer | null>(
		savedPeerId ? new Peer(savedPeerId) : hostIdFromUrl ? new Peer() : new Peer(nanoid())
	);
	const [connections, setConnections] = useState<Map<string, any>>(new Map());
	const [peerId, setPeerId] = useState("");

	const [nextPeerId, setNextPeerId] = useState(savedNextPeerId ?? "");

	// function callbacks, map from string to a function
	// Use a ref so event handlers always see the latest callbacks without stale closures
	const callbacksRef = useRef<Map<string, (...args: any[]) => void>>(new Map());

	useEffect(() => {
		if (peer == null) return;
		console.log(peer);
		peer.on("open", (id) => {
			setPeerId(id);
			console.log(`Your Peer ID: ${id}`);
		});

		peer.on("connection", (conn) => {
			console.log(`Incoming connection from ${conn.peer}`);
			setupConnection(conn, true); // Incoming = host side
		});

		return () => {
			peer.destroy();
		};
	}, []);

	const connectToPeer = (id: string) => {
		if (!peer) return;
		const conn = peer.connect(id);
		setupConnection(conn);
		if (!conn) console.log("Failed to connect to peer: ", id);
		return conn;
	};

	const connectToAllPeers = (peerIds: string[]) => {
		if (!peer) return;
		peerIds.forEach((id) => {
			if (id === peerId || connections.has(id)) return;
			connectToPeer(id);
		});
	};

	const registerCallback = (type: keyof PeerEvents, callback: (...args: any[]) => void) => {
		peer?.on(type, callback);
	};

	const registerDataCallback = (type: string, callback: (...args: any[]) => void) => {
		callbacksRef.current.set(type, callback);
	};

	const setupConnection = (conn: any, incoming = false) => {
		const handleOpen = () => {
			setConnections((prev) => new Map(prev.set(conn.peer, conn)));
		};

		const handleData = (data: any) => {
			const map = callbacksRef.current;
			if (map.has(data.type)) {
				map.get(data.type)?.(incoming, conn, data);
			}
		};

		const handleClose = () => {
			setConnections((prev) => {
				const copy = new Map(prev);
				copy.delete(conn.peer);
				return copy;
			});
		};

		conn.on("open", handleOpen);
		conn.on("data", handleData);
		conn.on("close", handleClose);
	};

	const broadcastMessage = (type: string, data: any) => {
		// console.log(`You: ${message}`);
		connections.forEach((conn) => conn.send({ type, data }));
	};

	const sendMessageToNextPlayer = (type: string, data: any) => {
		// find the index of me
		console.log("Sending message to next player, next player hash is ", nextPeerId);
		if (nextPeerId != "") {
			const conn = connections.get(nextPeerId);
			if (conn) {
				conn.send({ type, data });
			}
		}
	};

	return (
		<NetworkingContext.Provider
			value={{
				peerId,
				connectToPeer,
				connectToAllPeers,
				broadcastMessage,
				sendMessageToNextPlayer,
				registerCallback,
				registerDataCallback,
				setNextPeerId,
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
