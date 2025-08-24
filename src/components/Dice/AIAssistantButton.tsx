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
	numRows,
	numColumns,
} from "../Board/BoardConstants";
import { chooseCell } from "../Board/choseCell";
import { RobotAntennasSvg } from "../../Svgs";

export const AIAssistantButton = ({
	dice,
	keepDice,
	textRef,
	gptSettingsRef,
}: {
	dice: number[];
	keepDice: (diceToKeep: number[]) => void;
	textRef: HTMLDivElement | null;
	gptSettingsRef: any;
}) => {
	const { tabela, updateTabela } = useContext(TabelaContext);
	const { gameState, setGameState } = useContext(StateContext);

	const { broadcastMessage, sendMessageToNextPlayer } = useNetworking();

	const [prevRoundIndex, setPrevRoundIndex] = useState(-1);

	const generatePrompt = () => {
		const gptInstruction = gptSettingsRef.current.gptInstruction;
		let prompt: any = {};
		prompt["game"] = "Yamb";

		// Combine chosenDice and rolledDice to represent all dice currently held + rolled this turn
		prompt["turn"] = {
			dice,
			rollNumber: gameState.roundIndex, // 1-based roll number (1 to 3)
		};

		prompt["availableCells"] = [];

		for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
			for (let colIndex = 0; colIndex < numColumns; colIndex++) {
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
		const gptSystem = gptSettingsRef.current.gptSystem;
		const gptModel = gptSettingsRef.current.gptModel;
		const keepDiceText = gptSettingsRef.current.keepDiceText;
		const scoreText = gptSettingsRef.current.scoreText;

		if (gameState.roundIndex == prevRoundIndex) {
			if (!textRef) return;
			textRef.hidden = false;
			textRef.style.top = "525px";
			textRef.textContent =
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
				textRef.textContent = "☝️🤖 " + result.reason;
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
		<button className="relative h-[65px] w-[65px] rounded-md border-2 border-main-600 bg-main-900 p-1 sm:h-[50px] sm:w-[50px]">
			<RobotAntennasSvg
				onClick={() => {
					callYambAssistant();
				}}
			></RobotAntennasSvg>
		</button>
	);
};

const key = localStorage.getItem("openai-key");
export const openai = new OpenAI({
	apiKey: key ?? "", // Store your API key in .env
	dangerouslyAllowBrowser: true,
});
