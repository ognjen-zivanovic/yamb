import type { Dispatch, SetStateAction } from "react";
import type { GameState } from "../../contexts/GameContext";
import { ColumnNames, RowNames, type Cell } from "./BoardHelpers";
import Globals from "../../globals";

export const chooseCell = ({
	rowIndex,
	colIndex,
	gameState,
	isActive,
	tabela,
	updateTabela,
	setGameState,
	broadcastMessage,
	sendMessageToNextPlayer,
}: {
	rowIndex: number;
	colIndex: number;
	gameState: GameState;
	isActive: boolean | undefined;
	tabela: Cell[][];
	updateTabela: (row: number, col: number, cell: Cell) => void;
	setGameState: Dispatch<SetStateAction<GameState>>;
	broadcastMessage: (type: string, data: any) => void;
	sendMessageToNextPlayer: (message: string, data: any) => void;
}) => {
	if (rowIndex == RowNames.Suma1 || rowIndex == RowNames.Suma2 || rowIndex == RowNames.Suma3) {
		return;
	}
	if (!gameState.blackout && !isActive) {
		return;
	}
	let newValue = gameState.value[rowIndex] == -1 ? 0 : gameState.value[rowIndex];
	if (gameState.blackout && !isActive) newValue = 0;
	updateTabela(rowIndex, colIndex, {
		value: newValue,
		isAvailable: false,
	});
	if (!gameState.blackout) {
		SetNewAvailable(tabela, updateTabela, rowIndex, colIndex);
	}
	setGameState({
		value: [],
		roundIndex: 0,
		isMyMove: Globals.isSolo ?? false,
		chosenDice: [],
		rolledDice: [],
		numChosenDice: 0,
	});
	sendMessageToNextPlayer("next-player", {});
	broadcastMessage("move", { rowIndex, colIndex, value: newValue });
};

export const SetNewAvailable = (
	tabela: Cell[][],
	updateTabela: (row: number, col: number, cell: Cell) => void,
	rowIndex: number,
	colIndex: number
) => {
	if (
		colIndex == ColumnNames.OdGore ||
		colIndex == ColumnNames.OdGoreIDole ||
		colIndex == ColumnNames.OdSredine
	) {
		SetNewInDirection(tabela, updateTabela, rowIndex, colIndex, 1);
	}

	if (
		colIndex == ColumnNames.OdDole ||
		colIndex == ColumnNames.OdGoreIDole ||
		colIndex == ColumnNames.OdSredine
	) {
		SetNewInDirection(tabela, updateTabela, rowIndex, colIndex, -1);
	}
};

const SetNewInDirection = (
	tabela: Cell[][],
	updateTabela: (row: number, col: number, cell: Cell) => void,
	rowIndex: number,
	colIndex: number,
	di: number
) => {
	let nextIndex = rowIndex + di;
	if (nextIndex == RowNames.Suma1 || nextIndex == RowNames.Suma2 || nextIndex == RowNames.Suma3) {
		nextIndex += di;
	}
	while (nextIndex >= 0 && nextIndex < 16 && tabela[nextIndex][colIndex]?.value != undefined) {
		nextIndex += di;
	}
	if (nextIndex >= 0 && nextIndex < 16) {
		updateTabela(nextIndex, colIndex, {
			isAvailable: true,
		});
	}
};
