import React, { useEffect, useState, createContext, useRef } from "react";
import Peer from "peerjs";
import QRCode from "qrcode";
import { RowNames, YambBoard } from "./Board";
import { DicePicker } from "./Dice";

interface PeerData {
	id: string;
	name?: string;
	index?: number;
}

const NetworkingMenu = ({ setHasStarted }: { setHasStarted: (hasStarted: boolean) => void }) => {
	const [peer, setPeer] = useState<Peer | null>(null);
	const [connections, setConnections] = useState<Map<string, any>>(new Map());
	const [isHost, setIsHost] = useState<boolean>(false);
	const [hostId, setHostId] = useState("");
	const [peerId, setPeerId] = useState("");
	const [hasJoinedHost, setHasJoinedHost] = useState(false);
	const [peerData, setPeerData] = useState<PeerData[]>([]);
	const [log, setLog] = useState<string[]>([]);
	const [input, setInput] = useState("");
	const [name, setName] = useState("");
	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const [inviteLink, setInviteLink] = useState("");

	// Drag and drop state
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	const appendLog = (msg: string) => setLog((l) => [...l, msg]);

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

	// Generate QR code and invite link when becoming host
	useEffect(() => {
		if (isHost && peerId) {
			const link = `${window.location.origin}${window.location.pathname}?host=${peerId}`;
			setInviteLink(link);

			// Generate QR code
			QRCode.toDataURL(link, { width: 200, margin: 2 })
				.then((url) => {
					setQrCodeUrl(url);
				})
				.catch((err) => {
					console.error("Error generating QR code:", err);
					appendLog("Error generating QR code");
				});
		}
	}, [isHost, peerId]);

	const setupConnection = (conn: any, incoming = false) => {
		conn.on("open", () => {
			appendLog(`Connected to ${conn.peer}`);
			setConnections((prev) => new Map(prev.set(conn.peer, conn)));
			if (!incoming) {
				conn.send({ type: "name", name: name });
				appendLog(`Sent name: ${name}`);
			}
			setPeerData((prev) => [...prev, { id: conn.peer, name: "", index: prev.length }]);

			conn.on("data", (data: any) => {
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
		setHasJoinedHost(true);
	};

	const broadcastMessage = (message: string) => {
		appendLog(`You: ${message}`);
		connections.forEach((conn) => conn.send(message));
	};

	const sharePeerData = () => {
		connections.forEach((conn) => conn.send({ type: "peer-data", peerData: peerData }));
		appendLog("Shared peer data.");
	};

	// Drag and drop handlers
	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedIndex(index);
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/html", index.toString());
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setDragOverIndex(index);
	};

	const handleDragLeave = () => {
		setDragOverIndex(null);
	};

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === dropIndex) {
			setDraggedIndex(null);
			setDragOverIndex(null);
			return;
		}

		setPeerData((prev) => {
			const newData = [...prev];
			const draggedItem = newData[draggedIndex];
			newData.splice(draggedIndex, 1);
			newData.splice(dropIndex, 0, draggedItem);

			// Update indices
			return newData.map((item, index) => ({ ...item, index }));
		});

		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	const startGame = () => {
		sharePeerData();
		setHasStarted(true);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex justify-center">
			<div className="w-full max-w-2xl mx-auto p-3 sm:p-6">
				<div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
					{!hasJoinedHost ? (
						<>
							<div>
								{!isHost ? (
									<div className="flex flex-col gap-4 sm:gap-6">
										<div className="flex flex-col sm:flex-row gap-3">
											<input
												placeholder="Host ID"
												value={hostId}
												onChange={(e) => setHostId(e.target.value)}
												className="border-2 border-gray-300 rounded-md px-3 py-2 flex-1"
											/>
											<button
												onClick={joinHost}
												disabled={!name.trim() || !hostId.trim()}
												className="bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
											>
												Join
											</button>
										</div>
										{!hostId && (
											<button
												onClick={startHost}
												className="bg-green-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300 transition-colors"
												disabled={!name.trim()}
											>
												Become Host
											</button>
										)}
										{
											<div className="flex flex-col gap-3">
												<div className="flex flex-row gap-3">
													<input
														placeholder="Your name"
														value={name}
														onChange={(e) => setName(e.target.value)}
														className="border-2 border-gray-300 rounded-md px-3 py-2 flex-1"
													/>
												</div>
											</div>
										}
									</div>
								) : (
									<div className="flex flex-col gap-4 sm:gap-6">
										{inviteLink && (
											<div className="border-2 border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
												<h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg">
													Invite Link:
												</h3>
												<div className="flex flex-col sm:flex-row gap-3 mb-4">
													<input
														value={inviteLink}
														readOnly
														className="border border-gray-300 rounded-md px-3 py-2 flex-1 text-sm"
													/>
													<button
														onClick={() =>
															navigator.clipboard.writeText(
																inviteLink
															)
														}
														className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-600 text-sm transition-colors"
													>
														Copy
													</button>
												</div>

												{qrCodeUrl && (
													<div className="flex flex-col items-center">
														<h4 className="font-semibold mb-3">
															QR Code:
														</h4>
														<img
															src={qrCodeUrl}
															alt="QR Code"
															className="border border-gray-300 rounded-md max-w-full"
														/>
														<p className="text-xs text-gray-600 mt-2 text-center">
															Scan to join automatically
														</p>
													</div>
												)}
											</div>
										)}
										<button
											onClick={startGame}
											className="bg-purple-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-purple-600 transition-colors"
										>
											Start game!
										</button>
									</div>
								)}
							</div>
							<hr className="my-2" />
							{/* <div className="flex flex-row gap-2">
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
							className="border-2 border-gray-300 rounded-md px-2 py-1 flex-1"
						/>
						<button
							onClick={() => {
								broadcastMessage(input);
								setInput("");
							}}
							className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600"
						>
							Send
						</button>
					</div> */}
							{/* make this collapsable */}
							{/* <details className="border-2 border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
						<summary className="font-bold mb-3 sm:mb-4 text-base sm:text-lg cursor-pointer">
							Log
						</summary>
						<div>
							<ul className="max-h-60 overflow-y-auto space-y-2 text-sm">
								{log.map((line, i) => (
									<li
										key={i}
										className="border-b border-gray-200 pb-2 break-words"
									>
										{line}
									</li>
								))}
							</ul>
						</div>
					</details> */}
							{/* 16:07 - 56 */}
							{/* 16:25 - 78 */}
							{isHost && (
								<div className="border-2 border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50 mt-4 sm:mt-6">
									<h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg">
										Peer Data
									</h3>
									<ul className="space-y-3">
										{peerData.map((p, index) => (
											<li
												key={p.id}
												draggable
												onDragStart={(e) => handleDragStart(e, index)}
												onDragOver={(e) => handleDragOver(e, index)}
												onDragLeave={handleDragLeave}
												onDrop={(e) => handleDrop(e, index)}
												onDragEnd={handleDragEnd}
												className={`p-3 sm:p-4 rounded-lg border cursor-grab transition-colors ${
													draggedIndex === index
														? "bg-gray-200"
														: dragOverIndex === index
														? "border-dashed border-blue-500 bg-blue-50"
														: "border-gray-300 bg-white hover:bg-gray-50"
												}`}
											>
												<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
													<span className="font-medium">
														{p.name || "Unnamed"}
													</span>
													<span className="text-xs text-gray-500">
														({p.id})
													</span>
												</div>
											</li>
										))}
									</ul>
								</div>
							)}
							<p className="text-base sm:text-lg text-gray-400">
								<strong>Your ID:</strong> {peerId}
							</p>
						</>
					) : (
						<Slot />
					)}
				</div>
			</div>
			{/* <Main /> */}
		</div>
	);
};

export interface State {
	roundIndex: number;
	value: number[];
	najava?: RowNames;
}

export const StateContext = createContext({ state: {} as State, setState: (_: State) => {} });

const Yamb = () => {
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

const App = () => {
	const [hasStarted, setHasStarted] = useState(false);

	return <div>{!hasStarted ? <NetworkingMenu setHasStarted={setHasStarted} /> : <Yamb />}</div>;
};

const SlotSvg = () => {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			height="200"
			width="200"
		>
			<path
				d="M26 9.00003 14.0196 7.82312 2 9.00003V23l12.0196 2.2023L26 23v-4l1.2657 -3.5555L26 12V9.00003Z"
				fill="#e1d8ec"
			></path>

			<path
				d="M4.42621 10.5H23.5738c0.789 0 1.4262 0.6335 1.4262 1.4177v8.1646c0 0.7842 -0.6372 1.4177 -1.4262 1.4177H4.42621C3.63725 21.5 3 20.8665 3 20.0823v-8.1646c0 -0.7842 0.63725 -1.4177 1.42621 -1.4177Z"
				fill="#433b6b"
			></path>
			<path
				d="M23.4261 5H4.58386C3.16274 5 2 6.04037 2 7.33185V9h24V7.33185C26 6.04037 24.8472 5 23.4261 5Z"
				fill="#b4acbc"
			></path>
			<path
				d="M28.5 6.99072c0.2758 0 0.4993 0.22355 0.4993 0.4993V13h0.3554c0.3623 0 0.6453 0.2515 0.6453 0.5734v3.8532c0 0.3118 -0.283 0.5734 -0.6453 0.5734H27v0.7123c0 0.1534 -0.1102 0.2877 -0.2543 0.2877H26v-7h0.7457c0.1441 0 0.2543 0.1343 0.2543 0.2877V13h1.0007V7.49002c0 -0.27575 0.2235 -0.4993 0.4993 -0.4993Z"
				fill="#b4acbc"
			></path>

			<path
				d="M24.4994 30H3.5006C2.67576 30 2 29.3123 2 28.4501V23h24v5.4501C25.9901 29.302 25.3242 30 24.4994 30Z"
				fill="#b4acbc"
			></path>
			<path
				d="M9.08375 11.5h-4.1675C4.40393 11.5 4 11.93 4 12.4522v7.0956c0 0.5324 0.41379 0.9522 0.91625 0.9522h4.1675c0.51232 0 0.91625 -0.43 0.91625 -0.9522v-7.0956c0 -0.5222 -0.41379 -0.9522 -0.91625 -0.9522Z"
				fill="#f4f4f4"
			></path>
			<path
				d="M16.0838 11.5h-4.1676c-0.5123 0 -0.9162 0.43 -0.9162 0.9522v7.0956c0 0.5324 0.4138 0.9522 0.9162 0.9522h4.1676c0.5123 0 0.9162 -0.43 0.9162 -0.9522v-7.0956c0 -0.5222 -0.4138 -0.9522 -0.9162 -0.9522Z"
				fill="#f4f4f4"
			></path>
			<path
				d="M23.0838 11.5h-4.1675c-0.5123 0 -0.9163 0.43 -0.9163 0.9522v7.0956c0 0.5324 0.4138 0.9522 0.9163 0.9522h4.1675c0.5123 0 0.9162 -0.43 0.9162 -0.9522v-7.0956c0 -0.5222 -0.4138 -0.9522 -0.9162 -0.9522Z"
				fill="#f4f4f4"
			></path>
			<path
				d="M29.9999 6.5c0 0.82843 -0.6716 1.5 -1.5 1.5 -0.8285 0 -1.5 -0.67157 -1.5 -1.5s0.6715 -1.5 1.5 -1.5c0.8284 0 1.5 0.67157 1.5 1.5Z"
				fill="#f8312f"
			></path>
		</svg>
	);
};
const SlotSvg2 = () => {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			height="200"
			width="200"
		>
			<path d="M26 9 14 8 2 9v14l12 2 12-2v-4l1-4-1-4V9Z" fill="#e1d8ec"></path>

			<path
				d="M4 10h20c1 0 2 1 2 2v8c0 1-1 2-2 2H4c-1 0-2-1-2-2v-8c0-1 1-2 2-2Z"
				fill="#433b6b"
			></path>

			<path d="M24 5H4C2.5 5 1 6 1 7.5V9h26V7.5C27 6 25.5 5 24 5Z" fill="#b4acbc"></path>

			<path
				d="M29 7c0.3 0 0.5 0.2 0.5 0.5V13H30c0.4 0 0.6 0.3 0.6 0.5v4c0 0.3-0.2 0.5-0.6 0.5H27v1c0 0.2-0.1 0.3-0.3 0.3H26v-7h1c0.2 0 0.3 0.1 0.3 0.3V13h1V7.5c0-0.3 0.2-0.5 0.5-0.5Z"
				fill="#b4acbc"
			></path>

			<path d="M25 30H3c-1 0-1-1-1-1.5V23h24v5.5c0 0.9-0.7 1.5-1 1.5Z" fill="#b4acbc"></path>

			<path
				d="M9 12H5c-0.5 0-1 0.5-1 1v7c0 0.5 0.5 1 1 1h4c0.5 0 1-0.5 1-1v-7c0-0.5-0.5-1-1-1Z"
				fill="#f4f4f4"
			></path>

			<path
				d="M16 12h-4c-0.5 0-1 0.5-1 1v7c0 0.5 0.5 1 1 1h4c0.5 0 1-0.5 1-1v-7c0-0.5-0.5-1-1-1Z"
				fill="#f4f4f4"
			></path>

			<path
				d="M23 12h-4c-0.5 0-1 0.5-1 1v7c0 0.5 0.5 1 1 1h4c0.5 0 1-0.5 1-1v-7c0-0.5-0.5-1-1-1Z"
				fill="#f4f4f4"
			></path>

			<path
				d="M30 7c0 0.8-0.7 1.5-1.5 1.5S27 7.8 27 7s0.7-1.5 1.5-1.5S30 6.2 30 7Z"
				fill="#f8312f"
			></path>
		</svg>
	);
};

function largestSmallerThan(arr: number[], x: number): number | null {
	return arr.reduce<number | null>(
		(best, val) => (val < x && (best === null || val > best) ? val : best),
		null
	);
}

function indexOfLargestSmallerThan(arr: number[], x: number): number {
	return arr.reduce<number>(
		(best, val, i) => (val < x && (best === -1 || val > arr[best]) ? i : best),
		-1
	);
}

const slotIcons = [
	<img src="assets/1.png" />,
	<img src="assets/2.png" />,
	<img src="assets/3.png" />,
	<img src="assets/4.png" />,
	<img src="assets/5.png" />,
	<img src="assets/6.png" />,
	<img src="assets/7.png" />,
	<img src="assets/8.png" />,
	<img src="assets/9.png" />,
];

const Slot = () => {
	const [positions, setPositions] = useState<number[][]>([]);
	const [isSpinning, setIsSpinning] = useState<boolean[]>([false, false, false]);
	const [transitioning, setTransitioning] = useState<boolean[]>([false, false, false]);

	const animationRefs = useRef<Array<React.MutableRefObject<number | null>>>([
		useRef<number | null>(null),
		useRef<number | null>(null),
		useRef<number | null>(null),
	]);

	useEffect(() => {
		// Initialize three lists
		const initialPositions = Array.from({ length: 9 }, (_, i) => i * 40 - 240 + 30 + 25);
		const shuffledPositions1 = initialPositions.sort(() => Math.random() - 0.5).slice();
		const shuffledPositions2 = initialPositions.sort(() => Math.random() - 0.5).slice();
		const shuffledPositions3 = shuffledPositions2.sort(() => Math.random() - 0.5).slice();

		setPositions([shuffledPositions1, shuffledPositions2, shuffledPositions3]);
	}, []);

	const spin = (listId: number) => {
		setIsSpinning((prev) => {
			const newSpinning = [...prev];
			newSpinning[listId - 1] = true;
			return newSpinning;
		});

		setTransitioning((prev) => {
			const newTransitioning = [...prev];
			newTransitioning[listId - 1] = false;
			return newTransitioning;
		});

		let lastTime = performance.now();
		let speed = Math.random() * (9 - 14) + 14;

		const animate = (time: number) => {
			const deltaTime = time - lastTime;
			lastTime = time;
			speed -= (deltaTime * 5) / 1000;

			if (speed <= 0) {
				setPositions((prev) => {
					const newPositions = [...prev];
					const currentPositions = newPositions[listId - 1];

					let d = largestSmallerThan(currentPositions, 25) ?? 25;
					let updatedPositions = currentPositions.map((p) => {
						const newPos = p + (25 - d);
						return newPos > 135 ? newPos - 360 : newPos;
					});

					setTransitioning((prev) => {
						const newTransitioning = [...prev];
						newTransitioning[listId - 1] = true;
						return newTransitioning;
					});
					newPositions[listId - 1] = updatedPositions;
					return newPositions;
				});

				setIsSpinning((prev) => {
					const newSpinning = [...prev];
					newSpinning[listId - 1] = false;
					return newSpinning;
				});

				const animationRef = animationRefs.current[listId - 1];
				if (animationRef.current) {
					cancelAnimationFrame(animationRef.current);
				}
				return;
			}

			setPositions((prev) => {
				const newPositions = [...prev];
				const currentPositions = newPositions[listId - 1];

				const updatedPositions = currentPositions.map((p) => {
					const newPos = p + speed;
					return newPos > 135 ? newPos - 360 : newPos;
				});

				newPositions[listId - 1] = updatedPositions;
				return newPositions;
			});

			const animationRef = animationRefs.current[listId - 1];
			animationRef.current = requestAnimationFrame(animate);
		};

		const animationRef = animationRefs.current[listId - 1];
		animationRef.current = requestAnimationFrame(animate);
	};

	const spinAll = () => {
		const isAnySpinning = isSpinning.some((spinning) => spinning);
		if (isAnySpinning) return;

		// Start first list immediately
		spin(1);

		// Start second list after 200ms delay
		setTimeout(() => spin(2), 200);

		// Start third list after 400ms delay
		setTimeout(() => spin(3), 400);
	};

	const isAnySpinning = isSpinning.some((spinning) => spinning);

	useEffect(() => {
		if (isSpinning.some((spinning) => spinning)) return;
		positions.forEach((listPositions, index) => {
			console.log(`List ${index + 1} index:`, indexOfLargestSmallerThan(listPositions, 25));
		});
	}, [isSpinning]);

	const listStyles = [
		{ bg: "bg-red-500", border: "border-green-400", left: "left-[1px]" },
		{ bg: "bg-blue-500", border: "border-yellow-400", left: "left-[45px]" },
		{ bg: "bg-green-500", border: "border-purple-400", left: "left-[89px]" },
	];

	return (
		<div className="relative">
			<div className="absolute top-0 left-0">
				<SlotSvg2 />
			</div>

			{/* Spin Button */}
			<button
				className="absolute w-[40px] h-[100px] left-[160px] top-[30px]"
				onClick={spinAll}
				disabled={isAnySpinning}
			></button>

			<div className="absolute top-[73px] left-[25px] w-[125px] h-[54px]">
				{positions.map((listPositions, listIndex) => (
					<div key={listIndex + 1}>
						{listPositions.map((p, i) => (
							<div
								key={`list${listIndex + 1}-${i}`}
								className={`absolute w-[35px] h-[35px] top-[30px] ${listStyles[listIndex].bg} transition-transform duration-75 ${listStyles[listIndex].left}`}
								style={{
									transform: `translateY(${p}px)`,
									transition: `transform ${
										transitioning[listIndex] && p <= 25 + 50 && p >= 24 - 80
											? "1s"
											: ""
									}`,
								}}
							>
								{slotIcons[i]}
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
};

export default App;
