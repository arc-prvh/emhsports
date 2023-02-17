// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { local } from 'wix-storage';
import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members';

let parentId = local.getItem('parent')


/* -------------------------------Constants Start ---------------------------------------- */
const active = 'Active';     // AP Form is active

/* -------------------------------Constants End ---------------------------------------- */


$w.onReady(async function () {

	$w('#studentRepeater').onItemReady(($item, itemData, index) => {
		$item('#name').text = itemData.name;
		$item('#school').text = itemData.school;
		$item('#age').text = itemData.age;
		if (itemData.isApFormActive) {
			$item('#submitApForm').label = 'View AP Form'
			$item('#submitApForm').onClick(event => {
			local.setItem('studentId', itemData._id);
			wixLocation.to('/ap-form-view')
		});
		}
		else {
			$item('#submitApForm').label = 'Submit AP Form'
			$item('#submitApForm').onClick(event => {
			local.setItem('studentId', itemData._id);
			wixLocation.to('/athletic-participation-form')
		});
		}
		
	})

	setCurrentUserWixId().then(async (parentId) => {
		const students = await wixData.query('Students')
			.eq('parent', parentId)
			.include('school')
			.include('apForm')
			.find();

		const studentRepeaterData = formatApFormDataForRepeater(students.items)
		$w('#studentRepeater').data = studentRepeaterData;
		$w('#studentRepeater').expand()
	})
});

function getApFormStatus(student) {
	if (student.apForm.status == active) return true
	return false
}

function formatApFormDataForRepeater(students) {
	const formattedData = []
	console.log('Form', students)
	for (const student of students) {
		formattedData.push({
			...student,
			name: student.name,
			school: student.school.name,
			age: calculateAge(student.dob).toString(),
			isApFormActive: getApFormStatus(student),
		})
	}
	return formattedData;
}


function calculateAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}


async function setCurrentUserWixId() {

	if (parentId) return parentId
	const options = {
		fieldsets: ['FULL']
	}

	return await currentMember.getMember(options)
		.then(async member => {
			return await wixData.query('Parents')
				.eq('memberId', member._id)
				.find()
				.then(parent => {
					parentId = parent.items[0]._id;
					local.setItem('parentId', parent.items[0]._id);
					return parentId
				}).catch(err => {
					console.log('Error in finding parent wix id', err);
				});
		})
		.catch((error) => {
			console.error('Error in getting current user email', error);
		});
}