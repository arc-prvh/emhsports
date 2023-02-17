// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { validateRole } from 'backend/validateRole.jsw'
import wixLocation from 'wix-location';
import wixData from 'wix-data';

const pageRoles = ['Admin']

$w.onReady(async function () {

	let isUserAllowed  = await validateRole(pageRoles)
	if (!isUserAllowed) {
		wixLocation.to('/login')
		return
	}

	$w('#parentsRepeater').onItemReady(($item, itemData, index) => {
		$item('#username').text = itemData.username;
		$item('#name').text =itemData.name;
		$item('#email').text = itemData.email;
		$item('#phone').text = itemData.phone;
	});

	renderParentsList()

});

async function renderParentsList() {
	const parents = await wixData.query('Parents').find();
	const parentsData = formatDataForParentsRepeater(parents);

	$w('#parentsRepeater').data = parentsData;
}

function formatDataForParentsRepeater(parents) {
	const parentData = []
	for (const parent of parents.items) {
		parentData.push({
			...parent,
		})
	}

	return parentData;
}