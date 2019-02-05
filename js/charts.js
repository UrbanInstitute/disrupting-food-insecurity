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
    college_less: "Some college or less",
    people_color: "People of color",
    children: "Households with children",
    seniors: "Households with seniors (65+)",
    rural_population: "Population in rural area"
}

var PCTFORMAT = d3.format(".0%");
var PCTFORMATONEDECIMAL = d3.format(".1%");
var COMMAFORMAT = d3.format(",.1f");
var DOLLARFORMAT = d3.format("$,.0f");

var chartDimensions = {width_pg: 120, width_cnty: 300, height: 100, margin: {top: 20, right: 0, bottom: 5, left: 0}};

var xScalePG = d3.scaleBand()
    .domain(["peer_group", "national"])
    .range([0, chartDimensions.width_pg])
    .padding(0.4);

var xScaleCnty = d3.scaleBand()
    .domain(["county", "peer_group", "state", "national"])
    .range([0, chartDimensions.width_cnty]);

var yScale = d3.scaleLinear()
    .range([chartDimensions.height, 0]);

// var colorScale = d3.scaleOrdinal()
//     .domain(["", "no", "diff"])
//     .range(["#1696d2", "#e3e3e3", "#fdbf11"]);

var dashboardData,
    mapData;

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
        console.log(json);
        // render peer group page charts based on group selected
        var peer_group = getQueryString("peergroup");
        renderPeerGroupPage(peer_group);

        // // initialize bottom and image download charts as grey rectangles
        // makeEquityBarChart("#equityChart", "Initial", "Initial", "Initial", toolChartDimensions);
        // makeEquityBarChart("#downloadChart", "Initial", "Initial", "Initial", toolChartDimensions);

        // window.addEventListener("resize", redraw);
    });
});

