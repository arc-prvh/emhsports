import wixData from 'wix-data';
import wixLocation from 'wix-location';
$w.onReady(function () {

    const isValidRole = true //getRoleValidation('Admin')
    if (!isValidRole) {
        console.log('Unauthorised Role trying to access Admin\'s page')
        wixLocation.to('/');
    }
    $w('#searchList').onItemReady(($item,itemData,index)=>{
        $item('#name').text = itemData.name;
        $item('#email').text = itemData.email;
        if(itemData.accountStatus=== 'Active'){
            $item('#switch').checked = true;
        }else{
            $item('#switch').checked = false;
        }
        $item('#switch').onChange(()=>{
            accountStatusChangeHandler(itemData._id);
        })
    })


    // Elements Mapped with Event Handlers
    $w('#searchInput').onChange(searchInputHandler)


});

// Event Handlers

const searchInputHandler =async ()=>{
    const query = $w('#searchInput').value;
    console.log({query});
    const res = await wixData.query('Parents').include('name',query).or(wixData.query('Parents').include('email',query)).find();
    if(res.totalCount === 0){
        console.log('No Match Found');
        return;
    }
    renderSearchList(res.items);
}

const accountStatusChangeHandler =async (id)=>{
    const data =await wixData.get('Parents',id);
    if(data.accountStatus === 'Active'){
        data.accountStatus = 'Disabled';
    }else{
        data.accountStatus = 'Active'
    }
    try {
        // const res = wixData.update('Parents',data)
        // console.log(res);
        console.log('Account Status', data.accountStatus);
    } catch (error) {
        console.log(error);
    }

}

// Custom Functions
const renderSearchList =  (items)=>{
    const repeaterData = [];
    items.forEach(el=>{
        repeaterData.push({
            _id: el.memberId,
            name:el.name,
            email:el.email
        })
    })
    $w('#searchList').data = repeaterData;
}

