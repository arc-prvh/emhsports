// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import wixData from "wix-data";
import wixLocation from "wix-location";
import { currentMember, authentication } from "wix-members";
import { local } from "wix-storage";
import wixWindow from "wix-window";
import wixData from "wix-data";
import wixLocation from "wix-location";
import { currentMember, authentication } from "wix-members";
import { local } from "wix-storage";
import wixWindow from "wix-window";

/* -------------------------------Constants Start ---------------------------------------- */
// --- Message Constants ---
const searchingClassesMessage = "Searching classes . . .";
const noClassFoundMessage = "Oops !! No Classes Found. Try different filter.";
const loadingStudentsMessage = "Loading Students . . .";
const noStudentFoundMessage = "​No Student Profile Found !!";

// --- Colour Constants ---
const studentCardMouseInColour = "#FF4040"; // red (same as button)
const studentCardMouseOutColour = "#FFFFFF"; // White
const studentCardSelectedColour = "#FF4040"; // red (same as button)
const studentCardNotSelectedColour = "#FFFFFF"; //White

// --- Colour Constants ---
const textHeadingHtmlNormal = (text) => `<p class="p1"><span>${text}</span></p>`;
const textHtmlNormal = (text) => `<p>${text}</p>`;

const textHeadingHtmlOnHoverAndSelected = (text) => `<p class="p1" style='color:white'><span>${text}</span></p>`;
const textHtmlOnHoverAndSelected = (text) => `<p style='color:white'>${text}</p>`;

// Cart status constants
const inCart = "InCart"; // AP Form is in cart
const paid = "Paid"; // Parents has paid for the class
const underReview = "UnderReview"; // Parents requested for school to pay, but admin hasn't approved yet
const approved = "Approved"; // Request for school payment is approved
const rejected = "Rejected"; // Request for school payment is rejected

// AP form status constant
const active = "Active";
const expired = "Expired";

/* -------------------------------Constants End ------------------------------------------ */

let selectedClass = null;
let selectedPackage = null;
let selectedStudent = null;
let selectedTimeslot = null;

// Below two declarations are dependent, if modifying anyone be careful
let selectedMonth = null; // Months selected in moreInfo page
const selectedClassMonthsData = []; // Array to store class and single month selected in more info page

let renderedStudentsData = []; // This is required only for color change onClick on students in selectStudentState
let currentMemberId = null;

/**
 * * * * * Convention for defining functions * * * * *
 * Below onReady function all the utility function is defined
 * After that all the event functions are defined or wix generated
 * two new line between separate functions
 */

