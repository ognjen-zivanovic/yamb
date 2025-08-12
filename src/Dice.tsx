import { useContext, useEffect, useState } from "react";
import { type State, StateContext } from "./App";
import { RowNames } from "./Board";

const diceImages = [
	null,
	"assets/dice-six-faces-one.svg",
	"assets/dice-six-faces-two.svg",
	"assets/dice-six-faces-three.svg",
	"assets/dice-six-faces-four.svg",
	"assets/dice-six-faces-five.svg",
	"assets/dice-six-faces-six.svg",
];

export const DicePicker = () => {
	const [rolledDice, setRolledDice] = useState<number[]>([]);
	const [chosenDice, setChosenDice] = useState<number[]>([]);
	const [numChosenDice, setNumChosenDice] = useState(0);

	const { state, setState } = useContext(StateContext);

	useEffect(() => {
		if (state.roundIndex == 0) {
			setRolledDice([]);
			setChosenDice([]);
			setNumChosenDice(0);
		}
	}, [state.roundIndex]);

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
			return;
		}
		for (let i = 0; i < 6; i++) {
			numOccurences[i] = Math.min(numOccurences[i], 5);
		}
		dice.sort();
		for (let i = 1; i <= 6; i++) {
			if (numOccurences[i] >= 3) {
				newValues[RowNames.Triling] = Math.max(newValues[RowNames.Triling], 3 * i + 30);
			}
			if (numOccurences[i] >= 4) {
				newValues[RowNames.Kare] = Math.max(newValues[RowNames.Ful], 4 * i + 30);
			}
			if (numOccurences[i] >= 5) {
				newValues[RowNames.Yamb] = Math.max(newValues[RowNames.Kare], 5 * i + 30);
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
				66 - 10 * (state.roundIndex - 1)
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
		setState((prev) => ({ ...prev, value: newValues }));
		console.log(newValues);
	}, [rolledDice]); //TODO: fix this make this faster

	const rollDice = () => {
		if (state.roundIndex >= 3) return;
		setState((prev) => ({ ...prev, roundIndex: prev.roundIndex + 1 }));
		setRolledDice([]);

		for (let i = 0; i < 6 - numChosenDice; i++) {
			const rolledNumber = Math.ceil(Math.random() * 6);
			setRolledDice((prev) => [...prev, rolledNumber]);
		}
	};

	return (
		<div className="flex flex-row items-center justify-center m-6 gap-6">
			<div className="border-2 border-blue-500 rounded-md f-full">
				<div className="flex flex-wrap gap-4 p-4 bg-blue-400 min-h-[82px] w-[412px]">
					{chosenDice.map((num, index) => (
						<img
							className="bg-black rounded-md"
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
				<div className="flex flex-wrap gap-4 p-4 bg-blue-200 min-h-[82px] w-[412px]">
					{rolledDice.map((num, index) => (
						<img
							className="bg-black rounded-md"
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
			<div className="flex flex-col items-center justify-around">
				<div className="text-center">
					<p className="text-xl font-bold">
						{state.roundIndex == 0 ? "" : "Round " + state.roundIndex + "/3"}
					</p>
				</div>
				<button onClick={rollDice} className="font-bold text-xl w-[50px] h-[50px]">
					<img
						src="assets/rolling-dices.svg"
						alt="Roll"
						width={50}
						height={50}
						className="bg-blue-800 rounded-md border-2 border-blue-500"
					/>
				</button>
			</div>
		</div>
	);
};

export default DicePicker;
