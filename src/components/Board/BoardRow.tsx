import { useContext } from "react";
import { StateContext, TabelaContext } from "../../contexts/GameContext";
import { useNetworking } from "../../contexts/NetworkingContext";
import { isCellActive } from "./Board";
import { ColumnNames, numColumns, rowHeaders, RowNames, type RowName } from "./BoardHelpers";
import { chooseCell } from "./choseCell";

export const BoardRow = ({ rowIndex }: { rowIndex: RowName }) => {
	const { broadcastMessage, sendMessageToNextPlayer } = useNetworking();
	const { gameState, setGameState } = useContext(StateContext);
	const { tabela, updateTabela } = useContext(TabelaContext);

	return (
		<div className="h-row-7 flex flex-row">
			<div
				className={` border-main-500 border-1 h-full w-col-12 text-center align-middle flex items-center justify-center

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
						className={` border-main-500 border-1 h-full w-col-8 flex items-center justify-center text-[1.35rem] ${
							rowIndex === RowNames.Suma1 ||
							rowIndex === RowNames.Suma2 ||
							rowIndex === RowNames.Suma3
								? "bg-shade-1 border-t-2 border-b-2"
								: ""
						} ${isActive ? "border-2 border-gray-800" : ""} 
						${tabela[rowIndex][colIndex]?.value == undefined ? "text-my-gray" : "text-my-black font-bold"} ${
							tabela[rowIndex][colIndex]?.value == 0 ||
							(isActive && gameState.value[rowIndex] == -1)
								? "!bg-my-black !border-0 text-transparent"
								: ""
						} ${
							colIndex == ColumnNames.Obavezna || colIndex == ColumnNames.Maksimalna
								? "brightness-75 bg-background"
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
				className={`border-main-500 border-1 h-full w-col-14 text-[1.6rem] text-center ${
					rowIndex === RowNames.Suma1 ||
					rowIndex === RowNames.Suma2 ||
					rowIndex === RowNames.Suma3
						? "bg-shade-1 border-t-2 border-b-2"
						: ""
				}`}
			>
				{tabela[rowIndex][ColumnNames.Yamb]?.value != undefined
					? tabela[rowIndex][ColumnNames.Yamb]?.value
					: ""}
			</div>
		</div>
	);
};
