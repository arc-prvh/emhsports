import wixLocation from 'wix-location';
import { authentication } from 'wix-members';
import wixData from 'wix-data';
import wixWindow from 'wix-window';
// For Development Purpose Only. These values will be fetched from url but editorx preview do not support.
// const pageUrl = "https://pravaah.editorx.io/emhsports/class-form?mode=modeValue&classId=classValue
//  modeValue can be of 1. read , 2. create , 3. edit

$w.onReady(function () {
    // if(!authentication.loggedIn()){
    //     wixLocation.to('/login');
    // }
    const queries = wixLocation.query
    let viewMode = wixWindow.viewMode;
    if(viewMode === 'Preview'){
        queries.mode = 'read';
        queries.classId = '49e337fa-422c-46ed-82f0-665a2365f0c2';
    } 
    if (!queries) {
        wixLocation.to('/admin-dashboard');
    }
    if (queries.mode === 'read') {
        loadFormData(queries.classId);
        makeFormReadOnly()
    } else if (queries.mode === 'edit') {
        loadFormData(queries.classId);
    }

    $w('#timeSlotRepeater').onItemReady(($item, itemData, index) => {
        $item('#selectedTime').text = `${itemData.day} ${itemData.timeSlot}`;
        $item('#deleteTimeSlot').onClick(() => { deleteTimeSlotHandler(itemData._id) })

    })

    $w('#alternateParkAddressRepeater').onItemReady(($item, itemData, index) => {
        $item('#alternateParkAddress').value = itemData.alternateParkAddress;
        $item('#alternateParkGmap').value = itemData.alternateParkGmap;
        $item('#removeAlternatePark').onClick(() => {
            removeAlternateParkHandler(itemData._id);
        })
    })
    $w('#packageRepeater').onItemReady(($item, itemData, index) => {
        console.log({itemData});
        $item("#packageName").value = itemData.packageName;
        $item("#packagePrice").value = itemData.packageCost;
        $item("#packageDescription").value = itemData.packageDescription;
        $item('#removePackage').onClick(() => {
            removePackageHandler(itemData._id);
        })

    })

    // Attaching event handlers to elements

    $w('#addTimeSlot').onClick(addTimeSlotHandler);
    $w('#classType').onChange(classTypeChangeHandler);
    $w('#createClassButton').onClick(createClassHandler);
    $w('#addPackage').onClick(addPackageHandler);
    $w('#addAlternatePark').onClick(addAlternateParkHandler);

    // Resetting Repeaters
    $w('#timeSlotRepeater').data = [];

    if (queries.mode === 'create') {
        $w('#alternateParkAddressRepeater').data = [{
            _id: '1',
            alternateParkAddress: '',
            alternateParkGmap: ''
        }]
    }

});

// Event Handlers 

const addTimeSlotHandler = () => {
    const shortTime = new Intl.DateTimeFormat("en", { timeStyle: "short" });
    const [fromHour, fromMintute] = $w('#fromTime').value.slice(0, 5).split(':');
    const [toHour, toMintute] = $w('#toTime').value.slice(0, 5).split(':');
    const fromTime = new Date();
    fromTime.setHours(parseInt(fromHour));
    fromTime.setMinutes(parseInt(fromMintute));
    const toTime = new Date();
    toTime.setHours(parseInt(toHour));
    toTime.setMinutes(parseInt(toMintute));
    const day = $w('#day').value;
    const repeaterData = $w('#timeSlotRepeater').data;
    repeaterData.push({
        _id: Math.floor(Math.random() * 10000).toString(),
        timeSlot: `${shortTime.format(fromTime)} - ${shortTime.format(toTime)}`,
        startTime: fromTime,
        endTime: toTime,
        day,
    });
    $w('#timeSlotRepeater').data = repeaterData;
}
const deleteTimeSlotHandler = (id) => {
    const repeaterData = $w('#timeSlotRepeater').data;
    const filteredData = repeaterData.filter(el => el._id !== id)
    $w('#timeSlotRepeater').data = filteredData;
}

const classTypeChangeHandler = () => {
    if ($w('#classType').value === 'Virtual') {
        $w('#primaryParkAddress').disable();
        $w('#primaryParkGmap').disable();
        $w('#alternateParkAddress').disable();
        $w('#alternateParkGmap').disable();
    } else {
        $w('#primaryParkAddress').enable();
        $w('#primaryParkGmap').enable();
        $w('#alternateParkAddress').enable();
        $w('#alternateParkGmap').enable();
    }
}

