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
	if (gameState.isExcluded[colIndex] == true) {
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
		isExcluded: gameState.isExcluded,
	});
	sendMessageToNextPlayer("next-player", {});
	broadcastMessage("move", { rowIndex, colIndex, value: newValue });

	if (colIndex == ColumnNames.Obavezna) {
		let maxi = -1;
		for (let i = 0; i < 9; i++) {
			let val = tabela[rowIndex][i]?.value;
			if (!val) {
				continue;
			}
			if (val > maxi) {
				maxi = val;
			}
		}
		updateTabela(rowIndex, ColumnNames.Maksimalna, {
			value: maxi,
			isAvailable: false,
		});
	}
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
		colIndex == ColumnNames.OdSredine ||
		colIndex == ColumnNames.Obavezna
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

	let allDone = true;
	for (let rowIndex = 0; rowIndex < 16; rowIndex++) {
		for (let colIndex = 0; colIndex < 8; colIndex++) {
			if (tabela[rowIndex][colIndex]?.value == undefined) {
				allDone = false;
				break;
			}
		}
		if (!allDone) {
			break;
		}
	}
	if (
		allDone &&
		tabela[RowNames.Jedinice][ColumnNames.Obavezna]?.value == undefined &&
		colIndex != ColumnNames.Obavezna
	) {
		updateTabela(RowNames.Jedinice, ColumnNames.Obavezna, {
			value: undefined,
			isAvailable: true,
		});
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
