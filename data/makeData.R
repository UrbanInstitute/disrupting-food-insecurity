library(tidyverse)
library(readxl)
library(urbnmapr)

# make metric names consistent
pg_metric_name_map <- tibble(
  original = c("Food insecure, all people", "Food insecure, children", 
               "Low-birthweight births", "People with diabetes", "People with disability", "No health insurance",
               "Housing-cost burdened", "Severely housing-cost burdened", "Wage to afford fair market rent",
               "Median household income", "Below 200% of federal poverty level", "Unemployment rate",
               "Median credit score", "Debt in collections",
               "Households with children", "Households with seniors (65+)", "People of color", "Some college or less",
               "Population in rural area"),
  label = c("food_insecure_all", "food_insecure_children",
            "low_birthweight", "diabetes", "disability", "no_insurance",
            "housing_cost_burdened", "severely_housing_cost_burdened", "wage_fair_market_rent",
            "median_income", "below_poverty", "unemployment",
            "credit_score", "debt",
            "children", "seniors", "people_color", "college_less",
            "rural_population")
)

# read in peer group average data
pg_dat <- read_excel("source/New summary table_dashMets_shortlabels.xlsx", range = c("A3:K29"))

pg <- pg_dat %>%
  filter(!is.na(`1`)) %>%
  left_join(pg_metric_name_map, by = c("Metric" = "original")) %>%
  gather(c(`1`:`10`), key = "id", value = "value") %>%
  mutate(name = "", geography = "peer_group") %>%
  select(-Metric) %>%
  spread(key = "label", value = "value") %>%
  mutate(id = as.character(id))


# read in county level data
cnty_dat <- read_excel("source/clusterdata_11-8_county data.xlsx")

cnty <- cnty_dat %>%
  select(-County, -State, -`Peer Group`, -`Limited access to healthy food`, -`Transportation costs as percent of income`,
         -`Premature deaths per 100,000 people`, -`Average unsecured debt`, -`Medical debt in collections`,
         -`Income inequality`, -`Households receiving SNAP`, -Immigrants) %>%
  rename(id = `County FIPS code`, name = `Full County Name`,
         food_insecure_all = `Food insecure, all`, food_insecure_children = `Food insecure, children`,
         low_birthweight = `Low-birthweight births`, diabetes = Diabetic, 
         disability = Disabled, no_insurance = `No health insurance`,
         housing_cost_burdened = `Housing-cost burdened`, severely_housing_cost_burdened = `Severely housing-cost burdened`, 
         wage_fair_market_rent = `Wage to afford fair market rent`,
         median_income = `Median household income`, below_poverty = `Below 200% of federal poverty level`, 
         unemployment = `Unemployment rate`,
         credit_score = `Median credit score`, debt = `Debt in collections`, 
         children = `Households with children`, seniors = `Households with seniors (65+)`, 
         people_color = `People of color`, college_less = `Some college or less`,
         rural_population = `Population in rural area`) %>%
  mutate(id = as.character(id), geography = "county")


# read in state and national level data
state_dat <- read_excel("source/state-natl.xlsx")

state <- state_dat %>%
  select(-`Limited access to healthy food`, -`Transportation costs as percent of income`,
         -`Premature deaths per 100,000 people`, -`Average unsecured debt`, -`Medical debt in collections`,
         -`Income inequality`, -`Households receiving SNAP`, -Immigrants) %>%
  rename(id = `State FIPS code`, name = State,
         food_insecure_all = `Food insecure, all`, food_insecure_children = `Food insecure, children`,
         low_birthweight = `Low-birthweight births`, diabetes = Diabetic, 
         disability = Disabled, no_insurance = `No health insurance`,
         housing_cost_burdened = `Housing-cost burdened`, severely_housing_cost_burdened = `Severely housing-cost burdened`, 
         wage_fair_market_rent = `Wage to afford fair market rent`,
         median_income = `Median household income`, below_poverty = `Below 200% of federal poverty level`, 
         unemployment = `Unemployment rate`,
         credit_score = `Median credit score`, debt = `Debt in collections`, 
         children = `Households with children`, seniors = `Households with seniors (65+)`, 
         people_color = `People of color`, college_less = `Some college or less`,
         rural_population = `Population in rural area`) %>%
  mutate(id = as.character(id),
         name = ifelse(name == "US", "US", str_to_title(name)),
         geography = ifelse(name == "US", "national", "state"))


# merge datasets together to make final dataset
chartData <- bind_rows(cnty, state, pg)
write_csv(chartData, "chart_data.csv")


# make dataset for map
mapData <- get_urbn_map("counties") %>%
  select(county_fips, county_name, state_fips, state_name, state_abbv) %>%
  distinct %>%
  left_join(cnty_dat, by = c("county_name" = "County", "state_name" = "State")) %>%
  select(county_fips, county_name, state_fips, state_name, state_abbv, peer_group = `Peer Group`)

write_csv(mapData, "map_data.csv")