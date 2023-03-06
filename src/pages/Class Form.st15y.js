import wixLocation from "wix-location";
import { authentication } from "wix-members";
import wixData from "wix-data";
import wixWindow from "wix-window";
import { autocomplete, getLatLong } from "backend/googleAPI";

let pickupState;
const currentlySelectedAddress = {
	parkType: "alternate",
	parkAddress: null,
	gMap: null,
};
let queries = {
	mode: null,
	classId: null,
};
let coachesListOptions = [];
// For Development Purpose Only. These values will be fetched from url but editorx preview do not support.
// const pageUrl = "https://pravaah.editorx.io/emhsports/class-form?mode=modeValue&classId=classValue
//  modeValue can be of 1. read , 2. create , 3. edit

$w.onReady(function () {
	// if(!authentication.loggedIn()){
	//     wixLocation.to('/login');
	// }
	queries = wixLocation.query;
	let viewMode = wixWindow.viewMode;
	if (viewMode === "Preview") {
		queries.mode = "edit";
		queries.classId = "49e337fa-422c-46ed-82f0-665a2365f0c2";
	}
	if (!queries) {
		wixLocation.to("/admin-dashboard");
	}
	if (queries.mode === "read") {
		loadFormData(queries.classId);
		makeFormReadOnly();
	} else if (queries.mode === "edit") {
		loadFormData(queries.classId);
		$w("#message").text = "Class Updated Successfully";
		$w("#createClassButton").label = "Update Class";
	}

	// Repeaters OnItem Ready

	$w("#parkHistoryRepeater").onItemReady(($item, itemData, index) => {
		$item("#parkHistory").text = itemData.parkHistory;
	});

	$w("#timeSlotRepeater").onItemReady(($item, itemData, index) => {
		$item("#selectedTime").text = `Months:-${getMonthName(itemData.month)} | ${itemData.timeSlot}`;
		$item("#deleteTimeSlot").onClick(() => {
			deleteTimeSlotHandler(itemData._id);
		});
	});

	$w("#packageRepeater").onItemReady(($item, itemData, index) => {
		$item("#packageName").value = itemData.packageName;
		$item("#packagePrice").value = itemData.packageCost;
		$item("#packageDescription").value = itemData.packageDescription;
		$item("#removePackage").onClick(() => {
			removePackageHandler(itemData._id);
		});
	});

	$w("#repeaterSuggestion").onItemReady(($item, itemData, i) => {
		$item("#name").text = itemData.address;
		$item("#addressItem").onClick(async (event) => {
			pickupState = itemData.state;
			$w("#queryLocation").value = $item("#name").text;
			const data = await getLatLong(itemData.place_id);
			const lat = data.results[0].geometry.location.lat;
			const long = data.results[0].geometry.location.lng;
			const src = `<iframe src='https://maps.google.com/maps?q=${lat},${long}&hl=es;z=14&amp;output=embed' width='400' height='300' style='border:0;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe>`;
			currentlySelectedAddress.parkAddress = itemData.address;
			currentlySelectedAddress.gMap = src;
			$w("#googleMap").postMessage(src);
			$w("#addAddress").enable();
			$w("#repeaterSuggestion").collapse();
		});
	});
	$w("#addressRepeater").onItemReady(($item, itemData, index) => {
		$item("#address").text = itemData.parkAddress;
		if (itemData.parkType === "primary") {
			$item("#isPrimary").checked = true;
		} else {
			$item("#isPrimary").checked = false;
		}
		$item("#isPrimary").onClick(() => {
			makePrimaryHandler(itemData._id);
		});
		$item("#removeAddressButton").onClick(() => {
			removeAddressHandler(itemData._id);
		});
	});
	// Attaching event handlers to elements

	$w("#addTimeSlot").onClick(addTimeSlotHandler);
	$w("#classType").onChange(classTypeChangeHandler);
	$w("#createClassButton").onClick(createClassHandler);
	$w("#addPackage").onClick(addPackageHandler);
	$w("#addAddress").onClick(addAddressHandler);
	$w("#queryLocation").onInput(queryLocationHandler);
	$w("#backToDashboardButton").onClick(() => {
		wixLocation.to("admin-dashboard");
	});
	$w("#backButton").onClick(() => {
		wixLocation.to("admin-dashboard");
	});

	// Resetting Repeaters
	$w("#timeSlotRepeater").data = [];
	$w("#addressRepeater").data = [];
	$w("#parkHistoryRepeater").data = [];

	// Loading Coach Data.
	getCoachData();
});

