import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { StateContext } from "../../contexts/GameContext";
import {
	DiceSixFacesFiveSvg,
	DiceSixFacesFourSvg,
	DiceSixFacesOneSvg,
	DiceSixFacesSixSvg,
	DiceSixFacesThreeSvg,
	DiceSixFacesTwoSvg,
	RollingDicesSvg,
} from "../../Svgs";
import { calculateValues, RowNames } from "../Board/BoardHelpers";
import { AIAssistantButton } from "./AIAssistantButton";
import Globals from "../../globals";

export const DiceControls = ({
	textRef,
	gameId,
	gptSettingsRef,
}: {
	textRef: HTMLDivElement | null;
	gameId: string;
	gptSettingsRef: any;
}) => {
	//const {
	//	rolledDice,
	//	chosenDice,
	//	numChosenDice,
	//	setRolledDice,
	//	setChosenDice,
	//	setNumChosenDice,
	//} = useContext(DiceContext);

	const { gameState, setGameState } = useContext(StateContext);
	const chosenDice = gameState.chosenDice ?? [];
	const rolledDice = gameState.rolledDice ?? [];
	const numChosenDice = gameState.numChosenDice ?? 0;

	// useEffect(() => {
	// 	if (gameState.roundIndex == 0 && (!gameState.isMyMove || Globals.isSolo)) {
	// 		console.log("MY BAD 1");
	// 		setGameState((prev) => ({
	// 			...prev,
	// 			chosenDice: [],
	// 			rolledDice: [],
	// 			numChosenDice: 0,
	// 		}));
	// 	}
	// }, [gameState.roundIndex]);

	useEffect(() => {
		localStorage.setItem(
			gameId + "-dice",
			JSON.stringify({ chosenDice, rolledDice, numChosenDice })
		);
	}, [chosenDice, rolledDice, numChosenDice]);

	const rollDice = () => {
		if (gameState.roundIndex >= 3) return;

		setGameState((prev) => {
			const nextRoundIndex = prev.roundIndex + 1;
			const isRucna = numChosenDice === 0;
			const rolledDice: number[] = [];

			for (let i = 0; i < 6 - numChosenDice; i++) {
				const rolledNumber = Math.ceil(Math.random() * 6);
				rolledDice.push(rolledNumber);
			}

			const newValues = calculateValues({
				chosenDice,
				rolledDice,
				roundNumber: gameState.roundIndex,
			});

			return {
				...prev,
				roundIndex: nextRoundIndex,
				isRucna,
				rolledDice,
				value: newValues,
			};
		});
	};

	const keepDice = (diceToKeep: number[]) => {
		setGameState((prev) => {
			const newChosenDice = [];
			const newRolledDice = [...prev.rolledDice!!, ...prev.chosenDice!!];

			for (const diceValue of diceToKeep) {
				newChosenDice.push(diceValue);
				const index = newRolledDice.indexOf(diceValue);
				if (index !== -1) newRolledDice.splice(index, 1);
			}

			return {
				...prev,
				chosenDice: newChosenDice,
				rolledDice: newRolledDice,
				numChosenDice: newChosenDice.length,
			};
		});
	};

	return (
		gameState.isMyMove && (
			<div className="flex flex-col items-center justify-center gap-6 sm:w-fit sm:flex-row">
				<div className="rounded-md border-4 border-main-600">
					<div className="flex min-h-[102px] w-[532px] flex-wrap gap-4 bg-main-500 p-4 sm:min-h-[82px] sm:w-[412px]">
						{chosenDice.map((num, index) => (
							<div
								className="rounded-md bg-black"
								key={index}
								onClick={() => {
									setGameState((prev) => ({
										...prev,
										chosenDice: prev.chosenDice!!.filter((_, i) => i !== index),
										numChosenDice: prev.numChosenDice!! - 1,
										rolledDice: [...prev.rolledDice!!, num],
									}));
								}}
							>
								{diceImages[num]}
							</div>
						))}
					</div>
					<div className="flex min-h-[102px] w-[532px] flex-wrap gap-4 bg-main-200 p-4 sm:min-h-[82px] sm:w-[412px]">
						{rolledDice.map((num, index) => (
							<div
								className="rounded-md bg-black"
								key={index}
								onClick={() => {
									setGameState((prev) => ({
										...prev,
										chosenDice: [...prev.chosenDice!!, num],
										numChosenDice: prev.numChosenDice!! + 1,
										rolledDice: prev.rolledDice!!.filter((_, i) => i !== index),
									}));
								}}
							>
								{diceImages[num]}
							</div>
						))}
					</div>
				</div>
				<div className="flex flex-row items-center justify-around gap-4 sm:flex-col">
					<div className="text-center">
						<p className="text-3xl font-bold sm:text-xl">
							{gameState.roundIndex == 0
								? ""
								: "Round " + gameState.roundIndex + "/3"}
						</p>
					</div>
					<AIAssistantButton
						dice={[...chosenDice, ...rolledDice]}
						keepDice={keepDice}
						textRef={textRef}
						gptSettingsRef={gptSettingsRef}
					/>
					<button
						onClick={rollDice}
						className="h-[65px] w-[65px] text-xl font-bold sm:h-[50px] sm:w-[50px]"
					>
						<RollingDicesSvg className="rounded-md border-2 border-main-600 bg-main-900" />
					</button>
				</div>
			</div>
		)
	);
};
export const diceImages = [
	null,
	<DiceSixFacesOneSvg className="h-[70px] w-[70px] sm:h-[50px] sm:w-[50px]" />,
	<DiceSixFacesTwoSvg className="h-[70px] w-[70px] sm:h-[50px] sm:w-[50px]" />,
	<DiceSixFacesThreeSvg className="h-[70px] w-[70px] sm:h-[50px] sm:w-[50px]" />,
	<DiceSixFacesFourSvg className="h-[70px] w-[70px] sm:h-[50px] sm:w-[50px]" />,
	<DiceSixFacesFiveSvg className="h-[70px] w-[70px] sm:h-[50px] sm:w-[50px]" />,
	<DiceSixFacesSixSvg className="h-[70px] w-[70px] sm:h-[50px] sm:w-[50px]" />, // maybe inline this into the svg
];