$w.onReady(function () {
	if (authentication.loggedIn()) {
		currentMember.getMember().then((member) => {
			currentMemberId = member._id;
		});
	}

	// checking if we are coming back from cart
	selectedStudent = JSON.parse(local.getItem("selectedStudents")) || null;
	selectedClass = JSON.parse(local.getItem("selectedClass")) || null;
	selectedPackage = JSON.parse(local.getItem("selectedPackage")) || null;
	selectedMonth = JSON.parse(local.getItem("selectedMonth")) || null;
	const isBackFromCart = local.getItem("isBackFromCart") || null;

	if (isBackFromCart === "true") {
		console.log("Back From Cart");
		if (selectedStudent !== null && selectedClass !== null && selectedPackage !== null && selectedMonth !== null) {
			performStudentStateRequiredChanges(selectedPackage);
			$w("#stateBox").changeState("selectStudentState");
			local.removeItem("isBackFromCart");
		} else {
			console.log("Data in local storage not found");
		}
	}

	$w("#noStudentProfileErrorMessage").text = loadingStudentsMessage;

	$w("#classRepeater").onItemReady(($item, itemData, index) => {
		$item("#parkName").text = itemData.parkName;
		$item("#timeSlot").text = `${itemData.timeslot[0].startTime} - ${itemData.timeslot[0].endTime}`;
		if (itemData.classType === "PE") {
			$item("#city").text = itemData.city;
			$item("#address").text = itemData.formattedAddress[0].parkAddress;
		}
		// $item('#statusIcon').text = itemData.status;
		$item("#moreInfo").onClick(() => {
			if (itemData.classType === "PE") {
				$w("#stateBox").changeState("moreInfoState");
				fillMoreInfoData(itemData);
			}
			if (itemData.classType === "virtual") {
				$w("#stateBox").changeState("virtualMoreInfoState");
				fillVirtualMoreInfoData(itemData);
			}
		});
		if (itemData.classType === "virtual") {
			$item("#city").collapse();
			$item("#address").collapse();
			$item("#cityText").collapse();
			$item("#addressText").collapse();
			$item("#parkNameText").text = "Class Name";
		} else {
			$item("#cityText").expand();
			$item("#addressText").expand();
			$item("#parkNameText").text = "Park Name";
		}
	});

	$w("#packageRepeater").onItemReady(($item, itemData, index) => {
		$item("#packageName").text = itemData.name;
		$item("#packageDescription").text = itemData.description;
		$item("#packageCost").text = "$ " + itemData.cost;
		$item("#selectPackage").onClick((e) => {
			performStudentStateRequiredChanges(itemData);
		});
	});
	$w("#virtualPackageRepeater").onItemReady(($item, itemData, index) => {
		$item("#virtualPackageName").text = itemData.name;
		$item("#virtualPackageDescription").text = itemData.description;
		$item("#virtualPackageCost").text = "$ " + itemData.cost;
		$item("#virtualSelectPackage").onClick((e) => {
			performStudentStateRequiredChanges(itemData);
		});
	});
	$w("#studentRepeater").onItemReady(($item, itemData, index) => {
		$item("#studentName").text = itemData.name;
		$item("#studentGrade").text = itemData.grade;
		$item("#studentCard").style.backgroundColor = itemData.bgColour;
		$item("#studentCard").onMouseIn((e) => {
			if (!itemData.isSelected) {
				$item("#studentNameHeading").html = textHeadingHtmlOnHoverAndSelected("Name");
				$item("#studentGradeHeading").html = textHeadingHtmlOnHoverAndSelected("Grade");
				$item("#studentGrade").html = textHtmlOnHoverAndSelected(`${itemData.grade}`);
				$item("#studentName").html = textHtmlOnHoverAndSelected(`${itemData.name}`);

				$item("#studentCard").style.backgroundColor = studentCardMouseInColour;
			}
		});
		$item("#studentCard").onMouseOut((e) => {
			if (!itemData.isSelected) {
				$item("#studentNameHeading").html = textHeadingHtmlNormal("Name");
				$item("#studentGradeHeading").html = textHeadingHtmlNormal("Grade");
				$item("#studentGrade").html = textHtmlNormal(`${itemData.grade}`);
				$item("#studentName").html = textHtmlNormal(`${itemData.name}`);

				$item("#studentCard").style.backgroundColor = studentCardMouseOutColour;
			}
		});
	});

	$w("#addressRepeater").onItemReady(($item, itemData, index) => {
		$item("#parkAddress").text = itemData.parkAddress;
		if (index == 0) {
			$item("#primaryText").text = "Primary";
		} else {
			$item("#primaryText").text = "Alternate";
		}
		$item("#parkAddress").onClick(() => {
			$w("#googleMap").postMessage(itemData.gMap);
		});
		$item("#addressCard").onMouseIn((e) => {
			if (!itemData.isSelected) {
				$item("#parkAddress").html = textHtmlNormal(`${itemData.parkAddress}`);
				$item("#addressCard").style.backgroundColor = studentCardMouseInColour;
			}
		});
		$item("#addressCard").onMouseOut((e) => {
			if (!itemData.isSelected) {
				$item("#parkAddress").html = textHtmlNormal(`${itemData.parkAddress}`);
				$item("#addressCard").style.backgroundColor = studentCardMouseOutColour;
			}
		});
	});

	$w("#virtualScheduleRepeater").onItemReady(($item, itemData, index) => {
		$item("#virtualClassSchedule").text = itemData.date;
	});

	$w("#selectedMonth").onItemReady(($item, itemData, index) => {
		$item("#month").text = `${getMonthName(itemData.month)} (${itemData.startTime}-${itemData.endTime})`;
		$item("#removeMonth").onClick(() => {
			removeMonthHandler(itemData._id);
		});
	});

	$w("#virtualSelectedMonth").onItemReady(($item, itemData, index) => {
		$item("#virtualMonth").text = `${getMonthName(itemData.month)} (${itemData.startTime}-${itemData.endTime})`;
		$item("#virtualRemoveMonth").onClick(() => {
			virtualRemoveMonthHandler(itemData._id);
		});
	});

	$w("#timeSlotRepeater").onItemReady(($item, itemData, index) => {
		$item("#availableTimeSlot").text = `${itemData.startTime} - ${itemData.endTime}`;
		$item("#availableTimeSlot").onClick(() => {
			addTimeSlotHandler(itemData);
		});
	});

	$w("#virtualTimeSlotRepeater").onItemReady(($item, itemData, index) => {
		$item("#virtualAvailableTimeSlot").text = `${itemData.startTime} - ${itemData.endTime}`;
		$item("#virtualAvailableTimeSlot").onClick(() => {
			addVirtualTimeSlotHandler(itemData);
		});
	});

	wixData
		.query("Classes")
		.eq("status", "Active")
		.eq("classType", "PE")
		.find()
		.then((res) => {
			const classData = formatDataforRepeater(res);

			$w("#classRepeater").data = classData;
			$w("#classRepeater").expand();
			$w("#searchPageResultStatus").collapse();
		})
		.catch((err) => {
			console.log("Error in finding classes : ", err);
		});

	// City Dropdown Set
	wixData
		.query("Classes")
		.find()
		.then((res) => {
			const cityOption = [
				{
					label: "Clear",
					value: "Clear",
				},
			];
			for (const classData of res.items) {
				if (classData.city)
					cityOption.push({
						label: `${classData.city} , ${classData.state}`,
						value: classData.city,
					});
			}
			$w("#cityDropdown").options = cityOption;
		});
	$w("#classTypePhysical").onClick(() => {
		if ($w("#classTypePhysical").checked) {
			$w("#classTypeVirtual").checked = false;
		}
		if (!$w("#classTypePhysical").checked) {
			$w("#classTypeVirtual").checked = true;
		}
	});
	$w("#classTypeVirtual").onClick(() => {
		if ($w("#classTypeVirtual").checked) {
			$w("#classTypePhysical").checked = false;
		}
		if (!$w("#classTypeVirtual").checked) {
			$w("#classTypePhysical").checked = true;
		}
	});

	// $w("#addMonth").onClick(addTimeSlotHandler);
	// $w("#virtualAddMonth").onClick(virtualAddMonthHandler);
	$w("#datePicker").onChange(datePickerChangeHandler);
	$w("#virtualDatePicker").onChange(virtualDatePickerChangeHandler);

	// Resetting the repeater to get rid of initial value.
	$w("#selectedMonth").data = [];
	$w("#virtualSelectedMonth").data = [];
	$w("#timeSlotRepeater").data = [];

	// Setting the value of drop down month according to current month.
	$w("#monthDropDown").options = getMonthOptions();
	$w("#monthDropDown").selectedIndex = 0;
	$w("#virtualMonthDropDown").options = getMonthOptions();
	$w("#virtualMonthDropDown").selectedIndex = 0;
});

