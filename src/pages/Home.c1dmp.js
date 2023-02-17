/* -------------------------------Constants Start ---------------------------------------- */
// --- Animation Constant ---
const ANIMATION_DELAY = [7, 120, 5, 7]  // more the delay, less will be the speed.
/* -------------------------------Constants End ---------------------------------------- */

// animation controls
let animStart = false


const finalCount = [
	{
		_id: `${Math.random().toString().slice(4, 9)}`, 
		name: 'Parents',
		count: 569,
		postChar: '+'
	},
	{
		_id: `${Math.random().toString().slice(4, 9)}`,
		name: 'Students',
		count: 30,
		postChar: 'K'
	},
	{
		_id: `${Math.random().toString().slice(4, 9)}`,
		name: 'Programs',
		count: 986,
		postChar: '+'
	},
	{
		_id: `${Math.random().toString().slice(4, 9)}`,
		name: 'Schools',
		count: 569,
		postChar: '+'
	}
]
$w.onReady(function () {

	$w('#statsRepeater').onItemReady(($item, itemData, index) => {
		$item('#name').text = itemData.name;
		
		let count = 0;

		const countInterval = setInterval(changeCount, ANIMATION_DELAY[index])

		function changeCount() {
			if (count < itemData.count) {
				$item('#count').text = count.toString() + itemData.postChar;
				count += 1
			}
			else {
				clearInterval(countInterval)
			}
		}
	})

	$w('#statsRepeater').onViewportEnter(event => {
		if (!animStart) {
			$w('#statsRepeater').data = finalCount
			animStart = true
		}
	})
	let states = ['box2', 'state2','state3'];
    let stateNumber = 0;

    function slideShow() {
		
        $w('#multiStateBox1').changeState(states[stateNumber]);
        if (stateNumber<states.length - 1) {
            stateNumber++;
        } else {
            stateNumber = 1;
        }
        setTimeout(slideShow,15000);
    }
    slideShow();
});


