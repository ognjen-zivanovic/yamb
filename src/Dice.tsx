import { useContext, useEffect, useState } from "react";
import { type State, StateContext, TabelaContext } from "./App";
import { ColumnNames, ReverseColumnNames, ReverseRowNames, RowNames } from "./BoardConstants";
import { isCellActive } from "./Board";
import { OpenAI } from "openai";

const diceImages = [
	null,
	"assets/dice-six-faces-one.svg",
	"assets/dice-six-faces-two.svg",
	"assets/dice-six-faces-three.svg",
	"assets/dice-six-faces-four.svg",
	"assets/dice-six-faces-five.svg",
	"assets/dice-six-faces-six.svg",
];

const openai = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Store your API key in .env
	dangerouslyAllowBrowser: true,
});

export const DicePicker = () => {
	//const {
	//	rolledDice,
	//	chosenDice,
	//	numChosenDice,
	//	setRolledDice,
	//	setChosenDice,
	//	setNumChosenDice,
	//} = useContext(DiceContext);

	const [rolledDice, setRolledDice] = useState<number[]>([]);
	const [chosenDice, setChosenDice] = useState<number[]>([]);
	const [numChosenDice, setNumChosenDice] = useState(0);

	const { state, setState } = useContext(StateContext);
	const { tabela } = useContext(TabelaContext);

	const [gptInstruction, setGptInstruction] = useState(`
	  You are a Yamb assistant.
	  
	  Rules:
	  - The player has up to 3 rolls each turn (rollNumber 1 to 3).
	  - After each roll (except the last), the player can keep any dice they want and reroll the rest.
	  - "dice" includes all dice currently held and just rolled.
	  - On rolls 1 and 2, respond with dice to roll again.
	  - On roll 3, respond with the scoring category to select.
	  - Use the provided "availableCells" list; "score" values are final scores, do NOT recalculate them. They are the current value, not the maximum possible value.
	  - Respond ONLY in JSON matching this format:
	  - Whenn keeping dice, all other dice are rolled again.
	  
	  If choosing dice to keep (roll 1 or 2):
	  {
		"action": "keep",
		"diceToKeep": [array of integers],
		"reason": "short explanation"
	  }
	  
	  If selecting a scoring category (roll 3):
	  {
		"action": "score",
		"category": { "row": string, "col": string },
		"reason": "short explanation"
	  }
	  
	  No extra text, no markdown, no explanations outside JSON.
	  `);

	const [gptSystem, setGptSystem] = useState(
		"You are a Yamb assistant. Always respond only with strict JSON, as the user defines. Do not perform any calculations based on dice values. The values shown in availableCells are already final, pre-calculated totals. You must not recalculate them or second-guess them."
	);

	const generatePrompt = () => {
		let prompt: any = {};
		prompt["game"] = "Yamb";

		// Combine chosenDice and rolledDice to represent all dice currently held + rolled this turn
		const dice = [...chosenDice, ...rolledDice];

		prompt["turn"] = {
			dice,
			rollNumber: state.roundIndex, // 1-based roll number (1 to 3)
		};

		prompt["availableCells"] = [];

		for (let rowIndex = 0; rowIndex < 16; rowIndex++) {
			for (let colIndex = 0; colIndex < 8; colIndex++) {
				let isActive = isCellActive(tabela, rowIndex, colIndex, state);
				if (!isActive) continue;

				// Skip sum rows as per your logic
				if (
					rowIndex === RowNames.Suma1 ||
					rowIndex === RowNames.Suma2 ||
					rowIndex === RowNames.Suma3
				) {
					continue;
				}

				// Use 0 if not scored yet
				const value = state.value[rowIndex] === -1 ? 0 : state.value[rowIndex];

				prompt["availableCells"].push({
					row: ReverseRowNames[rowIndex], // string keys for row
					col: ReverseColumnNames[colIndex], // string keys for col
					score: value,
				});
			}
		}

		// Full instruction for the model
		prompt["instruction"] = gptInstruction;

		console.log(JSON.stringify(prompt));
		return prompt;
	};

	const callYambAssistant = async () => {
		const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{
				role: "system",
				content: gptSystem,
			},
			{
				role: "user",
				content: JSON.stringify(generatePrompt()),
			},
		];

		const response = await openai.chat.completions.create({
			model: "gpt-3.5-turbo-1106",
			messages,
			response_format: { type: "json_object" },
		});

		const reply = response.choices[0].message.content;

		if (reply) {
			const result = JSON.parse(reply);
			console.log("✅ AI Response:", result);

			// parse the response
			if (result.action === "keep") {
				setRolledDice((prev) => [...chosenDice, ...prev]);
				setChosenDice([]);
				for (let i = 0; i < result.diceToKeep.length; i++) {
					const diceValue = result.diceToKeep[i];
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
				setNumChosenDice(result.diceToKeep.length);
			}
			return result;
		} else {
			throw new Error("No response from AI");
		}
	};

	useEffect(() => {
		if (state.roundIndex == 0) {
			setNumChosenDice(0);
			setChosenDice([]);
			setRolledDice([]);
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
			setState((prev) => ({ ...prev, value: [] }));
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
		//console.log(newValues);
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
		<div className="flex flex-row items-center justify-center gap-6">
			<div className="f-full rounded-md border-2 border-main-600">
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
						{state.roundIndex == 0 ? "" : "Round " + state.roundIndex + "/3"}
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
				<button
					className="h-[50px] w-[50px] rounded-md border-2 border-main-600 bg-main-900 p-1"
					onClick={() => {
						callYambAssistant();
					}}
				>
					<img src="assets/robot-antennas (1).svg"></img>
				</button>
			</div>
		</div>
	);
};

export default DicePicker;