// Event Handlers
const removeAddressHandler = (id) => {
	const repeaterData = $w("#addressRepeater").data;
	const filteredData = repeaterData.filter((el) => el._id !== id);
	$w("#addressRepeater").data = filteredData;
};
const makePrimaryHandler = (id) => {
	const repeaterData = $w("#addressRepeater").data;
	$w("#addressRepeater").data = [];
	repeaterData.forEach((el) => {
		if (el._id === id) {
			el.parkType = "primary";
			return;
		} else {
			el.parkType = "alternate";
		}
	});
	$w("#addressRepeater").data = repeaterData;
};

const queryLocationHandler = () => {
	$w("#addAddress").disable();
	autocomplete($w("#queryLocation").value).then((res) => {
		let predictions = res.predictions; // For simplicity we put the predictions in a new variable
		let suggestions = []; // We should create an empty array for the suggestions
		predictions.forEach(function (prediction) {
			let item = {
				_id: Math.floor(Math.random() * 100000).toString(),
				address: prediction.description,
				place_id: prediction.place_id,
				state: prediction.terms[1]?.value,
			};
			suggestions.push(item);
		});

		$w("#repeaterSuggestion").data = []; // clear the repeater contents
		$w("#repeaterSuggestion").data = suggestions; // add the new suggestions to the repeater
		$w("#repeaterSuggestion").expand(); // Repeater is full now, let's show it.
	});
};

const addAddressHandler = () => {
	$w("#queryLocation").value = "";
	const repeaterData = $w("#addressRepeater").data;
	repeaterData.push({
		_id: Math.floor(Math.random() * 10000).toString(),
		...currentlySelectedAddress,
	});
	$w("#addressRepeater").data = repeaterData;
	$w("#addAddress").disable();
};

const addTimeSlotHandler = () => {
	const isInputValid = timeSlotInputValidator();
	if (!isInputValid) return;
	const shortTime = new Intl.DateTimeFormat("en", { timeStyle: "short" });
	const [startHour, startMintute] = $w("#fromTime").value.slice(0, 5).split(":");
	const [endHour, endMintute] = $w("#toTime").value.slice(0, 5).split(":");
	const startTime = new Date();
	startTime.setHours(parseInt(startHour));
	startTime.setMinutes(parseInt(startMintute));
	const startTimeString = shortTime.format(startTime);
	const endTime = new Date();
	endTime.setHours(parseInt(endHour));
	endTime.setMinutes(parseInt(endMintute));
	if (startTime > endTime) {
		console.log("From Time should be less than to time");
		$w("#fromTime").focus();
		return;
	}
	const endTimeString = shortTime.format(endTime);
	const day = $w("#day").value;
	const month = $w("#month").value;
	let monthDates = getAllDays(month, day);
	monthDates = monthDates.slice(0, 4);
	const repeaterData = $w("#timeSlotRepeater").data;
	let monthDatesString = "";
	monthDates.forEach((el) => {
		monthDatesString += `${el.date} | `;
	});
	let assignedCoachId = null;
	try {
		if ($w("#selectCoach").value === "null") {
			throw new Error("Coach is not assigned to a slot");
		} else {
			assignedCoachId = $w("#selectCoach").value;
		}
	} catch (error) {
		console.log(error);
		return;
	}

	repeaterData.push({
		_id: `${month}${day}${startHour}${startMintute}${endHour}${endMintute}`,
		timeSlot: `Time Slot:-${startTimeString} - ${endTimeString} | Day:- ${getDayName(day)} | Date:- ${monthDatesString}`,
		startTime: startTimeString,
		endTime: endTimeString,
		day,
		monthDates,
		month,
		assignedCoachId,
	});
	repeaterData.sort((a, b) => (a._id > b._id ? 1 : b._id > a._id ? -1 : 0));
	$w("#timeSlotRepeater").data = repeaterData;
	console.log(timeSlotRepeaterValidator());
};
const deleteTimeSlotHandler = (id) => {
	const repeaterData = $w("#timeSlotRepeater").data;
	const filteredData = repeaterData.filter((el) => el._id !== id);
	$w("#timeSlotRepeater").data = filteredData;
};

