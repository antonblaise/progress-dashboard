// TSX file for the Main page

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { dataStorage } from "../lib/dataStorage";
import { socket } from "../lib/socket";
import "./Main.css";
import { checklistMap } from "./Checklists";

// Arrays to store the carlines and stages
const carlines = [
	"T Line",
	"S Line",
	"S MOPF Line",
	"RB Line"
];

const stages = Object.keys(checklistMap).map(key => ({
	to: `/${key}`,
	title: `Stage ${key.replace(/[^0-9]/g, "") || key}` // or customize as needed
}));

// Helper to slugify carline and stage (preserve dashes between words)
function slugify(str: string) {
	return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function Main() {

	// ################################## //
	// Read the progress from dataStorage //
	// ################################### //

	// 1. progress state - function 'setProgress' updates the variable 'progress', which is replaced by '_' here, as we don't need it.
	// The output of useState is an array where:
	// 		the first element is the current state value, 
	// 		and the second element is a function to update that state.
	// In this case, we only need to create/declare/define the 2nd element - the function,
	// whereby whenever it's called, the page re-renders. (Not refresh, not reload)
	const [progress, setProgress] = useState<Record<string, number>>({});

	// 2. helper to load all progress from dataStorage
	// Number() means to convert any number string to a number type.
	// If the string is not a valid number, it returns NaN (Not a Number)
	const loadProgress = async () => {
		const allProgress: Record<string, number> = {};
		for (const carline of carlines) {
			for (const stage of stages) {
				const raw = await dataStorage.get(`stageProgress:${slugify(carline)}-${slugify(stage.title)}`);
				const val = Number(raw ?? "0");
				allProgress[`${slugify(carline)}-${slugify(stage.title)}`] = Number.isFinite(val) ? val : 0;
			}
		}
		setProgress(allProgress);
	};

	// ############################################################################################ //
	// Read and write the SW Release Name and Integrator Name from and to dataStorage in real time	//
	// ############################################################################################ //

	// 1. Declare state variables for SW Release Names and Integrator Names, with functions to update them.
	// The output of useState is an array where the first element is the current state value, and the second element is a function to update that state.
	// Record<string, string> means an object with string keys and string values.
	const [swReleaseNames, setSwReleaseNames] = useState<Record<string, string>>({});
	const [integratorNames, setIntegratorNames] = useState<Record<string, string>>({});

	// 2. Create a function to load them from dataStorage.
	const loadSWReleaseAndIntegratorNames = async () => {

		const temp_swReleaseNames: Record<string, string> = {};
		const temp_integratorNames: Record<string, string> = {};

		for (const carline of carlines) {

			// Load them from dataStorage
			const swReleaseName = await (dataStorage.get(`swReleaseName:${slugify(carline)}`)) ?? "";
			const integratorName = await (dataStorage.get(`integratorName:${slugify(carline)}`)) ?? "";

			// Update the state variables
			// This is to ensure the input boxes show the latest values from dataStorage.
			temp_swReleaseNames[slugify(carline)] = swReleaseName;
			temp_integratorNames[slugify(carline)] = integratorName;
		}

		setSwReleaseNames(temp_swReleaseNames);
		setIntegratorNames(temp_integratorNames);

	}

	// #############################################################################################//
	// Call the load function on mount. Also, listen to and load any live changes from dataStorage.	//
	// #############################################################################################//

	// Mount means when the component is first rendered. 
	// Rendered means converted from tsx to html. Render does not mean refresh/reload the page.
	useEffect(() => {
		// Initial data load
		(async () => {
			await loadProgress();
			await loadSWReleaseAndIntegratorNames();
		})();

		// Listen for real-time updates from other clients
		socket.on("dataChange", ({ key, value }) => {
			if (key.startsWith("stageProgress:")) {
				const slug = key.replace("stageProgress:", "");
				const progressValue = Number(value) || 0;
				setProgress(prev => ({
					...prev,
					[slug]: progressValue
				}));
			} else if (key.startsWith("swReleaseName:")) {
				const slug = key.replace("swReleaseName:", "");
				setSwReleaseNames(prev => ({
					...prev,
					[slug]: value || ""
				}));
			} else if (key.startsWith("integratorName:")) {
				const slug = key.replace("integratorName:", "");
				setIntegratorNames(prev => ({
					...prev,
					[slug]: value || ""
				}));
			}
		});

		// Cleanup listener when component unmounts
		return () => {
			socket.off("dataChange");
		};
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
										onChange={async (e) => {
											const value = e.target.value;
											// Update local state
											setSwReleaseNames((prev) => ({
												...prev,
												[slugify(carline)]: value,
											}));
											// Send to server immediately
											await dataStorage.set(`swReleaseName:${slugify(carline)}`, value);
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
										onChange={async (e) => {
											const value = e.target.value;
											// Update local state
											setIntegratorNames((prev) => ({
												...prev,
												[slugify(carline)]: value,
											}));
											// Send to server immediately
											await dataStorage.set(`integratorName:${slugify(carline)}`, value);
										}}
									/>
								</label>
							</td>

							{/* ================================ Inner loop: The rest of the columns - Stages ================================ */}
							{stages.map((stage) => {

								const carlineSlug = slugify(carline);
								const stageSlug = slugify(stage.title);
								const linkTo = `/checklist/${carlineSlug}/${stageSlug}`;

								const progress_percentage = progress[`${carlineSlug}-${stageSlug}`];

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
						
							{/* Final column - Reset buttons */}
							<td>
								<div className="reset-buttons-column">
									<button
										title="Reset Buttons"
										onClick={async () => {

											// Prompt for confirmation
											if (!window.confirm(`Are you sure you want to reset all progress for ${carline}? This action cannot be undone.`)) {
												return;
											}

											// Clear all progress for this carline
											for (const stage of stages) {
												await dataStorage.remove(`stageProgress:${slugify(carline)}-${slugify(stage.title)}`);
												await dataStorage.remove(`stageItemChecked:${slugify(carline)}-${slugify(stage.title)}`);
											}

											// Reload page
											window.location.reload();
										}}
									>Reset</button>
								</div>
							</td>
						
						</tr>

					))}
					{/* ======================================================================================================== */}
				</tbody>

			</table>
		</div>
	);
}
