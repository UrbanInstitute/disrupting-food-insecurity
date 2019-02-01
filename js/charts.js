// (function() {
var PCTFORMAT = d3.format(".0%");
var PCTFORMATONEDECIMAL = d3.format(".1%");
var COMMAFORMAT = d3.format(",.1f");
var DOLLARFORMAT = d3.format("$,.0f");

var chartDimensions = {width_pg: 120, width_cnty: 300, height: 100, margin: {top: 20, right: 5, bottom: 40, left: 5}};

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

var dashboardData;

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

    // render peer group page charts based on group selected
    var peer_group = getQueryString("peergroup");
    renderPeerGroupPage(peer_group);

    // // initialize bottom and image download charts as grey rectangles
    // makeEquityBarChart("#equityChart", "Initial", "Initial", "Initial", toolChartDimensions);
    // makeEquityBarChart("#downloadChart", "Initial", "Initial", "Initial", toolChartDimensions);

    // window.addEventListener("resize", redraw);
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
    console.log(data);

    // update title
    var peerGroupName = data.filter(function(d) { return d.id === peer_group; })[0]["name"];
    populatePGPageTitle(peerGroupName, peer_group);

    // update bullets

    // update map

    // update bar charts and legends
    populateCharts(data);

    // update print link
}

function populateCharts(data) {
    // populateChartTitle(chartDivID, indicator);
    // populateBarTitles(chartDivID, baseGeo, compareGeo);
    makeBarChart("food_insecure_all", data);
    makeBarChart("food_insecure_children", data);
    makeBarChart("low_birthweight", data);
    makeBarChart("diabetes", data);
    makeBarChart("disability", data);
    makeBarChart("no_insurance", data);
    makeBarChart("severely_housing_cost_burdened", data);
    makeBarChart("housing_cost_burdened", data);

    // makeBarChart(chartDivID, ".comparisonLocation", "comparisonBar", compareGeo, indicator, dimensions);
    // makeBarChart(chartDivID, ".withEquity", "withEquityBar", baseGeo + "|" + compareGeo, indicator, dimensions);
    // populateDescriptiveText(chartDivID, indicator);
}

function updateEquityBarChart(chartDivID, indicator, baseGeo, compareGeo) {
    // fade opacity of chart for 1 second while it transitions
    // code from: https://stackoverflow.com/questions/2510115/jquery-can-i-call-delay-between-addclass-and-such
    $("section.tool").addClass("sectionFade").delay(700).queue(function() {
        $(this).removeClass("sectionFade").dequeue();
        // convertSvgToPng();  // also, update downloadable chart after bars have finished transitioning
    });

    populateChartTitle(chartDivID, indicator);
    populateBarTitles(chartDivID, baseGeo, compareGeo);
    updateBars(chartDivID, ".baseLocation", baseGeo, indicator);
    (compareGeo !== "customTarget") && updateBars(chartDivID, ".comparisonLocation", compareGeo, indicator);
    updateBars(chartDivID, ".withEquity", baseGeo + "|" + compareGeo, indicator);
    populateDescriptiveText(chartDivID, indicator);
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

function populateBarTitles(chartDivID, baseGeo, compareGeo) {
    d3.select(chartDivID + " h4.baseGeographyName").text(baseGeo);
    d3.select(chartDivID + " h4.comparisonGeographyName").text(compareGeo);
    d3.select(chartDivID + " span.baseGeographyName").text(baseGeo);
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
    // labelBars(chartDivID, parentClass, chartData);

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

    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", function(d) { return d.geography === "peer_group" ? "bar peerGroup" + d.id : "bar " + d.geography; })
        .attr("x", function(d) { return xScalePG(d.geography); })
        .attr("y", function(d) { return yScale(d[metric]); })
        .attr("height", function(d) { return yScale(0) - yScale(d[metric]); })
        .attr("width", xScalePG.bandwidth());

    var xAxisElements = svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + chartDimensions.height + ")")
        .call(xAxis.tickSize(0));

    xAxisElements.selectAll("text").remove();

    var labels = svg.selectAll(".barLabel")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "barLabel")
        .attr("x", function(d) { return xScalePG(d.geography) + xScalePG.bandwidth()/2; })
        .attr("y", function(d) { return yScale(d[metric]) - 5; })
        .text(function(d) { return COMMAFORMAT(d[metric]); });
}

