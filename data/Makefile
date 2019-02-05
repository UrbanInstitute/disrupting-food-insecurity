## Makefile for creating a US county topojson with peer group data added to each county

# add state boundaries to TopoJSON so we can plot those on the map
us_topo_final.json: us_counties-topo.json
	topomerge -k 'd.id.slice(0, 2)' states=counties < us_counties-topo.json > us_topo_final.json

# convert GeoJSON to TopoJSON and simplify and topoquantize
us_counties-topo.json: us_counties-final.ndjson
	geo2topo -n counties=us_counties-final.ndjson \
	| toposimplify -p 1 -f  \
	| topoquantize 1e5 > us_counties-topo.json

# keep only the properties we need for each county
us_counties-final.ndjson: us_counties-merged.ndjson
	ndjson-map 'd[0].properties = {county_fips: d[1].county_fips, county_name: d[1].county_name, \
		state_fips: d[1].state_fips, state_name: d[1].state_name, state_abbv: d[1].state_abbv, \
		peer_group: d[1].peer_group}, d[0]' < us_counties-merged.ndjson > us_counties-final.ndjson

# merge map data to geographic file
us_counties-merged.ndjson: us_counties-id.ndjson map_data.ndjson
	ndjson-join 'd.id' 'd.county_fips' us_counties-id.ndjson map_data.ndjson > us_counties-merged.ndjson

# convert data csv into NDJSON file
map_data.ndjson: map_data.csv
	csv2json -n < map_data.csv > map_data.ndjson

# add an ID to each county in the NDJSON file
us_counties-id.ndjson: us_counties.ndjson
	ndjson-map 'd.id = d.properties.GEOID, d' < us_counties.ndjson > us_counties-id.ndjson

# convert GeoJSON to NDJSON to prepare for merging data
us_counties.ndjson: us_counties-albers.json
	ndjson-split 'd.features' < us_counties-albers.json > us_counties.ndjson

# apply geoAlbers() projection to GeoJSON
us_counties-albers.json: us_counties.json
	geoproject 'd3.geoAlbersUsa().fitSize([750, 522], d)' < us_counties.json > us_counties-albers.json

# convert shapefile to geojson - shapefile from Census Bureau (https://www.census.gov/geo/maps-data/data/cbf/cbf_counties.html)
us_counties.json: cb_2017_us_county_500k/cb_2017_us_county_500k.shp
	shp2json cb_2017_us_county_500k/cb_2017_us_county_500k.shp -o us_counties.json