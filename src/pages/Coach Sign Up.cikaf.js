// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import wixData from "wix-data";
import wixWindow from "wix-window";
import { authorize } from "backend/register.jsw";
import { authentication, currentMember } from "wix-members";
import { registerCoach } from "backend/register.jsw";
import wixLocation from "wix-location";
import wixUsers from "wix-users";
import { timeline } from "wix-animations";

$w.onReady(function () {
	// currentMember.getMember().then((member) => {
	// 	if (typeof member !== "undefined") {
	// 		wixLocation.to("/");
	// 	}
	// });

	$w("#repeaterSport").onItemReady(($item, itemData, index) => {
		$item("#sportText").text = itemData.sportText;
		$item("#deleteSportButton").onClick((e) => {
			deleteSport(itemData._id);
		});
	});

	// Resetting the Repeaters
	$w("#repeaterSport").data = [];

	// Mapping events to Handlers
	$w("#sportDropDown").onChange(sportDropDownChangeHandler);
	$w("#addSport").onClick(addSportHandler);
	$w("#homePageButton").onClick(() => {
		wixLocation.to("/");
	});
});

// Event Handlers
export function sportDropDownChangeHandler(event) {
	if ($w("#sportDropDown").value === "Other") {
		$w("#otherSportInput").expand();
		$w("#addSport").expand();
	} else {
		$w("#otherSportInput").collapse();
		$w("#addSport").collapse();
		$w("#otherSportInput").value = "";
		addNewSport($w("#sportDropDown").value);
	}

	let currentSport = $w("#sportDropDown").value;

	if (currentSport !== "Other") {
		addNewSport(currentSport);
	}
}
const addSportHandler = () => {
	if ($w("#otherSportInput").value === "") {
		$w("#otherSportInput").resetValidityIndication();
		console.log("validity Indicator Updated");
	} else {
		addNewSport($w("#otherSportInput").value);
		$w("#otherSportInput").value = "";
	}
};
//Custom Functions
function addNewSport(currentSport) {
	const repeaterData = $w("#repeaterSport").data;
	let currentSportId = currentSport;
	while (currentSportId.includes(" ")) {
		currentSportId = currentSportId.replace(" ", "");
	}
	repeaterData.push({
		_id: `${currentSportId}`,
		sportText: currentSport,
	});
	$w("#repeaterSport").data = repeaterData;
}

function deleteSport(id) {
	const repeaterData = $w("#repeaterSport").data;
	const filteredData = repeaterData.filter((el) => el._id !== id);
	$w("#repeaterSport").data = filteredData;
}

async function validateCoachSignUp(signUp) {
	const { email } = signUp;

	// Check if all fields are filled
	for (let field of Object.keys(signUp)) {
		if (!signUp[field]) return { error: `${field} field is required` };
	}

	// Check if username is already taken
	const usernameCount = await wixData.query("Coach").eq("email", email).count();
	if (usernameCount) return { error: `${email} is already taken` };

	return { error: null };
}

function getSignUp() {
	return {
		name: $w("#cName").value,
		email: $w("#cEmail").value,
		password: $w("#passWord").value,
		phone: $w("#cPhone").value,
		sports: getSports(),
		title: $w("#cEmail").value,
		state: $w("#state").value,
		city: $w("#city").value,
		address: $w("#address").value,
		zipCode: $w("#zipcode").value,
		status: "Active",
	};
}

export async function submit_click(event) {
	$w("#formBox").collapse();
	startLoader();
	$w("#loaderBox").expand();
	const signUp = getSignUp();

	const { error } = await validateCoachSignUp(signUp);
	const { email, password } = signUp;
	if (error) {
		$w("#massageId").text = error;
		$w("#massageId").expand();
		wixWindow.scrollTo(0, 0);
		$w("#submitMessage").collapse();
	} else {
		try {
			const memberId = await registerCoach(email, password);
			signUp["memberId"] = memberId;
			delete signUp["password"];
			const res = await wixData.insert("Coach", signUp);
		} catch (error) {
			console.log(error);
			$w("#massageId").text = "Something went wrong. Please try again later";
			$w("#massageId").expand();
			$w("#loaderBox").collapse();
			stopLoader();
			$w("#successMessageBox").collapse();

			return;
		}

		$w("#massageId").collapse();
		$w("#formBox").collapse();
		$w("#loaderBox").collapse();
		stopLoader();
		$w("#successMessageBox").expand();
	}
}

const getSports = () => {
	const sports = [];
	$w("#repeaterSport").forEachItem(($item, itemData, index) => {
		sports.push(itemData.sportText);
	});
	return sports;
};

const startLoader = () => {
	const loader = $w("#loaderImage");
	timeline({ repeat: -1, yoyo: false }).add(loader, { rotate: 360, duration: 1000, easing: "easeLinear" }).play();
};

const stopLoader = () => {
	const loader = $w("#loaderImage");
	timeline({ repeat: -1, yoyo: false }).add(loader, { rotate: 360, duration: 1000, easing: "easeLinear" }).pause();
};
// export async function registerCoach(email, password) {
//     const res = await authentication.register(email, password)
//     const memberId = res.member._id;
//     await authorize(memberId).catch(err => {
//         console.log('Error in authorize', err)
//     });
//     console.log('Member Id', memberId)
//     return memberId;
// }