function getQueryString(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// console.log(getQueryString("peergroup"));

function renderPeerGroupPage(peer_group) {
    // get data
    var data = getData("peergroup", peer_group);
    // var peerGroupNum = data.filter(function(d) { return d.geography === "peer_group"; })[0]["id"];
    console.log(data);

    // update title
    var peerGroupName = data.filter(function(d) { return d.id === peer_group; })[0]["name"];
    populatePGPageTitle(peerGroupName, peer_group);

    // update bullets
    populateBulletPoints(peer_group);

    // update map
    renderMap(peer_group);

    // update bar charts and legends
    populateCharts(data);
    populateLegends(peer_group);
    getDrawerHeights(); // get height of each drawer after charts have rendered and full height is determined

    // update print link
}

function populateCharts(data) {
    makeBarChart("food_insecure_all", data);
    makeBarChart("food_insecure_children", data);
    makeBarChart("low_birthweight", data);
    makeBarChart("diabetes", data);
    makeBarChart("disability", data);
    makeBarChart("no_insurance", data);
    makeBarChart("severely_housing_cost_burdened", data);
    makeBarChart("housing_cost_burdened", data);
    makeBarChart("wage_fair_market_rent", data);
    makeBarChart("median_income", data);
    makeBarChart("below_poverty", data);
    makeBarChart("unemployment", data);
    makeBarChart("credit_score", data);
    makeBarChart("debt", data);
    makeBarChart("children", data);
    makeBarChart("seniors", data);
    makeBarChart("people_color", data);
    makeBarChart("college_less", data);
    makeBarChart("rural_population", data);
}

function populatePGPageTitle(peerGroupName, peerGroupNumber) {
    // d3.select("h1.peerGroupTitle").text(peerGroupName);
    d3.select("h1.peerGroupTitle").text("Peer Group " + peerGroupNumber);

    // var peerGroupMatchPhrase = /peerGroup\d+/;
    // var currentClasses = d3.select("h1.peerGroupTitle").attr("class");
    // var currentPeerGroupClass = currentClasses.match(peerGroupMatchPhrase)[0];
    // console.log(currentPeerGroupClass);
    // d3.select("h1.peerGroupTitle").classed(currentPeerGroupClass, false);
    d3.select("h1.peerGroupTitle").classed("peerGroup" + peerGroupNumber, true);
}

function populateBulletPoints(peerGroupNumber) {
    d3.selectAll(".peerGroupBullets li.bullet").classed("peerGroup" + peerGroupNumber, true);
}

function makeBarChart(chartID, data) {

    yScale.domain([0, d3.max(data, function(d) { return d[chartID]; })]);

    var svg = d3.select("#" + chartID)
        .append("svg")
        .attr("width", chartDimensions.width_pg + chartDimensions.margin.left + chartDimensions.margin.right)
        .attr("height", chartDimensions.height + chartDimensions.margin.top + chartDimensions.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + chartDimensions.margin.left + "," + chartDimensions.margin.top + ")");

    drawBars(svg, data, chartID);

    // add name of metric below each chart
    d3.select("#" + chartID)
        .append("div")
        .attr("class", "chartName")
        .text(metricNameMapping[chartID]);
    // detect label collision - if labels are overlapping, make label for diff bar extend lower
    // (only apply this to binary indicators since non-binary ones only have one label)
    // nonbinaryIndicators.indexOf(indicator) && adjustLabels(chartDivID, parentClass, indicator);
}

function getData(parentPage, geoId) {
    if(parentPage === "peergroup") {
        return dashboardData.filter(function(d) { return (d.geography === "peer_group" && d.id === geoId || d.geography === "national"); });
    }
}

function drawBars(svg, data, metric) {

    var xAxis = d3.axisBottom(xScalePG).ticks(null);

    var barGrps = svg.selectAll(".barGrp")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "barGrp");

    barGrps.append("rect")
        .attr("class", function(d) { return d.geography === "peer_group" ? "bar peerGroup" + d.id : "bar " + d.geography; })
        .attr("x", function(d) { return xScalePG(d.geography); })
        .attr("y", function(d) { return yScale(d[metric]); })
        .attr("height", function(d) { return yScale(0) - yScale(d[metric]); })
        .attr("width", xScalePG.bandwidth());

    barGrps.append("text")
        .attr("class", "barLabel")
        .attr("x", function(d) { return xScalePG(d.geography) + xScalePG.bandwidth()/2; })
        .attr("y", function(d) { return yScale(d[metric]) - 5; })
        .text(function(d) { if(metric === "credit_score") { return COMMAFORMAT(d[metric]); }
                            else if(metric === "wage_fair_market_rent" || metric === "median_income") { return DOLLARFORMAT(d[metric]); }
                            else { return PCTFORMATONEDECIMAL(d[metric]); }});

    var xAxisElements = svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + chartDimensions.height + ")")
        .call(xAxis.tickSize(0));

    xAxisElements.selectAll("text").remove();
}

function populateLegends(peerGroupNumber) {
    d3.selectAll(".peerGroupLegendEntry .legendSquare").classed("peerGroup" + peerGroupNumber, true);
}

function renderMap(peerGroupNumber) {
    // how to scale already projected data: https://stackoverflow.com/questions/42430361/scaling-d3-v4-map-to-fit-svg-or-at-all
    var projection = d3.geoIdentity().fitSize([700, 427], topojson.feature(mapData, mapData.objects.counties));

    var path = d3.geoPath()
        .projection(projection);

    var svg = d3.select("#peerGroupMap")
        .append("svg")
        .attr("width", 700)
        .attr("height", 427);

    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(mapData, mapData.objects.counties).features)
        .enter()
        .append("path")
        .attr("class", function(d) { return d.properties.peer_group === peerGroupNumber ? "county peerGroup" + peerGroupNumber : "county"; })
        .attr("d", path);

    svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(topojson.feature(mapData, mapData.objects.states).features)
        .enter()
        .append("path")
        .attr("class", function(d) { return "state " + d.properties.state_abbv; })
        .attr("d", path);
}

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

// })();