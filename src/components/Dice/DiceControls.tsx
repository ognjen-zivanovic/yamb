import { useContext, useEffect, useState } from "react";
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
import { RowNames } from "../Board/BoardConstants";
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
		console.log("MY BAD 3", chosenDice, gameState.chosenDice);
		let newValues: number[] = Array.from({ length: 16 }, () => -1);
		let numOccurences = Array.from({ length: 7 }, () => 0);
		let dice = [];
		for (let i = 0; i < chosenDice.length; i++) {
			numOccurences[chosenDice[i]]++;
			dice.push(chosenDice[i]);
		}
		for (let i = 0; i < rolledDice.length; i++) {
			numOccurences[rolledDice[i]]++;
			dice.push(rolledDice[i]);
		}
		if (dice.length == 0) {
			setGameState((prev) => ({ ...prev, value: [] }));
			return;
		}
		for (let i = 0; i < 6; i++) {
			numOccurences[i] = Math.min(numOccurences[i], 5);
		}
		dice.sort();
		for (let i = 1; i <= 6; i++) {
			if (numOccurences[i] >= 3) {
				newValues[RowNames.Triling] = Math.max(newValues[RowNames.Triling], 3 * i + 20);
			}
			if (numOccurences[i] >= 4) {
				newValues[RowNames.Kare] = Math.max(newValues[RowNames.Kare], 4 * i + 40);
			}
			if (numOccurences[i] >= 5) {
				newValues[RowNames.Yamb] = Math.max(newValues[RowNames.Yamb], 5 * i + 50);
			}
		}
		if (
			numOccurences[2] >= 1 &&
			numOccurences[3] >= 1 &&
			numOccurences[4] >= 1 &&
			numOccurences[5] >= 1 &&
			(numOccurences[1] >= 1 || numOccurences[6] >= 1)
		) {
			newValues[RowNames.Kenta] = Math.max(
				newValues[RowNames.Kenta],
				66 - 10 * (gameState.roundIndex - 1)
			);
		}
		newValues[RowNames.Jedinice] = Math.max(newValues[RowNames.Jedinice], numOccurences[1] * 1);
		newValues[RowNames.Dvojke] = Math.max(newValues[RowNames.Dvojke], numOccurences[2] * 2);
		newValues[RowNames.Trojke] = Math.max(newValues[RowNames.Trojke], numOccurences[3] * 3);
		newValues[RowNames.Cetvorke] = Math.max(newValues[RowNames.Cetvorke], numOccurences[4] * 4);
		newValues[RowNames.Petice] = Math.max(newValues[RowNames.Petice], numOccurences[5] * 5);
		newValues[RowNames.Sestice] = Math.max(newValues[RowNames.Sestice], numOccurences[6] * 6);
		for (let a = 1; a <= 6; a++) {
			for (let b = 1; b <= 6; b++) {
				if (a == b) continue;
				if (numOccurences[a] >= 3 && numOccurences[b] >= 2) {
					newValues[RowNames.Ful] = Math.max(newValues[RowNames.Ful], 3 * a + 2 * b + 30);
				}
			}
		}
		let minSum = 0;
		let maxSum = 0;
		for (let i = 0; i < 5; i++) {
			minSum += dice[i];
			maxSum += dice[dice.length - 1 - i];
		}
		newValues[RowNames.Minimum] = Math.max(newValues[RowNames.Minimum], minSum);
		newValues[RowNames.Maksimum] = Math.max(newValues[RowNames.Maksimum], maxSum);
		setGameState((prev) => ({ ...prev, value: newValues }));
		//console.log(newValues);
	}, [gameState.rolledDice]); //TODO: fix this make this faster

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

			return {
				...prev,
				roundIndex: nextRoundIndex,
				isRucna,
				rolledDice,
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
