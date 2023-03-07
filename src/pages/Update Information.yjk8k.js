// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import wixData from "wix-data";
import { authentication, currentMember } from "wix-members";
import wixUsers from "wix-users";
import wixLocation from "wix-location";
let currentStudent;
const isLoggedIn = authentication.loggedIn();
// var currentAllergies;
const allergy = [];
const sports = [];
let memberId;
// var toUpdateId = "";
// let vid ='06179405-3993-4d2e-9368-5faf2759a515'    //coach id
// let vid = '523e2009-637c-473e-b30a-812c4a4b3f85' //parent id

$w.onReady(async () => {
	const isLoggedIn = authentication.loggedIn();

	if (isLoggedIn) {
		const loggedInMember = await currentMember.getMember();
		console.log("Member is logged in:", loggedInMember);
		memberId = loggedInMember._id;
		const contactId = loggedInMember.contactId;

		console.log(memberId);
		console.log(contactId);
	} else {
		wixLocation.to("/Login");
	}
	// wixData.query("Parents")
	//     .eq("memberId", memberId)
	//     .find()
	//     .then(async (results) => {
	//         console.log("parents queary");
	//         console.log(memberId);
	await parentUpdate();
	//     })
	//     .catch((error) => {
	//         console.log(error);
	//     })
	//     wixData.query("Coach")
	//         .eq("_id", memberId)
	//         .find()
	//         .then((results) => {
	// await coachUpdate();
	//         })
	//         .catch((error) => {
	//             console.log(error);
	//         });
});

// studentsUpdate()
// coachUpdate();

// parentsUpdate();
//

// // ...
// //*************************************************************************************** */
// // Coach  Data
// // **********************************************************************************************************
// // let id=''
function coachUpdate() {
	//expand
	$w("#repeaterSport").expand();
	$w("#sportDropDown").expand();
	$w("#updateCoachButton").expand();
	wixData
		.query("Coach")
		.eq("_id", memberId)
		.find()
		.then((results) => {
			if (results.items.length > 0) {
				let items = results.items;
				let item = items[0];
				$w("#name").text = item.name;
				$w("#email").text = item.email;
				$w("#updatePhone").value = item.phone;
				$w("#updateState").value = item.state;
				$w("#updateZipCode").value = item.zipCode;
				$w("#updateCity").value = item.city;
				$w("#repeaterSport").data = item.sports;
				$w("#updateAddress").value = item.address;
			} else {
				// handle case where no matching items found
			}
		})
		.catch((error) => {
			console.log(error);
		});
}
// let isloggedIn = true;
export function updateCoachButton_click(event) {
	if (
		$w("#updateCity").value == "" ||
		$w("#updateZipCode").value == "" ||
		$w("#updateAddress").value == "" ||
		$w("#updatePhone").value == "" ||
		$w("#updateState").value == ""
		// $w("#repeaterSport").data == []
	) {
		$w("#massageErrorCoachPatent").expand();
		$w("#massageErrorCoachPatent").text = "* Filed Are Mandatory";
	} else {
		wixData.get("Coach", memberId).then(async (toCoachUpdate) => {
			(toCoachUpdate.city = $w("#updateCity").value),
				(toCoachUpdate.state = $w("#updateState").value),
				(toCoachUpdate.zipCode = $w("#updateZipCode").value),
				(toCoachUpdate.address = $w("#updateAddress").value),
				(toCoachUpdate.phone = $w("#updatePhone").value),
				(toCoachUpdate.sports = $w("#repeaterSport").data),
				await wixData
					.update("Coach", toCoachUpdate)
					.then((results) => {
						console.log(results);
						$w("#massageParentCoachUpdate").expand();
						$w("#massageParentCoachUpdate").text = "Coach Data Is Updated"; //see item below
					})
					.catch((err) => {
						console.log(err);
					});
		});
	}
}

//*************************************************************************************** */
// parent Data
// **********************************************************************************************************

