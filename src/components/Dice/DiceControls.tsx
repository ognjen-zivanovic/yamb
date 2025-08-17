import { useState, useContext, useEffect } from "react";
import { StateContext } from "../../contexts/GameContext";
import { AIAssistantButton } from "./AIAssistantButton";
import { RowNames } from "../Board/BoardConstants";

const urlParams = new URLSearchParams(window.location.search);
const gameIdFromUrl = urlParams.get("game");
const data = localStorage.getItem(gameIdFromUrl + "-dice");
const savedGameData = data ? JSON.parse(data) : undefined;

export const DiceControls = ({
	showSettings,
	textRef,
	gameId,
}: {
	showSettings: boolean;
	textRef: HTMLDivElement | null;
	gameId: string;
}) => {
	//const {
	//	rolledDice,
	//	chosenDice,
	//	numChosenDice,
	//	setRolledDice,
	//	setChosenDice,
	//	setNumChosenDice,
	//} = useContext(DiceContext);
	const [rolledDice, setRolledDice] = useState<number[]>(savedGameData?.rolledDice ?? []);
	const [chosenDice, setChosenDice] = useState<number[]>(savedGameData?.chosenDice ?? []);
	const [numChosenDice, setNumChosenDice] = useState<number>(savedGameData?.numChosenDice ?? 0);

	const { gameState, setGameState } = useContext(StateContext);
	useEffect(() => {
		if (gameState.roundIndex == 0 && !gameState.isMyMove) {
			setNumChosenDice(0);
			setChosenDice([]);
			setRolledDice([]);
		}
	}, [gameState.roundIndex]);

	useEffect(() => {
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
	}, [rolledDice]); //TODO: fix this make this faster

	useEffect(() => {
		localStorage.setItem(
			gameId + "-dice",
			JSON.stringify({ chosenDice, rolledDice, numChosenDice })
		);
	}, [chosenDice, rolledDice, numChosenDice]);

	const rollDice = () => {
		if (gameState.roundIndex >= 3) return;
		setGameState((prev) => ({ ...prev, roundIndex: prev.roundIndex + 1 }));
		setRolledDice([]);

		for (let i = 0; i < 6 - numChosenDice; i++) {
			const rolledNumber = Math.ceil(Math.random() * 6);
			setRolledDice((prev) => [...prev, rolledNumber]);
		}
	};

	const keepDice = (diceToKeep: number[]) => {
		setRolledDice((prev) => [...chosenDice, ...prev]);
		setChosenDice([]);
		for (let i = 0; i < diceToKeep.length; i++) {
			const diceValue = diceToKeep[i];
			setChosenDice((prev) => {
				return [...prev, diceValue];
			});

			setRolledDice((prev) => {
				let copy = [...prev];
				const index = copy.indexOf(diceValue);
				copy.splice(index, 1);
				return copy;
			});
		}
		setNumChosenDice(diceToKeep.length);
	};

	return (
		gameState.isMyMove && (
			<div className="flex flex-row items-center justify-center gap-6">
				<div className="f-full rounded-md border-4 border-main-600">
					<div className="flex min-h-[82px] w-[412px] flex-wrap gap-4 bg-main-500 p-4">
						{chosenDice.map((num, index) => (
							<img
								className="rounded-md bg-black"
								key={index}
								src={diceImages[num]!}
								alt={`Dice ${num}`}
								width={50}
								height={50}
								onClick={() => {
									setChosenDice((prev) => prev.filter((_, i) => i !== index));
									setNumChosenDice((prev) => prev - 1);
									setRolledDice((prev) => [...prev, num]);
								}}
							/>
						))}
					</div>
					<div className="flex min-h-[82px] w-[412px] flex-wrap gap-4 bg-main-200 p-4">
						{rolledDice.map((num, index) => (
							<img
								className="rounded-md bg-black"
								key={index}
								src={diceImages[num]!}
								alt={`Dice ${num}`}
								width={50}
								height={50}
								onClick={() => {
									setChosenDice((prev) => [...prev, num]);
									setNumChosenDice((prev) => prev + 1);
									setRolledDice((prev) => prev.filter((_, i) => i !== index));
								}}
							/>
						))}
					</div>
				</div>
				<div className="flex flex-col items-center justify-around gap-4">
					<div className="text-center">
						<p className="text-xl font-bold">
							{gameState.roundIndex == 0
								? ""
								: "Round " + gameState.roundIndex + "/3"}
						</p>
					</div>
					<button onClick={rollDice} className="h-[50px] w-[50px] text-xl font-bold">
						<img
							src="assets/rolling-dices.svg"
							alt="Roll"
							width={50}
							height={50}
							className="rounded-md border-2 border-main-600 bg-main-900"
						/>
					</button>
					{/* {gameState.roundIndex > 0 && ( */}
					<AIAssistantButton
						showSettings={showSettings}
						dice={[...chosenDice, ...rolledDice]}
						keepDice={keepDice}
						textRef={textRef}
					/>
					{/* )} */}
				</div>
			</div>
		)
	);
};
export const diceImages = [
	null,
	"assets/dice-six-faces-one.svg",
	"assets/dice-six-faces-two.svg",
	"assets/dice-six-faces-three.svg",
	"assets/dice-six-faces-four.svg",
	"assets/dice-six-faces-five.svg",
	"assets/dice-six-faces-six.svg",
];
