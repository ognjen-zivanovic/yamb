import { type Dispatch, type SetStateAction, createContext } from "react";
import type { PeerData } from "../App";
import type { RowName, Cell } from "../components/Board/BoardConstants";

export interface GameState {
	roundIndex: number;
	value: number[];
	najava?: RowName;
	dirigovana?: RowName;
	isMyMove: boolean;
	blackout?: boolean;
}

export interface TabelaState {
	tabela: Cell[][];
	setTabela: Dispatch<SetStateAction<Cell[][]>>;
	updateTabela: (row: number, col: number, cell: Cell) => void;
}

export interface PeerDataState {
	peerData: PeerData[];
	setPeerData: Dispatch<SetStateAction<PeerData[]>>;
}

export const StateContext = createContext<{
	gameState: GameState;
	setGameState: Dispatch<SetStateAction<GameState>>;
}>({
	gameState: {} as GameState,
	setGameState: () => {},
});

export const TabelaContext = createContext<TabelaState>({
	tabela: [] as Cell[][],
	setTabela: () => {},
	updateTabela: () => {},
});

export const PeerDataContext = createContext<PeerDataState>({
	peerData: [] as PeerData[],
	setPeerData: () => {},
});
