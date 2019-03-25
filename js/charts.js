// (function() {
var metricNameMapping = {
    food_insecure_all: "Food insecure, all people",
    food_insecure_children: "Food insecure, children",
    severely_housing_cost_burdened: "Severely housing-cost burdened",
    housing_cost_burdened: "Housing-cost burdened",
    wage_fair_market_rent: "Wage to afford fair market rent",
    disability: "People with disability",
    diabetes: "People with diabetes",
    low_birthweight: "Low-birthweight births",
    credit_score: "Median credit score",
    debt: "Debt in collections",
    median_income: "Median household income",
    below_poverty: "Below 200% of federal poverty level",
    unemployment: "Unemployment rate",
    no_insurance: "No health insurance",
    college_less: "No college degree",
    people_color: "People of color",
    children: "Households with children",
    seniors: "Households with seniors (65+)",
    rural_population: "Population in rural area"
}

var PCTFORMAT = d3.format(".0%");
var PCTFORMATONEDECIMAL = d3.format(".1%");
var COMMAFORMAT = d3.format(",.0f");
var DOLLARFORMAT = d3.format("$,.0f");

var chartDimensions = {width_pg: 130, width_cnty: 220, height: 100, margin: {top: 20, right: 0, bottom: 5, left: 0}};
var mapMargins = 10;

var xScalePG = d3.scaleBand()
    .domain(["peer_group", "national"])
    .range([0, chartDimensions.width_pg])
    .padding(0.4);

var xScaleCnty = d3.scaleBand()
    .domain(["county", "peer_group", "state", "national"])
    .range([0, chartDimensions.width_cnty])
    .padding(0.3);

var yScale = d3.scaleLinear()
    .range([chartDimensions.height, 0]);

// var colorScale = d3.scaleOrdinal()
//     .domain(["", "no", "diff"])
//     .range(["#1696d2", "#e3e3e3", "#fdbf11"]);


var projection = d3.geoIdentity();

var path = d3.geoPath()
    .projection(projection);

var dashboardData,
    mapData;

var countyLookup = {};

var isIE = navigator.userAgent.indexOf("MSIE") !== -1 || navigator.userAgent.indexOf("Trident") !== -1;


d3.csv("data/chart_data.csv", function(d) {
    return {
        id: d.id,
        name: d.name,
        food_insecure_all: +d.food_insecure_all,
        food_insecure_children: +d.food_insecure_children,
        severely_housing_cost_burdened: +d.severely_housing_cost_burdened,
        housing_cost_burdened: +d.housing_cost_burdened,
        wage_fair_market_rent: +d.wage_fair_market_rent,
        disability: +d.disability,
        diabetes: +d.diabetes,
        low_birthweight: +d.low_birthweight,
        credit_score: +d.credit_score,
        debt: +d.debt,
        median_income: +d.median_income,
        below_poverty: +d.below_poverty,
        unemployment: +d.unemployment,
        no_insurance: +d.no_insurance,
        college_less: +d.college_less,
        people_color: +d.people_color,
        children: +d.children,
        seniors: +d.seniors,
        rural_population: +d.rural_population,
        geography: d.geography
    };
}, function(error, data) {

    if (error) throw error;
    dashboardData = data;

    d3.json("data/us_topo_final.json", function(error, json) {
        mapData = json;
        // console.log(json.objects.counties.geometries);

        json.objects.counties.geometries.forEach(function(county){
            countyLookup[county.properties.county_name + ", " + county.properties.state_abbv] = county.properties.county_fips + "," + county.properties.state_fips + "," + county.properties.peer_group;
        });

        var page = window.location.pathname;
        if(page.indexOf("peergroup.html") > -1) {
            // render peer group page charts based on group selected
            var peer_group = parseQueryString(window.location.search)["peergroup"];
            renderPeerGroupPage(page, peer_group);
        }
        else {
            // render county profile page (i.e., homepage)
            initializeSearchbox();
            renderMap("index", "all", 750, 522);

            if(window.location.search !== "") {
                // if query string has parameters, use those to populate the charts
                var params = parseQueryString(window.location.search);
                var geoIDs = countyLookup[deslugify(params.county) + ", " + params.state].split(",");

                // zoom map into state of selected county and apply highlighting
                var d_state = d3.select("#peerGroupMap .state." + params.state).datum();
                zoomToState(d_state, path.bounds(d_state));

                // var d_county = d3.select("#peerGroupMap .county.county_" + geoIDs[0]).datum();
                // selectCounty(d_county);
                d3.select(".countyProfile #peerGroupMap .county.county_" + geoIDs[0]).classed("countyClicked", true);
                d3.select(".countyProfile #peerGroupMap .county.county_" + geoIDs[0]).classed("highlighted", true).moveToFront();

                d3.select(".geoLabel").text(deslugify(params.county) + ", " + params.state);
                renderCountyPage(page, geoIDs[0], geoIDs[2], geoIDs[1], params.state);
            }
            else {
                // else render page using Autauga County, AL in the dataset
                renderCountyPage(page, "01001", "6", "01", "AL");
            }
        }
        // window.addEventListener("resize", redraw);
    });
});