const addAlternateParkHandler = () => {
    // Removing previous error
    $w('#alternateAddressError').collapse();

    // Checking repeater for invalid values;
    let error = alternateAddressRepeaterValidator();

    if (error) {
        $w('#alternateAddressError').text = 'Field Missing';
        $w('#alternateAddressError').expand();

    } else {
        const repeaterData = $w('#alternateParkAddressRepeater').data;
        repeaterData.push({ _id: `${repeaterData.length+1}` });
        $w('#alternateParkAddressRepeater').data = repeaterData;
        $w('#alternateParkAddress').resetValidityIndication();
        $w('#alternateParkGmap').resetValidityIndication();
    }
}

const removeAlternateParkHandler = (id) => {
    const repeaterData = $w('#alternateParkAddressRepeater').data;
    const filteredData = repeaterData.filter(el => el._id !== id);
    $w('#alternateParkAddressRepeater').data = filteredData;
}

const addPackageHandler = () => {
    // Removing previous error
    $w('#packageError').collapse();

    // Checking repeater for invalid values;
    let error = packageRepeaterValidator();

    if (error) {
        $w('#packageError').text = 'Field Missing';
        $w('#packageError').expand();

    } else {
        const repeaterData = $w('#packageRepeater').data;
        repeaterData.push({ _id: `${repeaterData.length+1}` });
        $w('#packageRepeater').data = repeaterData;
        $w('#packageName').resetValidityIndication();
        $w('#packageDescription').resetValidityIndication();
        $w('#packagePrice').resetValidityIndication();
    }

}
const removePackageHandler = (id) => {
    const repeaterData = $w('#packageRepeater').data;
    const filteredData = repeaterData.filter(el => el._id !== id);
    $w('#packageRepeater').data = filteredData;
}

const createClassHandler = () => {
    const errors = [];
    errors.push(...inputValidator());
    errors.push(timeSlotRepeaterValidator());
    errors.push(alternateAddressRepeaterValidator());
    errors.push(packageRepeaterValidator());
    let allErrorText = '';
    errors.forEach(el => {
        if (el !== null) {
            allErrorText += `${el}\n`;
        }
    })
    if (allErrorText.length > 0) {
        $w('#allErrors').text = allErrorText;
        $w('#allErrors').expand();
    } else {
        console.log(getFormData());

        // const toInsert = getFormData();
        // if (queries.mode === 'edit') {
        //     toInsert._id = classId
        //     wixData.update('Classes', toInsert)
        //         .then(res => {
        //             console.log(res);
        //         }).catch(err => {
        //             console.log(err);
        //         })
        // } else if (queries.mode === 'create') {
        //     wixData.insert('Classes', toInsert)
        //         .then(res => {
        //             console.log(res);
        //         }).catch(err => {
        //             console.log(err);
        //         })
        // }

    }

}

// Custom Functions

const getAlternateParkAddress = () => {
    const alternateParkAddress = []
    $w('#alternateParkAddressRepeater').forEachItem(($item, itemData, index) => {
        alternateParkAddress.push({
            parkType: 'alternate',
            parkAddress: $item('#alternateParkAddress').value,
            gMap: $item('#alternateParkGmap').value
        })
    })
    return alternateParkAddress;

}

const getInputPackages = () => {
    const classPackage = [];
    $w('#packageRepeater').forEachItem(($item, itemData, index) => {
        classPackage.push({
            name: $item('#packageName').value,
            cost: $item('#packagePrice').value,
            description: $item('#packageDescription').value
        })
    })
    return classPackage;
}

const getInputTimeSlot = () => {
    const timeSlots = [];
    $w('#timeSlotRepeater').forEachItem(($item, itemData, index) => {
        timeSlots.push({
            day: itemData.day,
            startTime: itemData.startTime,
            endTime: itemData.endTime
        })
    })
    return timeSlots;

}

const formatDataForAlternateRepeater = (formattedAddress) => {
    const alternaterAddress = [];
    for (let index = 1; index < formattedAddress.length; index++) {

        alternaterAddress.push({
            _id: index.toString(),
            alternateParkAddress: formattedAddress[index].parkAddress,
            alternateParkGmap: formattedAddress[index].gMap
        })

    }
    return alternaterAddress;
}

const formatDataForPackageRepater = (classPackage) => {
    console.log({classPackage});
    const formattedData = [];
    classPackage.forEach(el => {
        formattedData.push({
            _id: Math.floor(Math.random() * 10000).toString(),
            packageName: el.name,
            packageCost: el.cost,
            packageDescription: el.description
        })
    });
    return formattedData;

}

