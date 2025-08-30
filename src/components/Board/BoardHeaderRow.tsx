import { columnHeaders, ColumnNames } from "./BoardHelpers";

export const BoardHeaderRow = () => {
	return (
		<div className="h-row-6 flex flex-row">
			<div className="border-1 w-col-12 flex h-full items-center justify-center border-main-500 text-center text-[1.55rem]">
				IGRA
			</div>
			{Array.from({ length: 10 }).map((_, index) => (
				<div
					key={index}
					className={`border-main-500 border-1 h-full w-col-8 flex items-center justify-center text-foreground ${
						index == ColumnNames.Obavezna || index == ColumnNames.Maksimalna
							? "brightness-75 bg-background"
							: ""
					}`}
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
