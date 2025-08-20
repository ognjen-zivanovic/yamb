import { forwardRef, useState, useImperativeHandle } from "react";

export interface GptSettingsHandle {
	gptInstruction: string;
	gptSystem: string;
	gptModel: string;
	keepDiceText: string;
	scoreText: string;
	isHidden: boolean;
	setHidden: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GptSettings = forwardRef<GptSettingsHandle, {}>((_props, ref) => {
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

	const [isHidden, setHidden] = useState(true);

	useImperativeHandle(
		ref,
		() => ({
			gptInstruction,
			gptSystem,
			gptModel,
			keepDiceText,
			scoreText,
			isHidden,
			setHidden,
		}),
		[gptInstruction, gptSystem, gptModel, isHidden]
	);

	return (
		<div className="absolute m-4" hidden={isHidden}>
			<textarea
				rows={16}
				cols={60}
				value={gptInstruction}
				onChange={(e) => setGptInstruction(e.target.value)}
				className="absolute top-[-675px] rounded-xl border-4 bg-main-50 pl-2"
			/>
			<textarea
				rows={5}
				cols={60}
				value={gptSystem}
				onChange={(e) => setGptSystem(e.target.value)}
				className="absolute top-[-275px] rounded-xl border-4 bg-main-50 pl-2"
			/>
			<textarea
				rows={1}
				cols={60}
				value={gptModel}
				onChange={(e) => setGptModel(e.target.value)}
				className="absolute top-[-125px] rounded-xl border-4 bg-main-50 pl-2"
			/>
		</div>
	);
});
