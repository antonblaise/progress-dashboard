import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Main.css"

// Arrays to store the carlines and stages
const carlines = [
	"T Line",
	"S Line",
	"S MOPF Line",
	"RB Line"
];

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
];

// Create a storage variable to store all data, which will eventually be sent to the backend.
const dataStorage = {

	get(key: string): string | null {
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	},

	set(key: string, value: string): void {
		try {
			localStorage.setItem(key, value);
		} catch {
			// Ignore write errors
		}
	},

	remove(key: string): void {
		try {
			localStorage.removeItem(key);
		} catch {
			// Ignore remove errors	
		}
	},

};

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
	const [_, setProgress] = useState({});

	// 2. helper to load all progress from dataStorage
	// Number() means to convert any number string to a number type.
	// If the string is not a valid number, it returns NaN (Not a Number)
	const loadProgress = () => {
		const allProgress: Record<string, number> = {};
		for (const carline of carlines) {
			for (const stage of stages) {
				allProgress[`${slugify(carline)}-${slugify(stage.title)}`] = Number(dataStorage.get(`progress:${`${slugify(carline)}-${slugify(stage.title)}`}`) ?? "0");
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
	const loadSWReleaseAndIntegratorNames = () => {

		const temp_swReleaseNames: Record<string, string> = {};
		const temp_integratorNames: Record<string, string> = {};

		for (const carline of carlines) {

			// Load them from dataStorage
			const swReleaseName = dataStorage.get(`swReleaseName:${slugify(carline)}`) ?? "";
			const integratorName = dataStorage.get(`integratorName:${slugify(carline)}`) ?? "";

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

		loadProgress();
		loadSWReleaseAndIntegratorNames();

		// Whenever there is a change in dataStorage from other tabs/windows...
		const onStorage = (e: StorageEvent) => {

			// If event key does not start with "swReleaseName:" or "integratorName:", ignore it.
			if (!e.key?.startsWith("progress:") && !e.key?.startsWith("swReleaseName:") && !e.key?.startsWith("integratorName:")) return;

			// Examples:
			// From dataStorage -> progress:t-line-stage-1, carlineAndStageSlug = t-line-stage-1
			// From dataStorage -> swReleaseName:t-line, carlineSlug = t-line
			// From dataStorage -> integratorName:s-line, carlineSlug = s-line
			const carlineAndStageSlug = e.key.replace(`progress:`, "");
			const keyType = e.key.startsWith("swReleaseName:") ? "swReleaseName" : "integratorName";
			const carlineSlug = e.key.replace(`${keyType}:`, "");

			// Set the appropriate state variable based on the key of the event.
			if (e.key?.startsWith("progress:")) {
				const carlineAndStageProgressVal = Number(e.newValue ?? "0");
				setProgress((prev) => (
					{
						...prev,
						[carlineAndStageSlug]: Number.isNaN(carlineAndStageProgressVal) ? 0 : carlineAndStageProgressVal
					}
				));
			} else if (keyType === "swReleaseName") {
				setSwReleaseNames((prev) => ({
					...prev,
					[carlineSlug]: e.newValue ?? ""
				}));
			} else if (keyType === "integratorName") {
				setIntegratorNames((prev) => ({
					...prev,
					[carlineSlug]: e.newValue ?? ""
				}));
			}  
		};

		// Listen to storage events.
		window.addEventListener("storage", onStorage);

		// Stop listening on exit.
		return () => window.removeEventListener("storage", onStorage);

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
											dataStorage.set(`swReleaseName:${slugify(carline)}`, value); // save instantly
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
											dataStorage.set(`integratorName:${slugify(carline)}`, value); // save instantly
										}}
									/>
								</label>
							</td>

							{/* ================================ Inner loop: The rest of the columns - Stages ================================ */}
							{stages.map((stage) => {

								const carlineSlug = slugify(carline);
								const stageSlug = slugify(stage.title);
								const linkTo = `/checklist/${carlineSlug}/${stageSlug}`;

								const progress_percentage = Number(dataStorage.get(`progress:${carlineSlug}-${stageSlug}`) ?? 0);

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
										onClick={() => {

											// Prompt for confirmation
											if (!window.confirm(`Are you sure you want to reset all progress for ${carline}? This action cannot be undone.`)) {
												return;
											}

											// Clear all progress for this carline
											for (const stage of stages) {
												dataStorage.remove(`progress:${slugify(carline)}-${slugify(stage.title)}`);
												dataStorage.remove(`checked:${slugify(carline)}-${slugify(stage.title)}`);
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
