// open peer group menu when user hovers over "PEER GROUPS" in header nav
d3.select(".menuLink").on("mouseover", showPeerGroupMenu);

// keep peer group menu open as long as user is hovering over it
d3.select(".peerGroupMenu").on("mouseover", showPeerGroupMenu);

// close peer group menu when user stops hovering over it
d3.select(".peerGroupMenu").on("mouseout", hidePeerGroupMenu);

// mousing over HOME link or social share button also hides the peer group menu
d3.select(".homeLinkDiv").on("mouseover", hidePeerGroupMenu);
d3.select(".share-icons").on("mouseover", hidePeerGroupMenu);

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




// functions for opening/closing dashboard drawers
var drawerTitleHeight = 50;
var drawerNames = ["Food_Insecurity", "Physical_Health", "Housing_Costs", "Income_and_Employment",
                    "Financial_Health", "Demographics", "Geography"];

var drawerFullHeights = {};

// store drawer heights
function getDrawerHeights() {
    drawerNames.forEach(function(d) {
        var drawerHeight = d3.select(".metricDrawer." + d + " .metricDrawerContent").node().getBoundingClientRect().height;

        // store menu heights when in fully opened state so we know what heights to transition these to
        drawerFullHeights[d] = drawerHeight;
    })
}

// event listeners for opening/closing drawers
d3.selectAll(".peerGroupProfile .metricDrawer.Food_Insecurity .metricDrawerTitle").on("click", function() { toggleDrawer(".peerGroupProfile", "Food_Insecurity"); });
d3.selectAll(".peerGroupProfile .metricDrawer.Physical_Health .metricDrawerTitle").on("click", function() { toggleDrawer(".peerGroupProfile", "Physical_Health"); });
d3.selectAll(".peerGroupProfile .metricDrawer.Housing_Costs .metricDrawerTitle").on("click", function() { toggleDrawer(".peerGroupProfile", "Housing_Costs"); });
d3.selectAll(".peerGroupProfile .metricDrawer.Income_and_Employment .metricDrawerTitle").on("click", function() { toggleDrawer(".peerGroupProfile", "Income_and_Employment"); });
d3.selectAll(".peerGroupProfile .metricDrawer.Financial_Health .metricDrawerTitle").on("click", function() { toggleDrawer(".peerGroupProfile", "Financial_Health"); });
d3.selectAll(".peerGroupProfile .metricDrawer.Demographics .metricDrawerTitle").on("click", function() { toggleDrawer(".peerGroupProfile", "Demographics"); });
d3.selectAll(".peerGroupProfile .metricDrawer.Geography .metricDrawerTitle").on("click", function() { toggleDrawer(".peerGroupProfile", "Geography"); });

// toggle opening and closing drawers
function toggleDrawer(page_name, drawer_name) {
    var drawerIsClosed = d3.select(page_name + " .metricDrawer." + drawer_name).classed("closed");

    if(drawerIsClosed) {
        d3.select(page_name + " .metricDrawer." + drawer_name).classed("closed", false);
        d3.select(page_name + " .metricDrawer." + drawer_name)
            .transition(500)
            .style("height", drawerFullHeights[drawer_name] + 50 + "px");
    }
    else {
        d3.select(page_name + " .metricDrawer." + drawer_name).classed("closed", true);
        d3.select(page_name + " .metricDrawer." + drawer_name)
            .transition(500)
            .style("height", drawerTitleHeight + "px");
    }

    // if user has opened or closed all of the drawers, update the text in the Expand all/Collapse link
    var numClosedDrawers = d3.selectAll(page_name + " .metricDrawer.closed").nodes().length;
    if(numClosedDrawers > 0) {
        d3.select(page_name + " .expandDrawersLink").text("Expand all");
    }
    else if(numClosedDrawers === 0) {
        d3.select(page_name + " .expandDrawersLink").text("Collapse");
    }
}

d3.select(".peerGroupProfile .expandDrawersLink").on("click", function() { toggleAllDrawers(".peerGroupProfile"); });

function toggleAllDrawers(page_name) {
    var linkName = d3.select(page_name + " .expandDrawersLink").text();

    if(linkName === "Expand all") {
        d3.select(page_name + " .expandDrawersLink").text("Collapse");
        expandAllDrawers(page_name);
    }
    else {
        d3.select(page_name + " .expandDrawersLink").text("Expand all");
        closeAllDrawers(page_name);
    }
}

function expandAllDrawers(page_name) {
    d3.selectAll(page_name + " .metricDrawer").classed("closed", false);
    drawerNames.forEach(function(d) {
        d3.select(page_name + " .metricDrawer." + d)
            .transition(500)
            .style("height", drawerFullHeights[d] + drawerTitleHeight + "px");
    });
}

// close all drawers except first one
function closeAllDrawers(page_name) {
    d3.selectAll(page_name + " .metricDrawer").classed("closed", true);
    drawerNames.slice(1).forEach(function(d) {
        d3.select(page_name + " .metricDrawer." + d)
            .transition(500)
            .style("height", drawerTitleHeight + "px");
    });

    d3.select(page_name + " .metricDrawer." + drawerNames[0]).classed("closed", false);
    d3.select(page_name + " .metricDrawer." + drawerNames[0])
        .transition(500)
        .style("height", drawerFullHeights["Food_Insecurity"] + drawerTitleHeight + "px");
}