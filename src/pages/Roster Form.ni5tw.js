// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import { currentMember } from 'wix-members';
import { local } from 'wix-storage';
import wixData from 'wix-data';


let currentUserWixid = null;

$w.onReady(async function () {
	console.log('Roster Form Page Loaded');
	await setCurrentUserWixId()
	console.log('Current User Wix Id', currentUserWixid);
	$w('#rosterFormRepeater').onItemReady(($item, itemData, index) => {
		$item('#stuentName').text = itemData.studentName;
		$item('#grade').text = itemData.grade;
		$item('#age').text = itemData.age;
		$item('#note').text = itemData.note;
		$item('#phone').text = itemData.phone;
	})

});

function formatGradeText(grade) {
	return 'UD'
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