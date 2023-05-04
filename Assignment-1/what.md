# Your answer for Task 1: What

## Dataset type:
This dataset is a table, containing a number of attributes of different types. The first row lists
all the possible attributes that are considered in this dataset, and below each attribute their values
are listed for each squirrel observed respectively.

## Attribute types:
These are the attribute types for five of the attributes from the dataset, as well as their ranges:
- **Age**: 
  - Describes what age the squirrel is estimated to be
  - Type: categorical (can be grouped into age groups)
  - Range: either adult, juvenile or unknown (?)
- **Date**
  - Logs at which date the squirrel was observed
  - Type: Quantitative, as a date allows computation (how many days ago, ...)
  - Range: 10062018 - 10202018 (means from 06.10.2018 - 20.10.2018)
- **Combination of highlight and primary colour**:
  - Describes which combination of fur colours was observed on that squirrel
  - Type: Combination of two categories that were specified previously (Primary Fur Colour and Highlight Fur Colour)
  - Range: Any combination of the categories in Primary Fur Colour and Highlight Fur Colour, as long as the two are different from each other
- **Unique Squirrel ID**
  - Assigns a unique number to the squirrel to identify it
  - Type: unique combination of numbers and letters
  - Range: not applicable in this case, but each ID must be unique
- **Running**
  - States whether the observed squirrel was running during the observation or not
  - Type: categorical, can be grouped into two categories
  - Range: either true (squirrel was running) or false (squirrel was not running)
