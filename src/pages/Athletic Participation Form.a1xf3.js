// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { local } from 'wix-storage';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixWindow from 'wix-window';


let currentStudentData = null;
let currentParentData = null;

$w.onReady(async function () {
	const studentId = local.getItem('studentId')
	const studentQueryResponse = await wixData.query('Students')
		.eq('_id', studentId)
		.include('parent')
		.include('school')
		.find()
	const studentData = studentQueryResponse.items[0];  // Always fetching first sttudent
	currentStudentData = studentData;
	currentParentData = studentData.parent;
	fillParticipationFormData(studentData, studentData.parent, studentData.school)
});


async function fillParticipationFormData(studentData, parentData, classData) {

	// Upper Form Data
	$w('#studentName').text = studentData.name;
	$w('#parentName').text = parentData.name + ' (' + studentData.relationship + ')';
	$w('#username').text = parentData.username;
	$w('#birthdate').text = studentData.dob.toString().slice(0, 10);
	$w('#className').text = classData.name;
	$w('#studentAddress').text = studentData.address;
	$w('#phone').text = parentData.contact1;
	$w('#parentEmail').text = parentData.email;
	$w('#altEmail').text = parentData.alternateEmail;
	$w('#emergencyContact').text = parentData.contact2;
	// $w('#studentMedicalInfo').text = `${studentData.medicalInformation}\nAllergies\n${getStudentAllergiesInString(studentData.allergies)}`

	// Lower Form Data
	$w('#parentNameAndDate').text = `${parentData.name}\n(${studentData.relationship}) ${getFormattedDateTime()}`
	$w('#parentSignature').clear();

	wixWindow.scrollTo(0, 0)

	// Collapse loading message and expand form
	$w('#loadingFormMessage').collapse()
	$w('#formContainer').expand()
}


function getFormattedDateTime(dateTime = new Date()) {
	const date = dateTime.toDateString().split(' ');
	const time = dateTime.toLocaleTimeString();
	return `${date[0]}. ${date[1]} ${date[2]}, ${date[3]} - ${time.slice(0, 4)} ${time.slice(8, 10)}`
}

async function submitCurrentForm(studentData, parentData) {

	if (!$w('#legalGuardianCheck').checked) {
		$w('#loadingFormMessage').text = 'Please check the "I am legal Guardian" box to proceed'
		$w('#loadingFormMessage').expand()
		wixWindow.scrollTo(0, 0);
		return Promise.reject('Checkbox not clicked');
	}

	const parentSignature = $w('#parentSignature').value;
	if (parentSignature == null || parentSignature == "" || parentSignature == undefined) {
		$w('#loadingFormMessage').text = 'Please sign the form to continue'
		return Promise.reject('Invalid Signature');
	}

	const signatureName = $w('#signatureName').value;
	if (signatureName == null || signatureName == "") {
		$w('#loadingFormMessage').text = 'Please Enter Signature Name'
		return Promise.reject('Invalid Signature');
	}


	const formDataToInsert = {
		parent: parentData,
		student: studentData._id,
		signature: $w('#parentSignature').value,
		signatureName: $w('#signatureName').value,
		status: 'Active'
	}
	return formDataToInsert;
}


function updateApFormInStudent(apForm) {
	let toUpdate = {
		...currentStudentData,
		parent: currentStudentData.parent._id,
		school: currentStudentData.school._id,
		apForm: apForm._id 
	}
	console.log('toupdate', toUpdate)
	wixData.update('Students', toUpdate)
}

export async function submit_click(event) {
	submitCurrentForm(currentStudentData, currentParentData).then(async res => {
		console.log('Final', res)
		const apForm = await wixData.insert('AthleticParticipationForm', res)
		console.log('AP Form inserted', apForm)
		await updateApFormInStudent(apForm)
		local.removeItem('studentId')
		wixLocation.to('/ap-form-control')
	}).catch(err => {
		// $w('#formContainer').collapse();
		console.log('Error final', err)
		wixWindow.scrollTo(0, 0)
	})
}