function renderCountyPage(pagename, county_id, peer_group, state_id, state_abbv) {
    var isPrint = pagename.indexOf("print_") > -1;

    // get data
    var data = getData("county", county_id, peer_group, state_id);

    var county = data.filter(function(d) { return d.geography === "county"; })[0]["name"];
    var countyName = county.split(",")[0];
    var peerGroupName = data.filter(function(d) { return d.geography === "peer_group"; })[0]["name"];

    // update county name in searchbox if using query parameters
    if(window.location.search !== "") $("#countySearch").val(countyName + ", "  + state_abbv);

    // update county name in title, peer group name and peer group link in sentence beneath county name
    populateCountySentence(countyName, state_abbv, peer_group, peerGroupName);

    // update print link

    // update charts and legend
    populateCharts(data, "countyProfile");
    populateLegends("countyProfile", countyName, state_abbv, peer_group);

    if(!isPrint) {
        // after all charts have rendered, grab drawer heights and close all except the first drawer
        getDrawerHeights();
        d3.selectAll(".metricDrawer").style("height", drawerTitleHeight + "px");
        d3.select(".metricDrawer.Food_Insecurity").style("height", drawerFullHeights["Food_Insecurity"] + drawerTitleHeight + "px");

        // hide dashboard if loading page without a county already selected
        if(window.location.search === "") {
            d3.select(".dashboardDrawers").classed("hidden", true);
        }
    }
}

function updateCountyPage(county_id, peer_group, state_id, state_abbv) {
    // parse county from URL
    // console.log(parseQueryString(window.location.search));

    // get data
    var data = getData("county", county_id, peer_group, state_id);

    var county = data.filter(function(d) { return d.geography === "county"; })[0]["name"];
    var countyName = county.split(",")[0];
    var peerGroupName = data.filter(function(d) { return d.geography === "peer_group"; })[0]["name"];

    // update county name in searchbox

    // center map over state and highlight county

    // update county name in title, peer group name and peer group link in sentence beneath county name
    populateCountySentence(countyName, state_abbv, peer_group, peerGroupName);

    // update print link

    // update charts and legend
    updateCharts(data, "countyProfile");
    populateLegends("countyProfile", countyName, state_abbv, peer_group);
}

function renderPeerGroupPage(pagename, peer_group) {
    var isPrint = pagename.indexOf("print_") > -1;
    // get data
    var data = getData("peergroup", "", peer_group, "");
    var peerGroupName = data.filter(function(d) { return d.geography === "peer_group"; })[0]["name"];
    // console.log(data);

    // update title
    // var peerGroupName = data.filter(function(d) { return d.id === peer_group; })[0]["name"];
    populatePGPageTitle(peerGroupName, peer_group, peerGroupName);

    // update bullets
    populateBulletPoints(peer_group);

    // update map
    isPrint ? renderMap("peerGroupProfile", peer_group, 231, 141) : renderMap("peerGroupProfile", peer_group, 700, 427);

    // update bar charts and legends
    populateCharts(data, "peerGroupProfile");
    populateLegends("peerGroupProfile", "", "", peer_group);

    // update print link
    d3.select("a[name='peerGroupPrintLink']").attr("href", "print_peergroup.html?peergroup=" + peer_group);

    if(!isPrint) {
        // after all charts have rendered, grab drawer heights and close all except the first drawer
        getDrawerHeights();
        d3.selectAll(".metricDrawer").style("height", drawerTitleHeight + "px");
        d3.select(".metricDrawer.Food_Insecurity").style("height", drawerFullHeights["Food_Insecurity"] + drawerTitleHeight + "px");
    }
}