function formatDataforRepeater(data) {
	const classData = [];
	const classes = data.items;
	for (const classInfo of classes) {
		// const timeSlot = 'Under Development'
		classData.push({
			...classInfo,
			timeSlot: `${classInfo.startTime} - ${classInfo.endTime}`,
			location: classInfo.parkAddress,
		});
	}
	return classData;
}

// Todo: timeslot development
function formatTimeslot(slots) {
	if (Array.isArray(slots)) {
		return [];
	}
}

function arrayToString(array) {
	let result = "";
	if (array && array.length) {
		result = array[0];

		for (let i = 1; i < array.length; i++) {
			result = result + ", " + array[i];
		}
	}
	return result;
}

// Todo : Fix schedule timeslot
function fillMoreInfoData(classData) {
	let timeslot = classData.timeslot[0];
	selectedClass = classData;
	console.log("class Data", { classData });
	if (classData.classType === "virtual") {
		$w("#googleMap").collapse();
		$w("#addressRepeater").collapse();
		$w("#sportName").collapse();
		$w("#mapText").collapse();
	}
	$w("#titleText").text = classData.parkName;
	$w("#instructions").text = classData.instruction;
	$w("#timeslotPE").text = getTimeSlotInString($w("#monthDropDown").value);

	$w("#monthDropDown").onChange(() => {
		$w("#noMonthSelectedMsg").collapse();
		$w("#sportName").text = getSportName($w("#monthDropDown").value);

		$w("#timeslotPE").text = getTimeSlotInString($w("#monthDropDown").value);
	});
	// Enabling the dates in date picker.
	$w('#datePicker').enabledDateRanges = renderAvailableDates();

	if (classData.classType === "PE") {
		$w("#sportName").text = getSportName($w("#monthDropDown").value);
		$w("#sportName").expand();
		$w("#addressRepeater").data = formatDataForAddressRepeater(classData.formattedAddress);
		$w("#googleMap").postMessage(classData.formattedAddress[0].gMap);
	}

	if (classData.status === "Active") {
		$w("#addToWishlist").collapse();
	} else {
		$w("#addToWishlist").expand();
		$w("#selectPackage").collapse();
	}

	// Checking is the class is already in wishlist.
	isAlreadyInWishlist(classData._id);

	$w("#addToWishlist").onClick(() => {
		addToWishlistHandler(classData._id);
	});

	const packageData = [];

	classData.package.forEach((el) => {
		packageData.push({ _id: el.name, ...el });
	});

	/* Repeater Information */
	/*  
        _id is required for rendering data in repeater
        only a change in _id will re-render repeater's data, to change data use forEachItem()
        Never use underscore, space in _id for repeater, I learned after spending, 1-2 hour, you are getting for free
    */
	$w("#packageRepeater").data = packageData;
}

