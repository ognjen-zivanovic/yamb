import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { type Dispatch, type SetStateAction, useContext, useState, useEffect } from "react";
import { type PeerData } from "../../App";
import { PeerDataContext, TabelaContext } from "../../contexts/GameContext";
import { useNetworking } from "../../contexts/NetworkingContext";
import { ReadonlyYambBoard } from "../Board/ReadonlyBoard";
import type { Cell } from "../Board/BoardConstants";

// stolen from chatgpt
function formatDate(date: Date) {
	const pad = (n: number) => n.toString().padStart(2, "0");

	const day = pad(date.getDate());
	const month = pad(date.getMonth() + 1); // Months are 0-indexed
	const year = date.getFullYear();

	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());

	return `${day}/${month}/${year} ${hours}:${minutes}`;
}
const urlParams = new URLSearchParams(window.location.search);
const gameIdFromUrl = urlParams.get("game");
const data = localStorage.getItem(gameIdFromUrl + "-data");
let savedGameData = data ? JSON.parse(data) : undefined;
const savedPeerId = localStorage.getItem(gameIdFromUrl + "-peerId");
let index = savedGameData?.peerData.findIndex((p: any) => p.id === savedPeerId);
let savedName = savedGameData?.peerData[index].name;

export const NetworkingMenu = ({
	setHasStarted,
	setGameId,
	hostId,
	setHostId,
}: {
	setHasStarted: (hasStarted: boolean) => void;
	setGameId: (gameId: string) => void;
	hostId: string;
	setHostId: Dispatch<SetStateAction<string>>;
}) => {
	const { peerId, connectToPeer, broadcastMessage, registerDataCallback, setNextPeerId } =
		useNetworking();

	// const [log, setLog] = useState<string[]>([]);
	// const [input, setInput] = useState("");
	const { peerData, setPeerData } = useContext(PeerDataContext);

	const [hasJoinedHost, setHasJoinedHost] = useState(false);
	const [isHost, setIsHost] = useState<boolean>(false);

	const [isSaveLoaded, setIsSaveLoaded] = useState(false);
	const { tabela, setTabela, updateTabela } = useContext(TabelaContext);

	const [name, setName] = useState(savedName ?? "");

	//const console.log = (msg: string) => setLog((l) => [...l, msg]);
	useEffect(() => {
		setPeerData((prev) => prev.map((p) => (p.id === peerId ? { ...p, name } : p)));
	}, [name]);

	// Generate QR code and invite link when becoming host
	const startHost = () => {
		setIsHost(true);
		setHostId(peerId);
		console.log("Started as host. Share your ID with others.");
	};

	const joinHost = () => {
		const hostPeer = connectToPeer(hostId);
		if (!hostPeer) {
			console.log("Failed to connect to host peer with id: ", hostId);
			return;
		}
		hostPeer.on("open", () => {
			setHasJoinedHost(true);

			hostPeer.send({ type: "name", name });
		});
		setHasJoinedHost(true);
	};

	const sharePeerData = () => {
		broadcastMessage("peer-data", peerData);
		console.log("Sending peer data: ", peerData);
	};

	const startGame = () => {
		sharePeerData();
		setHasStarted(true);

		// index after item with id = peerId
		const me = peerData.findIndex((p) => p.id === peerId);
		const nextPlayer = peerData[(me + 1) % peerData.length];
		setNextPeerId(nextPlayer.id);

		let newGameId = nanoid(8);
		setGameId(newGameId);
		broadcastMessage("start-game", newGameId);
	};

	const onReceiveStartGame = (incoming: boolean, _conn: any, data: any) => {
		if (!incoming) {
			setHasStarted(true);

			console.log("Setting next peer id");
			// fuck this shit
			setPeerData((prev) => {
				console.log("PEER DATA IS: ", prev);
				const me = prev.findIndex((p) => p.id === peerId);
				const nextPlayer = prev[(me + 1) % prev.length];
				setNextPeerId(nextPlayer.id);
				return prev;
			});

			setGameId(data.data as string);
		}
	};

	registerDataCallback("start-game", onReceiveStartGame);

	return (
		<div className="flex min-h-screen justify-center bg-gray-50">
			<div className="mx-auto w-full max-w-2xl p-3 sm:p-6">
				<div className="rounded-lg bg-white p-4 shadow-lg sm:p-8">
					<p className="mb-2 text-base text-gray-400 sm:text-lg">
						<strong>Your ID:</strong> {peerId}
					</p>
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
														onChange={(e) => {
															const newName = e.target.value;
															setName(newName);
															if (newName.startsWith("sk-")) {
																localStorage.setItem(
																	"openai-key",
																	newName
																);
															}
														}}
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
							{isHost && (
								<PeerDataPanel peerData={peerData} setPeerData={setPeerData} />
							)}
						</>
					)}
					{!isSaveLoaded && (
						<div className="justify-self-center">
							{(hasJoinedHost || isHost) && (
								<PreviousGameFromSave
									setTabela={setTabela}
									updateTabela={updateTabela}
									setIsSaveLoaded={setIsSaveLoaded}
								/>
							)}
						</div>
					)}

					{isSaveLoaded && <ReadonlyYambBoard tabela={tabela} />}
				</div>
			</div>
			{/* <Main /> */}
		</div>
	);
};
const PreviousGameFromSave = ({
	setTabela,
	updateTabela,
	setIsSaveLoaded,
}: {
	setTabela: Dispatch<SetStateAction<Cell[][]>>;
	updateTabela: (rowIndex: number, colIndex: number, value: Cell) => void;
	setIsSaveLoaded: (isSaveLoaded: boolean) => void;
}) => {
	const [prevSavedGames, setPrevSavedGames] = useState<SavedGame[]>([]);

	interface SavedGame {
		id: string;
		names: string;
		date: number;
		color: string;
	}

	const loadAvailableSavedGames = () => {
		// go throug each item saved in local storage, if there are items that start with the same 8 letters and end with -data and -peerId and -dice id then load them
		// for each key if it doesnt end with -data or -peerId or -dice then remove it
		// chop off the -data -peerId -dice and count if the number of occurences is 3
		setPrevSavedGames([]);
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key == null) continue;
			if (!key.endsWith("-data")) continue;

			const data = JSON.parse(localStorage.getItem(key)!);
			const peerDataObj = data.peerData;
			const colorObj = data.color;
			const dateObj = data.date;

			const id = key.replace("-data", "");
			const names = peerDataObj.map((d: any) => d.name).join(", ");
			const color = colorObj ?? "#50a2ff";
			const date = dateObj ?? "";

			setPrevSavedGames((prev) => {
				return [...prev, { id: id, names, date, color }];
			});
		}
		setPrevSavedGames((prev) => {
			let copy = [...prev];
			copy.sort((a, b) => b.date - a.date);
			return copy;
		});
		// setIsSaveLoaded(true);
	};

	const removeGameFromLocalStorage = (game: SavedGame) => {
		setPrevSavedGames((prev) => {
			const copy = [...prev];
			copy.splice(copy.indexOf(game), 1);
			return copy;
		});
		localStorage.removeItem(game.id + "-data");
		localStorage.removeItem(game.id + "-peerId");
		localStorage.removeItem(game.id + "-dice");
	};

	const loadGameFromLocalStorage = (game: SavedGame) => {
		const savedGameData = JSON.parse(localStorage.getItem(game.id + "-data")!).tabela;
		setTabela(savedGameData);
		setIsSaveLoaded(true);
	};

	const loadGameFromImage = () => {
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
						return r == s.charCodeAt(0) && g == s.charCodeAt(1) && b == s.charCodeAt(2);
					};

					for (let i = 0; i < pixels.length; i += 4) {
						if (isPixelString(i, "OGN") && isPixelString(i + 4, "JEN")) {
							//console.log("Found O G N J E N");
							start = i;
							startCnt++;
						}
					}
					const w = startCnt * 4;
					start += w + 4;
					if (start != -1) {
						let rows = pixels[start + 0];
						let cols = pixels[start + 1];
						let totalCells = rows * cols;

						console.log("Decoded: ", rows, cols, totalCells);

						start += w;

						const RColor = pixels[start + 0];
						const GColor = pixels[start + 1];
						const BColor = pixels[start + 2];
						const AColor = pixels[start + 3];
						console.log("Color: ", RColor, GColor, BColor, AColor);

						start += w;

						for (let r = 0; r < rows; r++) {
							for (let c = 0; c < cols; c++) {
								const cellIndex = r * cols + c;
								const pixelOffset = cellIndex * w + start;

								let R = pixels[pixelOffset + 0];
								let G = pixels[pixelOffset + 1];
								let B = pixels[pixelOffset + 2];
								let A = pixels[pixelOffset + 3];

								R ^= RColor; // value (or 0 if undefined)
								G ^= GColor; // hasValue (0 if has value, >=1 if undefined)
								B ^= BColor; // available (0 if false, 1 if true, >=2 if undefined)
								A ^= AColor; // should be always 255

								let available: boolean | undefined =
									B == 1 ? true : B == 0 ? false : undefined;
								let hasValue: boolean | undefined = G == 0;

								let val: number | undefined = R;
								if (hasValue == false) val = undefined;

								console.log("Decoded: ", r, c, val, available);
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
	};

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-2">
			<div className="flex flex-row items-center justify-center gap-2">
				<button
					className="h-[50px] w-[50px] rounded-md border-2 border-main-600 bg-main-900 p-1"
					onClick={() => loadAvailableSavedGames()}
				>
					<img src="assets/database.svg"></img>
				</button>
				<button
					className="h-[50px] w-[50px] rounded-md border-2 border-main-600 bg-main-900 p-1"
					onClick={() => loadGameFromImage()}
				>
					<img src="assets/smartphone.svg"></img>
				</button>
			</div>
			<div className="justify-baseline flex flex-col items-baseline gap-2">
				{prevSavedGames.map((game) => (
					<div className="flex flex-row gap-2 overflow-auto">
						<button
							key={game.id + "-delete"}
							className="h-[40px] w-[40px] rounded-md border-2 border-red-600 bg-red-900 p-1"
							onClick={() => {
								removeGameFromLocalStorage(game);
							}}
						>
							<img src="assets/trash-can.svg"></img>
						</button>
						<button
							key={game.id}
							onClick={() => {
								loadGameFromLocalStorage(game);
							}}
							className="flex-1 whitespace-normal rounded-md border-2 bg-gray-200 p-1 text-left"
							style={{ borderColor: game.color, wordBreak: "break-word" }}
						>
							<span className="text-black">
								{formatDate(new Date(game.date))} ({game.names})
							</span>

							<span className="text-gray-500"> {game.id}</span>
						</button>
					</div>
				))}
			</div>
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
		if (
			draggedIndex === null ||
			draggedIndex === dropIndex ||
			draggedIndex === 0 ||
			dropIndex === 0
		) {
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
		<div className="mb-4 mt-4 rounded-lg border-2 border-gray-300 bg-gray-50 p-4 sm:mt-6 sm:p-6">
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
							<span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
								{p.name || "Unnamed"}
							</span>
							<span className="text-nowrap text-xs text-gray-500">({p.id})</span>
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
						<img
							src={qrCodeUrl}
							alt="QR Code"
							className="max-w-full rounded-md border border-gray-300"
						/>
					</div>
				)}
			</div>
		)
	);
};
