import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Main.css"

// Arrays to store the carlines and stages
const carlines = [
	"T Line",
	"S Line",
	"S MOPF Line",
	"RB Line"
]

const stages = [
	{ to: "/stage1", title: "Stage 1" },
	{ to: "/stage2", title: "Stage 2" },
	{ to: "/stage3", title: "Stage 3" },
	{ to: "/stage4", title: "Stage 4" },
	{ to: "/stage5", title: "Stage 5" },
	{ to: "/stage6", title: "Stage 6" },
	{ to: "/stage7", title: "Stage 7" },
	{ to: "/stage8", title: "Stage 8" },
	{ to: "/stage9", title: "Stage 9" },
	{ to: "/stage10", title: "Stage 10" },
	{ to: "/stage11", title: "Stage 11" },
	{ to: "/stage12", title: "Stage 12" }
]

// Helper to slugify carline and stage (preserve dashes between words)
function slugify(str: string) {
	return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function Main() {

	// Live update of progress from localStorage
	// --------------------------------------------
	// 1) progress state - function 'setProgress' updates the variable 'progress'.
	const [progress, setProgress] = useState<Record<string, number>>({});

	// 2) helper to load all progress from localStorage
	const loadProgress = () => {
		const all: Record<string, number> = {};
		for (const carline of carlines) {
			for (const stage of stages) {
				all[`${slugify(carline)}-${slugify(stage.title)}`] = Number(localStorage.getItem(`progress:${`${slugify(carline)}-${slugify(stage.title)}`}`) ?? "0");
			}
		}
		setProgress(all);
	};

	// 3) on mount: load once + listen for storage changes
	// useEffect - a React hook that runs side effects in function components
	// The empty dependency array [] means this effect runs once after the initial render.
	// If [] is given variables, means it depends on the variables. It runs whenever the dependency variables change.
	useEffect(() => {
		loadProgress();

		const onStorage = (e: StorageEvent) => {

			// If event key does not start with "progress:", ignore it.
			if (!e.key?.startsWith("progress:")) return;

			// From localStorage -> progress:t-line-stage-1
			// Remove "progress:" prefix to get the slug.
			const slug = e.key.replace("progress:", "");

			// Number() means to convert any number string to a number type.
			// If the string is not a valid number, it returns NaN (Not a Number)
			const val = Number(e.newValue ?? "0");

			// Take the old progress object, 
			// update (or add) the value for the current slug key, 
			// and set it to val (or 0 if val is not a number). 
			// Then save this new object as the new progress state.
			setProgress((prev) => (
				{ 
					...prev,
					[slug]: Number.isNaN(val) ? 0 : val 
				}
			));
		};

		// Start listening for storage change events.
		window.addEventListener("storage", onStorage);

		// Clean up the listener if you leave this page.
		return () => window.removeEventListener("storage", onStorage);

	}, []);

	return (
		<div className="main-container">
			<table className="main-table">
				<thead>
					<tr>
						<th className="carline-label"></th>
						{stages.map((stage) => (
							<th key={stage.title} className="stage-label">{stage.title}</th>
						))}
					</tr>
				</thead>
				<tbody>

					{/* Outer loop (table row): Carlines */}
					{carlines.map((carline) => (

						<tr key={carline}>
							<td className="carline-label">{carline}</td>

							{/* Inner loop (Table data - column): Stages */}
							{stages.map((stage) => {

								const carlineSlug = slugify(carline);
								const stageSlug = slugify(stage.title);
								const linkTo = `/${carlineSlug}/${stageSlug}`;

								const progress_percentage = Number(localStorage.getItem(`progress:${carlineSlug}-${stageSlug}`) ?? 0);

								return (
									<td key={linkTo}>
										<Link to={linkTo} className="box-link" title={carline + " - " + stage.title}>
											<div className="box">
												<div className="box-fill" style={ {width: `${progress_percentage}%`} } />
											</div>
										</Link>
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
