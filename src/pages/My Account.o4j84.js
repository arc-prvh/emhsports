import { query, insert, update, get } from "wix-data";
import { currentMember } from "wix-members";
import { to } from "wix-location";
let role = null;
let member = null;
let currentParent = null;
let currentCoach = null;

// To do Remove logs
$w.onReady(async () => {
	role = await validateMember();
	if (role === "Coach") {
		expandCoachFields();
		fillCoachData();
	}

	if (role === "Parent") {
		expandParentFields();
		fillParentData();
		$w("#studentDropdown").options = await getStudentOptions();
	}

	$w("#sportsRepeater").onItemReady(($item, itemData, index) => {
		$item("#sportText").text = itemData.sportText;
		$item("#sportText").onClick(() => {
			deleteSportHandler(itemData._id);
		});
	});

	// Mapping event handlers
	$w("#updateButton").onClick(updateButtonHandler);
	$w("#updateStudentButton").onClick(updateStudentButtonHandler);
	$w("#sportDropDown").onChange(sportChangeHandler);
	$w("#addSport").onClick(addSportHandler);
});

// Event Handlers
const addSportHandler = () => {
	let sport = $w("#otherSportInput").value;
	if (sport === "") {
		console.log("other Sport value Empty");
		$w("#otherSportInput").focus();
	} else {
		const repeaterData = $w("#sportsRepeater").data;
		repeaterData.push({
			_id: Math.floor(Math.random() * 1000).toString(),
			sportText: sport,
		});
		$w("#sportsRepeater").data = repeaterData;
		$w("#otherSportInput").value = "";
	}
};
const sportChangeHandler = () => {
	let sport = $w("#sportDropDown").value;
	if (sport === "Other") {
		$w("#otherSportInput").expand();
		$w("#addSport").expand();
	} else {
		$w("#otherSportInput").collapse();
		$w("#otherSportInput").value = "";
		$w("#addSport").collapse();
		const repeaterData = $w("#sportsRepeater").data;
		repeaterData.push({
			_id: Math.floor(Math.random() * 1000).toString(),
			sportText: sport,
		});
		$w("#sportsRepeater").data = repeaterData;
	}
};
const updateStudentButtonHandler = () => {
	const studentId = $w("#studentDropdown").value;
	if (studentId === "") {
		$w("#studentDropdown").focus();
		console.log("No Student is selected in drop down");
	} else {
        console.log(`/student-update?studentId=${studentId}`);
		to(`/student-update?studentId=${studentId}`);
	}
};

const updateButtonHandler = () => {
	console.log("Update button clicked");
	let updatedData = null;
	if (role === "Coach") {
		const error = validateCoachData();
		if (error.length > 0) {
			$w("#errorText").text = error;
			$w("#errorText").expand();
            return;
		} else {
			$w("#errorText").text = "";
			$w("#errorText").collapse();
		}
		updatedData = getCoachData();
        console.log({ updatedData });
		updateDatabase("Coach", updatedData);
	}

	if (role === "Parent") {
		const error = validateParentData();
		if (error.length > 0) {
			$w("#errorText").text = error;
			$w("#errorText").expand();
            return;
		} else {
			$w("#errorText").text = "";
			$w("#errorText").collapse();
		}
		updatedData = getParentData();
		console.log({ updatedData });
		updateDatabase("Parents", updatedData);
	}
};
const deleteSportHandler = (id) => {
	const repeaterData = $w("#sportsRepeater").data;
	const filteredData = repeaterData.filter((el) => el._id !== id);
	$w("#sportsRepeater").data = filteredData;
};

// Custom Functions
const validateCoachData = () => {
	let error = "";

	if ($w("#name").value === "") {
		error += "Name not found\n";
	}
	if ($w("#contactNumber").value === "") {
		error += "Contact Number not found\n";
	}
	if ($w("#address").value === "") {
		error += "Address not found\n";
	}
	if ($w("#city").value === "") {
		error += "City not found\n";
	}
	if ($w("#state").value === "") {
		error += "State not found\n";
	}
	if ($w("#zipcode").value === "") {
		error += "Zip Code not found\n";
	}
	if ($w("#sportsRepeater").data.length === 0) {
		error += "Sports not found\n";
	}
	return error;
};
const validateParentData = () => {
	let error = "";
	if ($w("#name").value === "") {
		error += "Name not found\n";
	}
	if ($w("#contactNumber").value === "") {
		error += "Contact Number not found\n";
	}
	if ($w("#emergencyContact1").value === "") {
		error += "Emergency Contact 1 not found\n";
	}
	if ($w("#emergencyContact2").value === "") {
		error += "Emergency Contact 2 not found\n";
	}
	if ($w("#alternateEmail").value === "") {
		error += "Alternate Email not found\n";
	}
	if ($w("#address").value === "") {
		error += "Address not found\n";
	}
	if ($w("#city").value === "") {
		error += "City not found\n";
	}
	if ($w("#state").value === "") {
		error += "State not found\n";
	}
	if ($w("#zipcode").value === "") {
		error += "Zip Code not found\n";
	}
	return error;
};

