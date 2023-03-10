import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { local } from 'wix-storage';
import wixWindow from 'wix-window';

/* -------------------------------Constants Start ---------------------------------------- */
const inCart = 'InCart'; // AP Form is in cart
const paymentInitiated = 'Initiated'; // Payment Process Initiated, but not completed
const paid = 'Paid'; // Parents has paid for the class
const underReview = 'UnderReview'; // Parents requested for school to pay, but admin hasn't approved yet
const approved = 'Approved'; // Request for school payment is approved
const rejected = 'Rejected'; // Request for school payment is rejected

// Order Details Mesaage
const loadingOrderDetailMsg = [
    '​Loading Order Details',
    '​Loading Order Details .',
    '​Loading Order Details . .',
    '​Loading Order Details . . .',
];
const messageAnimationSpeed = 500; // miliseconds

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

let currentUserWixid = null;
let parentData = null;
let loadingOrderDetails = true;

// Forms with status, 'InCart' and 'Rejected'  will be shown in cart
let formsToShowInCart = null;
let renderedForms = null;

$w.onReady(async function () {
    $w('#orderDetailRepeater').onItemReady(($item, itemData, index) => {
        $item('#studentName').text = itemData.name;
        $item('#studentAddress').text = itemData.address;
        $item('#parkName').text = itemData.parkName;
        $item('#county').text = itemData.county;
        $item('#day').text = itemData.day;
        $item('#months').text = itemData.months;
        $item('#timeSlot').text = itemData.timeSlot;
        $item('#pricing').text = itemData.pricing.toString();
        $item('#paymentMethodDropdown').value = itemData.paymentMethod;
        $item('#paymentMethodDropdown').onChange((event) => {
            renderedForms[index]['paymentMethod'] = $item(
                '#paymentMethodDropdown',
            ).value;
            updatePrice();
        });
        $item('#sports').text = itemData.sports;
        $item('#removeButton').onClick((event) => {
            // Removing an order from Cart
            wixData
                .remove('Carts', itemData._id)
                .then((res) => {
                    console.log('Item Removed From Cart', res);
                    updateRepeaterOnItemRemoved(itemData._id);
                    updateItemCountAndSummary();
                    updatePrice();

                    // Remove from forms to show in cart
                    formsToShowInCart = formsToShowInCart.filter(
                        (form) => form._id != itemData._id,
                    );
                })
                .catch((err) => {
                    console.log('Error in removing item', err);
                });
        });

        $w('#backButton').onClick(backButtonHandler);
    });

    // Event Handlers
    const backButtonHandler = () => {
        local.setItem('isBackFromCart', 'true');
        wixLocation.to('/search');
    };

    // Starting the loading order detail animation
    startOrderDetailLoadingAnimation();

    await setCurrentUserWixId();

    if (parentData) {
        $w('#parentName').text = parentData.name;
        $w('#parentPhone').text = parentData.phone;
        $w('#parentEmail').text = parentData.email;
    }

    await setFormsToShowInCart();

    formatDataForRepeater(formsToShowInCart)
        .then((res) => {
            renderedForms = res;
            $w('#orderDetailRepeater').data = res;
            loadingOrderDetails = false;
            $w('#orderDetailRepeater').expand();
            $w('#orderDetailMessage').collapse();
            updatePrice();
        })
        .catch((err) => {
            console.log('Error in formatting data for repeater', err);
        });
});

function updateRepeaterOnItemRemoved(itemId) {
    renderedForms = renderedForms.filter((item) => item._id != itemId);
    $w('#orderDetailRepeater').data = renderedForms;
}

function updateItemCountAndSummary() {
    if (renderedForms) {
        $w('#noOfItemsInCart').text = renderedForms.length.toString();
        $w('#summary').text = `${renderedForms.length} items added in cart.`;
    } else $w('#noOfItemsInCart').text = '0';
}

async function getData(service, serviceId) {
    const serviceData = await wixData
        .query(service)
        .eq('_id', serviceId)
        .find()
        .then((res) => res.items);
    return serviceData[0];
}

/**
 * @declarations
 * Timeslots: Object<day, month, startTime, endTime>
 * classTimeSlots : Array<Timeslots>
 * month : Object [monthValue, monthLabel]
 */
function getTimeSlotByMonth(classTimeSlots, month) {
    for (const timeslot of classTimeSlots) {
        if (month.monthValue == timeslot.month)
            return `${timeslot.startTime} - ${timeslot.endTime}`;
    }
}

