// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import wixData from 'wix-data';
import { authorize } from 'backend/register.jsw';
import wixLocation from 'wix-location';
import { currentMember, authentication } from 'wix-members';
import wixWindow from 'wix-window';


$w.onReady(function () {
	currentMember.getMember().then(member => {
		if (typeof member !== 'undefined') {
			wixLocation.to('/parent-dashboard')
		}
	});
});


// returns an object with an error message
async function validateSignUpData(signUpData) {

	const { username } = signUpData;

	// Check if all fields are filled
	for (let field of Object.keys(signUpData)) {
		if (!signUpData[field])
			return { error: `${field} field is required` }
	}

	// Check if username is already taken
	const usernameCount = await wixData.query("Parents")
		.eq("username", username).count();
	if (usernameCount) return { error: `${username} is already taken` }

	return { error: null }
}


function getSignUpData() {
	return {
		title: $w('#email').value,
		username: $w('#username').value,
		password: $w('#password').value,
		name: $w('#name').value,
		email: $w('#email').value,
		alternateEmail: $w('#alternateEmail').value,
		phone: $w('#phone').value,
		address: $w('#address').value,
		contact1: $w('#contact1').value,
		contact2: $w('#contact2').value,
		city: $w('#city').value,
		state: $w('#state').value,
		zipCode: $w('#zipCode').value,
		accountStatus: 'Active'
	}
}


export async function registerParent(email, password, contactInfo) {
	const registrationResult = await authentication.register(email, password, contactInfo)
	const memberId = registrationResult.member._id;
	await authorize(memberId).catch(err => {
		console.log('Error in authorize', err)
	});
	console.log('Member Id', memberId)
	return memberId;
}


/* ---------------------------------------------------------------------------------------------------
   |	Events Functions Below                                                                       |
   --------------------------------------------------------------------------------------------------- */


export async function signUp_click(event) {
	const signUpData = getSignUpData();
	const { error } = await validateSignUpData(signUpData);
	if (error) {
		$w('#errMsg').text = error;
		$w('#errMsg').expand();
		wixWindow.scrollTo(0, 0)
	}
	else {
		const { email, password } = signUpData;

		// Remove password before inserting
		delete signUpData['password']

		// For wix member page
		let contactInfo = {
			"firstName": signUpData['name'],
			"phones": [signUpData['phone']]
		}

		registerParent(email, password, contactInfo).then(res => {
			console.log('Res', res)
			signUpData['memberId'] = res;
			wixData.insert('Parents', signUpData).then(res => {
				authentication.login(email, password)
					.then(() => {
						wixLocation.to('/parent-dashboard');
					})
					.catch((error) => {
						console.error('Login Error', error);
						wixLocation.to('/login')
					});

			}).catch(err => {
				console.log('Parent registered but data not inserted', err)
			})
		}).catch(err => {
			console.log('Error in registering User', err)
		})
	}
}