function populateCharts(data, parentPage) {
    makeBarChart("food_insecure_all", data, parentPage);
    makeBarChart("food_insecure_children", data, parentPage);
    makeBarChart("low_birthweight", data, parentPage);
    makeBarChart("diabetes", data, parentPage);
    makeBarChart("disability", data, parentPage);
    makeBarChart("no_insurance", data, parentPage);
    makeBarChart("severely_housing_cost_burdened", data, parentPage);
    makeBarChart("housing_cost_burdened", data, parentPage);
    makeBarChart("wage_fair_market_rent", data, parentPage);
    makeBarChart("median_income", data, parentPage);
    makeBarChart("below_poverty", data, parentPage);
    makeBarChart("unemployment", data, parentPage);
    makeBarChart("credit_score", data, parentPage);
    makeBarChart("debt", data, parentPage);
    makeBarChart("children", data, parentPage);
    makeBarChart("seniors", data, parentPage);
    makeBarChart("people_color", data, parentPage);
    makeBarChart("college_less", data, parentPage);
    makeBarChart("rural_population", data, parentPage);
}

function updateCharts(data, parentPage) {
    updateBarChart("food_insecure_all", data, parentPage);
    updateBarChart("food_insecure_children", data, parentPage);
    updateBarChart("low_birthweight", data, parentPage);
    updateBarChart("diabetes", data, parentPage);
    updateBarChart("disability", data, parentPage);
    updateBarChart("no_insurance", data, parentPage);
    updateBarChart("severely_housing_cost_burdened", data, parentPage);
    updateBarChart("housing_cost_burdened", data, parentPage);
    updateBarChart("wage_fair_market_rent", data, parentPage);
    updateBarChart("median_income", data, parentPage);
    updateBarChart("below_poverty", data, parentPage);
    updateBarChart("unemployment", data, parentPage);
    updateBarChart("credit_score", data, parentPage);
    updateBarChart("debt", data, parentPage);
    updateBarChart("children", data, parentPage);
    updateBarChart("seniors", data, parentPage);
    updateBarChart("people_color", data, parentPage);
    updateBarChart("college_less", data, parentPage);
    updateBarChart("rural_population", data, parentPage);
}

function populateCountySentence(countyName, stateAbbv, peerGroupNumber, peerGroupName) {
    d3.select("h3.selectedCountyName").text(countyName + ", " + stateAbbv);
    d3.select("a.peerGroupProfileLink").text(peerGroupName.toLowerCase());

    var currentPeerGroupClass = getCurrentPeerGroupClass(d3.select("a.peerGroupProfileLink"));
    d3.select("a.peerGroupProfileLink").classed(currentPeerGroupClass, false);
    d3.select("a.peerGroupProfileLink").classed("peerGroup" + peerGroupNumber, true);

    d3.select("a.peerGroupProfileLink").attr("href", "peergroup.html?peergroup=" + peerGroupNumber);
}

function populatePGPageTitle(peerGroupName, peerGroupNumber, peerGroupName) {
    // d3.select("h1.peerGroupTitle").text(peerGroupName);
    d3.select("h1.peerGroupTitle").text(peerGroupName);
    d3.select("h1.peerGroupTitle").classed("peerGroup" + peerGroupNumber, true);
}

function populateBulletPoints(peerGroupNumber) {
    var bulletText = peerGroupBullets["peerGroup" + peerGroupNumber];
    d3.selectAll(".peerGroupBullets li.bullet").classed("peerGroup" + peerGroupNumber, true);
    d3.select(".food_insecurity_bullet").text("Food insecurity: " + bulletText.food_insecurity);
    d3.select(".physical_health_bullet").text("Physical health: " + bulletText.physical_health);
    d3.select(".financial_health_bullet").text("Financial and economic health: " + bulletText.financial_economic_health);
    d3.select(".housing_cost_bullet").text("Housing cost burden: " + bulletText.housing_cost_burden);
    d3.select(".geography_bullet").text("Geography: " + bulletText.geography);
    d3.select(".demographics_bullet").text("Demographics: " + bulletText.demographics);
}

