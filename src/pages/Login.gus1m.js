// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { currentMember, authentication } from 'wix-members';
import { getRole } from 'backend/role.jsw';
import wixLocation from 'wix-location';
import { viewMode } from 'wix-window';



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
    const email = $w('#email').value;
    const password = $w('#password').value;

    await authentication.login(email, password)
        .then(() => {
            console.log('Member is logged in');
            if(viewMode === "Preview"){
                wixLocation.to('/parent-dashboard');
            }
        })
        .catch((error) => {
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
