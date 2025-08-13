import { DownSvg, FromMiddleSvg, FromSidesSvg, UpAndDown, UpSvg } from "./Svgs";

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

export const ReverseRowNames = {
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

export const ReverseColumnNames = {
	0: "OdGore",
	1: "OdDole",
	2: "Slobodna",
	3: "Najava",
	4: "Rucna",
	5: "Dirigovana",
	6: "OdSredine",
	7: "OdGoreIDole",
};

export type RowName = (typeof RowNames)[keyof typeof RowNames];

export const headerIcons = [
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

export const rowIcons = [
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

export const defaultTabela = (): Cell[][] => {
	const tabela: Cell[][] = Array.from({ length: 16 }, () => []);

	tabela[RowNames.Jedinice][ColumnNames.OdGore] = { value: undefined, isAvailable: true };
	tabela[RowNames.Yamb][ColumnNames.OdDole] = { value: undefined, isAvailable: true };
	tabela[RowNames.Minimum][ColumnNames.OdSredine] = { value: undefined, isAvailable: true };
	tabela[RowNames.Maksimum][ColumnNames.OdSredine] = { value: undefined, isAvailable: true };
	tabela[RowNames.Jedinice][ColumnNames.OdGoreIDole] = { value: undefined, isAvailable: true };
	tabela[RowNames.Yamb][ColumnNames.OdGoreIDole] = { value: undefined, isAvailable: true };

	for (let i = 0; i < 15; i++) {
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
