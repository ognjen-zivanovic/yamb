import { useContext, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import Peer from "peerjs";
import QRCode from "qrcode";
import { useNetworking, type PeerData } from "./NetworkingContext";
import { ReadonlyYambBoard } from "./ReadonlyBoard";
import { defaultTabela } from "./BoardConstants";
import { type Cell } from "./BoardConstants";
import { TabelaContext } from "./App";

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
		broadcastMessage("start-game", {});
	};

	const onReceiveStartGame = (incoming: boolean, _conn: any, data: any) => {
		if (!incoming) {
			//console.log("start game", data);
			setHasStarted(true);
		}
	};

	registerCallback("start-game", onReceiveStartGame);

	return (
		<div className="flex min-h-screen justify-center bg-gray-50">
			<div className="mx-auto w-full max-w-2xl p-3 sm:p-6">
				<div className="rounded-lg bg-white p-4 shadow-lg sm:p-8">
					{!hasJoinedHost && (
						<>
							<div>
								{!isHost ? (
									<div className="flex flex-col gap-4 sm:gap-6">
										<div className="flex flex-col gap-3 sm:flex-row">
											<input
												placeholder="Host ID"
												value={hostId}
												onChange={(e) => setHostId(e.target.value)}
												className="flex-1 rounded-md border-2 border-gray-300 px-3 py-2"
											/>
											<button
												onClick={joinHost}
												disabled={!name.trim() || !hostId.trim()}
												className="rounded-md bg-main-600 px-4 py-2 text-white transition-colors hover:bg-main-600 disabled:cursor-not-allowed disabled:bg-gray-300 sm:px-6"
											>
												Join
											</button>
										</div>
										{!hostId && (
											<button
												onClick={startHost}
												className="rounded-md bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300 sm:px-6"
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
														className="flex-1 rounded-md border-2 border-gray-300 px-3 py-2"
													/>
												</div>
											</div>
										}
									</div>
								) : (
									<div className="flex flex-col gap-4 sm:gap-6">
										<InviteLinkPanel peerId={peerId} />
										<button
											onClick={startGame}
											className="rounded-md bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600 sm:px-6"
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
							className="flex-1 rounded-md border-2 border-gray-300 px-2 py-1"
						/>
						<button
							onClick={() => {
								broadcastMessage(input);
								setInput("");
							}}
							className="rounded-md bg-main-600 px-4 py-1 text-white hover:bg-main-600"
						>
							Send
						</button>
					</div> */}
							{/* make this collapsable */}
							{/* <details className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4 sm:p-6">
						<summary className="mb-3 cursor-pointer text-base font-bold sm:mb-4 sm:text-lg">
							Log
						</summary>
						<div>
							<ul className="max-h-60 space-y-2 overflow-y-auto text-sm">
								{log.map((line, i) => (
									<li
										key={i}
										className="break-words border-b border-gray-200 pb-2"
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
							<p className="text-base text-gray-400 sm:text-lg">
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
	const { tabela, updateTabela } = useContext(TabelaContext);
	const [isSaveLoaded, setIsSaveLoaded] = useState(false);

	return (
		<div className="flex flex-col items-center justify-center justify-self-center">
			<button
				onClick={() => {
					// load file
					const input = document.createElement("input");
					input.type = "file";
					input.accept = "image/*";

					input.onchange = () => {
						const file = input.files?.[0];
						if (!file) return;

						const reader = new FileReader();

						reader.onload = (e) => {
							const dataUrl = e.target?.result as string;
							const img = new Image();

							img.onload = () => {
								//const canvas = canvasRef.current!;
								// create a temp invisible canvas
								const canvas = document.createElement("canvas");
								canvas.width = img.width;
								canvas.height = img.height;

								const ctx = canvas.getContext("2d");
								if (!ctx) {
									console.error("Unable to get 2D context");
									return;
								}

								ctx.drawImage(img, 0, 0);
								const imageData = ctx.getImageData(0, 0, img.width, img.height);
								const pixels = imageData.data; // Uint8ClampedArray [r, g, b, a, r, g, b, a, ...]

								// console.log("Pixel data:", pixels);
								// console.log(`Image dimensions: ${img.width}x${img.height}`);

								let start = -1;
								let startCnt = 0;

								const isPixelString = (i: number, s: string) => {
									if (s.length != 3 || i < 0 || i >= pixels.length) return false;
									const r = pixels[i];
									const g = pixels[i + 1];
									const b = pixels[i + 2];
									return (
										r == s.charCodeAt(0) &&
										g == s.charCodeAt(1) &&
										b == s.charCodeAt(2)
									);
								};

								for (let i = 0; i < pixels.length; i += 4) {
									const r = pixels[i];
									if (isPixelString(i, "OGN") && isPixelString(i + 4, "JEN")) {
										//console.log("Found O G N J E N");
										start = i;
										startCnt++;
									}
								}
								if (start != -1) {
									let rows = pixels[start - startCnt * 4];
									let cols = pixels[start - startCnt * 4 + 1];
									let totalCells = rows * cols;

									start += (startCnt + 1) * 4;
									for (let r = 0; r < rows; r++) {
										for (let c = 0; c < cols; c++) {
											const cellIndex = r * cols + c;
											const pixelOffset = cellIndex * 4 * startCnt + start;

											let availableNum: number | undefined =
												0xff - pixels[pixelOffset + 2];
											let available: boolean | undefined = undefined;
											let hasValue: boolean | undefined =
												pixels[pixelOffset + 1] == 0xa2;
											let val: number | undefined = pixels[pixelOffset];
											if (hasValue == false) val = undefined;
											if (availableNum == 2) available = undefined;
											if (availableNum == 1) available = true;
											if (availableNum == 0) available = false;

											if (val != undefined || available != undefined) {
												updateTabela(r, c, {
													value: val,
													isAvailable: available,
												});
											}
										}
									}
								}
								setIsSaveLoaded(true);
							};

							img.src = dataUrl;
						};

						reader.readAsDataURL(file);
					};

					input.click();
				}}
			>
				Load image save
			</button>
			{isSaveLoaded && <ReadonlyYambBoard tabela={tabela} />}
		</div>
	);
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
		<div className="mt-4 rounded-lg border-2 border-gray-300 bg-gray-50 p-4 sm:mt-6 sm:p-6">
			<h3 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">Peer Data</h3>
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
								? "border-dashed border-main-600 bg-main-50"
								: "border-gray-300 bg-white hover:bg-gray-50"
						}`}
					>
						<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
							<span className="font-medium">{p.name || "Unnamed"}</span>
							<span className="text-xs text-gray-500">({p.id})</span>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};

const InviteLinkPanel = ({ peerId }: { peerId: string }) => {
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
			<div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4 sm:p-6">
				<h3 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">Invite Link:</h3>
				<div className="mb-4 flex flex-col gap-3 sm:flex-row">
					<input
						value={inviteLink}
						readOnly
						className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
					/>
					<button
						onClick={() => navigator.clipboard.writeText(inviteLink)}
						className="rounded-md bg-gray-500 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-600 sm:px-4"
					>
						Copy
					</button>
				</div>

				{qrCodeUrl && (
					<div className="flex flex-col items-center">
						<h4 className="mb-3 font-semibold">QR Code:</h4>
						<img
							src={qrCodeUrl}
							alt="QR Code"
							className="max-w-full rounded-md border border-gray-300"
						/>
						<p className="mt-2 text-center text-xs text-gray-600">
							Scan to join automatically
						</p>
					</div>
				)}
			</div>
		)
	);
};
