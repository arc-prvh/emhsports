// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import wixWindow from 'wix-window';
import {local} from 'wix-storage';


const allergies = [];
let schoolList = null;
// Below two fields will get their values after execution of setCurrentUserWixId()
let currentUserWixid = null;
let parentData = null;

$w.onReady(function () {
    setCurrentUserWixId().then(_ => {

        $w('#sameAsParentCheckbox').checked = true;

        // Calling an event function to initiate automatic filling of address
        sameAsParentCheckbox_click('INTERNAL')
    })

    $w('#allergyRepeater').onItemReady(($item, itemData, index) => {
        $item('#allergyText').text = itemData.allergy;
        $item('#deleteAllergy').onClick(e => {
            deleteAllergy(itemData);
        })
    })

    wixData.query('Schools').find().then(res => {
        schoolList = res.items;
        console.log('school List');
        console.log({schoolList});
        const other = {
            label: 'Other',
            value: 'Other'
        }
        // Setting the first option to be shown as other
        const schoolOptions = [other];

        for (const school of res.items) {	
            if (school.status === 'Active') {
				schoolOptions.push({
                    label: school.name,
                    value: school.name,
                })
            }

        }
        $w('#schoolDropdown').options = schoolOptions;
    })

    // Adding a event listener for Schools drop down menu.
    $w('#schoolDropdown').onChange(schoolDropdownChangeHandler)

});

async function getStudentFormData() {
    if (!currentUserWixid) await setCurrentUserWixId()

    // Checking if there is a custom school and adding it to database
    let school;
    if ($w('#otherSchool').value) {
        const toInsert = {
            title: $w('#otherSchool').value,
            name: $w('#otherSchool').value,
            status: 'Custom'
        }
        await wixData.insert('Schools', toInsert)
            .then(res => {
                console.log(res);
                school = res._id;
            }).catch(err => {
                console.log(err);
            })

    } else {
        school = getSchoolId($w('#schoolDropdown').value);
    }

    return {
        title: $w('#name').value,
        name: $w('#name').value,
        dob: $w('#dob').value,
        school: school,
        gradeLevel: $w('#gradeLevel').value,
        medicalInformation: $w('#medicalInfo').value,
        parent: currentUserWixid,
        relationship: $w('#relationship').value,
        address: $w('#address').value,
        city: $w('#city').value,
        state: $w('#state').value,
        zipCode: $w('#zipCode').value,
        allergies,
    }
}

function calculateAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// returns an object with an error message
async function validateStudentFormData(studentFormData) {

    // Check if all fields are filled
    for (let field of Object.keys(studentFormData)) {
        if (!studentFormData[field]) {
            if (field == 'title') field = 'Name'
            return { error: `${field} field is required` }
        }   
    }
    console.log('Class', studentFormData['dob'])
    
    if (calculateAge(studentFormData['dob']) < 5) {
        return { error: `Minimum age is 5 years` }
    }

    return { error: null }
}

function addNewAllergy(newAllergy) {
    if (newAllergy == 'Other') {
        $w('#customAllergy').expand();
    } else {
        const includesAllergy = (newAllergy) => {
            for (const allergy of allergies)
                if (allergy.allergy.toLowerCase() == newAllergy.toLowerCase()) return true
            return false
        }

        let allergyToInsert = {
            '_id': Math.random().toString().slice(4, 9),
            'allergy': newAllergy,
        }
        if (newAllergy && !includesAllergy(newAllergy)) {
            allergies.push(allergyToInsert);
            $w('#allergyRepeater').data = allergies;
            $w('#allergyRepeater').expand()
            // $w('#allergyRepeaterContainer').expand()
        }
    }
}

function deleteAllergy(allergyData) {
    const getAllergyIndexToDelete = (allergies, allergyToDelete) => {
        for (let i = 0; i < allergies.length; i++) {
            if (allergies[i]._id == allergyToDelete._id) {
                return i;
            }
        }
    }
    let index = getAllergyIndexToDelete(allergies, allergyData)
    allergies.splice(index, index + 1)
    $w('#allergyRepeater').data = allergies;
    if (allergies.length == 0) {
        $w('#allergyRepeater').collapse();
        // $w('#allergyRepeaterContainer').collapse();
    }
}

async function setCurrentUserWixId() {
    const options = {
        fieldsets: ['FULL']
    }

    await currentMember.getMember(options)
        .then(async member => {
            await wixData.query('Parents')
                .eq('memberId', member._id)
                .find()
                .then(parent => {
                    console.log(parent);
                    currentUserWixid = parent.items[0]._id;
                    parentData = parent.items[0];
                }).catch(err => {
                    console.log('Error in finding parent wix id', err);
                });
        })
        .catch((error) => {
            console.error('Error in getting current user email', error);
        });
}

function setAddressFields(addressData) {
    $w('#address').value = addressData.address;
    $w('#city').value = addressData.city;
    $w('#state').value = addressData.state;
    $w('#zipCode').value = addressData.zipCode;

    $w('#address').disable()
    $w('#city').disable()
    $w('#state').disable()
    $w('#zipCode').disable()
}

const getSchoolId = (schoolValue)=>{
    let schoolId=null;
    schoolList.forEach(el=>{
        if(el.name=== schoolValue){
            schoolId = el._id;
            return;
        }
    })
    return schoolId;
}
/* ---------------------------------------------------------------------------------------------------
   |	Events Functions Below                                                                       |
   --------------------------------------------------------------------------------------------------- */

export async function createProfile_click(event) {
    const studentFormData = await getStudentFormData();
    const { error } = await validateStudentFormData(studentFormData);
    if (error) {
        $w('#errMsg').text = error;
        $w('#errMsg').expand();
        wixWindow.scrollTo(0, 0)
    } else {
        await wixData.insert("Students", studentFormData).then(res => {
            console.log("Student Form Data Inserted Successfully.");
            local.setItem('studentId', res._id)
            wixLocation.to('/athletic-participation-form');
        }).catch(err => {
            console.log('Error in student details insertion');
            console.log('Error', err);
        });
    }
}

export function allergyDropdown_change(event) {
    const currentAllergy = $w('#allergyDropdown').value;
    if (currentAllergy != 'Other') $w('#customAllergy').collapse()
    addNewAllergy(currentAllergy);
}

export function addAllergy_click(event) {
    const currentAllergy = $w('#customAllergyText').value;
    addNewAllergy(currentAllergy);
    $w('#customAllergyText').value = '';
}

export function sameAsParentCheckbox_click(event) {
    if ($w('#sameAsParentCheckbox').checked) {
        if (!parentData) {
            setCurrentUserWixId()
            $w('#errMsg').text = 'Fetching Parent Details. Try clicking it in a moment'
            $w('#errMsg').expand()
            wixWindow.scrollTo(0, 0)
            $w('#sameAsParentCheckbox').checked = false;
        } else {
            $w('#errMsg').collapse()
            let address = parentData.address;
            let city = parentData.city;
            let state = parentData.state;
            let zipCode = parentData.zipCode;
            const addressData = { address, city, state, zipCode }
            setAddressFields(addressData)
        }
    } else {
        $w('#errMsg').collapse()
        $w('#address').value = '';
        $w('#city').value = '';
        $w('#state').value = '';
        $w('#zipCode').value = '';

        $w('#address').enable()
        $w('#city').enable()
        $w('#state').enable()
        $w('#zipCode').enable()
    }
}

// Event Handler for School Dropdown
export const schoolDropdownChangeHandler = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue === 'Other') {
        $w('#otherSchool').expand();
    } else {
        $w('#otherSchool').value = '';
        $w('#otherSchool').collapse();
    }
}