// function arrayToString(array) {
// 	let result = "";
// 	if (array && array.length) {
// 		result = array[0];

// 		for (let i = 1; i < array.length; i++) {
// 			result = result + ', ' + array[i]
// 		}
// 	}
// 	return result;
// }

// async function checkIfRegistered(classData, student) {
// 	const res = await wixData.query('AthleticParticipationForm')
// 		.eq('student', student._id)
// 		.eq('class', classData._id).find();

// 	console.log('Query Res', res.items)
// 	if (res.items.length > 0) {

// 		for (const form of res.items) {
// 			let classInCart = checkIfClassInCartOrUnderReview(form)
// 			if (classInCart) {
// 				return {
// 					showError: true,
// 					message: `${classData.parkName} is in cart or under review.`
// 				};
// 			}
// 		}

// 		for (const form of res.items) {
// 			let overlappingMonths = checkItemOverlaps(form.selectedMonths, selectedMonth)
// 			if (overlappingMonths.length > 0) {
// 				return {
// 					showError: true,
// 					message: `${student.name} registration in ${selectedClass.parkName} is overlapping with existing months. Change the months and try again.
// 				Here are the list of overlapping months.
// 				${arrayToString(overlappingMonths)}`
// 				};
// 			}
// 		}
// 	}
// 	return {
// 		showErorr: false
// 	};
// }



// function checkItemOverlaps(array1, array2) {
// 	const overlappingItems = []
// 	console.log(array1, array2)
// 	for (const item1 of array1) {
// 		for (const item2 of array2) {
// 			if (item1.monthValue == item2.monthValue) overlappingItems.push(item2.monthLabel)
// 		}
// 	}
// 	return overlappingItems;
// }


// export async function submit_click(event) {

// 	let errorMessage = ''



// 	let isRegistered = (res) => {
// 		if (res.showError) {
// 			errorMessage = res.message
// 			return true
// 		}
// 		return false
// 	}

// 	let errorExists = isRegistered(response)
// 	console.log('Erorr Exists', errorExists)

// 	if (errorExists || !isClassActive) {
// 		$w('#formContainer').collapse()

// 		$w('#loadingFormMessage').text = errorMessage;

// 		$w('#loadingFormMessage').expand()
// 		$w('#actionButton').onClick(e => {
// 			wixLocation.to('/parent-dashboard')
// 			$w('#loadingFormMessage').text = 'Loading Dasboard . . .'
// 		})
// 		$w('#actionButton').expand()
// 		wixWindow.scrollTo(0, 0)
// 	}
// 	else {
// 		await submitCurrentForm().then(res => {
// 			currentStudentIndex += 1  // Change the form for next student
// 			for (let i = currentStudentIndex; i < selectedStudents.length; i++) {
// 				if (selectedStudents[i].formFilled === false) {
// 					currentStudentIndex = i;
// 					break;
// 				}
// 			}

// 			if (currentStudentIndex + 1 == selectedStudents.length) {
// 				$w('#submit').label = 'Submit'
// 				fillParticipationForm(selectedStudents, selectedClass, currentStudentIndex)
// 			}
// 			else if (currentStudentIndex + 1 > selectedStudents.length) {
// 				// local.removeItem('selectedStudents');
// 				// local.removeItem('selectedClass')
// 				// local.removeItem('selectedPackage')
// 				// local.removeItem('selectedMonth')
// 				$w('#formContainer').collapse()
// 				$w('#askParent').expand()
// 			}
// 			else {
// 				fillParticipationForm(selectedStudents, selectedClass, currentStudentIndex)
// 			}
// 		}).catch(err => {
// 			console.log('Error in submitting form', err)
// 		})
// 	}
// }

// // Custom Functions
// const getStudentAllergiesInString = (allergies) => {
// 	let allergiesString = ''
// 	allergies.forEach(el => {
// 		allergiesString += `${el.allergy}\n`
// 	})
// 	return allergiesString;
// }



