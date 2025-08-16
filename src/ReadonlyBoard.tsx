import { use, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
	ColumnNames,
	RowNames,
	headerIcons,
	rowIcons,
	type RowName,
	type Cell,
} from "./BoardConstants";

const ReadonlyHeaderRow = () => {
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

const ReadonlyRow = ({ rowIndex, tabela }: { rowIndex: RowName; tabela: Cell[][] }) => {
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
			>
				{rowIcons[rowIndex % rowIcons.length]}
			</div>
			{Array.from({ length: 10 }).map((_, colIndex) => {
				return (
					<div
						key={rowIndex * 12 + colIndex}
						className={` border-main-500 border-1 h-full w-[calc(8*100%/106)] flex items-center justify-center text-[1.35rem] ${
							rowIndex === RowNames.Suma1 ||
							rowIndex === RowNames.Suma2 ||
							rowIndex === RowNames.Suma3
								? "bg-main-300 border-t-2 border-b-2"
								: "bg-white"
						} 
						} ${tabela[rowIndex][colIndex]?.value == 0 ? "!bg-gray-800 !border-0 text-transparent" : ""} ${
							colIndex == ColumnNames.Obavezna || colIndex == ColumnNames.Maksimalna
								? "brightness-75"
								: ""
						}`}
					>
						{tabela[rowIndex][colIndex]?.value != undefined
							? tabela[rowIndex][colIndex]?.value
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

export const ReadonlyYambBoard = ({ tabela }: { tabela: Cell[][] }) => {
	const [scale, setScale] = useState(1);

	useEffect(() => {
		const updateScale = () => {
			const width = window.innerWidth;
			setScale(width >= 600 ? 1.0 : (0.9 * width) / 600);
		};

		updateScale();
		window.addEventListener("resize", updateScale);
		return () => window.removeEventListener("resize", updateScale);
	}, []);
	return (
		<>
			<div
				className="flex aspect-[106/118] min-h-0 w-[600px] flex-col justify-self-center overflow-clip rounded-md border-4 border-solid border-main-500"
				style={{ transform: `scale(${scale * 0.9})`, transformOrigin: "top" }}
			>
				<ReadonlyHeaderRow />
				{Array.from({ length: 16 }).map((_, rowIndex) => (
					<ReadonlyRow key={rowIndex} rowIndex={rowIndex as RowName} tabela={tabela} />
				))}
			</div>
		</>
	);
};