// Todo : Fix Timeslot schedule
function fillVirtualMoreInfoData(classData) {
	selectedClass = classData;
	console.log('Selected class',selectedClass);

	$w("#titleText").text = classData.parkName;
	$w("#virtualInstruction").text = classData.instruction;
	$w("#timeslotVirtual").text = getTimeSlotInString($w("#virtualMonthDropDown").value);
	$w("#virtualMonthDropDown").onChange(() => {
		$w("#noVirtualMonthSelectedMsg").collapse();
		$w("#timeslotVirtual").text = getTimeSlotInString($w("#virtualMonthDropDown").value);
	});
	$w('#virtualDatePicker').enabledDateRanges = renderAvailableDates();
	if (classData.status === "Active") {
		$w("#virtualAddToWishlist").collapse();
	} else {
		$w("#virtualAddToWishlist").expand();
	}

	// Checking is the class is already in wishlist.
	isAlreadyInWishlist(classData._id);

	$w("#virtualAddToWishlist").onClick(() => {
		addToWishlistHandler(classData._id);
	});

	const packageData = [];

	classData.package.forEach((el) => {
		packageData.push({ _id: el.name, ...el });
	});
	$w("#virtualPackageRepeater").data = packageData;
}

async function renderStudentsList() {
	let currentUserWixid = await setCurrentUserWixId();
	if (!currentUserWixid) console.log("Some error occured in recognising logged in user");
	else {
		await wixData
			.query("Students")
			.eq("parent", currentUserWixid)
			.find()
			.then((res) => {
				if (res.length == 0) {
					$w("#noStudentProfileErrorMessage").text = noStudentFoundMessage;
					$w("#noStudentProfileErrorMessage").show();
				} else {
					let studentRepeaterData = formatResponseForDefaultStudentRepeater(res);
					renderedStudentsData = studentRepeaterData;
					$w("#studentRepeater").data = studentRepeaterData;
					$w("#studentRepeater").expand();
					$w("#noStudentProfileErrorMessage").hide();
				}
			})
			.catch((err) => {
				console.log("Error in finding student : ", err);
			});
	}
}

function formatResponseForDefaultStudentRepeater(data) {
	let students = data.items;
	const studentData = [];

	// to give color change effect on student card click
	for (const student of students) {
		studentData.push({
			...student,
			grade: student.gradeLevel,
			bgColour: studentCardNotSelectedColour,
			isSelected: false,
			nameHeadingHtml: textHeadingHtmlNormal("Name"),
			gradeHeadingHtml: textHeadingHtmlNormal("Grade"),
			nameValueHtml: textHtmlNormal(student.name),
			gradeValueHtml: textHtmlNormal(student.gradeLevel),
		});
	}
	return studentData;
}

async function setCurrentUserWixId() {
	const options = {
		fieldsets: ["FULL"],
	};
	let currentUserWixid = null;
	await currentMember
		.getMember(options)
		.then(async (member) => {
			await wixData
				.query("Parents")
				.eq("memberId", member._id)
				.find()
				.then((parent) => {
					currentUserWixid = parent.items[0]._id;
				})
				.catch((err) => {
					console.log("Error in finding parent wix id", err);
				});
		})
		.catch((error) => {
			console.error("Error in getting current user email", error);
		});
	return currentUserWixid;
}

