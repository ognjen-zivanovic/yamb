import { useEffect, useState, useContext } from "react";
import { DownSvg, FromMiddleSvg, FromSidesSvg, UpAndDown, UpSvg } from "./Svgs";
import { type State, StateContext } from "./App";

interface Cell {
	value?: number;
	isAvailable?: boolean;
}

export enum ColumnNames {
	OdGore = 0,
	OdDole = 1,
	Slobodna = 2,
	Najava = 3,
	Rucna = 4,
	Dirigovana = 5,
	OdSredine = 6,
	OdGoreIDole = 7,
	Obavezna = 8,
	Maksimalna = 9,
	Yamb = 10,
}

export enum RowNames {
	Jedinice = 0,
	Dvojke = 1,
	Trojke = 2,
	Cetvorke = 3,
	Petice = 4,
	Sestice = 5,
	Suma1 = 6, // nadji bolje ime
	Maksimum = 7,
	Minimum = 8,
	Suma2 = 9,
	Kenta = 10,
	Triling = 11,
	Ful = 12,
	Kare = 13,
	Yamb = 14,
	Suma3 = 15,
}

const headerIcons = [
	<DownSvg />,
	<UpSvg />,
	<UpAndDown />,
	<div className="text-[2.1rem]">N</div>,
	<div className="text-[2.1rem]">R</div>,
	<div className="text-[2.1rem]">D</div>,
	<FromMiddleSvg />,
	<FromSidesSvg />,
	<div className="text-[2.1rem]">O</div>,
	<div className="text-[2.1rem]">M</div>,
];

const rowIcons = [
	<div className="text-[1.9rem]">1</div>,
	<div className="text-[1.9rem]">2</div>,
	<div className="text-[1.9rem]">3</div>,
	<div className="text-[1.9rem]">4</div>,
	<div className="text-[1.9rem]">5</div>,
	<div className="text-[1.9rem]">6</div>,
	<div className="text-[2.1rem]">Σ</div>,
	<div className="text-[1.4rem]">MAX.</div>,
	<div className="text-[1.4rem]">MIN.</div>,
	<div className="text-[2.1rem]">Σ</div>,
	<div className="text-[1.2rem]">KENTA</div>,
	<div className="text-[1.0rem]">TRILING</div>,
	<div>FUL</div>,
	<div className="text-[1.35rem]">KARE</div>,
	<div className="text-[1.35rem]">YAMB</div>,
	<div className="text-[2.1rem]">Σ</div>,
];

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
		<div className="flex flex-row h-[calc(6*100%/118)]">
			<div className="bg-white border-blue-400 border-1 h-full w-[calc(12*100%/106)] text-center text-[1.55rem] flex items-center justify-center">
				IGRA
			</div>
			{Array.from({ length: 10 }).map((_, index) => (
				<div
					key={index}
					className={`bg-white border-blue-400 border-1 h-full w-[calc(8*100%/106)] flex items-center justify-center text-blue-800 ${
						index == ColumnNames.Obavezna || index == ColumnNames.Maksimalna
							? "brightness-75"
							: ""
					}`}
				>
					{headerIcons[index % headerIcons.length]}
				</div>
			))}
			<div className="bg-white border-blue-400 border-1 h-full w-[calc(14*100%/106)] text-[1.6rem] text-center flex items-center justify-center">
				YAMB
			</div>
		</div>
	);
};

