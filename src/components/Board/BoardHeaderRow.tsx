import { useContext } from "react";
import { StateContext } from "../../contexts/GameContext";
import { useNetworking } from "../../contexts/NetworkingContext";
import Globals from "../../globals";
import { columnHeaders, ColumnNames, type ColumnName } from "./BoardHelpers";

export const BoardHeaderRow = ({ textRef }: { textRef: HTMLDivElement | null }) => {
	const { gameState, setGameState } = useContext(StateContext);

	const { broadcastMessage } = useNetworking();
	return (
		<div className="h-row-6 flex flex-row">
			<div className="border-1 w-col-12 flex h-full items-center justify-center border-main-500 text-center text-[1.55rem]">
				IGRA
			</div>
			{Array.from({ length: 10 }).map((_, index) => (
				<div
					onClick={() => {
						if (gameState.blackout) {
							setGameState((prev) => {
								if (
									Globals.isSolo &&
									(index == ColumnNames.Najava || index == ColumnNames.Dirigovana)
								) {
									return prev;
								}
								prev.isExcluded[index] = !prev.isExcluded[index];
								if (
									index == ColumnNames.Dirigovana ||
									index == ColumnNames.Najava
								) {
									prev.isExcluded[ColumnNames.Dirigovana] = prev.isExcluded[
										ColumnNames.Najava
									] = prev.isExcluded[index];
								}
								broadcastMessage("exclude-columns", prev.isExcluded); //is this fine??? TODO? fix??
								return { ...prev };
							});
						} else {
							const columnInfos: Record<ColumnName, string> = {
								[ColumnNames.OdGore]:
									"Polja se popunjavaju od gore ka dole. Od jedinica do YAMB-a.",
								[ColumnNames.OdDole]:
									"Polja se popunjavaju od dole ka gore. Od YAMB-a do jedinica.",
								[ColumnNames.Slobodna]:
									"Polja se popunjavaju proizvoljnim redosledom.",
								[ColumnNames.Najava]:
									"Najava: Kolona se igra nakon prvog bacanja. Igrač najavljuje koje polje želi da popuni i ima još dva bacanja da ostvari tu kombinaciju.",
								[ColumnNames.Rucna]:
									"Ručna: Dozvoljeno je samo ako su u tom potezu sve kockice bačene istovremeno.",
								[ColumnNames.Dirigovana]:
									"Dirigovana: Igra se nakon najave prethodnog igrača. Igrač je dužan da igra za ono što je prethodni igrač najavio.",
								[ColumnNames.OdSredine]:
									"Polja se popunjavaju iz sredine: od maksimuma naviše i od minimuma naniže.",
								[ColumnNames.OdGoreIDole]:
									"Polja se popunjavaju od jedinica naniže i od YAMB-a naviše",
								[ColumnNames.Obavezna]:
									"Obavezna: Igra se na kraju, nakon svih ostalih kolona. Redosled je fiksan: od jedinica do YAMB-a.",
								[ColumnNames.Maksimalna]:
									"Maksimalna: U ovu kolonu se upisuju najbolji postignuti rezultati za svaki red.",
								[ColumnNames.Yamb]: "",
							};
							const infoText = columnInfos[index as ColumnName];
							if (textRef && infoText) {
								textRef.hidden = false;
								textRef.style.top = "450px";
								textRef.textContent = infoText;
							}
						}
					}}
					key={index}
					className={`border-main-500 border-1 h-full w-col-8 flex items-center justify-center text-foreground 
					 ${gameState.isExcluded[index] ? "brightness-75 bg-background" : ""}
					 
					`}
				>
					{columnHeaders[index % columnHeaders.length]}
				</div>
			))}
			<div className="border-1 w-col-14 flex h-full items-center justify-center border-main-500 text-center text-[1.6rem]">
				YAMB
			</div>
		</div>
	);
};