async function performStudentStateRequiredChanges(packageName) {
	selectedPackage = packageName;
	selectedTimeslot = $w("#timeSlot").text;
	if (!selectedMonth || selectedMonth.length === 0) {
		if (selectedClass.classType === "PE") {
			$w("#noMonthSelectedMsg").expand();
		} else {
			$w("#noVirtualMonthSelectedMsg").expand();
		}
		return;
	}

	for (const month of selectedMonth) {
		selectedClassMonthsData.push({
			class: selectedClass._id,
			selectedMonths: month,
			timeslot: getTimeSlotByMonth(selectedClass.timeslot, month),
			selectedPackage: selectedPackage,
			status: inCart,
		});
	}

	// First render student list then change state for smooth UI experience
	renderStudentsList();
	$w("#titleText").text = "Select Student";
	$w("#stateBox").changeState("selectStudentState");

	// Based on virtual or PE class type collapse certain element
	if (selectedClass.classType === "PE") {
		$w("#noMonthSelectedMsg").collapse();
	} else {
		$w("#noVirtualMonthSelectedMsg").collapse();
	}

	// To ensure student list is in viewport
	wixWindow.scrollTo(0, 0);
}

/**
 * @declarations
 * Timeslots: Object<day, month, startTime, endTime>
 * classTimeSlots : Array<Timeslots>
 * month : Object [monthValue, monthLabel]
 */
function getTimeSlotByMonth(classTimeSlots, month) {
	for (const timeslot of classTimeSlots) {
		if (month.monthValue == timeslot.month) return timeslot;
	}
}

const getAllDaysOfTimeSlot = (currentMonthText, timeSlot) => {
	let month = "";
	let day = "";
	let monthDates = [];
	timeSlot.forEach((el) => {
		if (el.month === currentMonthText) {
			month = el?.month;
			day = el?.day;
			monthDates = [...el?.monthDates];
			return;
		}
	});
	if (!(month || day)) {
		console.log("Day or month not found");
	}

	return monthDates.slice(0, 4);
};

export const getAllDays = (currentMonthText, daytext) => {
	const day = parseInt(daytext);
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
			_id: Math.floor(Math.random() * 100000).toString(),
			date: new Date(d.getTime()).toDateString(),
		});
		d.setDate(d.getDate() + 7);
	}

	return dates;
};

export const formatDataForAddressRepeater = (address) => {
	const formattedAddress = [];
	address.forEach((address, index) => {
		formattedAddress.push({
			...address,
			_id: (Math.floor(Math.random() * (1000 - 0 + 1)) + 0).toString(),
			isSelected: false, // index == 0 ? true : false,  // By default first address is selected
		});
	});

	return formattedAddress;
};

export const getSportName = (selectedMonth) => {
	const month = selectedMonth || "09";
	const months = ["09", "10", "11", "12", "01", "02", "03", "04", "05"];
	const sports = ["Soccer", "Football", "Softball", "Kickball", "Basketball", "Nerf Dodgeball", "Handball", "Track and Field", "Soccer"];
	let sport = "";
	months.forEach((el, index) => {
		if (el === month) {
			sport = sports[index];
			return;
		}
	});

	return sport;
};

// Months available for registration (using current month as refernece point)
const getMonthOptions = () => {
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const monthOptions = [
		{ label: "September", value: "09" },
		{ label: "October", value: "10" },
		{ label: "November", value: "11" },
		{ label: "December", value: "12" },
		{ label: "January", value: "01" },
		{ label: "February", value: "02" },
		{ label: "March", value: "03" },
		{ label: "April", value: "04" },
		{ label: "May", value: "05" },
	];
	return monthOptions;
	// const currentMonthNumber = new Date().getMonth();
	// const currentMonthName = months[currentMonthNumber + 1];
	// let flag = false;
	// const filteredMonth = monthOptions.filter((el) => {
	// 	if (el.label === currentMonthName) {
	// 		flag = true;
	// 	}
	// 	if (flag === true) {
	// 		return true;
	// 	} else {
	// 		return false;
	// 	}
	// });
	// return filteredMonth;
};

// return options array for time slot dropdown in moreInfo page
function getTimeSlotForDropdownData(timeslots) {
	console.log("timeslots", timeslots);
	const timeslotDropdownOptions = [];
	for (const timeslot of timeslots) {
		let slot = `${timeslot.startTime} - ${timeslot.endTime}`;
		timeslotDropdownOptions.push({
			label: slot,
			value: JSON.stringify(timeslot),
		});
	}
	console.log("Result", timeslotDropdownOptions);
	return timeslotDropdownOptions;
}