function makeBarChart(chartID, data, parentPage) {

    yScale.domain([0, d3.max(data, function(d) { return d[chartID]; })]);

    var chartWidth = parentPage === "peerGroupProfile" ? chartDimensions.width_pg : chartDimensions.width_cnty;

    var svg = d3.select("#" + chartID)
        .append("svg")
        .attr("width", chartWidth + chartDimensions.margin.left + chartDimensions.margin.right)
        .attr("height", chartDimensions.height + chartDimensions.margin.top + chartDimensions.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + chartDimensions.margin.left + "," + chartDimensions.margin.top + ")");

    drawBars(svg, data, chartID, parentPage);

    // add name of metric below each chart
    // d3.select("#" + chartID)
    //     .append("div")
    //     .attr("class", "chartName")
    //     .text(metricNameMapping[chartID]);
}

function updateBarChart(chartID, data, parentPage) {
    var peerGroupNumber = data.filter(function(d) { return d.geography === "peer_group"})[0]["id"];

    yScale.domain([0, d3.max(data, function(d) { return d[chartID]; })]);

    var barGrps = d3.selectAll("#" + chartID + " .barGrp")
        .data(data);

    barGrps.select(".bar")
        .transition()
        .attr("y", chartDimensions.height)
        .attr("height", 0)
        .transition()
        .attr("class", function(d) { if(d.geography === "peer_group") { return parentPage === "countyProfile" ? "bar peer_group" + d.id : "bar peerGroup" + d.id; }
                                     else if(d.geography === "county") { return "bar peerGroup" + peerGroupNumber; }
                                     else { return "bar " + d.geography; } })
        .attr("y", function(d) { return isNaN(d[chartID]) ? 0 : yScale(d[chartID]); })
        .attr("height", function(d) { return isNaN(d[chartID]) ? 0: yScale(0) - yScale(d[chartID]); });

    barGrps.select(".barLabel")
        .transition()
        .attr("y", chartDimensions.height)
        .transition()
        .attr("y", function(d) { return isNaN(d[chartID]) ? chartDimensions.height - 5 : yScale(d[chartID]) - 5; })
        .text(function(d) { if(isNaN(d[chartID])) { return "*"; }
                            else {
                                if(chartID === "credit_score") { return COMMAFORMAT(d[chartID]); }
                                else if(chartID === "wage_fair_market_rent" || chartID === "median_income") { return DOLLARFORMAT(d[chartID]); }
                                else { return PCTFORMATONEDECIMAL(d[chartID]/100); }
                            }
                        }
            );
}

function getData(parentPage, countyId, peerGroupId, stateId) {
    if(parentPage === "peergroup") {
        return dashboardData.filter(function(d) { return ((d.geography === "peer_group" && d.id === peerGroupId) || d.geography === "national"); });
    }
    else {
        return dashboardData.filter(function(d) { return ((d.geography === "county" && d.id === countyId) || (d.geography === "peer_group" && d.id === peerGroupId) || (d.geography === "state" && d.id === stateId) || d.geography === "national"); });
    }
}

