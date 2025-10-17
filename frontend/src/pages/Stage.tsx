// TSX file for the Stages pages

import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { dataStorage } from "../utils/dataStorage";
import "./Stage.css";

const checklist_statements = [
	{ text: "Example Checklist Item 1 - Google", url: "https://www.google.com" },
	{ text: "Example Checklist Item 2 - Facebook", url: "https://www.facebook.com" },
	{ text: "Example Checklist Item 3 - Wikipedia", url: "https://www.wikipedia.com" },
	{ text: "Example Checklist Item 4 - YouTube", url: "https://www.youtube.com" }
]

// Stage() is a component
export default function Stage() {

	// Read variables 'carline' and 'stage' from routed path (/:carline/:stage) in main.tsx.
	const { carline, stage } = useParams();

	// slug example: t-line-stage-1. Standard across tsx files.
	const slug = `${carline}-${stage}`;

	const [checked, setChecked] = useState<boolean[]>(
		() => new Array(checklist_statements.length).fill(false)
	);

	useEffect(() => {

		(async () => {

			// Mechanism to prevent the checked boxes from being cleared upon page refresh, by reflecting what's saved in the memory.
			// Read saved data of 'checked'
			const saved_checked_raw = await dataStorage.get(`stageItemChecked:${slug}`);
			if (!saved_checked_raw) return;
	
			try {
				const saved_checked: boolean[] = JSON.parse(saved_checked_raw);
	
				// Match its length with checklist_statements' length to prevent error.
				// Double (!) means to force convert it into boolean. Although in our case, it should already be boolean.
				const normalised_checked = checklist_statements.map((_, i) => !!saved_checked[i]);
				setChecked(normalised_checked);
	
			} catch {
				// If data is corrupted, ignore and keep defaults.
			}

		})();

	}, [slug])

	return (
		<div>
			<h1>
				{carline?.replace("-", " ").toUpperCase()} - {stage?.replace("-", " ").toUpperCase()}
			</h1>

			<div className="checklist">
				
					{checklist_statements.map( (item, index) => (

						<div key={index} className="checklist-item">

							<label>
								<input 
									type="checkbox"
									checked={!!checked[index]}
									title={item.text}

									onChange={(e) => {

										const next = [...checked];
										next[index] = e.target.checked;
										setChecked(next);

										dataStorage.set(`stageItemChecked:${carline}-${stage}`, JSON.stringify(next));

										const total = checklist_statements.length || 1;
										const done = next.filter(Boolean).length;
										const percentage = Math.round( (done / total) * 100 );

										dataStorage.set(`stageProgress:${carline}-${stage}`, String(percentage))

										// TEMP: keep localStorage writes to trigger Main’s onStorage listener
										localStorage.setItem(`stageItemChecked:${carline}-${stage}`, JSON.stringify(next));
										localStorage.setItem(`stageProgress:${carline}-${stage}`, String(percentage))

									}}
								/>
							</label>

							<a
								href={item.url}
								target="blank"
								rel="noopener noreferrer"
							>
								{item.text}
							</a>

						</div>

					))}

			</div>

			<div className="buttons">
				{/* Done */}
				<button
					title="Done"
					className="tickall-button"
					onClick={() => {
						const done = Array(checklist_statements.length).fill(true);
						dataStorage.set(`stageItemChecked:${carline}-${stage}`, JSON.stringify(done));
						dataStorage.set(`stageProgress:${carline}-${stage}`, "100");
						localStorage.setItem(`stageItemChecked:${carline}-${stage}`, JSON.stringify(done));
						localStorage.setItem(`stageProgress:${carline}-${stage}`, "100");

						// Reload page
						window.location.reload();
					}}
				>Done</button>

				{/* Reset */}
				<button
					title="Reset"
					className="reset-button"
					onClick={() => {
						const reset = new Array(checklist_statements.length).fill(false);
						dataStorage.set(`stageItemChecked:${carline}-${stage}`, JSON.stringify(reset));
						dataStorage.set(`stageProgress:${carline}-${stage}`, "0");
						localStorage.setItem(`stageItemChecked:${carline}-${stage}`, JSON.stringify(reset));
						localStorage.setItem(`stageProgress:${carline}-${stage}`, "0");

						// reload page
						window.location.reload();
					}}
				>Reset</button>
			</div>



		</div>
	);
}