const datePickerChangeHandler = () => {
	const selectedDate = $w("#datePicker").value;
	const day = selectedDate.getDay();
	const month = selectedDate.getMonth();
	let availableTimeSlot = [];
	selectedClass.timeslot.forEach((timeSlot) => {
		if (parseInt(timeSlot.month) - 1 == month && parseInt(timeSlot.day) == day) {
			availableTimeSlot.push({
				...timeSlot,
			});
		}
	});
	$w("#timeSlotRepeater").data = availableTimeSlot;
	$w("#timeSlotRepeater").expand();
};
const virtualDatePickerChangeHandler = () => {
	const selectedDate = $w("#virtualDatePicker").value;
	const day = selectedDate.getDay();
	const month = selectedDate.getMonth();
	let availableTimeSlot = [];
	selectedClass.timeslot.forEach((timeSlot) => {
		if (parseInt(timeSlot.month) - 1 == month && parseInt(timeSlot.day) == day) {
			availableTimeSlot.push({
				...timeSlot,
			});
		}
	});
	$w("#timeSlotRepeater").data = availableTimeSlot;
	$w("#timeSlotRepeater").expand();

	$w("#virtualTimeSlotRepeater").data = availableTimeSlot;
	$w("#virtualTimeSlotRepeater").expand();
};
const addTimeSlotHandler = (itemData) => {
	$w("#noMonthSelectedMsg").collapse();
	const selectedMonthData = $w("#selectedMonth").data;
	selectedMonthData.push({ ...itemData });
	selectedMonth = selectedMonthData;
	$w("#selectedMonth").data = selectedMonthData;
	$w("#selectedMonth").expand();
};

const addVirtualTimeSlotHandler = (itemData) => {
	$w("#noVirtualMonthSelectedMsg").collapse();
	const selectedMonthData = $w("#virtualSelectedMonth").data;
	selectedMonthData.push({ ...itemData });
	selectedMonth = selectedMonthData;
	$w("#virtualSelectedMonth").data = selectedMonthData;
	$w("#virtualSelectedMonth").expand();
};

const removeMonthHandler = (monthId) => {
	const selectedMonthData = $w("#selectedMonth").data;
	const filteredMonth = selectedMonthData.filter((el) => el._id !== monthId);
	selectedMonth = filteredMonth;
	$w("#selectedMonth").data = filteredMonth;
};

const virtualRemoveMonthHandler = (monthId) => {
	const selectedMonthData = $w("#virtualSelectedMonth").data;
	const filteredMonth = selectedMonthData.filter((el) => el._id !== monthId);
	selectedMonth = filteredMonth;
	$w("#virtualSelectedMonth").data = filteredMonth;
};

export const addToWishlistHandler = async (classId) => {
	let currentUserWixid = await setCurrentUserWixId();
	wixData
		.insertReference("Classes", "wishlist", classId, currentUserWixid)
		.then(() => {
			console.log("Reference inserted Successfully");
			isAlreadyInWishlist(classId);
		})
		.catch((err) => {
			console.log(err);
		});
};

const isAlreadyInWishlist = async (classId) => {
	$w("#addToWishlist").disable();
	let currentUserWixid = await setCurrentUserWixId();
	wixData.isReferenced("Classes", "wishlist", classId, currentUserWixid).then((res) => {
		if (!res) {
			$w("#addToWishlist").enable();
		}
	});
};

/**
 * * * * All the validations to check before adding a item in a cart * * * *
 * 1 -> checkIfClassInCartOrUnderReview
 * 2 -> checkItemOverlaps
 * 3 -> Whether AP form exist for the student or not
 *
 *  */
function checkIfClassInCartOrUnderReview(classData) {
	if (classData.status == inCart || classData.status == underReview) return true;
	return false;
}

function checkItemOverlaps(array1, array2) {
	const overlappingItems = [];
	console.log(array1, array2);
	for (const item1 of array1) {
		for (const item2 of array2) {
			if (item1.monthValue == item2.monthValue) overlappingItems.push(item2.monthLabel);
		}
	}
	return overlappingItems;
}

