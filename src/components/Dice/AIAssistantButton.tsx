import OpenAI from "openai";
import { useState, useContext } from "react";
import { TabelaContext, StateContext } from "../../contexts/GameContext";
import { useNetworking } from "../../contexts/NetworkingContext";
import { isCellActive } from "../Board/Board";
import {
	RowNames,
	ReverseRowNames,
	ReverseColumnNames,
	RowNameFromString,
	type RowName,
	ColumnNameFromString,
	type ColumnName,
} from "../Board/BoardConstants";
import { chooseCell } from "../Board/choseCell";

export const AIAssistantButton = ({
	showSettings,
	dice,
	keepDice,
	textRef,
}: {
	showSettings: boolean;
	dice: number[];
	keepDice: (diceToKeep: number[]) => void;
	textRef: HTMLDivElement | null;
}) => {
	const [gptInstruction, setGptInstruction] = useState(`You are a Yamb assistant.

Rules:
- The player has up to 3 rolls each turn (rollNumber 1 to 3).
- After each roll (except the last), the player can keep any dice they want and reroll the rest.
- "dice" includes all dice currently held and just rolled.
- On rolls 1 and 2, respond with dice to roll again.
- On roll 3, YOU MUST respond with the scoring category to select, OR ELSE YOU WILL BE TERMINATED.
- Use the provided "availableCells" list; "score" values are final scores, do NOT recalculate them. They are the current value, not the maximum possible value.
- Respond ONLY in JSON matching this format:
- Whenn keeping dice, all other dice are rolled again.

No extra text, no markdown, no explanations outside JSON.
`);

	const keepDiceText = `If choosing dice to keep (roll 1 or 2):
{
	"action": "keep",
	"diceToKeep": [array of integers],
	"reason": "short explanation"
}`;

	const scoreText = `If selecting a scoring category (roll 3):
{
	"action": "score",
	"category": { "row": string, "col": string },
	"reason": "short explanation"
}`;

	const [gptSystem, setGptSystem] = useState(
		"You are a Yamb assistant. Always respond only with strict JSON, as the user defines. Do not perform any calculations based on dice values. The values shown in availableCells are already final, pre-calculated totals. You must not recalculate them or second-guess them."
	);

	const [gptModel, setGptModel] = useState("gpt-4o-mini");

	const { tabela, updateTabela } = useContext(TabelaContext);
	const { gameState, setGameState } = useContext(StateContext);

	const { broadcastMessage, sendMessageToNextPlayer } = useNetworking();

	const [prevRoundIndex, setPrevRoundIndex] = useState(-1);

	const generatePrompt = () => {
		let prompt: any = {};
		prompt["game"] = "Yamb";

		// Combine chosenDice and rolledDice to represent all dice currently held + rolled this turn
		prompt["turn"] = {
			dice,
			rollNumber: gameState.roundIndex, // 1-based roll number (1 to 3)
		};

		prompt["availableCells"] = [];

		for (let rowIndex = 0; rowIndex < 16; rowIndex++) {
			for (let colIndex = 0; colIndex < 8; colIndex++) {
				let isActive = isCellActive(tabela, rowIndex, colIndex, gameState);
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
				const value = gameState.value[rowIndex] === -1 ? 0 : gameState.value[rowIndex];

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
		if (gameState.roundIndex == prevRoundIndex) {
			if (!textRef) return;
			textRef.hidden = false;
			textRef.style.top = "525px";
			textRef.innerHTML =
				"🎲 You’ve already made your move! Roll the dice again to continue.";
			return;
		}
		setPrevRoundIndex(gameState.roundIndex);

		const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{
				role: "system",
				content: gptSystem,
			},
			{
				role: "user",
				content:
					JSON.stringify(generatePrompt()) +
					(gameState.roundIndex <= 2 ? keepDiceText : "") +
					(gameState.roundIndex <= 3 ? scoreText : ""),
			},
		];

		console.log(messages);

		const response = await openai.chat.completions.create({
			//model: "gpt-3.5-turbo-1106",
			model: gptModel,
			messages,
			response_format: { type: "json_object" },
		});

		const reply = response.choices[0].message.content;

		if (reply) {
			const result = JSON.parse(reply);
			console.log("✅ AI Response:", result);

			// parse the response
			if (result.action === "keep") {
				keepDice(result.diceToKeep);
			}
			if (result.reason != undefined && textRef) {
				textRef.hidden = false;
				textRef.style.top = "525px";
				if (result.action === "score") {
					textRef.style.top = "725px";
				}
				textRef.innerHTML = "☝️🤖 " + result.reason;
			}
			if (result.action === "score") {
				let rowIndex = RowNameFromString[result.category.row] as RowName;
				let colIndex = ColumnNameFromString[result.category.col] as ColumnName;
				chooseCell({
					rowIndex,
					colIndex,
					gameState,
					isActive: isCellActive(tabela, rowIndex, colIndex, gameState),
					tabela,
					updateTabela,
					setGameState,
					broadcastMessage,
					sendMessageToNextPlayer,
				});
			}
			return result;
		} else {
			throw new Error("No response from AI");
		}
	};

	return (
		<button className="relative h-[50px] w-[50px] rounded-md border-2 border-main-600 bg-main-900 p-1">
			<img
				src="assets/robot-antennas (1).svg"
				onClick={() => {
					callYambAssistant();
				}}
			></img>
			{showSettings && (
				<>
					<textarea
						rows={16}
						cols={60}
						value={gptInstruction}
						onChange={(e) => setGptInstruction(e.target.value)}
						className="absolute left-[-515px] top-[-775px] rounded-xl border-4 bg-main-50 pl-2"
					/>
					<textarea
						rows={5}
						cols={60}
						value={gptSystem}
						onChange={(e) => setGptSystem(e.target.value)}
						className="absolute left-[-515px] top-[-375px] rounded-xl border-4 bg-main-50 pl-2"
					/>
					<textarea
						rows={1}
						cols={60}
						value={gptModel}
						onChange={(e) => setGptModel(e.target.value)}
						className="absolute left-[-515px] top-[-225px] rounded-xl border-4 bg-main-50 pl-2"
					/>
				</>
			)}
		</button>
	);
};
export const openai = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Store your API key in .env
	dangerouslyAllowBrowser: true,
});
