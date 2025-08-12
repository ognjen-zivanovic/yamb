import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import Peer from "peerjs";
import QRCode from "qrcode";
import { useNetworking, type PeerData } from "./NetworkingContext";
import { type Cell, ColumnNames, RowNames, YambBoard } from "./Board";

export const NetworkingMenu = ({
	setHasStarted,
}: {
	setHasStarted: (hasStarted: boolean) => void;
}) => {
	const {
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
		registerCallback,
	} = useNetworking();

	// const [log, setLog] = useState<string[]>([]);
	// const [input, setInput] = useState("");

	const [hasJoinedHost, setHasJoinedHost] = useState(false);
	const [isHost, setIsHost] = useState<boolean>(false);

	//const appendLog = (msg: string) => setLog((l) => [...l, msg]);
	const appendLog = (msg: string) => console.log(msg);

	useEffect(() => {
		setPeerData((prev) => prev.map((p) => (p.id === peerId ? { ...p, name } : p)));
	}, [name]);

	// Generate QR code and invite link when becoming host

	const startHost = () => {
		setIsHost(true);
		appendLog("Started as host. Share your ID with others.");
	};

	const joinHost = () => {
		connectToPeer(hostId);
		setHasJoinedHost(true);
	};

	const startGame = () => {
		sharePeerData();
		setHasStarted(true);
		broadcastMessage({ type: "start-game" });
	};

	const onReceiveStartGame = (incoming: boolean, conn: any, data: any) => {
		if (!incoming) {
			console.log("start game", data);
			setHasStarted(true);
		}
	};

	registerCallback("start-game", onReceiveStartGame);

	return (
		<div className="min-h-screen bg-gray-50 flex justify-center">
			<div className="w-full max-w-2xl mx-auto p-3 sm:p-6">
				<div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
					{!hasJoinedHost && (
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
										<InvideLinkPanel peerId={peerId} />
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
								<PeerDataPanel peerData={peerData} setPeerData={setPeerData} />
							)}
							<p className="text-base sm:text-lg text-gray-400">
								<strong>Your ID:</strong> {peerId}
							</p>
						</>
					)}
					{(hasJoinedHost || isHost) && <PreviousSaveBoard />}
				</div>
			</div>
			{/* <Main /> */}
		</div>
	);
};

const PreviousSaveBoard = () => {
	return <div>AKKKKKKKKKKKKKKKKKKKKK</div>;
};

const PeerDataPanel = ({
	peerData,
	setPeerData,
}: {
	peerData: PeerData[];
	setPeerData: Dispatch<SetStateAction<PeerData[]>>;
}) => {
	// Drag and drop state
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
	return (
		<div className="border-2 border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50 mt-4 sm:mt-6">
			<h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg">Peer Data</h3>
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
							<span className="font-medium">{p.name || "Unnamed"}</span>
							<span className="text-xs text-gray-500">({p.id})</span>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};

const InvideLinkPanel = ({ peerId }: { peerId: string }) => {
	``;
	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const [inviteLink, setInviteLink] = useState("");

	useEffect(() => {
		if (peerId) {
			const link = `${window.location.origin}${window.location.pathname}?host=${peerId}`;
			setInviteLink(link);

			// Generate QR code
			QRCode.toDataURL(link, { width: 200, margin: 2 })
				.then((url) => {
					setQrCodeUrl(url);
				})
				.catch((err) => {
					console.error("Error generating QR code:", err);
				});
		}
	}, []);

	return (
		inviteLink && (
			<div className="border-2 border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
				<h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg">Invite Link:</h3>
				<div className="flex flex-col sm:flex-row gap-3 mb-4">
					<input
						value={inviteLink}
						readOnly
						className="border border-gray-300 rounded-md px-3 py-2 flex-1 text-sm"
					/>
					<button
						onClick={() => navigator.clipboard.writeText(inviteLink)}
						className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-gray-600 text-sm transition-colors"
					>
						Copy
					</button>
				</div>

				{qrCodeUrl && (
					<div className="flex flex-col items-center">
						<h4 className="font-semibold mb-3">QR Code:</h4>
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
		)
	);
};
