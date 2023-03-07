import wixData from "wix-data";
import { local } from 'wix-storage';
 
$w.onReady(async function () {
    $w('#OneDayPassRepeater').onItemReady(($item, itemData, index) => {
        $item('#name').text = itemData.name;
        $item('#grade').text = itemData.grade;
        $item('#date').text = itemData.date;
        $item('#sport').text = itemData.sport;
        $item('#status').text = 'Active';
        $item('#timeslot').text = itemData.timeslot;
    })
    const parentId = local.getItem('parentId')
    await wixData.query("Carts").eq('parent', parentId).eq('status', 'Paid').include('student').find().then(res => {
        let dataToShow = []
        console.log(res)
        res.items.forEach(item => {
            if (item.selectedPackage['name'] === 'One Day Pass') {
                let date = new Date(item.selectedMonths.monthDates['date'])
                dataToShow.push({
                    ...item,
                    name: item.student['name'],
                    grade: item.student['gradeLevel'],
                    date: date.toLocaleDateString(),
                    sport: getSportName(item.selectedMonths.monthValue),
                    timeslot: `${item.selectedMonths['startTime']} - ${item.selectedMonths['endTime']}`
                })
            }
        })
        $w('#OneDayPassRepeater').data = dataToShow
    })
});


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

