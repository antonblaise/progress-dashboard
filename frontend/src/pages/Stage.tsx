// TSX file for the Stages pages

import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { dataStorage } from "../lib/dataStorage";
import { history } from "../lib/historyWriter";
import { socket } from "../lib/socket";
import "./Stage.css";
import { checklistMap } from "./Checklists";
import { useNavigate } from "react-router-dom";

// Stage() is a component
export default function Stage() {

	// Read variables 'carline' and 'stage' from routed path (/:carline/:stage) in main.tsx.
	const { carline, stage } = useParams();
	const checklist_statements = checklistMap[stage ?? ""] || [];

	const [checked, setChecked] = useState<boolean[]>(() => new Array(checklist_statements.length).fill(false));
	const [stepTimestamps, setStepTimestamps] = useState<(string | null)[]>(() => new Array(checklist_statements.length).fill(null));

	// Reset checked state and timestamps when stage or checklist_statements changes
	useEffect(() => {
		setChecked(new Array(checklist_statements.length).fill(false));
		setStepTimestamps(new Array(checklist_statements.length).fill(null));
	}, [stage, checklist_statements.length]);

	// Load latest history timestamps for each step on mount or when carline/stage changes
	useEffect(() => {
		async function loadStepTimestamps() {
			const newTimestamps: (string | null)[] = [];
			for (let i = 0; i < checklist_statements.length; i++) {
				const key = `history:${carline}:${stage}:step-${i}`;
				const historyArr = await history.getHistory(key);
				newTimestamps[i] = historyArr.length > 0 ? historyArr[0].updated_at : null;
			}
			setStepTimestamps(newTimestamps);
		}
		if (carline && stage) loadStepTimestamps();
	}, [carline, stage, checklist_statements.length]);

	const navigate = useNavigate();
	const stages = Object.keys(checklistMap);
	const currentStageIndex = stages.indexOf(stage ?? "");

	// Navigation handlers
	// Get route prefix from current path
	const routePrefix = window.location.pathname.split('/').slice(1, -2).join('/');
	const goToPrevStage = () => {
		if (currentStageIndex > 0) {
			navigate(`/${routePrefix}/${carline}/${stages[currentStageIndex - 1]}`);
		}
	};
	const goToNextStage = () => {
		if (currentStageIndex < stages.length - 1) {
			navigate(`/${routePrefix}/${carline}/${stages[currentStageIndex + 1]}`);
		}
	};

	useEffect(() => {
        if (!socket.connected) {
            console.log("Socket not connected, attempting to connect...");
            socket.connect();
        }

        // Listen for real-time updates from other clients
        const handleDataChange = ({ key, value }: { key: string, value: string | null }) => {
            console.log("Received data update:", { key, value });
            
            if (key === `stageItemChecked:${carline}-${stage}` && value !== null) {
                try {
                    const checkedState = JSON.parse(value);
                    console.log("Updating checked state:", checkedState);
                    setChecked(checkedState);
                } catch (err) {
                    console.error("Error parsing checkedState:", err);
                }
            }
        };

        console.log("Setting up Socket.IO listeners for:", `stageItemChecked:${carline}-${stage}`);
        socket.on("dataUpdate", handleDataChange);

        // Load initial state
        console.log("Loading initial state...");
        dataStorage.getData(`stageItemChecked:${carline}-${stage}`).then(value => {
            console.log("Initial state loaded:", value);
            if (value) {
                try {
                    const checkedState = JSON.parse(value);
                    console.log("Setting initial checked state:", checkedState);
                    setChecked(checkedState);
                } catch (err) {
                    console.error("Error parsing initial state:", err);
                }
            }
        });

        return () => {
            console.log("Cleaning up Socket.IO listeners");
            socket.off("dataUpdate", handleDataChange);
        };
    }, [carline, stage])

	return (
		<div>
			<div className="stage-header">
				<button
					className="stage-navigation-button"
					onClick={goToPrevStage}
					disabled={currentStageIndex <= 0}
					title="Previous stage"
				>&lt;</button>
				<h1 className="stage-title">
					{carline?.replace(/-/g, " ").toUpperCase()} - {stage?.replace(/-/g, " ").toUpperCase()}
				</h1>
				<button
					className="stage-navigation-button"
					onClick={goToNextStage}
					disabled={currentStageIndex >= stages.length - 1}
					title="Next stage"
				>&gt;</button>
			</div>

			<div className="checklist">
				{checklist_statements.map((item, index) => (
					<div key={index} className="checklist-item">
						<p className="step-timestamp">
							{stepTimestamps[index] ? stepTimestamps[index] : ""}
						</p>
						<label>
							<input
								type="checkbox"
								checked={!!checked[index]}
								title={item.text}
								onChange={async (e) => {

									const next = [...checked];
									next[index] = e.target.checked;
									setChecked(next);
									
									dataStorage.setData(`stageItemChecked:${carline}-${stage}`, JSON.stringify(next));
									const total = checklist_statements.length || 1;
									const done = next.filter(Boolean).length;
									const percentage = Math.round((done / total) * 100);
									dataStorage.setData(`stageProgress:${carline}-${stage}`, String(percentage));
									
									// Write to history
									const historyKey = `history:${carline}:${stage}:step-${index}`;
									await history.writeHistory(historyKey, String(e.target.checked));
									// Update timestamp for this step
									const historyArr = await history.getHistory(historyKey);
									const newTimestamps = [...stepTimestamps];
									newTimestamps[index] = historyArr.length > 0 ? historyArr[0].updated_at : null;
									setStepTimestamps(newTimestamps);
								}}
							/>
						</label>
						{item.url ? (
							<a
								href={item.url}
								target="blank"
								rel="noopener noreferrer"
							>
								{item.text}
							</a>
						) : (
							<span>{item.text}</span>
						)}
					</div>
				))}
			</div>

			<div className="buttons">
				{/* Done */}
				<button
					title="Done"
					className="tickall-button"
					onClick={async () => {
						const done = Array(checklist_statements.length).fill(true);
						dataStorage.setData(`stageItemChecked:${carline}-${stage}`, JSON.stringify(done));
						dataStorage.setData(`stageProgress:${carline}-${stage}`, "100");
						setChecked(done);

						// Write to history for all steps
						const newTimestamps = [...stepTimestamps];
						for (let i = 0; i < checklist_statements.length; i++) {
							const historyKey = `history:${carline}:${stage}:step-${i}`;
							await history.writeHistory(historyKey, "true");
							const historyArr = await history.getHistory(historyKey);
							newTimestamps[i] = historyArr.length > 0 ? historyArr[0].updated_at : null;
						}
						setStepTimestamps(newTimestamps);
					}}
				>Done</button>

				{/* Reset */}
				<button
					title="Reset"
					className="reset-button"
					onClick={async () => {
						const reset = new Array(checklist_statements.length).fill(false);
						dataStorage.setData(`stageItemChecked:${carline}-${stage}`, JSON.stringify(reset));
						dataStorage.setData(`stageProgress:${carline}-${stage}`, "0");
						setChecked(reset);

						// Write to history for all steps
						const newTimestamps = [...stepTimestamps];
						for (let i = 0; i < checklist_statements.length; i++) {
							const historyKey = `history:${carline}:${stage}:step-${i}`;
							await history.writeHistory(historyKey, "false");
							const historyArr = await history.getHistory(historyKey);
							newTimestamps[i] = historyArr.length > 0 ? historyArr[0].updated_at : null;
						}
						setStepTimestamps(newTimestamps);
					}}
				>Reset</button>
			</div>



		</div>
	);
}