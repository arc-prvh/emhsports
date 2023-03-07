import { currentMember } from "wix-members";
import { openLightbox } from "wix-window";
import { query } from "wix-data";
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
    console.log(classDropdownData);
    $w('#classDropdown').options = classDropdownData;
});


const isAccountValid = async () => {
	const role = await currentMember.getRoles();
	console.log("ROle", role);
	if (role[0].title !== "Coach") return false;
	const member = await currentMember.getMember();
    const res = await query("Coach").eq("memberId", member._id).find()
	console.log("Member", member);    
	console.log("Coach", res.items[0]);    
	if (res.items[0].status === "Active") return true;
	else return false;
};
