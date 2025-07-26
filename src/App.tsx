import { useEffect, useState } from "react";
import { createPeer } from "./webrtc";

function App() {
	const [peerIdToConnect, setPeerIdToConnect] = useState("");
	const [messages, setMessages] = useState<string[]>([]);
	const [peerAPI, setPeerAPI] = useState<any>(null);

	useEffect(() => {
		const peerAPI = createPeer((data: string) => {
			setMessages((msgs) => [...msgs, `Peer says: ${data}`]);
		});
		setPeerAPI(peerAPI);
	}, []);

	const handleConnect = () => {
		if (peerAPI && peerIdToConnect) {
			peerAPI.connectToPeer(peerIdToConnect);
		}
	};

	return (
		<div style={{ padding: 20 }}>
			<h1>🕸️ WebRTC P2P App</h1>
			<input
				placeholder="Peer ID to connect to"
				value={peerIdToConnect}
				onChange={(e) => setPeerIdToConnect(e.target.value)}
			/>
			<button onClick={handleConnect}>Connect</button>

			<h2>Messages</h2>
			<ul>
				{messages.map((msg, i) => (
					<li key={i}>{msg}</li>
				))}
			</ul>
		</div>
	);
}

export default App;
