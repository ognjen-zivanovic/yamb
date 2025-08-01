import React, { useEffect, useState, createContext } from "react";
import Peer from "peerjs";
import type PeerJs from "peerjs"; // for types only
import { RowNames, YambBoard } from "./Board";
import { DicePicker } from "./Dice";

interface PeerData {
	id: string;
	name?: string;
	index?: number;
}

const App: React.FC = () => {
	const [peer, setPeer] = useState<Peer | null>(null);
	const [connections, setConnections] = useState<Map<string, PeerJs.DataConnection>>(new Map());
	const [isHost, setIsHost] = useState<boolean>(false);
	const [hostId, setHostId] = useState("");
	const [peerId, setPeerId] = useState("");
	const [peerData, setPeerData] = useState<PeerData[]>([]);
	const [log, setLog] = useState<string[]>([]);
	const [input, setInput] = useState("");
	const [name, setName] = useState("");

	const appendLog = (msg: string) => setLog((l) => [...l, msg]);

	useEffect(() => {
		const p = new Peer();
		setPeer(p);

		p.on("open", (id) => {
			setPeerId(id);
			setPeerData([{ id, name: "", index: 0 }]);
			appendLog(`Your Peer ID: ${id}`);
		});

		p.on("connection", (conn) => {
			appendLog(`Incoming connection from ${conn.peer}`);
			setupConnection(conn, true); // Incoming = host side
		});

		return () => {
			p.destroy();
		};
	}, []);

	useEffect(() => {
		setPeerData((prev) => prev.map((p) => (p.id === peerId ? { ...p, name } : p)));
	}, [name]);

	const setupConnection = (conn: PeerJs.DataConnection, incoming = false) => {
		conn.on("open", () => {
			appendLog(`Connected to ${conn.peer}`);
			setConnections((prev) => new Map(prev.set(conn.peer, conn)));
			conn.send({ type: "name", name: name });
			appendLog(`Sent name: ${name}`);
			setPeerData((prev) => [...prev, { id: conn.peer, name: "", index: prev.length }]);

			conn.on("data", (data) => {
				if (typeof data === "string") {
					appendLog(`${conn.peer}: ${data}`);
				} else if (!incoming && data.type === "peer-data") {
					appendLog(`Received peer data: ${data.peerData}`);
					let peers = Array.from(data.peerData.keys()) as string[];
					connectToPeers(peers);
					setPeerData(data.peerData);
				} else if (incoming && data.type === "name") {
					appendLog(`Received name. ${conn.peer} is named: ${data.name}`);
					setPeerData((prev) =>
						prev.map((p) => (p.id === conn.peer ? { ...p, name: data.name } : p))
					);
				}
				// add function for host to send name to all peers
				// ! !!! !

				//} else if (incoming && data.type === "name") {
				//	appendLog(`Received name. ${conn.peer} is named: ${data.name}`);
				//	setPeerData((prev) => new Map(prev.set(conn.peer, { name: data.name })));
				//}
			});
		});
	};

	const connectToPeer = (peerId: string) => {
		if (!peer) return;
		const conn = peer.connect(peerId);
		setupConnection(conn);
	};
	peerId;
	const connectToPeers = (peerIds: string[]) => {
		if (!peer) return;
		peerIds.forEach((id) => {
			if (id === peerId || connections.has(id)) return;
			connectToPeer(id);
		});
	};

	const startHost = () => {
		setIsHost(true);
		appendLog("Started as host. Share your ID with others.");
	};

	const joinHost = () => {
		connectToPeer(hostId);
	};

	const broadcastMessage = (message: string) => {
		appendLog(`You: ${message}`);
		connections.forEach((conn) => conn.send(message));
	};

	const sharePeerData = () => {
		connections.forEach((conn) => conn.send({ type: "peer-data", peerData: peerData }));
		appendLog("Shared peer data.");
	};

	return (
		<div className="p-10 g-10">
			<div>
				<p>
					<strong>Your ID:</strong> {peerId}
				</p>
				{!isHost ? (
					<div className="flex flex-row gap-2">
						<input
							placeholder="Host ID"
							value={hostId}
							onChange={(e) => setHostId(e.target.value)}
							className="border-2 border-gray-300 rounded-md"
						/>
						<button onClick={joinHost}>Join Room</button>
						<button onClick={startHost}>Become Host</button>
					</div>
				) : (
					<button onClick={sharePeerData}>Share! :)</button>
				)}
			</div>

			<hr />
			<div className="flex flex-row gap-2">
				<input
					placeholder="Type message"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							broadcastMessage(input);
							setInput("");
						}
					}}
					className="border-2 border-gray-300 rounded-md"
				/>
				<button
					onClick={() => {
						broadcastMessage(input);
						setInput("");
					}}
				>
					Send
				</button>
			</div>

			<hr />
			<div className="flex flex-row gap-2">
				<input
					placeholder="Type name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className="border-2 border-gray-300 rounded-md"
				/>
				<button>Set Name</button>
			</div>
			<hr />
			<h3>Log</h3>
			<ul style={{ maxHeight: 300, overflowY: "auto" }}>
				{log.map((line, i) => (
					<li key={i}>{line}</li>
				))}
			</ul>
			<hr />
			<h3>Peer Data</h3>
			<ul>
				{peerData.map((p) => (
					<li key={p.id}>
						{p.id}: {p.name}, {p.index}
					</li>
				))}
			</ul>
			<Main />
		</div>
	);
};

export interface State {
	roundIndex: number;
	value: number[];
	najava?: RowNames;
}

export const StateContext = createContext({ state: {} as State, setState: (_: State) => {} });

const Main = () => {
	const [state, setState] = useState<State>({ roundIndex: 0, value: [] });

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
			<StateContext.Provider value={{ state, setState }}>
				<div
					className="flex flex-col items-center justify-center h-screen w-screen"
					style={{ transform: `scale(${scale})` }}
				>
					<YambBoard />
					<DicePicker />
				</div>
			</StateContext.Provider>
		</div>
	);
};

export default App;
