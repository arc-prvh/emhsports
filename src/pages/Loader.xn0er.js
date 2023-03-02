// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { timeline } from "wix-animations";

$w.onReady(function () {
	const loader = $w("#loaderImage");
	timeline({ repeat: -1, yoyo: false }).add(loader, { rotate: 360, duration: 1000, easing: "easeLinear" }).play();
});
