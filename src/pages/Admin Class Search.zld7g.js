// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import location from 'wix-location';
import wixData from 'wix-data';
$w.onReady(function () {

    getDropDownData();
	// Disbling the buttons until the classes are populated
	$w('#updateClass').disable();
	$w('#deleteClass').disable();
    // Mappping of EventHandlers
    $w('#updateClass').onClick(updateClassHandler);
    $w('#deleteClass').onClick(deleteClassHandler);
	$w('#classDropdown').onChange(classDropDownHandler);
});

// Event Handlers
const updateClassHandler = () => {
	const classId = $w('#classDropdown').value;
	if(classId === 'loading'||classId === ''){
		console.log('class is not loaded please try again after seleting the class');
		return;
	}
	console.log({classId});
    location.to(`/class-form?mode=edit&classId=${classId}`)
}
const deleteClassHandler = () => {
	const classId = $w('#classDropdown').value;
	if(classId === 'loading'||classId === ''){
		console.log('class is not loaded please try again after seleting the class');
		return;
	}
	console.log({classId});
    // location.to(`/class-form?mode=edit&classId=${classId}`)
    $w('#classDeleteSuccessMessage').expand();
}
const classDropDownHandler = ()=>{
	resetMessages();
}
// Custom Function
const getDropDownData = async () => {
    try {
        const res = await wixData.query('Classes').find();
        if (res.totalCount === 0) {
            throw new Error('No class Found');
            return;
        }
		const classList = res.items;
		const dropDownOptions =[];
		classList.forEach(el=>{
			dropDownOptions.push({
				label:el.parkName,
				value:el._id
			})
		})
		$w('#classDropdown').options = dropDownOptions;
		// Enabling the buttons after the class list is loaded
		$w('#deleteClass').enable();
		$w('#updateClass').enable();
    } catch (error) {
        console.log(error);
    }

}

const resetMessages = ()=>{
	$w('#classDeleteSuccessMessage').collapse();
}