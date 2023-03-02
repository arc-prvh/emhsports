import wixData from 'wix-data';
import wixLocation from 'wix-location';

$w.onReady(async function () {

    const classData = await wixData.query('Classes').find()
    const classDropdownData = classData.items.map(el => {
        return {
            label: el.parkName,
            value: el._id
        }
    })
    console.log(classDropdownData);
    $w('#classDropdown').options = classDropdownData;
});
