// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { currentMember } from 'wix-members';
import { local } from 'wix-storage';
import wixData from 'wix-data';


let currentUserWixid = null;
let currentClassId = null;

$w.onReady(async function () {
    currentClassId = 'e01ca84e-8d4a-42eb-a5d2-06d6ee1d13bf' // local.getItem('currentClassId')
	// await setCurrentUserWixId()
    const classData = await wixData.query('Classes').eq('_id', currentClassId).find().then(res => res.items[0])
	console.log('Current User Wix Id', currentUserWixid);
    console.log('Class Data', classData);
    $w('#headingClassDetails').text = '(Active) ' + generateParkDetailHeading(classData);
	$w('#rosterFormRepeater').onItemReady(($item, itemData, index) => {
		$item('#studentName').text = itemData.studentName;
		$item('#grade').text = itemData.grade;
		$item('#age').text = itemData.age;
		$item('#note').text = itemData.note;
		$item('#phone').text = itemData.phone;
	})

    await wixData.query('Students').find().then(res => {
        console.log('Students', res.items);
        $w('#rosterFormRepeater').data = res.items.map(item => {
            return {
                studentName: item.name,
                grade: formatGradeText(item.gradeLevel),
                age: item.age,
                note: item.note,
                phone: item.phone
            }
        })
    })
});



function formatGradeText(grade) {
	return 'UD'
}

function generateParkDetailHeading(classData) {
    return `${classData.city}, ${classData.state} - ${classData.formattedAddress[0].parkAddress}`
}


async function setCurrentUserWixId() {
    const options = {
        fieldsets: ['FULL']
    }

    await currentMember.getMember(options)
        .then(async member => {
            await wixData.query('Coach')
                .eq('memberId', member._id)
                .find()
                .then(coach => {
                    currentUserWixid = coach.items[0]._id;
                    local.setItem('CoachId', coach.items[0]._id);
                }).catch(err => {
                    console.log('Error in finding coach wix id', err);
                });
        })
        .catch((error) => {
            console.error('Error in getting current user email', error);
        });
}