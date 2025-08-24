import type { GameState } from "../../contexts/GameContext";
import { useNetworking } from "../../contexts/NetworkingContext";
import { ColumnNames, type Cell, type RowName } from "./BoardConstants";
import { BoardHeaderRow } from "./BoardHeaderRow";
import { BoardRow } from "./BoardRow";

export const YambBoard = ({
	tabela,
	updateTabela,
}: {
	tabela: Cell[][];
	updateTabela: (row: number, col: number, cell: Cell) => void;
}) => {
	const { broadcastMessage, sendMessageToNextPlayer } = useNetworking();

	return (
		<>
			<div className="flex aspect-[106/118] min-h-0 w-[600px] flex-col overflow-clip rounded-md border-4 border-solid border-main-500">
				<BoardHeaderRow />
				{Array.from({ length: 16 }).map((_, rowIndex) => (
					<BoardRow
						key={rowIndex}
						rowIndex={rowIndex as RowName}
						tabela={tabela}
						updateTabela={updateTabela}
						broadcastMessage={broadcastMessage}
						sendMessageToNextPlayer={sendMessageToNextPlayer}
					/>
				))}
			</div>
		</>
	);
};
export function isCellActive(
	tabela: Cell[][],
	rowIndex: number,
	colIndex: number,
	gameState: GameState
) {
	let isActive = tabela[rowIndex][colIndex]?.isAvailable && gameState.value[rowIndex] > 0;
	if (colIndex == ColumnNames.Najava && gameState.najava != rowIndex) isActive = false;
	if (colIndex == ColumnNames.Dirigovana && gameState.dirigovana != rowIndex) isActive = false;
	if (colIndex == ColumnNames.Rucna && !gameState.isRucna) isActive = false;
	if (gameState.najava != undefined && colIndex != ColumnNames.Najava) isActive = false;
	if (gameState.dirigovana != undefined && colIndex != ColumnNames.Dirigovana) isActive = false;
	if (
		gameState.najava != undefined &&
		colIndex == ColumnNames.Najava &&
		rowIndex == gameState.najava
	)
		isActive = true;
	if (
		gameState.dirigovana != undefined &&
		colIndex == ColumnNames.Dirigovana &&
		rowIndex == gameState.dirigovana
	)
		isActive = true;
	return isActive;
}