function labelBars(chartDivID, parentClass, data) {
    var indicator = data[0].indicator;

    // labelling for positive non-binary indicators
    if(nonbinaryIndicators.indexOf(indicator) > -1 && negativeIndicators.indexOf(indicator) === -1) {
        d3.selectAll(chartDivID + " " + parentClass + " .barLabel").classed("hidden", true);

        if(parentClass === ".withEquity") {
            // Gap = Focus area denominator * ( Target proportion - Focus proportion )
            d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(DOLLARFORMAT(data[0].yes + data[0].diff));

            // need to clear the other labels so they don't throw off the collision calculations
            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line1").text("");
            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line2").text("");
            d3.selectAll(chartDivID + " " + parentClass + " g.no text.barLabel.line1").text("");
            d3.selectAll(chartDivID + " " + parentClass + " g.no text.barLabel.line2").text("");

            d3.selectAll(chartDivID + " " + parentClass + " g.diff .barLabel").classed("hidden", false);
            d3.selectAll(chartDivID + " " + parentClass + " g.diff text.barLabel.line1").text(DOLLARFORMAT(data[0].denom * data[0].diff));
            d3.selectAll(chartDivID + " " + parentClass + " g.diff text.barLabel.line2").text(data[0].diff_bar_label);
        }
        else {
            d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(DOLLARFORMAT(data[0].yes));

            // label blue bars only
            d3.selectAll(chartDivID + " " + parentClass + " .yes .barLabel").classed("hidden", false);
            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line1").text(DOLLARFORMAT(data[0].yes));
            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line2").text(data[0].blue_bar_label);
        }
    }
    // labelling for negative non-binary indicators
    else if(nonbinaryIndicators.indexOf(indicator) > -1 && negativeIndicators.indexOf(indicator) > -1) {
        d3.selectAll(chartDivID + " " + parentClass + " .barLabel").classed("hidden", true);

        if(parentClass === ".withEquity") {
            d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(COMMAFORMAT(data[0].yes));

            // need to clear the other labels so they don't throw off the collision calculations
            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line1").text("");
            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line2").text("");
            d3.selectAll(chartDivID + " " + parentClass + " g.no text.barLabel.line1").text("");
            d3.selectAll(chartDivID + " " + parentClass + " g.no text.barLabel.line2").text("");

            d3.selectAll(chartDivID + " " + parentClass + " g.diff .barLabel").classed("hidden", false);
            d3.selectAll(chartDivID + " " + parentClass + " g.diff text.barLabel.line1").text(COMMAFORMAT(data[0].denom * data[0].diff/1000));
            d3.selectAll(chartDivID + " " + parentClass + " g.diff text.barLabel.line2").text(data[0].diff_bar_label);
        }
        else {
            d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(COMMAFORMAT(data[0].yes));

            // label blue bars only
            d3.selectAll(chartDivID + " " + parentClass + " .yes .barLabel").classed("hidden", false);
            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line1").text(COMMAFORMAT(data[0].yes));
            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line2").text(data[0].blue_bar_label);
        }
    }
    // labeling for negative binary indicators
    else if(nonbinaryIndicators.indexOf(indicator) === -1 && negativeIndicators.indexOf(indicator) > -1) {
        d3.selectAll(chartDivID + " " + parentClass + " .barLabel").classed("hidden", false);

        d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line1").text(COMMAFORMAT(data[0].numerator));
        d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line2").text(data[0].blue_bar_label);
        d3.selectAll(chartDivID + " " + parentClass + " g.no text.barLabel.line1").text(COMMAFORMAT(data[0].denom));
        d3.selectAll(chartDivID + " " + parentClass + " g.no text.barLabel.line2").text(data[0].grey_bar_label);

        if(parentClass === ".withEquity") {
            indicator === "Unemployment" ? d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(PCTFORMATONEDECIMAL(data[0].yes)) : d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(PCTFORMAT(data[0].yes));

            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line1").text(COMMAFORMAT(data[0].numerator));
            d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line2").text(data[0].blue_bar_label);
            d3.selectAll(chartDivID + " " + parentClass + " g.diff text.barLabel.line1").text(COMMAFORMAT(data[0].denom * data[0].diff));
            d3.selectAll(chartDivID + " " + parentClass + " g.diff text.barLabel.line2").text(data[0].diff_bar_label);
        }
        else {
            indicator === "Unemployment" ? d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(PCTFORMATONEDECIMAL(data[0].yes)) : d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(PCTFORMAT(data[0].yes));
        }
    }
    // labelling for positive binary indicators
    else {
        d3.selectAll(chartDivID + " " + parentClass + " .barLabel").classed("hidden", false);

        d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line1").text(COMMAFORMAT(data[0].numerator));
        d3.selectAll(chartDivID + " " + parentClass + " g.yes text.barLabel.line2").text(data[0].blue_bar_label);
        d3.selectAll(chartDivID + " " + parentClass + " g.no text.barLabel.line1").text(COMMAFORMAT(data[0].denom));
        d3.selectAll(chartDivID + " " + parentClass + " g.no text.barLabel.line2").text(data[0].grey_bar_label);

        if(parentClass === ".withEquity") {
            d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(PCTFORMAT(data[0].yes + data[0].diff));

            d3.selectAll(chartDivID + " " + parentClass + " g.diff text.barLabel.line1").text(COMMAFORMAT(data[0].denom * data[0].diff));
            d3.selectAll(chartDivID + " " + parentClass + " g.diff text.barLabel.line2").text(data[0].diff_bar_label);
        }
        else {
            d3.select(chartDivID + " " + parentClass + " div.equityNumber").text(PCTFORMAT(data[0].yes));
        }
    }
}

