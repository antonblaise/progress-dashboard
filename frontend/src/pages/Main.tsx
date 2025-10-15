import { Link } from "react-router-dom";
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
					{carlines.map((carline) => (
						<tr key={carline}>
							<td className="carline-label">{carline}</td>
							{stages.map((stage) => {
								const carlineSlug = slugify(carline);
								const stageSlug = slugify(stage.title);
								const linkTo = `/${carlineSlug}/${stageSlug}`;
								return (
									<td key={linkTo}>
										<Link to={linkTo} className="box-link" title={carline + " - " + stage.title}>
											<div className="box" />
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