const classTypeChangeHandler = () => {
	if ($w("#classType").value === "Virtual") {
	}
};

const addPackageHandler = () => {
	// Removing previous error
	$w("#packageError").collapse();

	// Checking repeater for invalid values;
	let error = packageRepeaterValidator();

	if (error) {
		$w("#packageError").text = "Field Missing";
		$w("#packageError").expand();
	} else {
		const repeaterData = $w("#packageRepeater").data;
		repeaterData.push({ _id: `${repeaterData.length + 1}` });
		$w("#packageRepeater").data = repeaterData;
		$w("#packageName").resetValidityIndication();
		$w("#packageDescription").resetValidityIndication();
		$w("#packagePrice").resetValidityIndication();
	}
};
const removePackageHandler = (id) => {
	const repeaterData = $w("#packageRepeater").data;
	const filteredData = repeaterData.filter((el) => el._id !== id);
	$w("#packageRepeater").data = filteredData;
};

const createClassHandler = () => {
	const errors = [];
	errors.push(...inputValidator(), timeSlotRepeaterValidator(), ...packageRepeaterValidator(), ...addressRepeaterValidator());
	console.log({ errors });
	let allErrorText = "";
	errors.forEach((el) => {
		if (el || el.length !== 0) {
			allErrorText += `${el}\n`;
		}
	});
	console.log({ allErrorText });
	if (allErrorText.length > 0) {
		$w("#allErrors").text = allErrorText;
		$w("#allErrors").expand();
	} else {
		console.log("Logging Form Data");
		console.log(getFormData());
		const allCoachIds = getAllCoaches();
		const toInsert = getFormData();
		if (queries.mode === "edit") {
			toInsert._id = queries.classId;
			wixData
				.update("Classes", toInsert)
				.then((res) => {
					wixData
						.insertReference("Classes", "coach", res._id, [...allCoachIds])
						.then(() => {
							console.log("Reference Inserted");
						})
						.catch((err) => {
							console.log(err);
						});
					console.log("Success Msg");
					$w("#messageContainer").expand();
					$w("#formContainer").collapse();
				})
				.catch((err) => {
					console.log(err);
					$w("#message").text = "Something Went Wrong";
					$w("#messageContainer").expand();
					$w("#formContainer").collapse();
				});
		} else if (queries.mode === "create") {
			wixData
				.insert("Classes", toInsert)
				.then((res) => {
					wixData
						.insertReference("Classes", "coach", res._id, [...allCoachIds])
						.then(() => {
							console.log("Reference Inserted");
						})
						.catch((err) => {
							console.log(err);
						});
					console.log("Success Msg");
					$w("#messageContainer").expand();
					$w("#formContainer").collapse();
				})
				.catch((err) => {
					console.log(err);
					wixWindow.scrollTo(0,0);
					$w("#message").text = "Something Went Wrong";
					$w("#messageContainer").expand();
					$w("#formContainer").collapse();
				});
		}
	}
};

// Custom Functions