const Row = ({
	rowIndex,
	tabela,
	updateTabela,
}: {
	rowIndex: number;
	tabela: Cell[][];
	updateTabela: (row: number, col: number, cell: Cell) => void;
}) => {
	const { state, setState } = useContext(StateContext);

	return (
		<div className="flex flex-row h-[calc(7*100%/118)]">
			<div
				className={`bg-white border-blue-400 border-1 h-full w-[calc(12*100%/106)] text-center align-middle flex items-center justify-center
				
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
						rowIndex != RowNames.Suma1 &&
						rowIndex != RowNames.Suma2 &&
						rowIndex != RowNames.Suma3
					) {
						setState({ ...state, najava: rowIndex });
					}
				}}
			>
				{rowIcons[rowIndex % rowIcons.length]}
			</div>
			{Array.from({ length: 10 }).map((_, colIndex) => {
				let isActive = tabela[rowIndex][colIndex]?.isAvailable && state.value[rowIndex] > 0;
				if (colIndex == ColumnNames.Najava && state.najava != rowIndex) isActive = false;
				if (colIndex == ColumnNames.Rucna && state.roundIndex != 1) isActive = false;
				if (colIndex == ColumnNames.Dirigovana) isActive = false; // for now
				if (state.najava != undefined && colIndex != ColumnNames.Najava) isActive = false;
				if (
					state.najava != undefined &&
					colIndex == ColumnNames.Najava &&
					rowIndex == state.najava
				)
					isActive = true;

				return (
					<div
						key={rowIndex * 12 + colIndex}
						className={` border-blue-400 border-1 h-full w-[calc(8*100%/106)] flex items-center justify-center text-[1.35rem] ${
							rowIndex === RowNames.Suma1 ||
							rowIndex === RowNames.Suma2 ||
							rowIndex === RowNames.Suma3
								? "bg-blue-300 border-t-2 border-b-2"
								: "bg-white"
						} ${isActive ? "border-2 border-green-600" : ""} ${
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
							if (!isActive) {
								return;
							}

							console.log(state.value[rowIndex]);
							updateTabela(rowIndex, colIndex, {
								value: state.value[rowIndex] == -1 ? 0 : state.value[rowIndex],
								isAvailable: false,
							});
							SetNewAvailable(tabela, updateTabela, rowIndex, colIndex);
							setState({ value: [], roundIndex: 0 });
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
				className={`border-blue-400 border-1 h-full w-[calc(14*100%/106)] text-[1.6rem] text-center ${
					rowIndex === 6 || rowIndex === 9 || rowIndex === 15
						? "bg-blue-300 border-t-2 border-b-2"
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

export const YambBoard = () => {
	const [tabela, setTabela] = useState<Cell[][]>(() => Array.from({ length: 16 }, () => []));
	const updateTabela = (row: number, col: number, value: Cell) => {
		setTabela((prev) => {
			const copy = prev.map((row) => [...row]);
			copy[row][col] = value;
			return copy;
		});
	};
	useEffect(() => {
		updateTabela(RowNames.Jedinice, ColumnNames.OdGore, {
			value: undefined,
			isAvailable: true,
		});
		updateTabela(RowNames.Yamb, ColumnNames.OdDole, { value: undefined, isAvailable: true });
		updateTabela(RowNames.Minimum, ColumnNames.OdSredine, {
			value: undefined,
			isAvailable: true,
		});
		updateTabela(RowNames.Maksimum, ColumnNames.OdSredine, {
			value: undefined,
			isAvailable: true,
		});
		updateTabela(RowNames.Jedinice, ColumnNames.OdGoreIDole, {
			value: undefined,
			isAvailable: true,
		});
		updateTabela(RowNames.Yamb, ColumnNames.OdGoreIDole, {
			value: undefined,
			isAvailable: true,
		});

		// dont hard code this shit
		for (let i = 0; i < 15; i++) {
			if (i == 6 || i == 9) continue;
			updateTabela(i, ColumnNames.Slobodna, { value: undefined, isAvailable: true });
			updateTabela(i, ColumnNames.Najava, { value: undefined, isAvailable: true });
			updateTabela(i, ColumnNames.Rucna, { value: undefined, isAvailable: true });
			updateTabela(i, ColumnNames.Dirigovana, { value: undefined, isAvailable: true });
			//updateTabela(i, ColumnNames.Obavezna, { value: undefined, isAvailable: true });
			//updateTabela(i, ColumnNames.Maksimalna, { value: undefined, isAvailable: true });
		}
	}, []);

	useEffect(() => {
		for (let colIndex = 0; colIndex < 10; colIndex++) {
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
		}

		const calculateSumOfRow = (rowName: RowNames) => {
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

	// row of 10 elements
	return (
		<div className="flex flex-col border-blue-400 border-2 border-solid rounded-md overflow-clip w-[600px] aspect-[106/118] min-h-0">
			<HeaderRow />
			{Array.from({ length: 16 }).map((_, rowIndex) => (
				<Row
					key={rowIndex}
					rowIndex={rowIndex}
					tabela={tabela}
					updateTabela={updateTabela}
				/>
			))}
		</div>
	);
};
