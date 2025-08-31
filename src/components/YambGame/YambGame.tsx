import { useContext, useEffect, useRef, useState } from "react";
import {
	type GameState,
	PeerDataContext,
	StateContext,
	TabelaContext,
} from "../../contexts/GameContext";
import { useNetworking } from "../../contexts/NetworkingContext";
import { CogSvg, InterdictionSvg, LargePaintBrushSvg } from "../../Svgs";
import { encodeTabelaToCanvas } from "../../utils/encodeTabelaToCanvas";
import { generateTailwindShades } from "../../utils/generateTailwindShades";
import { YambBoard } from "../Board/Board";
import type { RowName } from "../Board/BoardHelpers";
import { DiceControls } from "../Dice/DiceControls";
import { GptSettings, type GptSettingsHandle } from "../Dice/GptSettings";
import Globals from "../../globals";

const urlParams = new URLSearchParams(window.location.search);
const gameIdFromUrl = urlParams.get("game");

const data = gameIdFromUrl ? localStorage.getItem(gameIdFromUrl + "-data") : undefined;
let dataObj = data ? JSON.parse(data) : undefined;

if (dataObj?.globals) {
	Globals.isSolo = dataObj?.globals.isSolo;
}

export const YambGame = ({ gameId, hostId }: { gameId: string; hostId: string }) => {
	const [gameState, setGameState] = useState<GameState>(
		dataObj?.gameState ?? {
			roundIndex: 0,
			value: [],
			isMyMove: false,
			chosenDice: [],
			rolledDice: [],
			numChosenDice: 0,
		}
	);

	const { peerData } = useContext(PeerDataContext);

	const { peerId, registerDataCallback } = useNetworking();

	const [scale, setScale] = useState(1);
	const { tabela } = useContext(TabelaContext);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const colorPickerRef = useRef<HTMLInputElement>(null);
	const [textRef, setTextRef] = useState<HTMLDivElement | null>(null);

	const gptSettingsRef = useRef<GptSettingsHandle>(null);

	const [themeColor, setThemeColor] = useState(dataObj?.color ?? "#50a2ff");

	useEffect(() => {
		if (peerData.length > 0) {
			if (hostId == peerId) setGameState((prev) => ({ ...prev, isMyMove: true }));
		}
	}, []);

	useEffect(() => {
		let data: any = {};

		data.peerData = [...peerData];
		data.peerData = data.peerData.map((p: any) => (p.id === peerId ? { ...p, tabela } : p));
		data.tabela = tabela;
		data.peerId = peerId;
		data.gameState = gameState;
		data.color = themeColor;
		data.date = new Date().getTime();

		data.globals = Globals;

		localStorage.setItem(gameId + "-data", JSON.stringify(data));
		localStorage.setItem(gameId + "-peerId", peerId); // should this be moved to NetworkingContext?
	}, [gameState, tabela, peerData, themeColor]);

	const onReceivePreviousPlayersMove = (_incoming: boolean, _conn: any, _data: any) => {
		setGameState((prev) => ({ ...prev, isMyMove: true }));
	};
	const onReceiveNajava = (_incoming: boolean, _conn: any, data: any) => {
		setGameState((prev) => ({ ...prev, dirigovana: data.data as RowName }));
	};

	useEffect(() => {
		registerDataCallback("najava", onReceiveNajava);
		registerDataCallback("next-player", onReceivePreviousPlayersMove);
	}, []);

	//	function getRandomColor() {
	//		let letters = "0123456789ABCDEF";
	//		let color = "#";
	//		for (let i = 0; i < 6; i++) {
	//			color += letters[Math.floor(Math.random() * 16)];
	//		}
	//		return color;
	//	}
	useEffect(() => {
		const updateScale = () => {
			const zoomLevel = window.visualViewport ? window.visualViewport.scale : 1;
			if (zoomLevel != 1) return;

			const width = window.innerWidth;
			let newScale = width >= 600 ? 1.0 : (0.9 * width) / 600;
			setScale(newScale);
			//setThemeColor(getRandomColor());
		};

		updateScale();
		window.addEventListener("resize", updateScale);
		return () => window.removeEventListener("resize", updateScale);
	}, []);

	useEffect(() => {
		try {
			encodeTabelaToCanvas(
				tabela,
				gameState,
				peerData,
				peerId,
				gameId,
				themeColor,
				canvasRef
			);
		} catch (err) {
			console.error("Failed to export tabela image:", err);
		}
	}, [tabela, themeColor, gameState]);

	useEffect(() => {
		const el = colorPickerRef.current;
		if (!el) return;

		const handleChange = () => {
			const color = el.value;
			if (color) setThemeColor(color);
		};

		el.addEventListener("change", handleChange);
		return () => {
			el.removeEventListener("change", handleChange);
		};
	}, []);

	useEffect(() => {
		generateTailwindShades(themeColor);
	}, [themeColor]);

	// const showColorPicker = () => {
	// 	colorPickerRef.current?.click();
	// };
	return (
		<div className="relative">
			<StateContext.Provider value={{ gameState, setGameState }}>
				<div className="absolute top-0 flex w-screen flex-col items-center justify-center pb-4 pt-4">
					<div className="relative z-10 flex flex-row">
						<canvas ref={canvasRef} className="absolute h-[1px] translate-x-[-50%]" />
						{/* <button ref={buttonRef} className="h-16 w-16 bg-amber-900">
        Shit
    </button> */}
					</div>
					<div
						style={{ transform: `scale(${scale})`, transformOrigin: "top" }}
						className="relative"
					>
						<YambBoard />
						<div
							className="bg-shade-1 absolute m-6 rounded-md border-4 p-2 text-3xl"
							style={{ top: "525px" }}
							onClick={(e) => {
								(e.target as HTMLDivElement).hidden = true;
							}}
							hidden={true}
							ref={setTextRef}
						>
							☝️🤖
						</div>
						<GptSettings ref={gptSettingsRef} />
						<div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
							<div className="mb-2 flex flex-row items-center justify-around gap-4 sm:flex-col">
								<button className="relative h-[65px] w-[65px] rounded-md border-2 border-main-600 bg-main-900 p-1 sm:h-[50px] sm:w-[50px]">
									<LargePaintBrushSvg />
									<input
										type="color"
										defaultValue="#eb6434"
										ref={colorPickerRef}
										className="absolute left-0 top-0 h-16 w-16 opacity-0 sm:h-12 sm:w-12"
									/>
								</button>

								{gameState.isMyMove && gameState.roundIndex > 0 && (
									<>
										<button
											className={`h-[65px] w-[65px] rounded-md border-2 border-main-600 bg-main-900 p-1 sm:h-[50px] sm:w-[50px] ${
												gameState.blackout ? "!bg-red-500 border-black" : ""
											}`}
											onClick={() =>
												setGameState((prev) => ({
													...prev,
													blackout: !prev.blackout,
												}))
											}
										>
											<InterdictionSvg />
										</button>
									</>
								)}
								{gameState.roundIndex > 0 && (
									<button
										className="h-[65px] w-[65px] rounded-md border-2 border-main-600 bg-main-900 p-1 sm:h-[50px] sm:w-[50px]"
										onClick={() => {
											if (!gptSettingsRef.current) return;
											gptSettingsRef.current.setHidden(
												!gptSettingsRef.current.isHidden
											);
										}}
									>
										<CogSvg />
									</button>
								)}
							</div>
							<DiceControls
								textRef={textRef}
								gameId={gameId}
								gptSettingsRef={gptSettingsRef}
							/>
						</div>
					</div>

					{/* <button onClick={saveToLocalStorage}>Save to local storage</button> */}
				</div>
			</StateContext.Provider>
		</div>
	);
};