async function parentUpdate() {
	$w("#selectStudent").expand();

	$w("#updateContact2").expand();
	$w("#updateContact1").expand();
	$w("#updateParentButton").expand();
	console.log(memberId);
	await wixData
		.query("Parents")
		.eq("memberId", memberId)
		.find()
		.then((results) => {
			if (results.items.length > 0) {
				let items = results.items;
				let item = items[0];
				$w("#name").text = item.username;
				$w("#email").text = item.email;
				$w("#updatePhone").value = item.phone;
				$w("#updateContact1").value = item.contact1;
				$w("#updateContact2").value = item.contact2;
				$w("#updateState").value = item.state;
				$w("#updateZipCode").value = item.zipCode;
				$w("#updateCity").value = item.city;
				$w("#updateAddress").value = item.address;
				$w("#updateParentButton").onClick(() => {
					wixData.update("Parents", item).finally((results) => {
						console.log(results);
						$w("#massageParentCoachUpdate").expand();
						$w("#massageParentCoachUpdate").text = "Parent Data Is Updated";
					});
				});
			} else {
				console.log("// handle case where no matching items found");
			}
		})
		.catch((error) => {
			console.log(error);
		});
}
// export async function updateParentButton_click(event) {

//         if ($w('#updateCity').value == "" || $w('#updateZipCode').value == "" || $w('#updateAddress').value == "" ||
//             $w('#updatePhone').value == "" || $w('#updateState').value == "" || $w('#updateContact1').value == "" || $w('#updateContact2').value) {

//             $w('#massageErrorCoachPatent').expand()
//             $w('#massageErrorCoachPatent').text = "* Filed Are Mandatory";

//         } else {
//             console.log("hello", memberId);
//             wixData.get("Parents", memberId)
//                 .then(async (toParentUpdate) => {

//                     toParentUpdate.city = $w('#updateCity').value,
//                         toParentUpdate.state = $w('#updateState').value,
//                         toParentUpdate.zipCode = $w('#updateZipCode').value,
//                         toParentUpdate.contact1 = $w('#updateContact1').value,
//                         toParentUpdate.contact2 = $w('#updateContact2').value,
//                         toParentUpdate.address = $w('#updateAddress').value,
//                         toParentUpdate.phone = $w('#updatePhone').value,

//                         await wixData.update("Parents", toParentUpdate)
//                         .then((results) => {
//                             console.log(results);
//                             $w('#massageParentCoachUpdate').expand();
//                             $w('#massageParentCoachUpdate').text = "Parent Data Is Updated" //see item below
//                         })
//                         .catch((err) => {
//                             console.log(err);
//                         });
//                 })
//         }
// }

//*************************************************************************************** */
// Student Data
// **********************************************************************************************************
//
$w("#studentRepeater").onItemReady(($item, itemData, i) => {
	$item("#nameRepeaterText").text = itemData.name; //text coloum in repeate
	$item("#openButton").onClick(() => {
		selectItemForUpdate(itemData);
	});
});
export async function selectStudent_click(event) {
	$w("#studentSection").expand();
	$w("#studentRepeater").expand();
	await repeterStudentsUpdate();
}

function repeterStudentsUpdate() {
	wixData
		.query("Students")
		.eq("parent", memberId)
		.find()
		.then(async (results) => {
			if (results.totalCount > 0) {
				$w("#studentRepeater").data = results.items;
				console.log("studentrepater", memberId);
			}
		});
}
export function openButton_click(event) {
	$w("#allergiesRepeater").onItemReady(($item, itemData, index) => {
		$item("#allergiesText").text = itemData.allergy;
	});
}

const selectItemForUpdate = (itemData) => {
	$w("#studentBox").expand();
	($w("#studentNameText").text = itemData.name), ($w("#studentAddress").value = itemData.address);
	$w("#updateGrade").value = itemData.gradeLevel;
	$w("#studentCity").value = itemData.city;
	$w("#studentZipCode").value = itemData.zipCode;
	$w("#studentState").value = itemData.state;
	$w("#studentMedicalInformation").value = itemData.medicalInformation;
	wixData
		.query("Students")
		.eq("_id", itemData._id)
		.find()
		.then((res) => {
			$w("#allergiesRepeater").data = itemData.allergies;
			currentStudent = itemData._id;
			console.log(currentStudent);
		});
};
export function studentUpdateButton_click(event) {
	console.log("take current student");
	console.log(currentStudent);
	// const studentArray = [$w('#studentAddress').value,
	//     $w('#studentState').value,
	//     $w('#studentMedicalInformation').value,
	//     $w('#studentCity').value,
	//     $w('#updateGrade').value,
	//     $w('#studentZipCode').value,
	//     $w('#allergiesDropdown').value,
	//     $w('#schoolDropdown').value
	// ]

	// if (isLoggedIn) {
	//     for (let el in studentArray) {
	//         $w('#massageStudentError').expand();
	//         $w('#massageStudentError').text = `${el} field is required`
	//     }
	// } else {
	wixData.get("Students", currentStudent).then((toUpdateStudent) => {
		(toUpdateStudent.address = $w("#studentAddress").value),
			(toUpdateStudent.grade = $w("#updateGrade").value),
			(toUpdateStudent.allergies = $w("#allergiesRepeater").data),
			(toUpdateStudent.school = $w("#schoolDropdown").value),
			(toUpdateStudent.city = $w("#studentCity").value),
			(toUpdateStudent.state = $w("#studentState").value),
			(toUpdateStudent.zipCode = $w("#studentZipCode").value),
			(toUpdateStudent.medicalInformation = $w("#studentMedicalInformation").value);

		wixData
			.update("Students", toUpdateStudent)
			.then((results) => {
				$w("#massageStudentUpdate").expand();
				$w("#massageStudentUpdate").text = "Student Data Is Updated";
				console.log("updated student information");
				//see item below
			})
			.catch((err) => {
				console.log(err);
			});
	});
	// }
}