async function validateItemsToBeAddedInCart(items) {
	for (const item of items) {
		console.log("Item", item);
		const studentId = item["student"];
		const classId = item["class"];

		// Check whether AP form exist for the student or not
		const apForm = await wixData
			.query("AthleticParticipationForm")
			.eq("student", studentId)
			.eq("status", active)
			.include("student")
			.find()
			.then((res) => res.items[0]);

		console.log("Ap Form", apForm);

		if (!apForm) {
			return {
				showError: true,
				message: "AP Form does not exist for one of the student",
			};
		}

		const cartItems = await wixData.query("Carts").eq("student", studentId).eq("class", classId).include("class").include("student").find();

		console.log("Cart Item", cartItems);
		if (cartItems.items.length > 0) {
			for (const cartItem of cartItems.items) {
				let classInCart = checkIfClassInCartOrUnderReview(cartItem);
				if (classInCart) {
					return {
						showError: true,
						message: `${cartItem["class"].parkName} is in cart or under review.`,
					};
				}
			}
		}

		for (const cartItem of cartItems.items) {
			let overlappingMonths = checkItemOverlaps(cartItem.selectedMonths, selectedMonth);
			if (overlappingMonths.length > 0) {
				return {
					showError: true,
					message: `${cartItem.student.name} registration in ${
						selectedClass.parkName
					} is overlapping with existing months. Change the months and try again.
                Here are the list of overlapping months.
                ${arrayToString(overlappingMonths)}`,
				};
			}
		}

		return {
			showErorr: false,
		};
	}
}

/* ---------------------------------------------------------------------------------------------------
   |	Events Functions Below                                                                       |
   --------------------------------------------------------------------------------------------------- */

export function cityDropdown_change(event) {
	if ($w("#cityDropdown").value === "Clear") {
		$w("#cityDropdown").value = "";
	}
}

export async function search_click(event) {
	$w("#searchPageResultStatus").text = searchingClassesMessage;
	$w("#searchPageResultStatus").expand();
	$w("#classRepeater").data = [];

	const city = $w("#cityDropdown").value;
	const status = $w("#status").value || "Active";
	const parkName = $w("#parkNameContains").value;
	const isClassTypePhysical = $w("#classTypePhysical").checked;
	const isClassTypeVirtual = $w("#classTypeVirtual").checked;
	let classQuery = wixData.query("Classes");

	if (city && city != "") {
		classQuery = classQuery.eq("city", city);
	}
	if (isClassTypePhysical) {
		classQuery = classQuery.eq("classType", "PE");
	}
	if (isClassTypeVirtual) {
		classQuery = classQuery.eq("classType", "virtual");
	}
	classQuery = classQuery.eq("status", status);

	if (parkName && parkName != "") {
		classQuery = classQuery.contains("parkName", parkName);
	}

	// Final query to find the classes
	await classQuery
		.find()
		.then((res) => {
			const classData = formatDataforRepeater(res);
			if (classData.length == 0) {
				$w("#searchPageResultStatus").text = noClassFoundMessage;
				$w("#searchPageResultStatus").expand();
			} else {
				$w("#classRepeater").data = classData;
				$w("#classRepeater").expand();
				$w("#searchPageResultStatus").collapse();
			}
		})
		.catch((err) => {
			console.log("Error in searching classes : ", err);
		});
}

// ---- All Back Buttons of the state box started ------
export function backButtonInMoreInfoState_click(event) {
	selectedMonth = null;
	$w("#titleText").text = "Search Classes";
	$w("#stateBox").changeState("searchState");
}

export function backButtonInVirtualMoreInfoState_click(event) {
	selectedMonth = null;
	$w("#titleText").text = "Search Classes";
	$w("#stateBox").changeState("searchState");
}

export function backButtonInSelectStudentState_click(event) {
	if (selectedClass.classType === "PE") {
		$w("#stateBox").changeState("moreInfoState");
		fillMoreInfoData(selectedClass);
	} else {
		$w("#stateBox").changeState("virtualMoreInfoState");
		fillVirtualMoreInfoData(selectedClass);
	}
	$w("#titleText").text = selectedClass.parkName;
}

// ---- All Back Buttons of the state box ended ------