function adjustLabels(chartDivID, parentClass, indicator) {
    if(chartDivID !== "#exampleEquityChart") {
        // reset label heights and text-alignment so it doesn't throw off the collision detection calculations
        d3.selectAll(chartDivID + " " + parentClass + " line")
            .attr("y2", toolChartDimensions.height + 4);

        d3.selectAll(chartDivID + " " + parentClass + " .barLabel.line1")
            .attr("y", toolChartDimensions.height + 19)
            .classed("rightJustified", false)
            .classed("leftJustified", false);

        d3.selectAll(chartDivID + " " + parentClass + " .barLabel.line2")
            .attr("y", toolChartDimensions.height + 33)
            .classed("rightJustified", false)
            .classed("leftJustified", false);
    }

    // only need to do collision detection for binary indicators since the non-binary ones only have one label per chart
    if(nonbinaryIndicators.indexOf(indicator) === -1){
        var blueRectBoundingRect = d3.select(chartDivID + " " + parentClass + " .yes rect").node().getBoundingClientRect();
        var yesLabelBoundingRect = d3.select(chartDivID + " " + parentClass + " .yes g.labelTextGrp").node().getBoundingClientRect();
        var noLabelBoundingRect = d3.select(chartDivID + " " + parentClass + " .no g.labelTextGrp").node().getBoundingClientRect();
        var diffLabelBoundingRect = (parentClass === ".withEquity") && d3.select(chartDivID + " " + parentClass + " .diff g.labelTextGrp").node().getBoundingClientRect();

        // console.log(chartDivID, parentClass);
        // console.log("Yes Label with width:", yesLabelBoundingRect.right);
        // console.log("No Label:", noLabelBoundingRect.left);
        // console.log(diffLabelBoundingRect);
        // console.log(diffLabelBoundingRect.width + diffLabelBoundingRect.x > noLabelBoundingRect.x);

        // if label for blue and grey bars overlap, adjust the text alignment of the labels
        if(yesLabelBoundingRect.right + 5 > noLabelBoundingRect.left) {
            d3.selectAll(chartDivID + " " + parentClass + " .yes text.barLabel").classed("rightJustified", true);
            d3.selectAll(chartDivID + " " + parentClass + " .no text.barLabel").classed("leftJustified", true);

            // check if labels are still overlapping - if so, move the one for the blue bar down
            var newYesLabelBoundingRect = d3.select(chartDivID + " " + parentClass + " .yes g.labelTextGrp").node().getBoundingClientRect();
            var newNoLabelBoundingRect = d3.select(chartDivID + " " + parentClass + " .no g.labelTextGrp").node().getBoundingClientRect();

            if(newYesLabelBoundingRect.right + 2 > newNoLabelBoundingRect.left) {
                d3.select(chartDivID + " " + parentClass + " .yes line.barLabel")
                    // .transition()
                    .attr("y2", toolChartDimensions.height + 34);

                d3.select(chartDivID + " " + parentClass + " .yes text.barLabel.line1")
                    // .transition()
                    .attr("y", toolChartDimensions.height + 49);

                d3.select(chartDivID + " " + parentClass + " .yes text.barLabel.line2")
                    // .transition()
                    .attr("y", toolChartDimensions.height + 63);
            }
        }
        else {
            d3.selectAll(chartDivID + " " + parentClass + " .yes text.barLabel").classed("rightJustified", false);
            d3.selectAll(chartDivID + " " + parentClass + " .no text.barLabel").classed("leftJustified", false);
        }

        // if blue or yellow/pink label too close to bar baseline, left-justify the label (and move blue one down if needed)
        if(yesLabelBoundingRect.left < blueRectBoundingRect.left) {
            d3.selectAll(chartDivID + " " + parentClass + " .yes text.barLabel").classed("leftJustified", true);
            yesLabelBoundingRect = d3.select(chartDivID + " " + parentClass + " .yes g.labelTextGrp").node().getBoundingClientRect();  // update position of blue bar label
        }

        // if label for yellow/pink bar overlaps either of the grey or blue labels, shift the label down
        if(diffLabelBoundingRect && (((negativeIndicators.indexOf(indicator) === -1) && (yesLabelBoundingRect.right > diffLabelBoundingRect.left)) || ((negativeIndicators.indexOf(indicator) > -1) && (diffLabelBoundingRect.right > yesLabelBoundingRect.left)) || (diffLabelBoundingRect.right > noLabelBoundingRect.left))) {
            // if yellow bar label overlaps the blue label, right-justify the blue label for non-negative indicators
            if(yesLabelBoundingRect.right > diffLabelBoundingRect.left && negativeIndicators.indexOf(indicator) === -1) {
                d3.selectAll(chartDivID + " " + parentClass + " .yes text.barLabel").classed("rightJustified", true);
            }

            // if pink bar label overlaps the blue label, left-justify the blue label for negative indicators
            if(diffLabelBoundingRect.right > yesLabelBoundingRect.left && negativeIndicators.indexOf(indicator) > -1) {
                d3.selectAll(chartDivID + " " + parentClass + " .yes text.barLabel").classed("leftJustified", true);
            }

            // if yellow/pink bar label overlaps the grey label, left-justify the grey label
            if(diffLabelBoundingRect.right > noLabelBoundingRect.left) {
                d3.selectAll(chartDivID + " " + parentClass + " .no text.barLabel").classed("leftJustified", true);
            }

            // if the blue label is left-justified (i.e., is near the bar baseline), move the blue label down beneath the yellow/pink label
            if(d3.select(chartDivID + " " + parentClass + " .yes text.barLabel.line1").classed("leftJustified")) {
                d3.select(chartDivID + " " + parentClass + " .yes line.barLabel")
                    // .transition()
                    .attr("y2", toolChartDimensions.height + 34);

                d3.select(chartDivID + " " + parentClass + " .yes text.barLabel.line1")
                    // .transition()
                    .attr("y", toolChartDimensions.height + 49);

                d3.select(chartDivID + " " + parentClass + " .yes text.barLabel.line2")
                    // .transition()
                    .attr("y", toolChartDimensions.height + 63);
            }
            // otherwise, move the yellow/pink label down
            else {
                d3.select(chartDivID + " " + parentClass + " .diff line.barLabel")
                    // .transition()
                    .attr("y2", toolChartDimensions.height + 34);

                d3.select(chartDivID + " " + parentClass + " .diff text.barLabel.line1")
                    // .transition()
                    .attr("y", toolChartDimensions.height + 49);

                d3.select(chartDivID + " " + parentClass + " .diff text.barLabel.line2")
                    // .transition()
                    .attr("y", toolChartDimensions.height + 63);
            }
        }
    }
}

