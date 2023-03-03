import wixData from "wix-data";
import wixLocation from "wix-location";
import { assignCoachRole } from "backend/register";
import { timeline } from "wix-animations";


// Account Status Coanstant
const ACCOUNT_ACTIVE = "Active";    //Account is currently Active,
const ACCOUNT_PENDING = "Pending";   //Account approval is pending by Admin
const ACCOUNT_BANNED = "Banned";    //Account is disabled by Admin

$w.onReady(function () {
	const isValidRole = true; //getRoleValidation('Admin')
	showLoader();
	if (!isValidRole) {
		console.log("Unauthorised Role trying to access Admin's page");
		wixLocation.to("/");
	}
	$w("#searchList").onItemReady(($item, itemData, index) => {
		$item("#name").text = itemData.name;
		$item("#email").text = itemData.email;
		if (itemData.accountStatus === ACCOUNT_ACTIVE) {
			$item("#approveCoachButton").disable();
		} else {
			$item("#approveCoachButton").enable();
		}
		$item("#approveCoachButton").onClick(() => {
			approveCoachHandler(itemData._id);
			$item("#approveCoachButton").disable();
		});
	});

	// Resetting the Repeater
	$w("#searchList").data = [];

	// Elements Mapped with Event Handlers
	$w("#searchButton").onClick(searchButtonHandler);
	$w("#searchButton").onClick(() => {
		wixLocation.to("/admin-dashboard");
	});

	// Getting All Pending Coaches on page Load
	getAllCoachesPendingCoaches();
	hideLoader();
});

// Event Handlers

const searchButtonHandler = async () => {
	showLoader();
	const query = $w("#searchInput").value;
	const res = await wixData
		.query("Coach")
		.contains("name", query)
		.or(wixData.query("Coach").contains("email", query))
		.eq("status", $w("#statusFilter").value)
		.find();
	if (res.totalCount === 0) {
		console.log("No Match Found");
		return;
	}
	renderSearchList(res.items);
	hideLoader();
};

const approveCoachHandler = async (id) => {
	showLoader();
	let res = null;
	try {
		res = await wixData.get("Coach", id);
		if (!res) throw new Error("No Coach Found");
		const result = await assignCoachRole(res.memberId);
		if (!result) throw new Error("Unable to Activate Coach account");
		console.log(result);
	} catch (error) {
		console.log(error);
		hideLoader();
		return;
	}
	const toUpdate = {
		...res,
		status: ACCOUNT_ACTIVE,
	};
	try {
		const updateRes = await wixData.update("Coach", toUpdate);
		if (!updateRes) throw new Error("No Coach Found");
		console.log(updateRes);
	} catch (error) {
		console.log(error);
		hideLoader();
		return;
	}
	hideLoader();
};

// Custom Functions
const renderSearchList = (items) => {
	const repeaterData = [];
	items.forEach((el) => {
		repeaterData.push({
			_id: el._id,
			name: el.name,
			email: el.email,
			accountStatus: el.status,
		});
	});
	$w("#searchList").data = repeaterData;
};

const getAllCoachesPendingCoaches = async () => {
	let res = null;
	try {
		res = await wixData.query("Coach").eq("status", "Pending").find();
		if (res.totalCount === 0) throw new Error("No Coach Found");
	} catch (error) {
		console.log(error);
		return;
	}
	const repeaterData = [];
	res.items.forEach((el) => {
		repeaterData.push({
			_id: el._id,
			name: el.name,
			email: el.email,
			accountStatus: el.status,
		});
	});
	$w("#searchList").data = repeaterData;
};

const startLoader = () => {
	const loader = $w("#loaderImage");
	timeline({ repeat: -1, yoyo: false }).add(loader, { rotate: 360, duration: 1000, easing: "easeLinear" }).play();
};
const stopLoader = () => {
	const loader = $w("#loaderImage");
	timeline({ repeat: -1, yoyo: false }).add(loader, { rotate: 360, duration: 1000, easing: "easeLinear" }).pause();
};

const showLoader = () => {
	startLoader();
	$w("#formBox").collapse();
	$w("#loaderBox").expand();
};

const hideLoader = () => {
	stopLoader();
	$w("#loaderBox").collapse();
	$w("#formBox").expand();
};
