import { authentication, currentMember } from 'wix-members';
import wixLocation from 'wix-location';
import {redirectMember} from 'backend/dashboardRedirect';

$w.onReady(async function () {

    // Dynamically Injecting the Dashboard Link for parents Ignore the error just wix being wierd
    const menuItems = $w('#horizontalMenu1').menuItems;
    if (authentication.loggedIn()) {
        menuItems.push({
            "link": "/parent-dashboard",
            "target": "_self",
            "label": "Dashboard",
            "menuItems": []
        });
    } else {
        menuItems.push({
            "link": "/login",
            "target": "_self",
            "label": "Dashboard",
            "menuItems": []
        });
    }
    $w('#horizontalMenu1').menuItems = menuItems;

    if (wixLocation.path[0] === 'login') {
        $w('#loginMaster').label = "Sign Up";
    } else {
        $w('#loginMaster').label = "Log In";
    }

    currentMember.getMember().then(member => {

        if (typeof member === 'undefined') {
            $w('#accountNavBar1').hide('fade');
            $w('#loginMaster').show('fade');
        } else {
            $w('#accountNavBar1').show('fade');
            $w('#loginMaster').hide('fade');
        }
    });

    authentication.onLogin(async (member) => {
        // Function will be triggered when any user logs in
        try {
            const memberRoles = await currentMember.getRoles();
            console.log(memberRoles);
            const currentMemberRole = memberRoles[0].title;
            wixLocation.to(redirectMember(currentMemberRole));
        } catch (error) {
            console.log(error);
        }
        $w('#loginMaster').hide('fade');
        $w('#accountNavBar1').show('fade');
        // $w('#menuAuth').expand();

    });

    $w('#loginMaster').onClick(() => {
        if (wixLocation.path[0] === 'login') {
            wixLocation.to('/parent-signup');
        } else {
            wixLocation.to('/login');
        }
    })

    authentication.onLogout(() => wixLocation.to('/'))
});
