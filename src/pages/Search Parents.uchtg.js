import wixData from 'wix-data';
$w.onReady(function () {

    $w('#searchList').onItemReady(($item,itemData,index)=>{
        $item('#name').text = itemData.name;
        $item('#email').text = itemData.email;
    })


    // Elements Mapped with Event Handlers
    $w('#searchInput').onChange(searchInputHandler)


});

// Event Handlers

const searchInputHandler =async ()=>{
    const query = $w('#searchInput').value;
    const res = await wixData.query('Parents').include('name',query).or(wixData.query('Parents').include('email',query)).find();
    if(res.totalCount === 0){
        console.log('No Match Found');
        return;
    }
    renderSearchList(res.items);
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

