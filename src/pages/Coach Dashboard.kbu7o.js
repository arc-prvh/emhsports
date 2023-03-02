import { currentMember } from "wix-members";
import { openLightbox } from "wix-window";
import wixData from 'wix-data';
import wixLocation from 'wix-location';

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

	const classData = await wixData.query('Classes').find()
    const classDropdownData = classData.items.map(el => {
        return {
            label: el.parkName,
            value: el._id
        }
    })
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