const getInputPackages = () => {
	const classPackage = [];
	$w("#packageRepeater").forEachItem(($item, itemData, index) => {
		classPackage.push({
			name: $item("#packageName").value,
			cost: $item("#packagePrice").value,
			description: $item("#packageDescription").value,
		});
	});
	return classPackage;
};

const getInputTimeSlot = () => {
	const timeSlots = [];
	$w("#timeSlotRepeater").forEachItem(($item, itemData, index) => {
		timeSlots.push({
			_id: itemData._id,
			month: itemData.month,
			day: itemData.day,
			startTime: itemData.startTime,
			endTime: itemData.endTime,
			monthDates: itemData.monthDates,
			assignedCoachId: itemData.assignedCoachId,
		});
	});
	return timeSlots;
};

const formatDataForAddressRepeater = (address) => {
	const formattedData = [];
	address.forEach((el) => {
		formattedData.push({
			_id: Math.floor(Math.random() * 10000).toString(),
			parkType: el.parkType,
			parkAddress: el.parkAddress,
			gMap: el.gMap,
		});
	});
	return formattedData;
};

const formatDataForTimeSlotRepeater = (timeSlot) => {
	const formattedData = [];
	timeSlot.forEach((el) => {
		let id = null;
		if (el._id) {
			id = el._id;
		} else {
			id = Math.floor(Math.random() * 10000).toString();
		}
		let monthDates = "";
		if (el.monthDates && el.monthDates?.length > 0) {
			el.monthDates.forEach((el) => {
				monthDates += `${el.date} | `;
			});
		}
		let monthDatesString = ` | Date:- ${monthDates}`;
		if (monthDates.length === 0) {
			monthDatesString = "";
		}
		formattedData.push({
			_id: id,
			timeSlot: `Time Slot:-${el.startTime} - ${el.endTime} | Day:- ${getDayName(el.day)} ${monthDatesString}`,
			startTime: el.startTime,
			endTime: el.endTime,
			day: el.day,
			monthDates: el.monthDates,
			month: el.month,
		});
	});
	return formattedData;
};

const formatDataForPackageRepater = (classPackage) => {
	const formattedData = [];
	classPackage.forEach((el) => {
		formattedData.push({
			_id: Math.floor(Math.random() * 10000).toString(),
			packageName: el.name,
			packageCost: el.cost,
			packageDescription: el.description,
		});
	});
	return formattedData;
};

const formatDataForParkHistoryRepeater = (parkHistory) => {
	const formattedData = [];
	parkHistory.forEach((el) => {
		console.log({ el });
		formattedData.push({
			_id: Math.floor(Math.random() * 10000).toString(),
			timeStamp: el.timeStamp,
			parkHistory: el.parkHistory,
		});
	});
	return formattedData;
};

const inputValidator = () => {
	const error = [];
	if ($w(`#city`).value === "") {
		const label = $w(`#city`).label;
		error.push(`${label} is Required`);
	}
	if ($w(`#county`).value === "") {
		const label = $w(`#county`).label;
		error.push(`${label} is Required`);
	}
	if ($w(`#state`).value === "") {
		const label = $w(`#state`).label;
		error.push(`${label} is Required`);
	}
	if ($w(`#parkName`).value === "") {
		const label = $w(`#parkName`).label;
		error.push(`${label} is Required`);
	}
	if ($w(`#instruction`).value === "") {
		const label = $w(`#instruction`).label;
		error.push(`${label} is Required`);
	}
	if ($w(`#notice`).value === "") {
		const label = $w(`#notice`).label;
		error.push(`${label} is Required`);
	}
	if ($w(`#parkHistoryInput`).value === "") {
		const label = $w(`#parkHistoryInput`).label;
		error.push(`${label} is Required`);
	}
	return error;
};