export function studentCard_click(event) {
	const { itemId } = event.context;

	// to give color change effect on student card click
	for (let i = 0; i < renderedStudentsData.length; i++) {
		if (renderedStudentsData[i]["_id"] == itemId) {
			if (renderedStudentsData[i]["isSelected"]) {
				renderedStudentsData[i]["isSelected"] = false;
				renderedStudentsData[i]["bgColour"] = studentCardNotSelectedColour;

				renderedStudentsData[i]["nameHeadingHtml"] = textHeadingHtmlNormal("Name");
				renderedStudentsData[i]["gradeHeadingHtml"] = textHeadingHtmlNormal("Grade");
				renderedStudentsData[i]["nameValueHtml"] = textHtmlNormal(renderedStudentsData[i].name);
				renderedStudentsData[i]["gradeValueHtml"] = textHtmlNormal(renderedStudentsData[i].gradeLevel);
			} else {
				renderedStudentsData[i]["isSelected"] = true;
				renderedStudentsData[i]["bgColour"] = studentCardSelectedColour;

				renderedStudentsData[i]["nameHeadingHtml"] = textHeadingHtmlOnHoverAndSelected("Name");
				renderedStudentsData[i]["gradeHeadingHtml"] = textHeadingHtmlOnHoverAndSelected("Grade");
				renderedStudentsData[i]["nameValueHtml"] = textHtmlOnHoverAndSelected(renderedStudentsData[i].name);
				renderedStudentsData[i]["gradeValueHtml"] = textHtmlOnHoverAndSelected(renderedStudentsData[i].gradeLevel);
			}
		}
	}

	$w("#studentRepeater").data = renderedStudentsData;
	$w("#studentRepeater").forItems([itemId], ($item, itemData, index) => {
		$item("#studentCard").style.backgroundColor = itemData.bgColour;

		$item("#studentNameHeading").html = itemData.nameHeadingHtml;
		$item("#studentGradeHeading").html = itemData.gradeHeadingHtml;
		$item("#studentGrade").html = itemData.gradeValueHtml;
		$item("#studentName").html = itemData.nameValueHtml;
	});
	$w("#studentRepeater").expand();

	// Handle whetehr "next" button will be enabled or disabled
	for (const student of renderedStudentsData) {
		if (student.isSelected) {
			$w("#nextButtonInSelectStudentState").enable();
			break;
		}
		$w("#nextButtonInSelectStudentState").disable();
	}
}

export async function nextButtonInSelectStudentState_click(event) {
	let selectedStudents = renderedStudentsData.filter((student) => student.isSelected);

	// Todo : Remove formFilled logic, (Flow changed)
	// Adding this field to keep track which student filled athletic participation form
	for (let i = 0; i < selectedStudents.length; i++) selectedStudents[i]["formFilled"] = false;

	console.log("Selected Student", selectedStudent);
	const toInsertInCart = [];
	for (const student of selectedStudents) {
		for (const selectedClass of selectedClassMonthsData) {
			toInsertInCart.push({
				...selectedClass,
				student: student._id,
				parent: student.parent,
			});
		}
	}

	console.log("cart data", toInsertInCart);

	local.setItem("cartData", JSON.stringify(toInsertInCart));

	const validationResult = await validateItemsToBeAddedInCart(toInsertInCart);

	if (!validationResult.showError) {
		wixData
			.bulkInsert("Carts", toInsertInCart)
			.then((res) => {
				wixLocation.to("/my-cart");
			})
			.catch((err) => {
				console.log("Error in inserting", err);
			});
	} else {
		$w("#noStudentProfileErrorMessage").text = validationResult.message;
		$w("#noStudentProfileErrorMessage").expand();
		$w("#noStudentProfileErrorMessage").show();
		console.log("Validation Result", validationResult);
		// wixLocation.to('/ap-form-control')
	}
}

const getMonthName = (month) => {
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	return months[parseInt(month) - 1];
};

const renderAvailableDates = () => {
	const timeSlots = selectedClass.timeslot;
	const enabledDates = [];
	timeSlots.forEach((timeSlot) => {
		const stringDates = getAllDaysOfTimeSlot(timeSlot.month, selectedClass.timeslot);
		stringDates.forEach((date) => {
			enabledDates.push({
				startDate: new Date(Date.parse(date.date)),
				endDate: new Date(Date.parse(date.date)),
			});
		});
	});
	return enabledDates;
};
const getTimeSlotInString = (month) => {
	let timeSlotString = "";
	selectedClass.timeslot.forEach((el) => {
		if (el.month === month) {
			timeSlotString += `${el.startTime} - ${el.endTime} `;
		}
	});
	return timeSlotString;
};

/**
 * selectPackage_click is in repeter, you will find it in packageRepeater.onItemReady().
 */
