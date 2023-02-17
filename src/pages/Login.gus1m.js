// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { currentMember, authentication } from 'wix-members';
import { getRole } from 'backend/role.jsw';
import wixLocation from 'wix-location';
import {redirectMember} from 'backend/dashboardRedirect';


$w.onReady(async function () {
    if(authentication.loggedIn()){
        try {
            const memberRoles = await currentMember.getRoles();
            console.log(memberRoles);
            const currentMemberRole = memberRoles[0].title;
            wixLocation.to(redirectMember(currentMemberRole));
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
        })
        .catch((error) => {
            $w('#erroMessage').text = '​Invalid Login Credentials !! Please try again'
            $w('#erroMessage').expand()
            console.error('Login Error', error);
        });
}
