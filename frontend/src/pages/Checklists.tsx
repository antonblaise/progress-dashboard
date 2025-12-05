export const checklistMap: Record<string, { text: string; url: string }[]> = {
	"preparation": [
		{ text: "Obtain Teilernummern sheet from Jazz.", url: "https://jazz-1.automotive-wan.com/ccm1/web/projects/MB_MRA2_19_IMMO_DM#action=com.ibm.team.scm.browseElement&workspaceItemId=_80TQYB_hEe6eaJEYyUPY4Q&componentItemId=_xG6k0DUtEe65XtSCwHC_Uw&itemType=com.ibm.team.scm.Folder&itemId=_j6p0NZrNEe6C-_gVUTE24g" },
		{ text: "Download the latest MRA2 Castor Release checklist docx.", url: "https://jazz-1.automotive-wan.com/ccm1/web/projects/MB_MRA2_19_IMMO_DM#action=com.ibm.team.scm.browseElement&workspaceItemId=_80TQYB_hEe6eaJEYyUPY4Q&componentItemId=_xG1FQDUtEe65XtSCwHC_Uw&itemType=com.ibm.team.scm.Folder&itemId=_4JeYgpQrEe6_T4FcdGsN-g" },
		{ text: "Update Castor SW Release checklist docx based on the sheet.", url: "" },
		{ text: "Create remote branch \"release/<release_version>_mb_mra2_19_immo\" on mc_sw meta repository.", url: "" },
		{ text: "Repo init and repo sync mc_sw full repository from the branch.", url: "" },
		{ text: "Repo start mc_sw with the branch name \"release/<release_version>_mb_mra2_19_immo\" to create local branches in all mc_sw subrepos.", url: "" },
	],
	"build-binaries": [
		{ text: "Check actual ECU Extract version using ARXML visualizer. Update EcuInfoHandler.c and EcuInfoHandler_cfg.h based on the Teilernummern sheet.", url: "https://jazz-1.automotive-wan.com/ccm1/web/projects/MB_MRA2_19_IMMO_DM#action=com.ibm.team.scm.browseElement&workspaceItemId=_80TQYB_hEe6eaJEYyUPY4Q&componentItemId=_xG1FQDUtEe65XtSCwHC_Uw&itemType=com.ibm.team.scm.Folder&itemId=_isST8JBWEe6vO8QP-BF2QA" },
		{ text: "Start IDEAS. Rebuild IDEAS. Run SCCE and check for new changes.", url: "" },
		{ text: "Commit and push all changes into the release branch.", url: "" },
		{ text: "Run 'Create_Deliverables.py' script.", url: "" },
		{ text: "Backup binaries - edit and run \"Backup_env.bat\"", url: "" },
	],
	"testing": [
		{ text: "Do NVM compatibility check.", url: "" },
		{ text: "On CANoe, run CVN diagnostic command: 22 F8 06, and record the output.", url: "" },
		{ text: "Perform smoke test.", url: "" },
		{ text: "Run Top 10 tests.", url: "" },
		{ text: "If Top 10 tests are all passed, commit and push all changes in all repositories.", url: "" },
	],
	"mq-build-environment": [
		{ text: "Git clone mq-build-env, create and checkout branch with name \"release/<release_version>_mb_mra2_19_immo\" and push it.", url: "" },
		{ text: "Copy folder 'mc_sw\\Build_Env\\VU2_Delivery' into the 'mq-build-env' folder, overwriting the existing.", url: "" },
		{ text: "Add, commit and push all the changes.", url: "" },
	],
}