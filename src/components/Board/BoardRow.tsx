import { useContext } from "react";
import { StateContext } from "../../contexts/GameContext";
import { isCellActive } from "./Board";
import {
	ColumnNames,
	numColumns,
	rowHeaders,
	RowNames,
	type Cell,
	type RowName,
} from "./BoardConstants";
import { chooseCell } from "./choseCell";

export const BoardRow = ({
	rowIndex,
	tabela,
	updateTabela,
	broadcastMessage,
	sendMessageToNextPlayer,
}: {
	rowIndex: RowName;
	tabela: Cell[][];
	updateTabela: (row: number, col: number, cell: Cell) => void;
	broadcastMessage: (type: string, data: any) => void;
	sendMessageToNextPlayer: (message: string, data: any) => void;
}) => {
	const { gameState, setGameState } = useContext(StateContext);

	return (
		<div className="flex h-[calc(7*100%/118)] flex-row">
			<div
				className={`bg-white border-main-500 border-1 h-full w-[calc(12*100%/106)] text-center align-middle flex items-center justify-center
				
			${
				rowIndex === RowNames.Suma1 ||
				rowIndex === RowNames.Suma2 ||
				rowIndex === RowNames.Suma3
					? "border-t-2 border-b-2"
					: ""
			}`}
				onClick={() => {
					if (
						gameState.roundIndex == 1 &&
						gameState.najava == undefined &&
						gameState.dirigovana == undefined &&
						rowIndex != RowNames.Suma1 &&
						rowIndex != RowNames.Suma2 &&
						rowIndex != RowNames.Suma3
					) {
						setGameState((prev) => ({ ...prev, najava: rowIndex }));
						sendMessageToNextPlayer("najava", rowIndex);
					}
				}}
			>
				{rowHeaders[rowIndex % rowHeaders.length]}
			</div>
			{Array.from({ length: 10 }).map((_, colIndex) => {
				let isActive = isCellActive(tabela, rowIndex, colIndex, gameState);

				return (
					<div
						key={rowIndex * numColumns + colIndex}
						className={` border-main-500 border-1 h-full w-[calc(8*100%/106)] flex items-center justify-center text-[1.35rem] ${
							rowIndex === RowNames.Suma1 ||
							rowIndex === RowNames.Suma2 ||
							rowIndex === RowNames.Suma3
								? "bg-main-300 border-t-2 border-b-2"
								: "bg-white"
						} ${isActive ? "border-2 border-gray-800" : ""} ${
							tabela[rowIndex][colIndex]?.value == undefined
								? "text-gray-500"
								: "text-black font-bold"
						} ${
							tabela[rowIndex][colIndex]?.value == 0 ||
							(isActive && gameState.value[rowIndex] == -1)
								? "!bg-gray-800 !border-0 text-transparent"
								: ""
						} ${
							colIndex == ColumnNames.Obavezna || colIndex == ColumnNames.Maksimalna
								? "brightness-75"
								: ""
						}`}
						onClick={() => {
							chooseCell({
								rowIndex,
								colIndex,
								gameState,
								isActive,
								tabela,
								updateTabela,
								setGameState,
								broadcastMessage,
								sendMessageToNextPlayer,
							});
						}}
					>
						{tabela[rowIndex][colIndex]?.value != undefined
							? tabela[rowIndex][colIndex]?.value
							: isActive
							? gameState.value[rowIndex]
							: ""}
					</div>
				);
			})}
			<div
				className={`border-main-500 border-1 h-full w-[calc(14*100%/106)] text-[1.6rem] text-center ${
					rowIndex === RowNames.Suma1 ||
					rowIndex === RowNames.Suma2 ||
					rowIndex === RowNames.Suma3
						? "bg-main-300 border-t-2 border-b-2"
						: "bg-white"
				}`}
			>
				{tabela[rowIndex][ColumnNames.Yamb]?.value != undefined
					? tabela[rowIndex][ColumnNames.Yamb]?.value
					: ""}
			</div>
		</div>
	);
};