function drawBars(svg, data, metric, parentPage) {
    var peerGroupNumber = data.filter(function(d) { return d.geography === "peer_group"; })[0]["id"];

    var xAxis = parentPage === "peerGroupProfile" ? d3.axisBottom(xScalePG).ticks(null) : d3.axisBottom(xScaleCnty).ticks(null);

    var barGrps = svg.selectAll(".barGrp")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "barGrp");

    barGrps.append("rect")
        .attr("class", function(d) { if(d.geography === "peer_group") { return parentPage === "countyProfile" ? "bar peer_group" + d.id : "bar peerGroup" + d.id; }
                                     else if(d.geography === "county") { return "bar peerGroup" + peerGroupNumber; }
                                     else { return "bar " + d.geography; } })
        .attr("x", function(d) { return parentPage === "peerGroupProfile" ? xScalePG(d.geography) : xScaleCnty(d.geography); })
        .attr("y", function(d) { return isNaN(d[metric]) ? 0 : yScale(d[metric]); })
        .attr("height", function(d) { return isNaN(d[metric]) ? 0 : yScale(0) - yScale(d[metric]); })
        .attr("width", parentPage === "peerGroupProfile" ? xScalePG.bandwidth() : xScaleCnty.bandwidth());

    barGrps.append("text")
        .attr("class", "barLabel")
        .attr("x", function(d) { if(parentPage === "peerGroupProfile") { return xScalePG(d.geography) + xScalePG.bandwidth()/2; }
                                 else { return xScaleCnty(d.geography) + xScaleCnty.bandwidth()/2; } })
        .attr("y", function(d) { return isNaN(d[metric]) ? chartDimensions.height - 5 : yScale(d[metric]) - 5; })
        .text(function(d) { if(isNaN(d[metric])) { return "*"; }
                            else {
                                if(metric === "credit_score") { return COMMAFORMAT(d[metric]); }
                                else if(metric === "wage_fair_market_rent" || metric === "median_income") { return DOLLARFORMAT(d[metric]); }
                                else { return PCTFORMATONEDECIMAL(d[metric]/100); }
                            }
                        });

    var xAxisElements = svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + chartDimensions.height + ")")
        .call(xAxis.tickSize(0));

    xAxisElements.selectAll("text").remove();
}

function populateLegends(page, countyName, stateAbbv, peerGroupNumber) {
    if(page === "peerGroupProfile") {
        d3.selectAll(".peerGroupLegendEntry .legendSquare").classed("peerGroup" + peerGroupNumber, true);
    }
    else {
        d3.selectAll(".countyAvgLegendEntry .legendText").text(countyName + ", " + stateAbbv);

        var currentPeerGroupClass = getCurrentPeerGroupClass(d3.select(".countyAvgLegendEntry .legendSquare"));
        d3.selectAll(".countyAvgLegendEntry .legendSquare").classed(currentPeerGroupClass, false);
        d3.selectAll(".countyAvgLegendEntry .legendSquare").classed("peerGroup" + peerGroupNumber, true);
    }
}

function renderMap(page, peerGroupNumber, width, height) {
    // how to scale already projected data: https://stackoverflow.com/questions/42430361/scaling-d3-v4-map-to-fit-svg-or-at-all
    projection.fitSize([width - (mapMargins*2), height - (mapMargins*2)], topojson.feature(mapData, mapData.objects.counties));

    var svg = d3.select("#peerGroupMap")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    if(page === "peerGroupProfile") {
        svg.append("g")
            .attr("transform", "translate(" + mapMargins + "," + mapMargins + ")")
            .attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(mapData, mapData.objects.states).features)
            .enter()
            .append("path")
            .attr("class", function(d) { return "state " + d.properties.state_abbv; })
            .attr("d", path)
            .style("pointer-events", "none");

        svg.append("g")
            .attr("transform", "translate(" + mapMargins + "," + mapMargins + ")")
            .attr("class", "counties")
            .selectAll("path")
            .data(topojson.feature(mapData, mapData.objects.counties).features)
            .enter()
            .append("path")
            .attr("class", function(d) { return d.properties.peer_group === peerGroupNumber ? "county selected county_" + d.properties.county_fips + " peerGroup" + peerGroupNumber : "county county_" + d.properties.county_fips; })
            .attr("d", path)
            .on("mouseover", function(d) { if(d.properties.peer_group === peerGroupNumber) { highlightCounty(d, path.centroid(d)[0], path.bounds(d)[0][1], "peerGroupProfile"); }})
            .on("mouseout", function(d) { unHighlightCounty(d); });
    }
    else {
        svg.append("g")
            .attr("transform", "translate(" + mapMargins + "," + mapMargins + ")")
            .attr("class", "counties")
            .selectAll("path")
            .data(topojson.feature(mapData, mapData.objects.counties).features)
            .enter()
            .append("path")
            .attr("class", function(d) { return "county selected county_" + d.properties.county_fips + " peerGroup" + d.properties.peer_group; })
            .attr("d", path)
            .style("pointer-events", "none")
            .on("mouseover", function(d) { highlightCounty(d, path.centroid(d)[0], path.bounds(d)[0][1], "countyProfile"); })
            .on("mouseout", function(d) { unHighlightCounty(d); })
            .on("click", function(d) { selectCounty(d); });

        svg.append("g")
            .attr("transform", "translate(" + mapMargins + "," + mapMargins + ")")
            .attr("class", "states")
            .selectAll("path")
            .data(topojson.feature(mapData, mapData.objects.states).features)
            .enter()
            .append("path")
            .attr("class", function(d) { return "state " + d.properties.state_abbv; })
            .attr("d", path)
            .on("mouseover", function(d) { highlightState(d.properties.state_abbv, d.properties.state_name); })
            .on("mouseout", function() { unHighlightState(); })
            .on("click", function(d) { zoomToState(d, path.bounds(d)); });
    }
}

