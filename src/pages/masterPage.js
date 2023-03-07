import { authentication, currentMember } from 'wix-members';
import wixLocation from 'wix-location';
import { viewMode } from 'wix-window';


$w.onReady(async function () {

    // Dynamically Injecting the Dashboard Link for parents Ignore the error just wix being wierd
    const menuItems = $w('#horizontalMenu1').menuItems;
    let isLoggedIn = authentication.loggedIn();
    if(viewMode === "Preview"){
        isLoggedIn = true;
    }
    if (isLoggedIn) {
        const url =await getDashboardURL()
        menuItems.push({
            "link": url,
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
            redirectMember(currentMemberRole);
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


function redirectMember(role) {
    if (role === 'Admin') {
        console.log("Rdirecting to Admin Dashboard");
        wixLocation.to('/admin-dashboard');
    } else if (role === 'Coach') {
        console.log('Redirecting to Coach Dashboard')
        wixLocation.to('/coach-dashboard');
    } else if (role === 'Parent') {
        console.log('Redirecting to Parent Dashboard')
        wixLocation.to('/parent-dashboard');
    }else{
        console.log('Login Error, no roles found')
        return null;
    }
}

const getDashboardURL = async() =>{
    let roles = null;
    try {
        roles = await currentMember.getRoles();
    } catch (error) {
        console.log(error);
    }
    const role = roles[0].title;
    if (role === 'Admin') {
        return '/admin-dashboard';
    } else if (role === 'Coach') {
        return '/coach-dashboard';
    } else if (role === 'Parent') {
        return '/parent-dashboard';
    }else{
        console.log('Login Error, no roles found')
        return '/parent-dashboard';
    }
}