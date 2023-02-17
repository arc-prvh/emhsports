// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { local } from 'wix-storage';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixWindow from 'wix-window';


/* -------------------------------Constants Start ---------------------------------------- */
const inCart = 'InCart';     // AP Form is in cart
const paid = 'Paid'        // Parents has paid for the class
const underReview = 'UnderReview' // Parents requested for school to pay, but admin hasn't approved yet
const approved = 'Approved'    // Request for school payment is approved
const rejected = 'Rejected'    // Request for school payment is rejected
/* -------------------------------Constants End ----------------------------------------- */


let currentStudentIndex = 0;
const selectedStudents = JSON.parse(local.getItem('selectedStudents'));
const selectedClass = JSON.parse(local.getItem('selectedClass'));
const selectedPackage = JSON.parse(local.getItem('selectedPackage'));
const selectedMonth = JSON.parse(local.getItem('selectedMonth'));
console.log(selectedPackage);


/* Development Style Followed */
/*
	-> All the modules are not coupled i.e it's very less likely that change in a module will affet other modules
	-> All the data that might need are made available in each module, you don't need to think about data flow architecture
	-> Wix Events functions are declared after utility functions
	-> If you want to disable multi-form feature, try restricting multiple selection from search page (selectStudent stage), it would be simple
*/


$w.onReady(function () {
	if (!selectedStudents) {
		wixLocation.to('/search')
	}
	else {
		if (selectedStudents.length > 1) {
			$w('#submit').label = 'Submit & Next'
		}
		console.log('On Ready -', selectedStudents)
		for (let i = 0; i < selectedStudents.length; i++) {
			if (!selectedStudents[i].formFilled) {
				currentStudentIndex = i;
				break
			}
		}
		if (currentStudentIndex + 1 > selectedStudents.length || selectedStudents.length === 0) {
			wixLocation.to('/search')
		}
		else {
			fillParticipationForm(selectedStudents, selectedClass, currentStudentIndex);
		}
	}

});


