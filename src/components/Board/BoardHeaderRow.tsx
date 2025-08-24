import { columnHeaders, ColumnNames } from "./BoardConstants";

export const BoardHeaderRow = () => {
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
					{columnHeaders[index % columnHeaders.length]}
				</div>
			))}
			<div className="border-1 flex h-full w-[calc(14*100%/106)] items-center justify-center border-main-500 bg-white text-center text-[1.6rem]">
				YAMB
			</div>
		</div>
	);
};
