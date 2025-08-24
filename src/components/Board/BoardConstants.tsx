import { DownSvg, UpSvg, UpAndDown, FromMiddleSvg, FromSidesSvg } from "../../Svgs";

export interface Cell {
	value?: number;
	isAvailable?: boolean;
}
export const ColumnNames = {
	OdGore: 0,
	OdDole: 1,
	Slobodna: 2,
	Najava: 3,
	Rucna: 4,
	Dirigovana: 5,
	OdSredine: 6,
	OdGoreIDole: 7,
	Obavezna: 8,
	Maksimalna: 9,
	Yamb: 10,
} as const;

export const RowNames = {
	Jedinice: 0,
	Dvojke: 1,
	Trojke: 2,
	Cetvorke: 3,
	Petice: 4,
	Sestice: 5,
	Suma1: 6, // nadji bolje ime
	Maksimum: 7,
	Minimum: 8,
	Suma2: 9,
	Kenta: 10,
	Triling: 11,
	Ful: 12,
	Kare: 13,
	Yamb: 14,
	Suma3: 15,
} as const;
export const ReverseRowNames: Record<number, keyof typeof RowNames> = {
	0: "Jedinice",
	1: "Dvojke",
	2: "Trojke",
	3: "Cetvorke",
	4: "Petice",
	5: "Sestice",
	6: "Suma1",
	7: "Maksimum",
	8: "Minimum",
	9: "Suma2",
	10: "Kenta",
	11: "Triling",
	12: "Ful",
	13: "Kare",
	14: "Yamb",
	15: "Suma3",
};

export const ReverseColumnNames: Record<number, keyof typeof ColumnNames> = {
	0: "OdGore",
	1: "OdDole",
	2: "Slobodna",
	3: "Najava",
	4: "Rucna",
	5: "Dirigovana",
	6: "OdSredine",
	7: "OdGoreIDole",
};

export const RowNameFromString: Record<string, RowName> = {
	Jedinice: RowNames.Jedinice,
	Dvojke: RowNames.Dvojke,
	Trojke: RowNames.Trojke,
	Cetvorke: RowNames.Cetvorke,
	Petice: RowNames.Petice,
	Sestice: RowNames.Sestice,
	Suma1: RowNames.Suma1,
	Maksimum: RowNames.Maksimum,
	Minimum: RowNames.Minimum,
	Suma2: RowNames.Suma2,
	Kenta: RowNames.Kenta,
	Triling: RowNames.Triling,
	Ful: RowNames.Ful,
	Kare: RowNames.Kare,
	Yamb: RowNames.Yamb,
};

export const ColumnNameFromString: Record<string, ColumnName> = {
	OdGore: ColumnNames.OdGore,
	OdDole: ColumnNames.OdDole,
	Slobodna: ColumnNames.Slobodna,
	Najava: ColumnNames.Najava,
	Rucna: ColumnNames.Rucna,
	Dirigovana: ColumnNames.Dirigovana,
	OdSredine: ColumnNames.OdSredine,
	OdGoreIDole: ColumnNames.OdGoreIDole,
};
export type RowName = (typeof RowNames)[keyof typeof RowNames];
export type ColumnName = (typeof ColumnNames)[keyof typeof ColumnNames];
export const columnHeaders = [
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

export const rowHeaders = [
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

export const numRows = 15;
export const numColumns = 8; //10;

export const createDefaultBoard = (): Cell[][] => {
	const tabela: Cell[][] = Array.from({ length: 16 }, () => []);

	tabela[RowNames.Jedinice][ColumnNames.OdGore] = { value: undefined, isAvailable: true };
	tabela[RowNames.Yamb][ColumnNames.OdDole] = { value: undefined, isAvailable: true };
	tabela[RowNames.Minimum][ColumnNames.OdSredine] = { value: undefined, isAvailable: true };
	tabela[RowNames.Maksimum][ColumnNames.OdSredine] = { value: undefined, isAvailable: true };
	tabela[RowNames.Jedinice][ColumnNames.OdGoreIDole] = { value: undefined, isAvailable: true };
	tabela[RowNames.Yamb][ColumnNames.OdGoreIDole] = { value: undefined, isAvailable: true };

	for (let i = 0; i < numRows; i++) {
		if (i === RowNames.Suma1 || i === RowNames.Suma2) continue;
		tabela[i][ColumnNames.Slobodna] = { value: undefined, isAvailable: true };
		tabela[i][ColumnNames.Najava] = { value: undefined, isAvailable: true };
		tabela[i][ColumnNames.Rucna] = { value: undefined, isAvailable: true };
		tabela[i][ColumnNames.Dirigovana] = { value: undefined, isAvailable: true };
		// tabela[i][ColumnNames.Obavezna] = { value: undefined, isAvailable: true };
		// tabela[i][ColumnNames.Maksimalna] = { value: undefined, isAvailable: true };
	}

	return tabela;
};