async function fillParticipationFormData(studentData, parentData, classData) {

	console.log('Student Data', studentData)
	const schoolName = await wixData.query('Schools').eq('_id', studentData.school).find().then(res => {
		console.log('Res', res)
		return res.items[0].name
	});

	// Upper Form Data
	$w('#studentName').text = studentData.name;
	$w('#parentName').text = parentData.name + ' (' + studentData.relationship + ')';
	$w('#username').text = parentData.username;
	$w('#birthdate').text = studentData.dob.toString().slice(0, 10);
	$w('#className').text = schoolName;
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


async function fillParticipationForm(students, classData, index) {
	const parentId = students[index].parent;
	await wixData.query('Parents').eq('_id', parentId).find().then(parent => {
		fillParticipationFormData(students[index], parent.items[0], classData)
	}).catch(err => {
		console.log('Error in filling form : ', err)
	})
}


async function submitCurrentForm() {
	
	if (!$w('#legalGuardianCheck').checked) {
		$w('#loadingFormMessage').text = 'Please check the "I am legal Guardian" box to proceed'
		$w('#loadingFormMessage').expand()
		wixWindow.scrollTo(0,0);
		return Promise.reject('Checkbox not clicked');
	}
	const parentSignature = $w('#parentSignature').value;
	if (parentSignature == null || parentSignature == "" || parentSignature == undefined) {
		return Promise.reject('Invalid Signature');
	}
	const student = selectedStudents[currentStudentIndex]
	const formDataToInsert = {
		parent: student.parent,
		student: student._id,
		// 'class': selectedClass._id,
		// selectedMonths: selectedMonth,
		// selectedPackage,
		// status: inCart,  // By default all form must go in cart
		signature: $w('#parentSignature').value,
		signatureName: $w('#signatureName').value,
	}
	console.log('AP Form Data', formDataToInsert)
	await wixData.insert('AthleticParticipationForm', formDataToInsert).then(res => {
		selectedStudents[currentStudentIndex].formFilled = true;
		local.setItem('selectedStudents', JSON.stringify(selectedStudents))
		Promise.resolve('Data Data Inserted Successfully');
	}).catch(err => {
		Promise.reject(err)
	})
}


function getFormattedDateTime(dateTime = new Date()) {
	const date = dateTime.toDateString().split(' ');
	const time = dateTime.toLocaleTimeString();
	return `${date[0]}. ${date[1]} ${date[2]}, ${date[3]} - ${time.slice(0, 4)} ${time.slice(8, 10)}`
}



function arrayToString(array) {
	let result = "";
	if (array && array.length) {
		result = array[0];

		for (let i = 1; i < array.length; i++) {
			result = result + ', ' + array[i]
		}
	}
	return result;
}

async function checkIfRegistered(classData, student) {
	const res = await wixData.query('AthleticParticipationForm')
		.eq('student', student._id)
		.eq('class', classData._id).find();

	console.log('Query Res', res.items)
	if (res.items.length > 0) {

		for (const form of res.items) {
			let classInCart = checkIfClassInCartOrUnderReview(form)
			if (classInCart) {
				return {
					showError: true,
					message: `${classData.parkName} is in cart or under review.`
				};
			}
		}

		for (const form of res.items) {
			let overlappingMonths = checkItemOverlaps(form.selectedMonths, selectedMonth)
			if (overlappingMonths.length > 0) {
				return {
					showError: true,
					message: `${student.name} registration in ${selectedClass.parkName} is overlapping with existing months. Change the months and try again.
				Here are the list of overlapping months.
				${arrayToString(overlappingMonths)}`
				};
			}
		}
	}
	return {
		showErorr: false
	};
}


function checkIfClassInCartOrUnderReview(classData) {
	if (classData.status == inCart || classData.status == underReview) return true
	return false
}


function checkItemOverlaps(array1, array2) {
	const overlappingItems = []
	console.log(array1, array2)
	for (const item1 of array1) {
		for (const item2 of array2) {
			if (item1.monthValue == item2.monthValue) overlappingItems.push(item2.monthLabel)
		}
	}
	return overlappingItems;
}


export async function submit_click(event) {

	let errorMessage = ''
	let isClassActive = () => {
		if (selectedClass['status'] != 'Active') {
			errorMessage = `${selectedClass.parkName} is not active yet.`
			return false
		}
		return true
	}

	let response = await checkIfRegistered(selectedClass, selectedStudents[currentStudentIndex])

	let isRegistered = (res) => {
		if (res.showError) {
			errorMessage = res.message
			return true
		}
		return false
	}

	let errorExists = isRegistered(response)
	console.log('Erorr Exists', errorExists)

	if (errorExists || !isClassActive) {
		$w('#formContainer').collapse()

		$w('#loadingFormMessage').text = errorMessage;

		$w('#loadingFormMessage').expand()
		$w('#actionButton').onClick(e => {
			wixLocation.to('/parent-dashboard')
			$w('#loadingFormMessage').text = 'Loading Dasboard . . .'
		})
		$w('#actionButton').expand()
		wixWindow.scrollTo(0, 0)
	}
	else {
		await submitCurrentForm().then(res => {
			currentStudentIndex += 1  // Change the form for next student
			for (let i = currentStudentIndex; i < selectedStudents.length; i++) {
				if (selectedStudents[i].formFilled === false) {
					currentStudentIndex = i;
					break;
				}
			}

			if (currentStudentIndex + 1 == selectedStudents.length) {
				$w('#submit').label = 'Submit'
				fillParticipationForm(selectedStudents, selectedClass, currentStudentIndex)
			}
			else if (currentStudentIndex + 1 > selectedStudents.length) {
				// local.removeItem('selectedStudents');
				// local.removeItem('selectedClass')
				// local.removeItem('selectedPackage')
				// local.removeItem('selectedMonth')
				$w('#formContainer').collapse()
				$w('#askParent').expand()
			}
			else {
				fillParticipationForm(selectedStudents, selectedClass, currentStudentIndex)
			}
		}).catch(err => {
			console.log('Error in submitting form', err)
		})
	}
}

// Custom Functions
const getStudentAllergiesInString = (allergies)=>{
	let allergiesString = ''
	allergies.forEach(el=>{
		allergiesString+= `${el.allergy}\n`
	})
	return allergiesString;
}