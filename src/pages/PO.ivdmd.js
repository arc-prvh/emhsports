// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

$w.onReady(function () {


});

function getPoFormData() {
	return {
		parentName: $w('#parentName').value,
		studentName: $w('#studentName').value,
		month: $w('#month').value,
		serviceDate: $w('#serviceDate').value,
		amount: $w('#amount').value,
	}
}