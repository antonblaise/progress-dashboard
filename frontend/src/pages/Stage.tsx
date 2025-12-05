// TSX file for the Stages pages

import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { dataStorage } from "../lib/dataStorage";
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

	// Reset checked state when stage or checklist_statements changes
	useEffect(() => {
		setChecked(new Array(checklist_statements.length).fill(false));
	}, [stage, checklist_statements.length]);

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
        dataStorage.get(`stageItemChecked:${carline}-${stage}`).then(value => {
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

										dataStorage.set(`stageProgress:${carline}-${stage}`, String(percentage));
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
					onClick={() => {
						const done = Array(checklist_statements.length).fill(true);
						dataStorage.set(`stageItemChecked:${carline}-${stage}`, JSON.stringify(done));
						dataStorage.set(`stageProgress:${carline}-${stage}`, "100");
						setChecked(done);
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
						setChecked(reset);
					}}
				>Reset</button>
			</div>



		</div>
	);
}