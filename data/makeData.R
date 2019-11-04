library(tidyverse)
library(readxl)
library(urbnmapr)

# map peer group numbers to names
pg_names <- tibble(
  pg_number = as.character(seq(1, 10)),
  pg_names = c("Very high food insecurity, with multidimensional risks (mostly rural)",
               "Very high food insecurity, with high housing costs",
               "High food insecurity, with economic challenges (mostly rural)",
               "High food insecurity, with the highest housing costs (mostly urban)",
               "High food insecurity, with physical health challenges (rural)",
               "Moderate food insecurity, with tenuous economic security",
               "Moderate food insecurity, with moderate resilience (more rural)",
               "Low food insecurity, with low housing costs (rural)",
               "Low food insecurity, with high resilience",
               "Low food insecurity, with high housing costs (mostly urban)")
)

# make metric names consistent
pg_metric_name_map <- tibble(
  original = c("Food insecure, all people", "Food insecure, children", 
               "Low-birthweight births", "People with diabetes", "People with disability", "No health insurance",
               "Housing-cost burdened", "Severely housing-cost burdened", "Wage to afford fair market rent",
               "Median household income", "Below 200% of federal poverty level", "Unemployment rate",
               "Median credit score", "Debt in collections",
               "Households with children", "Households with seniors (65+)", "People of color", "No college degree",
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
pg_dat <- read_excel("source/2019-02-25_summary table_unimputed_avgs-only_fmt.xlsx", 
                     sheet = "group avs_unimp_2-25_dash mets", range = c("A3:K29"))

pg <- pg_dat %>%
  filter(!is.na(`1`)) %>%
  left_join(pg_metric_name_map, by = c("Metric" = "original")) %>%
  gather(c(`1`:`10`), key = "id", value = "value") %>%
  mutate(geography = "peer_group") %>%
  select(-Metric) %>%
  spread(key = "label", value = "value") %>%
  left_join(pg_names, by = c("id" = "pg_number")) %>%
  mutate(name = pg_names) %>%
  select(id, name, everything(),-pg_names)
 # mutate(id = as.character(id))


# read in county level data
cnty_dat <- read_excel("source/2019-11-04_Walmart_county data_excl impute_CB Nlt50_fmt_ShannonCoMOfix.xlsx",
                       sheet = "cnty data_unimp_2-25_dash mets", range = c("A4:W3146"),
                       na = c("n/a*", "n/a**")) %>%
  mutate(`County Name` = replace(`County Name`, `County Name` == "District Of Columbia", "District of Columbia")) %>%
  mutate(`State Name` = replace(`State Name`, `State Name` == "District Of Columbia", "District of Columbia")) %>%
  mutate(id = str_pad(as.character(`County FIPS`), width = 5, pad = "0"))

cnty <- cnty_dat %>%
  # select(-County, -State, -`Peer Group`, -`Limited access to healthy food`, -`Transportation costs as percent of income`,
  #        -`Premature deaths per 100,000 people`, -`Average unsecured debt`, -`Medical debt in collections`,
  #        -`Income inequality`, -`Households receiving SNAP`, -Immigrants) %>%
  select(-`Peer Group Number`, -`State Name`, -`County FIPS`) %>%
  rename(name = `County Name`,
         food_insecure_all = `Food insecure, all people`, food_insecure_children = `Food insecure, children`,
         low_birthweight = `Low-birthweight births`, diabetes = `People with diabetes`, 
         disability = `People with disability`, no_insurance = `No health insurance`,
         housing_cost_burdened = `Housing-cost burdened`, severely_housing_cost_burdened = `Severely housing-cost burdened`, 
         wage_fair_market_rent = `Wage to afford fair market rent`,
         median_income = `Median household income`, below_poverty = `Below 200% of federal poverty level`, 
         unemployment = `Unemployment rate`,
         credit_score = `Median credit score`, debt = `Debt in collections`, 
         children = `Households with children`, seniors = `Households with seniors (65+)`, 
         people_color = `People of color`, college_less = `No college degree`,
         rural_population = `Population in rural area`) %>%
  select(id, everything()) %>%
  mutate(geography = "county")

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
         geography = ifelse(name == "US", "national", "state")) %>%
  mutate(name = replace(name, name == "District Of Columbia", "District of Columbia"))


# merge datasets together to make final dataset
chartData <- bind_rows(cnty, state, pg)
write_csv(chartData, "chart_data.csv")

# getRanges <- chartData %>%
#   gather(-id, -name, -geography, key = "metric", value = value) %>%
#   group_by(metric) %>%
#   summarise(min = min(value), max = max(value))
# write_csv(getRanges, "metric_ranges.csv")

# make dataset for map
mapData <- get_urbn_map("counties") %>%
  select(county_fips, county_name, state_fips, state_name, state_abbv) %>%
  distinct %>%
  left_join(cnty_dat, by = c("county_fips" = "id")) %>%
  select(county_fips, county_name = `County Name`, state_fips, state_name, state_abbv, peer_group = `Peer Group Number`)

write_csv(mapData, "map_data.csv")
