import wixData, { get } from "wix-data";
import wixLocation from "wix-location";


// Account Status Coanstant
const ACCOUNT_ACTIVE = "Active";    //Account is currently Active,
const ACCOUNT_PENDING = "Pending";   //Account approval is pending by Admin
const ACCOUNT_BANNED = "Banned";    //Account is disabled by Admin

$w.onReady(function () {
	const isValidRole = true; //getRoleValidation('Admin')
	if (!isValidRole) {
		console.log("Unauthorised Role trying to access Admin's page");
		wixLocation.to("/");
	}
	$w("#searchList").onItemReady(($item, itemData, index) => {
		$item("#name").text = itemData.name;
		$item("#email").text = itemData.email;
		if (itemData.status === ACCOUNT_ACTIVE) {
			$item("#switch").checked = true;
		} else {
			$item("#switch").checked = false;
		}
		$item("#switch").onChange(() => {
			accountStatusChangeHandler(itemData._id);
		});
	});

	// Resetting the Repeater
	$w("#searchList").data = [];

	// Elements Mapped with Event Handlers
	$w("#searchButton").onClick(searchButtonHandler);
	// Get All Coaches
	getAllCoaches();
});

// Event Handlers

const searchButtonHandler = async () => {
	const query = $w("#searchInput").value;
	let res = null;
	try {
		res = await wixData.query("Coach").contains("name", query).or(wixData.query("Coach").contains("email", query)).find();
		if (res.totalCount === 0) throw new Error("No Coach Found");
	} catch (error) {
		console.log(error);
		return;
	}
	renderSearchList(res.items);
};

const accountStatusChangeHandler = async (id) => {
    let data = null;
    try {
        data = await wixData.get("Coach", id);
        if(!data) throw new Error('Unable to get Coaches Data from database');
    } catch (error) {
        console.log(error);
        return;
    }
	if (data.status === ACCOUNT_ACTIVE) {
		data.status = ACCOUNT_BANNED;
	} else {
		data.status = ACCOUNT_ACTIVE;
	}
	try {
		await wixData.update("Coach", data);
	} catch (error) {
		console.log(error);
	}
};

// Custom Functions
const renderSearchList = (items) => {
	const repeaterData = [];
	items.forEach((el) => {
		if (el.status === ACCOUNT_ACTIVE || el.status === ACCOUNT_BANNED) {
			repeaterData.push({
				_id: el._id,
				name: el.name,
				email: el.email,
				status: el.status,
			});
		}
	});
	$w("#searchList").data = repeaterData;
};

const getAllCoaches = async () => {
	let res = null;
	try {
		res = await wixData.query("Coach").find();
		if (res.totalCount === 0) throw new Error("No coach Found");
	} catch (error) {
		console.log(error);
		return;
	}

	renderSearchList(res.items);
};
