import wixLocation from "wix-location";
import { query, insert, update, get } from "wix-data";
import { currentMember } from "wix-members";
import { to } from "wix-location";
let studentId = null;
let member = null;
let currentStudent = null;
$w.onReady(async function () {
	await validateMember();
	const defaultSchoolOptions = $w("#schoolDropdown").options;
	defaultSchoolOptions.push(...(await getSchoolOptions()));
	$w("#schoolDropdown").options = defaultSchoolOptions;
	fillStudentData();

	$w("#allergyRepeater").onItemReady(($item, itemData, index) => {
		$item("#allergy").text = itemData.allergy;
		$item("#removeAllergy").onClick(() => {
			removeAllergyHandler(itemData._id);
		});
	});

	$w("#addAllergy").onClick(addAllergyHandler);
	$w("#allergyDropDown").onChange(allergyChangeHandler);
	$w("#updateButton").onClick(updateButtonHandler);
    
});
//  Event Handlers
const updateButtonHandler = ()=>{
    const error = validateStudentData();
    if(error.length>0){
        $w('#errorText').text = error;
        $w('#errorText').expand;
        return;
    }else{
        $w('#errorText').text = '';
        $w('#errorText').expand;
        const updatedData = getStudentData();
		console.log({ updatedData });
		updateDatabase("Students", updatedData);
    }
}


const removeAllergyHandler = (id) => {
	const repeaterData = $w("#allergyRepeater").data;
	const filteredData  = repeaterData.filter((el) => el._id !== id);
	$w("#allergyRepeater").data = filteredData;
};
const addAllergyHandler = () => {
	let allergy = $w("#otherAllergyInput").value;
	if (allergy === "") {
		console.log("other Sport value Empty");
		$w("#otherAllergyInput").focus();
	} else {
		const repeaterData = $w("#allergyRepeater").data;
		repeaterData.push({
			_id: Math.floor(Math.random() * 1000).toString(),
			allergy: allergy,
		});
		$w("#allergyRepeater").data = repeaterData;
		$w("#otherAllergyInput").value = "";
	}
};
const allergyChangeHandler = () => {
	let allergy = $w("#allergyDropDown").value;
	if (allergy === "Other") {
		$w("#otherAllergyInput").expand();
		$w("#addAllergy").expand();
	} else {
		$w("#otherAllergyInput").collapse();
		$w("#otherAllergyInput").value = "";
		$w("#addAllergy").collapse();
		const repeaterData = $w("#allergyRepeater").data;
		repeaterData.push({
			_id: Math.floor(Math.random() * 1000).toString(),
			allergy: allergy,
		});
		$w("#allergyRepeater").data = repeaterData;
	}
};
// Custom Function
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

const getSchoolOptions = async () => {
	let res = null;
	let schoolsOptions = [];
	try {
		res = await query("Schools").find();
		if (res.totalCount === 0) throw new Error("No Schools found");
		res.items.forEach((school) => {
			schoolsOptions.push({
				label: school.name,
				value: school._id,
			});
		});
	} catch (error) {
		console.log(error);
	}
	return schoolsOptions;
};
const getStudentData = () => {
	const name = $w("#name").value;
    const gradeLevel = $w('#gradeLevel').value;
    const relationship = $w('#relationship').value;
    const school = $w('#schoolDropdown').value;
	const address = $w("#address").value;
	const city = $w("#city").value;
	const state = $w("#state").value;
	const zipCode = $w("#zipcode").value;
    const medicalInformation = $w('#medicalInfo').value;
    const allergies = getAllergiesData();
	return {
		_id: currentStudent._id,
		name,
        gradeLevel,
        relationship,
        school,
		address,
		city,
		state,
		zipCode,
        medicalInformation,
        allergies
	};
};

const getAllergiesData = ()=>{
    const allergies = [];
    $w('#allergyRepeater').forEachItem(($item,itemData,index)=>{
        allergies.push(itemData.allergy);
    })
    return allergies;
}

const fillStudentData = () => {
	const { name, city, address, state, zipCode, allergies, school, gradeLevel, relationship, medicalInformation } = currentStudent;
	$w("#name").value = name;
	$w("#gradeLevel").value = gradeLevel;
	$w("#relationship").value = relationship;
	$w("#schoolDropdown").value = school;
	$w("#address").value = address;
	$w("#city").value = city;
	$w("#state").value = state;
	$w("#zipcode").value = zipCode;
	$w("#medicalInfo").value = medicalInformation;
	const repeaterData = [];
	if (allergies.length > 0) {
		allergies.forEach((allergy) => {
			repeaterData.push({
				...allergy,
			});
		});
	}
	$w("#allergyRepeater").data = repeaterData;
};
const validateStudentData = () => {
	let error = "";
	if ($w("#name").value === "") {
		error += "Name not found\n";
	}
	if ($w("#gradeLevel").value === "") {
		error += "Grade Level not found\n";
	}
	if ($w("#relationship").value === "") {
		error += "Relationship not found\n";
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
	if ($w("#medicalInfo").value === "") {
		error += "Additional Medical Information not found\n";
	}

	return error;
};

const validateMember = async () => {
	try {
		studentId = wixLocation.query.studentId;
		// studentId = "b9c7acb7-c323-4acc-b9cb-0987fdc8de98";
		if (!studentId) {
			throw new Error("Student Id not found");
		}
		member = await currentMember.getMember();
		if (!member) {
			throw new Error("Mamber not Logged in");
		}
		currentStudent = await get("Students", studentId);
		if (!currentStudent) throw new Error("Student not found");
		console.log(currentStudent);
	} catch (error) {
		console.log(error);
		to('/');
	}
};
