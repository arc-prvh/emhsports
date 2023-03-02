import { currentMember } from "wix-members";
$w.onReady(async function () {
    const role = await currentMember.getRoles();
    
});