const timeSlotInputValidator = () => {
	let error = "";
	if ($w("#month").value === "") {
		error += `${$w("#month").label} is required`;
	}
	if ($w("#day").value === "") {
		error += `${$w("#day").label} is required`;
	}
	if ($w("#fromTime").value === "") {
		error += `Start time is required`;
	}
	if ($w("#fromTime").value === "") {
		error += `End time is required`;
	}
	if ($w("#selectCoach").value === "null" || $w("#selectCoach").value === "") {
		error += `Coach is Required`;
	}
	if (error === "") {
		return true;
	} else {
		return false;
	}
};
const addressRepeaterValidator = () => {
	let error = "";
	if ($w("#classType").value === "virtual") return error;
	if ($w("#addressRepeater").data.length === 0) {
		error += "No Address found";
	}
	let isPrimaryPresent = false;
	$w("#addressRepeater").forEachItem(($item, itemData, index) => {
		if (itemData.parkType === "primary") isPrimaryPresent = true;
	});
	if (!isPrimaryPresent) {
		error += "Primary Park Address is required";
	}
	return error;
};
const timeSlotRepeaterValidator = () => {
	let error = "";
	let months = [9, 10, 11, 12, 1, 2, 3, 4, 5];
	$w("#timeSlotRepeater").forEachItem(($item, itemData, index) => {
		let isMonthPresent = false;
		let month = null;
		months.forEach((el) => {
			if (el === parseInt(itemData.month)) {
				isMonthPresent = true;
				month = el;
			}
		});
		if (isMonthPresent) {
			months = months.filter((el) => el !== month);
		}
	});
	if (months.length !== 0) {
		months.forEach((el) => {
			error += `${getMonthName(el)} is not present\n`;
		});
	}
	return error;
};

const packageRepeaterValidator = () => {
	let error = "";
	$w("#packageRepeater").forEachItem(($item, itemData, index) => {
		if ($item("#packageName").value == "" || $item("#packageDescription").value === "" || $item("#packagePrice").value === "") {
			error = "Package details are not correct";
			return;
		}
	});
	return error;
};

const loadFormData = (classId) => {
	wixData
		.get("Classes", classId)
		.then((classData) => {
			console.log({ classData });
			$w("#city").value = classData.city;
			$w("#county").value = classData.county;
			$w("#state").value = classData.state;
			$w("#parkName").value = classData.parkName;
			if (classData.classType === "PE") {
				$w("#classType").selectedIndex = 0;
			} else {
				$w("#classType").selectedIndex = 1;
			}
			if (classData.status === "Active") {
				$w("#classStatus").selectedIndex = 0;
			} else {
				$w("#classStatus").selectedIndex = 1;
			}
			$w("#timeSlotRepeater").data = formatDataForTimeSlotRepeater(classData.timeslot);
			$w("#addressRepeater").data = formatDataForAddressRepeater(classData.formattedAddress);
			$w("#instruction").value = classData.instruction;
			$w("#notice").value = classData.notice;
			if (classData.classHistory) {
				$w("#parkHistoryRepeater").data = formatDataForParkHistoryRepeater(classData.classHistory);
			}
			const packageRepeaterData = formatDataForPackageRepater(classData.package);
			$w("#packageRepeater").data = packageRepeaterData;
			if (classData.classType === "virtual") {
				disableFiledsNotRequiredForVirtualClass();
			}
		})
		.catch((err) => {
			console.log(err);
		});
};
const makeFormReadOnly = () => {
	$w(`#city`).disable();
	$w(`#county`).disable();
	$w(`#state`).disable();
	$w(`#parkName`).disable();
	$w(`#addTimeSlot`).disable();
	$w(`#classType`).disable();
	$w(`#classStatus`).disable();
	$w(`#month`).disable();
	$w(`#day`).disable();
	$w(`#fromTime`).disable();
	$w(`#toTime`).disable();
	$w(`#deleteTimeSlot`).disable();
	$w(`#addAddress`).disable();
	$w(`#instruction`).disable();
	$w(`#notice`).disable();
	$w(`#parkHistoryInput`).disable();
	$w(`#packageName`).disable();
	$w(`#packageDescription`).disable();
	$w(`#packagePrice`).disable();
	$w(`#removePackage`).disable();
	$w(`#addPackage`).disable();
	$w("#createClassButton").collapse();
};

