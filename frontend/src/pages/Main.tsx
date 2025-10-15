import { Link } from "react-router-dom";
import { use, useEffect, useState } from "react";
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

	// ################################################ //
	// Read the progress from localStorage in real time	//
	// ################################################ //

	// 1. progress state - function 'setProgress' updates the variable 'progress'.
	// The output of useState is an array where the first element is the current state value, and the second element is a function to update that state.
	// Record<string, number> means an object with string keys and number values.
	const [progress, setProgress] = useState<Record<string, number>>({});

	// 2. helper to load all progress from localStorage
	// Number() means to convert any number string to a number type.
	// If the string is not a valid number, it returns NaN (Not a Number)
	const loadProgress = () => {
		const all: Record<string, number> = {};
		for (const carline of carlines) {
			for (const stage of stages) {
				all[`${slugify(carline)}-${slugify(stage.title)}`] = Number(localStorage.getItem(`progress:${`${slugify(carline)}-${slugify(stage.title)}`}`) ?? "0");
			}
		}
		setProgress(all);
	};

	// 3. on mount: load once + listen for storage changes
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


	// ############################################################################################ //
	// Read and write the SW Release Name and Integrator Name from and to localStorage in real time	//
	// ############################################################################################ //

	// 1. Declare state variables for SW Release Names and Integrator Names, with functions to update them.
	// The output of useState is an array where the first element is the current state value, and the second element is a function to update that state.
	// Record<string, string> means an object with string keys and string values.
	const [swReleaseNames, setSwReleaseNames] = useState<Record<string, string>>({});
	const [integratorNames, setIntegratorNames] = useState<Record<string, string>>({});

	// 2. Create a function to load them from localStorage.
	const loadSWReleaseAndIntegratorNames = () => {

		const temp_swReleaseNames: Record<string, string> = {};
		const temp_integratorNames: Record<string, string> = {};

		for (const carline of carlines) {
			// Load them from localStorage
			const swReleaseName = localStorage.getItem(`swReleaseName:${slugify(carline)}`) ?? "";
			const integratorName = localStorage.getItem(`integratorName:${slugify(carline)}`) ?? "";

			// Update the state variables
			// This is to ensure the input boxes show the latest values from localStorage.
			temp_swReleaseNames[slugify(carline)] = swReleaseName;
			temp_integratorNames[slugify(carline)] = integratorName;
		}

		setSwReleaseNames(temp_swReleaseNames);
		setIntegratorNames(temp_integratorNames);

	}

	// 3. Call the load function on mount.
	// Mount means when the component is first rendered. 
	// Rendered means converted from tsx to html.
	useEffect(() => {
		loadSWReleaseAndIntegratorNames();
	}, []);


	// ################################################ //
	// Render the table with carlines and stages		//
	// ################################################ //
	return (
		<div className="main-container">
			<table className="main-table">

				<thead>
					<tr>
						<th className="carline-header" aria-hidden="true"></th>
						<th className="sw-release-name-header">Release Name</th>
						<th className="integrator-name-header">Integrator</th>

						{stages.map((stage) => (
							<th key={stage.title} className="stage-label">{stage.title}</th>
						))}
					</tr>
				</thead>

				<tbody>

					{/* ================================ Outer loop (table row): Carlines ================================ */}
					{carlines.map((carline) => (

						<tr key={carline}>

							{/* 1st column of table data - Carlines */}
							<td className="carlines">{carline}</td>

							{/* 2nd column of table data - SW Release names */}
							<td>
								<label>
									<input
										title="SW Release Name"
										type="text"
										className="sw-release-name"
										placeholder="Click to enter"
										value={swReleaseNames[slugify(carline)] ?? ""} // show saved value
										onChange={(e) => {
											const value = e.target.value;
											setSwReleaseNames((prev) => ({
												...prev,
												[slugify(carline)]: value,
											}));
											localStorage.setItem(`swReleaseName:${slugify(carline)}`, value); // save instantly
										}}
									/>
								</label>
							</td>

							{/* 3rd column of table data - Integrator names */}
							<td>
								<label>
									<input
										title="Integrator"
										type="text"
										className="integrator-name"
										placeholder="Click to enter"
										value={integratorNames[slugify(carline)] ?? ""} // show saved value
										onChange={(e) => {
											const value = e.target.value;
											setIntegratorNames((prev) => ({
												...prev,
												[slugify(carline)]: value,
											}));
											localStorage.setItem(`integratorName:${slugify(carline)}`, value); // save instantly
										}}
									/>
								</label>
							</td>

							{/* ================================ Inner loop: The rest of the columns - Stages ================================ */}
							{stages.map((stage) => {

								const carlineSlug = slugify(carline);
								const stageSlug = slugify(stage.title);
								const linkTo = `/checklist/${carlineSlug}/${stageSlug}`;

								const progress_percentage = Number(localStorage.getItem(`progress:${carlineSlug}-${stageSlug}`) ?? 0);

								return (
									<td key={linkTo}>
										<Link to={linkTo} className="box-link" title={carline + " - " + stage.title}>
											<div className="box">
												<div className="box-fill" style={{ width: `${progress_percentage}%` }} />
												<span className="box-progress-text">{progress_percentage}%</span>
											</div>
										</Link>
									</td>
								);
							})}
							{/* ======================================================================================================== */}
						</tr>

					))}
					{/* ======================================================================================================== */}
				</tbody>

			</table>
		</div>
	);
}
