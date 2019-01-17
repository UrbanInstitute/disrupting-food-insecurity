// open peer group menu when user hovers over "PEER GROUPS" in header nav
d3.select(".menuLink").on("mouseover", showPeerGroupMenu);

// keep peer group menu open as long as user is hovering over it
d3.select(".peerGroupMenu").on("mouseover", showPeerGroupMenu);

// close peer group menu when user stops hovering over it
d3.select(".peerGroupMenu").on("mouseout", hidePeerGroupMenu);

function showPeerGroupMenu() {
    d3.select(".peerGroupMenu").classed("hidden", false);
}

function hidePeerGroupMenu() {
    d3.select(".peerGroupMenu").classed("hidden", true);
}