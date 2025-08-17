const trianglePath = (
	<path d="M3,111.67,247.67,418.4c4,5.06,12.6,5.06,16.65,0L509,111.64a15.21,15.21,0,0,0,2.2-13.9,14.2,14.2,0,0,0-1-2.32,10.66,10.66,0,0,0-9.39-5.62H11.14a10.64,10.64,0,0,0-9.38,5.62,13.93,13.93,0,0,0-1,2.27A15.26,15.26,0,0,0,3,111.67Z" />
);

export const DownSvg = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 512 512"
			fill="currentcolor"
			stroke="currentcolor"
			className="h-full w-full"
		>
			<g transform="translate(64, 64) scale(0.75, 0.75)">{trianglePath}</g>
		</svg>
	);
};

export const UpSvg = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 512 512"
			fill="currentcolor"
			stroke="currentcolor"
			className="h-full w-full"
		>
			<g transform="translate(64, 64) scale(0.75, 0.75) rotate(180,256, 256)">
				{trianglePath}
			</g>
		</svg>
	);
};

export const UpAndDown = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 512 512"
		fill="currentcolor"
		stroke="currentcolor"
		className="h-full w-full"
	>
		<g transform="translate(195, 100) scale(0.6, 0.6)">{trianglePath}</g>
		<g transform="translate(5, 100) scale(0.6, 0.6) rotate(180, 256, 256)">{trianglePath}</g>
	</svg>
);

export const FromMiddleSvg = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 512 512"
		fill="currentcolor"
		stroke="currentcolor"
		className="h-full w-full"
	>
		<g transform="translate(64, 64) scale(0.75, 0.75)">
			<g transform="translate(105, 247) scale(0.6, 0.6)">{trianglePath}</g>
			<rect x="102" y="236" width="312" height="40" />
			<g transform="translate(105, -44) scale(0.6, 0.6) rotate(180, 256, 256)">
				{trianglePath}
			</g>
		</g>
	</svg>
);

export const FromSidesSvg = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 512 512"
		fill="currentcolor"
		stroke="currentcolor"
		className="h-full w-full"
	>
		<g transform="translate(64, 64) scale(0.75, 0.75)">
			<g transform="translate(105, 247) scale(0.6, 0.6) rotate(180, 256, 256)">
				{trianglePath}
			</g>
			<rect x="102" y="236" width="312" height="40" />
			<g transform="translate(105, -44) scale(0.6, 0.6)">{trianglePath}</g>
		</g>
	</svg>
);
