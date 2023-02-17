// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { currentMember } from 'wix-members';
import { getRole } from 'backend/register.jsw';
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { local } from 'wix-storage';
// let finalCount = [0, 0, 0]
const ANIMATION_DELAY = [100, 100, 100]

$w.onReady(function () {

    // Bypassing role validation
    const isValidRole = true //getRoleValidation('Admin')
    if (!isValidRole) {
        console.log('Unauthorised Role trying to access Admin\'s page')
    } else {
        setAdminDashboardCounting()
    }
    restorePreviousState();
    // Mapping Events to their respective handlers
    $w('#createClassButton').onClick(createClassHandler);
    $w('#searchClassButton').onClick(searchClassHandler);
    $w('#updateClassButton').onClick(updateClassHandler);
    $w('#deleteClassButton').onClick(deleteClassHandler);
    $w('#dashboardButton').onClick(() => {
        $w('#multiStateBox1').changeState('dashboard');
    })
    $w('#manageClassButton').onClick(() => {
        $w('#multiStateBox1').changeState('manageClass');
    })
    $w('#multiStateBox1').onChange(() => {
        saveCurrentStateToLocal();
    })
});

async function getRoleValidation(roleName) {
    await currentMember.getRoles()
        .then((roles) => {
            const currentUserRole = getRole(roles);
            const { error } = currentUserRole; // No need for this check, as it is handled by wix
            if (error) {
                console.log('Error in getting role : ', error)
                return false
            } else {
                if (currentUserRole == roleName) return true
                return false
            }
        })
        .catch((error) => {
            console.error(error);
        });
}

async function setAdminDashboardCounting() {
    console.log('Done Till Here')
    let parentCount = await wixData.query('Parents').find().then(res => res.items.length)
    let studentCount = await wixData.query('Students').find().then(res => res.items.length)
    let classCount = await wixData.query('Classes').find().then(res => res.items.length)
    let finalCount = [studentCount, parentCount, classCount]
    console.log('Done Till Here')
    startAnimation(finalCount)
}

function startAnimation(finalCount) {
    let count1 = 0
    let count2 = 0
    let count3 = 0

    console.log('Final Count', finalCount)

    const countInterval1 = setInterval(changeCount1, ANIMATION_DELAY[0])
    const countInterval2 = setInterval(changeCount2, ANIMATION_DELAY[1])
    const countInterval3 = setInterval(changeCount3, ANIMATION_DELAY[2])

    function changeCount1() {
        if (count1 <= finalCount[0]) {
            $w('#studentCount').text = count1.toString();
            count1 += 1
        } else {
            clearInterval(countInterval1)
        }
    }

    function changeCount2() {
        if (count2 <= finalCount[1]) {
            $w('#parentCount').text = count2.toString();
            count2 += 1
        } else {
            clearInterval(countInterval2)
        }
    }

    function changeCount3() {
        if (count3 <= finalCount[2]) {
            $w('#classCount').text = count3.toString();
            count3 += 1
        } else {
            clearInterval(countInterval3)
        }
    }
}

// Event Handlers

const createClassHandler = () => {
    // const pageUrl = "https://pravaah.editorx.io/emhsports/class-form?mode=modeValue&classId=classValue
    //  modeValue can be of 1. read , 2. create , 3. edit
    wixLocation.to('/class-form?mode=create');
}

const searchClassHandler = () => {
    // const pageUrl = "https://pravaah.editorx.io/emhsports/class-form?mode=modeValue&classId=classValue
    //  modeValue can be of 1. read , 2. create , 3. edit
    wixLocation.to('/admin-class-search');
}

const updateClassHandler = () => {
    // const pageUrl = "https://pravaah.editorx.io/emhsports/class-form?mode=modeValue&classId=classValue
    //  modeValue can be of 1. read , 2. create , 3. edit
    wixLocation.to('/admin-class-search');
}

const deleteClassHandler = () => {
    // const pageUrl = "https://pravaah.editorx.io/emhsports/class-form?mode=modeValue&classId=classValue
    //  modeValue can be of 1. read , 2. create , 3. edit
    wixLocation.to('/admin-class-search');
}

// Custom Function
const saveCurrentStateToLocal = () => {
    const currentStateId = $w('#multiStateBox1').currentState.id;
    local.setItem("adminDashboardPreviousState", currentStateId)
}

const restorePreviousState = () => {
    const previousState = local.getItem('adminDashboardPreviousState');
    if (!previousState) return;
    console.log({ previousState });
    $w('#multiStateBox1').changeState(previousState);
    local.removeItem('adminDashboardPreviousState');
}