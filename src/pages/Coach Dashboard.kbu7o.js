import { currentMember } from "wix-members";
import { openLightbox } from "wix-window";
$w.onReady(async function () {
	const accountValid = await isAccountValid();
	console.log("Account Valid", accountValid);
	if (!accountValid) {
        $w('#mainPage').collapse();
		console.log("Opening Light box");
		openLightbox("Account Disabled");
	}else{
        $w('#mainPage').expand()
    }
});

const isAccountValid = async () => {
	const role = await currentMember.getRoles();
	console.log("ROle", role);
	if (role[0].title !== "Coach") return false;
	const member = await currentMember.getMember();
	console.log("Member", member);
	if (member.status === "Active") return true;
	else return false;
};
