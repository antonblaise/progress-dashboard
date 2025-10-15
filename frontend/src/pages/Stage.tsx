// TSX file for the Stages pages

import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Stage.css";

const checklist_statements = [
	{ text: "Example Checklist Item 1 - Google", url: "https://www.google.com" },
	{ text: "Example Checklist Item 2 - Facebook", url: "https://www.facebook.com" },
	{ text: "Example Checklist Item 3 - Wikipedia", url: "https://www.wikipedia.com" },
	{ text: "Example Checklist Item 4 - YouTube", url: "https://www.youtube.com" }
]

export default function Stage() {
	const { carline, stage } = useParams();
	const slug = `${carline}-${stage}`;

	const [checked, setChecked] = useState<boolean[]>(
		() => new Array(checklist_statements.length).fill(false)
	);

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
									checked={checked[index]}
									onChange={(e) => {
										const next = [...checked];
										next[index] = e.target.checked;
										setChecked(next);
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



		</div>
	);
}