// ***********************************************************************************************************************************************************************
// Repeter on item to get for student Update
// ***************************************************************************************************************************************************************************************

// ******************************************************************************
// new updata according to
// *********************************************************************************
// REPEATER SPORT ADDSION OR DELECTION
$w("#repeaterSport").onItemReady(($item, itemData, index) => {
	$item("#repeaterSportText").text = itemData.sports;
	$item("#repeaterSportButton").onClick((e) => {
		deletesport(itemData._id); //DELETE SPORT  IN REPEATER
	});
});
$w("#repeaterSport").data = [];
export function sportDropDown_change(event) {
	let currentSport = $w("#sportDropDown").value;

	if (currentSport !== "Other") {
		addNewSport(currentSport); //ADD SPORT IN REPEATER
	}
}

function addNewSport(currentSport) {
	//ADDING FUCTION TO ADD SPORT IN REPEATER

	const includesSport = (currentSport) => {
		for (const sport of sports) if (sport.sports.toLowerCase() == currentSport.toLowerCase()) return true;
		//$w('#sportText').text=sports
		return false;
	};

	let sportToInsert = {
		_id: Math.random().toString().slice(4, 9), //ADD AN ID FOR SPORT REPEATER
		sports: currentSport,
	};
	if (currentSport && !includesSport(currentSport)) {
		sports.push(sportToInsert);
		console.log(sports);
		$w("#repeaterSport").data = sports;

		$w("#repeaterSport").expand();
	}
}

function deletesport(id) {
	//DELETESPORT FROM REPEATER

	const repeaterData = $w("#repeaterSport").data;
	const filteredData = repeaterData.filter((el) => el._id !== id);
	$w("#repeaterSport").data = filteredData;
	console.log(filteredData);
}

// ALLERGIES REPEATER TO ADD ALLERGIES
$w("#allergiesRepeater").onItemReady(($item, itemData, index) => {
	$item("#allergiesText").text = itemData.sports;
	$item("#allergiesButton").onClick((e) => {
		deleteAllergy(itemData._id); //DELETE ALLERGY FROM REPEATER
	});
});
export function allergiesDropdown_change(event) {
	let currentAllergies = $w("#allergiesDropdown").value;
	if (currentAllergies !== "Other") {
		addNewAllergies(currentAllergies);
	}
}

function addNewAllergies(currentAllergies) {
	//ADDING ALLERGY IN REPEATER
	const includesAllergies = (currentAllergies) => {
		for (const all_ergy of allergy) if (all_ergy.allergy.toLowerCase() == currentAllergies.toLowerCase()) return true;
		//
		return false;
	};
	let allergyToInsert = {
		_id: Math.random().toString().slice(4, 9),
		allergy: currentAllergies,
	};
	if (currentAllergies && !includesAllergies(currentAllergies)) {
		allergy.push(allergyToInsert);
		console.log(allergy);
		$w("#allergiesRepeater").data = allergy;
		$w("#allergiesRepeater").expand();
	}
}

function deleteAllergy(id) {
	//DELETE ALLERGY FROM REPEATER
	const repeaterData = $w("#allergiesRepeater").data;
	const filteredData = repeaterData.filter((el) => el._id !== id);
	$w("#allergiesRepeater").data = filteredData;
	console.log(filteredData);
}
// --------------------------------------------------------------------------------------------------------------------

export function schoolDropdown_change(event) {}