const inputValidator = () => {
    const allTextInputs = ['city', 'county', 'state', 'parkName', 'primaryParkAddress', 'primaryParkGmap', 'information', 'notice', 'parkHistory'];
    const error = [];
    allTextInputs.forEach(el => {
        if ($w(`#${el}`).value === '') {
            const label = $w(`#${el}`).label;
            error.push(`${label} is Required`);
        }
    })
    return error;
}

const timeSlotRepeaterValidator = () => {
    let error = null;
    const repeaterData = $w('#timeSlotRepeater').data;
    if (repeaterData.length === 0) {
        error = 'Time Slot value is required';
    }
    return error;
}

const alternateAddressRepeaterValidator = () => {
    let error = null;
    $w('#alternateParkAddressRepeater').forEachItem(($item, itemData, index) => {
        if ($item('#alternateParkAddress').value == '' || $item('#alternateParkGmap').value === '') {
            error = 'Alternate park address details are not correct';
            return;
        }
    })
    return error;
}
const packageRepeaterValidator = () => {
    let error = null;
    $w('#packageRepeater').forEachItem(($item, itemData, index) => {
        if ($item('#packageName').value == '' || $item('#packageDescription').value === '' || $item('#packagePrice').value === '') {
            error = 'Package details are not correct';
            return;
        }
    })
    return error;
}

const loadFormData = (classId) => {

    wixData.get('Classes', classId).then(classData => {
        console.log({ classData });
        $w('#city').value = classData.city;
        $w('#county').value = classData.county;
        $w('#state').value = classData.state;
        $w('#parkName').value = classData.parkName;
        if (classData.classType === "PE") {
            $w('#classType').selectedIndex = 0;
        } else {
            $w('#classType').selectedIndex = 1;
        }
        if (classData.status === "Active") {
            $w('#classStatus').selectedIndex = 0;
        } else {
            $w('#classStatus').selectedIndex = 1;
        }

        $w('#timeSlotRepeater').data = [{ _id: `${Math.floor(Math.random()*1000)}`, timeSlot: `${classData.startTime} - ${classData.endTime}`, startTime: classData.startTime, endTime: classData.endTime, day: classData.day }];
        $w('#primaryParkAddress').value = classData.formattedAddress[0].parkAddress;
        $w('#primaryParkGmap').value = classData.formattedAddress[0].gMap;
        $w('#alternateParkAddressRepeater').data = formatDataForAlternateRepeater(classData.formattedAddress);
        $w('#instruction').value = classData.instruction;
        $w('#notice').value = classData.notice;
        $w('#parkHistory').value = '';
        const packageRepeaterData =  formatDataForPackageRepater(classData.package);
        console.log({packageRepeaterData});
        $w('#packageRepeater').data = packageRepeaterData;

        if (classData.classType === 'virtual') {
            disableFiledsNotRequiredForVirtualClass()
        }
    }).catch(err => {
        console.log(err);
    })
}
const makeFormReadOnly = () => {
    const allElements = ['city', 'county', 'state', 'parkName', 'addDay', 'addTimeSlot', 'classType', 'classStatus', 'day', 'deleteDay', 'fromTime', 'toTime', 'deleteTimeSlot', 'primaryParkAddress', 'primaryParkGmap', 'alternateParkAddress', 'alternateParkGmap', 'addAlternatePark', 'information', 'notice', 'parkHistory', 'packageName', 'packageDescription', 'packagePrice']
    allElements.forEach(el => {
        $w(`#${el}`).disable();
    })
}

const getFormData = () => {
    const city = $w('#city').value;
    const county = $w('#county').value;
    const state = $w('#state').value;
    const parkName = $w('#parkName').value;
    const classType = $w('#classType').value;
    const classStatus = $w('#classStatus').value;
    const timeSlot = getInputTimeSlot();
    const primaryAddress = {
        parkType: 'primary',
        parkAddress: $w('#primaryParkAddress').value,
        gMap: $w('#primaryParkGmap').value
    }
    const alternateAddresses = getAlternateParkAddress();
    const formattedAddress = [primaryAddress, ...alternateAddresses];
    const instruction = $w('#instruction').value;
    const notice = $w('#notice').value;
    const parkHistory = $w('#parkHistory').value;
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
        classHistory: [parkHistory]
    }
    return classData;
}

const disableFiledsNotRequiredForVirtualClass = () => {
    const fields = ['city', 'county', 'state', 'primaryParkAddress', 'primaryParkGmap', 'alternateParkAddress', 'alternateParkAddressGmap']
    fields.forEach(el => {
        $w(`#${el}`).disable();
    })
}