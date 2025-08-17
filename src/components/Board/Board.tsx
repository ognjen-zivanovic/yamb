import { useEffect } from "react";
import { BoardHeaderRow } from "./BoardHeaderRow";
import { BoardRow } from "./BoardRow";
import { type RowName } from "./BoardConstants";
import { RowNames, ColumnNames } from "./BoardConstants";
import { type Cell } from "./BoardConstants";
import { useNetworking } from "../../contexts/NetworkingContext";
import type { GameState } from "../../contexts/GameContext";

export const YambBoard = ({
	tabela,
	updateTabela,
}: {
	tabela: Cell[][];
	updateTabela: (row: number, col: number, cell: Cell) => void;
}) => {
	const { broadcastMessage, sendMessageToNextPlayer } = useNetworking();

	useEffect(() => {
		const calculateSumOfFirstSum = (colIndex: number) => {
			if (tabela[RowNames.Suma1][colIndex]?.value == undefined) {
				let cnt = 0;
				let sum = 0;
				for (let i = 0; i < 6; i++) {
					if (tabela[i][colIndex]?.value != undefined) {
						cnt++;
						sum += tabela[i][colIndex]?.value ?? 0;
					}
				}
				if (sum > 60) {
					sum += 30;
				}
				if (cnt == 6) {
					updateTabela(RowNames.Suma1, colIndex, {
						value: sum,
						isAvailable: false,
					});
				}
			}
		};
		const calculateSumOfSecondSum = (colIndex: number) => {
			if (tabela[RowNames.Suma2][colIndex]?.value == undefined) {
				let maxi = tabela[RowNames.Maksimum][colIndex]?.value;
				let mini = tabela[RowNames.Minimum][colIndex]?.value;
				let jedinice = tabela[RowNames.Jedinice][colIndex]?.value;

				if (maxi != undefined && mini != undefined && jedinice != undefined) {
					let sum = Math.max(maxi - mini, 0) * jedinice;
					updateTabela(RowNames.Suma2, colIndex, {
						value: sum,
						isAvailable: false,
					});
				}
			}
		};
		const calculateSumOfLastSum = (colIndex: number) => {
			if (tabela[RowNames.Suma3][colIndex]?.value == undefined) {
				let sum = 0;
				for (let rowIndex = RowNames.Kenta; rowIndex <= RowNames.Yamb; rowIndex++) {
					if (tabela[rowIndex][colIndex]?.value == undefined) {
						return;
					}
					sum += tabela[rowIndex][colIndex]?.value ?? 0;
				}
				updateTabela(RowNames.Suma3, colIndex, {
					value: sum,
					isAvailable: false,
				});
			}
		};
		for (let colIndex = 0; colIndex < 10; colIndex++) {
			calculateSumOfFirstSum(colIndex);
			calculateSumOfSecondSum(colIndex);
			calculateSumOfLastSum(colIndex);
		}

		const calculateSumOfRow = (rowName: (typeof RowNames)[keyof typeof RowNames]) => {
			let sum = 0;
			for (let colIndex = 0; colIndex < 10; colIndex++) {
				if (tabela[rowName][colIndex]?.value == undefined) {
					return;
				}
				sum += tabela[rowName][colIndex]?.value ?? 0;
			}
			updateTabela(rowName, ColumnNames.Yamb, { value: sum, isAvailable: false });
		};

		for (let rowName of [RowNames.Suma1, RowNames.Suma2, RowNames.Suma3]) {
			if (tabela[rowName][ColumnNames.Yamb]?.value == undefined) {
				calculateSumOfRow(rowName);
			}
		}
	}, [tabela]); // this shit is probably slow as fuck

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
	if (colIndex == ColumnNames.Rucna && gameState.roundIndex != 1) isActive = false;
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
