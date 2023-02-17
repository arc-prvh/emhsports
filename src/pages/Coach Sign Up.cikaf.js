// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import { authorize } from 'backend/register.jsw';
import { authentication, currentMember } from 'wix-members';

import { registerCoach } from 'backend/register.jsw';
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';

const sports = [];

$w('#sportDropDown').placeholder = "Choose Your Sport";
$w.onReady(function () {
    currentMember.getMember().then(member => {
        if (typeof member !== 'undefined') {
            wixLocation.to('/')
        }
    });

    $w('#repeaterSport').onItemReady(($item, itemData, index) => {
        $item('#sportText').text = itemData.sports;
        $item('#deleteSportButton').onClick(e => {
            deletesport(itemData._id)
        })

    })
    $w('#repeaterSport').data = [];
})

export function sportDropDown_change(event) {
    let currentSport = $w('#sportDropDown').value;

    if (currentSport !== 'Other') {
        addNewSport(currentSport)
    }
}
//Function for AddsNewSports/ DeleteSports/ EamilCheck
function addNewSport(currentSport) {

    const includesSport = (currentSport) => {
        for (const sport of sports)
            if (sport.sports.toLowerCase() == currentSport.toLowerCase()) return true
        //$w('#sportText').text=sports
        return false

    }

    let sportToInsert = {
        '_id': Math.random().toString().slice(4, 9),
        'sports': currentSport,
    }
    if (currentSport && !includesSport(currentSport)) {
        sports.push(sportToInsert);
        console.log(sports);
        $w('#repeaterSport').data = sports;

        $w('#repeaterSport').expand()

    }
}

function deletesport(id) {
    //DeleteSports
    const repeaterData = $w('#repeaterSport').data;
    const filteredData = repeaterData.filter(el => el._id !== id);
    $w('#repeaterSport').data = filteredData;
    // console.log(filteredData);

}

async function validateCoachSignUp(signUp) {

    const { email } = signUp;

    // Check if all fields are filled
    for (let field of Object.keys(signUp)) {
        if (!signUp[field])
            return { error: `${field} field is required` }
    }

    // Check if username is already taken
    const usernameCount = await wixData.query("Coach")
        .eq("email", email).count();
    if (usernameCount) return { error: `${email} is already taken` }

    return { error: null }

}

function getSignUp() {
    return {
        name: $w('#cName').value,
        email: $w('#cEmail').value,
        password: $w('#passWord').value,
        phone: $w('#cPhone').value,
        sports: $w('#sportDropDown').value,
        sport: $w('#repeaterSport').data,
        title: $w('#cEmail').value,
        state: $w('#state').value,
        city: $w('#city').value,
        address: $w('#address').value,
        zipCode: $w('#zipcode').value,
        status: "Active"

    }
}

export async function submit_click(event) {
    const signUp = getSignUp();

    const { error } = await validateCoachSignUp(signUp);
    const { email, password } = signUp
    if (error) {
        $w('#massageId').text = error;
        $w('#massageId').expand();
        wixWindow.scrollTo(0, 0)
        $w('#submitMessage').collapse();
    } else {
        
        registerCoach(email, password).then(res => {
                signUp['memberId'] = res.member._id;
                const status = res.status;               //console.log(item) //see item below
            })
            .catch((err) => {
                console.log(err);
            });


        delete signUp['password']
         wixData.insert("Coach", signUp)
                    .then((item) => {
                        wixLocation.to('/coach-dashboard')
                    })

        $w('#massageId').collapse();
        $w('#submitMessage').expand();
        $w('#submitMessage').text = "Thank you for  Signup\n";
        
        wixWindow.scrollTo(0, 0)
        $w('#cName').value = "";
        $w('#cEmail').value = "";
        $w('#passWord').value = "";
        $w('#sportDropDown').value = "";
        $w('#repeaterSport').data = [];
        $w('#cPhone').value = "";
        $w('#address').value="";
        $w('#city').value="";
        $w('#state').value="";
        $w('#zipcode').value="";
    }
}

// export async function registerCoach(email, password) {
//     const res = await authentication.register(email, password)
//     const memberId = res.member._id;
//     await authorize(memberId).catch(err => {
//         console.log('Error in authorize', err)
//     });
//     console.log('Member Id', memberId)
//     return memberId;
// }