const fillCoachData = () => {
	const { city, name, state, zipCode, address, phone, sports } = currentCoach;
	$w("#name").value = name;
	$w("#contactNumber").value = phone;
	$w("#address").value = address;
	$w("#city").value = city;
	$w("#state").value = state;
	$w("#zipcode").value = zipCode;
	const repeaterData = [];
	if (sports) {
		sports.forEach((sport) => {
			repeaterData.push({
				_id: Math.floor(Math.random() * 100000).toString(),
				sportText: sport,
			});
		});
		$w("#sportsRepeater").data = repeaterData;
	} else {
		$w("#sportsRepeater").data = [];
	}
};

const fillParentData = () => {
	const { name, city, phone, alternateEmail, address, state, zipCode, contact2, contact1 } = currentParent;
	$w("#name").value = name;
	$w("#contactNumber").value = phone;
	$w("#emergencyContact1").value = contact1;
	$w("#emergencyContact2").value = contact2;
	$w("#alternateEmail").value = alternateEmail;
	$w("#address").value = address;
	$w("#city").value = city;
	$w("#state").value = state;
	$w("#zipcode").value = zipCode;
};

const getStudentOptions = async () => {
	const options = [];
	let res = null;
	try {
		res = await query("Students").eq("parent", currentParent._id).find();
		if (res.totalCount === 0) throw new Error("No Student Found");
	} catch (error) {
		console.log(error);
	}
	res.items.forEach((student) => {
		options.push({
			label: student.name,
			value: student._id,
		});
	});
	console.log("options", options);
	return options;
};

const validateMember = async () => {
	let res = null;
	try {
		member = await currentMember.getMember();
		if (!member._id) throw new Error("Member Not Found");
		const roles = await currentMember.getRoles();
		if (roles[0].title === "Parent") {
			res = await query("Parents").eq("memberId", member._id).find();
			if (res.totalCount === 0) throw new Error("No Parent Found");
			currentParent = res.items[0];
			console.log("current Parent", currentParent);
		} else {
			res = await query("Coach").eq("memberId", member._id).find();
			if (res.totalCount === 0) throw new Error("No Coach Found");
			currentCoach = res.items[0];
			console.log("current Coach", currentCoach);
		}

		return roles[0].title;
	} catch (error) {
		console.log(error);
		console.log("Redirecting to HomePage");
		to("/");
	}
};
const updateDatabase = async (collectionId, updatedData) => {
	let res = null;
	let existingData = null;
	console.log("Updating Database");
	console.log("Collection", collectionId);
	console.log("Data", updatedData);
	try {
		existingData = await get(collectionId, updatedData._id);
		if (!existingData) throw new Error("Existing Data not Found");
		const toUpdate = {
			...existingData,
			...updatedData,
		};
		res = await update(collectionId, toUpdate);
		if (res) {
			$w("#errorText").text = "Details Updated Successfully.";
		}
	} catch (error) {
		console.log(error);
		$w("#errorText").text = "Something Went Wrong. Please Try Again";
		return;
	}
	$w("#errorText").expand();
};

const getCoachData = () => {
	const name = $w("#name").value;
	const phone = $w("#contactNumber").value;
	const address = $w("#address").value;
	const city = $w("#city").value;
	const state = $w("#state").value;
	const zipCode = $w("#zipcode").value;
	const sports = getSportsData();
	return {
		_id: currentCoach._id,
		name,
		phone,
		address,
		city,
		state,
		zipCode,
		sports,
	};
};
const getParentData = () => {
	const name = $w("#name").value;
	const phone = $w("#contactNumber").value;
	const alternateEmail = $w("#alternateEmail").value;
	const contact1 = $w("#emergencyContact1").value;
	const contact2 = $w("#emergencyContact2").value;
	const address = $w("#address").value;
	const city = $w("#city").value;
	const state = $w("#state").value;
	const zipCode = $w("#zipcode").value;
	return {
		_id: currentParent._id,
		name,
		alternateEmail,
		contact1,
		contact2,
		phone,
		address,
		city,
		state,
		zipCode,
	};
};
const getSportsData = () => {
	const sports = [];
	$w("#sportsRepeater").forEachItem(($item, itemData, index) => {
		sports.push(itemData.sportText);
	});
    return sports
};
const expandCoachFields = () => {
	// Coach Fields
	$w("#coachFormBox").expand();
	// Parent Fields
	$w("#studentFormBox").collapse();
	$w("#emergencyContact1").collapse();
	$w("#emergencyContact2").collapse();
	$w("#alternateEmail").collapse();
};

const expandParentFields = () => {
	// Coach Fields
	$w("#studentFormBox").expand();
	$w("#emergencyContact1").expand();
	$w("#emergencyContact2").expand();
	$w("#alternateEmail").expand();
	// Parent Fields
	$w("#coachFormBox").collapse();
};
