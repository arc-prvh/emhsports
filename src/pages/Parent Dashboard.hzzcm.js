// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { currentMember, authentication } from 'wix-members';
import { getRole } from 'backend/role.jsw';
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import {local} from 'wix-storage';
import wixWindow, { viewMode } from 'wix-window';

/* -------------------------------Constants Start ---------------------------------------- */
const inCart = 'InCart';     // AP Form is in cart
const paid = 'Paid'        // Parents has paid for the class
const underReview = 'UnderReview' // Parents requested for school to pay, but admin hasn't approved yet
const approved = 'Approved'    // Request for school payment is approved
const rejected = 'Rejected'    // Request for school payment is rejected


// Weeks
const week = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
};

// Months
const months = {
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December',
    '01': 'January',
    '02': 'February',
    '03': 'March',
    '04': 'April',
    '05': 'May',
    '06': 'June',
    '07': 'July',
    '08': 'August',
    '09': 'September',
};

/* -------------------------------Constants End ----------------------------------------- */
const noClassRegisteredMessage = 'Not enrolled in any class'

let currentUserWixid = null;
let currentStudentId = null;
let isAccountDisabled = false;

$w.onReady(async function () {
    // Checking if member is loggedin
    if (!authentication.loggedIn() && viewMode !== "Preview") {
        console.log('Member is logged in redirecting to Login Page.');
        wixLocation.to('/login');
        return;
    }

    let isValidRole = setRoleValidation('Parent');
    if (!isValidRole) {
        console.log('Unauthorised Role trying to access Parent\'s page')
        wixLocation.to('/login')
    } else {
        await setCurrentUserWixId()
        if(isAccountDisabled){
            wixWindow.openLightbox('Account Disabled');
            return;
        }
        await renderStudentsList();
    }
    $w('#studentRepeater').onItemReady(($item, itemData, index) => {
        $item('#studentName').text = itemData.name;
        $item('#studentAge').text = itemData.age;
        $item('#studentGrade').text = itemData.grade;
        $w('#studentAddress').text = itemData.address;
        $item('#studentCard').onClick(() => {

            renderStudentClassDetails(itemData._id, itemData.name)
            $w('#noClassFoundMsgBox').collapse();
            $w('#classDetailHeading').scrollTo();
            // $item("#studentCard").style.borderColor = 'red';
            // $item("#studentCard").style.borderWidth = '1px';
        })
    })

    $w('#studentClassRepeater').onItemReady(($item, itemData, index) => {

        $item('#parkName').text = itemData.className;
        $item('#day').text = itemData.day;
        $item('#timeSlot').text = itemData.timeslot//`${itemData.startTime} to ${itemData.endTime}`;
        $item('#paymentStatus').text = itemData.paymentStatus;
        $item('#months').text = itemData.months;
        $item('#sports').text = itemData.sports;
        // $item('#addToCart').onClick(() => {
        //     addToCartHandler(itemData._id);
        // })
        if (itemData.paymentStatus === 'Unpaid') {
            $item('#addToCart').expand();

        }
    });

    
});



/**
 * @declarations
 * Timeslots: Object<day, month, startTime, endTime>
 * classTimeSlots : Array<Timeslots>
 * month : Object [monthValue, monthLabel]
 */
function getTimeSlotByMonth(classTimeSlots, month) {
    for (const timeslot of classTimeSlots) {
        if (month.monthValue == timeslot.month) return `${timeslot.startTime} - ${timeslot.endTime}`
    }
}

async function setRoleValidation(roleName) {

    await currentMember.getRoles()
        .then(async (roles) => {
            const currentUserRole = await getRole(roles);
            const { error } = currentUserRole; // No need for this check, as it is handled by wix
            if (error) {
                console.log('Error in getting role : ', error)
                return false;
            } else {
                if (currentUserRole == roleName) return true
                return false
            }
        })
        .catch((error) => {
            console.error('Error in getting current member roles', error);
            return false
        });
}