function highlightCounty(county, mouseX, mouseY, page) {
    d3.select("#peerGroupMap .county.county_" + county.properties.county_fips).classed("highlighted", true).moveToFront();

    if(page === "peerGroupProfile") {
        d3.select(".tooltip")
            .text(county.properties.county_name + ", " + county.properties.state_abbv)
            .classed("hidden", false);

        var tooltipWidth = d3.select(".tooltip").node().getBoundingClientRect().width;

        d3.select(".tooltip")
            .style("left", mouseX - (tooltipWidth/2) + "px")
            .style("top", mouseY - 25 + "px");
    }
    else {
        d3.select(".geoLabel").text(county.properties.county_name + ", " + county.properties.state_abbv);
    }
}

function unHighlightCounty() {
    d3.selectAll("#peerGroupMap .county").classed("highlighted", false);
    d3.select(".tooltip").text("").classed("hidden", true);

    if(d3.select(".countyProfile #peerGroupMap .countyClicked").nodes().length > 0) {
        d3.select(".countyProfile #peerGroupMap .countyClicked").classed("highlighted", true).moveToFront();
        var countyClicked = d3.select(".countyProfile #peerGroupMap .countyClicked").datum().properties;
        d3.select(".geoLabel").text(countyClicked.county_name + ", " + countyClicked.state_abbv);
    }
}

function selectCounty(county) {
    d3.selectAll(".countyProfile #peerGroupMap .county").classed("highlighted", false);
    d3.selectAll(".countyProfile #peerGroupMap .county").classed("countyClicked", false);
    d3.select(".countyProfile #peerGroupMap .county.county_" + county.properties.county_fips).classed("countyClicked", true);
    d3.select(".countyProfile #peerGroupMap .county.county_" + county.properties.county_fips).classed("highlighted", true).moveToFront();

    d3.select(".geoLabel").text(county.properties.county_name + ", " + county.properties.state_abbv);

    // d3.select(".tooltip")
    //     .text(county.properties.county_name + ", " + county.properties.state_abbv)
    //     .classed("hidden", false);

    // var tooltipWidth = d3.select(".tooltip").node().getBoundingClientRect().width;

    // d3.select(".tooltip")
    //     .style("left", mouseX - (tooltipWidth/2) + "px")
    //     .style("top", mouseY - 25 + "px");

    // update URL, populate county name in searchbox and update charts
    updateQueryString("?county=" + slugify(county.properties.county_name) + "&state=" + county.properties.state_abbv);
    $("#countySearch").val(county.properties.county_name + ", " + county.properties.state_abbv);
    updateCountyPage(county.properties.county_fips, county.properties.peer_group, county.properties.state_fips, county.properties.state_abbv);
    d3.select(".dashboardDrawers").classed("hidden", false);
}

function highlightState(stateAbbv, stateName) {
    d3.select(".geoLabel").text(stateName);
    d3.select(".countyProfile #peerGroupMap .state." + stateAbbv).classed("stateSelected", true).moveToFront();
}

