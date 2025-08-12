import { DownSvg, FromMiddleSvg, FromSidesSvg, UpAndDown, UpSvg } from "./Svgs";

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


