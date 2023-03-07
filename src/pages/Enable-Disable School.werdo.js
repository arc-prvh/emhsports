import wixData from 'wix-data';
import wixLocation from 'wix-location';
$w.onReady(function () {

    const isValidRole = true //getRoleValidation('Admin')
    if (!isValidRole) {
        console.log('Unauthorised Role trying to access Admin\'s page')
        wixLocation.to('/');
    }
    $w('#searchList').onItemReady(($item, itemData, index) => {
        $item('#name').text = itemData.name;
        if (itemData.status === 'Active') {
            $item('#switch').checked = true;
        } else {
            $item('#switch').checked = false;
        }
        $item('#switch').onChange(() => {
            statusChangeHandler(itemData._id);
        })
    })

    // Resetting the Repeater
    $w('#searchList').data = [];

    // Elements Mapped with Event Handlers
    $w('#searchButton').onClick(searchButtonHandler);
    $w("#searchButton").onClick(() => {
		wixLocation.to("/admin-dashboard");
	});
});

// Event Handlers

const searchButtonHandler = async () => {
    const query = $w('#searchInput').value;
    const res = await wixData.query('Schools').contains('name', query).ne('status','Custom').find();
    if (res.totalCount === 0) {
        console.log('No Match Found');
        return;
    }
    renderSearchList(res.items);
}

const statusChangeHandler = async (id) => {
    const data = await wixData.get('Schools', id);
    if (data.status === 'Active') {
        data.status = 'Disabled';
    } else {
        data.status = 'Active'
    }
    try {
        await wixData.update('Schools', data)
    } catch (error) {
        console.log(error);
    }

}

// Custom Functions
const renderSearchList = (items) => {
    const repeaterData = [];
    items.forEach(el => {
        repeaterData.push({
            _id: el._id,
            name: el.name,
            status: el.status
        })
    })
    $w('#searchList').data = repeaterData;
}

