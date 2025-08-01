import React, { useEffect, useState, createContext } from "react";
import Peer from "peerjs";
import type PeerJs from "peerjs"; // for types only
import { RowNames, YambBoard } from "./Board";
import { DicePicker } from "./Dice";

const App: React.FC = () => {
	const [peer, setPeer] = useState<Peer | null>(null);
	const [connections, setConnections] = useState<Map<string, PeerJs.DataConnection>>(new Map());
	const [isHost, setIsHost] = useState<boolean>(false);
	const [hostId, setHostId] = useState("");
	const [peerId, setPeerId] = useState("");
	const [log, setLog] = useState<string[]>([]);
	const [input, setInput] = useState("");

	const appendLog = (msg: string) => setLog((l) => [...l, msg]);

	useEffect(() => {
		const p = new Peer();
		setPeer(p);

		p.on("open", (id) => {
			setPeerId(id);
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

	const setupConnection = (conn: PeerJs.DataConnection, incoming = false) => {
		conn.on("open", () => {
			appendLog(`Connected to ${conn.peer}`);
			setConnections((prev) => new Map(prev.set(conn.peer, conn)));

			conn.on("data", (data) => {
				if (typeof data === "string") {
					appendLog(`${conn.peer}: ${data}`);
				} else if (!incoming && data.type === "peer-list") {
					appendLog(`Received peer list: ${data.peers.join(", ")}`);
					connectToPeers(data.peers);
				}
			});
		});
	};

	const startHost = () => {
		setIsHost(true);
		appendLog("Started as host. Share your ID with others.");
	};

	const joinHost = () => {
		if (!peer) return;
		const conn = peer.connect(hostId);
		setupConnection(conn);

		conn.on("open", () => {
			appendLog(`Connected to host ${hostId}`);
		});
	};

	const connectToPeers = (peerIds: string[]) => {
		if (!peer) return;
		peerIds.forEach((id) => {
			if (id === peerId || connections.has(id)) return;
			const conn = peer.connect(id);
			setupConnection(conn);
		});
	};

	const broadcastMessage = (message: string) => {
		appendLog(`You: ${message}`);
		connections.forEach((conn) => conn.send(message));
	};

	const sharePeerList = () => {
		const peerList = Array.from(connections.keys()).concat(peerId);
		connections.forEach((conn) => conn.send({ type: "peer-list", peers: peerList }));
		appendLog("Shared peer list.");
	};

	return (
		<div style={{ padding: 20 }}>
			<h2>WebRTC Full Mesh via PeerJS</h2>
			<div>
				<p>
					<strong>Your ID:</strong> {peerId}
				</p>
				{!isHost ? (
					<>
						<input
							placeholder="Host ID"
							value={hostId}
							onChange={(e) => setHostId(e.target.value)}
						/>
						<button onClick={joinHost}>Join Room</button>
						<button onClick={startHost}>Become Host</button>
					</>
				) : (
					<button onClick={sharePeerList}>Send Peer List to All</button>
				)}
			</div>

			<hr />
			<div>
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
			<h3>Log</h3>
			<ul style={{ maxHeight: 300, overflowY: "auto" }}>
				{log.map((line, i) => (
					<li key={i}>{line}</li>
				))}
			</ul>
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

	// fuckass solution to make the board responsive
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

export default Main;
