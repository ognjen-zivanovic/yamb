import Peer from "peerjs";

export function createPeer(onData: (data: string) => void) {
	const peer = new Peer();

	peer.on("open", (id) => {
		console.log("My peer ID is: " + id);
		alert(`Your Peer ID: ${id}`);
	});

	peer.on("connection", (conn) => {
		conn.on("data", onData);
		conn.on("open", () => {
			conn.send("Hello from receiver!");
		});
	});

	return {
		peer,
		connectToPeer: (otherId: string) => {
			const conn = peer.connect(otherId);
			conn.on("open", () => {
				conn.send("Hello from initiator!");
				conn.on("data", onData);
			});
		},
	};
}
