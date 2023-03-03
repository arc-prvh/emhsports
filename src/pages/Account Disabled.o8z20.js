import { authentication } from "wix-members";
import { to } from "wix-location";
$w.onReady(function () {
	$w("#logoutButton").onClick(() => {
		authentication.logout();
		to("/");
	});
});
