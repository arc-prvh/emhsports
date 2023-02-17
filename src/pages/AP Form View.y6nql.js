// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { local } from 'wix-storage';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixWindow from 'wix-window';


$w.onReady(async function () {
	const studentId = local.getItem('studentId')
	const studentQueryResponse = await wixData.query('Students')
		.eq('_id', studentId)
		.include('parent')
		.include('school')
		.include('apForm')
		.find()
	const studentData = studentQueryResponse.items[0];  // Always fetching first sttudent
	fillParticipationFormData(studentData, studentData.parent, studentData.school, studentData.apForm)
});


async function fillParticipationFormData(studentData, parentData, classData, apFormData) {

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
	$w('#signatureName').value = apFormData.signatureName
	$w('#parentNameAndDate').text = `${parentData.name}\n(${studentData.relationship}) ${getFormattedDateTime()}`
	$w('#signatureImage').src = apFormData.signature

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
