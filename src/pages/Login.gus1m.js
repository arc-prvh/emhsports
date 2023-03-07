// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { currentMember, authentication } from 'wix-members';
import { getRole } from 'backend/role.jsw';
import wixLocation from 'wix-location';
import { viewMode } from 'wix-window';
import { timeline } from 'wix-animations';



$w.onReady(async function () {
    if(authentication.loggedIn()){
        try {
            const memberRoles = await currentMember.getRoles();
            console.log(memberRoles);
            const currentMemberRole = memberRoles[0].title;
            redirectMember(currentMemberRole);
        } catch (error) {
            console.log(error);
        }
    }

});

export async function login_click(event) {
    startLoader();
    const email = $w('#email').value;
    const password = $w('#password').value;

    await authentication.login(email, password)
        .then(() => {
            console.log('Member is logged in');
            if(viewMode === "Preview"){
                wixLocation.to('/parent-dashboard');
            }
            stopLoader();
        })
        .catch((error) => {
            stopLoader();
            $w('#erroMessage').text = '​Invalid Login Credentials !! Please try again'
            $w('#erroMessage').expand()
            console.error('Login Error', error);
        });
}
function redirectMember(role) {
    console.log('Redirecting Member');
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

const startLoader = ()=>{
    const loader = $w("#loaderImage");
	timeline({ repeat: -1, yoyo: false }).add(loader, { rotate: 360, duration: 1000, easing: "easeLinear" }).play();
    $w('#loginBox').collapse();
    $w('#loaderBox').expand();
}
const stopLoader = ()=>{
    const loader = $w("#loaderImage");
	timeline({ repeat: -1, yoyo: false }).add(loader, { rotate: 360, duration: 1000, easing: "easeLinear" }).pause();
    $w('#loaderBox').collapse();
    $w('#loginBox').expand();
}


