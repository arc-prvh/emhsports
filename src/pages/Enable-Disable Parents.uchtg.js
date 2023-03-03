import wixData from 'wix-data';
import wixLocation from 'wix-location';


// Account Status Coanstant
const ACCOUNT_ACTIVE = "Active";    //Account is currently Active
const ACCOUNT_BANNED = "Banned";    //Account is disabled by Admin


$w.onReady(function () {

    const isValidRole = true //getRoleValidation('Admin')
    if (!isValidRole) {
        console.log('Unauthorised Role trying to access Admin\'s page')
        wixLocation.to('/');
    }
    $w('#searchList').onItemReady(($item, itemData, index) => {
        console.log({itemData});
        $item('#name').text = itemData.name;
        $item('#email').text = itemData.email;
        if (itemData.accountStatus === ACCOUNT_ACTIVE) {
            $item('#switch').checked = true;
        } else {
            $item('#switch').checked = false;
        }
        $item('#switch').onChange(() => {
            accountStatusChangeHandler(itemData._id);
        })
    })

    // Resetting the Repeater
    $w('#searchList').data = [];

    // Elements Mapped with Event Handlers
    $w('#searchButton').onClick(searchButtonHandler);
});

// Event Handlers

const searchButtonHandler = async () => {
    const query = $w('#searchInput').value;
    const res = await wixData.query('Parents').contains('name', query).or(wixData.query('Parents').contains('email', query)).find();
    if (res.totalCount === 0) {
        console.log('No Match Found');
        return;
    }
    renderSearchList(res.items);
}

const accountStatusChangeHandler = async (id) => {
    const data = await wixData.get('Parents', id);
    if (data.accountStatus === ACCOUNT_ACTIVE) {
        data.accountStatus = ACCOUNT_BANNED;
    } else {
        data.accountStatus = ACCOUNT_ACTIVE
    }
    try {
        await wixData.update('Parents',data)
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
            email: el.email,
            accountStatus: el.accountStatus
        })
    })
    $w('#searchList').data = repeaterData;
}

