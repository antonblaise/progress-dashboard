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
	{ to: "/stage5", title: "Stage 5" }
]

export default function Main() {
	return (
		<div className="main-container">
			{stages.map(stage => (
				<Link to={stage.to} className="box-link" title={stage.title}>
					<div className="box" />
				</Link>
			))}
		</div>
	);
}