const getFormData = () => {
	const city = $w("#city").value;
	const county = $w("#county").value;
	const state = $w("#state").value;
	const parkName = $w("#parkName").value;
	const classType = $w("#classType").value;
	const classStatus = $w("#classStatus").value;
	const timeSlot = getInputTimeSlot();
	const formattedAddress = getParkAddress();
	const instruction = $w("#instruction").value;
	const notice = $w("#notice").value;
	const parkHistory = getParkHistory();
	const classPackage = getInputPackages();
	const classData = {
		parkName,
		title: parkName,
		package: classPackage,
		city,
		county,
		state,
		timeslot: timeSlot,
		classType,
		status: classStatus,
		formattedAddress,
		instruction,
		notice,
		classHistory: [...parkHistory],
	};
	return classData;
};

const disableFiledsNotRequiredForVirtualClass = () => {
	$w(`#city`).disable();
	$w(`#county`).disable();
	$w(`#state`).disable();
};
export const getAllDays = (currentMonthText, daytext) => {
	let day = parseInt(daytext);
	let currentMonth = parseInt(currentMonthText);
	let year = new Date().getFullYear();
	if (currentMonth === 9 || currentMonth === 10 || currentMonth === 11 || currentMonth === 12) {
		year = year - 1;
	}
	let d = new Date(`${currentMonth}/01/${year}`);

	let month = d.getMonth();
	let dates = [];

	d.setDate(1);

	// Get the first Monday in the month
	while (d.getDay() !== day) {
		d.setDate(d.getDate() + 1);
	}

	// Get all the other Mondays in the month
	while (d.getMonth() === month) {
		dates.push({
			_id: (Math.floor(Math.random() * (1000 - 0 + 1)) + 0).toString(),
			date: new Date(d.getTime()).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "2-digit",
			}),
		});
		d.setDate(d.getDate() + 7);
	}

	return dates;
};

const getDayName = (day) => {
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	return days[parseInt(day)];
};

const getMonthName = (month) => {
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	return months[parseInt(month) - 1];
};

const getParkHistory = () => {
	const parkHistory = [];
	$w("#parkHistoryRepeater").forEachItem(($item, itemData, index) => {
		parkHistory.push({
			timeStamp: itemData.timeStamp,
			parkHistory: itemData.parkHistory,
		});
	});
	parkHistory.push({
		timeStamp: new Date().toISOString(),
		parkHistory: $w("#parkHistoryInput").value,
	});
	return parkHistory;
};

const getParkAddress = () => {
	const parkAddress = [];
	$w("#addressRepeater").forEachItem(($item, itemData, index) => {
		parkAddress.push({
			parkType: itemData.parkType,
			parkAddress: itemData.parkAddress,
			gMap: itemData.gMap,
		});
	});
	return parkAddress;
};

const getCoachData = async () => {
	let res = null;
	try {
		res = await wixData.query("Coach").find();
		if (res.totalCount === 0) throw new Error("Unable to get data from database");
		res.items.forEach((el) => {
			coachesListOptions.push({
				label: el.name,
				value: el._id,
			});
		});
		$w("#selectCoach").options = coachesListOptions;
	} catch (error) {
		coachesListOptions.push({
			label: "No Coach Found",
			value: "No Coach Found",
		});
		$w("#selectCoach").options = coachesListOptions;
		console.log(error);
	}
};

const getAllCoaches = () => {
	const timeSlot = getInputTimeSlot();
	let allCoachIds = [];
	timeSlot.forEach((el) => {
		allCoachIds.push(el.assignedCoachId);
	});
	return allCoachIds;
};