function unHighlightState() {
    d3.selectAll(".countyProfile #peerGroupMap .state").classed("stateSelected", false);

    if(d3.select(".countyProfile #peerGroupMap .stateClicked").nodes().length > 0) {
        // d3.select(".countyProfile #peerGroupMap .stateClicked").classed("stateSelected", true);

        var stateName = d3.select(".countyProfile #peerGroupMap .stateClicked").datum().properties.state_name;

        if(d3.select(".countyProfile #peerGroupMap .countyClicked").nodes().length === 0) {
            // show name of state that was clicked on if no county was clicked on
            d3.select(".geoLabel").text(stateName);
        }
        else {
            // if a county was clicked on, show its name even if mousing out of a state
            var countyClicked = d3.select(".countyProfile #peerGroupMap .countyClicked").datum().properties;
            d3.select(".geoLabel").text(countyClicked.county_name + ", " + countyClicked.state_abbv);
        }
    }
    else {
        // don't show any state or county names if nothing has been clicked on
        d3.select(".geoLabel").text("");
    }
}

function zoomToState(state, bounds) {
    var mapDimensions = d3.select("#peerGroupMap svg").node().getBoundingClientRect();
    var dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .8 / Math.max(dx / mapDimensions.width, dy / mapDimensions.height),
        shiftX = (mapDimensions.width/2) - scale * x,
        shiftY = (mapDimensions.height/2) - scale * y;

    d3.selectAll(".countyProfile #peerGroupMap g.states")
        .transition()
        .duration(800)
        .attr("transform", "translate(" + shiftX + "," + shiftY + ")scale(" + scale + ")");

    d3.selectAll(".countyProfile #peerGroupMap g.counties")
        .transition()
        .duration(800)
        .attr("transform", "translate(" + shiftX + "," + shiftY + ")scale(" + scale + ")")
    d3.select(".geoLabel").text(state.properties.state_name);
    // d3.select(".tooltip").attr("transform", "translate(" + shiftX + "," + shiftY + ")");

    d3.selectAll(".countyProfile #peerGroupMap .state").classed("stateClicked", false);
    d3.select(".countyProfile #peerGroupMap .state." + state.properties.state_abbv).classed("stateClicked", true);

    // grey out non-clicked on states
    d3.selectAll(".countyProfile #peerGroupMap .state").classed("greyedOut", true);
    d3.select(".countyProfile #peerGroupMap .state.stateClicked").classed("greyedOut", false);

    // unhide map reset button
    d3.select(".zoomOutMapBtn").classed("hidden", false);

    // activate counties and deactivate state that's been clicked on
    d3.selectAll(".countyProfile #peerGroupMap g.counties .county").style("pointer-events", "all");
    d3.selectAll(".countyProfile #peerGroupMap g.states .state:not(.stateClicked)").style("pointer-events", "all");
    d3.selectAll(".countyProfile #peerGroupMap g.states .state.stateClicked").style("pointer-events", "none");
}

d3.select(".zoomOutMapBtn").on("click", function() { resetMap(); });

function resetMap() {
    // reset map to national view with no states or counties highlighted
    d3.selectAll(".countyProfile #peerGroupMap g.states")
        .transition()
        .duration(800)
        .attr("transform", "scale(1)");

    d3.selectAll(".countyProfile #peerGroupMap g.counties")
        .transition()
        .duration(800)
        .attr("transform", "scale(1)");

    d3.selectAll(".countyProfile #peerGroupMap .state").classed("greyedOut", false);

    d3.selectAll(".countyProfile #peerGroupMap g.counties .county").style("pointer-events", "none");
    d3.selectAll(".countyProfile #peerGroupMap g.states .state").style("pointer-events", "all");

    // hide map reset button
    d3.select(".zoomOutMapBtn").classed("hidden", true);
}

d3.select(".clearSearchbox").on("click", function() { resetMap();
                                                      d3.selectAll(".countyProfile #peerGroupMap .state").classed("stateClicked", false);
                                                      d3.selectAll(".countyProfile #peerGroupMap .state").classed("stateSelected", false);
                                                      d3.selectAll(".countyProfile #peerGroupMap .county").classed("highlighted", false);
                                                      d3.selectAll(".countyProfile #peerGroupMap .county").classed("countyClicked", false);
                                                      d3.select(".dashboardDrawers").classed("hidden", true);
                                                      d3.select(".geoLabel").text("");
                                                      $("#countySearch").val(""); });