function getDayByMonth(classTimeSlots, month) {
    for (const timeslot of classTimeSlots) {
        if (month.monthValue == timeslot.month) return `${week[timeslot.day]}`;
    }
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

async function formatDataForRepeater(formData) {
    let formattedData = [];
    for (const data of formData) {
        let student = await getData('Students', data.student);
        let classData = await getData('Classes', data['class']);
        console.log('Data', data);
        if (data.selectedPackage['name'] == 'One Day Pass') {
            formattedData.push({
                _id: data._id,
                name: student.name,
                address: student.address,
                parkName: classData.parkName,
                county: classData.county,
                day: week[data.selectedMonths.day],
                months: months[data['selectedMonths'].month],
                paymentMethod: 'Self Payment',
                timeSlot: prepareTimeSlotForOneDayPass(data.selectedMonths),
                pricing: data.selectedPackage['cost'],
                sports: getSportName(data.selectedMonths.monthValue),
            });
        } else {
            formattedData.push({
                _id: data._id,
                name: student.name,
                address: student.address,
                parkName: classData.parkName,
                county: classData.county,
                day: week[data.selectedMonths.day],
                months: months[data['selectedMonths'].month],
                paymentMethod: 'Self Payment',
                timeSlot: `${data.selectedMonths['startTime']} - ${data.selectedMonths['endTime']}`,
                pricing: data.selectedPackage['cost'],
                sports: getSportName(data.selectedMonths.monthValue),
            });
        }
    }
    // $w('#noOfItemsInCart').text = formattedData.length.toString();
    return formattedData;
}

function prepareTimeSlotForOneDayPass(selectedMonths) {
    let result = '';
    const date = selectedMonths.monthDates[0].date.getDate()
    const day = week[selectedMonths.day]
    const timeSlot = `${selectedMonths['startTime']}-${selectedMonths['endTime']}`

    return `${date}, ${day} : ${timeSlot}`
}

function convertMonthsArrayToString(monthData) {
    if (monthData) {
        let result = monthData[0].monthLabel;
        for (let i = 1; i < monthData.length; i++)
            result += ', ' + monthData[i].monthLabel;
        return result;
    }
    return '';
}

async function setFormsToShowInCart() {
    let formQuery = wixData
        .query('Carts')
        .eq('parent', currentUserWixid)
        .eq('status', inCart);

    formsToShowInCart = await formQuery.find().then((res) => res.items);
}

function getFormDataFromCartData(formId) {
    for (const form of formsToShowInCart) {
        if (form._id == formId) return form;
    }
    return null;
}

function startOrderDetailLoadingAnimation() {
    let index = 0;
    const l = loadingOrderDetailMsg.length;
    let animation = setInterval(animationMessage, messageAnimationSpeed);

    function animationMessage() {
        $w('#orderDetailMessage').text = loadingOrderDetailMsg[index % l];
        index += 1;

        if (!loadingOrderDetailMsg) {
            clearInterval(animation);
            $w('#orderDetailMessage').collapse();
        }
    }
}

async function setCurrentUserWixId() {
    const options = {
        fieldsets: ['FULL'],
    };

    await currentMember
        .getMember(options)
        .then(async (member) => {
            await wixData
                .query('Parents')
                .eq('memberId', member._id)
                .find()
                .then((parent) => {
                    console.log(parent);
                    currentUserWixid = parent.items[0]._id;
                    parentData = parent.items[0];
                })
                .catch((err) => {
                    console.log('Error in finding parent wix id', err);
                });
        })
        .catch((error) => {
            console.error('Error in getting current user email', error);
        });
}

async function updatePrice(forms = renderedForms) {
    $w('#noOfItemsInCart').text = forms.length.toString();
    let totalPrice = 0;

    for (const form of forms) {
        let currPrice = 0;
        if (form.paymentMethod == 'Self Payment') {
            let numberOfMonths = 1;
            currPrice = form.pricing * numberOfMonths;
        }
        totalPrice += currPrice;
    }
    $w('#totalAmount').text = '$ ' + totalPrice.toString();
    $w('#summary').text = `${forms.length} items added in cart.`;
}

export function checkout_click(event) {
    // console.log('Rendered Data', renderedForms)
    let dataToUpdate = [];
    renderedForms.forEach((form) => {
        // ToDo : Need to change to initiated, it is paid only for DEMO purpose
        let newStatus = paid;

        let formData = getFormDataFromCartData(form._id);
        if (formData) {
            console.log('FormData', formData);
            if (form.paymentMethod == 'School Payment') {
                newStatus = underReview;
            }
            dataToUpdate.push({
                ...formData,
                status: newStatus,
            });
        } else {
            console.log(`Didn't get formData for ${form}`);
        }
    });

    wixData
        .bulkUpdate('Carts', dataToUpdate)
        .then((res) => {
            console.log('AP Form Status Updated', res);
        })
        .catch((err) => {
            console.log('Error in updating AP Form data', err);
        });
    wixLocation.to('/parent-dashboard');
}

let a = {
    "startTime": "7:30 AM",
    "monthDates": [
      {
        "_id": "87",
        "date": "Mar 03, 2023"
      },
      {
        "_id": "185",
        "date": "Mar 10, 2023"
      },
      {
        "_id": "393",
        "date": "Mar 17, 2023"
      },
      {
        "_id": "339",
        "date": "Mar 24, 2023"
      }
    ],
    "_id": "03507300830",
    "assignedCoachId": "No Coach Found",
    "endTime": "8:30 AM",
    "day": "5",
    "month": "03"
  }