async function renderStudentsList() {
    if (!currentUserWixid) setCurrentUserWixId();
    await wixData.query('Students')
        .eq('parent', currentUserWixid)
        .find()
        .then(async res => {
            if (res.items.length === 0) {
                $w('#noStudentFoundMsg').expand();
                $w('#studentRepeater').collapse();
                $w('#studentClassRepeater').collapse()
                return;
            }
            let studentRepeaterData = await formatResponseForRepeater(res);
            $w('#studentRepeater').data = studentRepeaterData;
            // $w('#studentClassRepeater').data = studentRepeaterData[1];
            // console.log('studentRepeaterData');
            // console.log(studentRepeaterData);
            if (studentRepeaterData.length > 0) {
                $w('#StudentProfileHeading').expand()
                $w('#classDetailHeading').expand();
            } else {
                $w('#noStudentFoundMsg').expand();
            }
        }).catch(err => {
            console.log('Error in finding student : ', err);
        });
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
                    console.log('Parent', parent)
                    if(parent.items[0].accountStatus !== "Active"){
                        isAccountDisabled = true;
                    }
                    currentUserWixid = parent.items[0]._id;
                    local.setItem('parentId', parent.items[0]._id);
                }).catch(err => {
                    console.log('Error in finding parent wix id', err);
                });
        })
        .catch((error) => {
            console.error('Error in getting current user email', error);
        });
}

async function formatResponseForRepeater(data) {
    let students = data.items;
    const studentData = []
    for (const student of students) {
        studentData.push({
            _id: student._id,
            name: student.name,
            age: calculateAge(student.dob).toString(),
            grade: student.gradeLevel,
            address: student.address,
        })

    }
    renderStudentClassDetails(students[0]._id, students[0].name)
    return studentData;
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

export const getSportName = (selectedMonth) => {
    const month = selectedMonth || '09';
    const months = ['09', '10', '11', '12', '01', '02', '03', '04', '05'];
    const sports = [
        'Soccer',
        'Football',
        'Softball',
        'Kickball',
        'Basketball',
        'Nerf Dodgeball',
        'Handball',
        'Track and Field',
        'Soccer',
    ];
    let sport = '';
    months.forEach((el, index) => {
        if (el === month) {
            sport = sports[index];
            return;
        }
    });
    return sport;
};

const renderStudentClassDetails = async (studentId, studentName) => {
    currentStudentId = studentId;
    $w('#classDetailHeading').text = `${studentName}'s Class Details`;
    let registeredClassData = [];

    let studentCartQuery = wixData.query('Carts').eq('student', studentId);
    let studentClassQuery1 = studentCartQuery.eq('status', paid).include('student').include('class');
    let studentClassQuery2 = studentCartQuery.eq('status', approved).include('student').include('class');

    studentClassQuery1.or(studentClassQuery2)
        .find()
        .then(async res => {
            console.log('res', res)
            if (res.items.length > 0) {
                const sportsDataArray = await wixData.query('MonthAndSports').find().then(res => res.items)
                const sportsDataObject = convertToObject(sportsDataArray)
                for (const form of res.items) {
                    if (form.selectedPackage['name'] != 'One Day Pass') {
                        registeredClassData.push({
                            _id: form._id,
                            className: form['class'].parkName,
                            day : week[form.selectedMonths.day],
                            startTime: form['class'].startTime,
                            endTime: form['class'].endTime,
                            timeslot: `${form.selectedMonths['startTime']} - ${form.selectedMonths['endTime']}`,
                            paymentStatus: form.status,
                            months: months[form['selectedMonths'].month],
                            sports: getSportName(form.selectedMonths.monthValue)
                        })
                    }
                   
                }
                if (registeredClassData.length === 0) {
                    $w('#noClassFoundMsgBox').expand();
                }
                $w('#studentClassRepeater').data = registeredClassData;
                $w('#studentClassRepeater').expand()
            } else {
                // $w('#studentClassRepeater').data = []
                $w('#studentClassRepeater').collapse()
                $w('#noClassFoundMsgBox').expand();
            }
        }).catch(err => {
            console.log(err);
        })

}

function convertToObject(array) {
    const obj = {};
    for (const item of array) obj[item.month] = item.sport
    return obj
}

function getSportsByMonth(months, sportsData) {

    return sportsData[months.monthValue]

}


function arrayToString(array) {
    let result = array[0]
    for (let i = 1; i<array.length; i++) result = `${result}, ${array[i]}` 
    return result
}

function monthArrayToString(months) {
    let monthString = months[0].monthLabel
    for (let i = 1; i<months.length; i++) {
        monthString = `${monthString}, ${months[i].monthLabel}` 
    }
    return monthString
}

// const addToCartHandler = async (classId) => {
//     await wixData.query('AthleticParticipationForm')
//         .eq('student', currentStudentId)
//         .eq('class', classId)
//         .find()
//         .then(res => {
//             console.log(res.items[0]._id);
//             const toInsert = {
//                 atheleteParticipationForm: [res.items[0]._id],
//                 parentId: currentUserWixid
//             }
//             wixData.insert('Cart', toInsert)
//                 .then(res => {
//                     console.log(res);
//                 })
//                 .catch(err => {
//                     console.log(err);
//                 })
//         })
// }