function updateBars(chartDivID, parentClass, geo, indicator) {
    var data = getData(parentClass, geo, indicator);

    // update scales
    if(negativeIndicators.indexOf(indicator) > -1) {
        colorScale.range(["#1696d2", "#d2d2d2", "#ec008b"]);
    }
    else {
        colorScale.range(["#1696d2", "#d2d2d2", "#fdbf11"]);
    }

    if(nonbinaryIndicators.indexOf(indicator) > -1) {
        xScale.domain([0, d3.max(equityData, function(d) { return d.indicator === indicator && d.value; })]);
    }
    else {
        xScale.domain([0, 1]);
    }

    // first update labels
    labelBars(chartDivID, parentClass, data);

    // then transition bars
    var slices = d3.selectAll(chartDivID + " " + parentClass + " .serie")
        .data(stack.keys(categories)(data).filter(function(d) { return !isNaN(d[0][1]); }))
        .style("fill", function(d) { return colorScale(d.key); })
        .style("stroke", function(d) { return colorScale(d.key); });

    // remove transition for download chart image so that IE doesn't capture the canvas mid-transition
    if(chartDivID === "#downloadChart") {
        slices.selectAll("rect")
            .data(function(d) { return d; })
            .attr("x", function(d) { return xScale(d[0]); })
            .attr("width", function(d) { return xScale(d[1]) - xScale(d[0]); });

        if(negativeIndicators.indexOf(indicator) > -1 && parentClass === ".withEquity") {
            if(nonbinaryIndicators.indexOf(indicator) > -1) {
                slices.selectAll(".labelTextGrp")
                    .data(function(d) { return d; })
                    .attr("transform", function(d) { return "translate(" + (xScale(d[0])) + ",0)"; });
            }
            else {
                slices.selectAll(".labelTextGrp")
                    .data(function(d) { return d; })
                    .attr("transform", function(d) { if(d[0] === 0 ) { return "translate(" + (xScale(d.data.yes + d.data.diff) - 1) + ",0)"; }
                                              else if(d[1] === 1) { return "translate(" + (xScale(d[1]) - 1) + ",0)"; }
                                              else { return "translate(" + (xScale(d[0])) + ",0)"; } });
            }
        }
        else {
            slices.selectAll(".labelTextGrp")
                .data(function(d) { return d; })
                .attr("transform", function(d) { return "translate(" + (xScale(d[1]) - 1) + ",0)"; });
        }
    }
    else {
        slices.selectAll("rect")
            .data(function(d) { return d; })
            .transition()
            .delay(300)
            .duration(500)
            .attr("x", function(d) { return xScale(d[0]); })
            .attr("width", function(d) { return xScale(d[1]) - xScale(d[0]); });

        // finally, adjust label positions based on type of indicator:
        // postive indicators will have all labels be at the end of the bar
        // negative binary indicators should have the blue label be positioned where the base geo's value is, the pink label should be at the start of the pink bar,
        //      and the grey label should be at the end
        // negative non-binary indicators only need to have a label for the pink bar at the start of the pink bar so can transition all of the labels
        //      to be at the start of the bars since the others will be hidden anyways
        if(negativeIndicators.indexOf(indicator) > -1 && parentClass === ".withEquity") {
            if(nonbinaryIndicators.indexOf(indicator) > -1) {
                slices.selectAll(".labelTextGrp")
                    .data(function(d) { return d; })
                    .transition()  // collision detection doesn't work well with transitions
                    .delay(300)
                    .duration(500)
                    .attr("transform", function(d) { return "translate(" + (xScale(d[0])) + ",0)"; })
                    .on("end", function() { adjustLabels(chartDivID, parentClass, indicator); });
            }
            else {
                slices.selectAll(".labelTextGrp")
                    .data(function(d) { return d; })
                    .transition()
                    .delay(300)
                    .duration(500)
                    .attr("transform", function(d) { if(d[0] === 0 ) { return "translate(" + (xScale(d.data.yes + d.data.diff) - 1) + ",0)"; }
                                              else if(d[1] === 1) { return "translate(" + (xScale(d[1]) - 1) + ",0)"; }
                                              else { return "translate(" + (xScale(d[0])) + ",0)"; } })
                    .on("end", function() { adjustLabels(chartDivID, parentClass, indicator); });
            }
        }
        else {
            slices.selectAll(".labelTextGrp")
                .data(function(d) { return d; })
                .transition()
                .delay(300)
                .duration(500)
                .attr("transform", function(d) { return "translate(" + (xScale(d[1]) - 1) + ",0)"; })
                .on("end", function() { adjustLabels(chartDivID, parentClass, indicator); });
        }
    }

    // if there is no equity gap, hide the third bar chart
    if(parentClass === ".withEquity" && data[0].diff <=0) {
        d3.select(chartDivID + " .withEquity").classed("noEquityGap", true);
    }
    else {
        d3.select(chartDivID + " .withEquity").classed("noEquityGap", false);
    }

    if(parentClass === ".withEquity") {
        populateEquityStatement(chartDivID, indicator, data);
    }
}

