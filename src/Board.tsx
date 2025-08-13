import { useEffect, useState, useContext, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
	ColumnNames,
	RowNames,
	headerIcons,
	rowIcons,
	type RowName,
	type Cell,
} from "./BoardConstants";
import { StateContext, type State } from "./App";
import { useNetworking } from "./NetworkingContext";

const SetNewAvailable = (
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
		let nextIndex = rowIndex + 1;
		if (nextIndex < 16) {
			if (
				nextIndex == RowNames.Suma1 ||
				nextIndex == RowNames.Suma2 ||
				nextIndex == RowNames.Suma3
			) {
				nextIndex++;
			}
			if (tabela[nextIndex][colIndex]?.value == undefined) {
				updateTabela(nextIndex, colIndex, {
					isAvailable: true,
				});
			}
		}
	}
	if (
		colIndex == ColumnNames.OdDole ||
		colIndex == ColumnNames.OdGoreIDole ||
		colIndex == ColumnNames.OdSredine
	) {
		let nextIndex = rowIndex - 1;
		if (nextIndex >= 0) {
			if (
				nextIndex == RowNames.Suma1 ||
				nextIndex == RowNames.Suma2 ||
				nextIndex == RowNames.Suma3
			) {
				nextIndex--;
			}
			if (tabela[nextIndex][colIndex]?.value == undefined) {
				updateTabela(nextIndex, colIndex, {
					isAvailable: true,
				});
			}
		}
	}
};

const HeaderRow = () => {
	return (
		<div className="flex h-[calc(6*100%/118)] flex-row">
			<div className="border-1 flex h-full w-[calc(12*100%/106)] items-center justify-center border-main-500 bg-white text-center text-[1.55rem]">
				IGRA
			</div>
			{Array.from({ length: 10 }).map((_, index) => (
				<div
					key={index}
					className={`bg-white border-main-500 border-1 h-full w-[calc(8*100%/106)] flex items-center justify-center text-main-900 ${
						index == ColumnNames.Obavezna || index == ColumnNames.Maksimalna
							? "brightness-75"
							: ""
					}`}
				>
					{headerIcons[index % headerIcons.length]}
				</div>
			))}
			<div className="border-1 flex h-full w-[calc(14*100%/106)] items-center justify-center border-main-500 bg-white text-center text-[1.6rem]">
				YAMB
			</div>
		</div>
	);
};

const Row = ({
	rowIndex,
	tabela,
	updateTabela,
	sendMessageToNextPlayer,
	broadcastMessage,
}: {
	rowIndex: RowName;
	tabela: Cell[][];
	updateTabela: (row: number, col: number, cell: Cell) => void;
	sendMessageToNextPlayer: (message: string, data: any) => void;
	broadcastMessage: (type: string, data: any) => void;
}) => {
	const { state, setState } = useContext(StateContext);

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
						state.roundIndex == 1 &&
						state.najava == undefined &&
						state.dirigovana == undefined &&
						rowIndex != RowNames.Suma1 &&
						rowIndex != RowNames.Suma2 &&
						rowIndex != RowNames.Suma3
					) {
						setState((prev) => ({ ...prev, najava: rowIndex }));
						sendMessageToNextPlayer("najava", rowIndex);
					}
				}}
			>
				{rowIcons[rowIndex % rowIcons.length]}
			</div>
			{Array.from({ length: 10 }).map((_, colIndex) => {
				let isActive = isCellActive(tabela, rowIndex, colIndex, state);

				return (
					<div
						key={rowIndex * 12 + colIndex}
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
							(isActive && state.value[rowIndex] == -1)
								? "!bg-gray-800 !border-0 text-transparent"
								: ""
						} ${
							colIndex == ColumnNames.Obavezna || colIndex == ColumnNames.Maksimalna
								? "brightness-75"
								: ""
						}`}
						onClick={() => {
							if (
								rowIndex == RowNames.Suma1 ||
								rowIndex == RowNames.Suma2 ||
								rowIndex == RowNames.Suma3
							) {
								return;
							}
							if (!state.blackout && !isActive) {
								return;
							}
							let newValue = state.value[rowIndex] == -1 ? 0 : state.value[rowIndex];
							updateTabela(rowIndex, colIndex, {
								value: newValue,
								isAvailable: false,
							});
							SetNewAvailable(tabela, updateTabela, rowIndex, colIndex);
							setState({ value: [], roundIndex: 0, isMyMove: true });
							sendMessageToNextPlayer("next-player", {});
							broadcastMessage("move", { rowIndex, colIndex, value: newValue });
						}}
					>
						{tabela[rowIndex][colIndex]?.value != undefined
							? tabela[rowIndex][colIndex]?.value
							: isActive
							? state.value[rowIndex]
							: ""}
					</div>
				);
			})}
			<div
				className={`border-main-500 border-1 h-full w-[calc(14*100%/106)] text-[1.6rem] text-center ${
					rowIndex === 6 || rowIndex === 9 || rowIndex === 15
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

export const YambBoard = ({
	tabela,
	updateTabela,
}: {
	tabela: Cell[][];
	updateTabela: (row: number, col: number, cell: Cell) => void;
}) => {
	const { sendMessageToNextPlayer, broadcastMessage } = useNetworking();

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
				<HeaderRow />
				{Array.from({ length: 16 }).map((_, rowIndex) => (
					<Row
						key={rowIndex}
						rowIndex={rowIndex as RowName}
						tabela={tabela}
						updateTabela={updateTabela}
						sendMessageToNextPlayer={sendMessageToNextPlayer}
						broadcastMessage={broadcastMessage}
					/>
				))}
			</div>
		</>
	);
};

export function isCellActive(tabela: Cell[][], rowIndex: number, colIndex: number, state: State) {
	let isActive = tabela[rowIndex][colIndex]?.isAvailable && state.value[rowIndex] > 0;
	if (colIndex == ColumnNames.Najava && state.najava != rowIndex) isActive = false;
	if (colIndex == ColumnNames.Dirigovana && state.dirigovana != rowIndex) isActive = false;
	if (colIndex == ColumnNames.Rucna && state.roundIndex != 1) isActive = false;
	if (state.najava != undefined && colIndex != ColumnNames.Najava) isActive = false;
	if (state.dirigovana != undefined && colIndex != ColumnNames.Dirigovana) isActive = false;
	if (state.najava != undefined && colIndex == ColumnNames.Najava && rowIndex == state.najava)
		isActive = true;
	if (
		state.dirigovana != undefined &&
		colIndex == ColumnNames.Dirigovana &&
		rowIndex == state.dirigovana
	)
		isActive = true;
	return isActive;
}