// function getParentDivWidth(elementId) {
//     var width = document.getElementById(elementId).clientWidth;
//     // console.log(width)
//     return width;
// }

// function redraw() {
//     exampleChartDimensions.width = Math.min(getParentDivWidth("exampleEquityChart") - 70, 575);

//     if(getParentDivWidth("equityChart") >= 1150) {
//         toolChartDimensions.width = 870;
//     }
//     else if(getParentDivWidth("equityChart") >= 1024 && getParentDivWidth("equityChart") < 1150) {
//         toolChartDimensions.width = 770;
//     }
//     else if(getParentDivWidth("equityChart") >= 768 && getParentDivWidth("equityChart") < 1024) {
//         toolChartDimensions.width = getParentDivWidth("equityChart") * 0.7;
//     }
//     else if(getParentDivWidth("equityChart") <= 767) {
//         toolChartDimensions.width = getParentDivWidth("equityChart") * 0.95;
//     }

//     $("#exampleEquityChart .baseBar").empty();
//     $("#exampleEquityChart .comparisonBar").empty();
//     $("#exampleEquityChart .withEquityBar").empty();

//     makeEquityBarChart("#exampleEquityChart", "Postsecondary education", "Ward 7", "DC", exampleChartDimensions);

//     $("#equityChart .baseBar").empty();
//     $("#equityChart .comparisonBar").empty();
//     $("#equityChart .withEquityBar").empty();
//     makeEquityBarChart("#equityChart", getIndicatorSelected(), getBaseGeography(), getComparisonGeography(), toolChartDimensions);

//     $("#downloadChart .baseBar").empty();
//     $("#downloadChart .comparisonBar").empty();
//     $("#downloadChart .withEquityBar").empty();
//     makeEquityBarChart("#downloadChart", getIndicatorSelected(), getBaseGeography(), getComparisonGeography(), toolChartDimensions);
// }

function initializeSearchbox() {
    $("#countySearch").autocomplete({
        source: Object.keys(countyLookup),
        select: function( event, ui ) {
            $("#countySearch").val(ui.item.label);   // need this so when user clicks on a county name instead of hitting the enter key, the full name is captured by getSchoolName (otherwise, only typed letters will get captured)
            var county = ui.item.label.split(",")[0].trim();
            var state = ui.item.label.split(",")[1].trim();
            var geoIDs = countyLookup[ui.item.label].split(",");

            // zoom map into state of selected county and apply highlighting
            var d_state = d3.select("#peerGroupMap .state." + state).datum();
            zoomToState(d_state, path.bounds(d_state));

            var d_county = d3.select("#peerGroupMap .county.county_" + geoIDs[0]).datum();
            selectCounty(d_county);
        },
        // open: function( event, ui ) {
        //     d3.select("#magnifyGlass").style("visibility", "hidden");
        // },
        close: function( event, ui ) {
            // $("#countySearch").val("");
        //     d3.select("#magnifyGlass").style("visibility", "visible");
        }
    });
}

d3.select("#countySearch").on("click", function() { $("#countySearch").val(""); });

function addAnd(geo) {
    var geoArray = geo.split(",");
    if(geoArray.length === 1) {
        return geo;
    }
    else if(geoArray.length === 2) {
        return geoArray[0] + " and " + geoArray[1];
    }
    else {
        return geoArray.slice(0, geoArray.length - 1).join(", ") + ", and " + geoArray[geoArray.length - 1];
    }
}

function slugify(name) {
    return name.split(" ").join("_");
}

function deslugify(slug) {
    return slug.split("_").join(" ");
}

function parseQueryString(query) {
    var obj = {},
        qPos = query.indexOf("?"),
    tokens = query.substr(qPos + 1).split('&'),
    i = tokens.length - 1;
    if (qPos !== -1 || query.indexOf("=") !== -1) {
        for (; i >= 0; i--) {
            var s = tokens[i].split('=');
            obj[unescape(s[0])] = s.hasOwnProperty(1) ? unescape(s[1]) : null;
        };
    }
    return obj;
}

function updateQueryString(queryString){
    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + queryString;
        window.history.pushState({path:newurl},'',newurl);
    }
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

// })();