function populateEquityStatement(chartDivID, indicator, data) {
    var diffNumber = COMMAFORMAT(data[0].diff * data[0].denom);
    if(indicator === "Small-business lending") {
        diffNumber = DOLLARFORMAT(data[0].denom * data[0].diff);
    }
    else if(nonbinaryIndicators.indexOf(indicator) > -1 && negativeIndicators.indexOf(indicator) > -1) {
        diffNumber = COMMAFORMAT(data[0].denom * data[0].diff / 1000);
    }

    // console.log(data);

    if(indicator === "Initial") {
        d3.select(chartDivID + " .equitySentence").text();
    }
    else if(customGoal === 1) {
        // error handling to catch invalid user-entered goals
        if(nonbinaryIndicators.indexOf(indicator) === -1 && (getUserGoal() > 100 || getUserGoal() < 0)) {  // user can't enter > 100% for binary indicators
            d3.select(chartDivID + " .equitySentence").text("Invalid entry. Please enter a number between 0 and 100.");
            d3.select(chartDivID + " .equitySentence").classed("noGap", true);
            d3.select(chartDivID + " .withEquity").classed("noEquityGap", true);
        }
        else if(nonbinaryIndicators.indexOf(indicator) > -1 && getUserGoal() < 0) {
            d3.select(chartDivID + " .equitySentence").text("Invalid entry. Please enter a number above 0.");
            d3.select(chartDivID + " .equitySentence").classed("noGap", true);
            d3.select(chartDivID + " .withEquity").classed("noEquityGap", true);
        }
        else if(data[0].diff <= 0) {
            d3.select(chartDivID + " .equitySentence").text(addAnd(data[0].geo) + " has met or exceeded that goal.");
            d3.select(chartDivID + " .equitySentence").classed("noGap", true);
        }
        else {
            (indicator === "Violent crime") && d3.select(chartDivID + " .equitySentence").html("If this goal is met, <span class='highlight'>" + addAnd(data[0].geo) + " would have " + diffNumber + " fewer violent crimes.</span>");
            (indicator !== "Violent crime") && d3.select(chartDivID + " .equitySentence").html("If this goal is met, <span class='highlight'>" + diffNumber + " " + data[0].sentence + "</span>");
            d3.select(chartDivID + " .equitySentence").classed("noGap", false);
        }
    }
    else if(customGoal === 0) {
        // handle no gap or reverse-gap situation
        if(data[0].diff === 0) {
            if(nonbinaryIndicators.indexOf(indicator) > -1) {
                if(Math.abs(data[0].actual_diff) <= 1) {
                    d3.select(chartDivID + " .equitySentence").text(addAnd(data[0].geo) + " has no equity gap with " + addAnd(data[0].compareGeo) + ".");
                    d3.select(chartDivID + " .equitySentence").classed("noGap", true);
                }
                else if(data[0].actual_diff < -1) {
                    d3.select(chartDivID + " .equitySentence").text(data[0].sentence + " " + addAnd(data[0].compareGeo) + ".");
                    d3.select(chartDivID + " .equitySentence").classed("noGap", true);
                }
            }
            else if(nonbinaryIndicators.indexOf(indicator) === -1) {
                if(Math.abs(data[0].actual_diff) <= 0.005) {
                    d3.select(chartDivID + " .equitySentence").text(addAnd(data[0].geo) + " has no equity gap with " + addAnd(data[0].compareGeo) + ".");
                    d3.select(chartDivID + " .equitySentence").classed("noGap", true);
                }
                else if(data[0].actual_diff < -0.005) {
                    d3.select(chartDivID + " .equitySentence").text(data[0].sentence + " " + addAnd(data[0].compareGeo) + ".");
                    d3.select(chartDivID + " .equitySentence").classed("noGap", true);
                }
            }
        }
        // handle equity gap situation
        else {
            (indicator === "Violent crime") && d3.select(chartDivID + " .equitySentence").html("If we closed this equity gap, <span class='highlight'>" + addAnd(data[0].geo) + " would have " + diffNumber + " fewer violent crimes.</span>");
            (indicator !== "Violent crime") && d3.select(chartDivID + " .equitySentence").html("If we closed this equity gap, <span class='highlight'>" + diffNumber + " " + data[0].sentence + "</span>");
            d3.select(chartDivID + " .equitySentence").classed("noGap", false);
        }
    }
    else {
        d3.select(chartDivID + " .equitySentence").text("Invalid entry.");
        d3.select(chartDivID + " .equitySentence").classed("noGap", true);
        d3.select(chartDivID + " .withEquity").classed("noEquityGap", true);
    }
}

function populateDescriptiveText(chartDivID, indicator) {
    if(chartDivID === "#equityChart") {
        var full_name = equityData.filter(function(d) { return d.indicator === indicator; })[0].indicator_full_name;
        d3.select(".indicatorDescriptiveText").html(indicator_text[full_name]);
    }
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