// open peer group menu when user hovers over "PEER GROUPS" in header nav
d3.select(".menuLink").on("mouseover", showPeerGroupMenu);

// keep peer group menu open as long as user is hovering over it
d3.select(".peerGroupMenu").on("mouseover", showPeerGroupMenu);

// close peer group menu when user stops hovering over it
d3.select(".peerGroupMenu").on("mouseout", hidePeerGroupMenu);

function showPeerGroupMenu() {
    // open peer group menu
    d3.select(".peerGroupMenu").classed("hidden", false);

    // also make sure "PEER GROUPS" link is selected in top nav and "HOME" is deselected
    d3.select(".menuLink").classed("selected", true);
    d3.select(".homeLink").classed("selected", false);
}

function hidePeerGroupMenu() {
    d3.select(".peerGroupMenu").classed("hidden", true);

    // make sure correct topnav link is selected based on the page the user is on
    var page = window.location.pathname;
    if(page === "/") {
        d3.select(".homeLink").classed("selected", true);
        d3.select(".menuLink").classed("selected", false);
    }
    else {
        d3.select(".homeLink").classed("selected", false);
        d3.select(".menuLink").classed("selected", true);
    }
}